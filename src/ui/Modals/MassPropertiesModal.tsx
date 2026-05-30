'use client';

import React from 'react';
import { appAPI } from '../../../electron/renderer';

interface MassPropertiesModalProps {
  massProps: {
    volume: number;
    surface_area: number;
    center_of_mass: number[];
    inertia_matrix: number[][];
  };
  onClose: () => void;
}

export const MassPropertiesModal: React.FC<MassPropertiesModalProps> = ({ massProps, onClose }) => {
  const handleCopy = () => {
    const text = `Mass Properties Report:
Volume: ${massProps.volume.toFixed(3)} mm³
Surface Area: ${massProps.surface_area.toFixed(3)} mm²
Center of Mass: [${massProps.center_of_mass.map(c => c.toFixed(3)).join(', ')}]
Inertia Tensor:
${massProps.inertia_matrix.map(r => r.map(v => v.toFixed(1)).join('\t')).join('\n')}`;
    navigator.clipboard.writeText(text);
    appAPI.notify('Copied', 'Mass properties report copied to clipboard');
  };

  return (
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[1000] p-4 animate-fade-in">
      <div className="w-[520px] bg-slate-900/90 border border-slate-700/60 rounded-3xl p-6 shadow-sm flex flex-col gap-5 text-slate-100 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex justify-between items-center border-b border-slate-800 pb-3 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[16px] font-extrabold tracking-wider uppercase text-amber-400 font-sans">Mass Properties</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer">×</button>
        </div>

        <div className="space-y-3 z-10 font-sans">
          <div className="bg-slate-950/50 rounded border border-slate-800/80 p-3.5 flex justify-between items-center shadow-inner">
            <div className="flex flex-col">
              <span className="text-[13px] text-slate-400 font-bold uppercase tracking-wider">Volume</span>
            </div>
            <span className="text-base font-black font-mono text-emerald-400">
              {massProps.volume.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} <span className="text-[12px] font-bold text-secondary-text">mm³</span>
            </span>
          </div>
          <div className="bg-slate-950/50 rounded border border-slate-800/80 p-3.5 flex justify-between items-center shadow-inner">
            <div className="flex flex-col">
              <span className="text-[13px] text-slate-400 font-bold uppercase tracking-wider">Surface Area</span>
            </div>
            <span className="text-base font-black font-mono text-indigo-400">
              {massProps.surface_area.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} <span className="text-[12px] font-bold text-secondary-text">mm²</span>
            </span>
          </div>
          <div className="bg-slate-950/50 rounded border border-slate-800/80 p-3.5 flex flex-col gap-2 shadow-inner">
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-slate-400 font-bold uppercase tracking-wider">Center of Mass</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5 mt-1">
              {['X', 'Y', 'Z'].map((axis, aIdx) => (
                <div key={axis} className="bg-slate-900 border border-slate-800 rounded-sm p-2 flex flex-col items-center shadow-sm">
                  <span className="text-[12px] font-extrabold text-secondary-text">{axis}</span>
                  <span className="text-[14px] font-black font-mono text-slate-100 mt-0.5">{massProps.center_of_mass[aIdx].toFixed(3)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-950/50 rounded border border-slate-800/80 p-3.5 flex flex-col gap-2 shadow-inner">
            <span className="text-[13px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-1.5 flex justify-between items-center">
              <span>Inertia Tensor</span>
              <span className="text-[10px] text-secondary-text font-mono">g·mm²</span>
            </span>
            <div className="grid grid-cols-3 gap-1.5 mt-1 font-mono text-[12px] bg-slate-900/50 p-2.5 rounded-sm border border-slate-800/40">
              {massProps.inertia_matrix.map((row, rIdx) => 
                row.map((val, cIdx) => (
                  <div key={`${rIdx}-${cIdx}`} className="text-right p-1 font-semibold text-slate-300">
                    {val.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <button onClick={handleCopy} className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:from-amber-700 active:to-amber-800 text-slate-950 font-extrabold rounded transition-all shadow-lg flex items-center justify-center gap-1.5 text-[14px] cursor-pointer">
          Copy Report
        </button>
      </div>
    </div>
  );
};
