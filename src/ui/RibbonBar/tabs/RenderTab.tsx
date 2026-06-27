import React from 'react';
import type { RibbonTabProps } from './types';
import { MATERIAL_PRESETS } from '../../../store/types';

export const RenderTab: React.FC<RibbonTabProps> = ({
  partMaterial, setPartMaterial,
  environmentMap, setEnvironmentMap,
  viewportDisplayMode, setViewportDisplayMode,
}) => {
  return (
    <div className="flex items-center gap-2 h-full animate-in fade-in slide-in-from-left-2 duration-300">
      <div className="flex flex-col gap-1 px-3 py-1 border border-[#A0A0A0] rounded bg-white">
        <label className="text-[8px] font-medium text-slate-600 tracking-wider">Material</label>
        <select
          className="text-[12px] bg-slate-100 border border-slate-300 rounded px-2 py-1 outline-none font-bold text-slate-800"
          value={partMaterial}
          onChange={(e) => setPartMaterial(e.target.value)}
        >
          {Object.keys(MATERIAL_PRESETS).map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="w-px h-7 bg-[#C8C8C8] mx-1"></div>
      <div className="flex flex-col gap-1 px-3 py-1 border border-[#A0A0A0] rounded bg-white">
        <label className="text-[8px] font-medium text-slate-600 tracking-wider">Environment</label>
        <select
          className="text-[12px] bg-slate-100 border border-slate-300 rounded px-2 py-1 outline-none font-bold text-slate-800"
          value={environmentMap}
          onChange={(e) => setEnvironmentMap(e.target.value)}
        >
          <option value="studio">Studio</option>
          <option value="city">City</option>
          <option value="forest">Forest</option>
          <option value="sunset">Sunset</option>
          <option value="dawn">Dawn</option>
          <option value="night">Night</option>
        </select>
      </div>
      <div className="w-px h-7 bg-[#C8C8C8] mx-1"></div>
      <button
        onClick={() => {
          const currentMode = viewportDisplayMode;
          setViewportDisplayMode(currentMode === 'SHADED' ? 'SHADED_EDGES' : 'SHADED');
        }}
        className={`flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 rounded-md group`}
        title="Display Style (Toggle Edges)"
      >
        <div className="w-7 h-7 flex items-center justify-center text-slate-700 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Display<br />Style</span>
      </button>
    </div>
  );
};
