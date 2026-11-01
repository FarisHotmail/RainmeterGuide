import {
  MeasureType,
  MeterType,
  RainmeterSettings,
  SkinMeasure,
  SkinMetadata,
  SkinMeter,
  SkinProject,
  SkinVariable,
} from '../types/rainmeter';

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

function degToRadStr(deg: number | undefined, fallbackDeg = 0): string {
  const val = ((deg ?? fallbackDeg) * DEG_TO_RAD);
  return val.toFixed(4);
}

function radToDegNum(radStr: string | undefined, fallbackDeg = 0): number {
  if (!radStr) return fallbackDeg;
  // Support expressions like (Rad(-90)) or raw numbers
  const radMatch = radStr.match(/Rad\(\s*(-?[\d.]+)\s*\)/i);
  if (radMatch) {
    return parseFloat(radMatch[1]);
  }
  const num = parseFloat(radStr);
  if (Number.isNaN(num)) return fallbackDeg;
  return Math.round(num * RAD_TO_DEG);
}

/**
 * Serializes a complete SkinProject into an authentic Rainmeter .ini configuration file.
 */
export function serializeSkinToIni(project: SkinProject): string {
  const lines: string[] = [];

  // [Rainmeter]
  lines.push('[Rainmeter]');
  lines.push(`Update=${project.rainmeter.Update}`);
  lines.push(`AccurateText=${project.rainmeter.AccurateText ? 1 : 0}`);
  lines.push(`DynamicWindowSize=${project.rainmeter.DynamicWindowSize ? 1 : 0}`);
  lines.push(`BackgroundMode=${project.rainmeter.BackgroundMode}`);
  if (project.rainmeter.BackgroundMode === 2 && project.rainmeter.SolidColor) {
    lines.push(`SolidColor=${project.rainmeter.SolidColor}`);
  }
  if (project.rainmeter.BlurEnabled && project.rainmeter.BlurType !== 'None') {
    lines.push('Blur=1');
    lines.push(`BlurRegion=${project.rainmeter.BlurType === 'Acrylic' ? 2 : 1},0,0,${project.rainmeter.SkinWidth},${project.rainmeter.SkinHeight},12`);
  }
  if (project.rainmeter.SkinWidth > 0) {
    lines.push(`SkinWidth=${project.rainmeter.SkinWidth}`);
  }
  if (project.rainmeter.SkinHeight > 0) {
    lines.push(`SkinHeight=${project.rainmeter.SkinHeight}`);
  }
  if (!project.rainmeter.Draggable) lines.push('Draggable=0');
  if (!project.rainmeter.SnapEdges) lines.push('SnapEdges=0');
  if (project.rainmeter.ClickThrough) lines.push('ClickThrough=1');
  if (!project.rainmeter.KeepOnScreen) lines.push('KeepOnScreen=0');
  if (project.rainmeter.OnRefreshAction) {
    lines.push(`OnRefreshAction=${project.rainmeter.OnRefreshAction}`);
  }
  if (project.rainmeter.ContextTitle) {
    lines.push(`ContextTitle=${project.rainmeter.ContextTitle}`);
  }
  if (project.rainmeter.ContextAction) {
    lines.push(`ContextAction=${project.rainmeter.ContextAction}`);
  }
  lines.push('');

  // [Metadata]
  lines.push('[Metadata]');
  lines.push(`Name=${project.metadata.Name}`);
  lines.push(`Author=${project.metadata.Author}`);
  lines.push(`Information=${project.metadata.Information}`);
  lines.push(`Version=${project.metadata.Version}`);
  lines.push(`License=${project.metadata.License}`);
  lines.push('');

  // [Variables]
  if (project.variables.length > 0) {
    lines.push('[Variables]');
    for (const v of project.variables) {
      if (v.key.trim()) {
        lines.push(`${v.key.trim()}=${v.value}`);
      }
    }
    lines.push('');
  }

  // [Measures]
  for (const m of project.measures) {
    lines.push(`[${m.name}]`);
    if (
      m.type === 'NowPlaying' ||
      m.type === 'AudioLevel' ||
      m.type === 'WebParser' ||
      m.type === 'MediaKey' ||
      m.type === 'RecycleManager' ||
      m.type === 'Process' ||
      m.type === 'SysInfo'
    ) {
      if (m.type === 'SysInfo') {
        lines.push('Measure=Plugin');
        lines.push('Plugin=SysInfo');
      } else {
        lines.push('Measure=Plugin');
        lines.push(`Plugin=${m.type}`);
      }
    } else {
      lines.push(`Measure=${m.type}`);
    }

    if (m.disabled) lines.push('Disabled=1');
    if (m.updateDivider && m.updateDivider !== 1) {
      lines.push(`UpdateDivider=${m.updateDivider}`);
    }
    if (m.minValue !== undefined) lines.push(`MinValue=${m.minValue}`);
    if (m.maxValue !== undefined) lines.push(`MaxValue=${m.maxValue}`);
    if (m.invertMeasure) lines.push('InvertMeasure=1');

    // Type-specific serialization
    switch (m.type) {
      case 'Time':
        if (m.format) lines.push(`Format=${m.format}`);
        if (m.timeZone) lines.push(`TimeZone=${m.timeZone}`);
        break;
      case 'CPU':
        lines.push(`Processor=${m.processor ?? 0}`);
        break;
      case 'Memory':
        // Physical, Swap or Total mapped to Rainmeter Memory/PhysicalMemory/SwapMemory if desired,
        // Note: Rainmeter supports Measure=PhysicalMemory or Measure=Memory
        break;
      case 'FreeDiskSpace':
        lines.push(`Drive=${m.drive || 'C:'}`);
        if (m.diskType === 'Total') lines.push('Total=1');
        if (m.diskType === 'Label') lines.push('Label=1');
        if (m.diskType === 'Used') lines.push('InvertMeasure=1');
        break;
      case 'NetIn':
      case 'NetOut':
      case 'NetTotal':
        if (m.interface) lines.push(`Interface=${m.interface}`);
        if (m.useBits) lines.push('UseBits=1');
        break;
      case 'Uptime':
        if (m.format) lines.push(`Format=${m.format}`);
        break;
      case 'Calc':
        lines.push(`Formula=${m.formula || '0'}`);
        break;
      case 'Loop':
        lines.push(`StartValue=${m.startValue ?? 1}`);
        lines.push(`EndValue=${m.endValue ?? 100}`);
        if (m.increment) lines.push(`Increment=${m.increment}`);
        if (m.loopCount !== undefined) lines.push(`LoopCount=${m.loopCount}`);
        break;
      case 'SysInfo':
        lines.push(`SysInfoType=${m.sysInfoType || 'COMPUTER_NAME'}`);
        if (m.sysInfoData) lines.push(`SysInfoData=${m.sysInfoData}`);
        break;
      case 'Registry':
        lines.push(`RegHKey=${m.regHKey || 'HKEY_CURRENT_USER'}`);
        if (m.regKey) lines.push(`RegKey=${m.regKey}`);
        if (m.regValue) lines.push(`RegValue=${m.regValue}`);
        break;
      case 'NowPlaying':
        lines.push(`PlayerName=${m.playerName || 'CAD'}`);
        lines.push(`PlayerType=${m.playerType || 'TITLE'}`);
        break;
      case 'AudioLevel':
        lines.push(`Port=${m.audioPort || 'Output'}`);
        if (m.fftSize) lines.push(`FFTSize=${m.fftSize}`);
        if (m.fftAttack) lines.push(`FFTAttack=${m.fftAttack}`);
        if (m.fftDecay) lines.push(`FFTDecay=${m.fftDecay}`);
        if (m.bands) lines.push(`Bands=${m.bands}`);
        if (m.bandIdx !== undefined) lines.push(`BandIdx=${m.bandIdx}`);
        if (m.audioChannel) lines.push(`Channel=${m.audioChannel}`);
        if (m.audioType) lines.push(`Type=${m.audioType}`);
        break;
      case 'WebParser':
        if (m.url) lines.push(`URL=${m.url}`);
        if (m.regExp) lines.push(`RegExp=${m.regExp}`);
        if (m.stringIndex !== undefined) lines.push(`StringIndex=${m.stringIndex}`);
        break;
      case 'RecycleManager':
        lines.push(`RecycleType=${m.recycleType || 'COUNT'}`);
        break;
      case 'Process':
        lines.push(`ProcessName=${m.processName || 'explorer.exe'}`);
        break;
      default:
        break;
    }

    if (m.substitute) lines.push(`Substitute=${m.substitute}`);
    if (m.ifCondition) lines.push(`IfCondition=${m.ifCondition}`);
    if (m.ifTrueAction) lines.push(`IfTrueAction=${m.ifTrueAction}`);
    if (m.ifFalseAction) lines.push(`IfFalseAction=${m.ifFalseAction}`);
    if (m.ifAboveValue !== undefined) lines.push(`IfAboveValue=${m.ifAboveValue}`);
    if (m.ifAboveAction) lines.push(`IfAboveAction=${m.ifAboveAction}`);
    if (m.ifBelowValue !== undefined) lines.push(`IfBelowValue=${m.ifBelowValue}`);
    if (m.ifBelowAction) lines.push(`IfBelowAction=${m.ifBelowAction}`);

    if (m.extraOptions) {
      for (const [k, val] of Object.entries(m.extraOptions)) {
        lines.push(`${k}=${val}`);
      }
    }
    lines.push('');
  }

  // [Meters]
  for (const meter of project.meters) {
    lines.push(`[${meter.name}]`);
    lines.push(`Meter=${meter.type}`);
    if (meter.measureName) lines.push(`MeasureName=${meter.measureName}`);
    if (meter.measureName2) lines.push(`MeasureName2=${meter.measureName2}`);
    if (meter.measureName3) lines.push(`MeasureName3=${meter.measureName3}`);

    lines.push(`X=${Math.round(meter.x)}`);
    lines.push(`Y=${Math.round(meter.y)}`);
    if (meter.w > 0 && meter.type !== 'Roundline') {
      lines.push(`W=${Math.round(meter.w)}`);
    } else if (meter.type === 'Roundline') {
      lines.push(`W=${Math.round(meter.w)}`);
    }
    if (meter.h > 0 && meter.type !== 'Roundline') {
      lines.push(`H=${Math.round(meter.h)}`);
    } else if (meter.type === 'Roundline') {
      lines.push(`H=${Math.round(meter.h)}`);
    }

    if (meter.hidden) lines.push('Hidden=1');
    if (meter.group) lines.push(`Group=${meter.group}`);
    if (meter.container) lines.push(`Container=${meter.container}`);
    if (meter.padding) lines.push(`Padding=${meter.padding}`);
    if (meter.solidColor && meter.type !== 'Shape') {
      lines.push(`SolidColor=${meter.solidColor}`);
    }
    if (meter.solidColor2 && meter.type !== 'Shape') {
      lines.push(`SolidColor2=${meter.solidColor2}`);
      if (meter.gradientAngle !== undefined) {
        lines.push(`GradientAngle=${meter.gradientAngle}`);
      }
    }
    if (meter.bevelType) lines.push(`BevelType=${meter.bevelType}`);

    switch (meter.type) {
      case 'String': {
        if (meter.fontFace) lines.push(`FontFace=${meter.fontFace}`);
        if (meter.fontSize) lines.push(`FontSize=${meter.fontSize}`);
        if (meter.fontColor) lines.push(`FontColor=${meter.fontColor}`);
        if (meter.fontWeight) lines.push(`FontWeight=${meter.fontWeight}`);
        if (meter.stringStyle && meter.stringStyle !== 'Normal') {
          lines.push(`StringStyle=${meter.stringStyle}`);
        }
        if (meter.stringAlign && meter.stringAlign !== 'Left') {
          lines.push(`StringAlign=${meter.stringAlign}`);
        }
        if (meter.stringCase && meter.stringCase !== 'None') {
          lines.push(`StringCase=${meter.stringCase}`);
        }
        if (meter.stringEffect && meter.stringEffect !== 'None') {
          lines.push(`StringEffect=${meter.stringEffect}`);
          if (meter.fontEffectColor) lines.push(`FontEffectColor=${meter.fontEffectColor}`);
        }
        if (meter.prefix) lines.push(`Prefix="${meter.prefix}"`);
        if (meter.postfix) lines.push(`Postfix="${meter.postfix}"`);
        if (meter.text !== undefined && meter.text !== '') {
          lines.push(`Text="${meter.text}"`);
        }
        if (meter.percentual) lines.push('Percentual=1');
        if (meter.autoScale) lines.push(`AutoScale=${meter.autoScale}`);
        if (meter.numOfDecimals !== undefined) lines.push(`NumOfDecimals=${meter.numOfDecimals}`);
        if (meter.clipString) lines.push(`ClipString=${meter.clipString}`);
        if (meter.angle) lines.push(`Angle=(Rad(${meter.angle}))`);
        break;
      }

      case 'Shape': {
        if (meter.shapeRawDirective) {
          lines.push(`Shape=${meter.shapeRawDirective}`);
        } else {
          const st = meter.shapeType || 'Rectangle';
          const fill = meter.shapeFillColor || '15,23,42,210';
          const stroke = meter.shapeStrokeColor || '148,163,184,60';
          const sw = meter.shapeStrokeWidth ?? 1;
          const cr = meter.shapeCornerRadius ?? 12;
          if (st === 'Rectangle') {
            lines.push(
              `Shape=Rectangle 0,0,${Math.round(meter.w)},${Math.round(meter.h)},${cr} | Fill Color ${fill} | StrokeWidth ${sw} | Stroke Color ${stroke}`
            );
          } else if (st === 'Ellipse') {
            const rx = Math.round(meter.w / 2);
            const ry = Math.round(meter.h / 2);
            lines.push(
              `Shape=Ellipse ${rx},${ry},${rx},${ry} | Fill Color ${fill} | StrokeWidth ${sw} | Stroke Color ${stroke}`
            );
          } else if (st === 'Line') {
            lines.push(
              `Shape=Line 0,${Math.round(meter.h / 2)},${Math.round(meter.w)},${Math.round(meter.h / 2)} | StrokeWidth ${Math.max(1, sw)} | Stroke Color ${fill}`
            );
          } else {
            lines.push(
              `Shape=Rectangle 0,0,${Math.round(meter.w)},${Math.round(meter.h)},${cr} | Fill Color ${fill} | StrokeWidth ${sw} | Stroke Color ${stroke}`
            );
          }
        }
        break;
      }

      case 'Bar': {
        lines.push(`BarColor=${meter.barColor || '56,189,248,255'}`);
        lines.push(`BarOrientation=${(meter.barOrientation || 'Horizontal').toUpperCase()}`);
        if (meter.barBorder) lines.push(`BarBorder=${meter.barBorder}`);
        if (meter.flip) lines.push('Flip=1');
        break;
      }

      case 'Roundline': {
        lines.push(`LineWidth=${meter.lineWidth ?? 6}`);
        lines.push(`LineLength=${meter.lineLength ?? Math.round(Math.min(meter.w, meter.h) / 2 - 4)}`);
        lines.push(`LineStart=${meter.lineStart ?? Math.round(Math.min(meter.w, meter.h) / 2 - (meter.lineWidth ?? 6) - 4)}`);
        lines.push(`StartAngle=${degToRadStr(meter.startAngle, -90)}`);
        lines.push(`RotationAngle=${degToRadStr(meter.rotationAngle, 360)}`);
        lines.push(`LineColor=${meter.lineColor || '56,189,248,255'}`);
        if (meter.solid !== false) lines.push('Solid=1');
        if (meter.valueRemainder) lines.push(`ValueRemainder=${meter.valueRemainder}`);
        break;
      }

      case 'Histogram': {
        lines.push(`PrimaryColor=${meter.primaryColor || '56,189,248,180'}`);
        if (meter.secondaryColor) lines.push(`SecondaryColor=${meter.secondaryColor}`);
        if (meter.bothColors) lines.push(`BothColors=${meter.bothColors}`);
        if (meter.graphStart) lines.push(`GraphStart=${meter.graphStart}`);
        if (meter.graphOrientation) lines.push(`GraphOrientation=${meter.graphOrientation}`);
        break;
      }

      case 'Line': {
        lines.push(`LineCount=${meter.lineCount || (meter.measureName2 ? 2 : 1)}`);
        lines.push(`LineColor=${meter.lineColor || meter.primaryColor || '56,189,248,255'}`);
        if (meter.secondaryColor) lines.push(`LineColor2=${meter.secondaryColor}`);
        lines.push(`LineWidth=${meter.lineWidth ?? 2}`);
        if (meter.horizontalLines) {
          lines.push('HorizontalLines=1');
          if (meter.horizontalLineColor) {
            lines.push(`HorizontalLineColor=${meter.horizontalLineColor}`);
          }
        }
        break;
      }

      case 'Image': {
        if (meter.imageName) lines.push(`ImageName=${meter.imageName}`);
        if (meter.imageTint) lines.push(`ImageTint=${meter.imageTint}`);
        if (meter.imageAlpha !== undefined) lines.push(`ImageAlpha=${meter.imageAlpha}`);
        if (meter.greyScale) lines.push('GreyScale=1');
        if (meter.preserveAspectRatio !== undefined) {
          lines.push(`PreserveAspectRatio=${meter.preserveAspectRatio}`);
        }
        break;
      }

      case 'Rotator': {
        if (meter.imageName) lines.push(`ImageName=${meter.imageName}`);
        lines.push(`OffsetX=${meter.offsetX ?? Math.round(meter.w / 2)}`);
        lines.push(`OffsetY=${meter.offsetY ?? Math.round(meter.h / 2)}`);
        lines.push(`StartAngle=${degToRadStr(meter.startAngle, 0)}`);
        lines.push(`RotationAngle=${degToRadStr(meter.rotationAngle, 360)}`);
        if (meter.valueRemainder) lines.push(`ValueRemainder=${meter.valueRemainder}`);
        break;
      }

      case 'Button': {
        lines.push(`ButtonImage=${meter.buttonImage || '#@#Images\\button.png'}`);
        if (meter.buttonCommand) lines.push(`ButtonCommand=${meter.buttonCommand}`);
        break;
      }

      case 'Bitmap': {
        lines.push(`BitmapImage=${meter.bitmapImage || '#@#Images\\digits.png'}`);
        lines.push(`BitmapFrames=${meter.bitmapFrames ?? 10}`);
        if (meter.bitmapZeroFrame) lines.push('BitmapZeroFrame=1');
        if (meter.bitmapExtend) lines.push('BitmapExtend=1');
        if (meter.bitmapDigits) lines.push(`BitmapDigits=${meter.bitmapDigits}`);
        break;
      }
    }

    if (meter.antiAlias !== false) lines.push('AntiAlias=1');
    if (meter.dynamicVariables) lines.push('DynamicVariables=1');

    // Mouse Actions
    if (meter.leftMouseUpAction) lines.push(`LeftMouseUpAction=${meter.leftMouseUpAction}`);
    if (meter.rightMouseUpAction) lines.push(`RightMouseUpAction=${meter.rightMouseUpAction}`);
    if (meter.mouseOverAction) lines.push(`MouseOverAction=${meter.mouseOverAction}`);
    if (meter.mouseLeaveAction) lines.push(`MouseLeaveAction=${meter.mouseLeaveAction}`);
    if (meter.toolTipText) lines.push(`ToolTipText=${meter.toolTipText}`);
    if (meter.toolTipTitle) lines.push(`ToolTipTitle=${meter.toolTipTitle}`);

    if (meter.extraOptions) {
      for (const [k, val] of Object.entries(meter.extraOptions)) {
        lines.push(`${k}=${val}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n').trim() + '\n';
}

const VALID_METER_TYPES = new Set<string>([
  'String',
  'Image',
  'Shape',
  'Bar',
  'Roundline',
  'Histogram',
  'Line',
  'Rotator',
  'Button',
  'Bitmap',
]);

const VALID_MEASURE_TYPES = new Set<string>([
  'Time',
  'CPU',
  'Memory',
  'FreeDiskSpace',
  'NetIn',
  'NetOut',
  'NetTotal',
  'Uptime',
  'Calc',
  'Loop',
  'SysInfo',
  'Registry',
  'NowPlaying',
  'AudioLevel',
  'WebParser',
  'MediaKey',
  'RecycleManager',
  'Process',
]);

function stripSurroundingQuotes(v: string): string {
  const t = v.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

/**
 * Parses a raw Rainmeter .ini text string back into a SkinProject model,
 * enabling two-way live editing between the Code Editor and Visual Drag-and-Drop Canvas.
 */
export function parseIniToSkin(iniContent: string, baseProject?: SkinProject): SkinProject {
  const rawSections: Array<{ name: string; entries: Record<string, string> }> = [];
  let currentSection: { name: string; entries: Record<string, string> } | null = null;

  const lines = iniContent.split(/\r?\n/);
  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith(';')) continue;

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const secName = trimmed.slice(1, -1).trim();
      currentSection = { name: secName, entries: {} };
      rawSections.push(currentSection);
      continue;
    }

    if (currentSection) {
      const eqIndex = rawLine.indexOf('=');
      if (eqIndex !== -1) {
        const key = rawLine.slice(0, eqIndex).trim();
        const val = rawLine.slice(eqIndex + 1).trim();
        if (key) {
          currentSection.entries[key] = val;
        }
      }
    }
  }

  const rainmeter: RainmeterSettings = {
    Update: 1000,
    AccurateText: true,
    DynamicWindowSize: true,
    BackgroundMode: 2,
    SolidColor: '0,0,0,1',
    BlurEnabled: false,
    BlurType: 'None',
    SkinWidth: baseProject?.rainmeter.SkinWidth ?? 420,
    SkinHeight: baseProject?.rainmeter.SkinHeight ?? 280,
    Draggable: true,
    SnapEdges: true,
    ClickThrough: false,
    KeepOnScreen: true,
    OnRefreshAction: '',
    ContextTitle: '',
    ContextAction: '',
  };

  const metadata: SkinMetadata = {
    Name: baseProject?.metadata.Name ?? 'Untitled Skin',
    Author: baseProject?.metadata.Author ?? 'RainCraft User',
    Information: baseProject?.metadata.Information ?? 'Created with RainCraft Studio',
    Version: baseProject?.metadata.Version ?? '1.0.0',
    License: baseProject?.metadata.License ?? 'Creative Commons BY-NC-SA 4.0',
  };

  const variables: SkinVariable[] = [];
  const measures: SkinMeasure[] = [];
  const meters: SkinMeter[] = [];

  for (const sec of rawSections) {
    const lowerName = sec.name.toLowerCase();
    const e = sec.entries;

    // Case-insensitive lookup helper
    const getVal = (key: string): string | undefined => {
      const match = Object.keys(e).find((k) => k.toLowerCase() === key.toLowerCase());
      return match ? e[match] : undefined;
    };

    if (lowerName === 'rainmeter') {
      if (getVal('Update')) rainmeter.Update = parseInt(getVal('Update')!, 10) || 1000;
      if (getVal('AccurateText')) rainmeter.AccurateText = getVal('AccurateText') !== '0';
      if (getVal('DynamicWindowSize')) rainmeter.DynamicWindowSize = getVal('DynamicWindowSize') !== '0';
      if (getVal('BackgroundMode')) rainmeter.BackgroundMode = parseInt(getVal('BackgroundMode')!, 10) || 0;
      if (getVal('SolidColor')) rainmeter.SolidColor = getVal('SolidColor')!;
      if (getVal('SkinWidth')) rainmeter.SkinWidth = parseInt(getVal('SkinWidth')!, 10) || rainmeter.SkinWidth;
      if (getVal('SkinHeight')) rainmeter.SkinHeight = parseInt(getVal('SkinHeight')!, 10) || rainmeter.SkinHeight;
      if (getVal('Blur') === '1') {
        rainmeter.BlurEnabled = true;
        rainmeter.BlurType = getVal('BlurRegion')?.startsWith('2') ? 'Acrylic' : 'Blur';
      }
      if (getVal('Draggable')) rainmeter.Draggable = getVal('Draggable') !== '0';
      if (getVal('ClickThrough')) rainmeter.ClickThrough = getVal('ClickThrough') === '1';
      if (getVal('ContextTitle')) rainmeter.ContextTitle = getVal('ContextTitle')!;
      if (getVal('ContextAction')) rainmeter.ContextAction = getVal('ContextAction')!;
      continue;
    }

    if (lowerName === 'metadata') {
      if (getVal('Name')) metadata.Name = getVal('Name')!;
      if (getVal('Author')) metadata.Author = getVal('Author')!;
      if (getVal('Information')) metadata.Information = getVal('Information')!;
      if (getVal('Version')) metadata.Version = getVal('Version')!;
      if (getVal('License')) metadata.License = getVal('License')!;
      continue;
    }

    if (lowerName === 'variables') {
      Object.entries(e).forEach(([k, val], idx) => {
        const lowerK = k.toLowerCase();
        let category: SkinVariable['category'] = 'Custom';
        if (lowerK.includes('color') || lowerK.includes('bg') || lowerK.includes('tint') || /^\d+\s*,\s*\d+/.test(val)) {
          category = 'Color';
        } else if (lowerK.includes('font') || lowerK.includes('size')) {
          category = 'Font';
        } else if (lowerK.includes('pad') || lowerK.includes('width') || lowerK.includes('scale')) {
          category = 'Layout';
        }
        variables.push({
          id: `var_${idx}_${k}`,
          key: k,
          value: val,
          category,
        });
      });
      continue;
    }

    const meterRaw = getVal('Meter');
    const measureRaw = getVal('Measure');

    if (measureRaw) {
      let resolvedType: MeasureType = 'Calc';
      const pluginRaw = getVal('Plugin')?.replace(/\.dll$/i, '');

      if (measureRaw.toLowerCase() === 'plugin' && pluginRaw) {
        const matchedPlugin = Array.from(VALID_MEASURE_TYPES).find(
          (t) => t.toLowerCase() === pluginRaw.toLowerCase()
        );
        if (matchedPlugin) resolvedType = matchedPlugin as MeasureType;
      } else if (measureRaw.toLowerCase() === 'physicalmemory') {
        resolvedType = 'Memory';
      } else {
        const matched = Array.from(VALID_MEASURE_TYPES).find(
          (t) => t.toLowerCase() === measureRaw.toLowerCase()
        );
        if (matched) resolvedType = matched as MeasureType;
      }

      const existingMeasure = baseProject?.measures.find((m) => m.name === sec.name);
      const measureObj: SkinMeasure = {
        id: existingMeasure?.id || `msr_${sec.name}`,
        name: sec.name,
        type: resolvedType,
        disabled: getVal('Disabled') === '1',
        updateDivider: parseInt(getVal('UpdateDivider') || '1', 10) || 1,
        minValue: getVal('MinValue') !== undefined ? parseFloat(getVal('MinValue')!) : undefined,
        maxValue: getVal('MaxValue') !== undefined ? parseFloat(getVal('MaxValue')!) : undefined,
        invertMeasure: getVal('InvertMeasure') === '1',
        format: getVal('Format'),
        timeZone: getVal('TimeZone'),
        processor: getVal('Processor') !== undefined ? parseInt(getVal('Processor')!, 10) : undefined,
        drive: getVal('Drive'),
        diskType:
          getVal('Total') === '1'
            ? 'Total'
            : getVal('Label') === '1'
            ? 'Label'
            : getVal('InvertMeasure') === '1'
            ? 'Used'
            : 'Free',
        formula: getVal('Formula'),
        startValue: getVal('StartValue') !== undefined ? parseFloat(getVal('StartValue')!) : undefined,
        endValue: getVal('EndValue') !== undefined ? parseFloat(getVal('EndValue')!) : undefined,
        increment: getVal('Increment') !== undefined ? parseFloat(getVal('Increment')!) : undefined,
        sysInfoType: getVal('SysInfoType'),
        sysInfoData: getVal('SysInfoData'),
        regHKey: getVal('RegHKey'),
        regKey: getVal('RegKey'),
        regValue: getVal('RegValue'),
        playerName: getVal('PlayerName'),
        playerType: (getVal('PlayerType')?.toUpperCase() as SkinMeasure['playerType']) || undefined,
        audioPort: (getVal('Port') as SkinMeasure['audioPort']) || undefined,
        bands: getVal('Bands') !== undefined ? parseInt(getVal('Bands')!, 10) : undefined,
        bandIdx: getVal('BandIdx') !== undefined ? parseInt(getVal('BandIdx')!, 10) : undefined,
        url: getVal('URL'),
        regExp: getVal('RegExp'),
        processName: getVal('ProcessName'),
        recycleType: (getVal('RecycleType')?.toUpperCase() as SkinMeasure['recycleType']) || undefined,
        substitute: getVal('Substitute'),
        ifCondition: getVal('IfCondition'),
        ifTrueAction: getVal('IfTrueAction'),
        ifFalseAction: getVal('IfFalseAction'),
      };
      measures.push(measureObj);
      continue;
    }

    if (meterRaw) {
      const matchedType =
        (Array.from(VALID_METER_TYPES).find(
          (t) => t.toLowerCase() === meterRaw.toLowerCase()
        ) as MeterType) || 'String';

      const existingMeter = baseProject?.meters.find((m) => m.name === sec.name);
      const x = parseFloat(getVal('X') || '0') || 0;
      const y = parseFloat(getVal('Y') || '0') || 0;
      let w = parseFloat(getVal('W') || '0') || 0;
      let h = parseFloat(getVal('H') || '0') || 0;

      // Parse Shape directive if present
      let shapeType: SkinMeter['shapeType'] = existingMeter?.shapeType || 'Rectangle';
      let shapeCornerRadius = existingMeter?.shapeCornerRadius ?? 12;
      let shapeFillColor = existingMeter?.shapeFillColor || '15,23,42,210';
      let shapeStrokeColor = existingMeter?.shapeStrokeColor || '148,163,184,60';
      let shapeStrokeWidth = existingMeter?.shapeStrokeWidth ?? 1;

      const shapeStr = getVal('Shape');
      if (shapeStr) {
        const parts = shapeStr.split('|').map((p) => p.trim());
        const geom = parts[0] || '';
        if (/^Rectangle/i.test(geom)) {
          shapeType = 'Rectangle';
          const nums = geom
            .replace(/^Rectangle\s+/i, '')
            .split(',')
            .map((n) => parseFloat(n.trim()));
          if (nums.length >= 4) {
            if (!w) w = nums[2];
            if (!h) h = nums[3];
            if (nums[4] !== undefined && !Number.isNaN(nums[4])) {
              shapeCornerRadius = nums[4];
            }
          }
        } else if (/^Ellipse/i.test(geom)) {
          shapeType = 'Ellipse';
          const nums = geom
            .replace(/^Ellipse\s+/i, '')
            .split(',')
            .map((n) => parseFloat(n.trim()));
          if (nums.length >= 4) {
            if (!w) w = nums[2] * 2;
            if (!h) h = nums[3] * 2;
          }
        } else if (/^Line/i.test(geom)) {
          shapeType = 'Line';
        }

        for (const attr of parts.slice(1)) {
          if (/^Fill\s+Color\s+/i.test(attr)) {
            shapeFillColor = attr.replace(/^Fill\s+Color\s+/i, '').trim();
          } else if (/^StrokeWidth\s+/i.test(attr)) {
            shapeStrokeWidth = parseFloat(attr.replace(/^StrokeWidth\s+/i, '').trim()) || 0;
          } else if (/^Stroke\s+Color\s+/i.test(attr)) {
            shapeStrokeColor = attr.replace(/^Stroke\s+Color\s+/i, '').trim();
          }
        }
      }

      if (!w) w = existingMeter?.w || (matchedType === 'Roundline' ? 96 : 160);
      if (!h) h = existingMeter?.h || (matchedType === 'Roundline' ? 96 : 36);

      const meterObj: SkinMeter = {
        id: existingMeter?.id || `mtr_${sec.name}`,
        name: sec.name,
        type: matchedType,
        hidden: getVal('Hidden') === '1',
        locked: existingMeter?.locked ?? false,
        group: getVal('Group'),
        x,
        y,
        w,
        h,
        padding: getVal('Padding'),
        solidColor: getVal('SolidColor'),
        solidColor2: getVal('SolidColor2'),
        gradientAngle: getVal('GradientAngle') ? parseFloat(getVal('GradientAngle')!) : undefined,
        bevelType: (parseInt(getVal('BevelType') || '0', 10) as 0 | 1 | 2) || 0,
        antiAlias: getVal('AntiAlias') !== '0',
        dynamicVariables: getVal('DynamicVariables') === '1',
        measureName: getVal('MeasureName'),
        measureName2: getVal('MeasureName2'),
        measureName3: getVal('MeasureName3'),
        text: getVal('Text') !== undefined ? stripSurroundingQuotes(getVal('Text')!) : undefined,
        prefix: getVal('Prefix') !== undefined ? stripSurroundingQuotes(getVal('Prefix')!) : undefined,
        postfix: getVal('Postfix') !== undefined ? stripSurroundingQuotes(getVal('Postfix')!) : undefined,
        fontFace: getVal('FontFace'),
        fontSize: getVal('FontSize') ? parseFloat(getVal('FontSize')!) : undefined,
        fontColor: getVal('FontColor'),
        fontWeight: getVal('FontWeight') ? parseInt(getVal('FontWeight')!, 10) : undefined,
        stringStyle: (getVal('StringStyle') as SkinMeter['stringStyle']) || 'Normal',
        stringAlign: (getVal('StringAlign') as SkinMeter['stringAlign']) || 'Left',
        stringCase: (getVal('StringCase') as SkinMeter['stringCase']) || 'None',
        stringEffect: (getVal('StringEffect') as SkinMeter['stringEffect']) || 'None',
        fontEffectColor: getVal('FontEffectColor'),
        percentual: getVal('Percentual') === '1',
        autoScale: (parseInt(getVal('AutoScale') || '0', 10) as 0 | 1 | 2) || 0,
        numOfDecimals:
          getVal('NumOfDecimals') !== undefined
            ? parseInt(getVal('NumOfDecimals')!, 10)
            : undefined,
        angle: getVal('Angle') ? radToDegNum(getVal('Angle'), 0) : undefined,
        shapeType,
        shapeCornerRadius,
        shapeFillColor,
        shapeStrokeColor,
        shapeStrokeWidth,
        barColor: getVal('BarColor'),
        barOrientation:
          getVal('BarOrientation')?.toUpperCase() === 'VERTICAL' ? 'Vertical' : 'Horizontal',
        flip: getVal('Flip') === '1',
        lineWidth: getVal('LineWidth') ? parseFloat(getVal('LineWidth')!) : undefined,
        lineLength: getVal('LineLength') ? parseFloat(getVal('LineLength')!) : undefined,
        lineStart: getVal('LineStart') ? parseFloat(getVal('LineStart')!) : undefined,
        startAngle: getVal('StartAngle') ? radToDegNum(getVal('StartAngle'), -90) : existingMeter?.startAngle,
        rotationAngle: getVal('RotationAngle')
          ? radToDegNum(getVal('RotationAngle'), 360)
          : existingMeter?.rotationAngle,
        lineColor: getVal('LineColor'),
        solid: getVal('Solid') !== '0',
        primaryColor: getVal('PrimaryColor') || getVal('LineColor'),
        secondaryColor: getVal('SecondaryColor') || getVal('LineColor2'),
        lineCount: getVal('LineCount') ? parseInt(getVal('LineCount')!, 10) : undefined,
        horizontalLines: getVal('HorizontalLines') === '1',
        horizontalLineColor: getVal('HorizontalLineColor'),
        imageName: getVal('ImageName'),
        imageTint: getVal('ImageTint'),
        imageAlpha: getVal('ImageAlpha') ? parseInt(getVal('ImageAlpha')!, 10) : undefined,
        greyScale: getVal('GreyScale') === '1',
        offsetX: getVal('OffsetX') ? parseFloat(getVal('OffsetX')!) : undefined,
        offsetY: getVal('OffsetY') ? parseFloat(getVal('OffsetY')!) : undefined,
        buttonImage: getVal('ButtonImage'),
        buttonCommand: getVal('ButtonCommand'),
        bitmapImage: getVal('BitmapImage'),
        bitmapFrames: getVal('BitmapFrames') ? parseInt(getVal('BitmapFrames')!, 10) : undefined,
        bitmapDigits: getVal('BitmapDigits') ? parseInt(getVal('BitmapDigits')!, 10) : undefined,
        leftMouseUpAction: getVal('LeftMouseUpAction'),
        rightMouseUpAction: getVal('RightMouseUpAction'),
        mouseOverAction: getVal('MouseOverAction'),
        mouseLeaveAction: getVal('MouseLeaveAction'),
        toolTipText: getVal('ToolTipText'),
        toolTipTitle: getVal('ToolTipTitle'),
      };

      meters.push(meterObj);
    }
  }

  return {
    id: baseProject?.id || 'custom_skin',
    folderName: baseProject?.folderName || metadata.Name.replace(/[^A-Za-z0-9_-]/g, '') || 'CustomSkin',
    fileName: baseProject?.fileName || `${metadata.Name.replace(/[^A-Za-z0-9_-]/g, '') || 'Skin'}.ini`,
    metadata,
    rainmeter,
    variables,
    measures,
    meters,
  };
}
