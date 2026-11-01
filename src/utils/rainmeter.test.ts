import assert from 'node:assert/strict';
import test from 'node:test';
import { WIDGET_LIBRARY } from '../data/widgetLibrary';
import { SkinProject } from '../types/rainmeter';
import { hexAndAlphaToRainmeter, rainmeterColorToCss, resolveRainmeterVariables, toRainmeterColor } from './colorUtils';
import { parseIniToSkin, serializeSkinToIni } from './iniEngine';
import { getIniCompletions, tokenizeIniLine, validateIniCode } from './iniIntelligence';
import { appendRmskinBinaryFooter, buildRmskinManifest, buildSkinArchiveBytes } from './rmskinPackager';
import { buildVariableMap, evaluateMeasures, evaluateMeterText } from './simulationEngine';

const sampleProject: SkinProject = {
  id: 'test_skin',
  folderName: 'AuroraSystem',
  fileName: 'SystemMonitor.ini',
  metadata: {
    Name: 'Aurora System Monitor',
    Author: 'RainCraft',
    Information: 'Clean desktop monitor',
    Version: '1.2.0',
    License: 'MIT',
  },
  rainmeter: {
    Update: 1000,
    AccurateText: true,
    DynamicWindowSize: true,
    BackgroundMode: 2,
    SolidColor: '0,0,0,1',
    BlurEnabled: false,
    BlurType: 'None',
    SkinWidth: 360,
    SkinHeight: 220,
    Draggable: true,
    SnapEdges: true,
    ClickThrough: false,
    KeepOnScreen: true,
    OnRefreshAction: '',
    ContextTitle: '',
    ContextAction: '',
  },
  variables: [
    { id: 'v1', key: 'Accent', value: '56,189,248,255', category: 'Color' },
    { id: 'v2', key: 'MainFont', value: 'Segoe UI', category: 'Font' },
  ],
  measures: [
    { id: 'm1', name: 'MeasureTime', type: 'Time', updateDivider: 1, format: '%H:%M' },
    { id: 'm2', name: 'MeasureCPU', type: 'CPU', updateDivider: 1, processor: 0 },
  ],
  meters: [
    {
      id: 'mt1',
      name: 'MeterBackground',
      type: 'Shape',
      x: 0,
      y: 0,
      w: 360,
      h: 220,
      shapeType: 'Rectangle',
      shapeCornerRadius: 14,
      shapeFillColor: '15,23,42,220',
      shapeStrokeColor: '148,163,184,50',
      shapeStrokeWidth: 1,
    },
    {
      id: 'mt2',
      name: 'MeterClock',
      type: 'String',
      measureName: 'MeasureTime',
      x: 24,
      y: 20,
      w: 200,
      h: 48,
      fontFace: '#MainFont#',
      fontSize: 32,
      fontColor: '#Accent#',
      text: '%1',
    },
    {
      id: 'mt3',
      name: 'MeterCPUBar',
      type: 'Bar',
      measureName: 'MeasureCPU',
      x: 24,
      y: 120,
      w: 312,
      h: 8,
      barColor: '#Accent#',
      solidColor: '30,41,59,200',
      barOrientation: 'Horizontal',
    },
  ],
};

test('colorUtils converts Hex, RGBA and Rainmeter #Variable# strings cleanly', () => {
  assert.equal(toRainmeterColor('#38bdf8'), '56,189,248,255');
  assert.equal(hexAndAlphaToRainmeter('#0f172a', 200), '15,23,42,200');
  const vars = { Accent: '56,189,248,255' };
  assert.equal(resolveRainmeterVariables('Color is #Accent#', vars), 'Color is 56,189,248,255');
  assert.equal(rainmeterColorToCss('#Accent#', vars), 'rgba(56, 189, 248, 1)');
});

test('iniEngine round-trips SkinProject -> INI -> SkinProject accurately', () => {
  const ini = serializeSkinToIni(sampleProject);
  assert.ok(ini.includes('[Rainmeter]'));
  assert.ok(ini.includes('[MeasureTime]'));
  assert.ok(ini.includes('Shape=Rectangle 0,0,360,220,14'));
  assert.ok(ini.includes('BarOrientation=HORIZONTAL'));

  const parsed = parseIniToSkin(ini, sampleProject);
  assert.equal(parsed.metadata.Name, 'Aurora System Monitor');
  assert.equal(parsed.variables.length, 2);
  assert.equal(parsed.measures.length, 2);
  assert.equal(parsed.meters.length, 3);
  assert.equal(parsed.meters[1].x, 24);
  assert.equal(parsed.meters[1].fontSize, 32);
  assert.equal(parsed.meters[0].shapeCornerRadius, 14);
});

test('simulationEngine evaluates Time, CPU and String %1 bindings', () => {
  const fixedDate = new Date(2026, 10, 1, 14, 35, 9);
  const vars = buildVariableMap(sampleProject.variables);
  const evaluated = evaluateMeasures(
    sampleProject.measures,
    {
      timestamp: fixedDate,
      cpuTotal: 42,
      cpuCores: [40, 44, 38, 46],
      ramPercent: 64,
      ramUsedGB: 10.2,
      ramTotalGB: 16,
      swapPercent: 22,
      diskFreePercent: 58,
      diskUsedPercent: 42,
      diskFreeGB: 290,
      diskTotalGB: 500,
      netInKbps: 4200,
      netOutKbps: 920,
      uptimeSeconds: 18540,
      batteryPercent: 88,
      acPower: 1,
      recycleCount: 4,
      recycleSizeMB: 128,
      audioRms: 0.65,
      audioBands: [0.3, 0.7, 0.5, 0.8],
      nowPlaying: {
        title: 'Midnight Horizon',
        artist: 'Nordic Pulse',
        album: 'Atmospheres',
        durationSec: 240,
        positionSec: 96,
        state: 1,
        coverType: 'prism',
      },
      weatherTempC: 19,
      weatherCondition: 'Parçalı Bulutlu',
      historyCpu: [30, 35, 42],
      historyRam: [62, 63, 64],
      historyNetIn: [1200, 3100, 4200],
      historyNetOut: [400, 800, 920],
      manualOverride: false,
    },
    vars
  );

  assert.equal(evaluated.MeasureTime.stringValue, '14:35');
  assert.equal(evaluated.MeasureCPU.numeric, 42);
  assert.equal(evaluated.MeasureCPU.scaleRatio, 0.42);

  const renderedClock = evaluateMeterText(sampleProject.meters[1], evaluated, vars);
  assert.equal(renderedClock, '14:35');
});

