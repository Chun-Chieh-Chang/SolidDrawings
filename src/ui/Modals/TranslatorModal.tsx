'use client';

import React from 'react';

interface TranslatorModalProps {
  onClose: () => void;
  onOpenAlternative: () => void;
}

export const TranslatorModal: React.FC<TranslatorModalProps> = ({ onClose, onOpenAlternative }) => {
  return (
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[1000] p-4 animate-fade-in">
      <div className="w-[460px] bg-slate-900/90 border border-slate-700/60 rounded-3xl p-6 shadow-sm flex flex-col gap-4 text-slate-100 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex justify-between items-center border-b border-slate-800 pb-3 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[16px] font-extrabold tracking-wider uppercase text-blue-400 font-sans">SolidWorks Translator</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer">×</button>
        </div>

        <div className="space-y-3.5 z-10 leading-relaxed text-[13px] text-slate-300 font-sans">
          <p className="text-slate-200 font-bold border-l-4 border-blue-500 pl-2">
            Native SolidWorks Part (.sldprt / .sldasm) detected.
          </p>
          <p>
            To maintain 100% geometric fidelity, please export your model from SolidWorks as a neutral CAD format.
          </p>
          <div className="bg-slate-950/60 p-3.5 rounded border border-slate-800/80 space-y-2">
            <span className="text-[13px] font-bold text-slate-100 flex items-center gap-1.5">Recommended Workflow:</span>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-400">
              <li>Open the file in SolidWorks</li>
              <li>Select <span className="text-slate-200">File &gt; Save As...</span></li>
              <li>Choose <span className="text-slate-200 font-mono">STEP (.step / .stp)</span> or <span className="text-slate-200 font-mono">IGES (.iges)</span></li>
              <li>Import the resulting file into 3D-Builder</li>
            </ol>
          </div>
        </div>

        <div className="flex gap-3 mt-2 z-10 font-sans">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-sm font-bold transition-all text-center text-slate-300 text-[13px] cursor-pointer">
            Cancel
          </button>
          <button onClick={onOpenAlternative} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-sm font-bold transition-all shadow-md text-center text-[13px] cursor-pointer">
            Open Other...
          </button>
        </div>
      </div>
    </div>
  );
};
