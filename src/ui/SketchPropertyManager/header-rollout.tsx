import React from 'react';
import { SolverReport } from './types';

interface HeaderRolloutProps {
  selectedEntityIds: string[];
  solverReport: SolverReport | null;
  sketchNodes: Record<string, any>;
  onAutoDefine: () => void;
}

const getDefinitionStatus = (sketchNodes: Record<string, any>, solverReport: SolverReport | null): { text: string; color: string; bg: string } => {
  const nodeIds = Object.keys(sketchNodes);
  if (nodeIds.length === 0) return { text: 'Empty Sketch', color: 'text-slate-400', bg: 'bg-slate-100' };
  if (!solverReport) return { text: 'Under Defined', color: 'text-blue-600', bg: 'bg-blue-100' };
  if (solverReport.dof < 0) return { text: `Over Defined (${solverReport.dof} DOF)`, color: 'text-red-700', bg: 'bg-red-100' };
  if (solverReport.dof === 0) return { text: 'Fully Defined (0 DOF)', color: 'text-emerald-700', bg: 'bg-emerald-100' };
  return { text: `Under Defined (${solverReport.dof} DOF)`, color: 'text-blue-700', bg: 'bg-blue-100' };
};

export const HeaderRollout: React.FC<HeaderRolloutProps> = ({ selectedEntityIds, solverReport, sketchNodes, onAutoDefine }) => {
  const status = getDefinitionStatus(sketchNodes, solverReport);

  return (
    <div className="p-3 bg-white border-b border-slate-300 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[13px] font-black text-slate-800 uppercase tracking-tight">PropertyManager</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onAutoDefine}
            className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black uppercase tracking-tighter transition-all shadow-sm active:scale-95"
            title="Fully Define Sketch (Auto-Dimension)"
          >
            Auto-Define
          </button>
          <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter ${status.bg} ${status.color}`}>
            {status.text}
          </div>
        </div>
      </div>
      <div className="text-[11px] text-slate-500 font-medium">
        {selectedEntityIds.length > 0 ? `Selected: ${selectedEntityIds.length} Entities` : 'Select entities to add relations'}
      </div>
    </div>
  );
};
