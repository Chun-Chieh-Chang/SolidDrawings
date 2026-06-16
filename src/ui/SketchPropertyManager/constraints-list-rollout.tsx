import React from 'react';
import { SketchConstraint } from '@/store/useCadStore';

interface ConstraintsListRolloutProps {
  selectedConstraints: SketchConstraint[];
  deleteConstraint: (cid: string) => void;
}

export const ConstraintsListRollout: React.FC<ConstraintsListRolloutProps> = ({
  selectedConstraints,
  deleteConstraint,
}) => {
  if (selectedConstraints.length === 0) return null;

  return (
    <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
      <div className="px-2 py-1 bg-slate-100 border-b border-slate-300 flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-700">Existing Relations</span>
      </div>
      <div className="p-2 space-y-1">
        {selectedConstraints.map(c => (
          <div key={c.id} className="flex items-center justify-between p-1.5 bg-slate-50 border border-slate-200 rounded text-[11px]">
            <div className="flex flex-col">
              <span className="font-bold text-slate-700 uppercase text-[9px]">{c.type}</span>
              <span className="text-slate-400 font-mono text-[9px]">{c.id.slice(0, 8)}</span>
            </div>
            <button
              onClick={() => deleteConstraint(c.id)}
              className="w-5 h-5 rounded hover:bg-red-50 text-red-400 hover:text-red-600 flex items-center justify-center border-none bg-transparent cursor-pointer"
            >×</button>
          </div>
        ))}
      </div>
    </div>
  );
};
