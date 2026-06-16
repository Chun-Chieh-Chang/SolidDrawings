import React from 'react';
import { SketchEdge } from '@/store/useCadStore';

interface MirrorRolloutProps {
  setSketchTool: (tool: string) => void;
  mirrorAxisId: string | null;
  setMirrorAxisId: (id: string | null) => void;
  selectedEdges: SketchEdge[];
  selectedEntityIds: string[];
  executeSketchMirror: () => Promise<void>;
}

export const MirrorRollout: React.FC<MirrorRolloutProps> = ({
  setSketchTool,
  mirrorAxisId,
  setMirrorAxisId,
  selectedEdges,
  selectedEntityIds,
  executeSketchMirror,
}) => {
  return (
    <div className="bg-white border border-indigo-300 rounded shadow-md overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="px-2 py-1 bg-indigo-50 border-b border-indigo-200 flex items-center justify-between">
        <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-tighter">Mirror Entities</span>
        <button onClick={() => { setSketchTool('SELECT'); setMirrorAxisId(null); }} className="text-[10px] text-slate-400 hover:text-indigo-600 font-bold">CANCEL</button>
      </div>
      <div className="p-3 space-y-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Entities to Mirror</label>
          <div className="p-2 bg-slate-50 border border-slate-200 rounded min-h-[40px] text-[11px] text-slate-600">
            {selectedEntityIds.filter(id => id !== mirrorAxisId).length === 0 ? (
              <span className="text-slate-400 italic">Select entities in viewport...</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {selectedEntityIds.filter(id => id !== mirrorAxisId).map(id => (
                  <span key={id} className="bg-white px-1.5 py-0.5 border border-slate-200 rounded-sm text-[9px] font-mono">
                    {id.slice(0, 4)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Mirror About</label>
          <div
            className={`p-2 border rounded min-h-[40px] flex items-center justify-between transition-colors ${mirrorAxisId ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-300 text-slate-400 italic'}`}
            onClick={() => {
              const centerLine = selectedEdges.find(e => e.type === 'CENTER_LINE');
              if (centerLine) setMirrorAxisId(centerLine.id);
            }}
          >
            <span className="text-[11px]">{mirrorAxisId ? `CenterLine (${mirrorAxisId.slice(0,4)})` : "Select a Center Line..."}</span>
            {mirrorAxisId && <button onClick={(e) => { e.stopPropagation(); setMirrorAxisId(null); }} className="text-indigo-400 hover:text-indigo-600 font-bold">×</button>}
          </div>
        </div>
        <button
          disabled={!mirrorAxisId || selectedEntityIds.filter(id => id !== mirrorAxisId).length === 0}
          onClick={executeSketchMirror}
          className="w-full py-2 bg-indigo-600 text-white rounded font-bold text-[12px] hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
          Apply Mirror
        </button>
      </div>
    </div>
  );
};
