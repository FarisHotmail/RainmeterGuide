import React, { useState } from 'react';
import { Archive, CheckCircle2, Download, FileCode, FolderTree, Package, X } from 'lucide-react';
import { SkinProject } from '../types/rainmeter';
import { serializeSkinToIni } from '../utils/iniEngine';
import { buildSkinArchiveBytes, RmskinPackageOptions } from '../utils/rmskinPackager';

interface PackageExportModalProps {
  project: SkinProject;
  isOpen: boolean;
  onClose: () => void;
}

export const PackageExportModal: React.FC<PackageExportModalProps> = ({
  project,
  isOpen,
  onClose,
}) => {
  const [packageName, setPackageName] = useState(project.metadata.Name || 'RainCraft Skin');
  const [author, setAuthor] = useState(project.metadata.Author || 'RainCraft User');
  const [version, setVersion] = useState(project.metadata.Version || '1.0.0');
  const [minimumRainmeter, setMinimumRainmeter] = useState('4.5.0');
  const [minimumWindows, setMinimumWindows] = useState('10.0');
  const [includeVariablesInc, setIncludeVariablesInc] = useState(true);
  const [includeReadme, setIncludeReadme] = useState(true);
  const [isBuilding, setIsBuilding] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setPackageName(project.metadata.Name || 'RainCraft Skin');
      setAuthor(project.metadata.Author || 'RainCraft User');
      setVersion(project.metadata.Version || '1.0.0');
      setStatusMessage(null);
    }
  }, [isOpen, project.metadata.Name, project.metadata.Author, project.metadata.Version]);

  if (!isOpen) return null;

  const safeFolder = project.folderName.replace(/[^A-Za-z0-9_-]/g, '') || 'RainCraftSkin';
  const safeFile = project.fileName.endsWith('.ini')
    ? project.fileName
    : `${project.fileName}.ini`;

  const triggerDownload = (bytes: Uint8Array, filename: string, mime: string) => {
    const blob = new Blob([new Uint8Array(bytes)], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleExport = async (mode: 'rmskin' | 'zip' | 'ini') => {
    setIsBuilding(true);
    setStatusMessage(null);
    try {
      const cleanPkgFile =
        (packageName || safeFolder).replace(/[^A-Za-z0-9_-]/g, '_') + `_${version}`;

      if (mode === 'ini') {
        const text = serializeSkinToIni(project).replace(/\r?\n/g, '\r\n');
        const encoder = new TextEncoder();
        triggerDownload(encoder.encode(text), safeFile, 'text/plain;charset=utf-8');
        setStatusMessage(`${safeFile} başarıyla indirildi.`);
        return;
      }

      const opts: RmskinPackageOptions = {
        packageName,
        author,
        version,
        minimumRainmeter,
        minimumWindows,
        loadType: 'Skin',
        includeVariablesInc,
        includeReadme,
      };

      const archiveBytes = await buildSkinArchiveBytes(project, opts, mode === 'rmskin');
      if (mode === 'rmskin') {
        triggerDownload(
          archiveBytes,
          `${cleanPkgFile}.rmskin`,
          'application/octet-stream'
        );
        setStatusMessage(
          `${cleanPkgFile}.rmskin paketi (16-bayt SkinInstaller imzalı) oluşturuldu ve indirildi.`
        );
      } else {
        triggerDownload(archiveBytes, `${cleanPkgFile}.zip`, 'application/zip');
        setStatusMessage(`${cleanPkgFile}.zip arşiv paketi indirildi.`);
      }
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-sky-500" />
            <h2
              id="export-modal-title"
              className="text-base font-semibold text-slate-900 dark:text-slate-100"
            >
              Rainmeter Paketi Oluştur ve İndir (.rmskin)
            </h2>
          </div>
          <button
            type="button"
            aria-label="Paketleme penceresini kapat"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Package Metadata Form */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Paket Adı (RMSKIN Name)
              </label>
              <input
                type="text"
                aria-label="Paket adı"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Yazar (Author)
                </label>
                <input
                  type="text"
                  aria-label="Paket yazarı"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Sürüm (Version)
                </label>
                <input
                  type="text"
                  aria-label="Paket sürümü"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Min. Rainmeter
                </label>
                <input
                  type="text"
                  aria-label="Minimum Rainmeter sürümü"
                  value={minimumRainmeter}
                  onChange={(e) => setMinimumRainmeter(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Min. Windows
                </label>
                <select
                  aria-label="Minimum Windows sürümü"
                  value={minimumWindows}
                  onChange={(e) => setMinimumWindows(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="10.0">Windows 10 / 11 (10.0)</option>
                  <option value="6.1">Windows 7+ (6.1)</option>
                </select>
              </div>
            </div>

            <div className="pt-1 space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeVariablesInc}
                  onChange={(e) => setIncludeVariablesInc(e.target.checked)}
                  className="accent-sky-500"
                />
                <span>@Resources/Variables.inc dosyasını dahil et</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeReadme}
                  onChange={(e) => setIncludeReadme(e.target.checked)}
                  className="accent-sky-500"
                />
                <span>Türkçe/İngilizce kurulum kılavuzu (README.txt) ekle</span>
              </label>
            </div>
          </div>

          {/* Right Column: Live Package Tree Preview */}
          <div className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 mb-3">
                <FolderTree className="w-4 h-4 text-sky-500" />
                <span>Paket Dizin Yapısı Önizlemesi</span>
              </div>

              <ul className="space-y-1.5 text-xs font-mono text-slate-600 dark:text-slate-300">
                <li>├── RMSKIN.ini</li>
                <li>├── RMSKIN.bmp (400×60 24-bit başlık)</li>
                <li>└── Skins/</li>
                <li className="pl-5 text-sky-600 dark:text-sky-400">└── {safeFolder}/</li>
                <li className="pl-10">├── {safeFile}</li>
                {includeVariablesInc && project.variables.length > 0 && (
                  <li className="pl-10">├── @Resources/Variables.inc</li>
                )}
                {includeReadme && <li className="pl-10">└── README.txt</li>}
              </ul>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Oluşturulan <strong>.rmskin</strong> dosyası resmi Rainmeter{' '}
              <code>SkinInstaller.exe</code> 16-bayt ikili altbilgi imzasını içerir; çift tıklayarak doğrudan kurulur.
            </div>
          </div>
        </div>

        {statusMessage && (
          <div className="mx-6 mb-4 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Export Actions Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isBuilding}
              onClick={() => handleExport('zip')}
              className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Archive className="w-3.5 h-3.5" />
              .ZIP Arşivi İndir
            </button>

            <button
              type="button"
              disabled={isBuilding}
              onClick={() => handleExport('ini')}
              className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <FileCode className="w-3.5 h-3.5" />
              Sadece .INI İndir
            </button>
          </div>

          <button
            type="button"
            disabled={isBuilding}
            onClick={() => handleExport('rmskin')}
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center gap-2 shadow-xs transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            {isBuilding ? 'Paketleniyor...' : '.RMSKIN Paketi İndir'}
          </button>
        </div>
      </div>
    </div>
  );
};
