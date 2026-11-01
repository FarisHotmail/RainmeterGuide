export type MeterType =
  | 'String'
  | 'Image'
  | 'Shape'
  | 'Bar'
  | 'Roundline'
  | 'Histogram'
  | 'Line'
  | 'Rotator'
  | 'Button'
  | 'Bitmap';

export type MeasureType =
  | 'Time'
  | 'CPU'
  | 'Memory'
  | 'FreeDiskSpace'
  | 'NetIn'
  | 'NetOut'
  | 'NetTotal'
  | 'Uptime'
  | 'Calc'
  | 'Loop'
  | 'SysInfo'
  | 'Registry'
  | 'NowPlaying'
  | 'AudioLevel'
  | 'WebParser'
  | 'MediaKey'
  | 'RecycleManager'
  | 'Process';

export interface RainmeterSettings {
  Update: number;
  AccurateText: boolean;
  DynamicWindowSize: boolean;
  BackgroundMode: number; // 0=Image, 1=Transparent, 2=Solid, 3=Scale, 4=Tile
  SolidColor: string;
  BlurEnabled: boolean;
  BlurType: 'None' | 'Blur' | 'Acrylic';
  SkinWidth: number;
  SkinHeight: number;
  Draggable: boolean;
  SnapEdges: boolean;
  ClickThrough: boolean;
  KeepOnScreen: boolean;
  OnRefreshAction: string;
  ContextTitle: string;
  ContextAction: string;
}

export interface SkinMetadata {
  Name: string;
  Author: string;
  Information: string;
  Version: string;
  License: string;
}

export interface SkinVariable {
  id: string;
  key: string;
  value: string;
  category: 'Color' | 'Font' | 'Layout' | 'Custom';
  description?: string;
}

export interface SkinMeasure {
  id: string;
  name: string;
  type: MeasureType;
  disabled?: boolean;
  updateDivider: number;
  minValue?: number;
  maxValue?: number;
  invertMeasure?: boolean;
  // Specific options based on docs.rainmeter.net
  format?: string; // Time (%H:%M:%S), Uptime (%4!i!d %3!02i!h %2!02i!m)
  timeZone?: string;
  processor?: number; // CPU 0..N
  memoryType?: 'Physical' | 'Swap' | 'Total'; // Memory
  drive?: string; // FreeDiskSpace e.g. C:
  diskType?: 'Free' | 'Used' | 'Total' | 'Label';
  interface?: string; // Net
  useBits?: boolean;
  formula?: string; // Calc
  startValue?: number; // Loop
  endValue?: number;
  increment?: number;
  loopCount?: number;
  sysInfoType?: string; // SysInfo: COMPUTER_NAME, OS_VERSION, LAN_IP, AC_POWER, BATTERY_PERCENT, HOST_NAME
  sysInfoData?: string;
  regHKey?: string; // Registry
  regKey?: string;
  regValue?: string;
  playerName?: string; // NowPlaying: CAD, Spotify, AIMP, WMP, WebNowPlaying
  playerType?: 'TITLE' | 'ARTIST' | 'ALBUM' | 'COVER' | 'DURATION' | 'POSITION' | 'PROGRESS' | 'STATE';
  audioPort?: 'Output' | 'Input'; // AudioLevel
  fftSize?: number;
  fftAttack?: number;
  fftDecay?: number;
  bands?: number;
  bandIdx?: number;
  audioChannel?: 'Sum' | 'FL' | 'FR';
  audioType?: 'RMS' | 'Peak' | 'Band';
  url?: string; // WebParser
  regExp?: string;
  stringIndex?: number;
  processName?: string; // Process e.g. chrome.exe
  recycleType?: 'COUNT' | 'SIZE'; // RecycleManager
  // Conditionals & Substitutions
  substitute?: string;
  ifCondition?: string;
  ifTrueAction?: string;
  ifFalseAction?: string;
  ifAboveValue?: number;
  ifAboveAction?: string;
  ifBelowValue?: number;
  ifBelowAction?: string;
  extraOptions?: Record<string, string>;
}

export type ShapePrimitive = 'Rectangle' | 'Ellipse' | 'Line' | 'Arc' | 'Path';

