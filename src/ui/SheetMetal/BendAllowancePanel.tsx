'use client';

import React, { useState, useMemo } from 'react';
import { Rollout } from '../PropertyManager/Rollout';
import { PMHeader } from '../PropertyManager/PMHeader';
import { calculateBendAllowance, getDefaultKFactor } from '@/utils/sheet-metal/bend-allowance';

type AllowanceType = 'K_FACTOR' | 'BEND_ALLOWANCE' | 'BEND_DEDUCTION';
type ReliefType = 'RECTANGULAR' | 'TEAR' | 'OBROUND' | 'NONE';

interface BendAllowanceSettings {
  allowanceType: AllowanceType;
  kFactor: number;
  bendRadius: number;
  thickness: number;
  bendAngle: number;
  material: string;
  reliefType: ReliefType;
  reliefWidth: number;
  reliefDepth: number;
  autoRelief: boolean;
  customReliefRatio: number;
}

const MATERIAL_PRESETS: Record<string, { label: string; kFactor: number }> = {
  STEEL_THIN: { label: 'Steel (thin, <1mm)', kFactor: 0.3 },
  STEEL_MEDIUM: { label: 'Steel (medium, 1-3mm)', kFactor: 0.45 },
  ALUMINUM: { label: 'Aluminum', kFactor: 0.4 },
  STAINLESS: { label: 'Stainless Steel', kFactor: 0.5 },
  COPPER: { label: 'Copper', kFactor: 0.35 },
  BRASS: { label: 'Brass', kFactor: 0.38 },
  CUSTOM: { label: 'Custom', kFactor: 0.5 },
};

