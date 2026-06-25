'use client';

import React from 'react';
import { useCadStore } from '@/store/useCadStore';
import { Rollout } from '../PropertyManager/Rollout';
import { PMHeader } from '../PropertyManager/PMHeader';
import { BendAllowancePanel } from './BendAllowancePanel';

export interface SheetMetalProps {
  active: boolean;
  onFeatureCreate?: (params: SheetMetalParams) => void;
}

export interface SheetMetalParams {
  type: 'FLAT_PATTERN' | 'BEND_ALLOWANCE' | 'FORMING_TOOL' | 'BEND_LINE' | 'K-FACEOR';
  thickness: number;
  bendRadius: number;
  bendAngle: number;
  kFactor?: number;
  reliefType?: 'RECTANGULAR' | 'ROUND' | 'NONE';
  reliefWidth?: number;
  reliefDepth?: number;
}

const SHEET_METAL_TOOLS = [
  { id: 'FLAT_PATTERN', label: 'Flat Pattern', icon: '▭', desc: 'Develop sheet metal part to 2D layout' },
  { id: 'BEND_ALLOWANCE', label: 'Bend Allowance', icon: '∿', desc: 'Calculate neutral axis bend length' },
  { id: 'BEND_LINE', label: 'Bend Line', icon: '╱', desc: 'Insert bend reference line' },
  { id: 'K-FACEOR', label: 'K-Factor', icon: 'κ', desc: 'Set sheet metal K-factor for bend calculations' },
  { id: 'FORMING_TOOL', label: 'Forming Tool', icon: '⬡', desc: 'Apply forming/deboss features' },
  { id: 'EDGE_FLANGE', label: 'Edge Flange', icon: '┐', desc: 'Create edge flange on selected edge' },
  { id: 'MITER_FLANGE', label: 'Miter Flange', icon: '∠', desc: 'Create mitered corner flange' },
  { id: 'HEM', label: 'Hem', icon: '▄', desc: 'Create hem edge for safety/stiffness' },
  { id: 'SPLIT', label: 'Split Body', icon: '⫶', desc: 'Split sheet metal body into multiple parts' },
  { id: 'JOINDER', label: 'Joinder', icon: '⊞', desc: 'Join multiple sheet metal parts' },
] as const;

export const SheetMetalPanel: React.FC<SheetMetalProps> = ({ active, onFeatureCreate }) => {
  const [selectedTool, setSelectedTool] = React.useState<string | null>(null);
  const [params, setParams] = React.useState<Partial<SheetMetalParams>>({
    thickness: 1.0,
    bendRadius: 0.5,
    bendAngle: 90,
    kFactor: 0.5,
    reliefType: 'RECTANGULAR',
    reliefWidth: 1.0,
    reliefDepth: 1.0,
  });

  if (!active) return null;

  const isBendAllowanceTool = selectedTool === 'BEND_ALLOWANCE' || selectedTool === 'K-FACEOR';

  const handleToolClick = (toolId: string) => {
    setSelectedTool(toolId);
    useCadStore.getState().setHint(`Sheet Metal: — select edges/faces to proceed.`);
  };

  const handleApply = () => {
    if (!selectedTool || !onFeatureCreate) return;
    onFeatureCreate({
      type: selectedTool as SheetMetalParams['type'],
      thickness: params.thickness ?? 1.0,
      bendRadius: params.bendRadius ?? 0.5,
      bendAngle: params.bendAngle ?? 90,
      kFactor: params.kFactor,
      reliefType: params.reliefType,
      reliefWidth: params.reliefWidth,
      reliefDepth: params.reliefDepth,
    });
    useCadStore.getState().pushToast(`${selectedTool} applied`, 'info');
  };

  // Show dedicated BendAllowancePanel when bend allowance tools selected
  if (isBendAllowanceTool) {
    return <BendAllowancePanel onClose={() => setSelectedTool(null)} />;
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-[#A0A0A0]">
      {/* Header */}
      <PMHeader title="Sheet Metal" onConfirm={() => {}} onCancel={() => {}} />

      {/* Tool Palette */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {SHEET_METAL_TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool.id)}
            className={`w-full flex items-center gap-2 p-2 rounded border transition-colors text-left`}
          >
            <span className="text-lg w-6 text-center">{tool.icon}</span>
            <div>
              <div className="text-[11px] font-bold text-[#404040]">{tool.label}</div>
              <div className="text-[9px] text-slate-500">{tool.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Params Rollout */}
      {selectedTool && (
        <Rollout title={`${selectedTool} Parameters`} defaultOpen={true}>
          <div className="space-y-2 p-2">
            <ParamInput label="Thickness (mm)" value={params.thickness} onChange={(v) => setParams(p => ({ ...p, thickness: v }))} />
            <ParamInput label="Bend Radius (mm)" value={params.bendRadius} onChange={(v) => setParams(p => ({ ...p, bendRadius: v }))} />
            <ParamInput label="Bend Angle (deg)" value={params.bendAngle} onChange={(v) => setParams(p => ({ ...p, bendAngle: v }))} type="number" />
            <ParamInput label="K-Factor" value={params.kFactor} onChange={(v) => setParams(p => ({ ...p, kFactor: v }))} step={0.01} min={0} max={1} />
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-[#404040]">Relief:</label>
              <select
                value={params.reliefType}
                onChange={(e) => setParams(p => ({ ...p, reliefType: e.target.value as SheetMetalParams['reliefType'] }))}
                className="text-[10px] border border-[#A0A0A0] rounded px-1 py-0.5 bg-white"
              >
                <option value="RECTANGULAR">Rectangular</option>
                <option value="ROUND">Round</option>
                <option value="NONE">None</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={handleApply} className="flex-1 bg-[#28a745] text-white text-[10px] font-bold py-1 rounded hover:bg-[#218838]">Apply</button>
              <button onClick={() => setSelectedTool(null)} className="flex-1 bg-[#dc3545] text-white text-[10px] font-bold py-1 rounded hover:bg-[#c82333]">Cancel</button>
            </div>
          </div>
        </Rollout>
      )}

      {/* Footer */}
      <div className="p-1 border-t border-[#A0A0A0] text-[9px] text-slate-400 text-center">
        Flat Pattern • Bend Allowance • Forming Tools
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
      <label className="text-[10px] font-bold text-[#404040] w-20">{label}</label>
      <input
        type={type}
        value={value ?? 0}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        step={step}
        min={min}
        max={max}
        className="flex-1 text-[10px] border border-[#A0A0A0] rounded px-1.5 py-0.5 bg-white outline-none focus:border-[#005B9A]"
      />
    </div>
  );
}
