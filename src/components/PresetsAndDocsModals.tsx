import React from 'react';
import { BookOpen, Check, ExternalLink, Layers, Sparkles, X } from 'lucide-react';
import { MEASURE_CATALOG, METER_CATALOG, PRESET_SKINS, PresetSkinBundle } from '../data/presets';

interface PresetsModalProps {
  isOpen: boolean;
  currentProjectId: string;
  onSelectPreset: (preset: PresetSkinBundle) => void;
  onCreateBlank: () => void;
  onClose: () => void;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  currentProjectId,
  onSelectPreset,
  onCreateBlank,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="presets-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-sky-500" />
            <h2
              id="presets-modal-title"
              className="text-base font-semibold text-slate-900 dark:text-slate-100"
            >
              Hazır Rainmeter Kabuk Şablonları
            </h2>
          </div>
          <button
            type="button"
            aria-label="Şablon penceresini kapat"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRESET_SKINS.map((preset) => {
            const active = preset.id === currentProjectId;
            return (
              <div
                key={preset.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-colors ${
                  active
                    ? 'border-sky-500 bg-sky-500/5'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-xs text-sky-600 dark:text-sky-400 font-medium">
                    {preset.tag} · {preset.project.meters.length} Katman
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                    {preset.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {preset.subtitle}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectPreset(preset);
                    onClose();
                  }}
                  className={`mt-4 w-full px-3 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                    active
                      ? 'bg-sky-500 text-slate-950'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-sky-500 hover:text-slate-950'
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5" />}
                  {active ? 'Aktif Şablon' : 'Şablonu Yükle'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Sıfırdan boş bir tuval üzerinde kendi temanızı da oluşturabilirsiniz.
          </span>
          <button
            type="button"
            onClick={() => {
              onCreateBlank();
              onClose();
            }}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-500" />
            Boş Kabuk Başlat
          </button>
        </div>
      </div>
    </div>
  );
};

interface DocsReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocsReferenceModal: React.FC<DocsReferenceModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="docs-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[82vh] flex flex-col rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-sky-500" />
            <h2
              id="docs-modal-title"
              className="text-base font-semibold text-slate-900 dark:text-slate-100"
            >
              Rainmeter Hızlı Başvuru Kılavuzu (docs.rainmeter.net)
            </h2>
          </div>
          <button
            type="button"
            aria-label="Kılavuzu kapat"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-600 dark:text-slate-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                01. [Variables] & #Değişken#
              </div>
              <p className="leading-relaxed">
                Renkleri, yazı tiplerini veya boyutları tek merkezden yönetmek için{' '}
                <code>#AccentColor#</code> sözdizimini kullanın.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                02. Measure → Meter Akışı
              </div>
              <p className="leading-relaxed">
                <strong>Measure</strong> sistemden veriyi okur (CPU, Saat, Spotify);{' '}
                <strong>Meter</strong> ise bu veriyi ekrana çizer (<code>MeasureName=...</code>).
              </p>
            </div>
            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                03. Etkileşim Komutları (Bangs)
              </div>
              <p className="leading-relaxed">
                <code>LeftMouseUpAction=[!Refresh]</code> gibi Bang ifadeleriyle tıklama, medya kontrolü ve uygulama başlatma eklenir.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-2.5">
                Desteklenen Görsel Bileşenler (Meters)
              </h3>
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg">
                {METER_CATALOG.map((m) => (
                  <div key={m.type} className="px-3 py-2 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                        Meter={m.type}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400"> · {m.subtitle}</span>
                    </div>
                    <a
                      href={m.docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-500 hover:underline shrink-0 inline-flex items-center gap-1"
                    >
                      Doküman <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-2.5">
                Desteklenen Veri Kaynakları & Eklentiler (Measures)
              </h3>
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg">
                {MEASURE_CATALOG.map((m) => (
                  <div key={m.type} className="px-3 py-2 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {m.type}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400"> · {m.subtitle}</span>
                    </div>
                    <a
                      href={m.docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-500 hover:underline shrink-0 inline-flex items-center gap-1"
                    >
                      Doküman <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