test('rmskinPackager appends authentic 16-byte footer with int64 size and RMSKIN\\0 signature', async () => {
  const dummyZip = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0xaa, 0xbb]);
  const packed = appendRmskinBinaryFooter(dummyZip);
  assert.equal(packed.byteLength, dummyZip.byteLength + 16);

  const footerOffset = dummyZip.byteLength;
  const view = new DataView(packed.buffer, footerOffset, 16);
  assert.equal(view.getUint32(0, true), 6);
  assert.equal(view.getUint32(4, true), 0);
  assert.equal(packed[footerOffset + 8], 0x00);

  const signature = String.fromCharCode(...packed.slice(footerOffset + 9, footerOffset + 15));
  assert.equal(signature, 'RMSKIN');
  assert.equal(packed[footerOffset + 15], 0x00);

  const manifest = buildRmskinManifest(sampleProject, {
    packageName: 'Aurora Suite',
    author: 'RainCraft',
    version: '1.2.0',
    minimumRainmeter: '4.5.0',
    minimumWindows: '10.0',
    loadType: 'Skin',
    includeVariablesInc: true,
    includeReadme: true,
  });
  assert.ok(manifest.includes('Load=AuroraSystem\\SystemMonitor.ini'));

  const fullRmskin = await buildSkinArchiveBytes(
    sampleProject,
    {
      packageName: 'Aurora Suite',
      author: 'RainCraft',
      version: '1.2.0',
      minimumRainmeter: '4.5.0',
      minimumWindows: '10.0',
      loadType: 'Skin',
      includeVariablesInc: true,
      includeReadme: true,
    },
    true
  );
  assert.ok(fullRmskin.byteLength > 200);
  const tailSig = String.fromCharCode(...fullRmskin.slice(fullRmskin.byteLength - 7, fullRmskin.byteLength - 1));
  assert.equal(tailSig, 'RMSKIN');
});

test('iniIntelligence tokenizes INI lines, detects syntax/reference errors, and suggests completions', () => {
  const tokens = tokenizeIniLine('FontColor=#Accent#');
  assert.equal(tokens[0].type, 'key');
  assert.equal(tokens[1].type, 'operator');
  assert.equal(tokens[2].type, 'variable');

  // Clean serialized INI should produce 0 errors
  const validIni = serializeSkinToIni(sampleProject);
  const cleanDiagnostics = validateIniCode(validIni);
  assert.equal(cleanDiagnostics.filter((d) => d.severity === 'error').length, 0);

  // Broken INI should report unclosed section, missing '=', unknown meter, and undefined MeasureName
  const brokenIni = [
    '[Variables]',
    'Accent=56,189,248,255',
    '[UnclosedSection',
    '[MeterBad]',
    'Meter=UnknownWidgetType',
    'MeasureName=MissingMeasure',
    'BrokenLineWithoutEquals',
  ].join('\n');

  const errors = validateIniCode(brokenIni);
  assert.ok(errors.some((e) => e.line === 3 && e.severity === 'error'));
  assert.ok(errors.some((e) => e.line === 5 && e.message.includes('Bilinmeyen Meter türü')));
  assert.ok(errors.some((e) => e.line === 6 && e.message.includes('MissingMeasure')));
  assert.ok(errors.some((e) => e.line === 7 && e.message.includes('=')));

  // Autocomplete for MeasureName= should suggest MeasureTime & MeasureCPU
  const draft = '[MeterTest]\nMeasureName=Mea';
  const comp = getIniCompletions(draft, draft.length, sampleProject);
  assert.ok(comp.suggestions.some((s) => s.label === 'MeasureTime'));
  assert.ok(comp.suggestions.some((s) => s.label === 'MeasureCPU'));

  // Autocomplete for #Variable# should suggest #Accent#
  const varDraft = '[MeterTest]\nFontColor=#Acc';
  const varComp = getIniCompletions(varDraft, varDraft.length, sampleProject);
  assert.ok(varComp.suggestions.some((s) => s.label === '#Accent#'));
});

test('widgetLibrary instantiates composite widgets with valid linked measures and meters', () => {
  assert.ok(WIDGET_LIBRARY.length >= 8);
  for (const blueprint of WIDGET_LIBRARY) {
    const inst = blueprint.instantiate(40, 60, 'u1');
    assert.ok(inst.meters.length >= 1, `${blueprint.id} must create meters`);
    const measureNames = new Set(inst.measures.map((m) => m.name));
    for (const meter of inst.meters) {
      if (meter.measureName) {
        assert.ok(
          measureNames.has(meter.measureName),
          `${blueprint.id} meter ${meter.name} references missing measure ${meter.measureName}`
        );
      }
    }
  }
});
