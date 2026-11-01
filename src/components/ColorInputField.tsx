import React from 'react';
import { SkinVariable } from '../types/rainmeter';
import { hexAndAlphaToRainmeter, parseColorForPicker, rainmeterColorToCss } from '../utils/colorUtils';
import { buildVariableMap } from '../utils/simulationEngine';

interface ColorInputFieldProps {
  label: string;
  value: string | undefined;
  onChange: (newVal: string) => void;
  variables: SkinVariable[];
  fallback?: string;
}

export const ColorInputField: React.FC<ColorInputFieldProps> = ({
  label,
  value,
  onChange,
  variables,
  fallback = '255,255,255,255',
}) => {
  const varMap = buildVariableMap(variables);
  const currentVal = value ?? fallback;
  const parsed = parseColorForPicker(currentVal, varMap);
  const cssSwatch = rainmeterColorToCss(currentVal, varMap);
  const colorVariables = variables.filter((v) => v.category === 'Color');

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
          {label}
        </label>
        {colorVariables.length > 0 && (
          <select
            aria-label={`${label} değişken seçimi`}
            value={currentVal.startsWith('#') && currentVal.endsWith('#') ? currentVal : ''}
            onChange={(e) => {
              if (e.target.value) onChange(e.target.value);
            }}
            className="text-[11px] bg-transparent text-sky-600 dark:text-sky-400 hover:underline focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200">
              #Değişken# bağla
            </option>
            {colorVariables.map((cv) => (
              <option
                key={cv.id}
                value={`#${cv.key}#`}
                className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
              >
                #{cv.key}#
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-2">
        <label
          className="relative w-8 h-8 rounded-md border border-slate-300 dark:border-slate-700 shrink-0 overflow-hidden cursor-pointer shadow-xs"
          title="Renk seçici aç"
        >
          <span
            className="block w-full h-full"
            style={{ backgroundColor: cssSwatch }}
          />
          <input
            type="color"
            aria-label={`${label} renk seçici`}
            value={parsed.hex}
            onChange={(e) => {
              onChange(hexAndAlphaToRainmeter(e.target.value, parsed.alpha));
            }}
            className="sr-only"
          />
        </label>

        <input
          type="text"
          aria-label={label}
          value={currentVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder="255,255,255,255 veya #Accent#"
          className="flex-1 min-w-0 px-2.5 py-1.5 text-xs font-mono tabular-nums rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
        />

        <div className="flex items-center gap-1 w-20 shrink-0" title="Opaklık (Alpha 0-255)">
          <input
            type="number"
            aria-label={`${label} opaklık`}
            min={0}
            max={255}
            value={parsed.alpha}
            onChange={(e) => {
              const a = Math.max(0, Math.min(255, parseInt(e.target.value, 10) || 0));
              onChange(hexAndAlphaToRainmeter(parsed.hex, a));
            }}
            className="w-full px-2 py-1.5 text-xs font-mono tabular-nums text-right rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>
    </div>
  );
};
