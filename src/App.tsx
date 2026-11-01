import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Code2,
  Columns2,
  Download,
  Info,
  Moon,
  PenTool,
  Redo2,
  Settings,
  Sun,
  Undo2,
} from 'lucide-react';
import { IniCodePane } from './components/IniCodePane';
import { LeftSidebar, ToolboxTab } from './components/LeftSidebar';
import { LiveCanvas } from './components/LiveCanvas';
import { PackageExportModal } from './components/PackageExportModal';
import { DocsReferenceModal, PresetsModal } from './components/PresetsAndDocsModals';
import { RightInspector } from './components/RightInspector';
import { MEASURE_CATALOG, METER_CATALOG, PRESET_SKINS, PresetSkinBundle } from './data/presets';
import { WIDGET_LIBRARY } from './data/widgetLibrary';
import {
  RainmeterSettings,
  SimulatedTelemetry,
  SkinMeasure,
  SkinMetadata,
  SkinMeter,
  SkinProject,
  SkinVariable,
} from './types/rainmeter';
import { parseIniToSkin } from './utils/iniEngine';
import { buildVariableMap, evaluateMeasures } from './utils/simulationEngine';

const STORAGE_KEY = 'raincraft_studio_project_v1';

interface FeedbackToast {
  id: number;
  message: string;
  tone: 'success' | 'info' | 'warning';
}

