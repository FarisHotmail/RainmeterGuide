import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Download,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { SkinProject } from '../types/rainmeter';
import { parseIniToSkin, serializeSkinToIni } from '../utils/iniEngine';
import {
  AutocompleteSuggestion,
  getIniCompletions,
  IniDiagnostic,
  IniToken,
  tokenizeIniLine,
  validateIniCode,
} from '../utils/iniIntelligence';

interface IniCodePaneProps {
  project: SkinProject;
  isSplitMode?: boolean;
  onApplyParsedProject: (updated: SkinProject) => void;
  onNotify?: (message: string, tone?: 'success' | 'info' | 'warning') => void;
}

const SNIPPETS = [
  {
    label: '+ CPU Measure',
    code: '\n[MeasureCPUExtra]\nMeasure=CPU\nProcessor=0\n',
  },
  {
    label: '+ Saat Metni',
    code: '\n[MeterQuickTime]\nMeter=String\nMeasureName=MeasureTime\nX=28\nY=28\nFontSize=20\nFontColor=248,250,252,255\nAntiAlias=1\nText="%1"\n',
  },
  {
    label: '+ Cam Kart',
    code: '\n[MeterGlassBox]\nMeter=Shape\nX=16\nY=16\nW=240\nH=80\nShape=Rectangle 0,0,240,80,14 | Fill Color 15,23,42,200 | StrokeWidth 1 | Stroke Color 56,189,248,90\n',
  },
];

function tokenColorClass(type: IniToken['type']): string {
  switch (type) {
    case 'comment':
      return 'text-slate-500 italic';
    case 'section':
      return 'text-amber-300 font-semibold';
    case 'key':
      return 'text-sky-300';
    case 'operator':
      return 'text-slate-400';
    case 'variable':
      return 'text-purple-300 font-medium';
    case 'bang':
      return 'text-rose-300';
    case 'string':
      return 'text-emerald-300';
    case 'number':
      return 'text-teal-200';
    default:
      return 'text-slate-200';
  }
}

