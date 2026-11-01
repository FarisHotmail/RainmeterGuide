import { SkinProject } from '../types/rainmeter';

export type DiagnosticSeverity = 'error' | 'warning';

export interface IniDiagnostic {
  line: number; // 1-indexed
  severity: DiagnosticSeverity;
  message: string;
  section?: string;
}

export interface IniToken {
  type:
    | 'comment'
    | 'section'
    | 'key'
    | 'operator'
    | 'string'
    | 'variable'
    | 'bang'
    | 'number'
    | 'value';
  text: string;
}

export interface AutocompleteSuggestion {
  label: string;
  insertText: string;
  detail: string;
  kind: 'section' | 'key' | 'value' | 'variable' | 'bang' | 'measure';
}

const KNOWN_METER_TYPES = new Set([
  'string',
  'image',
  'shape',
  'bar',
  'roundline',
  'histogram',
  'line',
  'rotator',
  'button',
  'bitmap',
]);

const KNOWN_MEASURE_TYPES = new Set([
  'time',
  'cpu',
  'memory',
  'physicalmemory',
  'swapmemory',
  'freediskspace',
  'netin',
  'netout',
  'nettotal',
  'uptime',
  'calc',
  'loop',
  'registry',
  'plugin',
  'nowplaying',
  'webparser',
  'mediakey',
  'sysinfo',
  'audiolevel',
  'recyclemanager',
  'process',
]);

const COMMON_KEYS: Array<{ key: string; detail: string; defaultVal: string }> = [
  { key: 'Meter', detail: 'Görsel bileşen türü (String, Shape, Bar...)', defaultVal: 'String' },
  { key: 'Measure', detail: 'Veri kaynağı türü (Time, CPU, Plugin...)', defaultVal: 'CPU' },
  { key: 'Plugin', detail: 'Rainmeter eklenti adı (NowPlaying, AudioLevel...)', defaultVal: 'NowPlaying' },
  { key: 'MeasureName', detail: 'Bağlanacak birincil veri kaynağı (%1)', defaultVal: '' },
  { key: 'MeasureName2', detail: 'Bağlanacak ikincil veri kaynağı (%2)', defaultVal: '' },
  { key: 'X', detail: 'Yatay konum (piksel)', defaultVal: '24' },
  { key: 'Y', detail: 'Dikey konum (piksel)', defaultVal: '24' },
  { key: 'W', detail: 'Genişlik (piksel)', defaultVal: '200' },
  { key: 'H', detail: 'Yükseklik (piksel)', defaultVal: '40' },
  { key: 'Text', detail: 'Gösterilecek metin şablonu ("%1")', defaultVal: '"%1"' },
  { key: 'Prefix', detail: 'Metin ön eki', defaultVal: '""' },
  { key: 'Postfix', detail: 'Metin son eki', defaultVal: '""' },
  { key: 'FontFace', detail: 'Yazı tipi ailesi', defaultVal: '#FontMain#' },
  { key: 'FontSize', detail: 'Yazı boyutu (pt)', defaultVal: '14' },
  { key: 'FontColor', detail: 'Yazı rengi (R,G,B,A veya #Değişken#)', defaultVal: '248,250,252,255' },
  { key: 'FontWeight', detail: 'Yazı kalınlığı (100-900)', defaultVal: '600' },
  { key: 'StringAlign', detail: 'Metin hizalama (Left, Center, Right)', defaultVal: 'Left' },
  { key: 'SolidColor', detail: 'Arka plan rengi (R,G,B,A)', defaultVal: '15,23,42,210' },
  { key: 'Shape', detail: 'Direct2D vektör şekil tanımı', defaultVal: 'Rectangle 0,0,200,80,12 | Fill Color 15,23,42,220' },
  { key: 'BarColor', detail: 'İlerleme çubuğu dolgu rengi', defaultVal: '#AccentColor#' },
  { key: 'BarOrientation', detail: 'Çubuk yönü (HORIZONTAL / VERTICAL)', defaultVal: 'HORIZONTAL' },
  { key: 'LineColor', detail: 'Roundline veya Line çizgi rengi', defaultVal: '#AccentColor#' },
  { key: 'LineWidth', detail: 'Çizgi veya halka kalınlığı', defaultVal: '6' },
  { key: 'StartAngle', detail: 'Başlangıç açısı (radyan)', defaultVal: '-1.5708' },
  { key: 'RotationAngle', detail: 'Dönüş açısı (radyan)', defaultVal: '6.2832' },
  { key: 'PrimaryColor', detail: 'Histogram birincil grafik rengi', defaultVal: '56,189,248,170' },
  { key: 'Format', detail: 'Time/Uptime biçim dizgesi (%H:%M:%S)', defaultVal: '%H:%M:%S' },
  { key: 'Formula', detail: 'Calc matematiksel formülü', defaultVal: '(50 + 25)' },
  { key: 'PlayerName', detail: 'NowPlaying medya oynatıcı (Spotify, CAD, AIMP)', defaultVal: 'Spotify' },
  { key: 'PlayerType', detail: 'NowPlaying veri türü (TITLE, ARTIST, PROGRESS)', defaultVal: 'TITLE' },
  { key: 'Update', detail: 'Kabuk yenileme aralığı (ms)', defaultVal: '1000' },
  { key: 'UpdateDivider', detail: 'Bölüm güncelleme çarpanı', defaultVal: '1' },
  { key: 'DynamicVariables', detail: 'Dinamik değişkenleri her adımda çöz (1/0)', defaultVal: '1' },
  { key: 'AntiAlias', detail: 'Kenar yumuşatma (1/0)', defaultVal: '1' },
  { key: 'LeftMouseUpAction', detail: 'Sol tıklama Rainmeter Bang eylemi', defaultVal: '[!Refresh]' },
  { key: 'RightMouseUpAction', detail: 'Sağ tıklama Rainmeter Bang eylemi', defaultVal: '[!SkinMenu]' },
  { key: 'MouseOverAction', detail: 'Fare üzerine gelme eylemi', defaultVal: '[!SetTransparency "255"]' },
  { key: 'MouseLeaveAction', detail: 'Fare ayrılma eylemi', defaultVal: '[!SetTransparency "210"]' },
  { key: 'Hidden', detail: 'Katmanı başlangıçta gizle (1/0)', defaultVal: '0' },
  { key: 'Group', detail: 'Bileşen grup adı', defaultVal: 'MainGroup' },
];

