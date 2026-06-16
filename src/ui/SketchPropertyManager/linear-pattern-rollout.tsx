import React from 'react';
import { SketchEdge } from '@/store/useCadStore';

interface LinearPatternRolloutProps {
  setSketchTool: (tool: string) => void;
  patternAxisId: string | null;
  setPatternAxisId: (id: string | null) => void;
  patternCount: number;
  setPatternCount: (n: number) => void;
  patternSpacing: number;
  setPatternSpacing: (n: number) => void;
  selectedEdges: SketchEdge[];
  selectedEntityIds: string[];
  executeLinearPattern: () => Promise<void>;
}

export const LinearPatternRollout: React.FC<LinearPatternRolloutProps> = ({
  setSketchTool,
  patternAxisId,
  setPatternAxisId,
  patternCount,
  setPatternCount,
  patternSpacing,
  setPatternSpacing,
  selectedEdges,
  selectedEntityIds,
  executeLinearPattern,
}) => {
  return (
    <div className="bg-white border border-blue-300 rounded shadow-md overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="px-2 py-1 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
        <span className="text-[11px] font-bold text-blue-700 uppercase tracking-tighter">Linear Pattern</span>
        <button onClick={() => setSketchTool('SELECT')} className="text-[10px] text-slate-400 hover:text-blue-600 font-bold">CANCEL</button>
      </div>
      <div className="p-3 space-y-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Pattern Direction (Axis)</label>
          <div
            className={`p-2 border rounded min-h-[40px] flex items-center justify-between transition-colors ${patternAxisId ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-300 text-slate-400 italic'}`}
            onClick={() => {
              const line = selectedEdges.find(e => e.type === 'LINE' || e.type === 'CENTER_LINE');
              if (line) setPatternAxisId(line.id);
            }}
          >
            <span className="text-[11px]">{patternAxisId ? `Axis (${patternAxisId.slice(0,4)})` : "Select a Line..."}</span>
            {patternAxisId && <button onClick={(e) => { e.stopPropagation(); setPatternAxisId(null); }} className="text-blue-400 hover:text-blue-600 font-bold">×</button>}
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Count</label>
            <input type="number" min="2" value={patternCount} onChange={e => setPatternCount(parseInt(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[12px] outline-none focus:border-blue-400" />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Spacing (mm)</label>
            <input type="number" value={patternSpacing} onChange={e => setPatternSpacing(parseFloat(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[12px] outline-none focus:border-blue-400" />
          </div>
        </div>
        <button
          disabled={!patternAxisId || selectedEntityIds.filter(id => id !== patternAxisId).length === 0}
          onClick={executeLinearPattern}
          className="w-full py-2 bg-blue-600 text-white rounded font-bold text-[12px] hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
        >
          Apply Linear Pattern
        </button>
      </div>
    </div>
  );
};
