import React from 'react';
import { SketchConstraint } from '@/store/useCadStore';

type ConstraintType = SketchConstraint['type'];

interface RelationsGridProps {
  applyConstraint: (type: ConstraintType) => Promise<void>;
}

const relationButtons = [
  { type: 'HORIZONTAL' as ConstraintType, label: 'Horizontal', icon: '—' },
  { type: 'VERTICAL' as ConstraintType, label: 'Vertical', icon: '|' },
  { type: 'COINCIDENT' as ConstraintType, label: 'Coincident', icon: '•' },
  { type: 'DISTANCE' as ConstraintType, label: 'Distance', icon: '↔' },
  { type: 'EQUAL' as ConstraintType, label: 'Equal', icon: '=' },
  { type: 'CONCENTRIC' as ConstraintType, label: 'Concentric', icon: '◎' },
  { type: 'TANGENT' as ConstraintType, label: 'Tangent', icon: '○' },
  { type: 'ANGLE' as ConstraintType, label: 'Angle', icon: '∠' },
  { type: 'PARALLEL' as ConstraintType, label: 'Parallel', icon: '∥' },
  { type: 'PERPENDICULAR' as ConstraintType, label: 'Perpend.', icon: '⊥' },
  { type: 'COLLINEAR' as ConstraintType, label: 'Collinear', icon: '⬌' },
  { type: 'MIDPOINT' as ConstraintType, label: 'Midpoint', icon: '⬗' },
  { type: 'SYMMETRIC' as ConstraintType, label: 'Symmetric', icon: '|⬵|' },
  { type: 'FIX' as ConstraintType, label: 'Fix', icon: '🔒' },
  { type: 'UNFIX' as ConstraintType, label: 'Unfix', icon: '🔓' },
];

export const RelationsGrid: React.FC<RelationsGridProps> = ({ applyConstraint }) => {
  return (
    <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
      <div className="px-2 py-1 bg-slate-100 border-b border-slate-300">
        <span className="text-[11px] font-bold text-slate-700">Add Relations</span>
      </div>
      <div className="p-2 grid grid-cols-2 gap-1.5">
        {relationButtons.map(c => (
          <button
            key={c.type}
            onClick={() => applyConstraint(c.type)}
            className="flex flex-col items-center justify-center p-2 rounded border border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-slate-600 hover:text-blue-700 transition-all bg-white cursor-pointer group"
          >
            <span className="text-lg font-bold group-hover:scale-110 transition-transform">{c.icon}</span>
            <span className="text-[9px] font-bold uppercase mt-1 tracking-tighter">{c.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
