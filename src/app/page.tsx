'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Viewport from '../renderer/Viewport';
import OcctShape, { type MeshData } from '../renderer/OcctShape';
import { useCadStore, type CADFeature } from '../store/useCadStore';
import { v4 as uuidv4 } from 'uuid';
import { HeavyEngineClient } from '../kernel/HeavyEngineClient';
import { MeasurementPanel } from '../ui/MeasurementPanel';
import { InterferencePanel } from '../ui/InterferencePanel';
import { SketchHUD } from '../renderer/SketchHUD';
import { fileAPI } from '../../electron/renderer';
import { MatePanel } from '../ui/MatePanel';
import { AssemblyTreePanel } from '../ui/AssemblyTreePanel';
import { MotionStudyPanel } from '../ui/MotionStudyPanel';
import { AssemblyComponent } from '../renderer/AssemblyComponent';
import { MassPropertiesSymbol } from '../renderer/MassPropertiesSymbol';
import { DrawingSheet } from '../ui/DrawingSheet';
import { SketchPropertyManager } from '../ui/SketchPropertyManager';
import { analyzeSketchDefinitions } from '../utils/geometry/ConstraintSolver';
import { HeadsUpToolbar } from '../ui/HeadsUpToolbar';
import { TopMenu } from '../ui/TopMenu';
import { RibbonController } from '../ui/RibbonBar/RibbonController';
import { StatusBar } from '../ui/StatusBar';
import { ShortcutBox } from '../ui/ShortcutBox';
import { ContextMenu } from '../ui/ContextMenu';
import { usePartDocument } from '../hooks/usePartDocument';
import { usePartRebuild } from '../hooks/usePartRebuild';
import { FeatureManagerPanel } from '../ui/FeatureManagerPanel';
import { PartFeaturePropertyManager } from '../ui/PartFeaturePropertyManager';
import { SectionViewPropertyManager } from '../ui/SectionViewPropertyManager';
import { useSelectionLogic } from '../hooks/useSelectionLogic';
import { useFeatureBuilders } from '../hooks/useFeatureBuilders';
import { useAppIntegrations } from '../hooks/useAppIntegrations';
import { MassPropertiesModal } from '../ui/Modals/MassPropertiesModal';
import { TranslatorModal } from '../ui/Modals/TranslatorModal';
import { ExportModal } from '../ui/Modals/ExportModal';
import { ConfigurationManagerPanel } from '../ui/ConfigurationManagerPanel';
import { EquationsModal } from '../ui/Modals/EquationsModal';
import { DesignLibraryPanel } from '../ui/DesignLibraryPanel';
import { MaterialSelectorModal } from '../ui/Modals/MaterialSelectorModal';
import { RobotHUD } from '../ui/RobotHUD';
import { RobotOperationService } from '../ui/RobotOperationService';
import { useAutoSave } from '../hooks/useAutoSave';
import { SKey } from '../utils/s-key';
import { MouseGestureOverlay } from '../utils/mouse-gestures';
import { setupKeyboardShortcuts } from '../utils/keyboard-shortcuts';
import { RecoveryDialog } from '../ui/Modals/RecoveryDialog';

