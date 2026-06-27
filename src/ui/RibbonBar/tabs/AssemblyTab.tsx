import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useCadStore } from '../../../store/useCadStore';
import type { RibbonTabProps } from './types';

export const AssemblyTab: React.FC<RibbonTabProps> = ({
  components, explodedView, setExplodedView,
  calculateAutoExplosion, pushToast,
}) => {
  return (
    <div className="flex items-center gap-2 h-full animate-in fade-in slide-in-from-left-2 duration-300">
      <button onClick={() => {
        const id = `comp_${uuidv4()}`;
        const newComp = { id, partId: 'new_part', instanceName: `Component_${components?.length || 0 + 1}`, transform: { position: [0,0,0] as [number, number, number], rotation: [0,0,0] as [number, number, number] }, visible: true };
        useCadStore.setState(state => ({ components: [...(state.components||[]), newComp] }));
      }} className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group`} title="Insert Component">
        <div className={`w-10 h-10 flex items-center justify-center transition-transform text-indigo-600 group-hover:scale-110`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        </div>
        <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Insert Comp</span>
      </button>
      <div className="w-[1px] h-10 bg-border/50 mx-1" />
      <button
        onClick={() => {
          const nextActive = !explodedView.isActive;
          setExplodedView({ isActive: nextActive } as any);
          if (nextActive && Object.keys(explodedView.directions).length === 0) {
            calculateAutoExplosion();
          }
          if (nextActive && explodedView.factor === 0) {
            useCadStore.getState().setExplosionFactor(0.5);
          }
        }}
        className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border ${explodedView.isActive ? 'bg-indigo-50 border-indigo-300 shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`}
        title="Exploded View"
      >
        <div className={`w-10 h-10 flex items-center justify-center transition-transform ${explodedView.isActive ? 'text-indigo-600 scale-110' : 'text-slate-600 group-hover:scale-110'}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><line x1="12" y1="12" x2="12" y2="2"/><line x1="12" y1="12" x2="22" y2="12"/><line x1="12" y1="12" x2="12" y2="22"/><line x1="12" y1="12" x2="2" y2="12"/></svg>
        </div>
        <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Explode</span>
      </button>
      <div className="w-[1px] h-10 bg-border/50 mx-1" />
      <button
        onClick={() => {
          const { smartMateActive, setSmartMateActive, setSmartMateSource } = useCadStore.getState();
          setSmartMateActive(!smartMateActive);
          if (smartMateActive) setSmartMateSource(null);
        }}
        className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border ${useCadStore.getState().smartMateActive ? 'bg-indigo-50 border-indigo-300 shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`}
        title="Smart Mates — Drag source reference to target to auto-create mate"
      >
        <div className={`w-10 h-10 flex items-center justify-center transition-transform text-slate-600 ${useCadStore.getState().smartMateActive ? 'text-indigo-600 scale-110' : 'group-hover:scale-110'}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 5 L10 19 L14 9 L19 19 L22 5"/><circle cx="5" cy="5" r="1.5"/><circle cx="10" cy="19" r="1.5"/><circle cx="14" cy="9" r="1.5"/><circle cx="19" cy="19" r="1.5"/><circle cx="22" cy="5" r="1.5"/></svg>
        </div>
        <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Smart Mate</span>
      </button>
      <div className="w-[1px] h-10 bg-border/50 mx-1" />
      <button
        onClick={() => {
          pushToast('Physics simulation coming soon.', 'info');
        }}
        className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group`}
        title="Physics Simulation (Coming Soon)"
      >
        <div className="w-10 h-10 flex items-center justify-center transition-transform text-slate-600 group-hover:scale-110">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>
        </div>
        <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Physics</span>
      </button>
    </div>
  );
};
