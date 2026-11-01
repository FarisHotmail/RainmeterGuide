import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Settings2, Sparkles } from 'lucide-react';
import {
  RainmeterSettings,
  SkinMeasure,
  SkinMetadata,
  SkinMeter,
  SkinProject,
} from '../types/rainmeter';
import { ColorInputField } from './ColorInputField';

interface RightInspectorProps {
  project: SkinProject;
  selectedMeter: SkinMeter | null;
  selectedMeasure: SkinMeasure | null;
  onUpdateMeter: (id: string, patch: Partial<SkinMeter>) => void;
  onUpdateMeasure: (id: string, patch: Partial<SkinMeasure>) => void;
  onUpdateSettings: (patch: Partial<RainmeterSettings>) => void;
  onUpdateMetadata: (patch: Partial<SkinMetadata>) => void;
  onUpdateFileNames: (folderName: string, fileName: string) => void;
}

const BANG_PRESETS = [
  { label: 'Kabuğu Yenile (!Refresh)', value: '[!Refresh]' },
  { label: 'Oynat / Duraklat (Media)', value: '[!CommandMeasure MeasureTitle "PlayPause"]' },
  { label: 'Sonraki Parça (Next)', value: '[!CommandMeasure MeasureTitle "Next"]' },
  { label: 'Görev Yöneticisini Aç', value: '["taskmgr.exe"]' },
  { label: 'Kabuğu Gizle (!HideFade)', value: '[!HideFade]' },
  { label: 'Saydamlık %60 (!SetTransparency)', value: '[!SetTransparency "150"]' },
];

