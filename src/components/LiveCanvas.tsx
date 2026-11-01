import React, { useRef, useState } from 'react';
import {
  Eye,
  Grid,
  Image as ImageIcon,
  Lock,
  Maximize2,
  MousePointer2,
  Pause,
  Play,
  Sliders,
} from 'lucide-react';
import albumPrismImg from '../assets/images/album_cover_synthwave_1793559791055.jpg';
import wallpaperNordicImg from '../assets/images/wallpaper_nordic_mountain_1793559788602.jpg';
import wallpaperConcreteImg from '../assets/images/wallpaper_studio_concrete_1793559790669.jpg';
import { SimulatedTelemetry, SkinMeter, SkinProject } from '../types/rainmeter';
import { rainmeterColorToCss, resolveRainmeterVariables } from '../utils/colorUtils';
import {
  buildVariableMap,
  EvaluatedMeasureValue,
  evaluateMeterText,
} from '../utils/simulationEngine';

interface LiveCanvasProps {
  project: SkinProject;
  isSplitMode?: boolean;
  selectedMeterId: string | null;
  recentlyAddedIds?: string[];
  onSelectMeter: (id: string | null) => void;
  onUpdateMeterGeometry: (id: string, patch: Partial<Pick<SkinMeter, 'x' | 'y' | 'w' | 'h'>>) => void;
  onDropCatalogMeter: (meterType: string, x: number, y: number) => void;
  onDropWidgetBlueprint?: (widgetId: string, x: number, y: number) => void;
  evaluatedMeasures: Record<string, EvaluatedMeasureValue>;
  telemetry: SimulatedTelemetry;
  isSimPaused: boolean;
  onToggleSimPause: () => void;
  onUpdateTelemetryManual: (patch: Partial<SimulatedTelemetry>) => void;
}

type WallpaperChoice = 'nordic' | 'concrete' | 'slate';