export interface SkinMeter {
  id: string;
  name: string;
  type: MeterType;
  hidden?: boolean;
  locked?: boolean;
  group?: string;
  // General Geometry & Style
  x: number;
  y: number;
  w: number;
  h: number;
  padding?: string; // L,T,R,B
  solidColor?: string; // R,G,B,A or Hex
  solidColor2?: string;
  gradientAngle?: number;
  bevelType?: 0 | 1 | 2; // 0=None, 1=Raised, 2=Sunken
  antiAlias?: boolean;
  dynamicVariables?: boolean;
  container?: string;
  transformationMatrix?: string;
  // Measure Bindings
  measureName?: string;
  measureName2?: string;
  measureName3?: string;
  // String Meter Options
  text?: string;
  prefix?: string;
  postfix?: string;
  fontFace?: string;
  fontSize?: number;
  fontColor?: string;
  fontWeight?: number; // 100-900
  stringStyle?: 'Normal' | 'Bold' | 'Italic' | 'BoldItalic';
  stringAlign?: 'Left' | 'Center' | 'Right' | 'LeftCenter' | 'CenterCenter' | 'RightCenter';
  stringCase?: 'None' | 'Upper' | 'Lower' | 'Proper';
  stringEffect?: 'None' | 'Shadow' | 'Border';
  fontEffectColor?: string;
  clipString?: 0 | 1 | 2;
  percentual?: boolean;
  autoScale?: 0 | 1 | 2;
  numOfDecimals?: number;
  scale?: number;
  angle?: number; // Radians or degrees helper in UI
  // Shape Meter Options
  shapeType?: ShapePrimitive;
  shapeCornerRadius?: number;
  shapeFillColor?: string;
  shapeStrokeColor?: string;
  shapeStrokeWidth?: number;
  shapeRawDirective?: string; // Custom Rainmeter Shape=... override
  // Bar Meter Options
  barColor?: string;
  barOrientation?: 'Horizontal' | 'Vertical';
  barBorder?: number;
  flip?: boolean;
  // Roundline Meter Options
  lineWidth?: number;
  lineLength?: number;
  lineStart?: number;
  startAngle?: number; // Degrees in UI -> Radians in INI
  rotationAngle?: number; // Degrees in UI -> Radians in INI
  lineColor?: string;
  roundlineBgColor?: string;
  solid?: boolean;
  valueRemainder?: number;
  // Histogram & Line Meter Options
  primaryColor?: string;
  secondaryColor?: string;
  bothColors?: string;
  graphStart?: 'Right' | 'Left';
  graphOrientation?: 'Vertical' | 'Horizontal';
  lineCount?: number;
  horizontalLines?: boolean;
  horizontalLineColor?: string;
  // Image & Rotator & Button & Bitmap Options
  imageName?: string;
  imageTint?: string;
  imageAlpha?: number;
  greyScale?: boolean;
  preserveAspectRatio?: 0 | 1 | 2;
  offsetX?: number;
  offsetY?: number;
  buttonImage?: string;
  buttonCommand?: string;
  bitmapImage?: string;
  bitmapFrames?: number;
  bitmapZeroFrame?: boolean;
  bitmapExtend?: boolean;
  bitmapDigits?: number;
  // Mouse Action Bangs
  leftMouseUpAction?: string;
  rightMouseUpAction?: string;
  mouseOverAction?: string;
  mouseLeaveAction?: string;
  mouseScrollUpAction?: string;
  mouseScrollDownAction?: string;
  toolTipText?: string;
  toolTipTitle?: string;
  extraOptions?: Record<string, string>;
}

export interface SkinProject {
  id: string;
  folderName: string;
  fileName: string;
  metadata: SkinMetadata;
  rainmeter: RainmeterSettings;
  variables: SkinVariable[];
  measures: SkinMeasure[];
  meters: SkinMeter[];
}

export interface SimulatedTelemetry {
  timestamp: Date;
  cpuTotal: number;
  cpuCores: number[];
  ramPercent: number;
  ramUsedGB: number;
  ramTotalGB: number;
  swapPercent: number;
  diskFreePercent: number;
  diskUsedPercent: number;
  diskFreeGB: number;
  diskTotalGB: number;
  netInKbps: number;
  netOutKbps: number;
  uptimeSeconds: number;
  batteryPercent: number;
  acPower: number;
  recycleCount: number;
  recycleSizeMB: number;
  audioRms: number;
  audioBands: number[];
  nowPlaying: {
    title: string;
    artist: string;
    album: string;
    durationSec: number;
    positionSec: number;
    state: 1 | 2; // 1=Playing, 2=Paused
    coverType: 'prism' | 'minimal' | 'dark';
  };
  weatherTempC: number;
  weatherCondition: string;
  historyCpu: number[];
  historyRam: number[];
  historyNetIn: number[];
  historyNetOut: number[];
  manualOverride: boolean;
}
