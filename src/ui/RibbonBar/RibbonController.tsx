'use client';

import React from 'react';
import { useCadStore } from '../../store/useCadStore';
import { v4 as uuidv4 } from 'uuid';
import { handleCreateStandard3Views, handleCreateModelView } from '../../handlers/drawing-view-builders';
import type { RibbonTabProps } from './tabs/types';
import { FeaturesTab, SketchTab, EvaluateTab, AssemblyTab, DrawingTab, RenderTab, SurfacingTab, SheetMetalsTab } from './tabs';

interface RibbonControllerProps {
  activeTab: 'FEATURES' | 'SKETCH' | 'EVALUATE' | 'ASSEMBLY' | 'DRAWING' | 'RENDER' | 'SURFACING' | 'SHEET_METALS';
  setActiveTab: (tab: any) => void;
  engineStatus: 'CONNECTED' | 'DISCONNECTED';
  solidSketchPointCount: number;
  handleExitAndExtrude: (op?: any) => void;
  handleRevolveFromSketch: (op?: 'ADD' | 'CUT') => void;
  handleImportStep: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCreateEdgeFlange?: (params: any) => void;
  handleCreateMiterFlange?: (params: any) => void;
  handleCreateHem?: (params: any) => void;
  handleCreateFlatPattern?: () => void;
  handleUnfold?: (bendIds?: string[]) => void;
  handleFold?: (bendIds: string[]) => void;
  handleCreateFormingTool?: (params: { toolType: string; width: number; height: number; depth: number; radius: number; angle: number; thickness: number; direction: string }) => void;
  onShowMassProps?: () => void;
  onShowEquations?: () => void;
}

