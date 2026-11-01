import { SimulatedTelemetry, SkinMeasure, SkinMeter, SkinVariable } from '../types/rainmeter';
import { resolveRainmeterVariables } from './colorUtils';

export interface EvaluatedMeasureValue {
  numeric: number; // Raw numeric value
  scaleRatio: number; // Normalized 0.0 to 1.0 ratio for Bar/Roundline/Histogram
  stringValue: string; // Formatted string output
}

const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const DAYS_TR = [
  'Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi',
];

/**
 * Formats strftime codes commonly used in Rainmeter `Measure=Time` (e.g. %H:%M:%S, %A, %d %B %Y).
 */
export function formatRainmeterTime(date: Date, formatStr = '%H:%M'): string {
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const hours24 = date.getHours();
  const hours12 = hours24 % 12 || 12;

  return formatStr
    .replace(/%H/g, pad2(hours24))
    .replace(/%I/g, pad2(hours12))
    .replace(/%M/g, pad2(date.getMinutes()))
    .replace(/%S/g, pad2(date.getSeconds()))
    .replace(/%p/g, hours24 >= 12 ? 'PM' : 'AM')
    .replace(/%Y/g, String(date.getFullYear()))
    .replace(/%y/g, String(date.getFullYear()).slice(-2))
    .replace(/%m/g, pad2(date.getMonth() + 1))
    .replace(/%d/g, pad2(date.getDate()))
    .replace(/%#d/g, String(date.getDate()))
    .replace(/%A/g, DAYS_TR[date.getDay()])
    .replace(/%a/g, DAYS_TR[date.getDay()].slice(0, 3))
    .replace(/%B/g, MONTHS_TR[date.getMonth()])
    .replace(/%b/g, MONTHS_TR[date.getMonth()].slice(0, 3));
}

export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}g ${String(h).padStart(2, '0')}s ${String(m).padStart(2, '0')}d`;
  return `${String(h).padStart(2, '0')}s ${String(m).padStart(2, '0')}d`;
}

export function formatAutoScaleBytes(bytesPerSec: number): string {
  if (bytesPerSec >= 1024 * 1024 * 1024) {
    return `${(bytesPerSec / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  if (bytesPerSec >= 1024 * 1024) {
    return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytesPerSec >= 1024) {
    return `${(bytesPerSec / 1024).toFixed(0)} KB`;
  }
  return `${Math.round(bytesPerSec)} B`;
}

export function buildVariableMap(variables: SkinVariable[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const v of variables) {
    if (v.key) map[v.key] = v.value;
  }
  return map;
}

/**
 * Evaluates all Rainmeter measures for the current simulated telemetry frame.
 */
export function evaluateMeasures(
  measures: SkinMeasure[],
  telemetry: SimulatedTelemetry,
  variables: Record<string, string>
): Record<string, EvaluatedMeasureValue> {
  const results: Record<string, EvaluatedMeasureValue> = {};

  for (const m of measures) {
    if (m.disabled) {
      results[m.name] = { numeric: 0, scaleRatio: 0, stringValue: '0' };
      continue;
    }

    let numeric = 0;
    let minVal = m.minValue ?? 0;
    let maxVal = m.maxValue ?? 100;
    let stringValue = '';

    switch (m.type) {
      case 'Time': {
        const fmt = resolveRainmeterVariables(m.format || '%H:%M', variables);
        stringValue = formatRainmeterTime(telemetry.timestamp, fmt);
        if (fmt === '%S') {
          numeric = telemetry.timestamp.getSeconds();
          maxVal = 60;
        } else if (fmt === '%M') {
          numeric = telemetry.timestamp.getMinutes();
          maxVal = 60;
        } else if (fmt === '%H' || fmt === '%I') {
          numeric = telemetry.timestamp.getHours() % 12;
          maxVal = 12;
        } else {
          numeric = telemetry.timestamp.getSeconds();
          maxVal = 60;
        }
        break;
      }

      case 'CPU': {
        const core = m.processor ?? 0;
        numeric =
          core === 0
            ? telemetry.cpuTotal
            : telemetry.cpuCores[(core - 1) % telemetry.cpuCores.length] ?? telemetry.cpuTotal;
        maxVal = m.maxValue ?? 100;
        stringValue = `${Math.round(numeric)}`;
        break;
      }

      case 'Memory': {
        if (m.memoryType === 'Swap') {
          numeric = telemetry.swapPercent;
          maxVal = 100;
          stringValue = `${Math.round(numeric)}`;
        } else {
          numeric = telemetry.ramPercent;
          maxVal = 100;
          stringValue = `${Math.round(numeric)}`;
        }
        break;
      }

      case 'FreeDiskSpace': {
        if (m.diskType === 'Label') {
          numeric = 0;
          stringValue = m.drive === 'D:' ? 'ArchiveSSD' : 'SystemNVMe';
        } else if (m.diskType === 'Total') {
          numeric = telemetry.diskTotalGB;
          maxVal = telemetry.diskTotalGB;
          stringValue = `${telemetry.diskTotalGB} GB`;
        } else if (m.diskType === 'Used' || m.invertMeasure) {
          numeric = telemetry.diskUsedPercent;
          maxVal = 100;
          stringValue = `${Math.round(numeric)}`;
        } else {
          numeric = telemetry.diskFreePercent;
          maxVal = 100;
          stringValue = `${Math.round(telemetry.diskFreeGB)} GB`;
        }
        break;
      }

      case 'NetIn': {
        numeric = telemetry.netInKbps * 1024;
        maxVal = (m.maxValue ?? 10000) * 1024;
        stringValue = `${(telemetry.netInKbps / 1024).toFixed(1)} MB/s`;
        break;
      }

      case 'NetOut': {
        numeric = telemetry.netOutKbps * 1024;
        maxVal = (m.maxValue ?? 5000) * 1024;
        stringValue = `${(telemetry.netOutKbps / 1024).toFixed(1)} MB/s`;
        break;
      }

      case 'NetTotal': {
        const totalKbps = telemetry.netInKbps + telemetry.netOutKbps;
        numeric = totalKbps * 1024;
        maxVal = 15000 * 1024;
        stringValue = `${(totalKbps / 1024).toFixed(1)} MB/s`;
        break;
      }

      case 'Uptime': {
        numeric = telemetry.uptimeSeconds;
        maxVal = 86400 * 7;
        stringValue = formatUptime(telemetry.uptimeSeconds);
        break;
      }

      case 'Calc': {
        const rawFormula = resolveRainmeterVariables(m.formula || '50', variables);
        // Replace already-evaluated measure names in formula
        const substituted = rawFormula.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\b/g, (token) => {
          if (results[token]) return String(results[token].numeric);
          return token;
        });
        try {
          if (/^[\d\s+\-*/().%]+$/.test(substituted)) {
            // Safe arithmetic evaluation
            const val = Function(`"use strict"; return (${substituted});`)();
            numeric = typeof val === 'number' && Number.isFinite(val) ? val : 0;
          } else {
            numeric = parseFloat(substituted) || 0;
          }
        } catch {
          numeric = 0;
        }
        maxVal = m.maxValue ?? 100;
        stringValue = Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(1);
        break;
      }

      case 'Loop': {
        const start = m.startValue ?? 0;
        const end = m.endValue ?? 100;
        const span = Math.max(1, end - start);
        numeric = start + (telemetry.timestamp.getSeconds() % (span + 1));
        minVal = start;
        maxVal = end;
        stringValue = String(Math.round(numeric));
        break;
      }

      case 'SysInfo': {
        const st = (m.sysInfoType || 'COMPUTER_NAME').toUpperCase();
        if (st === 'BATTERY_PERCENT') {
          numeric = telemetry.batteryPercent;
          maxVal = 100;
          stringValue = `${telemetry.batteryPercent}%`;
        } else if (st === 'LAN_IP') {
          stringValue = '192.168.1.42';
          numeric = 1;
        } else if (st === 'OS_VERSION') {
          stringValue = 'Windows 11 Pro 24H2';
          numeric = 11;
        } else {
          stringValue = 'WORKSTATION-PRO';
          numeric = 1;
        }
        break;
      }

      case 'NowPlaying': {
        const pt = m.playerType || 'TITLE';
        const np = telemetry.nowPlaying;
        if (pt === 'TITLE') stringValue = np.title;
        else if (pt === 'ARTIST') stringValue = np.artist;
        else if (pt === 'ALBUM') stringValue = np.album;
        else if (pt === 'PROGRESS') {
          numeric = (np.positionSec / Math.max(1, np.durationSec)) * 100;
          maxVal = 100;
          stringValue = `${Math.round(numeric)}%`;
        } else if (pt === 'POSITION') {
          const min = Math.floor(np.positionSec / 60);
          const sec = np.positionSec % 60;
          numeric = np.positionSec;
          maxVal = np.durationSec;
          stringValue = `${min}:${String(sec).padStart(2, '0')}`;
        } else if (pt === 'DURATION') {
          const min = Math.floor(np.durationSec / 60);
          const sec = np.durationSec % 60;
          numeric = np.durationSec;
          stringValue = `${min}:${String(sec).padStart(2, '0')}`;
        } else if (pt === 'STATE') {
          numeric = np.state;
          stringValue = np.state === 1 ? 'Playing' : 'Paused';
        } else {
          stringValue = np.title;
        }
        break;
      }

      case 'AudioLevel': {
        const bandIdx = m.bandIdx;
        if (bandIdx !== undefined && telemetry.audioBands.length > 0) {
          numeric = telemetry.audioBands[bandIdx % telemetry.audioBands.length] * 100;
        } else {
          numeric = telemetry.audioRms * 100;
        }
        maxVal = 100;
        stringValue = `${Math.round(numeric)}%`;
        break;
      }

      case 'WebParser': {
        const idx = m.stringIndex ?? 1;
        if (idx === 2) {
          stringValue = telemetry.weatherCondition;
          numeric = telemetry.weatherTempC;
        } else {
          numeric = telemetry.weatherTempC;
          stringValue = `${telemetry.weatherTempC}°C`;
        }
        maxVal = 50;
        break;
      }

      case 'RecycleManager': {
        if (m.recycleType === 'SIZE') {
          numeric = telemetry.recycleSizeMB;
          maxVal = 2048;
          stringValue = `${telemetry.recycleSizeMB} MB`;
        } else {
          numeric = telemetry.recycleCount;
          maxVal = 100;
          stringValue = `${telemetry.recycleCount} öğe`;
        }
        break;
      }

      case 'Registry': {
        stringValue = 'DarkTheme';
        numeric = 1;
        break;
      }

      case 'Process': {
        numeric = 1;
        maxVal = 1;
        stringValue = 'Çalışıyor';
        break;
      }

      default: {
        numeric = 50;
        maxVal = 100;
        stringValue = '50';
      }
    }

    const span = Math.max(0.0001, maxVal - minVal);
    let ratio = Math.max(0, Math.min(1, (numeric - minVal) / span));
    if (m.invertMeasure && m.type !== 'FreeDiskSpace') {
      ratio = 1 - ratio;
    }

    results[m.name] = {
      numeric,
      scaleRatio: ratio,
      stringValue,
    };
  }

  return results;
}

