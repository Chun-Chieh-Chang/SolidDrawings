'use client';

import React from 'react';
import { useCadStore } from '@/store/useCadStore';
import { Rollout } from '../PropertyManager/Rollout';
import { PMHeader } from '../PropertyManager/PMHeader';

export interface TolerancingProps {
  active: boolean;
  onFeatureCreate?: (params: TolParams) => void;
}

export interface TolParams {
  type: 'DIM_XPERT' | 'TOL_ANALYST' | 'GD&T_SYMBOL' | 'DATUM_TARGET';
  toleranceValue?: number;
  toleranceType?: 'PLUS_MINUS' | 'LIMIT' | 'FIT';
  datumA?: string;
  datumB?: string;
  datumC?: string;
}

const TOLERANCING_TOOLS = [
  { id: 'DIM_XPERT', label: 'DimXpert Manager', icon: '⊿', desc: 'Automated GD&T annotation on features' },
  { id: 'TOL_ANALYST', label: 'TolAnalyst', icon: '∿', desc: 'Tolerance stack-up analysis' },
  { id: 'GD&T_SYMBOL', label: 'GD&T Symbol', icon: '△', desc: 'Insert geometric tolerance frame' },
  { id: 'DATUM_TARGET', label: 'Datum Target', icon: '◉', desc: 'Define datum targets on surfaces' },
  { id: 'SURFACE_FINISH', label: 'Surface Finish', icon: '✓', desc: 'Apply surface roughness symbol' },
  { id: 'WELDMENT_WELD', label: 'Weld Symbol', icon: '⌒', desc: 'Insert weld specification symbol' },
] as const;

export const TolerancingPanel: React.FC<TolerancingProps> = ({ active, onFeatureCreate }) => {
  const [selectedTool, setSelectedTool] = React.useState<string | null>(null);
  const [params, setParams] = React.useState<Partial<TolParams>>({
    toleranceType: 'PLUS_MINUS',
    datumA: 'A',
    datumB: 'B',
    datumC: 'C',
  });

  if (!active) return null;

  const handleToolClick = (toolId: string) => {
    setSelectedTool(toolId);
    useCadStore.getState().setHint(`Tolerancing: — select features to annotate.`);
  };

  const handleApply = () => {
    if (!selectedTool || !onFeatureCreate) return;
    onFeatureCreate({
      type: selectedTool as TolParams['type'],
      toleranceValue: 0.05,
      toleranceType: params.toleranceType,
      datumA: params.datumA,
      datumB: params.datumB,
      datumC: params.datumC,
    });
    useCadStore.getState().pushToast(` applied`, 'info');
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-[#A0A0A0]">
      <PMHeader title="Tolerancing" onConfirm={()=>{}} onCancel={()=>{}} />

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {TOLERANCING_TOOLS.map((tool) => (
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

      {selectedTool && (
        <Rollout title={` Parameters`} defaultOpen={true}>
          <div className="space-y-2 p-2">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-[#404040] w-20">Tolerance:</label>
              <select
                value={params.toleranceType}
                onChange={(e) => setParams(p => ({ ...p, toleranceType: e.target.value as TolParams['toleranceType'] }))}
                className="flex-1 text-[10px] border border-[#A0A0A0] rounded px-1 py-0.5 bg-white"
              >
                <option value="PLUS_MINUS">± Plus/Minus</option>
                <option value="LIMIT">Limit</option>
                <option value="FIT">Fit (ISO 286)</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-[#404040] w-20">Datum:</label>
              <div className="flex gap-1">
                <input value={params.datumA} onChange={(e) => setParams(p => ({...p, datumA: e.target.value}))} className="w-8 text-[10px] border border-[#A0A0A0] rounded px-1 text-center bg-white" placeholder="A" />
                <input value={params.datumB} onChange={(e) => setParams(p => ({...p, datumB: e.target.value}))} className="w-8 text-[10px] border border-[#A0A0A0] rounded px-1 text-center bg-white" placeholder="B" />
                <input value={params.datumC} onChange={(e) => setParams(p => ({...p, datumC: e.target.value}))} className="w-8 text-[10px] border border-[#A0A0A0] rounded px-1 text-center bg-white" placeholder="C" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleApply} className="flex-1 bg-[#28a745] text-white text-[10px] font-bold py-1 rounded hover:bg-[#218838]">Apply</button>
              <button onClick={() => setSelectedTool(null)} className="flex-1 bg-[#dc3545] text-white text-[10px] font-bold py-1 rounded hover:bg-[#c82333]">Cancel</button>
            </div>
          </div>
        </Rollout>
      )}

      <div className="p-1 border-t border-[#A0A0A0] text-[9px] text-slate-400 text-center">
        DimXpert • TolAnalyst • GD&T Symbols
      </div>
    </div>
  );
};