export const IniCodePane: React.FC<IniCodePaneProps> = ({
  project,
  isSplitMode = false,
  onApplyParsedProject,
  onNotify,
}) => {
  const canonicalIni = useMemo(() => serializeSkinToIni(project), [project]);
  const [draft, setDraft] = useState<string>(canonicalIni);
  const [isDirtyByUser, setIsDirtyByUser] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showDiagnosticsDrawer, setShowDiagnosticsDrawer] = useState<boolean>(false);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState<number>(0);
  const [replaceRange, setReplaceRange] = useState<{ start: number; end: number }>({
    start: 0,
    end: 0,
  });
  const [cursorLine, setCursorLine] = useState<number>(1);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const highlightPreRef = useRef<HTMLPreElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isDirtyByUser) {
      setDraft(canonicalIni);
    }
  }, [canonicalIni, isDirtyByUser]);

  const lines = useMemo(() => draft.split('\n'), [draft]);
  const tokenizedLines = useMemo(() => lines.map((line) => tokenizeIniLine(line)), [lines]);
  const diagnostics = useMemo(() => validateIniCode(draft), [draft]);

  const diagByLine = useMemo(() => {
    const map = new Map<number, IniDiagnostic>();
    for (const d of diagnostics) {
      const existing = map.get(d.line);
      if (!existing || (existing.severity === 'warning' && d.severity === 'error')) {
        map.set(d.line, d);
      }
    }
    return map;
  }, [diagnostics]);

  const errorCount = diagnostics.filter((d) => d.severity === 'error').length;
  const warningCount = diagnostics.filter((d) => d.severity === 'warning').length;

  // Auto-open diagnostics bar when errors appear
  useEffect(() => {
    if (errorCount > 0) {
      setShowDiagnosticsDrawer(true);
    }
  }, [errorCount]);

  const syncScroll = () => {
    if (!textareaRef.current) return;
    const top = textareaRef.current.scrollTop;
    const left = textareaRef.current.scrollLeft;
    if (highlightPreRef.current) {
      highlightPreRef.current.scrollTop = top;
      highlightPreRef.current.scrollLeft = left;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = top;
    }
  };

  const refreshAutocomplete = (code: string, cursorOffset: number) => {
    const lineNum = code.slice(0, cursorOffset).split('\n').length;
    setCursorLine(lineNum);
    const comp = getIniCompletions(code, cursorOffset, project);
    setSuggestions(comp.suggestions);
    setActiveSuggestionIdx(0);
    setReplaceRange({ start: comp.replaceStart, end: comp.replaceEnd });
  };

  const applyCodeUpdate = (nextText: string, cursorOffset?: number) => {
    setDraft(nextText);
    setIsDirtyByUser(true);

    if (cursorOffset !== undefined) {
      refreshAutocomplete(nextText, cursorOffset);
    }

    // Only push live updates to the visual canvas when there are no fatal section/syntax errors,
    // or allow live preview of valid parts
    try {
      const parsed = parseIniToSkin(nextText, project);
      onApplyParsedProject(parsed);
    } catch {
      // Keep draft editable even while mid-line typing
    }
  };

  const acceptSuggestion = (item: AutocompleteSuggestion) => {
    const nextCode =
      draft.slice(0, replaceRange.start) + item.insertText + draft.slice(replaceRange.end);
    const nextCursor = replaceRange.start + item.insertText.length;

    setSuggestions([]);
    applyCodeUpdate(nextCode, undefined);

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextCursor, nextCursor);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Space manual autocomplete trigger
    if ((e.ctrlKey || e.metaKey) && e.key === ' ') {
      e.preventDefault();
      const pos = e.currentTarget.selectionStart ?? 0;
      refreshAutocomplete(draft, pos);
      return;
    }

    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIdx((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIdx((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        acceptSuggestion(suggestions[activeSuggestionIdx]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setSuggestions([]);
        return;
      }
    }
  };

  const jumpToLine = (lineNum: number) => {
    if (!textareaRef.current) return;
    const allLines = draft.split('\n');
    const targetIdx = Math.max(0, Math.min(allLines.length - 1, lineNum - 1));
    const charOffset = allLines.slice(0, targetIdx).reduce((acc, l) => acc + l.length + 1, 0);
    const lineLen = allLines[targetIdx]?.length ?? 0;

    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(charOffset, charOffset + lineLen);
    const approxScroll = Math.max(0, (lineNum - 4) * 24);
    textareaRef.current.scrollTop = approxScroll;
    syncScroll();
    setCursorLine(lineNum);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      onNotify?.('.INI kaynak kodu panoya kopyalandı', 'success');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard restriction
    }
  };

  const handleDownloadIni = () => {
    const blob = new Blob([draft.replace(/\r?\n/g, '\r\n')], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fname = project.fileName.endsWith('.ini') ? project.fileName : `${project.fileName}.ini`;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    onNotify?.(`${fname} dosyası indirildi`, 'success');
  };

  return (
    <section
      aria-label="Canlı Rainmeter INI Kod Editörü"
      className={`${
        isSplitMode ? 'w-[372px] 2xl:w-[450px] shrink-0' : 'flex-1 min-w-0'
      } flex flex-col border-l border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 relative`}
    >
      {/* Editor Header Toolbar */}
      <div className="h-11 px-3.5 border-b border-slate-800 bg-slate-900 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Code2 className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="text-xs font-mono font-medium text-slate-200 truncate">
            {project.fileName}
          </span>

          {/* Live Diagnostics Status Button */}
          <button
            type="button"
            onClick={() => setShowDiagnosticsDrawer((v) => !v)}
            aria-label="Kod hata denetimi panelini aç veya kapat"
            className={`px-2 py-0.5 text-[11px] font-mono tabular-nums rounded flex items-center gap-1 transition-colors shrink-0 cursor-pointer ${
              errorCount > 0
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : warningCount > 0
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {errorCount > 0 ? (
              <>
                <AlertCircle className="w-3 h-3" />
                <span>{errorCount} Hata</span>
              </>
            ) : warningCount > 0 ? (
              <>
                <AlertTriangle className="w-3 h-3" />
                <span>{warningCount} Uyarı</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3" />
                <span>Sorunsuz</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isSplitMode &&
            SNIPPETS.map((snip) => (
              <button
                key={snip.label}
                type="button"
                onClick={() => {
                  applyCodeUpdate(draft.trimEnd() + '\n' + snip.code);
                  onNotify?.(`${snip.label} kod şablonu eklendi`, 'info');
                }}
                className="hidden xl:inline-flex px-2 py-1 text-[11px] font-mono rounded bg-slate-800 text-sky-300 hover:bg-slate-700 transition-colors whitespace-nowrap"
              >
                {snip.label}
              </button>
            ))}

          {isDirtyByUser && (
            <button
              type="button"
              onClick={() => {
                setIsDirtyByUser(false);
                setDraft(canonicalIni);
                setSuggestions([]);
                onNotify?.('INI kodu standart biçime hizalandı', 'info');
              }}
              title="Kodu biçimlendir"
              className="px-2 py-1 text-[11px] rounded bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 whitespace-nowrap"
            >
              <RotateCcw className="w-3 h-3" />
              Biçimle
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition-colors whitespace-nowrap"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadIni}
            className="px-2 py-1 text-xs rounded bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 font-medium flex items-center gap-1 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.ini</span>
          </button>
        </div>
      </div>

      {/* Syntax-Highlighted Editor Body with Synchronized Line Gutter */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Line Numbers + Error Indicators Gutter */}
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="w-12 py-4 px-1.5 text-right font-mono text-[11px] leading-6 text-slate-500 bg-slate-950 border-r border-slate-900 select-none overflow-hidden shrink-0 tabular-nums"
        >
          {lines.map((_, idx) => {
            const lineNum = idx + 1;
            const diag = diagByLine.get(lineNum);
            const isCurr = cursorLine === lineNum;
            return (
              <div
                key={lineNum}
                title={diag?.message}
                className={`px-1 rounded-xs flex items-center justify-end gap-1 ${
                  diag?.severity === 'error'
                    ? 'bg-rose-500/20 text-rose-300 font-semibold'
                    : diag?.severity === 'warning'
                    ? 'bg-amber-500/15 text-amber-300'
                    : isCurr
                    ? 'text-slate-200'
                    : ''
                }`}
              >
                {diag && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      diag.severity === 'error' ? 'bg-rose-400' : 'bg-amber-400'
                    }`}
                  />
                )}
                <span>{lineNum}</span>
              </div>
            );
          })}
        </div>

        {/* Overlay Syntax Highlighter + Transparent Editable Textarea */}
        <div className="flex-1 relative min-w-0 overflow-hidden bg-slate-950">
          <pre
            ref={highlightPreRef}
            aria-hidden="true"
            className="absolute inset-0 m-0 p-4 font-mono text-xs leading-6 whitespace-pre overflow-hidden pointer-events-none select-none"
          >
            {tokenizedLines.map((lineTokens, idx) => {
              const lineNum = idx + 1;
              const diag = diagByLine.get(lineNum);
              return (
                <div
                  key={idx}
                  className={`min-h-6 ${
                    diag?.severity === 'error'
                      ? 'bg-rose-500/10 underline decoration-wavy decoration-rose-400/80'
                      : diag?.severity === 'warning'
                      ? 'bg-amber-500/5 underline decoration-dotted decoration-amber-400/70'
                      : ''
                  }`}
                >
                  {lineTokens.length === 0 ? (
                    '\n'
                  ) : (
                    lineTokens.map((tok, tIdx) => (
                      <span key={tIdx} className={tokenColorClass(tok.type)}>
                        {tok.text}
                      </span>
                    ))
                  )}
                </div>
              );
            })}
          </pre>

          <textarea
            ref={textareaRef}
            aria-label="Rainmeter INI kaynak kodu"
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            wrap="off"
            value={draft}
            onScroll={syncScroll}
            onKeyDown={handleKeyDown}
            onClick={(e) => {
              const pos = e.currentTarget.selectionStart ?? 0;
              setCursorLine(draft.slice(0, pos).split('\n').length);
            }}
            onChange={(e) =>
              applyCodeUpdate(e.target.value, e.target.selectionStart ?? undefined)
            }
            onBlur={() => {
              setTimeout(() => setSuggestions([]), 160);
            }}
            className="code-editor absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-sky-400 selection:bg-sky-500/30 font-mono text-xs leading-6 resize-none focus:outline-none overflow-auto"
          />

          {/* Floating Context-Aware Autocomplete Popover */}
          {suggestions.length > 0 && (() => {
            const ta = textareaRef.current;
            const visibleY = ta ? 16 + (cursorLine - 1) * 24 - ta.scrollTop : 24;
            const anchorBottom = ta ? visibleY > ta.clientHeight * 0.55 : false;
            return (
              <div
                role="listbox"
                aria-label="Kod tamamlama önerileri"
                className={`absolute left-4 ${
                  anchorBottom ? 'bottom-12' : 'top-10'
                } z-30 w-80 max-w-[calc(100%-2rem)] rounded-lg bg-slate-900/98 border border-sky-500/40 shadow-2xl overflow-hidden backdrop-blur-md`}
              >
              <div className="px-2.5 py-1 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                <span className="inline-flex items-center gap-1 text-sky-400 font-medium">
                  <Sparkles className="w-3 h-3" />
                  Otomatik Tamamlama (Satır {cursorLine})
                </span>
                <span>Tab / Enter ile seç</span>
              </div>

              <div className="max-h-48 overflow-y-auto divide-y divide-slate-800/60">
                {suggestions.map((sug, idx) => {
                  const active = idx === activeSuggestionIdx;
                  return (
                    <button
                      key={`${sug.kind}_${sug.label}`}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        acceptSuggestion(sug);
                      }}
                      className={`w-full px-3 py-1.5 text-left flex items-center justify-between gap-2 text-xs transition-colors ${
                        active
                          ? 'bg-sky-500/20 text-white'
                          : 'text-slate-300 hover:bg-slate-800/80'
                      }`}
                    >
                      <span className="font-mono font-semibold text-sky-300 truncate">
                        {sug.label}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate">
                        {sug.detail}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            );
          })()}
        </div>
      </div>

      {/* Collapsible Diagnostics Drawer & Status Footer */}
      {showDiagnosticsDrawer && diagnostics.length > 0 && (
        <div
          aria-label="Kod denetim sorunları"
          className="max-h-40 overflow-y-auto border-t border-slate-800 bg-slate-900/95 divide-y divide-slate-800/80 shrink-0"
        >
          {diagnostics.map((diag, idx) => (
            <button
              key={`${diag.line}_${idx}`}
              type="button"
              onClick={() => jumpToLine(diag.line)}
              className="w-full px-3.5 py-2 text-left flex items-start gap-2 hover:bg-slate-800/70 transition-colors text-xs"
            >
              {diag.severity === 'error' ? (
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              )}
              <span className="font-mono text-[11px] text-slate-400 shrink-0 tabular-nums">
                Satır {diag.line}:
              </span>
              <span className="text-slate-200 leading-snug">{diag.message}</span>
            </button>
          ))}
        </div>
      )}

      <div className="h-7 px-3.5 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between gap-2 text-[11px] text-slate-400 font-mono tabular-nums whitespace-nowrap overflow-hidden shrink-0">
        <span className="shrink-0">
          Satır {cursorLine} / {lines.length}
        </span>
        <span className="truncate">
          {isSplitMode
            ? 'Ctrl+Space: Tamamlama'
            : 'Ctrl+Space: Tamamlama · #Değişken# · [!Bang]'}
        </span>
      </div>
    </section>
  );
};