/**
 * Formats a String meter's final displayed text using Prefix, Text (%1, %2, %3), Postfix,
 * `#Variables#`, Percentual, AutoScale, and StringCase.
 */
export function evaluateMeterText(
  meter: SkinMeter,
  evaluatedMeasures: Record<string, EvaluatedMeasureValue>,
  variables: Record<string, string>
): string {
  const m1 = meter.measureName ? evaluatedMeasures[meter.measureName] : undefined;
  const m2 = meter.measureName2 ? evaluatedMeasures[meter.measureName2] : undefined;
  const m3 = meter.measureName3 ? evaluatedMeasures[meter.measureName3] : undefined;

  const formatBound = (ev: EvaluatedMeasureValue | undefined): string => {
    if (!ev) return '';
    if (meter.autoScale === 1) {
      return formatAutoScaleBytes(ev.numeric);
    }
    if (meter.percentual) {
      const pct = ev.scaleRatio * 100;
      return meter.numOfDecimals !== undefined
        ? pct.toFixed(meter.numOfDecimals)
        : String(Math.round(pct));
    }
    if (meter.numOfDecimals !== undefined && !Number.isNaN(Number(ev.stringValue))) {
      return ev.numeric.toFixed(meter.numOfDecimals);
    }
    return ev.stringValue;
  };

  const s1 = formatBound(m1);
  const s2 = formatBound(m2);
  const s3 = formatBound(m3);

  let body = meter.text !== undefined && meter.text !== '' ? meter.text : meter.measureName ? '%1' : '';
  body = resolveRainmeterVariables(body, variables);
  body = body.replace(/%1/g, s1).replace(/%2/g, s2).replace(/%3/g, s3);

  // Also resolve `[MeasureName]` section variable syntax if DynamicVariables=1
  body = body.replace(/\[([A-Za-z0-9_]+)\]/g, (full, mName) => {
    if (evaluatedMeasures[mName]) return evaluatedMeasures[mName].stringValue;
    return full;
  });

  const prefix = resolveRainmeterVariables(meter.prefix || '', variables);
  const postfix = resolveRainmeterVariables(meter.postfix || '', variables);
  let combined = `${prefix}${body}${postfix}`;

  if (meter.stringCase === 'Upper') combined = combined.toUpperCase();
  else if (meter.stringCase === 'Lower') combined = combined.toLowerCase();
  else if (meter.stringCase === 'Proper') {
    combined = combined.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return combined;
}