const COMMON_BANGS = [
  { label: '[!Refresh]', detail: 'Aktif kabuğu yeniden yükler' },
  { label: '[!Redraw]', detail: 'Tüm görsel katmanları yeniden çizer' },
  { label: '[!ToggleMeter "MeterName"]', detail: 'Belirtilen katmanı gizler/gösterir' },
  { label: '[!UpdateMeasure "MeasureName"]', detail: 'Veri kaynağını anında günceller' },
  { label: '[!CommandMeasure "MeasureName" "PlayPause"]', detail: 'Eklentiye medya komutu gönderir' },
  { label: '[!SetVariable "VarName" "Value"]', detail: 'Çalışma zamanında değişken günceller' },
  { label: '[!HideFade]', detail: 'Kabuğu yumuşak geçişle gizler' },
  { label: '[!SetTransparency "180"]', detail: 'Pencere saydamlığını ayarlar (0-255)' },
];

/**
 * Tokenizes a single line of Rainmeter `.ini` text for rich syntax highlighting.
 */
export function tokenizeIniLine(line: string): IniToken[] {
  if (!line) return [];
  const trimmed = line.trimStart();
  const leadingSpaces = line.slice(0, line.length - trimmed.length);
  const tokens: IniToken[] = [];

  if (leadingSpaces) {
    tokens.push({ type: 'value', text: leadingSpaces });
  }

  // Comment line
  if (trimmed.startsWith(';')) {
    tokens.push({ type: 'comment', text: trimmed });
    return tokens;
  }

  // Section header [SectionName]
  if (/^\[[^\]]*\]\s*$/.test(trimmed)) {
    tokens.push({ type: 'section', text: trimmed });
    return tokens;
  }

  // Key=Value pair
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) {
    tokens.push({ type: 'value', text: trimmed });
    return tokens;
  }

  const keyPart = trimmed.slice(0, eqIdx);
  const valPart = trimmed.slice(eqIdx + 1);

  tokens.push({ type: 'key', text: keyPart });
  tokens.push({ type: 'operator', text: '=' });

  // Tokenize value part for #Variables#, [!Bangs], "Strings", and Numbers
  const pattern = /(#[@A-Za-z0-9_]+#)|(\[![^\]]*\])|("[^"]*")|(\b-?\d+(?:\.\d+)?\b)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(valPart)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'value', text: valPart.slice(lastIndex, match.index) });
    }
    const full = match[0];
    if (match[1]) {
      tokens.push({ type: 'variable', text: full });
    } else if (match[2]) {
      tokens.push({ type: 'bang', text: full });
    } else if (match[3]) {
      tokens.push({ type: 'string', text: full });
    } else {
      tokens.push({ type: 'number', text: full });
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < valPart.length) {
    tokens.push({ type: 'value', text: valPart.slice(lastIndex) });
  }

  return tokens;
}