export const RibbonController: React.FC<RibbonControllerProps> = ({
  activeTab,
  setActiveTab,
  engineStatus,
  solidSketchPointCount,
  handleExitAndExtrude,
  handleRevolveFromSketch,
  handleImportStep,
  handleCreateEdgeFlange,
  handleCreateMiterFlange,
  handleCreateHem,
  handleCreateFlatPattern,
  handleUnfold,
  handleFold,
  handleCreateFormingTool,
  onShowMassProps,
  onShowEquations,
}) => {
  const {
    features,
    isSketchMode,
    setSketchMode,
    sketchTool,
    setSketchTool,
    setEditingFeatureId,
    setActivePlane,
    activePlane,
    triggerCameraNormal,
    selectedTopology,
    setSelectedTopology,
    setActiveFaceOrigin,
    setActiveFaceNormal,
    setActiveFaceId,
    setMeasurementMode,
    setMeasurementPoints,
    setMeasurementResults,
    measurementMode,
    interferenceActive,
    setInterferenceActive,
    setHint,
    pendingFeatureCommand,
    setPendingFeatureCommand,
    sketchNodes,
    sketchEdges,
    addFeature,
    setSelectedId,
    setSelectedSubNodeType,
    setActivePropertyManager,
    pushToast,
    components,
    viewportDisplayMode,
    setViewportDisplayMode,
    explodedView,
    setExplodedView,
    calculateAutoExplosion,
    partMaterial,
    setPartMaterial,
    environmentMap,
    setEnvironmentMap,
    setShowBendTable,
  } = useCadStore();

  const tabProps: RibbonTabProps = {
    setActiveTab,
    isSketchMode, setSketchMode, sketchTool, setSketchTool,
    setEditingFeatureId: setEditingFeatureId as any,
    setActivePlane: setActivePlane as any,
    activePlane: activePlane ?? '',
    triggerCameraNormal,
    selectedTopology: selectedTopology as any, setSelectedTopology: setSelectedTopology as any,
    setActiveFaceOrigin: setActiveFaceOrigin as any, setActiveFaceNormal: setActiveFaceNormal as any,
    setActiveFaceId: setActiveFaceId as any,
    setMeasurementMode: setMeasurementMode as any, setMeasurementPoints: setMeasurementPoints as any,
    setMeasurementResults: setMeasurementResults as any,
    measurementMode, interferenceActive, setInterferenceActive,
    setHint, pendingFeatureCommand, setPendingFeatureCommand: setPendingFeatureCommand as any,
    features, addFeature, setSelectedId: setSelectedId as any,
    setSelectedSubNodeType: setSelectedSubNodeType as any,
    setActivePropertyManager: setActivePropertyManager as any,
    sketchNodes: sketchNodes as any, sketchEdges: sketchEdges as any,
    pushToast, components,
    viewportDisplayMode, setViewportDisplayMode: setViewportDisplayMode as any,
    explodedView: explodedView as any, setExplodedView: setExplodedView as any,
    calculateAutoExplosion, partMaterial, setPartMaterial,
    environmentMap, setEnvironmentMap, setShowBendTable,
    handleCreateStandard3Views, handleCreateModelView,
    handleCreateEdgeFlange, handleCreateMiterFlange, handleCreateHem,
    handleCreateFlatPattern, handleUnfold, handleFold, handleCreateFormingTool,
    handleImportStep, onShowMassProps, onShowEquations,
    solidSketchPointCount,
    handleExitAndExtrude: handleExitAndExtrude as any,
    handleRevolveFromSketch: handleRevolveFromSketch as any,
    getState: () => useCadStore.getState(),
    measurementPoints: [],
    setLargeAssemblyMode: (() => {}) as any,
    isLargeAssemblyMode: false,
    fileInputRef: undefined as any,
  };

  return (
    <div className="h-[110px] w-full bg-[#E8E8E8] border-b border-[#A0A0A0] flex flex-col z-20 shrink-0 select-none">
      {/* Ribbon Tabs */}
      <div className="flex px-2 border-b border-[#A0A0A0] bg-[#D6DADC]">
        <button
          onClick={() => { setActiveTab('SHEET_METALS'); setMeasurementMode('NONE'); setMeasurementPoints([]); setMeasurementResults(null); } }
          className={`px-6 py-1.5 text-[11px] font-black transition-all border-b-[3px] uppercase ${activeTab === "SHEET_METALS" ? "border-emerald-600 text-emerald-700 bg-white shadow-sm" : "border-transparent text-slate-600 hover:bg-white/50"}`}
        >SHEET METAL</button>
        <button
          onClick={() => { setActiveTab('FEATURES'); setMeasurementMode('NONE'); setMeasurementPoints([]); setMeasurementResults(null); } }
          className={`px-6 py-1.5 text-[11px] font-black transition-all border-b-[3px] uppercase ${activeTab === "FEATURES" ? "border-[#005B9A] text-[#005B9A] bg-white shadow-sm" : "border-transparent text-slate-600 hover:bg-white/50"}`}
        >FEATURES</button>
        <button
          onClick={() => { setActiveTab('SURFACING'); setMeasurementMode('NONE'); } }
          className={`px-6 py-1.5 text-[11px] font-black transition-all border-b-[3px] uppercase ${activeTab === "SURFACING" ? "border-orange-500 text-orange-600 bg-white shadow-sm" : "border-transparent text-slate-600 hover:bg-white/50"}` }
        >SURFACES</button>
        <button
          onClick={() => {
            setActiveTab('SKETCH'); 
            setMeasurementMode('NONE'); 
            setMeasurementPoints([]); 
            setMeasurementResults(null);
            
            if (!isSketchMode) { 
              setEditingFeatureId(null); 
              if (selectedTopology?.type === 'FACE' && selectedTopology.coordinates && selectedTopology.normal) {
                setActiveFaceOrigin(selectedTopology.coordinates); 
                setActiveFaceNormal(selectedTopology.normal);
                setActiveFaceId(selectedTopology.id || `face_${uuidv4()}`); 
                setActivePlane('FACE'); 
                triggerCameraNormal();
              } 
              else if (activePlane) {
                triggerCameraNormal();
              }
              else {
                setActivePlane('FRONT');
                triggerCameraNormal();
              }
              
              setSketchMode(true); 
              setSketchTool('SELECT');
            }
          } }
          className={`px-6 py-1.5 text-[11px] font-black transition-all border-b-[3px] uppercase ${activeTab === "SKETCH" ? "border-[#005B9A] text-[#005B9A] bg-white shadow-sm" : "border-transparent text-slate-600 hover:bg-white/50"}` }
        >SKETCH</button>
        <button
          onClick={() => { setActiveTab('EVALUATE'); setMeasurementMode('NONE'); } }
          className={`px-6 py-1.5 text-[11px] font-black transition-all border-b-[3px] uppercase ${activeTab === "EVALUATE" ? "border-[#005B9A] text-[#005B9A] bg-white shadow-sm" : "border-transparent text-slate-600 hover:bg-white/50"}` }
        >EVALUATE</button>
        <button
          onClick={() => { setActiveTab('ASSEMBLY'); setMeasurementMode('NONE'); useCadStore.getState().setMode('ASSEMBLY'); } }
          className={`px-6 py-1.5 text-[11px] font-black transition-all border-b-[3px] uppercase ${activeTab === "ASSEMBLY" ? "border-[#005B9A] text-[#005B9A] bg-white shadow-sm" : "border-transparent text-slate-600 hover:bg-white/50"}` }
        >ASSEMBLY</button>
        <button
          onClick={() => { setActiveTab('DRAWING'); setMeasurementMode('NONE'); useCadStore.getState().setMode('DRAWING'); } }
          className={`px-6 py-1.5 text-[11px] font-black transition-all border-b-[3px] uppercase ${activeTab === "DRAWING" ? "border-amber-600 text-amber-700 bg-amber-50 shadow-sm" : "border-transparent text-slate-600 hover:bg-white/50"}` }
        >DRAWING</button>
        <button
          onClick={() => { setActiveTab('RENDER'); setMeasurementMode('NONE'); useCadStore.getState().setMode('RENDER'); } }
          className={`px-6 py-1.5 text-[11px] font-black transition-all border-b-[3px] uppercase ${activeTab === "RENDER" ? "border-[#005B9A] text-[#005B9A] bg-white shadow-sm" : "border-transparent text-slate-600 hover:bg-white/50"}` }
        >RENDER</button>
      </div>

      {/* Ribbon Content Panels */}
      <div className="flex-1 flex items-center px-6 py-2 gap-2 overflow-x-auto overflow-y-hidden bg-surface">
        {activeTab === 'FEATURES' && <FeaturesTab {...tabProps} />}
        {activeTab === 'SKETCH' && <SketchTab {...tabProps} />}
        {activeTab === 'EVALUATE' && <EvaluateTab {...tabProps} />}
        {activeTab === 'ASSEMBLY' && <AssemblyTab {...tabProps} />}
        {activeTab === 'DRAWING' && <DrawingTab {...tabProps} />}
        {activeTab === 'RENDER' && <RenderTab {...tabProps} />}
        {activeTab === 'SURFACING' && <SurfacingTab {...tabProps} />}
        {activeTab === 'SHEET_METALS' && <SheetMetalsTab {...tabProps} />}
      </div>
    </div>
  );
};