export default function Home() {
  useAutoSave();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [engineStatus, setEngineStatus] = useState<'CONNECTED' | 'DISCONNECTED'>('DISCONNECTED');
  const [sidebarTab, setSidebarTab] = useState<'TREE' | 'PROPERTIES' | 'CONFIGS'>('TREE');
  const [taskPaneTab, setTaskPaneTab] = useState<'LIBRARY' | 'NONE'>('LIBRARY');
  const [showMassPropsModal, setShowMassPropsModal] = useState(false);
  const [showTranslatorModal, setShowTranslatorModal] = useState(false);
  const [showEquationsModal, setShowEquationsModal] = useState(false);

  const [showSKey, setShowSKey] = useState(false);
  const sKeyItems = useMemo(() => [
    { label: 'Extrude', icon: '⬆️', action: () => { const h = (window as any).__handleExtrude; if(h) h('ADD'); setShowSKey(false); } },
    { label: 'Revolve', icon: '🔄', action: () => { const h = (window as any).__handleRevolve; if(h) h('ADD'); setShowSKey(false); } },
    { label: 'Fillet', icon: '🔘', action: () => { useCadStore.getState().setHint('Fillet: Select edge(s)'); setShowSKey(false); } },
    { label: 'Chamfer', icon: '📐', action: () => { useCadStore.getState().setHint('Chamfer: Select edge(s)'); setShowSKey(false); } },
    { label: 'Mirror', icon: '🪞', action: () => { useCadStore.getState().pushToast('Mirror not implemented.'); setShowSKey(false); } },
  ], []);
  useEffect(() => {
    setMounted(true);
  }, []);

  const client = HeavyEngineClient.getInstance();
  const { 
    features, addFeature, updateFeatureParams, 
    setSelectedId, setMeshData,
    isSketchMode, setSketchMode, setSketchTool,
    activePlane, setActivePlane, setActiveFaceOrigin, setActiveFaceNormal, setActiveFaceId,
    activeTab, setActiveTab,
    sketchNodes, sketchEdges, sketchConstraints,
    selectedId, selectedSubNodeType, setSelectedSubNodeType,
    visibleSketches, toggleSketchVisibility,
    removeFeature, removeFeatures,
    measurementMode,
    interferenceActive,
    selectedTopology, setSelectedTopology,
    triggerCameraNormal, pendingFeatureCommand, setPendingFeatureCommand,
    defaultFilletRadius, defaultChamferDistance,
    components, meshData,
    rollbackIndex, setRollbackIndex,
    massProperties, setMassProperties,
    showExportModal, setShowExportModal,
    hint: _hint,
    setHint,
  } = useCadStore();

  const { handleRebuild, resetRebuildCache, abortRebuild } = usePartRebuild(features, setMeshData, setLoading, setEngineStatus);
  const { loadCadData: loadPartDocument, handleSaveProject } = usePartDocument(features);

  const loadCadData = useCallback(
    async (content: string, filePath: string) => {
      const pathLower = filePath.toLowerCase();
      if (pathLower.endsWith('.sldprt') || pathLower.endsWith('.sldasm')) {
        setShowTranslatorModal(true);
        return;
      }
      resetRebuildCache();
      await loadPartDocument(content, filePath, () => setTimeout(handleRebuild, 50));
    },
    [handleRebuild, loadPartDocument, resetRebuildCache],
  );

  const {
    resetSketchSession,
    handleSaveSketchOnly,
    handleExitAndExtrude,
    handleRevolveFromSketch,
    handleBuildSweepLoft,
    handleConvertEntities,
    handleOffsetEntities,
  } = useFeatureBuilders(handleRebuild);

  const handlePrintToPDF = useCallback(async () => {
    try {
      const result = await fileAPI.printToPdf();
      if (result.success && result.path) (window as any).electronAPI.app.notify('PDF Export', `Success: ${result.path}`);
    } catch (e) { alert('PDF Export failed'); }
  }, []);

  useAppIntegrations(loadCadData, handleSaveProject, handlePrintToPDF);

  const handleImportStep = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const result = await client.uploadStepFile(file);
      if (result?.filepath) {
        addFeature({ id: `dumb_${uuidv4()}`, name: file.name, type: 'DUMB_SOLID', parameters: { filepath: result.filepath, x: 0, y: 0, z: 0 } });
        setTimeout(handleRebuild, 50);
      }
    } catch (err) {
      useCadStore.getState().pushToast('Failed to import STEP file.', 'error');
    } finally {
      setLoading(false);
      e.target.value = ''; // Reset input
    }
  };

  // Kernel Heartbeat
  useEffect(() => {
    const check = async () => {
      try {
        const alive = await client.checkHealth();
        setEngineStatus(alive ? 'CONNECTED' : 'DISCONNECTED');
      } catch (e) { setEngineStatus('DISCONNECTED'); }
    };
    const timer = setInterval(check, 3000);
    check();
    return () => clearInterval(timer);
  }, [client]);

  const handleEditFeatureSketch = useCallback((f: CADFeature) => {
    useCadStore.setState({
      editingFeatureId: f.id,
      sketchNodes: f.parameters.sketchNodes || {},
      sketchEdges: f.parameters.sketchEdges || {},
      sketchConstraints: f.parameters.sketchConstraints || {},
      activePlane: f.parameters.plane,
      activeFaceOrigin: f.parameters.plane === 'FACE' ? f.parameters.faceOrigin : null,
      activeFaceNormal: f.parameters.plane === 'FACE' ? f.parameters.faceNormal : null,
      activeFaceId: f.parameters.plane === 'FACE' ? f.parameters.faceId : null,
      isSketchMode: true,
      sketchTool: 'SELECT',
    });
    setActiveTab('SKETCH');
  }, []);

  const handleStartPlaneSketch = useCallback((plane: 'FRONT' | 'TOP' | 'RIGHT') => {
    resetSketchSession();
    setActivePlane(plane);
    setSketchMode(true);
    setSketchTool('SELECT');
    triggerCameraNormal();
  }, [resetSketchSession, setActivePlane, setSketchMode, setSketchTool, triggerCameraNormal]);

  const handlePlaneContextMenu = useCallback((e: React.MouseEvent, plane: string) => {
    useCadStore.setState({ contextMenu: { visible: true, x: e.clientX, y: e.clientY, type: 'BACKGROUND', data: { plane } } });
  }, []);

  const onParamChange = (key: string, value: string) => {
    if (!selectedId) return;
    const stringParams = ['operation', 'plane', 'type', 'target_feature_id', 'pattern_type', 'axis'];
    if (stringParams.includes(key)) {
      updateFeatureParams(selectedId, { [key]: value });
      setTimeout(handleRebuild, 0);
    } else {
      const num = parseFloat(value);
      if (!isNaN(num)) updateFeatureParams(selectedId, { [key]: num });
    }
  };

  const solidSketchPointCount = useMemo(() => Object.keys(sketchNodes).length, [sketchNodes]);
  const hasConflict = useMemo(() => {
    if (!isSketchMode) return false;
    return analyzeSketchDefinitions(sketchNodes, sketchEdges, sketchConstraints).hasConflict;
  }, [isSketchMode, sketchNodes, sketchEdges, sketchConstraints]);

  const selectedFeature = useMemo(() => features.find(f => f.id === selectedId), [features, selectedId]);

  // ── Selection / UI logic hooks ────────────────────────────
  useSelectionLogic({
    activeTab, isSketchMode, setSelectedTopology,
    selectedTopology, pendingFeatureCommand,
    selectedId, features, addFeature, updateFeatureParams,
    setPendingFeatureCommand, setSelectedId, handleRebuild,
    defaultFilletRadius, defaultChamferDistance, setHint,
  });

  // S-Key Ring Menu Trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 's' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Brief press of S toggles the ring menu
        setShowSKey(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Setup SOLIDWORKS 2010 keyboard shortcuts
  useEffect(() => {
    return setupKeyboardShortcuts();
  }, []);

  // Window Callbacks for Shortcuts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__handleRebuild = handleRebuild;
      (window as any).__handleExtrude = handleExitAndExtrude;
      (window as any).__handleRevolve = handleRevolveFromSketch;
      (window as any).__resetSketchSession = resetSketchSession;
      (window as any).__handleSaveSketchOnly = handleSaveSketchOnly;
      (window as any).__handleConvertEntities = handleConvertEntities;
      (window as any).__handleOffsetEntities = handleOffsetEntities;
      (window as any).__handlePrintToPDF = handlePrintToPDF;
      (window as any).__handleEditFeatureSketch = handleEditFeatureSketch;
    }
  }, [handleRebuild, handleExitAndExtrude, handleRevolveFromSketch, resetSketchSession, handleSaveSketchOnly, handleConvertEntities, handleOffsetEntities, handlePrintToPDF, handleEditFeatureSketch]);

  if (!mounted) return (
    <div className="h-screen w-screen bg-[#E8E8E8] flex items-center justify-center">
      <div className="text-[#005B9A] font-black tracking-widest animate-pulse">LOADING 3D-BUILDER...</div>
    </div>
  );

  return (
    <main className="flex flex-col h-screen w-screen overflow-hidden bg-[#E8E8E8] text-slate-800 font-sans select-none">
      {/* 1. Top Menu / Title Bar */}
      <TopMenu engineStatus={engineStatus} onExport={() => setShowExportModal(true)} />
      
      {/* 2. CommandManager (Ribbon) */}
      <RibbonController
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        engineStatus={engineStatus}
        solidSketchPointCount={solidSketchPointCount}
        handleExitAndExtrude={handleExitAndExtrude}
        handleRevolveFromSketch={handleRevolveFromSketch}
        handleImportStep={handleImportStep}
        onShowMassProps={() => setShowMassPropsModal(true)}
        onShowEquations={() => setShowEquationsModal(true)}
      />

      {engineStatus === 'DISCONNECTED' && (
        <div className="bg-red-600 text-white text-[11px] font-black py-1 px-4 flex items-center justify-center gap-4 animate-pulse z-[100] border-b border-red-700 shadow-lg">
          <span className="flex items-center gap-2">⚠️ <span className="tracking-widest">GEOMETRY KERNEL OFFLINE</span></span>
          <button onClick={() => HeavyEngineClient.getInstance().checkHealth().then(a => setEngineStatus(a?'CONNECTED':'DISCONNECTED'))} className="px-3 py-0.5 bg-white text-red-600 rounded-sm text-[9px] font-black hover:bg-slate-100 shadow-sm transition-all active:scale-95">RECONNECT</button>
        </div>
      )}

      {/* 3. Main Workspace Area */}
      <div className="flex-1 flex w-full overflow-hidden relative">
        
        {/* LEFT: Consolidated Manager (FeatureManager / PropertyManager / ConfigManager) */}
        <aside className="w-[300px] h-full bg-[#F5F6F9] border-r border-[#A0A0A0] flex flex-col z-10 shrink-0 shadow-[2px_0_10px_rgba(0,0,0,0.05)]">
          {/* Manager Tabs */}
          <div className="h-[36px] w-full bg-[#E8E8E8] flex items-center border-b border-[#A0A0A0] px-1 gap-1">
            {[
              { id: 'TREE', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>, label: 'FeatureManager' },
              { id: 'PROPERTIES', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9M3 20h4M7 20v-4M7 16h10M17 16V4M17 4H7M7 4v12"/></svg>, label: 'PropertyManager' },
              { id: 'CONFIGS', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>, label: 'ConfigurationManager' }
            ].map((tab) => {
              const tabId = tab.id as 'TREE' | 'PROPERTIES' | 'CONFIGS';
              const isActive = sidebarTab === tabId;
              return (
                <button 
                  key={tab.id} 
                  onClick={() => setSidebarTab(tabId)}
                  title={tab.label}
                  className={`flex-1 h-[30px] flex items-center justify-center rounded-t-md transition-all ${
                    isActive 
                      ? 'bg-[#F5F6F9] text-[#005B9A] border-t border-x border-[#A0A0A0] shadow-[0_-2px_5px_rgba(0,0,0,0.05)]' 
                      : 'text-slate-400 hover:text-slate-600 hover:bg-[#D6DADC]/50'
                  }`}
                >
                  {tab.icon}
                </button>
              );
            })}
          </div>

          {/* Manager Content */}
          <div className="flex-grow flex flex-col overflow-hidden bg-[#F5F6F9]">
            {sidebarTab === 'CONFIGS' ? (
              <ConfigurationManagerPanel />
            ) : (isSketchMode || sidebarTab === 'PROPERTIES' || (selectedId && sidebarTab !== 'TREE')) ? (
              <div className="flex-grow flex flex-col overflow-hidden">
                {isSketchMode ? <SketchPropertyManager /> : (
                  selectedFeature ? (
                    <PartFeaturePropertyManager
                      selectedFeature={selectedFeature}
                      features={features}
                      onParamChange={onParamChange}
                      onEditSketch={handleEditFeatureSketch}
                      onSelectFeature={setSelectedId}
                      onBuildSweepLoft={handleBuildSweepLoft}
                    />
                  ) : <div className="p-10 text-center text-slate-400 italic text-[11px] font-bold uppercase tracking-wider">No property selected</div>
                )}
              </div>
            ) : activeTab === 'ASSEMBLY' ? (
              <div className="flex-1 flex flex-col p-1 gap-1 overflow-hidden">
                <AssemblyTreePanel />
                <div className="h-[1px] bg-[#A0A0A0]/30 mx-2" />
                <MatePanel />
              </div>
            ) : measurementMode !== 'NONE' ? (
              <MeasurementPanel />
            ) : interferenceActive ? (
              <InterferencePanel />
            ) : (
              <FeatureManagerPanel
                features={features}
                rollbackIndex={rollbackIndex}
                setRollbackIndex={setRollbackIndex}
                activePlane={activePlane}
                setActivePlane={setActivePlane}
                selectedId={selectedId}
                setSelectedId={(id: string) => {
                  setSelectedId(id);
                  if (id) setSidebarTab('PROPERTIES'); // Auto-switch to properties like SW
                }}
                selectedSubNodeType={selectedSubNodeType}
                setSelectedSubNodeType={setSelectedSubNodeType}
                editingFeatureId={useCadStore.getState().editingFeatureId}
                visibleSketches={visibleSketches}
                toggleSketchVisibility={toggleSketchVisibility}
                removeFeature={removeFeature}
                removeFeatures={removeFeatures}
                onRebuild={handleRebuild}
                onEditFeatureSketch={handleEditFeatureSketch}
                onStartPlaneSketch={handleStartPlaneSketch}
                onPlaneContextMenu={handlePlaneContextMenu}
              />
            )}

            <SectionViewPropertyManager />
          </div>
        </aside>

        {/* CENTER: Graphics Area (Viewport) */}
        <MouseGestureOverlay>
        <section className="flex-grow h-full relative bg-[#C0C0C0]" onContextMenu={(e) => e.preventDefault()}>
          <HeadsUpToolbar /> 
          <ShortcutBox /> 
          <ContextMenu />

          {isSketchMode && hasConflict && (
            <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-red-600 border-2 border-red-400 text-white px-6 py-2 rounded-sm shadow-2xl flex items-center gap-3 z-[999] pointer-events-none backdrop-blur-md animate-bounce">
              <span className="text-[12px] font-black uppercase tracking-widest">Over-Constrained Conflict Detected</span>
            </div>
          )}

          {activeTab === 'DRAWING' ? <DrawingSheet /> : (
            <Viewport>
              {activeTab === 'ASSEMBLY' ? (
                (useCadStore.getState().assemblyPreviewComponents || components).map(comp => (
                  <AssemblyComponent key={comp.id} comp={comp} meshes={meshData} isActive={useCadStore.getState().activeComponentId === comp.id} />
                ))
              ) : meshData.map((mesh: { data: MeshData }, idx: number) => (
                <OcctShape key={idx} data={mesh.data} />
              ))}
              <MassPropertiesSymbol />
            </Viewport>
          )}

          {activeTab === 'ASSEMBLY' && <MotionStudyPanel />}

          <SketchHUD onReset={resetSketchSession} onExit={handleExitAndExtrude} />

          {loading && (
            <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] flex items-center justify-center z-[1000] p-4">
              <div className="w-[320px] bg-[#F8FAFC]/95 border border-[#A0A0A0] rounded-lg p-6 shadow-2xl flex flex-col gap-4 text-slate-800 items-center">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-[#005B9A] rounded-full animate-spin" />
                <span className="text-[12px] font-black text-[#005B9A] tracking-widest uppercase">Rebuilding Model...</span>
                <button onClick={abortRebuild} className="w-full py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-sm font-black transition-all text-[11px] uppercase tracking-tighter">Abort Rebuild</button>
              </div>
            </div>
          )}

          {showMassPropsModal && massProperties && <MassPropertiesModal massProps={massProperties} onClose={() => setShowMassPropsModal(false)} />}
          {showEquationsModal && <EquationsModal onClose={() => setShowEquationsModal(false)} />}
          {showTranslatorModal && <TranslatorModal onClose={() => setShowTranslatorModal(false)} onOpenAlternative={async () => { setShowTranslatorModal(false); const r = await fileAPI.open(); if(r) { const res = await fileAPI.read(r.path); if(res.success && res.content) loadCadData(res.content, r.path); } }} />}
          {showExportModal && <ExportModal onClose={() => setShowExportModal(false)} activeTab={activeTab} />}
          <RecoveryDialog />
        </section>
        </MouseGestureOverlay>
          <SKey items={sKeyItems} visible={showSKey} onClose={() => setShowSKey(false)} />

        {/* RIGHT: Task Pane (Design Library) */}
        {taskPaneTab !== 'NONE' && (
          <aside className="w-[280px] h-full bg-[#F5F6F9] border-l border-[#A0A0A0] flex flex-col z-10 shrink-0 animate-in slide-in-from-right-4 duration-300 shadow-[-2px_0_10px_rgba(0,0,0,0.05)]">
            <div className="h-[36px] w-full bg-[#E8E8E8] flex items-center border-b border-[#A0A0A0] px-3 justify-between">
               <div className="text-[10px] font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                 Task Pane
               </div>
               <button 
                 onClick={() => setTaskPaneTab('NONE')}
                 className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
               >✕</button>
            </div>
            <div className="flex-1 overflow-hidden">
              <DesignLibraryPanel />
            </div>
          </aside>
        )}

        {/* Task Pane Toggle handle if closed */}
        {taskPaneTab === 'NONE' && (
          <div 
            onClick={() => setTaskPaneTab('LIBRARY')}
            className="absolute right-0 top-24 w-6 h-32 bg-[#E8E8E8] border-l border-y border-[#A0A0A0] rounded-l-md shadow-md cursor-pointer flex items-center justify-center text-slate-500 hover:text-[#005B9A] transition-all z-20 hover:w-8 group border-r-0"
          >
            <span className="rotate-90 font-black text-[9px] whitespace-nowrap tracking-widest uppercase">Task Pane</span>
          </div>
        )}
      </div>
      
      {/* 4. Status Bar */}
      <StatusBar />
      
      {/* Global Modals & Services */}
      <MaterialSelectorModal />
      <RobotOperationService />
      <RobotHUD />
    </main>
  );
}
