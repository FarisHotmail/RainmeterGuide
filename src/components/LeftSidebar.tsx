import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Clock,
  CloudSun,
  Copy,
  Cpu,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  Lock,
  Music,
  Plus,
  Search,
  Trash2,
  Unlock,
} from 'lucide-react';
import { MEASURE_CATALOG, METER_CATALOG } from '../data/presets';
import { WIDGET_LIBRARY, WidgetCategory } from '../data/widgetLibrary';
import { SkinMeasure, SkinMeter, SkinProject, SkinVariable } from '../types/rainmeter';

export type ToolboxTab = 'widgets' | 'primitives' | 'layers' | 'data';

interface LeftSidebarProps {
  project: SkinProject;
  activeTab: ToolboxTab;
  onTabChange: (tab: ToolboxTab) => void;
  selectedMeterId: string | null;
  selectedMeasureId: string | null;
  onSelectMeter: (id: string | null) => void;
  onSelectMeasure: (id: string | null) => void;
  onAddWidgetFromLibrary: (widgetId: string) => void;
  onAddMeterFromCatalog: (type: string) => void;
  onAddMeasureFromCatalog: (type: string) => void;
  onToggleMeterVisibility: (id: string) => void;
  onToggleMeterLock: (id: string) => void;
  onMoveMeterOrder: (id: string, direction: 'up' | 'down') => void;
  onDuplicateMeter: (id: string) => void;
  onDeleteMeter: (id: string) => void;
  onDeleteMeasure: (id: string) => void;
  onAddVariable: (variable: Omit<SkinVariable, 'id'>) => void;
  onUpdateVariable: (id: string, patch: Partial<SkinVariable>) => void;
  onDeleteVariable: (id: string) => void;
}

const WIDGET_CATEGORIES: Array<{ id: 'Tümü' | WidgetCategory; label: string }> = [
  { id: 'Tümü', label: 'Tümü' },
  { id: 'Saat & Tarih', label: 'Saat & Tarih' },
  { id: 'Sistem Bilgileri', label: 'Sistem' },
  { id: 'Hava Durumu', label: 'Hava' },
  { id: 'Müzik Oynatıcı', label: 'Müzik' },
];

