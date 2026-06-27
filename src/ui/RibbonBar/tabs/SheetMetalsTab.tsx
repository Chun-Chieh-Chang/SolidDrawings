import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { RibbonTabProps } from './types';

export const SheetMetalsTab: React.FC<RibbonTabProps> = ({
  setActiveTab, features, setHint, pendingFeatureCommand,
  setPendingFeatureCommand, selectedTopology, setSelectedId, addFeature,
  handleCreateEdgeFlange, handleCreateMiterFlange, handleCreateHem,
  handleCreateFlatPattern, handleUnfold, handleFold,
  handleCreateFormingTool, pushToast, setShowBendTable,
}) => {
  return (
    <div className="flex items-center gap-2 h-full animate-in fade-in slide-in-from-left-2 duration-300">
      <button onClick={() => { const featId = `feat_${uuidv4()}`; addFeature({ id: featId, type: 'BASE_FLANGE_TAB', name: `Base Flange ${features.filter(f => f.type === 'BASE_FLANGE_TAB').length + 1}`, parameters: { thickness: 1.0, bendRadius: 0.5, direction: 'ONE_DIRECTION', reverseDirection: false } }); setSelectedId(featId); setActiveTab('SHEET_METALS'); setPendingFeatureCommand('BASE_FLANGE_TAB'); setHint('Base Flange/Tab: Add a thin extruded sheet metal base from a sketch. Define thickness and bend radius.'); }} className={`flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border ${pendingFeatureCommand === 'BASE_FLANGE_TAB' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Base Flange/Tab">
        <div className={`w-7 h-7 flex items-center justify-center transition-transform ${pendingFeatureCommand === 'BASE_FLANGE_TAB' ? 'text-emerald-700 scale-110' : 'text-emerald-600 group-hover:scale-110'}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="8" width="20" height="14" rx="1"/><path d="M4 8V4h16v4"/><line x1="12" y1="4" x2="12" y2="8"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Base<br/>Flange</span>
      </button>
      <button onClick={() => { if (!selectedTopology || selectedTopology.type !== 'EDGE') { setHint('Edge Flange: Click on a solid body edge first, then press this button.'); pushToast('Select an edge on the model, then apply Edge Flange.', 'warning'); return; } if (handleCreateEdgeFlange) { handleCreateEdgeFlange({ edgeId: selectedTopology.id, flangeHeight: 10, bendRadius: 0.5, bendAngle: 90, thickness: 1.0, kFactor: 0.5, direction: 'OUTSIDE' as const, reliefType: 'RECTANGULAR' as const }); } else { setHint('Edge Flange: Select an edge on the solid body, then set parameters.'); } setActiveTab('SHEET_METALS'); }} className="flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Edge Flange">
        <div className="w-7 h-7 flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 21V3h18v18H3z"/><path d="M3 21l9-9 9 9"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Edge<br/>Flange</span>
      </button>
      <button onClick={() => { if (!selectedTopology || selectedTopology.type !== 'EDGE') { setHint('Miter Flange: Click on a solid body edge first, then press this button.'); pushToast('Select an edge on the model, then apply Miter Flange.', 'warning'); return; } if (handleCreateMiterFlange) { handleCreateMiterFlange({ edgeRefs: [], flangeHeight: 10, bendRadius: 0.5, bendAngle: 90, thickness: 1.0, kFactor: 0.5, direction: 'OUTSIDE', cornerAngle: 90 }); } else { setHint('Miter Flange: Select an edge on the solid body, then set parameters.'); } setActiveTab('SHEET_METALS'); }} className="flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Miter Flange">
        <div className="w-7 h-7 flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 21V3h18v18H3z"/><path d="M12 3l9 9H3z"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Miter</span>
      </button>
      <button onClick={() => { if (!selectedTopology || selectedTopology.type !== 'EDGE') { setHint('Hem: Click on a solid body edge first, then press this button.'); pushToast('Select an edge on the model, then apply Hem.', 'warning'); return; } if (handleCreateHem) { handleCreateHem({ edgeId: selectedTopology.id, hemLength: 5, hemRadius: 1, thickness: 1.0, hemType: 'CLOSED', gap: 0 }); } else { setHint('Hem: Select an edge on the solid body, then set parameters.'); } setActiveTab('SHEET_METALS'); }} className="flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Hem">
        <div className="w-7 h-7 flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 21V3h18v18H3z"/><path d="M3 21c4-2 8-2 12 0 4 2 6 0 6 0"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Hem</span>
      </button>
      <div className="w-[1px] h-7 bg-[#C8C8C8] mx-1" />
      <button onClick={() => { if (handleCreateFlatPattern) { handleCreateFlatPattern(); } else { setHint('Flat Pattern: compute unfolded geometry from all sheet metal features.'); } setActiveTab('SHEET_METALS'); }} className="flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Flat Pattern">
        <div className="w-7 h-7 flex items-center justify-center text-amber-600 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="1"/><line x1="2" y1="8" x2="22" y2="8"/><line x1="8" y1="2" x2="8" y2="22"/><line x1="12" y1="8" x2="12" y2="10" strokeDasharray="2 1"/><line x1="16" y1="8" x2="16" y2="10" strokeDasharray="2 1"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Flat Pattern</span>
      </button>
      <button onClick={() => { if (handleUnfold) { handleUnfold(); } else { setHint('Unfold: selectively flatten a bend.'); } setActiveTab('SHEET_METALS'); }} className="flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Unfold">
        <div className="w-7 h-7 flex items-center justify-center text-amber-600 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 15 12 9 18 15"/><path d="M3 21h18a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1z"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Unfold</span>
      </button>
      <button onClick={() => { if (handleFold) { handleFold([]); } else { setHint('Fold: re-fold a previously unfolded bend.'); } setActiveTab('SHEET_METALS'); }} className="flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Fold">
        <div className="w-7 h-7 flex items-center justify-center text-amber-600 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 9 12 15 6 9"/><path d="M3 21h18a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1z"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Fold</span>
      </button>
      <button onClick={() => { setShowBendTable(true); setActiveTab('SHEET_METALS'); }} className="flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Bend Table">
        <div className="w-7 h-7 flex items-center justify-center text-sky-600 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Bend<br/>Table</span>
      </button>
      <button onClick={() => { setActiveTab('SHEET_METALS'); setHint('Set global bend allowance parameters (K-Factor, relief type, bend radius) in the panel.'); }} className="flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Bend Allowance">
        <div className="w-7 h-7 flex items-center justify-center text-slate-600 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 20c4-8 8-8 12-4"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Bend<br/>Allow</span>
      </button>
      <div className="w-[1px] h-7 bg-[#C8C8C8] mx-1" />
      {/* Forming Tools */}
      <button onClick={() => { if (handleCreateFormingTool) { handleCreateFormingTool({ toolType: 'LOUVER', width: 10, height: 4, depth: 2, radius: 1, angle: 45, thickness: 1.0, direction: 'OUTSIDE' }); } else { setHint('Select a face, then apply Louver forming tool.'); } setActiveTab('SHEET_METALS'); }} className="flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Louver">
        <div className="w-7 h-7 flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="6" width="16" height="12" rx="1"/><line x1="6" y1="10" x2="18" y2="10"/><line x1="6" y1="14" x2="18" y2="14"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Louver</span>
      </button>
      <button onClick={() => { if (handleCreateFormingTool) { handleCreateFormingTool({ toolType: 'LANCE', width: 8, height: 3, depth: 4, radius: 1, angle: 60, thickness: 1.0, direction: 'OUTSIDE' }); } else { setHint('Select a face, then apply Lance forming tool.'); } setActiveTab('SHEET_METALS'); }} className="flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Lance">
        <div className="w-7 h-7 flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="5" width="12" height="14" rx="1"/><line x1="12" y1="5" x2="12" y2="19" strokeDasharray="2 2"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Lance</span>
      </button>
      <button onClick={() => { if (handleCreateFormingTool) { handleCreateFormingTool({ toolType: 'BRIDGE', width: 12, height: 5, depth: 3, radius: 2, angle: 0, thickness: 1.0, direction: 'OUTSIDE' }); } else { setHint('Select a face, then apply Bridge forming tool.'); } setActiveTab('SHEET_METALS'); }} className="flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Bridge">
        <div className="w-7 h-7 flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 16c4-8 12-8 16 0"/><line x1="4" y1="16" x2="20" y2="16"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Bridge</span>
      </button>
      <button onClick={() => { if (handleCreateFormingTool) { handleCreateFormingTool({ toolType: 'DIMPLE', width: 10, height: 2, depth: 2, radius: 3, angle: 0, thickness: 1.0, direction: 'OUTSIDE' }); } else { setHint('Select a face, then apply Dimple forming tool.'); } setActiveTab('SHEET_METALS'); }} className="flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Dimple">
        <div className="w-7 h-7 flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.2"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Dimple</span>
      </button>
      <button onClick={() => { if (handleCreateFormingTool) { handleCreateFormingTool({ toolType: 'DRAWN_CUTOUT', width: 8, height: 8, depth: 3, radius: 1, angle: 0, thickness: 1.0, direction: 'OUTSIDE' }); } else { setHint('Select a face, then apply Drawn Cutout forming tool.'); } setActiveTab('SHEET_METALS'); }} className="flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Drawn Cutout">
        <div className="w-7 h-7 flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="5" width="14" height="14" rx="1"/><rect x="8" y="8" width="8" height="8" rx="1"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Cutout</span>
      </button>
      <div className="w-[1px] h-7 bg-[#C8C8C8] mx-1" />
      {/* Venting */}
      <button onClick={() => { if (handleCreateFormingTool) { handleCreateFormingTool({ toolType: 'VENT_CIRCULAR', width: 50, height: 30, depth: 3, radius: 3, angle: 0, thickness: 1.0, direction: 'OUTSIDE' }); } else { setHint('Select a face, then apply Vent (circular holes) forming tool.'); } setActiveTab('SHEET_METALS'); }} className="flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Vent - Circular Holes">
        <div className="w-7 h-7 flex items-center justify-center text-teal-600 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="8" cy="10" r="2"/><circle cx="16" cy="10" r="2"/><circle cx="8" cy="16" r="2"/><circle cx="16" cy="16" r="2"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Vent<br/>Holes</span>
      </button>
      <button onClick={() => { if (handleCreateFormingTool) { handleCreateFormingTool({ toolType: 'VENT_RECTANGULAR', width: 50, height: 30, depth: 3, radius: 3, angle: 0, thickness: 1.0, direction: 'OUTSIDE' }); } else { setHint('Select a face, then apply Vent (rectangular slots) forming tool.'); } setActiveTab('SHEET_METALS'); }} className="flex flex-col items-center justify-center gap-0 px-2 h-[52px] min-w-[52px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Vent - Rectangular Slots">
        <div className="w-7 h-7 flex items-center justify-center text-teal-600 transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="6" y1="8" x2="18" y2="8"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="6" y1="16" x2="18" y2="16"/></svg>
        </div>
        <span className="text-[8px] font-medium text-slate-800 leading-tight">Vent<br/>Slots</span>
      </button>
    </div>
  );
};