/**
 * Validates Rainmeter `.ini` source code and returns line-accurate errors and warnings.
 */
export function validateIniCode(iniContent: string): IniDiagnostic[] {
  const diagnostics: IniDiagnostic[] = [];
  const lines = iniContent.split(/\r?\n/);

  interface ParsedSectionInfo {
    name: string;
    startLine: number;
    entries: Array<{ key: string; value: string; line: number }>;
  }

  const sections: ParsedSectionInfo[] = [];
  const seenSectionsLower = new Map<string, number>();
  const definedVariablesLower = new Set<string>(['@', 'currentpath', 'rootconfigpath', 'skinpath']);
  const definedMeasuresLower = new Set<string>();

  let currentSection: ParsedSectionInfo | null = null;

  lines.forEach((rawLine, idx) => {
    const lineNum = idx + 1;
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith(';')) return;

    // Detect malformed section header like `[MeterClock` without closing `]`
    if (trimmed.startsWith('[') && !trimmed.includes('=')) {
      if (!trimmed.endsWith(']')) {
        diagnostics.push({
          line: lineNum,
          severity: 'error',
          message: 'Kapanmamış bölüm başlığı: "]" karakteri eksik.',
        });
        return;
      }
      const secName = trimmed.slice(1, -1).trim();
      if (!secName) {
        diagnostics.push({
          line: lineNum,
          severity: 'error',
          message: 'Boş bölüm başlığı "[]" kullanılamaz.',
        });
        return;
      }

      const lower = secName.toLowerCase();
      if (seenSectionsLower.has(lower)) {
        diagnostics.push({
          line: lineNum,
          severity: 'error',
          section: secName,
          message: `Yinelenen bölüm adı "[${secName}]" (ilk tanım satır ${seenSectionsLower.get(lower)}).`,
        });
      } else {
        seenSectionsLower.set(lower, lineNum);
      }

      currentSection = { name: secName, startLine: lineNum, entries: [] };
      sections.push(currentSection);
      return;
    }

    if (!currentSection) {
      diagnostics.push({
        line: lineNum,
        severity: 'error',
        message: 'Anahtar=Değer satırı bir [Bölüm] başlığının altında olmalıdır.',
      });
      return;
    }

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) {
      diagnostics.push({
        line: lineNum,
        severity: 'error',
        section: currentSection.name,
        message: `Geçersiz sözdizimi: "${trimmed}" satırında "=" atama operatörü eksik.`,
      });
      return;
    }

    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();

    if (!key) {
      diagnostics.push({
        line: lineNum,
        severity: 'error',
        section: currentSection.name,
        message: '"=" öncesinde anahtar adı boş bırakılamaz.',
      });
      return;
    }

    // Check unbalanced variable `#` markers (ignore `#@#` built-in resource shortcut)
    const strippedResource = value.replace(/#@#/g, '');
    const hashCount = (strippedResource.match(/#/g) || []).length;
    if (hashCount % 2 !== 0 && !/^#[0-9a-fA-F]{3,8}$/.test(value)) {
      diagnostics.push({
        line: lineNum,
        severity: 'warning',
        section: currentSection.name,
        message: 'Eşleşmeyen "#" değişken işareti tespit edildi (ör. #DeğişkenAdı#).',
      });
    }

    currentSection.entries.push({ key, value, line: lineNum });

    if (currentSection.name.toLowerCase() === 'variables') {
      definedVariablesLower.add(key.toLowerCase());
    }
  });

  // First pass over sections to collect defined measures and validate types
  for (const sec of sections) {
    const lowerSec = sec.name.toLowerCase();
    if (lowerSec === 'rainmeter' || lowerSec === 'metadata' || lowerSec === 'variables') {
      continue;
    }

    const meterEntry = sec.entries.find((e) => e.key.toLowerCase() === 'meter');
    const measureEntry = sec.entries.find((e) => e.key.toLowerCase() === 'measure');

    if (!meterEntry && !measureEntry) {
      diagnostics.push({
        line: sec.startLine,
        severity: 'warning',
        section: sec.name,
        message: `[${sec.name}] bölümünde "Meter=" veya "Measure=" tanımı bulunamadı.`,
      });
      continue;
    }

    if (measureEntry) {
      definedMeasuresLower.add(sec.name.toLowerCase());
      const mType = measureEntry.value.toLowerCase();
      if (!KNOWN_MEASURE_TYPES.has(mType)) {
        diagnostics.push({
          line: measureEntry.line,
          severity: 'error',
          section: sec.name,
          message: `Bilinmeyen Measure türü "${measureEntry.value}".`,
        });
      }
    }

    if (meterEntry) {
      const mtType = meterEntry.value.toLowerCase();
      if (!KNOWN_METER_TYPES.has(mtType)) {
        diagnostics.push({
          line: meterEntry.line,
          severity: 'error',
          section: sec.name,
          message: `Bilinmeyen Meter türü "${meterEntry.value}". Geçerli türler: String, Shape, Bar, Roundline, Image, Histogram, Line, Button, Rotator, Bitmap.`,
        });
      }
    }
  }

  // Second pass: validate MeasureName bindings, variable references, and RGBA colors
  const COLOR_KEYS = new Set([
    'fontcolor',
    'solidcolor',
    'solidcolor2',
    'barcolor',
    'linecolor',
    'primarycolor',
    'secondarycolor',
    'imagetint',
  ]);

  for (const sec of sections) {
    if (sec.name.toLowerCase() === 'variables') continue;

    for (const entry of sec.entries) {
      const kLower = entry.key.toLowerCase();

      // Check MeasureName, MeasureName2, MeasureName3 references
      if (kLower === 'measurename' || kLower === 'measurename2' || kLower === 'measurename3') {
        if (entry.value && !definedMeasuresLower.has(entry.value.toLowerCase())) {
          diagnostics.push({
            line: entry.line,
            severity: 'error',
            section: sec.name,
            message: `Tanımsız veri kaynağı "${entry.value}": [${entry.value}] adlı bir Measure bölümü bulunamadı.`,
          });
        }
      }

      // Check `#Variable#` references
      const varMatches = entry.value.matchAll(/#([A-Za-z0-9_]+)#/g);
      for (const vm of varMatches) {
        const refVar = vm[1];
        if (refVar && !definedVariablesLower.has(refVar.toLowerCase())) {
          diagnostics.push({
            line: entry.line,
            severity: 'warning',
            section: sec.name,
            message: `[Variables] altında tanımlanmamış değişken: "#${refVar}#".`,
          });
        }
      }

      // Check numeric RGBA ranges on color keys if written as R,G,B(,A)
      if (COLOR_KEYS.has(kLower) && entry.value.includes(',') && !entry.value.includes('#')) {
        const parts = entry.value.split(',').map((p) => Number(p.trim()));
        if (
          parts.length < 3 ||
          parts.length > 4 ||
          parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)
        ) {
          diagnostics.push({
            line: entry.line,
            severity: 'warning',
            section: sec.name,
            message: `Renk değeri "${entry.value}" 0-255 aralığında 3 veya 4 bileşen (R,G,B,A) içermelidir.`,
          });
        }
      }
    }
  }

  return diagnostics;
}

/**
 * Computes context-aware Rainmeter autocomplete suggestions at the current cursor offset.
 */
export function getIniCompletions(
  code: string,
  cursorOffset: number,
  project: SkinProject
): {
  suggestions: AutocompleteSuggestion[];
  replaceStart: number;
  replaceEnd: number;
} {
  const safeCursor = Math.max(0, Math.min(code.length, cursorOffset));
  const lineStart = code.lastIndexOf('\n', safeCursor - 1) + 1;
  const lineEndIdx = code.indexOf('\n', safeCursor);
  const lineEnd = lineEndIdx === -1 ? code.length : lineEndIdx;
  const lineBeforeCursor = code.slice(lineStart, safeCursor);

  // 1. Variable completion triggered by `#`
  const hashMatch = lineBeforeCursor.match(/#([A-Za-z0-9_]*)$/);
  if (hashMatch) {
    const query = hashMatch[1].toLowerCase();
    const replaceStart = safeCursor - hashMatch[0].length;
    const suggestions: AutocompleteSuggestion[] = [
      ...project.variables.map((v) => ({
        label: `#${v.key}#`,
        insertText: `#${v.key}#`,
        detail: `Değişken (${v.value})`,
        kind: 'variable' as const,
      })),
      {
        label: '#@#',
        insertText: '#@#',
        detail: '@Resources klasörü kısayolu',
        kind: 'variable' as const,
      },
    ].filter((s) => s.label.toLowerCase().includes(query));

    return { suggestions, replaceStart, replaceEnd: safeCursor };
  }

  // 2. Bang completion triggered by `[!`
  const bangMatch = lineBeforeCursor.match(/\[!([A-Za-z0-9_]*)$/);
  if (bangMatch) {
    const query = bangMatch[1].toLowerCase();
    const replaceStart = safeCursor - bangMatch[0].length;
    const suggestions: AutocompleteSuggestion[] = COMMON_BANGS.filter((b) =>
      b.label.toLowerCase().includes(query)
    ).map((b) => ({
      label: b.label,
      insertText: b.label,
      detail: b.detail,
      kind: 'bang',
    }));
    return { suggestions, replaceStart, replaceEnd: safeCursor };
  }

  // 3. Value completion after `Key=`
  const eqIdx = lineBeforeCursor.indexOf('=');
  if (eqIdx !== -1) {
    const keyName = lineBeforeCursor.slice(0, eqIdx).trim().toLowerCase();
    const valQuery = lineBeforeCursor.slice(eqIdx + 1).trimStart();
    const replaceStart = safeCursor - valQuery.length;

    if (keyName === 'meter') {
      const meterTypes = [
        { v: 'String', d: 'Metin ve sensör değeri' },
        { v: 'Shape', d: 'Direct2D vektör şekil' },
        { v: 'Bar', d: 'Yatay/dikey ilerleme çubuğu' },
        { v: 'Roundline', d: 'Dairesel halka gösterge' },
        { v: 'Image', d: 'Görsel veya albüm kapağı' },
        { v: 'Histogram', d: 'Zaman serisi alan grafiği' },
        { v: 'Line', d: 'Çizgi grafik' },
        { v: 'Button', d: 'Tıklanabilir düğme' },
        { v: 'Rotator', d: 'Dönen ibre / kadran' },
        { v: 'Bitmap', d: 'Sprite basamak göstergesi' },
      ];
      return {
        suggestions: meterTypes
          .filter((t) => t.v.toLowerCase().startsWith(valQuery.toLowerCase()))
          .map((t) => ({
            label: t.v,
            insertText: t.v,
            detail: t.d,
            kind: 'value',
          })),
        replaceStart,
        replaceEnd: safeCursor,
      };
    }

    if (keyName === 'measure') {
      const msrTypes = [
        { v: 'Time', d: 'Sistem saati ve tarihi' },
        { v: 'CPU', d: 'İşlemci kullanım yüzdesi' },
        { v: 'Memory', d: 'RAM bellek kullanımı' },
        { v: 'FreeDiskSpace', d: 'Sürücü disk alanı' },
        { v: 'NetIn', d: 'Ağ indirme hızı' },
        { v: 'NetOut', d: 'Ağ yükleme hızı' },
        { v: 'Uptime', d: 'Sistem açık kalma süresi' },
        { v: 'Calc', d: 'Matematiksel formül motoru' },
        { v: 'Plugin', d: 'Harici eklenti (NowPlaying, AudioLevel...)' },
      ];
      return {
        suggestions: msrTypes
          .filter((t) => t.v.toLowerCase().startsWith(valQuery.toLowerCase()))
          .map((t) => ({
            label: t.v,
            insertText: t.v,
            detail: t.d,
            kind: 'value',
          })),
        replaceStart,
        replaceEnd: safeCursor,
      };
    }

    if (keyName === 'measurename' || keyName === 'measurename2' || keyName === 'measurename3') {
      return {
        suggestions: project.measures
          .filter((m) => m.name.toLowerCase().includes(valQuery.toLowerCase()))
          .map((m) => ({
            label: m.name,
            insertText: m.name,
            detail: `Measure=${m.type}`,
            kind: 'measure',
          })),
        replaceStart,
        replaceEnd: safeCursor,
      };
    }

    if (keyName === 'stringalign') {
      return {
        suggestions: ['Left', 'Center', 'Right', 'LeftCenter', 'CenterCenter', 'RightCenter']
          .filter((a) => a.toLowerCase().startsWith(valQuery.toLowerCase()))
          .map((a) => ({
            label: a,
            insertText: a,
            detail: 'Metin hizalama modu',
            kind: 'value',
          })),
        replaceStart,
        replaceEnd: safeCursor,
      };
    }

    return { suggestions: [], replaceStart: safeCursor, replaceEnd: safeCursor };
  }

  // 4. Section header completion `[...`
  const secMatch = lineBeforeCursor.match(/^\s*\[([A-Za-z0-9_]*)$/);
  if (secMatch) {
    const q = secMatch[1].toLowerCase();
    const replaceStart = safeCursor - secMatch[1].length - 1;
    const secs = [
      { label: '[Rainmeter]', detail: 'Genel kabuk ayarları' },
      { label: '[Metadata]', detail: 'Yazar ve sürüm bilgileri' },
      { label: '[Variables]', detail: 'Paylaşılan değişken tanımları' },
      { label: '[MeasureNew]', detail: 'Yeni veri kaynağı bölümü' },
      { label: '[MeterNew]', detail: 'Yeni görsel katman bölümü' },
    ].filter((s) => s.label.toLowerCase().includes(q));

    return {
      suggestions: secs.map((s) => ({
        label: s.label,
        insertText: s.label,
        detail: s.detail,
        kind: 'section',
      })),
      replaceStart,
      replaceEnd: lineEnd,
    };
  }

  // 5. Key completion at start of line
  const keyMatch = lineBeforeCursor.match(/^\s*([A-Za-z][A-Za-z0-9]*)$/);
  if (keyMatch && keyMatch[1].length >= 1) {
    const q = keyMatch[1].toLowerCase();
    const replaceStart = safeCursor - keyMatch[1].length;
    const matched = COMMON_KEYS.filter((k) => k.key.toLowerCase().startsWith(q)).slice(0, 8);
    return {
      suggestions: matched.map((k) => ({
        label: k.key,
        insertText: `${k.key}=${k.defaultVal}`,
        detail: k.detail,
        kind: 'key',
      })),
      replaceStart,
      replaceEnd: safeCursor,
    };
  }

  return { suggestions: [], replaceStart: safeCursor, replaceEnd: safeCursor };
}
