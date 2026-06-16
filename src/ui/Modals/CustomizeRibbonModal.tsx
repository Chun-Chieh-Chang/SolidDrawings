'use client';

import React from 'react';
import { useCadStore, RibbonLayout, DEFAULT_RIBBON_LAYOUT } from '../../store/useCadStore';

interface CustomizeRibbonModalProps {
  onClose: () => void;
  tab: keyof RibbonLayout;
}

export const CustomizeRibbonModal: React.FC<CustomizeRibbonModalProps> = ({ onClose, tab }) => {
  const { ribbonLayout, setRibbonLayout } = useCadStore();

  const AVAILABLE_BUTTONS: Record<string, string[]> = {
    FEATURES: ['EXTRUDE', 'REVOLVE', 'EXTRUDE_CUT', 'REVOLVED_CUT', 'SWEEP', 'LOFT', 'FILLET', 'CHAMFER', 'MIRROR', 'PATTERN', 'SHELL', 'DOME', 'DRAFT', 'REFERENCE_PLANE', 'REFERENCE_AXIS', 'REFERENCE_POINT', 'REFERENCE_COORDINATE_SYSTEM', 'HOLE_WIZARD'],
    SKETCH: ['LINE', 'CIRCLE', 'ARC', 'RECTANGLE', 'SMART_DIMENSION', 'TRIM', 'EXTEND', 'OFFSET', 'MIRROR', 'PATTERN', 'TEXT', 'SPLINE'],
    EVALUATE: ['MEASURE', 'MASS_PROPS', 'INTERFERENCE', 'SECTION_VIEW', 'EQUATIONS']
  };

  const handleToggle = (id: string) => {
    const current = ribbonLayout[tab] || [];
    const next = current.includes(id) 
      ? current.filter(b => b !== id) 
      : [...current, id];
    
    setRibbonLayout({ ...ribbonLayout, [tab]: next });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-[400px] flex flex-col overflow-hidden">
        <div className="px-4 py-3 bg-slate-100 border-b border-slate-300 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-tighter">Customize Toolbar (Customize {tab})</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        
        <div className="p-4 grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
          {AVAILABLE_BUTTONS[tab].map(id => {
            const isEnabled = (ribbonLayout[tab] || []).includes(id);
            return (
              <div 
                key={id} 
                onClick={() => handleToggle(id)}
                className={`flex items-center gap-3 p-2 rounded border cursor-pointer transition-all ${isEnabled ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
              >
                <div className={`w-3 h-3 rounded-full border ${isEnabled ? 'bg-indigo-500 border-indigo-600' : 'bg-white border-slate-300'}`} />
                <span className="text-[11px] font-bold uppercase">{id.replace('_', ' ')}</span>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
           <button 
            onClick={() => setRibbonLayout(DEFAULT_RIBBON_LAYOUT)}
            className="px-4 py-2 text-[11px] font-bold text-slate-500 hover:text-slate-700 uppercase tracking-widest"
          >
            Reset Default
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-[#005B9A] text-white rounded text-[11px] font-black uppercase tracking-widest hover:bg-[#004b7d] transition-all shadow-md active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
