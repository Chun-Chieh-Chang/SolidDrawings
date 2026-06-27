import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { extractAllClosedLoops } from '../../../utils/geometry/GraphAdapter';
import type { RibbonTabProps } from './types';

export const FeaturesTab: React.FC<RibbonTabProps> = ({
  setActiveTab, setSketchMode, setSketchTool, setEditingFeatureId,
  setMeasurementMode, setMeasurementPoints, setMeasurementResults,
  handleImportStep, solidSketchPointCount, handleExitAndExtrude,
  handleRevolveFromSketch, features, setHint, pendingFeatureCommand,
  setPendingFeatureCommand, sketchNodes, sketchEdges, addFeature,
  setSelectedId, setSelectedSubNodeType, setActivePropertyManager,
  pushToast, setSelectedTopology, fileInputRef, getState,
  isSketchMode,
}) => {
  const appliedEdgeFeatureRef = React.useRef<string | null>(null);
  const skipWizardIfRobotWorking = () => true;

  return (
    <div className="flex items-center gap-2 h-full animate-in fade-in slide-in-from-left-2 duration-300">
      <input type="file" accept=".step,.stp,.iges,.igs" className="hidden"
        ref={(ref) => { (window as any)._fileInputRef = ref; }}
        onChange={handleImportStep} />
      <button onClick={() => (window as any)._fileInputRef?.click()} className="flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Import STEP">
        <div className="w-7 h-7 flex items-center justify-center text-[#005B9A] transition-transform group-hover:scale-110">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Import</span>
      </button>
      <div className="w-[1px] h-7 bg-[#C8C8C8] mx-1" />
      <button onClick={() => { if (solidSketchPointCount >= 3) { handleExitAndExtrude?.(); } else { setSketchMode(true); setSketchTool('SELECT'); if (solidSketchPointCount > 0) pushToast('Insufficient points: Extrude requires at least 3 sketch points.', 'info'); } }} className="flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Extruded Boss/Base">
        <div className="w-7 h-7 flex items-center justify-center text-[#005B9A] transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Extrude</span>
      </button>
      <button onClick={() => { if (solidSketchPointCount >= 2) { handleExitAndExtrude?.('CUT'); } else { setSketchMode(true); setSketchTool('SELECT'); if (solidSketchPointCount > 0) pushToast('Insufficient points: Cut requires at least 2 Sketch points.', 'info'); } }} className="flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Extruded Cut">
        <div className="w-7 h-7 flex items-center justify-center text-red-600 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M12 22V12"/><path d="M3 8l9 4 9-4"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Cut</span>
      </button>
      <button onClick={() => { if (solidSketchPointCount >= 3) { handleExitAndExtrude?.('ADD'); } else { setSketchMode(true); setSketchTool('SELECT'); } }} className="flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[48px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Extrude Up To Next">
        <div className="w-7 h-7 flex items-center justify-center text-[#005B9A] transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="12 12 12 22"/><polyline points="7 17 12 22 17 17"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight text-center">Up To<br/>Next</span>
      </button>
      <button onClick={() => { const newId = `feat_${uuidv4()}`; addFeature({ id: newId, type: 'HOLE', name: `Hole ${features.filter(f => f.type === 'HOLE').length + 1}`, parameters: { holeType: 'COUNTERBORE', standard: 'ISO', size: 'M5', depth: 10.0, endCondition: 'THROUGH_ALL' } }); setSelectedId(newId); }} className="flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Hole Wizard">
        <div className="w-7 h-7 flex items-center justify-center text-slate-700 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="9"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight text-center">Hole<br/>Wizard</span>
      </button>
      <button onClick={() => { if (solidSketchPointCount >= 2) { handleExitAndExtrude?.('SURFACE'); } else { setSketchMode(true); setSketchTool('SELECT'); } }} className="flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Extruded Surface">
        <div className="w-7 h-7 flex items-center justify-center text-orange-500 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 3l9 4-9 4-9-4 9-4z"/><path d="M12 17l9-4-9-4-9 4 9 4z"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Surface</span>
      </button>
      <div className="w-[1px] h-7 bg-[#C8C8C8] mx-1" />
      <button onClick={() => {         const loops = extractAllClosedLoops(sketchNodes as any, sketchEdges as any); if (isSketchMode && loops.length > 0 && loops[0].length >= 3) { handleRevolveFromSketch?.(); } else { setSketchMode(true); setSketchTool('SELECT'); if (isSketchMode && loops.length === 0) pushToast('Cannot Rotate: closed profile required.', 'warning'); else setHint('Draw closed profile, then Revolved Boss/Base'); } }} className={`flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border ${pendingFeatureCommand ? 'border-transparent' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Revolve Boss/Base">
        <div className="w-7 h-7 flex items-center justify-center text-[#005B9A] transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><polyline points="21 3 21 8 16 8"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Revolve</span>
      </button>
      <button onClick={() => { const loops = extractAllClosedLoops(sketchNodes as any, sketchEdges as any); if (isSketchMode && loops.length > 0 && loops[0].length >= 3) { handleRevolveFromSketch?.('CUT'); } else { setSketchMode(true); setSketchTool('SELECT'); if (isSketchMode && loops.length === 0) pushToast('Cannot RotateCut: closed profile required.', 'warning'); else setHint('Draw closed profile, then Revolved Cut'); } }} className={`flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border ${pendingFeatureCommand ? 'border-transparent' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Revolved Cut">
        <div className="w-7 h-7 flex items-center justify-center text-red-600 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M12 12L3 12"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight text-center">Rev<br/>Cut</span>
      </button>
      <button onClick={() => { addFeature({ id: `feat_${uuidv4()}`, type: 'SWEEP', name: `Sweep ${features.filter(f => f.type === 'SWEEP').length + 1}`, parameters: { profile_id: '', path_id: '', circularProfile: false, diameter: 10.0, guide_ids: [], isThin: false, thinThickness: 1.0, thinDirection: 'ONE_DIRECTION', operation: 'ADD', twistType: 'NONE', twistValue: 0.0 } }); setHint('Sweep feature created. Configure in PropertyManager.'); }} className="flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Swept Boss/Base">
        <div className="w-7 h-7 flex items-center justify-center text-[#005B9A] transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 22C4 13 14 13 14 4"/><circle cx="14" cy="4" r="2"/><circle cx="4" cy="22" r="2"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Sweep</span>
      </button>
      <button onClick={() => { addFeature({ id: `feat_${uuidv4()}`, type: 'HELICAL_SWEEP', name: `Helix ${features.filter(f => f.type === 'HELICAL_SWEEP').length + 1}`, parameters: { profile_id: '', pitch: 5, revolutions: 10, diameter: 20, handedness: 'CW', start_angle: 0, taper_angle: 0, axis_ref: null } }); setHint('Helical Sweep created. Configure in PropertyManager.'); }} className="flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Helical Sweep">
        <div className="w-7 h-7 flex items-center justify-center text-[#005B9A] transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2C12 2 15 5 15 10C15 15 9 15 9 10C9 5 12 2 12 2Z" opacity="0.5"/><path d="M12 22V2M12 22C16 22 19 19 19 15C19 11 12 8 12 2M12 22C8 22 5 19 5 15C5 11 12 8 12 2"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight text-center">Helical<br/>Sweep</span>
      </button>
      <button onClick={() => { addFeature({ id: `feat_${uuidv4()}`, type: 'LOFT', name: `Loft ${features.filter(f => f.type === 'LOFT' && f.parameters.operation !== 'CUT').length + 1}`, parameters: { profile_ids: [], guide_ids: [], operation: 'ADD', isThin: false, thinThickness: 1.0, startConstraint: 'NONE', endConstraint: 'NONE', startMagnitude: 1.0, endMagnitude: 1.0 } }); setHint('Loft feature created. Configure in PropertyManager.'); }} className={`flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group`} title="Lofted Boss/Base">
        <div className="w-7 h-7 flex items-center justify-center text-[#005B9A] transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 20h16"/><path d="M6 12h12"/><path d="M8 4h8"/><path d="M4 20L8 4"/><path d="M20 20L16 4"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Loft</span>
      </button>
      <button onClick={() => { addFeature({ id: `feat_${uuidv4()}`, type: 'LOFT', name: `Lofted Cut ${features.filter(f => f.type === 'LOFT' && f.parameters.operation === 'CUT').length + 1}`, parameters: { profile_ids: [], guide_ids: [], operation: 'CUT', isThin: false, thinThickness: 1.0, startConstraint: 'NONE', endConstraint: 'NONE', startMagnitude: 1.0, endMagnitude: 1.0 } }); setHint('Lofted Cut feature created. Configure in PropertyManager.'); }} className={`flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group`} title="Lofted Cut">
        <div className="w-7 h-7 flex items-center justify-center text-rose-600 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 20h16M6 12h12M8 4h8M4 20L8 4M20 20L16 4"/><path d="M12 4v16" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight text-center">Lofted<br/>Cut</span>
      </button>
      <button onClick={() => { const featId = `feat_${uuidv4()}`; addFeature({ id: featId, type: 'WRAP', name: `Wrap ${features.filter(f => f.type === 'WRAP').length + 1}`, parameters: { wrap_type: 'EMBOSS', thickness: 1.0, plane: 'TOP', points: [] } }); setSelectedId(featId); setActiveTab('FEATURES'); setHint('Wrap: sketch a profile on a plane to wrap onto the surface.'); }} className={`flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group`} title="Wrap">
        <div className="w-7 h-7 flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12c0-4 3-8 9-8s9 4 9 8-3 8-9 8-9-4-9-8z"/><path d="M3 12h18"/><path d="M12 4c-2 0-4 4-4 8s2 8 4 8" opacity="0.5"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Wrap</span>
      </button>
      <button onClick={() => { if (features.length === 0) { alert('Create a solid body first!'); return; } const featId = `feat_${uuidv4()}`; addFeature({ id: featId, type: 'FILLET', name: `Fillet ${features.filter(f => f.type === 'FILLET').length + 1}`, parameters: { radius: 2, radius2: 2, refs: [] } }); setSelectedId(featId); appliedEdgeFeatureRef.current = null; setActiveTab('FEATURES'); if (skipWizardIfRobotWorking()) { setPendingFeatureCommand('FILLET'); setSelectedTopology(null); setHint('Select an edge to fillet, then adjust parameters.'); } }} className={`flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border ${pendingFeatureCommand === 'FILLET' ? 'border-[#005B9A] bg-white shadow-sm' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Fillet">
        <div className="w-7 h-7 flex items-center justify-center text-[#005B9A] transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 2a7 7 0 0 1 7 7"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Fillet</span>
      </button>
      <button onClick={() => { appliedEdgeFeatureRef.current = null; setActiveTab('FEATURES'); if (skipWizardIfRobotWorking()) { setPendingFeatureCommand('CHAMFER'); setSelectedTopology(null); } }} className={`flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border ${pendingFeatureCommand === 'CHAMFER' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Chamfer">
        <div className={`w-7 h-7 flex items-center justify-center transition-transform ${pendingFeatureCommand === 'CHAMFER' ? 'text-[#005B9A] scale-110' : 'text-slate-600 group-hover:scale-110'}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="2" x2="19" y2="9"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Chamfer</span>
      </button>
      <button onClick={() => { appliedEdgeFeatureRef.current = null; setActiveTab('FEATURES'); if (skipWizardIfRobotWorking()) { setPendingFeatureCommand('THICKEN'); setSelectedTopology(null); } }} className={`flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border ${pendingFeatureCommand === 'THICKEN' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Thicken">
        <div className={`w-7 h-7 flex items-center justify-center transition-transform ${pendingFeatureCommand === 'THICKEN' ? 'text-orange-500 scale-110' : 'text-slate-600 group-hover:scale-110'}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="7.5 4.21 12 6.81 16.5 4.21"/><polyline points="7.5 19.79 12 17.19 16.5 19.79"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Thicken</span>
      </button>
      <div className="w-[1px] h-7 bg-[#C8C8C8] mx-1" />
      <button onClick={() => { const featId = `feat_${uuidv4()}`; addFeature({ id: featId, type: 'SPLIT', name: `Split ${features.filter(f => f.type === 'SPLIT').length + 1}`, parameters: { split_plane: { point: [0,0,0], normal: [0,0,1] } } }); setPendingFeatureCommand('SPLIT'); setHint('Split: Select a face or plane to split the body.'); }} className={`flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border ${pendingFeatureCommand === 'SPLIT' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Split">
        <div className={`w-7 h-7 flex items-center justify-center transition-transform ${pendingFeatureCommand === 'SPLIT' ? 'text-purple-600 scale-110' : 'text-slate-600 group-hover:scale-110'}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M2 12h20"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Split</span>
      </button>
      <button onClick={() => { const featId = `feat_${uuidv4()}`; addFeature({ id: featId, type: 'COMBINE', name: `Combine ${features.filter(f => f.type === 'COMBINE').length + 1}`, parameters: { operation: 'ADD', tool_feature_id: '' } }); setPendingFeatureCommand('COMBINE'); setHint('Combine: Select two bodies to add, subtract, or intersect.'); }} className={`flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border ${pendingFeatureCommand === 'COMBINE' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Combine">
        <div className={`w-7 h-7 flex items-center justify-center transition-transform ${pendingFeatureCommand === 'COMBINE' ? 'text-purple-600 scale-110' : 'text-slate-600 group-hover:scale-110'}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="9" cy="12" r="7"/><circle cx="15" cy="12" r="7"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Combine</span>
      </button>
      <button onClick={() => { const featId = `feat_${uuidv4()}`; addFeature({ id: featId, type: 'COMBINE', name: `Intersect ${features.filter(f => f.type === 'COMBINE' && f.parameters?.operation === 'INTERSECT').length + 1}`, parameters: { operation: 'INTERSECT', tool_feature_id: '' } }); setPendingFeatureCommand('COMBINE'); setHint('Intersect: select a tool body to intersect with the current part.'); }} className={`flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border ${pendingFeatureCommand === 'COMBINE' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Intersect">
        <div className={`w-7 h-7 flex items-center justify-center transition-transform ${pendingFeatureCommand === 'COMBINE' ? 'text-orange-600 scale-110' : 'text-slate-600 group-hover:scale-110'}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/><path d="M9 6a6 6 0 0 0 0 12 6 6 0 0 0 6-6"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Intersect</span>
      </button>
      <div className="w-[1px] h-7 bg-[#C8C8C8] mx-1" />
      <button onClick={() => { const featId = `feat_${uuidv4()}`; addFeature({ id: featId, type: 'PATTERN', name: `Pattern ${features.filter(f => f.type === 'PATTERN').length + 1}`, parameters: { pattern_type: 'LINEAR', count: 2, spacing: 10, axis: 'X', direction_refs: [], target_feature_ids: [] } }); setSelectedId(featId); appliedEdgeFeatureRef.current = null; setActiveTab('FEATURES'); if (skipWizardIfRobotWorking()) { setPendingFeatureCommand('PATTERN'); setSelectedTopology(null); setHint('Select a target feature, then select a linear edge for direction.'); } }} className={`flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border ${pendingFeatureCommand === 'PATTERN' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Pattern">
        <div className={`w-7 h-7 flex items-center justify-center transition-transform ${pendingFeatureCommand === 'PATTERN' ? 'text-indigo-500 scale-110' : 'text-[#005B9A] group-hover:scale-110'}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Pattern</span>
      </button>
      <button onClick={() => { const featId = `feat_${uuidv4()}`; addFeature({ id: featId, type: 'MIRROR', name: `Mirror ${features.filter(f => f.type === 'MIRROR').length + 1}`, parameters: { mirror_plane_refs: [], target_feature_ids: [] } }); setSelectedId(featId); appliedEdgeFeatureRef.current = null; setActiveTab('FEATURES'); if (skipWizardIfRobotWorking()) { setPendingFeatureCommand('MIRROR'); setSelectedTopology(null); setHint('Select a plane or planar face to mirror about.'); } }} className={`flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border ${pendingFeatureCommand === 'MIRROR' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Mirror">
        <div className={`w-7 h-7 flex items-center justify-center transition-transform ${pendingFeatureCommand === 'MIRROR' ? 'text-indigo-500 scale-110' : 'text-[#005B9A] group-hover:scale-110'}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Mirror</span>
      </button>
      <button onClick={() => { const featId = `feat_${uuidv4()}`; addFeature({ id: featId, type: 'DRAFT', name: `Draft ${features.filter(f => f.type === 'DRAFT').length + 1}`, parameters: { angle: 5, neutral_plane_refs: [], faces_to_draft_refs: [] } }); setSelectedId(featId); appliedEdgeFeatureRef.current = null; setActiveTab('FEATURES'); if (skipWizardIfRobotWorking()) { setPendingFeatureCommand('DRAFT'); setSelectedTopology(null); setHint('Step 1: Select a neutral plane. Step 2: Select faces to draft.'); } }} className={`flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border ${pendingFeatureCommand === 'DRAFT' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Draft">
        <div className={`w-7 h-7 flex items-center justify-center transition-transform ${pendingFeatureCommand === 'DRAFT' ? 'text-[#005B9A] scale-110' : 'text-[#005B9A] group-hover:scale-110'}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Draft</span>
      </button>
      <div className="w-[1px] h-7 bg-[#C8C8C8] mx-1" />
      <button onClick={() => { const featId = `feat_${uuidv4()}`; addFeature({ id: featId, type: 'SHELL', name: `Shell ${features.filter(f => f.type === 'SHELL').length + 1}`, parameters: { thickness: 2, faces_to_remove_refs: [], flip: false } }); setSelectedId(featId); appliedEdgeFeatureRef.current = null; setActiveTab('FEATURES'); if (skipWizardIfRobotWorking()) { setPendingFeatureCommand('SHELL'); setSelectedTopology(null); setHint('Select faces to remove to create a shell.'); } }} className={`flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border ${pendingFeatureCommand === 'SHELL' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Shell">
        <div className={`w-7 h-7 flex items-center justify-center transition-transform ${pendingFeatureCommand === 'SHELL' ? 'text-teal-600 scale-110' : 'text-[#005B9A] group-hover:scale-110'}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M7 7h10v10H7z"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Shell</span>
      </button>
      <button onClick={() => { const featId = `feat_${uuidv4()}`; addFeature({ id: featId, type: 'DOME', name: `Dome ${features.filter(f => f.type === 'DOME').length + 1}`, parameters: { distance: 2.0, refs: [], reverse: false } }); setSelectedId(featId); if (skipWizardIfRobotWorking()) { setPendingFeatureCommand('DOME'); setSelectedTopology(null); setHint('Select a face to apply a Dome feature.'); } }} className={`flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border ${pendingFeatureCommand === 'DOME' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Dome">
        <div className={`w-7 h-7 flex items-center justify-center transition-transform ${pendingFeatureCommand === 'DOME' ? 'text-indigo-500 scale-110' : 'text-[#005B9A] group-hover:scale-110'}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 20a10 10 0 0 1 20 0H2z"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Dome</span>
      </button>
      <button onClick={() => { const featId = `feat_${uuidv4()}`; addFeature({ id: featId, type: 'RIB', name: `Rib ${features.filter(f => f.type === 'RIB').length + 1}`, parameters: { thickness: 2.0, direction: 'BOTH' } }); setPendingFeatureCommand('RIB'); pushToast('Rib feature created. Uses thin-feature extrude.', 'info'); }} className={`flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border ${pendingFeatureCommand === 'RIB' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Rib">
        <div className="w-7 h-7 flex items-center justify-center transition-transform text-[#005B9A] group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 21h18M3 14l9-9 9 9M9 14v7M15 14v7"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Rib</span>
      </button>
      <div className="w-[1px] h-7 bg-[#C8C8C8] mx-1" />
      <button onClick={() => { const featId = `feat_${uuidv4()}`; addFeature({ id: featId, type: 'REFERENCE_PLANE', name: `Plane ${features.filter(f => f.type === 'REFERENCE_PLANE').length + 1}`, parameters: { planeType: 'OFFSET', offset: 10, refs: [], flip: false } }); setSelectedId(featId); setSelectedSubNodeType('FEATURE'); if (skipWizardIfRobotWorking()) setHint('Select entities (faces, points, edges) to define the reference plane.'); }} className={`flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group`} title="Reference Plane">
        <div className={`w-7 h-7 flex items-center justify-center transition-transform text-slate-600 group-hover:scale-110`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight text-center">Ref<br/>Plane</span>
      </button>
      <button onClick={() => { const featId = `feat_${uuidv4()}`; addFeature({ id: featId, type: 'REFERENCE_AXIS', name: `Axis ${features.filter(f => f.type === 'REFERENCE_AXIS').length + 1}`, parameters: { axisType: 'TWO_POINTS', refs: [] } }); setSelectedId(featId); setSelectedSubNodeType('FEATURE'); if (skipWizardIfRobotWorking()) setHint('Select entities to define the reference axis.'); }} className={`flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group`} title="Reference Axis">
        <div className={`w-7 h-7 flex items-center justify-center transition-transform text-slate-600 group-hover:scale-110`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="2" x2="12" y2="22"/><polyline points="5 12 12 12 19 12"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight text-center">Ref<br/>Axis</span>
      </button>
      <button onClick={() => { const featId = `feat_${uuidv4()}`; addFeature({ id: featId, type: 'REFERENCE_POINT', name: `Point ${features.filter(f => f.type === 'REFERENCE_POINT').length + 1}`, parameters: { pointType: 'FACE_CENTER', refs: [] } }); setSelectedId(featId); setSelectedSubNodeType('FEATURE'); if (skipWizardIfRobotWorking()) setHint('Select entities to define the reference point.'); }} className={`flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group`} title="Reference Point">
        <div className={`w-7 h-7 flex items-center justify-center transition-transform text-slate-600 group-hover:scale-110`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight text-center">Ref<br/>Point</span>
      </button>
      <button onClick={() => { setActivePropertyManager({ type: 'COORDINATE_SYSTEM', creationMode: 'planes' }); setPendingFeatureCommand('COORDINATE_SYSTEM'); setHint('Select 3 planes/faces, 2 axes, or 3 points to define the coordinate system.'); }} className={`flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group`} title="Coordinate System">
        <div className={`w-7 h-7 flex items-center justify-center transition-transform text-slate-600 group-hover:scale-110`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="2" y1="12" x2="22" y2="12" stroke="#EF4444" strokeWidth="3"/>
            <polyline points="16 8 22 12 16 16"/>
            <line x1="12" y1="2" x2="12" y2="22" stroke="#10B981" strokeWidth="3"/>
            <polyline points="8 8 12 2 16 8"/>
            <line x1="12" y1="12" x2="4" y2="20" stroke="#3B82F6" strokeWidth="2" strokeDasharray="2 2"/>
          </svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight text-center">Ref<br/>CSYS</span>
      </button>
      <button onClick={() => { const featId = `feat_${uuidv4()}`; addFeature({ id: featId, type: 'HOLE_WIZARD', name: `Hole ${features.filter(f => f.type === 'HOLE_WIZARD').length + 1}`, parameters: { hole_type: 'SIMPLE', diameter: 5, depth: 10, hole_placement_refs: [] } }); setSelectedId(featId); appliedEdgeFeatureRef.current = null; setActiveTab('FEATURES'); setPendingFeatureCommand('HOLE_WIZARD'); setSelectedTopology(null); if (skipWizardIfRobotWorking()) setHint('Click on a face to place the hole.'); }} className={`flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border ${pendingFeatureCommand === 'HOLE_WIZARD' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Hole Wizard">
        <div className={`w-7 h-7 flex items-center justify-center transition-transform ${pendingFeatureCommand === 'HOLE_WIZARD' ? 'text-teal-600 scale-110' : 'text-slate-600 group-hover:scale-110'}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M2 12h4"/><path d="M18 12h4"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Hole</span>
      </button>
    </div>
  );
};
