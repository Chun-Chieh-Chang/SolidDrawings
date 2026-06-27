import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { RibbonTabProps } from './types';

export const SurfacingTab: React.FC<RibbonTabProps> = ({
  setSketchMode, setSketchTool, features, setHint, pendingFeatureCommand,
  setPendingFeatureCommand, addFeature,
}) => {
  const skipWizardIfRobotWorking = () => true;
  return (
    <div className="flex items-center gap-1 h-full animate-in fade-in slide-in-from-left-2 duration-300">
      <button onClick={() => { setSketchMode(true); setSketchTool('SELECT'); setHint('Select profile for Surface Extrude'); }} className="flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Extruded Surface">
        <div className="w-7 h-7 flex items-center justify-center text-orange-500 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 3l9 4-9 4-9-4 9-4z"/><path d="M12 17l9-4-9-4-9 4 9 4z"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight text-center">Surface<br/>Extrude</span>
      </button>
      <button onClick={() => { setSketchMode(true); setSketchTool('SELECT'); }} className="flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Revolved Surface">
        <div className="w-7 h-7 flex items-center justify-center text-orange-500 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M12 12L3 12"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight text-center">Surface<br/>Revolve</span>
      </button>
      <button onClick={() => { const featId = `feat_${uuidv4()}`; addFeature({ id: featId, type: 'LOFT', name: `Surface-Loft ${features.filter(f => f.type === 'LOFT').length + 1}`, parameters: { profile_ids: [], isSurfaceOnly: true } }); }} className="flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Lofted Surface">
        <div className="w-7 h-7 flex items-center justify-center text-orange-500 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 20h16"/><path d="M8 4h8"/><path d="M4 20L8 4"/><path d="M20 20L16 4"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight text-center">Surface<br/>Loft</span>
      </button>
      <div className="w-[1px] h-7 bg-[#C8C8C8] mx-1" />
      <button onClick={() => { const featId = `feat_${uuidv4()}`; addFeature({ id: featId, type: 'SURFACE_OFFSET', name: `Offset-Surf ${features.filter(f => f.type === 'SURFACE_OFFSET').length + 1}`, parameters: { distance: 1.0, refs: [] } }); setPendingFeatureCommand('SURFACE_OFFSET'); if (skipWizardIfRobotWorking()) setHint('Select faces to offset as a surface.'); }} className="flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Offset Surface">
        <div className="w-7 h-7 flex items-center justify-center text-orange-600 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M16 14l4-4-4-4"/><path d="M20 10H4"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight text-center">Offset<br/>Surface</span>
      </button>
      <button onClick={() => { const featId = `feat_${uuidv4()}`; addFeature({ id: featId, type: 'SURFACE_KNIT', name: `Knit-Surf ${features.filter(f => f.type === 'SURFACE_KNIT').length + 1}`, parameters: { refs: [] } }); setPendingFeatureCommand('SURFACE_KNIT'); setHint('Knit surface feature created. Select surfaces to knit.'); }} className="flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Knit Surface">
        <div className="w-7 h-7 flex items-center justify-center text-orange-700 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 3H8l-5 9 5 9h8l5-9-5-9z"/><path d="M12 3v18"/><path d="M3 12h18"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight text-center">Knit<br/>Surface</span>
      </button>
      <button onClick={() => { const featId = `feat_${uuidv4()}`; addFeature({ id: featId, type: 'SURFACE_CUT', name: `Surf-Cut ${features.filter(f => f.type === 'SURFACE_CUT').length + 1}`, parameters: { tool_feature_id: '', flip: false } }); setPendingFeatureCommand('SURFACE_CUT'); if (skipWizardIfRobotWorking()) setHint('Select a surface to cut the solid body.'); }} className="flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Surface Cut">
        <div className="w-7 h-7 flex items-center justify-center text-amber-600 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="7.5 4.21 12 6.81 16.5 4.21"/><polyline points="7.5 19.79 7.5 14.6 3 12"/><polyline points="21 12 16.5 14.6 16.5 19.79"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight text-center">Surface<br/>Cut</span>
      </button>
      <div className="w-[1px] h-7 bg-[#C8C8C8] mx-1" />
      <button onClick={() => { const featId = `feat_${uuidv4()}`; addFeature({ id: featId, type: 'SURFACE_BOUNDARY', name: `Boundary-Surf ${features.filter(f => f.type === 'SURFACE_BOUNDARY').length + 1}`, parameters: { boundary_curves: [], continuity: 'G1' } }); setPendingFeatureCommand('SURFACE_BOUNDARY'); setHint('Boundary Surface: Select 4 boundary curves in sequence.'); }} className={`flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border ${pendingFeatureCommand === 'SURFACE_BOUNDARY' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Boundary Surface">
        <div className="w-7 h-7 flex items-center justify-center text-orange-400 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 12c4-4 8-4 12 0s8 4 12 0"/><path d="M12 2c-4 4-4 8 0 12s4 8 0 12"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight text-center">Boundary<br/>Surface</span>
      </button>
      <button onClick={() => { const featId = `feat_${uuidv4()}`; addFeature({ id: featId, type: 'SURFACE_TRIM', name: `Trim-Surf ${features.filter(f => f.type === 'SURFACE_TRIM').length + 1}`, parameters: { trim_curve: { points: [] }, keep_side: 'INSIDE' } }); setPendingFeatureCommand('SURFACE_TRIM'); setHint('Trim Surface: Select a surface and a trimming curve.'); }} className={`flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border ${pendingFeatureCommand === 'SURFACE_TRIM' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Trim Surface">
        <div className="w-7 h-7 flex items-center justify-center text-orange-500 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight text-center">Trim<br/>Surface</span>
      </button>
      <div className="w-[1px] h-7 bg-[#C8C8C8] mx-1" />
      <button onClick={() => { const featId = `feat_${uuidv4()}`; addFeature({ id: featId, type: 'SURFACE_FILL', name: `Fill-Surf ${features.filter(f => f.type === 'SURFACE_FILL').length + 1}`, parameters: { boundary_points: [], constraint_points: [] } }); setPendingFeatureCommand('SURFACE_FILL'); setHint('Filled Surface: Select a closed boundary loop.'); }} className={`flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border ${pendingFeatureCommand === 'SURFACE_FILL' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Filled Surface">
        <div className="w-7 h-7 flex items-center justify-center text-orange-400 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 3a9 9 0 1 0 9 9"/><path d="M3 12a9 9 0 0 1 9-9"/><path d="M12 3v9l4 4"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight text-center">Filled<br/>Surface</span>
      </button>
      <button onClick={() => { const featId = `feat_${uuidv4()}`; addFeature({ id: featId, type: 'PLANAR_SURFACE', name: `Planar-Surf ${features.filter(f => f.type === 'PLANAR_SURFACE').length + 1}`, parameters: { boundary_points: [] } }); setPendingFeatureCommand('PLANAR_SURFACE'); setHint('Planar Surface: Select a closed planar boundary.'); }} className={`flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border ${pendingFeatureCommand === 'PLANAR_SURFACE' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Planar Surface">
        <div className="w-7 h-7 flex items-center justify-center text-orange-500 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 7v10l9 5V2L3 7z"/><path d="M21 7v10l-9 5"/><path d="M21 7L12 2l-9 5"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight text-center">Planar<br/>Surface</span>
      </button>
      <button onClick={() => { const featId = `feat_${uuidv4()}`; addFeature({ id: featId, type: 'SURFACE_EXTEND', name: `Extend-Surf ${features.filter(f => f.type === 'SURFACE_EXTEND').length + 1}`, parameters: { distance: 5.0 } }); setPendingFeatureCommand('SURFACE_EXTEND'); setHint('Extend Surface: Select a face to extend.'); }} className={`flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border ${pendingFeatureCommand === 'SURFACE_EXTEND' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Extend Surface">
        <div className="w-7 h-7 flex items-center justify-center text-orange-600 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20"/><path d="M5 9l7-7 7 7"/><path d="M19 15l-7 7-7-7"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight text-center">Extend<br/>Surface</span>
      </button>
      <button onClick={() => { const featId = `feat_${uuidv4()}`; addFeature({ id: featId, type: 'SURFACE_UNTRIM', name: `Untrim-Surf ${features.filter(f => f.type === 'SURFACE_UNTRIM').length + 1}`, parameters: {} }); setPendingFeatureCommand('SURFACE_UNTRIM'); setHint('Untrim Surface: Select a trimmed face.'); }} className={`flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border ${pendingFeatureCommand === 'SURFACE_UNTRIM' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Untrim Surface">
        <div className="w-7 h-7 flex items-center justify-center text-orange-400 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="9"/><path d="M12 3v18"/><path d="M3 12h18"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight text-center">Untrim<br/>Surface</span>
      </button>
      <button onClick={() => { const featId = `feat_${uuidv4()}`; addFeature({ id: featId, type: 'RULED_SURFACE', name: `Ruled-Surf ${features.filter(f => f.type === 'RULED_SURFACE').length + 1}`, parameters: { curve1_points: [], curve2_points: [] } }); setPendingFeatureCommand('RULED_SURFACE'); setHint('Ruled Surface: Select two curves.'); }} className={`flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border ${pendingFeatureCommand === 'RULED_SURFACE' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Ruled Surface">
        <div className="w-7 h-7 flex items-center justify-center text-orange-500 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 20L8 4"/><path d="M20 20L16 4"/><path d="M4 20h16"/><path d="M8 4h8"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight text-center">Ruled<br/>Surface</span>
      </button>
    </div>
  );
};