function getWidgetCategoryIcon(category: WidgetCategory) {
  switch (category) {
    case 'Saat & Tarih':
      return <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0" />;
    case 'Sistem Bilgileri':
      return <Cpu className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
    case 'Hava Durumu':
      return <CloudSun className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    case 'Müzik Oynatıcı':
      return <Music className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
  }
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  project,
  activeTab,
  onTabChange,
  selectedMeterId,
  selectedMeasureId,
  onSelectMeter,
  onSelectMeasure,
  onAddWidgetFromLibrary,
  onAddMeterFromCatalog,
  onAddMeasureFromCatalog,
  onToggleMeterVisibility,
  onToggleMeterLock,
  onMoveMeterOrder,
  onDuplicateMeter,
  onDeleteMeter,
  onDeleteMeasure,
  onAddVariable,
  onUpdateVariable,
  onDeleteVariable,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [widgetCategoryFilter, setWidgetCategoryFilter] = useState<'Tümü' | WidgetCategory>('Tümü');
  const [dataSubView, setDataSubView] = useState<'measures' | 'variables'>('measures');

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'Görsel & Metin': true,
    'Grafik & Gösterge': true,
    'Etkileşim & Medya': true,
    'Sistem & Donanım': true,
    'Zaman & Mantık': false,
    'Medya & Eklenti': false,
  });

  const [newVarKey, setNewVarKey] = useState('');
  const [newVarVal, setNewVarVal] = useState('');

  const toggleGroup = (g: string) =>
    setOpenGroups((prev) => ({ ...prev, [g]: !prev[g] }));

  const q = searchQuery.trim().toLowerCase();

  const filteredWidgets = WIDGET_LIBRARY.filter((w) => {
    const matchesCat = widgetCategoryFilter === 'Tümü' || w.category === widgetCategoryFilter;
    const matchesQuery =
      !q ||
      w.title.toLowerCase().includes(q) ||
      w.subtitle.toLowerCase().includes(q) ||
      w.category.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  const filteredMeters = METER_CATALOG.filter(
    (m) =>
      !q ||
      m.title.toLowerCase().includes(q) ||
      m.subtitle.toLowerCase().includes(q) ||
      m.type.toLowerCase().includes(q)
  );

  const filteredMeasures = MEASURE_CATALOG.filter(
    (m) =>
      !q ||
      m.title.toLowerCase().includes(q) ||
      m.subtitle.toLowerCase().includes(q) ||
      m.type.toLowerCase().includes(q)
  );

  const meterCategories = ['Görsel & Metin', 'Grafik & Gösterge', 'Etkileşim & Medya'] as const;
  const measureCategories = ['Sistem & Donanım', 'Zaman & Mantık', 'Medya & Eklenti'] as const;

  return (
    <aside
      aria-label="Araç Kutusu ve Katman Gezgini"
      className="w-76 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 select-none"
    >
      {/* Optimized 4-Tab Studio Toolbox Switcher */}
      <div className="p-2 border-b border-slate-200 dark:border-slate-800 grid grid-cols-4 gap-1 bg-slate-50 dark:bg-slate-950/60">
        {(
          [
            { id: 'widgets', label: 'Hazır Blok' },
            { id: 'primitives', label: 'Atomik' },
            { id: 'layers', label: `Katman·${project.meters.length}` },
            { id: 'data', label: `Veri·${project.measures.length}` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`px-1.5 py-1.5 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 text-center cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Unified Search Bar for Widgets & Primitives */}
      {(activeTab === 'widgets' || activeTab === 'primitives') && (
        <div className="px-3 pt-2.5 pb-2 border-b border-slate-200 dark:border-slate-800 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              aria-label="Bileşen veya hazır blok ara"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'widgets'
                  ? 'Saat, hava durumu, müzik, CPU ara...'
                  : 'Meter veya Measure ara (Roundline, Bar)...'
              }
              className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          {activeTab === 'widgets' && (
            <div
              role="group"
              aria-label="Hazır bileşen kategorisi"
              className="flex items-center gap-1 overflow-x-auto pb-0.5"
            >
              {WIDGET_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setWidgetCategoryFilter(cat.id)}
                  className={`px-2 py-1 text-[11px] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    widgetCategoryFilter === cat.id
                      ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scrollable Toolbox Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* TAB 1: PRE-DESIGNED COMPOSITE WIDGET LIBRARY */}
        {activeTab === 'widgets' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Tuvale sürükleyin veya + ile ekleyin</span>
              <span className="font-mono tabular-nums">{filteredWidgets.length} blok</span>
            </div>

            {filteredWidgets.length === 0 ? (
              <div className="p-5 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-500">
                Aramanızla eşleşen hazır bileşen bulunamadı.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredWidgets.map((widget) => (
                  <div
                    key={widget.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/raincraft-widget', widget.id);
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className="group p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 hover:border-sky-500/60 dark:hover:border-sky-500/50 transition-colors cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <GripVertical className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-400 shrink-0" />
                        {getWidgetCategoryIcon(widget.category)}
                        <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {widget.title}
                        </h3>
                      </div>

                      <button
                        type="button"
                        aria-label={`${widget.title} hazır bileşenini ekle`}
                        onClick={() => onAddWidgetFromLibrary(widget.id)}
                        className="px-2 py-1 text-[11px] font-semibold rounded bg-sky-500/15 text-sky-600 dark:text-sky-300 hover:bg-sky-500 hover:text-slate-950 flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        Ekle
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-1.5 pl-5">
                      {widget.subtitle}
                    </p>

                    <div className="mt-2 pl-5 flex items-center justify-between gap-2 text-[10px] font-mono tabular-nums text-slate-400 whitespace-nowrap">
                      <span className="truncate">
                        {widget.category} · {widget.defaultSize.w}×{widget.defaultSize.h}px
                      </span>
                      <span className="text-sky-500 dark:text-sky-400 shrink-0">
                        {widget.previewBadge}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ATOMIC METERS & MEASURES CATALOG */}
        {activeTab === 'primitives' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Görsel Katmanlar (Meters)
                </h2>
                <span className="text-[11px] text-slate-400 font-mono tabular-nums">10 tür</span>
              </div>

              {meterCategories.map((cat) => {
                const items = filteredMeters.filter((i) => i.category === cat);
                if (items.length === 0) return null;
                const isOpen = openGroups[cat] !== false;

                return (
                  <div
                    key={cat}
                    className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleGroup(cat)}
                      aria-expanded={isOpen}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    >
                      <span>{cat}</span>
                      {isOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                        {items.map((item) => (
                          <div
                            key={item.type}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('application/raincraft-meter', item.type);
                              e.dataTransfer.effectAllowed = 'copy';
                            }}
                            className="p-2.5 flex items-start justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-grab active:cursor-grabbing transition-colors"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
                                  {item.title}
                                </span>
                                <a
                                  href={item.docsUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-label={`${item.type} resmi Rainmeter dokümantasyonu`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-slate-400 hover:text-sky-500"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                                {item.subtitle}
                              </p>
                            </div>

                            <button
                              type="button"
                              aria-label={`${item.title} bileşenini tuvale ekle`}
                              onClick={() => onAddMeterFromCatalog(item.type)}
                              className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-sky-500 hover:text-slate-950 transition-colors shrink-0 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Veri Kaynakları (Measures)
                </h2>
                <span className="text-[11px] text-slate-400 font-mono tabular-nums">14 tür</span>
              </div>

              {measureCategories.map((cat) => {
                const items = filteredMeasures.filter((i) => i.category === cat);
                if (items.length === 0) return null;
                const isOpen = openGroups[cat] !== false;

                return (
                  <div
                    key={cat}
                    className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleGroup(cat)}
                      aria-expanded={isOpen}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    >
                      <span>{cat}</span>
                      {isOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                        {items.map((item) => (
                          <div
                            key={item.type}
                            className="p-2.5 flex items-start justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <div className="min-w-0">
                              <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
                                {item.title}
                              </span>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                                {item.subtitle}
                              </p>
                            </div>

                            <button
                              type="button"
                              aria-label={`${item.title} veri kaynağını ekle`}
                              onClick={() => onAddMeasureFromCatalog(item.type)}
                              className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-sky-500 hover:text-slate-950 transition-colors shrink-0 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: LAYERS Z-ORDER TREE */}
        {activeTab === 'layers' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Çizim Sırası (Z-Order)
              </span>
              <span className="text-[11px] text-slate-400">Alttaki üstte görünür</span>
            </div>

            {project.meters.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-lg">
                <p className="text-xs text-slate-500">Henüz görsel katman yok.</p>
                <button
                  type="button"
                  onClick={() => onTabChange('widgets')}
                  className="mt-2 px-3 py-1.5 text-xs font-semibold rounded-md bg-sky-500 text-slate-950"
                >
                  Hazır Blok Ekle
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {project.meters.map((meter: SkinMeter, idx: number) => {
                  const isSel = selectedMeterId === meter.id;
                  return (
                    <div
                      key={meter.id}
                      onClick={() => onSelectMeter(meter.id)}
                      className={`px-2.5 py-2 rounded-lg border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                        isSel
                          ? 'bg-sky-500/10 border-sky-500/50 text-slate-900 dark:text-slate-100'
                          : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium truncate">{meter.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                          {meter.type} · {meter.x},{meter.y}
                        </div>
                      </div>

                      <div
                        className="flex items-center gap-0.5 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          aria-label={`${meter.name} yukarı taşı`}
                          disabled={idx === 0}
                          onClick={() => onMoveMeterOrder(meter.id, 'up')}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          aria-label={`${meter.name} aşağı taşı`}
                          disabled={idx === project.meters.length - 1}
                          onClick={() => onMoveMeterOrder(meter.id, 'down')}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          aria-label={`${meter.name} görünürlük değiştir`}
                          onClick={() => onToggleMeterVisibility(meter.id)}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
                        >
                          {meter.hidden ? (
                            <EyeOff className="w-3 h-3 text-amber-500" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          type="button"
                          aria-label={`${meter.name} kilitle veya aç`}
                          onClick={() => onToggleMeterLock(meter.id)}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
                        >
                          {meter.locked ? (
                            <Lock className="w-3 h-3 text-amber-500" />
                          ) : (
                            <Unlock className="w-3 h-3 opacity-60" />
                          )}
                        </button>
                        <button
                          type="button"
                          aria-label={`${meter.name} çoğalt`}
                          onClick={() => onDuplicateMeter(meter.id)}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          aria-label={`${meter.name} sil`}
                          onClick={() => onDeleteMeter(meter.id)}
                          className="p-1 rounded hover:bg-rose-500/15 text-rose-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DATA SOURCES (MEASURES) & [VARIABLES] */}
        {activeTab === 'data' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDataSubView('measures')}
                className={`py-1 text-xs font-medium rounded-md transition-colors ${
                  dataSubView === 'measures'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Measures ({project.measures.length})
              </button>
              <button
                type="button"
                onClick={() => setDataSubView('variables')}
                className={`py-1 text-xs font-medium rounded-md transition-colors ${
                  dataSubView === 'variables'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Variables ({project.variables.length})
              </button>
            </div>

            {dataSubView === 'measures' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Aktif Veri Kaynakları
                  </span>
                  <button
                    type="button"
                    onClick={() => onTabChange('primitives')}
                    className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    + Measure Ekle
                  </button>
                </div>

                {project.measures.map((m: SkinMeasure) => {
                  const isSel = selectedMeasureId === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => onSelectMeasure(m.id)}
                      className={`px-3 py-2 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                        isSel
                          ? 'bg-sky-500/10 border-sky-500/50 text-slate-900 dark:text-slate-100'
                          : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate">[{m.name}]</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          Measure={m.type}
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label={`${m.name} veri kaynağını sil`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteMeasure(m.id);
                        }}
                        className="p-1 rounded hover:bg-rose-500/15 text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newVarKey.trim()) return;
                    onAddVariable({
                      key: newVarKey.trim().replace(/[^A-Za-z0-9_]/g, ''),
                      value: newVarVal.trim() || '255,255,255,255',
                      category: /^\d+\s*,/.test(newVarVal) ? 'Color' : 'Custom',
                    });
                    setNewVarKey('');
                    setNewVarVal('');
                  }}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
                >
                  <input
                    type="text"
                    aria-label="Yeni değişken adı"
                    placeholder="Değişken adı (ör. PrimaryGlow)"
                    value={newVarKey}
                    onChange={(e) => setNewVarKey(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                  />
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      aria-label="Yeni değişken değeri"
                      placeholder="Değer (ör. 56,189,248,255)"
                      value={newVarVal}
                      onChange={(e) => setNewVarVal(e.target.value)}
                      className="flex-1 min-w-0 px-2.5 py-1.5 text-xs font-mono rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs font-semibold rounded bg-sky-500 text-slate-950 hover:bg-sky-400 shrink-0"
                    >
                      Ekle
                    </button>
                  </div>
                </form>

                <div className="space-y-2">
                  {project.variables.map((v) => (
                    <div
                      key={v.id}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-semibold text-sky-600 dark:text-sky-400">
                          #{v.key}#
                        </span>
                        <button
                          type="button"
                          aria-label={`${v.key} değişkenini sil`}
                          onClick={() => onDeleteVariable(v.id)}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        aria-label={`${v.key} değeri`}
                        value={v.value}
                        onChange={(e) => onUpdateVariable(v.id, { value: e.target.value })}
                        className="w-full px-2 py-1 text-xs font-mono tabular-nums rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
