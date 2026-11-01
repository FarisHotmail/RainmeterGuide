/**
 * Converts Hex (#RRGGBB or #RRGGBBAA), rgba(...), or Rainmeter "R,G,B,A" string
 * into standard Rainmeter "R,G,B,A" format, or preserves variable references like #AccentColor#.
 */
export function toRainmeterColor(input: string | undefined, fallback = '255,255,255,255'): string {
  if (!input) return fallback;
  const trimmed = input.trim();
  if (trimmed.includes('#') && trimmed.endsWith('#') && trimmed.length > 2) {
    // Variable reference like #Color1# or #Accent#,200
    return trimmed;
  }
  if (/^\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(\s*,\s*\d{1,3})?$/.test(trimmed)) {
    const parts = trimmed.split(',').map((p) => Math.max(0, Math.min(255, parseInt(p.trim(), 10) || 0)));
    if (parts.length === 3) parts.push(255);
    return parts.join(',');
  }
  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return `${r},${g},${b},255`;
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `${r},${g},${b},255`;
    }
    if (hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = parseInt(hex.slice(6, 8), 16);
      return `${r},${g},${b},${a}`;
    }
  }
  return trimmed;
}

/**
 * Resolves Rainmeter variables `#VarName#` inside any string before CSS color or text evaluation.
 */
export function resolveRainmeterVariables(
  raw: string | undefined,
  variables: Record<string, string>
): string {
  if (!raw) return '';
  return raw.replace(/#([A-Za-z0-9_]+)#/g, (match, varName) => {
    if (Object.prototype.hasOwnProperty.call(variables, varName)) {
      return variables[varName];
    }
    //Case-insensitive lookup as Rainmeter is case-insensitive
    const foundKey = Object.keys(variables).find(
      (k) => k.toLowerCase() === varName.toLowerCase()
    );
    return foundKey ? variables[foundKey] : match;
  });
}

/**
 * Converts a Rainmeter color ("R,G,B,A", "R,G,B", "RRGGBBAA", or "#RRGGBB")
 * into browser CSS `rgba(r, g, b, a)`.
 */
export function rainmeterColorToCss(
  rawColor: string | undefined,
  variables: Record<string, string> = {},
  fallback = 'rgba(255, 255, 255, 1)'
): string {
  if (!rawColor) return fallback;
  const resolved = resolveRainmeterVariables(rawColor, variables).trim();
  if (!resolved) return fallback;

  // R,G,B,A or R,G,B
  if (resolved.includes(',')) {
    const nums = resolved.split(',').map((s) => parseFloat(s.trim()));
    if (nums.length >= 3 && nums.slice(0, 3).every((n) => !Number.isNaN(n))) {
      const r = Math.max(0, Math.min(255, Math.round(nums[0])));
      const g = Math.max(0, Math.min(255, Math.round(nums[1])));
      const b = Math.max(0, Math.min(255, Math.round(nums[2])));
      const a = nums.length >= 4 && !Number.isNaN(nums[3])
        ? Math.max(0, Math.min(1, nums[3] / 255))
        : 1;
      return `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(3))})`;
    }
  }

  // Hex with or without #
  const cleanHex = resolved.startsWith('#') ? resolved.slice(1) : resolved;
  if (/^[0-9a-fA-F]{6}$/.test(cleanHex)) {
    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 1)`;
  }
  if (/^[0-9a-fA-F]{8}$/.test(cleanHex)) {
    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);
    const a = parseInt(cleanHex.slice(6, 8), 16) / 255;
    return `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(3))})`;
  }

  return resolved;
}

/**
 * Extracts a 6-digit `#rrggbb` hex and 0-255 alpha integer for HTML color inputs.
 */
export function parseColorForPicker(
  rawColor: string | undefined,
  variables: Record<string, string> = {}
): { hex: string; alpha: number } {
  const css = rainmeterColorToCss(rawColor, variables, 'rgba(255, 255, 255, 1)');
  const match = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) {
    return { hex: '#ffffff', alpha: 255 };
  }
  const r = Math.min(255, Math.max(0, parseInt(match[1], 10)));
  const g = Math.min(255, Math.max(0, parseInt(match[2], 10)));
  const b = Math.min(255, Math.max(0, parseInt(match[3], 10)));
  const aFloat = match[4] !== undefined ? parseFloat(match[4]) : 1;
  const hex =
    '#' +
    [r, g, b]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('');
  return {
    hex,
    alpha: Math.round(Math.min(1, Math.max(0, aFloat)) * 255),
  };
}

export function hexAndAlphaToRainmeter(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2) || 'ff', 16);
  const g = parseInt(clean.slice(2, 4) || 'ff', 16);
  const b = parseInt(clean.slice(4, 6) || 'ff', 16);
  const a = Math.max(0, Math.min(255, Math.round(alpha)));
  return `${r},${g},${b},${a}`;
}