function createInitialTelemetry(): SimulatedTelemetry {
  return {
    timestamp: new Date(),
    cpuTotal: 28,
    cpuCores: [24, 34, 19, 31, 26, 29, 22, 38],
    ramPercent: 54,
    ramUsedGB: 8.6,
    ramTotalGB: 16,
    swapPercent: 18,
    diskFreePercent: 58,
    diskUsedPercent: 42,
    diskFreeGB: 290,
    diskTotalGB: 500,
    netInKbps: 3840,
    netOutKbps: 820,
    uptimeSeconds: 19420,
    batteryPercent: 86,
    acPower: 1,
    recycleCount: 7,
    recycleSizeMB: 164,
    audioRms: 0.58,
    audioBands: [0.42, 0.76, 0.61, 0.85, 0.52, 0.68, 0.39, 0.31],
    nowPlaying: {
      title: 'Northern Lights',
      artist: 'Kiasmos & Olafur',
      album: 'Blurred',
      durationSec: 258,
      positionSec: 112,
      state: 1,
      coverType: 'prism',
    },
    weatherTempC: 18,
    weatherCondition: 'Açık · Parçalı Bulutlu',
    historyCpu: [18, 22, 25, 29, 24, 31, 35, 28, 26, 30, 33, 27, 29, 24, 28, 32, 30, 26, 29, 28],
    historyRam: [51, 51, 52, 52, 53, 53, 53, 54, 54, 54, 54, 55, 54, 54, 54, 54, 53, 54, 54, 54],
    historyNetIn: [1200, 1800, 2600, 4100, 3900, 5200, 4800, 3200, 2900, 3600, 4400, 5100, 4600, 3800, 4100, 3900, 4500, 4200, 3700, 3840],
    historyNetOut: [420, 510, 600, 790, 680, 910, 840, 720, 640, 700, 810, 880, 760, 790, 830, 800, 850, 780, 810, 820],
    manualOverride: false,
  };
}

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [workspaceMode, setWorkspaceMode] = useState<'visual' | 'split' | 'code'>('split');
  const [leftTab, setLeftTab] = useState<ToolboxTab>('widgets');

  const [project, setProject] = useState<SkinProject>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SkinProject;
        if (parsed && Array.isArray(parsed.meters) && Array.isArray(parsed.measures)) {
          return parsed;
        }
      }
    } catch {
      // Fallback to default preset
    }
    return structuredClone(PRESET_SKINS[0].project);
  });

  // Undo / Redo History Stacks
  const [pastProjects, setPastProjects] = useState<SkinProject[]>([]);
  const [futureProjects, setFutureProjects] = useState<SkinProject[]>([]);

  const [selectedMeterId, setSelectedMeterId] = useState<string | null>(
    () => project.meters[1]?.id ?? project.meters[0]?.id ?? null
  );
  const [selectedMeasureId, setSelectedMeasureId] = useState<string | null>(null);
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<string[]>([]);
  const [toast, setToast] = useState<FeedbackToast | null>(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);

  const [telemetry, setTelemetry] = useState<SimulatedTelemetry>(createInitialTelemetry);
  const [isSimPaused, setIsSimPaused] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const notify = useCallback(
    (message: string, tone: FeedbackToast['tone'] = 'success') => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      setToast({ id: Date.now(), message, tone });
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 2400);
    },
    []
  );

  const flashAddedMeters = useCallback((ids: string[]) => {
    setRecentlyAddedIds(ids);
    window.setTimeout(() => {
      setRecentlyAddedIds([]);
    }, 1100);
  }, []);

  const commitProjectChange = useCallback(
    (updater: (prev: SkinProject) => SkinProject) => {
      setProject((prev) => {
        const next = updater(prev);
        setPastProjects((h) => [...h.slice(-24), prev]);
        setFutureProjects([]);
        return next;
      });
    },
    []
  );

  const handleUndo = useCallback(() => {
    setPastProjects((past) => {
      if (past.length === 0) return past;
      const previous = past[past.length - 1];
      setProject((curr) => {
        setFutureProjects((f) => [curr, ...f.slice(0, 24)]);
        return previous;
      });
      notify('Son işlem geri alındı', 'info');
      return past.slice(0, -1);
    });
  }, [notify]);

  const handleRedo = useCallback(() => {
    setFutureProjects((future) => {
      if (future.length === 0) return future;
      const [next, ...rest] = future;
      setProject((curr) => {
        setPastProjects((p) => [...p.slice(-24), curr]);
        return next;
      });
      notify('İşlem yeniden uygulandı', 'info');
      return rest;
    });
  }, [notify]);

  // Global keyboard shortcuts for Undo (Ctrl+Z) & Redo (Ctrl+Y / Ctrl+Shift+Z)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo]);

  // Sync HTML dark class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Persist project changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch {
      // Ignore storage quota issues
    }
  }, [project]);

  // Real-time simulated Rainmeter telemetry tick (1000ms)
  useEffect(() => {
    if (isSimPaused) return;
    const timer = window.setInterval(() => {
      setTelemetry((prev) => {
        const now = new Date();
        if (prev.manualOverride) {
          return {
            ...prev,
            timestamp: now,
            uptimeSeconds: prev.uptimeSeconds + 1,
            historyCpu: [...prev.historyCpu.slice(1), prev.cpuTotal],
            historyRam: [...prev.historyRam.slice(1), prev.ramPercent],
          };
        }

        const t = now.getTime() / 1000;
        const nextCpu = Math.max(8, Math.min(94, 30 + Math.sin(t * 0.7) * 18 + Math.cos(t * 1.9) * 8));
        const nextRam = Math.max(35, Math.min(88, 56 + Math.sin(t * 0.2) * 5));
        const nextNetIn = Math.max(350, Math.round(3800 + Math.sin(t * 1.1) * 2200 + Math.cos(t * 2.3) * 900));
        const nextNetOut = Math.max(120, Math.round(850 + Math.cos(t * 0.9) * 420));
        const nextPos = (prev.nowPlaying.positionSec + 1) % prev.nowPlaying.durationSec;
        const nextBands = prev.audioBands.map((_, idx) =>
          Number(
            Math.max(
              0.15,
              Math.min(0.98, 0.5 + Math.sin(t * (2.1 + idx * 0.6) + idx) * 0.38)
            ).toFixed(2)
          )
        );

        return {
          ...prev,
          timestamp: now,
          cpuTotal: nextCpu,
          cpuCores: prev.cpuCores.map((c, idx) =>
            Math.max(5, Math.min(98, c + Math.sin(t + idx) * 4))
          ),
          ramPercent: nextRam,
          netInKbps: nextNetIn,
          netOutKbps: nextNetOut,
          uptimeSeconds: prev.uptimeSeconds + 1,
          audioRms: Number((0.45 + Math.abs(Math.sin(t * 1.8)) * 0.4).toFixed(2)),
          audioBands: nextBands,
          nowPlaying: {
            ...prev.nowPlaying,
            positionSec: nextPos,
          },
          historyCpu: [...prev.historyCpu.slice(1), nextCpu],
          historyRam: [...prev.historyRam.slice(1), nextRam],
          historyNetIn: [...prev.historyNetIn.slice(1), nextNetIn],
          historyNetOut: [...prev.historyNetOut.slice(1), nextNetOut],
        };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isSimPaused]);

  const evaluatedMeasures = useMemo(() => {
    const varMap = buildVariableMap(project.variables);
    return evaluateMeasures(project.measures, telemetry, varMap);
  }, [project.measures, project.variables, telemetry]);

  const selectedMeter = useMemo(
    () => project.meters.find((m) => m.id === selectedMeterId) || null,
    [project.meters, selectedMeterId]
  );

  const selectedMeasure = useMemo(
    () => project.measures.find((m) => m.id === selectedMeasureId) || null,
    [project.measures, selectedMeasureId]
  );

  const handleSelectMeter = (id: string | null) => {
    setSelectedMeterId(id);
    if (id) setSelectedMeasureId(null);
  };

  const handleSelectMeasure = (id: string | null) => {
    setSelectedMeasureId(id);
    if (id) setSelectedMeterId(null);
  };

  // Add Pre-Designed Composite Widget Block (Clocks, Dates, System, Weather, Music)
  const handleAddWidgetBlueprint = (widgetId: string, customX?: number, customY?: number) => {
    const blueprint = WIDGET_LIBRARY.find((w) => w.id === widgetId);
    if (!blueprint) return;

    const uid = String(Date.now()).slice(-4);
    commitProjectChange((prev) => {
      const isFullBgMeter = (m: SkinMeter) =>
        m.type === 'Shape' &&
        m.x === 0 &&
        m.y === 0 &&
        m.w >= prev.rainmeter.SkinWidth - 4 &&
        m.h >= prev.rainmeter.SkinHeight - 4;

      const foregroundMeters = prev.meters.filter((m) => !isFullBgMeter(m));
      const lowestBottom =
        foregroundMeters.length > 0
          ? Math.max(...foregroundMeters.map((m) => m.y + m.h))
          : 8;

      const anchorX = customX ?? 20;
      const anchorY = customY ?? (foregroundMeters.length > 0 ? lowestBottom + 16 : 20);
      const inst = blueprint.instantiate(anchorX, anchorY, uid);

      // Expand skin canvas (and any full-bleed background card) automatically if widget exceeds bounds
      const maxRight = Math.max(
        prev.rainmeter.SkinWidth,
        anchorX + blueprint.defaultSize.w + 20
      );
      const maxBottom = Math.max(
        prev.rainmeter.SkinHeight,
        anchorY + blueprint.defaultSize.h + 20
      );

      const resizedExistingMeters = prev.meters.map((m) =>
        isFullBgMeter(m) ? { ...m, w: maxRight, h: maxBottom } : m
      );

      const firstMeterId = inst.meters[0]?.id ?? null;
      setSelectedMeterId(firstMeterId);
      setSelectedMeasureId(null);
      flashAddedMeters(inst.meters.map((m) => m.id));

      return {
        ...prev,
        rainmeter: {
          ...prev.rainmeter,
          SkinWidth: maxRight,
          SkinHeight: maxBottom,
        },
        measures: [...prev.measures, ...inst.measures],
        meters: [...resizedExistingMeters, ...inst.meters],
      };
    });

    notify(`"${blueprint.title}" bileşen bloğu tuvale eklendi`, 'success');
  };

  const handleAddMeterAtPosition = (meterType: string, customX?: number, customY?: number) => {
    const catalogEntry = METER_CATALOG.find((c) => c.type === meterType);
    if (!catalogEntry) return;

    commitProjectChange((prev) => {
      const nextIndex = prev.meters.length + 1;
      const { meter, autoMeasure } = catalogEntry.createDefault(nextIndex, prev.measures);
      if (customX !== undefined) meter.x = customX;
      if (customY !== undefined) meter.y = customY;

      let safeName = meter.name;
      let suffix = 1;
      while (prev.meters.some((m) => m.name === safeName)) {
        safeName = `${meter.name}_${suffix++}`;
      }
      meter.name = safeName;

      const updatedMeasures = autoMeasure ? [...prev.measures, autoMeasure] : prev.measures;
      setSelectedMeterId(meter.id);
      setSelectedMeasureId(null);
      flashAddedMeters([meter.id]);

      return {
        ...prev,
        measures: updatedMeasures,
        meters: [...prev.meters, meter],
      };
    });

    notify(`${catalogEntry.title} katmanı eklendi`, 'success');
  };

  const handleAddMeasure = (measureType: string) => {
    const entry = MEASURE_CATALOG.find((c) => c.type === measureType);
    if (!entry) return;

    commitProjectChange((prev) => {
      const nextIdx = prev.measures.length + 1;
      const created = entry.createDefault(nextIdx);
      let safeName = created.name;
      let suffix = 1;
      while (prev.measures.some((m) => m.name === safeName)) {
        safeName = `${created.name}_${suffix++}`;
      }
      created.name = safeName;

      setSelectedMeasureId(created.id);
      setSelectedMeterId(null);
      setLeftTab('data');
      return {
        ...prev,
        measures: [...prev.measures, created],
      };
    });

    notify(`${entry.title} veri kaynağı eklendi`, 'success');
  };

  const handleUpdateMeter = (id: string, patch: Partial<SkinMeter>) => {
    setProject((prev) => ({
      ...prev,
      meters: prev.meters.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  };

  const handleUpdateMeasure = (id: string, patch: Partial<SkinMeasure>) => {
    setProject((prev) => {
      const oldMeasure = prev.measures.find((m) => m.id === id);
      const nextMeasures = prev.measures.map((m) => (m.id === id ? { ...m, ...patch } : m));
      const nextMeters =
        oldMeasure && patch.name && patch.name !== oldMeasure.name
          ? prev.meters.map((mt) => ({
              ...mt,
              measureName: mt.measureName === oldMeasure.name ? patch.name : mt.measureName,
              measureName2: mt.measureName2 === oldMeasure.name ? patch.name : mt.measureName2,
            }))
          : prev.meters;

      return {
        ...prev,
        measures: nextMeasures,
        meters: nextMeters,
      };
    });
  };

  const handleToggleMeterVisibility = (id: string) => {
    commitProjectChange((prev) => ({
      ...prev,
      meters: prev.meters.map((m) => (m.id === id ? { ...m, hidden: !m.hidden } : m)),
    }));
  };

  const handleToggleMeterLock = (id: string) => {
    commitProjectChange((prev) => ({
      ...prev,
      meters: prev.meters.map((m) => (m.id === id ? { ...m, locked: !m.locked } : m)),
    }));
  };

  const handleMoveMeterOrder = (id: string, direction: 'up' | 'down') => {
    commitProjectChange((prev) => {
      const idx = prev.meters.findIndex((m) => m.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.meters.length) return prev;
      const copy = [...prev.meters];
      const [moved] = copy.splice(idx, 1);
      copy.splice(targetIdx, 0, moved);
      return { ...prev, meters: copy };
    });
  };

  const handleDuplicateMeter = (id: string) => {
    commitProjectChange((prev) => {
      const orig = prev.meters.find((m) => m.id === id);
      if (!orig) return prev;
      const dup: SkinMeter = {
        ...structuredClone(orig),
        id: `mtr_dup_${Date.now()}`,
        name: `${orig.name}Copy`,
        x: orig.x + 16,
        y: orig.y + 16,
      };
      setSelectedMeterId(dup.id);
      flashAddedMeters([dup.id]);
      return {
        ...prev,
        meters: [...prev.meters, dup],
      };
    });
    notify('Katman kopyalandı', 'info');
  };

  const handleDeleteMeter = (id: string) => {
    const target = project.meters.find((m) => m.id === id);
    commitProjectChange((prev) => ({
      ...prev,
      meters: prev.meters.filter((m) => m.id !== id),
    }));
    if (selectedMeterId === id) setSelectedMeterId(null);
    if (target) notify(`${target.name} silindi`, 'info');
  };

  const handleDeleteMeasure = (id: string) => {
    const target = project.measures.find((m) => m.id === id);
    commitProjectChange((prev) => ({
      ...prev,
      measures: prev.measures.filter((m) => m.id !== id),
    }));
    if (selectedMeasureId === id) setSelectedMeasureId(null);
    if (target) notify(`[${target.name}] silindi`, 'info');
  };

  const handleAddVariable = (v: Omit<SkinVariable, 'id'>) => {
    commitProjectChange((prev) => ({
      ...prev,
      variables: [...prev.variables, { ...v, id: `var_${Date.now()}` }],
    }));
    notify(`#${v.key}# değişkeni tanımlandı`, 'success');
  };

  const handleUpdateVariable = (id: string, patch: Partial<SkinVariable>) => {
    setProject((prev) => ({
      ...prev,
      variables: prev.variables.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    }));
  };

  const handleDeleteVariable = (id: string) => {
    commitProjectChange((prev) => ({
      ...prev,
      variables: prev.variables.filter((v) => v.id !== id),
    }));
    notify('Değişken kaldırıldı', 'info');
  };

  const handleUpdateSettings = (patch: Partial<RainmeterSettings>) => {
    setProject((prev) => ({
      ...prev,
      rainmeter: { ...prev.rainmeter, ...patch },
    }));
  };

  const handleUpdateMetadata = (patch: Partial<SkinMetadata>) => {
    setProject((prev) => ({
      ...prev,
      metadata: { ...prev.metadata, ...patch },
    }));
  };

  const handleUpdateFileNames = (folderName: string, fileName: string) => {
    setProject((prev) => ({
      ...prev,
      folderName,
      fileName,
    }));
  };

  const handleLoadPreset = (preset: PresetSkinBundle) => {
    const cloned = structuredClone(preset.project);
    commitProjectChange(() => cloned);
    setSelectedMeterId(cloned.meters[1]?.id ?? cloned.meters[0]?.id ?? null);
    setSelectedMeasureId(null);
    notify(`"${preset.title}" şablonu yüklendi`, 'success');
  };

  const handleCreateBlank = () => {
    const blank: SkinProject = {
      id: `blank_${Date.now()}`,
      folderName: 'YeniTema',
      fileName: 'Kabuk.ini',
      metadata: {
        Name: 'Yeni Rainmeter Kabuğu',
        Author: 'RainCraft Kullanıcısı',
        Information: 'RainCraft Studio ile oluşturuldu',
        Version: '1.0.0',
        License: 'MIT',
      },
      rainmeter: {
        Update: 1000,
        AccurateText: true,
        DynamicWindowSize: true,
        BackgroundMode: 1,
        SolidColor: '0,0,0,1',
        BlurEnabled: false,
        BlurType: 'None',
        SkinWidth: 420,
        SkinHeight: 260,
        Draggable: true,
        SnapEdges: true,
        ClickThrough: false,
        KeepOnScreen: true,
        OnRefreshAction: '',
        ContextTitle: '',
        ContextAction: '',
      },
      variables: [
        { id: 'vb_1', key: 'AccentColor', value: '56,189,248,255', category: 'Color' },
        { id: 'vb_2', key: 'FontMain', value: 'Plus Jakarta Sans', category: 'Font' },
      ],
      measures: [],
      meters: [],
    };
    commitProjectChange(() => blank);
    setSelectedMeterId(null);
    setSelectedMeasureId(null);
    setLeftTab('widgets');
    notify('Yeni boş kabuk tuvali hazırlandı', 'success');
  };

  const handleImportIniFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseIniToSkin(text, project);
    parsed.fileName = file.name.endsWith('.ini') ? file.name : `${file.name}.ini`;
    commitProjectChange(() => parsed);
    setSelectedMeterId(parsed.meters[0]?.id ?? null);
    notify(`${parsed.fileName} başarıyla içe aktarıldı`, 'success');
    e.target.value = '';
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Simplified 3-Zone Top Navigation Bar */}
      <header className="h-14 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-8 shrink-0">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#studio"
          onClick={(e) => e.preventDefault()}
          className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0"
        >
          RainCraft Studio
        </a>

        {/* Zone 2: Simplified Concise 3-Item Primary Menu */}
        <nav
          aria-label="Ana menü"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          <button
            type="button"
            onClick={() => setIsPresetsModalOpen(true)}
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Şablonlar
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            .INI İçe Aktar
          </button>
          <button
            type="button"
            onClick={() => setIsDocsModalOpen(true)}
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Kılavuz
          </button>
        </nav>

        {/* Zone 3: Primary Export Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-sky-500 hover:bg-sky-400 active:scale-[0.98] text-slate-950 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Paketi İndir (.rmskin)
          </button>
        </div>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept=".ini,.inc,.txt"
        onChange={handleImportIniFile}
        className="hidden"
      />

      {/* Non-Intrusive Action Feedback Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-slate-900/95 dark:bg-slate-800/95 text-white border border-sky-500/40 shadow-xl flex items-center gap-2 text-xs font-medium pointer-events-none"
        >
          {toast.tone === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-sky-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Studio Workspace Control Strip */}
      <div className="h-10 px-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between gap-4 shrink-0">
        {/* Left: Active Skin Summary + Undo/Redo + Quick Skin Settings Button */}
        <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 min-w-0">
          <div className="flex items-center gap-0.5 mr-1">
            <button
              type="button"
              onClick={handleUndo}
              disabled={pastProjects.length === 0}
              aria-label="Geri al"
              title="Geri Al (Ctrl+Z)"
              className="p-1.5 rounded hover:bg-slate-200/80 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={futureProjects.length === 0}
              aria-label="İleri al"
              title="İleri Al (Ctrl+Y)"
              className="p-1.5 rounded hover:bg-slate-200/80 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors cursor-pointer"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="font-semibold text-slate-900 dark:text-slate-200 truncate">
            {project.metadata.Name}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums whitespace-nowrap">
            {project.meters.length} Katman
          </span>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => {
              setSelectedMeterId(null);
              setSelectedMeasureId(null);
            }}
            className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-sky-500 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Settings className="w-3 h-3" />
            Pencere Ayarları
          </button>
        </div>

        {/* Center: Visual / Split / Code Mode Switcher */}
        <div
          role="group"
          aria-label="Çalışma alanı görünüm modu"
          className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-200/75 dark:bg-slate-800"
        >
          <button
            type="button"
            onClick={() => setWorkspaceMode('visual')}
            className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              workspaceMode === 'visual'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            Görsel Tasarım
          </button>

          <button
            type="button"
            onClick={() => setWorkspaceMode('split')}
            className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              workspaceMode === 'split'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            Bölünmüş Stüdyo
          </button>

          <button
            type="button"
            onClick={() => setWorkspaceMode('code')}
            className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              workspaceMode === 'code'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Canlı .INI Editörü
          </button>
        </div>

        {/* Right: Light / Dark Theme Switch */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setDarkMode((d) => !d)}
            aria-label={darkMode ? 'Açık temaya geç' : 'Koyu temaya geç'}
            className="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{darkMode ? 'Açık Mod' : 'Koyu Mod'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Workspace */}
      <main className="flex-1 flex min-h-0 overflow-hidden">
        <LeftSidebar
          project={project}
          activeTab={leftTab}
          onTabChange={setLeftTab}
          selectedMeterId={selectedMeterId}
          selectedMeasureId={selectedMeasureId}
          onSelectMeter={handleSelectMeter}
          onSelectMeasure={handleSelectMeasure}
          onAddWidgetFromLibrary={(widgetId) => handleAddWidgetBlueprint(widgetId)}
          onAddMeterFromCatalog={(type) => handleAddMeterAtPosition(type)}
          onAddMeasureFromCatalog={handleAddMeasure}
          onToggleMeterVisibility={handleToggleMeterVisibility}
          onToggleMeterLock={handleToggleMeterLock}
          onMoveMeterOrder={handleMoveMeterOrder}
          onDuplicateMeter={handleDuplicateMeter}
          onDeleteMeter={handleDeleteMeter}
          onDeleteMeasure={handleDeleteMeasure}
          onAddVariable={handleAddVariable}
          onUpdateVariable={handleUpdateVariable}
          onDeleteVariable={handleDeleteVariable}
        />

        {/* Center Viewport */}
        <div className="flex-1 flex min-w-0 overflow-hidden">
          {(workspaceMode === 'visual' || workspaceMode === 'split') && (
            <LiveCanvas
              project={project}
              isSplitMode={workspaceMode === 'split'}
              selectedMeterId={selectedMeterId}
              recentlyAddedIds={recentlyAddedIds}
              onSelectMeter={handleSelectMeter}
              onUpdateMeterGeometry={(id, patch) => handleUpdateMeter(id, patch)}
              onDropCatalogMeter={(type, x, y) => handleAddMeterAtPosition(type, x, y)}
              onDropWidgetBlueprint={(widgetId, x, y) =>
                handleAddWidgetBlueprint(widgetId, x, y)
              }
              evaluatedMeasures={evaluatedMeasures}
              telemetry={telemetry}
              isSimPaused={isSimPaused}
              onToggleSimPause={() => setIsSimPaused((p) => !p)}
              onUpdateTelemetryManual={(patch) =>
                setTelemetry((prev) => ({ ...prev, ...patch }))
              }
            />
          )}

          {(workspaceMode === 'split' || workspaceMode === 'code') && (
            <IniCodePane
              project={project}
              isSplitMode={workspaceMode === 'split'}
              onApplyParsedProject={(updated) => setProject(updated)}
              onNotify={notify}
            />
          )}
        </div>

        <RightInspector
          project={project}
          selectedMeter={selectedMeter}
          selectedMeasure={selectedMeasure}
          onUpdateMeter={handleUpdateMeter}
          onUpdateMeasure={handleUpdateMeasure}
          onUpdateSettings={handleUpdateSettings}
          onUpdateMetadata={handleUpdateMetadata}
          onUpdateFileNames={handleUpdateFileNames}
        />
      </main>

      {/* Modals */}
      <PackageExportModal
        project={project}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      <PresetsModal
        isOpen={isPresetsModalOpen}
        currentProjectId={project.id}
        onSelectPreset={handleLoadPreset}
        onCreateBlank={handleCreateBlank}
        onClose={() => setIsPresetsModalOpen(false)}
      />

      <DocsReferenceModal
        isOpen={isDocsModalOpen}
        onClose={() => setIsDocsModalOpen(false)}
      />
    </div>
  );
}
