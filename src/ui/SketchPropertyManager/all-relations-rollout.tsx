import React from 'react';
import { SketchConstraint } from '@/store/useCadStore';

interface AllRelationsRolloutProps {
  sketchConstraints: Record<string, SketchConstraint>;
  setHoveredEntityId: (id: string | null) => void;
  setSelectedEntityIds: (ids: string[]) => void;
  onDeleteAll: () => void;
}

const constraintIcons: Record<string, string> = {
  HORIZONTAL: '—',
  VERTICAL: '|',
  COINCIDENT: '•',
  DISTANCE: '↔',
  ANGLE: '∠',
  EQUAL: '=',
  PARALLEL: '∥',
  PERPENDICULAR: '⊥',
  CONCENTRIC: '◎',
  COLLINEAR: '⬌',
  TANGENT: '○',
};

export const AllRelationsRollout: React.FC<AllRelationsRolloutProps> = ({
  sketchConstraints,
  setHoveredEntityId,
  setSelectedEntityIds,
  onDeleteAll,
}) => {
  return (
    <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden animate-in fade-in duration-300">
      <div className="px-2 py-1 bg-slate-100 border-b border-slate-300 flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tighter flex items-center gap-1.5">
          <span className="text-emerald-600">📋</span> All Relations ({Object.keys(sketchConstraints).length})
        </span>
        <button
          onClick={onDeleteAll}
          className="text-[9px] text-red-600 hover:underline border-none bg-transparent cursor-pointer font-bold"
        >
          Delete All
        </button>
      </div>
      <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
        {Object.values(sketchConstraints).length === 0 ? (
          <div className="text-[10px] text-slate-400 italic text-center py-4">No relations in this sketch.</div>
        ) : (
          Object.values(sketchConstraints).map(c => (
            <div
              key={c.id}
              onMouseEnter={() => setHoveredEntityId(c.id)}
              onMouseLeave={() => setHoveredEntityId(null)}
              onClick={() => setSelectedEntityIds([c.id])}
              className="flex items-center justify-between p-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] hover:bg-white hover:border-primary/40 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <span className="text-[14px] text-emerald-600 font-bold">
                  {constraintIcons[c.type] || '•'}
                </span>
                <span className="font-bold text-slate-700 uppercase text-[9px]">{c.type}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); /* handled by parent */ }}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all font-bold"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
