import React from 'react';
import { SketchNode } from '@/store/useCadStore';

interface CircularPatternRolloutProps {
  setSketchTool: (tool: string) => void;
  patternCount: number;
  setPatternCount: (n: number) => void;
  patternAngle: number;
  setPatternAngle: (n: number) => void;
  selectedNodes: SketchNode[];
  executeCircularPattern: () => Promise<void>;
}

export const CircularPatternRollout: React.FC<CircularPatternRolloutProps> = ({
  setSketchTool,
  patternCount,
  setPatternCount,
  patternAngle,
  setPatternAngle,
  selectedNodes,
  executeCircularPattern,
}) => {
  return (
    <div className="bg-white border border-blue-300 rounded shadow-md overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="px-2 py-1 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
        <span className="text-[11px] font-bold text-blue-700 uppercase tracking-tighter">Circular Pattern</span>
        <button onClick={() => setSketchTool('SELECT')} className="text-[10px] text-slate-400 hover:text-blue-600 font-bold">CANCEL</button>
      </div>
      <div className="p-3 space-y-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Center Point (Seed Node)</label>
          <div className="p-2 bg-blue-50 border border-blue-200 rounded text-[11px] text-blue-700 font-bold">
            {selectedNodes[0] ? `Point (${selectedNodes[0].id.slice(0,4)})` : "Select a seed point..."}
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Instances</label>
            <input type="number" min="2" value={patternCount} onChange={e => setPatternCount(parseInt(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[12px] outline-none focus:border-blue-400" />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Total Angle</label>
            <input type="number" value={patternAngle} onChange={e => setPatternAngle(parseFloat(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[12px] outline-none focus:border-blue-400" />
          </div>
        </div>
        <button
          disabled={selectedNodes.length === 0}
          onClick={executeCircularPattern}
          className="w-full py-2 bg-blue-600 text-white rounded font-bold text-[12px] hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
        >
          Apply Circular Pattern
        </button>
      </div>
    </div>
  );
};
