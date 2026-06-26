import React from 'react';
import { useCadStore } from '../../../store/useCadStore';
import type { RibbonTabProps } from './types';

export const EvaluateTab: React.FC<RibbonTabProps> = ({
  measurementMode, setMeasurementMode,
  interferenceActive, setInterferenceActive,
  onShowMassProps, onShowEquations,
}) => {
  return (
    <div className="flex items-center gap-2 h-full animate-in fade-in slide-in-from-left-2 duration-300">
      <button onClick={() => { setMeasurementMode(measurementMode === 'DISTANCE' ? 'NONE' : 'DISTANCE'); setInterferenceActive(false); }} className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border rounded-md ${measurementMode !== 'NONE' ? 'bg-[#005B9A]/10 border-[#005B9A]' : 'border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100'} group`} title="Measure Distance">
        <div className="w-10 h-10 flex items-center justify-center text-slate-700 transition-transform group-hover:scale-110">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4h6v6" /><path d="M20 4L4 20" /><path d="M10 20H4v-6" /></svg>
        </div>
        <span className="text-[11px] font-semibold text-slate-800 leading-tight">Measure</span>
      </button>

      <button
        onClick={() => {
          const current = useCadStore.getState().sectionView.isActive;
          useCadStore.getState().setSectionView({ isActive: !current });
        }}
        className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 rounded-md group ${useCadStore.getState().sectionView.isActive ? 'bg-[#005B9A]/10 border-[#005B9A]' : ''}`}
        title="Section View"
      >
        <div className="w-10 h-10 flex items-center justify-center text-slate-700 transition-transform group-hover:scale-110">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12h16M12 4v16M3 9h18M3 15h18" /></svg>
        </div>
        <span className="text-[11px] font-semibold text-slate-800 leading-tight">Section<br />View</span>
      </button>

      <button
        onClick={() => {
          const next = !interferenceActive;
          setInterferenceActive(next);
          if (next) setMeasurementMode('NONE');
        }}
        className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 rounded-md group ${interferenceActive ? 'bg-red-50 border-red-300 shadow-inner' : ''}`}
        title="Interference Detection"
      >
        <div className={`w-10 h-10 flex items-center justify-center transition-transform ${interferenceActive ? 'text-red-600 scale-110' : 'text-slate-600 group-hover:scale-110'}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m21 21-4.3-4.3"/><circle cx="11" cy="11" r="8"/><path d="m11 8-2 2 2 2 2-2-2-2Z"/></svg>
        </div>
        <span className="text-[11px] font-semibold text-slate-800 leading-tight">Interference</span>
      </button>

      <div className="w-px h-10 bg-slate-300 mx-1"></div>

      <button
        onClick={onShowMassProps}
        className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 rounded-md group`}
        title="Mass Properties"
      >
        <div className="w-10 h-10 flex items-center justify-center text-slate-700 transition-transform group-hover:scale-110">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        </div>
        <span className="text-[11px] font-semibold text-slate-800 leading-tight">Mass<br />Props</span>
      </button>

      <button
        onClick={onShowEquations}
        className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 rounded-md group`}
        title="Equations"
      >
        <div className="w-10 h-10 flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110">
          <span className="text-2xl font-black italic">∑</span>
        </div>
        <span className="text-[11px] font-semibold text-slate-800 leading-tight">Equations</span>
      </button>
    </div>
  );
};
