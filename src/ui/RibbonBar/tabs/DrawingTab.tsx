import React from 'react';
import type { RibbonTabProps } from './types';

export const DrawingTab: React.FC<RibbonTabProps> = ({
  setActiveTab, handleCreateStandard3Views, handleCreateModelView,
  pushToast,
}) => {
  return (
    <div className="flex items-center gap-2 h-full animate-in fade-in slide-in-from-left-2 duration-300">
      <button onClick={() => { handleCreateStandard3Views?.(); pushToast('Standard 3 Views created.', 'info'); }} className="flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Standard 3 Views">
        <div className="w-10 h-10 flex items-center justify-center text-amber-700 transition-transform group-hover:scale-110">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        </div>
        <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">3 Views</span>
      </button>
      <button onClick={() => { handleCreateModelView?.(); pushToast('Model View added.', 'info'); }} className="flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Model View">
        <div className="w-10 h-10 flex items-center justify-center text-amber-700 transition-transform group-hover:scale-110">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </div>
        <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Model View</span>
      </button>
      <div className="w-[1px] h-10 bg-border/50 mx-1" />
      <button onClick={() => { pushToast('Print/Export to PDF initiated.', 'info'); const printHook = (window as any).__handlePrintToPDF; if (printHook) printHook(); }} className="flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Export to PDF">
        <div className="w-10 h-10 flex items-center justify-center text-amber-700 transition-transform group-hover:scale-110">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        </div>
        <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Save PDF</span>
      </button>
      <div className="w-[1px] h-10 bg-border/50 mx-1" />
      <button onClick={() => { setActiveTab('FEATURES'); (window as any).__useCadStore?.getState().setMode('PART'); }} className="flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Back to 3D Part">
        <div className="w-10 h-10 flex items-center justify-center text-slate-700 transition-transform group-hover:scale-110">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        </div>
        <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Exit</span>
      </button>
    </div>
  );
};