export const BendAllowancePanel: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [settings, setSettings] = useState<BendAllowanceSettings>({
    allowanceType: 'K_FACTOR',
    kFactor: 0.45,
    bendRadius: 0.5,
    thickness: 1.0,
    bendAngle: 90,
    material: 'STEEL_MEDIUM',
    reliefType: 'RECTANGULAR',
    reliefWidth: 1.0,
    reliefDepth: 1.0,
    autoRelief: true,
    customReliefRatio: 0.5,
  });

  const update = (partial: Partial<BendAllowanceSettings>) =>
    setSettings(prev => ({ ...prev, ...partial }));

  // Calculate bend allowance preview
  const calcResult = useMemo(() => {
    if (settings.allowanceType === 'K_FACTOR') {
      return calculateBendAllowance({
        thickness: settings.thickness,
        bendRadius: settings.bendRadius,
        bendAngle: settings.bendAngle,
        kFactor: settings.kFactor,
      });
    }
    return null;
  }, [settings.thickness, settings.bendRadius, settings.bendAngle, settings.kFactor, settings.allowanceType]);

  const handleMaterialChange = (mat: string) => {
    const preset = MATERIAL_PRESETS[mat];
    if (preset && mat !== 'CUSTOM') {
      update({ material: mat, kFactor: preset.kFactor });
    } else {
      update({ material: mat });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-[#A0A0A0]">
      <PMHeader
        title="Bend Allowance"
        onConfirm={() => {
          // Save global bend allowance settings to store
          // Future: persist to store for use in flat pattern calc
          if (onClose) onClose();
        }}
        onCancel={() => onClose?.()}
      />

      <div className="flex-1 overflow-y-auto">
        {/* Allowance Type */}
        <Rollout title="Bend Allowance Type" defaultOpen={true}>
          <div className="space-y-2 p-2">
            <label className="text-[10px] font-bold text-[#404040] block mb-1">Type</label>
            <div className="flex gap-1">
              {(['K_FACTOR', 'BEND_ALLOWANCE', 'BEND_DEDUCTION'] as AllowanceType[]).map(t => (
                <button
                  key={t}
                  onClick={() => update({ allowanceType: t })}
                  className={`flex-1 text-[9px] font-bold py-1.5 rounded border transition-colors ${
                    settings.allowanceType === t
                      ? 'bg-[#005B9A] text-white border-[#005B9A]'
                      : 'bg-white text-[#404040] border-[#A0A0A0] hover:bg-slate-50'
                  }`}
                >
                  {t === 'K_FACTOR' ? 'K-Factor' : t === 'BEND_ALLOWANCE' ? 'Bend Allow.' : 'Bend Deduct.'}
                </button>
              ))}
            </div>
          </div>
        </Rollout>

        {/* Bend Parameters */}
        <Rollout title="Bend Parameters" defaultOpen={true}>
          <div className="space-y-2 p-2">
            <ParamInput
              label="Thickness (mm)"
              value={settings.thickness}
              onChange={v => update({ thickness: v })}
              min={0.01}
              max={100}
              step={0.01}
            />
            <ParamInput
              label="Bend Radius (mm)"
              value={settings.bendRadius}
              onChange={v => update({ bendRadius: v })}
              min={0.01}
              max={100}
              step={0.01}
            />
            <ParamInput
              label="Bend Angle (°)"
              value={settings.bendAngle}
              onChange={v => update({ bendAngle: v })}
              min={1}
              max={180}
              step={1}
            />

            {/* K-Factor controls */}
            {settings.allowanceType === 'K_FACTOR' && (
              <>
                <div className="pt-1">
                  <label className="text-[10px] font-bold text-[#404040] block mb-0.5">Material</label>
                  <select
                    value={settings.material}
                    onChange={e => handleMaterialChange(e.target.value)}
                    className="w-full text-[11px] border border-[#A0A0A0] rounded px-1.5 py-1 bg-white outline-none focus:border-[#005B9A]"
                  >
                    {Object.entries(MATERIAL_PRESETS).map(([key, p]) => (
                      <option key={key} value={key}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div className="pt-1">
                  <label className="text-[10px] font-bold text-[#404040] block mb-0.5">
                    K-Factor: <span className="text-[#005B9A]">{settings.kFactor.toFixed(3)}</span>
                  </label>
                  <input
                    type="range"
                    value={settings.kFactor}
                    onChange={e => update({ kFactor: parseFloat(e.target.value) })}
                    min={0}
                    max={1}
                    step={0.005}
                    className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#005B9A]"
                  />
                  <div className="flex justify-between text-[8px] text-slate-400 mt-0.5">
                    <span>0 (Compression)</span>
                    <span>0.5 (Neutral)</span>
                    <span>1 (Tension)</span>
                  </div>
                </div>
              </>
            )}

            {/* Manual BA input */}
            {settings.allowanceType === 'BEND_ALLOWANCE' && (
              <ParamInput
                label="Bend Allow. (mm)"
                value={settings.kFactor * 10}
                onChange={v => update({ kFactor: v / 10 })}
                min={0}
                max={50}
                step={0.1}
              />
            )}

            {/* Bend Deduction input */}
            {settings.allowanceType === 'BEND_DEDUCTION' && (
              <ParamInput
                label="Bend Deduct. (mm)"
                value={settings.kFactor * 5}
                onChange={v => update({ kFactor: v / 5 })}
                min={0}
                max={25}
                step={0.1}
              />
            )}
          </div>
        </Rollout>

        {/* Relief */}
        <Rollout title="Relief Type" defaultOpen={true}>
          <div className="space-y-2 p-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.autoRelief}
                onChange={e => update({ autoRelief: e.target.checked })}
                className="accent-[#005B9A]"
                id="auto-relief"
              />
              <label htmlFor="auto-relief" className="text-[10px] font-bold text-[#404040]">Auto Relief</label>
            </div>

            <label className="text-[10px] font-bold text-[#404040] block">Type</label>
            <div className="flex gap-1">
              {(['RECTANGULAR', 'TEAR', 'OBROUND', 'NONE'] as ReliefType[]).map(t => (
                <button
                  key={t}
                  onClick={() => update({ reliefType: t })}
                  className={`flex-1 text-[9px] font-bold py-1.5 rounded border transition-colors ${
                    settings.reliefType === t
                      ? 'bg-[#005B9A] text-white border-[#005B9A]'
                      : 'bg-white text-[#404040] border-[#A0A0A0] hover:bg-slate-50'
                  }`}
                >
                  {t === 'RECTANGULAR' ? 'Rect.' : t === 'TEAR' ? 'Tear' : t === 'OBROUND' ? 'Obround' : 'None'}
                </button>
              ))}
            </div>

            {settings.reliefType !== 'NONE' && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <ParamInput
                  label="Width (mm)"
                  value={settings.reliefWidth}
                  onChange={v => update({ reliefWidth: v })}
                  min={0.01}
                  step={0.1}
                />
                <ParamInput
                  label="Depth (mm)"
                  value={settings.reliefDepth}
                  onChange={v => update({ reliefDepth: v })}
                  min={0.01}
                  step={0.1}
                />
              </div>
            )}

            {!settings.autoRelief && (
              <ParamInput
                label="Relief Ratio"
                value={settings.customReliefRatio}
                onChange={v => update({ customReliefRatio: v })}
                min={0.01}
                max={1}
                step={0.01}
              />
            )}
          </div>
        </Rollout>

        {/* Calculation Preview */}
        {calcResult && (
          <Rollout title="Calculation Results" defaultOpen={true}>
            <div className="space-y-1.5 p-2">
              <ResultRow label="Bend Allowance (BA)" value={`${calcResult.bendAllowance} mm`} />
              <ResultRow label="Setback" value={`${calcResult.setback} mm`} />
              <ResultRow label="Total Flat Length" value={`${calcResult.totalFlatLength} mm`} />
              <ResultRow label="K-Factor" value={`${calcResult.kFactor}`} />
              <div className="border-t border-[#E5E7EB] pt-1.5 mt-1.5">
                <p className="text-[9px] text-slate-500">
                  BA = π × (θ/180) × (R + K × t)
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  = π × ({settings.bendAngle}/180) × ({settings.bendRadius} + {settings.kFactor} × {settings.thickness})
                </p>
              </div>
            </div>
          </Rollout>
        )}
      </div>

      {/* Footer */}
      <div className="p-1 border-t border-[#A0A0A0] text-[9px] text-slate-400 text-center">
        Global Bend Allowance Settings
      </div>
    </div>
  );
};

function ParamInput({ label, value, onChange, type = 'number', step, min, max }: {
  label: string;
  value?: number;
  onChange: (v: number) => void;
  type?: string;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-[10px] font-bold text-[#404040] w-24 shrink-0">{label}</label>
      <input
        type={type}
        value={value ?? 0}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        step={step}
        min={min}
        max={max}
        className="flex-1 text-[11px] border border-[#A0A0A0] rounded px-1.5 py-0.5 bg-white outline-none focus:border-[#005B9A]"
      />
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-[#404040]">{label}</span>
      <span className="text-[11px] font-mono font-bold text-[#005B9A]">{value}</span>
    </div>
  );
}