export const RightInspector: React.FC<RightInspectorProps> = ({
  project,
  selectedMeter,
  selectedMeasure,
  onUpdateMeter,
  onUpdateMeasure,
  onUpdateSettings,
  onUpdateMetadata,
  onUpdateFileNames,
}) => {
  const [advancedMode, setAdvancedMode] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    geom: true,
    content: true,
    style: true,
    actions: false,
    advanced: false,
  });

  const toggleSec = (k: string) =>
    setOpenSections((prev) => ({ ...prev, [k]: !prev[k] }));

  return (
    <aside
      aria-label="Özellik Denetçisi"
      className="w-76 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 select-none"
    >
      {/* Inspector Header with Basic / Advanced Progressive Disclosure Switch */}
      <div className="h-11 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Settings2 className="w-4 h-4 text-sky-500 shrink-0" />
          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
            {selectedMeter
              ? `${selectedMeter.name}`
              : selectedMeasure
              ? `[${selectedMeasure.name}]`
              : 'Kabuk Ayarları'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setAdvancedMode((v) => !v)}
          aria-pressed={advancedMode}
          className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
            advancedMode
              ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 font-semibold'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
          title="Gelişmiş Rainmeter parametrelerini göster/gizle"
        >
          {advancedMode ? 'Tüm Ayarlar' : 'Temel Görünüm'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* CASE 1: SELECTED METER INSPECTOR */}
        {selectedMeter && (
          <>
            {/* Section 1: Identity & Geometry */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSec('geom')}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <span>Konum ve Boyut ({selectedMeter.type})</span>
                {openSections.geom ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {openSections.geom && (
                <div className="p-3 space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Bölüm Adı ([SectionName])
                    </label>
                    <input
                      type="text"
                      aria-label="Katman bölüm adı"
                      value={selectedMeter.name}
                      onChange={(e) =>
                        onUpdateMeter(selectedMeter.id, {
                          name: e.target.value.replace(/[\[\]\s]/g, ''),
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-mono rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {(
                      [
                        { key: 'x', label: 'X Konumu' },
                        { key: 'y', label: 'Y Konumu' },
                        { key: 'w', label: 'Genişlik (W)' },
                        { key: 'h', label: 'Yükseklik (H)' },
                      ] as const
                    ).map((coord) => (
                      <div key={coord.key}>
                        <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                          {coord.label}
                        </label>
                        <input
                          type="number"
                          aria-label={coord.label}
                          value={Math.round(selectedMeter[coord.key])}
                          onChange={(e) =>
                            onUpdateMeter(selectedMeter.id, {
                              [coord.key]: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Data Binding & Meter-Specific Content */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSec('content')}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <span>Veri Bağlantısı & İçerik</span>
                {openSections.content ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {openSections.content && (
                <div className="p-3 space-y-3">
                  {selectedMeter.type !== 'Shape' && (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Bağlı Veri Kaynağı (MeasureName)
                      </label>
                      <select
                        aria-label="Bağlı veri kaynağı seçin"
                        value={selectedMeter.measureName || ''}
                        onChange={(e) =>
                          onUpdateMeter(selectedMeter.id, {
                            measureName: e.target.value || undefined,
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                      >
                        <option value="">— Sabit (Veri Bağlantısı Yok) —</option>
                        {project.measures.map((m) => (
                          <option key={m.id} value={m.name}>
                            {m.name} ({m.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {advancedMode && selectedMeter.type === 'String' && (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                        İkinci Veri Kaynağı (MeasureName2 - %2)
                      </label>
                      <select
                        aria-label="İkinci veri kaynağı"
                        value={selectedMeter.measureName2 || ''}
                        onChange={(e) =>
                          onUpdateMeter(selectedMeter.id, {
                            measureName2: e.target.value || undefined,
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                      >
                        <option value="">— Yok —</option>
                        {project.measures.map((m) => (
                          <option key={m.id} value={m.name}>
                            {m.name} ({m.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(selectedMeter.type === 'String' || selectedMeter.type === 'Button') && (
                    <>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                          Metin Şablonu (Text — %1 veri değeridir)
                        </label>
                        <input
                          type="text"
                          aria-label="Metin şablonu"
                          value={selectedMeter.text ?? ''}
                          onChange={(e) =>
                            onUpdateMeter(selectedMeter.id, { text: e.target.value })
                          }
                          placeholder="%1"
                          className="w-full px-2.5 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      {selectedMeter.type === 'String' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                              Ön Ek (Prefix)
                            </label>
                            <input
                              type="text"
                              aria-label="Ön ek"
                              value={selectedMeter.prefix ?? ''}
                              onChange={(e) =>
                                onUpdateMeter(selectedMeter.id, { prefix: e.target.value })
                              }
                              className="w-full px-2 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                              Son Ek (Postfix)
                            </label>
                            <input
                              type="text"
                              aria-label="Son ek"
                              value={selectedMeter.postfix ?? ''}
                              onChange={(e) =>
                                onUpdateMeter(selectedMeter.id, { postfix: e.target.value })
                              }
                              className="w-full px-2 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {selectedMeter.type === 'Shape' && (
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                          Şekil Türü
                        </label>
                        <select
                          aria-label="Şekil türü"
                          value={selectedMeter.shapeType || 'Rectangle'}
                          onChange={(e) =>
                            onUpdateMeter(selectedMeter.id, {
                              shapeType: e.target.value as SkinMeter['shapeType'],
                            })
                          }
                          className="w-full px-2 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                        >
                          <option value="Rectangle">Dikdörtgen (Rectangle)</option>
                          <option value="Ellipse">Daire / Elips (Ellipse)</option>
                          <option value="Line">Çizgi (Line)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                          Köşe Yarıçapı (px)
                        </label>
                        <input
                          type="number"
                          aria-label="Köşe yarıçapı"
                          min={0}
                          max={200}
                          value={selectedMeter.shapeCornerRadius ?? 12}
                          onChange={(e) =>
                            onUpdateMeter(selectedMeter.id, {
                              shapeCornerRadius: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  )}

                  {selectedMeter.type === 'Bar' && (
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                        Çubuk Yönü (BarOrientation)
                      </label>
                      <select
                        aria-label="Çubuk yönü"
                        value={selectedMeter.barOrientation || 'Horizontal'}
                        onChange={(e) =>
                          onUpdateMeter(selectedMeter.id, {
                            barOrientation: e.target.value as 'Horizontal' | 'Vertical',
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                      >
                        <option value="Horizontal">Yatay (Horizontal)</option>
                        <option value="Vertical">Dikey (Vertical)</option>
                      </select>
                    </div>
                  )}

                  {(selectedMeter.type === 'Roundline' || selectedMeter.type === 'Rotator') && (
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                          Kalınlık
                        </label>
                        <input
                          type="number"
                          aria-label="Halka kalınlığı"
                          min={1}
                          max={48}
                          value={selectedMeter.lineWidth ?? 6}
                          onChange={(e) =>
                            onUpdateMeter(selectedMeter.id, {
                              lineWidth: parseInt(e.target.value, 10) || 4,
                            })
                          }
                          className="w-full px-2 py-1.5 text-xs font-mono tabular-nums rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                          Başlangıç°
                        </label>
                        <input
                          type="number"
                          aria-label="Başlangıç açısı"
                          value={selectedMeter.startAngle ?? -90}
                          onChange={(e) =>
                            onUpdateMeter(selectedMeter.id, {
                              startAngle: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="w-full px-2 py-1.5 text-xs font-mono tabular-nums rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                          Yay Açısı°
                        </label>
                        <input
                          type="number"
                          aria-label="Dönüş açısı"
                          value={selectedMeter.rotationAngle ?? 360}
                          onChange={(e) =>
                            onUpdateMeter(selectedMeter.id, {
                              rotationAngle: parseInt(e.target.value, 10) || 360,
                            })
                          }
                          className="w-full px-2 py-1.5 text-xs font-mono tabular-nums rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section 3: Visual Styling & Typography */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSec('style')}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <span>Görünüm, Renk & Tipografi</span>
                {openSections.style ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {openSections.style && (
                <div className="p-3 space-y-3">
                  {selectedMeter.type === 'String' && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                            Yazı Boyutu (pt)
                          </label>
                          <input
                            type="number"
                            aria-label="Yazı boyutu"
                            min={6}
                            max={140}
                            value={selectedMeter.fontSize ?? 14}
                            onChange={(e) =>
                              onUpdateMeter(selectedMeter.id, {
                                fontSize: parseInt(e.target.value, 10) || 12,
                              })
                            }
                            className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                            Hizalama (Align)
                          </label>
                          <select
                            aria-label="Metin hizalama"
                            value={selectedMeter.stringAlign || 'Left'}
                            onChange={(e) =>
                              onUpdateMeter(selectedMeter.id, {
                                stringAlign: e.target.value as SkinMeter['stringAlign'],
                              })
                            }
                            className="w-full px-2 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                          >
                            <option value="Left">Sola (Left)</option>
                            <option value="Center">Ortala (Center)</option>
                            <option value="Right">Sağa (Right)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                            Yazı Tipi (FontFace)
                          </label>
                          <input
                            type="text"
                            aria-label="Yazı tipi"
                            value={selectedMeter.fontFace ?? '#FontMain#'}
                            onChange={(e) =>
                              onUpdateMeter(selectedMeter.id, { fontFace: e.target.value })
                            }
                            className="w-full px-2 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                            Kalınlık (Weight)
                          </label>
                          <select
                            aria-label="Yazı kalınlığı"
                            value={selectedMeter.fontWeight ?? 500}
                            onChange={(e) =>
                              onUpdateMeter(selectedMeter.id, {
                                fontWeight: parseInt(e.target.value, 10),
                              })
                            }
                            className="w-full px-2 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                          >
                            <option value={400}>Normal (400)</option>
                            <option value={500}>Medium (500)</option>
                            <option value={600}>SemiBold (600)</option>
                            <option value={700}>Bold (700)</option>
                          </select>
                        </div>
                      </div>

                      <ColorInputField
                        label="Yazı Rengi (FontColor)"
                        value={selectedMeter.fontColor}
                        onChange={(c) => onUpdateMeter(selectedMeter.id, { fontColor: c })}
                        variables={project.variables}
                      />
                    </>
                  )}

                  {selectedMeter.type === 'Shape' && (
                    <>
                      <ColorInputField
                        label="Dolgu Rengi (Fill Color)"
                        value={selectedMeter.shapeFillColor}
                        onChange={(c) => onUpdateMeter(selectedMeter.id, { shapeFillColor: c })}
                        variables={project.variables}
                        fallback="15,23,42,220"
                      />
                      <ColorInputField
                        label="Kenarlık Rengi (Stroke Color)"
                        value={selectedMeter.shapeStrokeColor}
                        onChange={(c) => onUpdateMeter(selectedMeter.id, { shapeStrokeColor: c })}
                        variables={project.variables}
                        fallback="148,163,184,50"
                      />
                      <div>
                        <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                          Kenarlık Kalınlığı (StrokeWidth)
                        </label>
                        <input
                          type="number"
                          aria-label="Kenarlık kalınlığı"
                          min={0}
                          max={24}
                          value={selectedMeter.shapeStrokeWidth ?? 1}
                          onChange={(e) =>
                            onUpdateMeter(selectedMeter.id, {
                              shapeStrokeWidth: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </>
                  )}

                  {selectedMeter.type === 'Bar' && (
                    <>
                      <ColorInputField
                        label="Çubuk Dolgu Rengi (BarColor)"
                        value={selectedMeter.barColor}
                        onChange={(c) => onUpdateMeter(selectedMeter.id, { barColor: c })}
                        variables={project.variables}
                        fallback="56,189,248,255"
                      />
                      <ColorInputField
                        label="Arka Plan İz Rengi (SolidColor)"
                        value={selectedMeter.solidColor}
                        onChange={(c) => onUpdateMeter(selectedMeter.id, { solidColor: c })}
                        variables={project.variables}
                        fallback="30,41,59,210"
                      />
                    </>
                  )}

                  {(selectedMeter.type === 'Roundline' || selectedMeter.type === 'Rotator') && (
                    <>
                      <ColorInputField
                        label="Halka / İbre Rengi (LineColor)"
                        value={selectedMeter.lineColor}
                        onChange={(c) => onUpdateMeter(selectedMeter.id, { lineColor: c })}
                        variables={project.variables}
                        fallback="56,189,248,255"
                      />
                      {selectedMeter.type === 'Roundline' && (
                        <ColorInputField
                          label="Alt Halka İz Rengi"
                          value={selectedMeter.roundlineBgColor}
                          onChange={(c) =>
                            onUpdateMeter(selectedMeter.id, { roundlineBgColor: c })
                          }
                          variables={project.variables}
                          fallback="30,41,59,220"
                        />
                      )}
                    </>
                  )}

                  {(selectedMeter.type === 'Histogram' || selectedMeter.type === 'Line') && (
                    <>
                      <ColorInputField
                        label="Birincil Grafik Rengi"
                        value={selectedMeter.primaryColor || selectedMeter.lineColor}
                        onChange={(c) =>
                          onUpdateMeter(selectedMeter.id, { primaryColor: c, lineColor: c })
                        }
                        variables={project.variables}
                        fallback="56,189,248,180"
                      />
                      <ColorInputField
                        label="Grafik Arka Planı (SolidColor)"
                        value={selectedMeter.solidColor}
                        onChange={(c) => onUpdateMeter(selectedMeter.id, { solidColor: c })}
                        variables={project.variables}
                        fallback="15,23,42,140"
                      />
                    </>
                  )}

                  {selectedMeter.type === 'Image' && (
                    <>
                      <div>
                        <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                          Görsel Yolu (ImageName)
                        </label>
                        <input
                          type="text"
                          aria-label="Görsel dosya yolu"
                          value={selectedMeter.imageName ?? '#@#Images\\cover.jpg'}
                          onChange={(e) =>
                            onUpdateMeter(selectedMeter.id, { imageName: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 text-xs font-mono rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                          <span>Görsel Opaklığı (ImageAlpha)</span>
                          <span className="font-mono tabular-nums">{selectedMeter.imageAlpha ?? 255}</span>
                        </div>
                        <input
                          type="range"
                          aria-label="Görsel opaklığı"
                          min={0}
                          max={255}
                          value={selectedMeter.imageAlpha ?? 255}
                          onChange={(e) =>
                            onUpdateMeter(selectedMeter.id, {
                              imageAlpha: parseInt(e.target.value, 10),
                            })
                          }
                          className="w-full accent-sky-500"
                        />
                      </div>

                      <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                        <span>Siyah-Beyaz Filtresi (GreyScale=1)</span>
                        <input
                          type="checkbox"
                          checked={Boolean(selectedMeter.greyScale)}
                          onChange={(e) =>
                            onUpdateMeter(selectedMeter.id, { greyScale: e.target.checked })
                          }
                          className="accent-sky-500"
                        />
                      </label>

                      <ColorInputField
                        label="Görsel Renk Tonu (ImageTint)"
                        value={selectedMeter.imageTint}
                        onChange={(c) => onUpdateMeter(selectedMeter.id, { imageTint: c })}
                        variables={project.variables}
                        fallback="255,255,255,255"
                      />
                    </>
                  )}

                  {(selectedMeter.type === 'Button' || selectedMeter.type === 'Bitmap') && (
                    <>
                      <ColorInputField
                        label="Ön Plan Rengi"
                        value={selectedMeter.fontColor}
                        onChange={(c) => onUpdateMeter(selectedMeter.id, { fontColor: c })}
                        variables={project.variables}
                        fallback="248,250,252,255"
                      />
                      {selectedMeter.type === 'Button' && (
                        <ColorInputField
                          label="Düğme Yüzey Rengi"
                          value={selectedMeter.solidColor}
                          onChange={(c) => onUpdateMeter(selectedMeter.id, { solidColor: c })}
                          variables={project.variables}
                          fallback="30,41,59,230"
                        />
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Section 4: Mouse Actions & Bangs */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSec('actions')}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <span>Fare Etkileşimleri (Bangs)</span>
                {openSections.actions ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {openSections.actions && (
                <div className="p-3 space-y-2.5">
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      Hazır Rainmeter Bang Ekle
                    </label>
                    <select
                      aria-label="Hazır Bang komutu seç"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          onUpdateMeter(selectedMeter.id, {
                            leftMouseUpAction: e.target.value,
                          });
                        }
                      }}
                      className="w-full px-2 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      <option value="">— Komut şablonu seçin —</option>
                      {BANG_PRESETS.map((bp) => (
                        <option key={bp.value} value={bp.value}>
                          {bp.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      Sol Tıklama (LeftMouseUpAction)
                    </label>
                    <input
                      type="text"
                      aria-label="Sol tıklama komutu"
                      value={selectedMeter.leftMouseUpAction ?? ''}
                      onChange={(e) =>
                        onUpdateMeter(selectedMeter.id, { leftMouseUpAction: e.target.value })
                      }
                      placeholder="[!Refresh]"
                      className="w-full px-2.5 py-1.5 text-xs font-mono rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      İpucu Metni (ToolTipText)
                    </label>
                    <input
                      type="text"
                      aria-label="İpucu metni"
                      value={selectedMeter.toolTipText ?? ''}
                      onChange={(e) =>
                        onUpdateMeter(selectedMeter.id, { toolTipText: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section 5: Advanced Rainmeter Flags (Shown when Tüm Ayarlar active) */}
            {advancedMode && (
              <div className="border border-sky-500/30 rounded-lg p-3 space-y-2.5 bg-sky-500/5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gelişmiş Rainmeter Parametreleri</span>
                </div>

                <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                  <span>DynamicVariables=1</span>
                  <input
                    type="checkbox"
                    checked={Boolean(selectedMeter.dynamicVariables)}
                    onChange={(e) =>
                      onUpdateMeter(selectedMeter.id, { dynamicVariables: e.target.checked })
                    }
                    className="accent-sky-500"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                  <span>Percentual=1 (Yüzde Hesapla)</span>
                  <input
                    type="checkbox"
                    checked={Boolean(selectedMeter.percentual)}
                    onChange={(e) =>
                      onUpdateMeter(selectedMeter.id, { percentual: e.target.checked })
                    }
                    className="accent-sky-500"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                  <span>AutoScale=1 (B/KB/MB/GB)</span>
                  <input
                    type="checkbox"
                    checked={selectedMeter.autoScale === 1}
                    onChange={(e) =>
                      onUpdateMeter(selectedMeter.id, { autoScale: e.target.checked ? 1 : 0 })
                    }
                    className="accent-sky-500"
                  />
                </label>

                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    Grup Adı (Group)
                  </label>
                  <input
                    type="text"
                    aria-label="Grup adı"
                    value={selectedMeter.group ?? ''}
                    onChange={(e) =>
                      onUpdateMeter(selectedMeter.id, { group: e.target.value })
                    }
                    placeholder="WidgetsGroup"
                    className="w-full px-2 py-1 text-xs font-mono rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* CASE 2: SELECTED MEASURE INSPECTOR */}
        {!selectedMeter && selectedMeasure && (
          <div className="space-y-3 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
            <div>
              <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                Veri Kaynağı Adı ([MeasureName])
              </label>
              <input
                type="text"
                aria-label="Veri kaynağı adı"
                value={selectedMeasure.name}
                onChange={(e) =>
                  onUpdateMeasure(selectedMeasure.id, {
                    name: e.target.value.replace(/[\[\]\s]/g, ''),
                  })
                }
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                Güncelleme Böleni (UpdateDivider)
              </label>
              <input
                type="number"
                aria-label="Güncelleme böleni"
                min={1}
                max={3600}
                value={selectedMeasure.updateDivider}
                onChange={(e) =>
                  onUpdateMeasure(selectedMeasure.id, {
                    updateDivider: Math.max(1, parseInt(e.target.value, 10) || 1),
                  })
                }
                className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            {selectedMeasure.type === 'Time' && (
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  Zaman Biçimi (strftime Format)
                </label>
                <input
                  type="text"
                  aria-label="Zaman biçimi"
                  value={selectedMeasure.format ?? '%H:%M:%S'}
                  onChange={(e) =>
                    onUpdateMeasure(selectedMeasure.id, { format: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 text-xs font-mono rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Örnekler: <code>%H:%M</code>, <code>%d %B %Y</code>, <code>%A</code>
                </p>
              </div>
            )}

            {selectedMeasure.type === 'CPU' && (
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  Çekirdek Seçimi (0 = Toplam CPU)
                </label>
                <input
                  type="number"
                  aria-label="İşlemci çekirdeği"
                  min={0}
                  max={32}
                  value={selectedMeasure.processor ?? 0}
                  onChange={(e) =>
                    onUpdateMeasure(selectedMeasure.id, {
                      processor: Math.max(0, parseInt(e.target.value, 10) || 0),
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs font-mono rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            )}

            {selectedMeasure.type === 'FreeDiskSpace' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    Sürücü Harfi
                  </label>
                  <input
                    type="text"
                    aria-label="Sürücü harfi"
                    value={selectedMeasure.drive ?? 'C:'}
                    onChange={(e) =>
                      onUpdateMeasure(selectedMeasure.id, { drive: e.target.value })
                    }
                    className="w-full px-2 py-1.5 text-xs font-mono rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    Ölçüm Tipi
                  </label>
                  <select
                    aria-label="Disk ölçüm tipi"
                    value={selectedMeasure.diskType ?? 'Used'}
                    onChange={(e) =>
                      onUpdateMeasure(selectedMeasure.id, {
                        diskType: e.target.value as SkinMeasure['diskType'],
                      })
                    }
                    className="w-full px-2 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  >
                    <option value="Used">Kullanılan (%)</option>
                    <option value="Free">Boş Alan</option>
                    <option value="Total">Toplam Kapasite</option>
                    <option value="Label">Disk Etiketi</option>
                  </select>
                </div>
              </div>
            )}

            {selectedMeasure.type === 'Calc' && (
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  Matematiksel Formül (Formula)
                </label>
                <input
                  type="text"
                  aria-label="Matematiksel formül"
                  value={selectedMeasure.formula ?? ''}
                  onChange={(e) =>
                    onUpdateMeasure(selectedMeasure.id, { formula: e.target.value })
                  }
                  placeholder="(MeasureCPU * 0.8)"
                  className="w-full px-2.5 py-1.5 text-xs font-mono rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                />
              </div>
            )}

            {selectedMeasure.type === 'NowPlaying' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    Oynatıcı (PlayerName)
                  </label>
                  <select
                    aria-label="Medya oynatıcı"
                    value={selectedMeasure.playerName ?? 'Spotify'}
                    onChange={(e) =>
                      onUpdateMeasure(selectedMeasure.id, { playerName: e.target.value })
                    }
                    className="w-full px-2 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  >
                    <option value="Spotify">Spotify</option>
                    <option value="CAD">CAD (Genel)</option>
                    <option value="AIMP">AIMP</option>
                    <option value="WMP">Windows Media</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    Bilgi Türü
                  </label>
                  <select
                    aria-label="Medya bilgi türü"
                    value={selectedMeasure.playerType ?? 'TITLE'}
                    onChange={(e) =>
                      onUpdateMeasure(selectedMeasure.id, {
                        playerType: e.target.value as SkinMeasure['playerType'],
                      })
                    }
                    className="w-full px-2 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  >
                    <option value="TITLE">Şarkı Adı (TITLE)</option>
                    <option value="ARTIST">Sanatçı (ARTIST)</option>
                    <option value="ALBUM">Albüm (ALBUM)</option>
                    <option value="PROGRESS">İlerleme % (PROGRESS)</option>
                    <option value="POSITION">Geçen Süre (POSITION)</option>
                    <option value="DURATION">Toplam Süre (DURATION)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CASE 3: GLOBAL [Rainmeter] & [Metadata] SETTINGS */}
        {!selectedMeter && !selectedMeasure && (
          <div className="space-y-4">
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-3">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                [Rainmeter] Pencere & Tuval Boyutu
              </h3>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    SkinWidth (px)
                  </label>
                  <input
                    type="number"
                    aria-label="Kabuk genişliği"
                    min={80}
                    max={1400}
                    value={project.rainmeter.SkinWidth}
                    onChange={(e) =>
                      onUpdateSettings({
                        SkinWidth: Math.max(80, parseInt(e.target.value, 10) || 320),
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    SkinHeight (px)
                  </label>
                  <input
                    type="number"
                    aria-label="Kabuk yüksekliği"
                    min={40}
                    max={1000}
                    value={project.rainmeter.SkinHeight}
                    onChange={(e) =>
                      onUpdateSettings({
                        SkinHeight: Math.max(40, parseInt(e.target.value, 10) || 200),
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  Yenileme Hızı (Update ms)
                </label>
                <input
                  type="number"
                  aria-label="Yenileme hızı milisaniye"
                  min={16}
                  max={60000}
                  step={50}
                  value={project.rainmeter.Update}
                  onChange={(e) =>
                    onUpdateSettings({
                      Update: Math.max(16, parseInt(e.target.value, 10) || 1000),
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                <span>Windows Buzlu Cam (Blur / Acrylic)</span>
                <input
                  type="checkbox"
                  checked={project.rainmeter.BlurEnabled}
                  onChange={(e) =>
                    onUpdateSettings({
                      BlurEnabled: e.target.checked,
                      BlurType: e.target.checked ? 'Acrylic' : 'None',
                    })
                  }
                  className="accent-sky-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                <span>Masaüstünde Sürüklenebilir (Draggable)</span>
                <input
                  type="checkbox"
                  checked={project.rainmeter.Draggable}
                  onChange={(e) => onUpdateSettings({ Draggable: e.target.checked })}
                  className="accent-sky-500"
                />
              </label>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2.5">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                [Metadata] Paket ve Yazar Bilgileri
              </h3>

              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  Tema Adı (Name)
                </label>
                <input
                  type="text"
                  aria-label="Tema adı"
                  value={project.metadata.Name}
                  onChange={(e) => onUpdateMetadata({ Name: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    Yazar (Author)
                  </label>
                  <input
                    type="text"
                    aria-label="Yazar adı"
                    value={project.metadata.Author}
                    onChange={(e) => onUpdateMetadata({ Author: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    Sürüm (Version)
                  </label>
                  <input
                    type="text"
                    aria-label="Sürüm"
                    value={project.metadata.Version}
                    onChange={(e) => onUpdateMetadata({ Version: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs font-mono rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    Klasör Adı
                  </label>
                  <input
                    type="text"
                    aria-label="Klasör adı"
                    value={project.folderName}
                    onChange={(e) => onUpdateFileNames(e.target.value, project.fileName)}
                    className="w-full px-2 py-1.5 text-xs font-mono rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    Dosya (.ini)
                  </label>
                  <input
                    type="text"
                    aria-label="INI dosya adı"
                    value={project.fileName}
                    onChange={(e) => onUpdateFileNames(project.folderName, e.target.value)}
                    className="w-full px-2 py-1.5 text-xs font-mono rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