export const LiveCanvas: React.FC<LiveCanvasProps> = ({
  project,
  isSplitMode = false,
  selectedMeterId,
  recentlyAddedIds = [],
  onSelectMeter,
  onUpdateMeterGeometry,
  onDropCatalogMeter,
  onDropWidgetBlueprint,
  evaluatedMeasures,
  telemetry,
  isSimPaused,
  onToggleSimPause,
  onUpdateTelemetryManual,
}) => {
  const [wallpaper, setWallpaper] = useState<WallpaperChoice>('nordic');
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [previewOnlyMode, setPreviewOnlyMode] = useState<boolean>(false);
  const [showSimDrawer, setShowSimDrawer] = useState<boolean>(false);
  const [canvasScale, setCanvasScale] = useState<number>(isSplitMode ? 0.88 : 1);
  const [isDragOverCanvas, setIsDragOverCanvas] = useState<boolean>(false);
  const [lastActionNotice, setLastActionNotice] = useState<string | null>(null);

  React.useEffect(() => {
    setCanvasScale(isSplitMode ? 0.88 : 1);
  }, [isSplitMode]);

  const skinBoxRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    mode: 'move' | 'resize';
    meterId: string;
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
  } | null>(null);

  const varMap = buildVariableMap(project.variables);

  const snapVal = (v: number) => (snapToGrid ? Math.round(v / 4) * 4 : Math.round(v));

  const handlePointerDownMeter = (
    e: React.PointerEvent,
    meter: SkinMeter,
    mode: 'move' | 'resize'
  ) => {
    e.stopPropagation();
    if (previewOnlyMode) {
      if (meter.leftMouseUpAction || meter.buttonCommand) {
        const bang = meter.leftMouseUpAction || meter.buttonCommand || '';
        setLastActionNotice(`${meter.name} tetiklendi: ${bang}`);
        setTimeout(() => setLastActionNotice(null), 2600);
      }
      return;
    }
    onSelectMeter(meter.id);
    if (meter.locked) return;

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragStateRef.current = {
      mode,
      meterId: meter.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: meter.x,
      origY: meter.y,
      origW: meter.w,
      origH: meter.h,
    };
  };

  const handlePointerMoveMeter = (e: React.PointerEvent) => {
    const st = dragStateRef.current;
    if (!st) return;
    const dx = (e.clientX - st.startClientX) / canvasScale;
    const dy = (e.clientY - st.startClientY) / canvasScale;

    if (st.mode === 'move') {
      onUpdateMeterGeometry(st.meterId, {
        x: Math.max(-100, snapVal(st.origX + dx)),
        y: Math.max(-100, snapVal(st.origY + dy)),
      });
    } else {
      onUpdateMeterGeometry(st.meterId, {
        w: Math.max(12, snapVal(st.origW + dx)),
        h: Math.max(8, snapVal(st.origH + dy)),
      });
    }
  };

  const handlePointerUpMeter = (e: React.PointerEvent) => {
    if (dragStateRef.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if already released
      }
      dragStateRef.current = null;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragOverCanvas) setIsDragOverCanvas(true);
  };

  const handleDragLeave = () => {
    setIsDragOverCanvas(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverCanvas(false);
    if (!skinBoxRef.current) return;

    const rect = skinBoxRef.current.getBoundingClientRect();
    const rawX = (e.clientX - rect.left) / canvasScale;
    const rawY = (e.clientY - rect.top) / canvasScale;
    const dropX = snapVal(Math.max(0, rawX - 32));
    const dropY = snapVal(Math.max(0, rawY - 16));

    const widgetId = e.dataTransfer.getData('application/raincraft-widget');
    if (widgetId && onDropWidgetBlueprint) {
      onDropWidgetBlueprint(widgetId, dropX, dropY);
      return;
    }

    const meterType = e.dataTransfer.getData('application/raincraft-meter');
    if (meterType) {
      onDropCatalogMeter(meterType, dropX, dropY);
    }
  };

  const getHistorySeries = (measureName?: string): number[] => {
    if (!measureName) return telemetry.historyCpu;
    const m = project.measures.find((item) => item.name === measureName);
    if (!m) return telemetry.historyCpu;
    if (m.type === 'Memory') return telemetry.historyRam;
    if (m.type === 'NetIn' || m.type === 'NetTotal') return telemetry.historyNetIn.map((v) => Math.min(100, (v / 10240) * 100));
    if (m.type === 'NetOut') return telemetry.historyNetOut.map((v) => Math.min(100, (v / 5000) * 100));
    return telemetry.historyCpu;
  };

  const renderMeterVisual = (meter: SkinMeter) => {
    if (meter.hidden) return null;

    const boundMeasure = meter.measureName ? evaluatedMeasures[meter.measureName] : undefined;
    const ratio = boundMeasure ? boundMeasure.scaleRatio : 0.45;
    const bgSolid =
      meter.solidColor && meter.type !== 'Shape' && meter.type !== 'Bar'
        ? rainmeterColorToCss(meter.solidColor, varMap, 'transparent')
        : 'transparent';

    switch (meter.type) {
      case 'Shape': {
        const fill = rainmeterColorToCss(meter.shapeFillColor, varMap, 'rgba(15,23,42,0.85)');
        const stroke = rainmeterColorToCss(meter.shapeStrokeColor, varMap, 'rgba(148,163,184,0.22)');
        const sw = meter.shapeStrokeWidth ?? 1;
        const cr = meter.shapeCornerRadius ?? 12;

        if (meter.shapeType === 'Ellipse') {
          return (
            <svg width={meter.w} height={meter.h} className="block overflow-visible">
              <ellipse
                cx={meter.w / 2}
                cy={meter.h / 2}
                rx={Math.max(1, meter.w / 2 - sw)}
                ry={Math.max(1, meter.h / 2 - sw)}
                fill={fill}
                stroke={stroke}
                strokeWidth={sw}
              />
            </svg>
          );
        }
        if (meter.shapeType === 'Line') {
          return (
            <svg width={meter.w} height={meter.h} className="block overflow-visible">
              <line
                x1={0}
                y1={meter.h / 2}
                x2={meter.w}
                y2={meter.h / 2}
                stroke={fill}
                strokeWidth={Math.max(1, sw)}
              />
            </svg>
          );
        }
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: fill,
              borderRadius: `${cr}px`,
              border: sw > 0 ? `${sw}px solid ${stroke}` : 'none',
              backdropFilter: 'blur(12px)',
            }}
          />
        );
      }

      case 'String': {
        const displayStr = evaluateMeterText(meter, evaluatedMeasures, varMap);
        const fontColor = rainmeterColorToCss(meter.fontColor, varMap, '#f8fafc');
        const fontSize = meter.fontSize ?? 14;
        const fontFace = resolveRainmeterVariables(meter.fontFace || 'Plus Jakarta Sans', varMap);
        const align = meter.stringAlign || 'Left';

        let textAlign: React.CSSProperties['textAlign'] = 'left';
        let transformX = '0%';
        if (align.includes('Center')) {
          textAlign = 'center';
          transformX = '-50%';
        } else if (align.includes('Right')) {
          textAlign = 'right';
          transformX = '-100%';
        }

        const isBold = meter.stringStyle === 'Bold' || meter.stringStyle === 'BoldItalic' || (meter.fontWeight ?? 400) >= 600;
        const isItalic = meter.stringStyle === 'Italic' || meter.stringStyle === 'BoldItalic';

        return (
          <div
            className="select-none whitespace-nowrap tabular-nums"
            style={{
              backgroundColor: bgSolid,
              color: fontColor,
              fontSize: `${fontSize}px`,
              fontFamily: `"${fontFace}", var(--font-sans)`,
              fontWeight: meter.fontWeight ?? (isBold ? 700 : 400),
              fontStyle: isItalic ? 'italic' : 'normal',
              textAlign,
              lineHeight: 1.2,
              transform: `translateX(${transformX}) ${meter.angle ? `rotate(${meter.angle}deg)` : ''}`,
              textShadow:
                meter.stringEffect === 'Shadow'
                  ? `1px 2px 4px ${rainmeterColorToCss(meter.fontEffectColor, varMap, 'rgba(0,0,0,0.65)')}`
                  : undefined,
            }}
          >
            {displayStr || meter.name}
          </div>
        );
      }

      case 'Bar': {
        const barColor = rainmeterColorToCss(meter.barColor, varMap, '#38bdf8');
        const trackColor = rainmeterColorToCss(meter.solidColor, varMap, 'rgba(30,41,59,0.85)');
        const isVert = meter.barOrientation === 'Vertical';
        const pct = Math.round(ratio * 100);

        return (
          <div
            className="w-full h-full rounded-full overflow-hidden flex"
            style={{
              backgroundColor: trackColor,
              flexDirection: isVert ? 'column-reverse' : 'row',
            }}
          >
            <div
              className="transition-all duration-150 rounded-full"
              style={{
                backgroundColor: barColor,
                width: isVert ? '100%' : `${pct}%`,
                height: isVert ? `${pct}%` : '100%',
              }}
            />
          </div>
        );
      }

      case 'Roundline': {
        const size = Math.min(meter.w, meter.h);
        const strokeW = meter.lineWidth ?? 6;
        const radius = Math.max(6, size / 2 - strokeW / 2 - 2);
        const circumference = 2 * Math.PI * radius;
        const sweepDeg = meter.rotationAngle ?? 360;
        const maxArc = circumference * (Math.abs(sweepDeg) / 360);
        const dashOffset = circumference - maxArc * ratio;
        const startDeg = meter.startAngle ?? -90;
        const strokeColor = rainmeterColorToCss(meter.lineColor, varMap, '#38bdf8');
        const trackColor = rainmeterColorToCss(
          meter.roundlineBgColor,
          varMap,
          'rgba(30, 41, 59, 0.85)'
        );

        return (
          <svg width={meter.w} height={meter.h} className="block overflow-visible">
            <circle
              cx={meter.w / 2}
              cy={meter.h / 2}
              r={radius}
              fill="none"
              stroke={trackColor}
              strokeWidth={strokeW}
            />
            <circle
              cx={meter.w / 2}
              cy={meter.h / 2}
              r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeW}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform={`rotate(${startDeg} ${meter.w / 2} ${meter.h / 2})`}
              className="transition-all duration-200"
            />
          </svg>
        );
      }

      case 'Histogram':
      case 'Line': {
        const series = getHistorySeries(meter.measureName);
        const primary = rainmeterColorToCss(
          meter.primaryColor || meter.lineColor,
          varMap,
          'rgba(56, 189, 248, 0.78)'
        );
        const bg = rainmeterColorToCss(meter.solidColor, varMap, 'rgba(15, 23, 42, 0.45)');
        const w = Math.max(20, meter.w);
        const h = Math.max(16, meter.h);

        const pts = series.map((val, idx) => {
          const x = (idx / Math.max(1, series.length - 1)) * w;
          const y = h - (Math.max(0, Math.min(100, val)) / 100) * (h - 6) - 3;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        });
        const polylinePoints = pts.join(' ');
        const areaPoints = `0,${h} ${polylinePoints} ${w},${h}`;

        return (
          <svg
            width={w}
            height={h}
            style={{ backgroundColor: bg }}
            className="block rounded-md overflow-hidden"
          >
            {meter.horizontalLines && (
              <>
                <line x1={0} y1={h * 0.25} x2={w} y2={h * 0.25} stroke="rgba(148,163,184,0.16)" strokeWidth={1} />
                <line x1={0} y1={h * 0.5} x2={w} y2={h * 0.5} stroke="rgba(148,163,184,0.16)" strokeWidth={1} />
                <line x1={0} y1={h * 0.75} x2={w} y2={h * 0.75} stroke="rgba(148,163,184,0.16)" strokeWidth={1} />
              </>
            )}
            {meter.type === 'Histogram' && (
              <polygon points={areaPoints} fill={primary} />
            )}
            <polyline
              fill="none"
              stroke={primary}
              strokeWidth={meter.lineWidth ?? 2}
              points={polylinePoints}
            />
          </svg>
        );
      }

      case 'Image': {
        const alpha = (meter.imageAlpha ?? 255) / 255;
        return (
          <div
            className="w-full h-full rounded-lg overflow-hidden relative bg-slate-800"
            style={{
              opacity: alpha,
              filter: meter.greyScale ? 'grayscale(100%)' : undefined,
            }}
          >
            <img
              src={albumPrismImg}
              alt={meter.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover select-none pointer-events-none"
            />
          </div>
        );
      }

      case 'Rotator': {
        const deg = (meter.startAngle ?? 0) + ratio * (meter.rotationAngle ?? 360);
        const handColor = rainmeterColorToCss(meter.lineColor, varMap, '#38bdf8');
        return (
          <svg width={meter.w} height={meter.h} className="block overflow-visible">
            <circle
              cx={meter.w / 2}
              cy={meter.h / 2}
              r={Math.min(meter.w, meter.h) / 2 - 2}
              fill="rgba(15,23,42,0.5)"
              stroke="rgba(148,163,184,0.3)"
              strokeWidth={1.5}
            />
            <g transform={`rotate(${deg} ${meter.w / 2} ${meter.h / 2})`}>
              <line
                x1={meter.w / 2}
                y1={meter.h / 2 + 6}
                x2={meter.w / 2}
                y2={6}
                stroke={handColor}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
              <circle cx={meter.w / 2} cy={meter.h / 2} r={3.5} fill={handColor} />
            </g>
          </svg>
        );
      }

      case 'Button': {
        const bg = rainmeterColorToCss(meter.solidColor, varMap, 'rgba(30,41,59,0.92)');
        const fg = rainmeterColorToCss(meter.fontColor, varMap, '#f8fafc');
        return (
          <div
            className="w-full h-full rounded-lg border border-slate-600/50 flex items-center justify-center px-3 text-xs font-medium select-none transition-transform active:scale-95 hover:brightness-110"
            style={{
              backgroundColor: bg,
              color: fg,
              fontSize: `${meter.fontSize ?? 12}px`,
            }}
          >
            {meter.text || meter.name}
          </div>
        );
      }

      case 'Bitmap': {
        const digitsCount = meter.bitmapDigits ?? 3;
        const val = Math.round(boundMeasure?.numeric ?? 42);
        const padded = String(val).padStart(digitsCount, '0').slice(-digitsCount);
        const fg = rainmeterColorToCss(meter.fontColor, varMap, '#38bdf8');
        return (
          <div className="w-full h-full flex items-center justify-center gap-1 bg-slate-950/85 border border-slate-800 rounded-md px-2 font-mono tabular-nums">
            {padded.split('').map((ch, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 rounded bg-slate-900 text-base font-bold leading-none"
                style={{ color: fg }}
              >
                {ch}
              </span>
            ))}
          </div>
        );
      }

      default:
        return null;
    }
  };

  const skinBackgroundStyle = (): React.CSSProperties => {
    if (project.rainmeter.BackgroundMode === 2) {
      return {
        backgroundColor: rainmeterColorToCss(
          project.rainmeter.SolidColor,
          varMap,
          'rgba(15,23,42,0.6)'
        ),
      };
    }
    return { backgroundColor: 'transparent' };
  };

  return (
    <section
      aria-label="Canlı Masaüstü Önizleme Tuvali"
      className="flex-1 flex flex-col min-w-0 bg-slate-100 dark:bg-slate-950 select-none relative overflow-hidden"
    >
      {/* Studio Canvas Toolbar */}
      <div className="h-11 px-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setPreviewOnlyMode(false)}
            className={`px-2 py-1 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              !previewOnlyMode
                ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <MousePointer2 className="w-3.5 h-3.5" />
            Düzenle
          </button>
          <button
            type="button"
            onClick={() => setPreviewOnlyMode(true)}
            className={`px-2 py-1 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              previewOnlyMode
                ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Önizle
          </button>

          <span className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

          <button
            type="button"
            onClick={() => setShowGrid((v) => !v)}
            aria-pressed={showGrid}
            className={`px-2 py-1 text-xs rounded-md flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
              showGrid
                ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            Izgara
          </button>

          <button
            type="button"
            onClick={() => setSnapToGrid((v) => !v)}
            aria-pressed={snapToGrid}
            className={`px-2 py-1 text-xs rounded-md transition-colors whitespace-nowrap shrink-0 ${
              snapToGrid
                ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            4px
          </button>

          <button
            type="button"
            onClick={() => setCanvasScale((s) => (s === 1 ? 0.85 : 1))}
            className="px-2 py-1 text-xs font-mono tabular-nums rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
            title="Yakınlaştırma ölçeği"
          >
            {Math.round(canvasScale * 100)}%
          </button>
        </div>

        {/* Right: Wallpaper selector + Telemetry Simulator Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!isSplitMode && (
            <div className="hidden xl:flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-md">
            <ImageIcon className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
            {(
              [
                { id: 'nordic', label: 'Nordik' },
                { id: 'concrete', label: 'Atölye' },
                { id: 'slate', label: 'Mat' },
              ] as const
            ).map((wp) => (
              <button
                key={wp.id}
                type="button"
                onClick={() => setWallpaper(wp.id)}
                className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                  wallpaper === wp.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {wp.label}
              </button>
            ))}
            </div>
          )}

          <button
            type="button"
            onClick={onToggleSimPause}
            aria-label={isSimPaused ? 'Canlı sensör simülasyonunu başlat' : 'Canlı sensör simülasyonunu duraklat'}
            className="p-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            title={isSimPaused ? 'Simülasyonu Başlat' : 'Simülasyonu Duraklat'}
          >
            {isSimPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setShowSimDrawer((v) => !v)}
            aria-expanded={showSimDrawer}
            className={`px-2 py-1 text-xs font-medium rounded-md border flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
              showSimDrawer
                ? 'border-sky-500/50 bg-sky-500/10 text-sky-600 dark:text-sky-400'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Sensör
          </button>
        </div>
      </div>

      {/* Interactive Simulated Desktop Viewport */}
      <div
        onClick={() => onSelectMeter(null)}
        className="flex-1 relative flex items-center justify-center overflow-auto p-4"
      >
        {/* Wallpaper Layer with Resilient Fallback */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 pointer-events-none">
          {wallpaper === 'nordic' && (
            <img
              src={wallpaperNordicImg}
              alt="Nordik dağ masaüstü duvar kağıdı"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-90"
            />
          )}
          {wallpaper === 'concrete' && (
            <img
              src={wallpaperConcreteImg}
              alt="Mimari taş masaüstü duvar kağıdı"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-85"
            />
          )}
          <div className="absolute inset-0 bg-slate-950/20" />
        </div>

        {/* Action Bang Toast Notification in Preview Mode */}
        {lastActionNotice && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-lg bg-slate-900/95 border border-sky-500/40 text-xs font-mono text-sky-300 shadow-lg">
            {lastActionNotice}
          </div>
        )}

        {/* Rainmeter Skin Window Frame */}
        <div
          ref={skinBoxRef}
          data-testid="rainmeter-skin-canvas"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: `${project.rainmeter.SkinWidth}px`,
            height: `${project.rainmeter.SkinHeight}px`,
            transform: `scale(${canvasScale})`,
            transformOrigin: 'center center',
            ...skinBackgroundStyle(),
            backdropFilter: project.rainmeter.BlurEnabled ? 'blur(16px)' : undefined,
          }}
          className={`relative z-10 shrink-0 transition-all duration-150 ${
            isDragOverCanvas
              ? 'outline-2 outline-solid outline-sky-400 ring-4 ring-sky-400/25 shadow-2xl'
              : !previewOnlyMode
              ? 'outline-1 outline-dashed outline-sky-400/55 shadow-2xl'
              : ''
          }`}
        >
          {/* Optional 16px Studio Alignment Grid */}
          {!previewOnlyMode && showGrid && (
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none opacity-25"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(148,163,184,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.35) 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            />
          )}

          {/* Skin Dimensions Indicator */}
          {!previewOnlyMode && (
            <div className="absolute -top-6 left-0 flex items-center gap-2 text-[11px] font-mono tabular-nums text-slate-200/90 drop-shadow">
              <span>{project.fileName}</span>
              <span>·</span>
              <span>
                {project.rainmeter.SkinWidth} × {project.rainmeter.SkinHeight} px
              </span>
            </div>
          )}

          {/* Empty Skin State */}
          {project.meters.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-900/75 rounded-xl border border-slate-700/60">
              <p className="text-sm font-medium text-slate-200">
                Tuvalde henüz görsel bileşen (Meter) yok
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Sol panelden bir bileşene tıklayın veya doğrudan bu alana sürükleyip bırakın.
              </p>
            </div>
          )}

          {/* Render All Meters in Z-Order */}
          {project.meters.map((meter) => {
            if (meter.hidden) return null;
            const isSelected = !previewOnlyMode && selectedMeterId === meter.id;

            // String meters with Center or Right alignment anchor around X in Rainmeter;
            // For intuitive drag-and-drop, keep container positioned at (x, y)
            const isAnchoredString =
              meter.type === 'String' &&
              meter.stringAlign &&
              meter.stringAlign !== 'Left' &&
              meter.stringAlign !== 'LeftCenter';

            return (
              <div
                key={meter.id}
                role="button"
                tabIndex={0}
                aria-label={`Katman ${meter.name} (${meter.type})`}
                onKeyDown={(e) => {
                  if (previewOnlyMode || meter.locked) return;
                  const step = e.shiftKey ? 10 : 2;
                  if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    onUpdateMeterGeometry(meter.id, { x: meter.x - step });
                  } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    onUpdateMeterGeometry(meter.id, { x: meter.x + step });
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    onUpdateMeterGeometry(meter.id, { y: meter.y - step });
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    onUpdateMeterGeometry(meter.id, { y: meter.y + step });
                  }
                }}
                onPointerDown={(e) => handlePointerDownMeter(e, meter, 'move')}
                onPointerMove={handlePointerMoveMeter}
                onPointerUp={handlePointerUpMeter}
                title={meter.toolTipText || `${meter.name} (${meter.x}, ${meter.y})`}
                style={{
                  position: 'absolute',
                  left: `${meter.x}px`,
                  top: `${meter.y}px`,
                  width: isAnchoredString ? 'auto' : `${meter.w}px`,
                  height: isAnchoredString ? 'auto' : `${meter.h}px`,
                }}
                className={`group transition-shadow duration-150 ${
                  previewOnlyMode
                    ? meter.leftMouseUpAction || meter.buttonCommand
                      ? 'cursor-pointer'
                      : 'cursor-default'
                    : meter.locked
                    ? 'cursor-not-allowed'
                    : 'cursor-grab active:cursor-grabbing'
                } ${
                  recentlyAddedIds.includes(meter.id)
                    ? 'ring-2 ring-emerald-400'
                    : !previewOnlyMode && !isSelected
                    ? 'hover:ring-1 hover:ring-sky-400/50'
                    : ''
                }`}
              >
                {renderMeterVisual(meter)}
              </div>
            );
          })}

          {/* Dedicated Top-Layer Selection HUD & Resize Handle (Preserves True Rainmeter Z-Order) */}
          {!previewOnlyMode &&
            (() => {
              const sel = project.meters.find((m) => m.id === selectedMeterId && !m.hidden);
              if (!sel) return null;
              const isAnchoredString =
                sel.type === 'String' &&
                sel.stringAlign &&
                sel.stringAlign !== 'Left' &&
                sel.stringAlign !== 'LeftCenter';

              return (
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: `${sel.x}px`,
                    top: `${sel.y}px`,
                    width: isAnchoredString ? '0px' : `${sel.w}px`,
                    height: isAnchoredString ? '0px' : `${sel.h}px`,
                  }}
                  className="z-30 ring-1 ring-sky-400 pointer-events-none"
                >
                  <div className="absolute -top-5 left-0 px-1.5 py-0.5 rounded bg-sky-500 text-slate-950 text-[10px] font-mono font-semibold whitespace-nowrap flex items-center gap-1 shadow-xs pointer-events-none">
                    {sel.locked && <Lock className="w-2.5 h-2.5" />}
                    <span>{sel.name}</span>
                    <span>·</span>
                    <span>
                      {sel.x},{sel.y}
                    </span>
                  </div>

                  {!sel.locked && !isAnchoredString && (
                    <div
                      role="separator"
                      aria-label={`${sel.name} boyutlandır`}
                      onPointerDown={(e) => handlePointerDownMeter(e, sel, 'resize')}
                      onPointerMove={handlePointerMoveMeter}
                      onPointerUp={handlePointerUpMeter}
                      className="absolute -right-1.5 -bottom-1.5 w-3.5 h-3.5 rounded-xs bg-sky-400 border border-slate-950 cursor-nwse-resize flex items-center justify-center shadow pointer-events-auto"
                    >
                      <Maximize2 className="w-2 h-2 text-slate-950 rotate-90" />
                    </div>
                  )}
                </div>
              );
            })()}
        </div>

        {/* Manual Sensor Test Drawer */}
        {showSimDrawer && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-4 right-4 z-30 w-80 p-4 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Canlı Sensör Simülatörü
              </span>
              <button
                type="button"
                onClick={() =>
                  onUpdateTelemetryManual({ manualOverride: false })
                }
                className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline"
              >
                Otomatik Dalga
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between font-mono tabular-nums text-[11px] text-slate-600 dark:text-slate-400">
                  <span>CPU Yükü</span>
                  <span>%{Math.round(telemetry.cpuTotal)}</span>
                </div>
                <input
                  type="range"
                  aria-label="Test CPU Yükü"
                  min={0}
                  max={100}
                  value={Math.round(telemetry.cpuTotal)}
                  onChange={(e) =>
                    onUpdateTelemetryManual({
                      manualOverride: true,
                      cpuTotal: Number(e.target.value),
                    })
                  }
                  className="w-full accent-sky-500"
                />
              </div>

              <div>
                <div className="flex justify-between font-mono tabular-nums text-[11px] text-slate-600 dark:text-slate-400">
                  <span>RAM Bellek</span>
                  <span>%{Math.round(telemetry.ramPercent)}</span>
                </div>
                <input
                  type="range"
                  aria-label="Test RAM Yükü"
                  min={0}
                  max={100}
                  value={Math.round(telemetry.ramPercent)}
                  onChange={(e) =>
                    onUpdateTelemetryManual({
                      manualOverride: true,
                      ramPercent: Number(e.target.value),
                    })
                  }
                  className="w-full accent-sky-500"
                />
              </div>

              <div>
                <div className="flex justify-between font-mono tabular-nums text-[11px] text-slate-600 dark:text-slate-400">
                  <span>Disk Doluluk (C:)</span>
                  <span>%{Math.round(telemetry.diskUsedPercent)}</span>
                </div>
                <input
                  type="range"
                  aria-label="Test Disk Doluluk"
                  min={0}
                  max={100}
                  value={Math.round(telemetry.diskUsedPercent)}
                  onChange={(e) => {
                    const used = Number(e.target.value);
                    onUpdateTelemetryManual({
                      manualOverride: true,
                      diskUsedPercent: used,
                      diskFreePercent: 100 - used,
                    });
                  }}
                  className="w-full accent-sky-500"
                />
              </div>

              <div>
                <div className="flex justify-between font-mono tabular-nums text-[11px] text-slate-600 dark:text-slate-400">
                  <span>Pil Seviyesi</span>
                  <span>%{Math.round(telemetry.batteryPercent)}</span>
                </div>
                <input
                  type="range"
                  aria-label="Test Pil Seviyesi"
                  min={5}
                  max={100}
                  value={Math.round(telemetry.batteryPercent)}
                  onChange={(e) =>
                    onUpdateTelemetryManual({
                      manualOverride: true,
                      batteryPercent: Number(e.target.value),
                    })
                  }
                  className="w-full accent-sky-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
