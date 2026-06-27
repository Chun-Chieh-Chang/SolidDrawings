'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Viewport from '@/renderer/Viewport';
import OcctShape, { type MeshData } from '@/renderer/OcctShape';
import { useCadStore, type CADFeature } from '@/store/useCadStore';
import { v4 as uuidv4 } from 'uuid';
import { HeavyEngineClient } from '@/kernel/HeavyEngineClient';
import { MeasurementPanel } from '@/ui/MeasurementPanel';
import { InterferencePanel } from '@/ui/InterferencePanel';
import { SketchHUD } from '@/renderer/SketchHUD';
import { fileAPI } from '../../electron/renderer';
import { MatePanel } from '@/ui/MatePanel';
import { AssemblyTreePanel } from '@/ui/AssemblyTreePanel';
import { MotionStudyPanel } from '@/ui/MotionStudyPanel';
import { AssemblyComponent } from '@/renderer/AssemblyComponent';
import { MassPropertiesSymbol } from '@/renderer/MassPropertiesSymbol';
import { DrawingSheet } from '@/ui/DrawingSheet';
import { SketchPropertyManager } from '@/ui/SketchPropertyManager';
import { analyzeSketchDefinitions } from '@/utils/geometry/ConstraintSolver';
import { HeadsUpToolbar } from '@/ui/HeadsUpToolbar';
import { TopMenu } from '@/ui/TopMenu';
import { RibbonController } from '@/ui/RibbonBar/RibbonController';
import { StatusBar } from '@/ui/StatusBar';
import { ShortcutBox } from '@/ui/ShortcutBox';
import { ContextMenu } from '@/ui/ContextMenu';
import { usePartDocument } from '@/hooks/usePartDocument';
import { usePartRebuild } from '@/hooks/usePartRebuild';
import { FeatureManagerPanel } from '@/ui/FeatureManagerPanel';
import { PartFeaturePropertyManager } from '@/ui/PartFeaturePropertyManager';
import { SectionViewPropertyManager } from '@/ui/SectionViewPropertyManager';
import { useSelectionLogic } from '@/hooks/useSelectionLogic';
import { useFeatureBuilders } from '@/hooks/useFeatureBuilders';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAppIntegrations } from '@/hooks/useAppIntegrations';
import { MassPropertiesModal } from '@/ui/Modals/MassPropertiesModal';
import { TranslatorModal } from '@/ui/Modals/TranslatorModal';
import { ExportModal } from '@/ui/Modals/ExportModal';
import { ConfigurationManagerPanel } from '@/ui/ConfigurationManagerPanel';
import { EquationsModal } from '@/ui/Modals/EquationsModal';
import { DesignLibraryPanel } from '@/ui/DesignLibraryPanel';
import { MaterialSelectorModal } from '@/ui/Modals/MaterialSelectorModal';
import { SheetMetalPanel } from '@/ui/SheetMetal';
import { RollbackBar } from '@/ui/RollbackBar';
import DimXpertPanel from '@/renderer/DimXpertPanel';

// ── Left Panel Icon-only Tab SVGs ──

const IconFeatureManager = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#505050" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="1" width="6" height="5" rx=".5" />
    <rect x="9" y="1" width="6" height="5" rx=".5" />
    <rect x="5" y="7" width="6" height="5" rx=".5" />
    <path d="M4 6v1M8 6v1M12 6v1" />
  </svg>
);

const IconPropertyManager = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#505050" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="1" width="12" height="14" rx="1" />
    <line x1="4" y1="4" x2="12" y2="4" />
    <line x1="4" y1="7" x2="12" y2="7" />
    <line x1="4" y1="10" x2="9" y2="10" />
    <circle cx="11.5" cy="10.5" r="1.5" />
  </svg>
);

const IconConfigManager = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#505050" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="1" width="12" height="3" rx=".5" />
    <rect x="2" y="6" width="12" height="3" rx=".5" />
    <rect x="2" y="11" width="12" height="3" rx=".5" />
  </svg>
);

const IconDimXpert = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#505050" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="12" x2="7" y2="4" />
    <line x1="7" y1="4" x2="12" y2="4" />
    <line x1="12" y1="4" x2="14" y2="7" />
    <line x1="7" y1="4" x2="7" y2="2" />
    <circle cx="2" cy="12" r="1" />
    <circle cx="7" cy="4" r="1" />
    <circle cx="12" cy="4" r="1" />
    <circle cx="14" cy="7" r="1" />
  </svg>
);

// ── Right Panel Task Pane Tab Icons ──

const IconDesignLibrary = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#505050" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="12" height="12" rx="1" />
    <line x1="5" y1="2" x2="5" y2="14" />
    <line x1="8" y1="2" x2="8" y2="14" />
    <line x1="11" y1="2" x2="11" y2="14" />
    <line x1="2" y1="6" x2="14" y2="6" />
  </svg>
);

const IconFileExplorer = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#505050" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 13V3a1 1 0 0 1 1-1h3.5l2 2H13a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" />
    <circle cx="10.5" cy="9.5" r="2" />
    <line x1="12" y1="11" x2="13.5" y2="12.5" />
  </svg>
);

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#505050" strokeWidth="1.3" strokeLinecap="round">
    <circle cx="7" cy="7" r="4.5" />
    <line x1="10.5" y1="10.5" x2="14" y2="14" />
  </svg>
);

const IconViewPalette = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#505050" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="5" height="5" rx=".5" />
    <rect x="9" y="2" width="5" height="5" rx=".5" />
    <rect x="2" y="9" width="5" height="5" rx=".5" />
    <rect x="9" y="9" width="5" height="5" rx=".5" />
  </svg>
);

const IconAppearances = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#505050" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6" />
    <circle cx="8" cy="8" r="2.5" fill="#505050" />
    <path d="M8 2v2M8 12v2M2 8h2M12 8h2" />
  </svg>
);

type TaskPaneTabId = 'LIBRARY' | 'FILE_EXPLORER' | 'SEARCH' | 'VIEW_PALETTE' | 'APPEARANCES';

const TASK_PANE_TABS: { id: TaskPaneTabId; label: string; icon: React.FC }[] = [
  { id: 'LIBRARY', label: 'Design Library', icon: IconDesignLibrary },
  { id: 'FILE_EXPLORER', label: 'File Explorer', icon: IconFileExplorer },
  { id: 'SEARCH', label: 'Search', icon: IconSearch },
  { id: 'VIEW_PALETTE', label: 'View Palette', icon: IconViewPalette },
  { id: 'APPEARANCES', label: 'Appearances', icon: IconAppearances },
];

const TASK_PANE_PLACEHOLDER: Record<TaskPaneTabId, string> = {
  LIBRARY: '',
  FILE_EXPLORER: 'File Explorer — Coming Soon',
  SEARCH: 'Search — Coming Soon',
  VIEW_PALETTE: 'View Palette — Coming Soon',
  APPEARANCES: 'Appearances — Coming Soon',
};

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'TREE' | 'PROPERTIES' | 'CONFIGS' | 'DIMX'>('TREE');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [taskPaneTab, setTaskPaneTab] = useState<TaskPaneTabId | 'NONE'>('LIBRARY');
  const [showMassPropsModal, setShowMassPropsModal] = useState(false);
  const [showTranslatorModal, setShowTranslatorModal] = useState(false);
  const [showEquationsModal, setShowEquationsModal] = useState(false);

  const client = HeavyEngineClient.getInstance();
  const { 
    features, addFeature, updateFeatureParams, 
    setSelectedId, setMeshData,
    isSketchMode, setSketchMode, setSketchTool,
    activePlane, setActivePlane,
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
    massProperties,
    showExportModal, setShowExportModal,
    setHint,
    engineStatus, setEngineStatus,
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
    handleCreateEdgeFlange,
    handleCreateMiterFlange,
    handleCreateHem,
    handleCreateFlatPattern,
    handleUnfold,
    handleFold,
    handleCreateFormingTool,
  } = useFeatureBuilders(handleRebuild);

  const handlePrintToPDF = useCallback(async () => {
    try {
      const result = await fileAPI.printToPdf();
      if (result.success && result.path) (window as any).electronAPI.app.notify('PDF Export', `Success: ${result.path}`);
    } catch { alert('PDF Export failed'); }
  }, []);

  useAppIntegrations(loadCadData, handleSaveProject, handlePrintToPDF);
  useKeyboardShortcuts();

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
    } catch {
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
      } catch { setEngineStatus('DISCONNECTED'); }
    };
    const timer = setInterval(check, 3000);
    check();
    return () => clearInterval(timer);
  }, [client]);

  // Alt+Number Quick Jump — panel tabs & collapse
  useEffect(() => {
    const handleAltNav = (e: KeyboardEvent) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        switch (e.code) {
          case 'Digit0': setSidebarCollapsed(c => !c); e.preventDefault(); break;
          case 'Digit1': setSidebarTab('TREE'); if (sidebarCollapsed) setSidebarCollapsed(false); e.preventDefault(); break;
          case 'Digit2': setSidebarTab('PROPERTIES'); if (sidebarCollapsed) setSidebarCollapsed(false); e.preventDefault(); break;
          case 'Digit3': setSidebarTab('CONFIGS'); if (sidebarCollapsed) setSidebarCollapsed(false); e.preventDefault(); break;
          case 'Digit4': setSidebarTab('DIMX'); if (sidebarCollapsed) setSidebarCollapsed(false); e.preventDefault(); break;
        }
      }
    };
    window.addEventListener('keydown', handleAltNav);
    return () => window.removeEventListener('keydown', handleAltNav);
  }, [sidebarCollapsed]);

  // Ctrl+Z Undo / Ctrl+Y Redo
  useEffect(() => {
    const handleUndoRedo = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !e.shiftKey) {
        e.preventDefault();
        useCadStore.getState().undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyY' || (e.code === 'KeyZ' && e.shiftKey))) {
        e.preventDefault();
        useCadStore.getState().redo();
      }
    };
    window.addEventListener('keydown', handleUndoRedo);
    return () => window.removeEventListener('keydown', handleUndoRedo);
  }, []);

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
  }, [setActiveTab]);

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

  return (
    <main className="flex flex-col h-screen w-screen overflow-hidden bg-background text-primary-text font-sans">
      <TopMenu
        onExport={() => setShowExportModal(true)}
        onOpenFile={async () => {
          const r = await fileAPI.open();
          if (r) {
            const res = await fileAPI.read(r.path);
            if (res.success && res.content) loadCadData(res.content, r.path);
          }
        }}
        onSaveFile={handleSaveProject}
        onNewFile={() => {
          const ids = useCadStore.getState().features.map(f => f.id);
          if (ids.length) useCadStore.getState().removeFeatures(ids);
        }}
        onPrint={handlePrintToPDF}
        onUndo={() => useCadStore.getState().undo()}
        onRebuild={handleRebuild}
      />
      
      <RibbonController
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        engineStatus={engineStatus}
        solidSketchPointCount={solidSketchPointCount}
        handleExitAndExtrude={handleExitAndExtrude}
        handleRevolveFromSketch={handleRevolveFromSketch}
          handleImportStep={handleImportStep}
          handleCreateEdgeFlange={handleCreateEdgeFlange}
          handleCreateMiterFlange={handleCreateMiterFlange}
          handleCreateHem={handleCreateHem}
          handleCreateFlatPattern={handleCreateFlatPattern}
          handleUnfold={handleUnfold}
          handleFold={handleFold}
          handleCreateFormingTool={handleCreateFormingTool}
          onShowMassProps={() => setShowMassPropsModal(true)}
        onShowEquations={() => setShowEquationsModal(true)}
      />

      <div className="flex-1 flex w-full overflow-hidden relative">
        <aside className={`${sidebarCollapsed ? 'w-[28px]' : 'w-[280px]'} h-full bg-[#F0F0F0] border-r border-[#D0D0D0] flex flex-col z-10 shrink-0 transition-all duration-150`}>
          {/* Icon-only tab strip: FeatureManager / PropertyManager / ConfigurationManager / DimXpertManager */}
          <div className="h-[24px] w-full bg-[#E8E8E8] flex items-center border-b border-[#D0D0D0]">
            {([
              { id: 'TREE' as const, icon: IconFeatureManager, title: 'FeatureManager' },
              { id: 'PROPERTIES' as const, icon: IconPropertyManager, title: 'PropertyManager' },
              { id: 'CONFIGS' as const, icon: IconConfigManager, title: 'ConfigurationManager' },
              { id: 'DIMX' as const, icon: IconDimXpert, title: 'DimXpertManager' },
            ]).map((tab) => {
              const isActive = sidebarTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { if (sidebarCollapsed) setSidebarCollapsed(false); setSidebarTab(tab.id); }}
                  title={tab.title}
                  className={`w-[28px] h-full flex items-center justify-center cursor-pointer border-r border-[#D0D0D0] transition-colors ${
                    isActive
                      ? 'bg-white'
                      : 'text-[#606060] hover:bg-[#D8D8D8]'
                  }`}
                >
                  <tab.icon />
                </button>
              );
            })}
            {/* Collapse/Expand toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="ml-auto w-[20px] h-full flex items-center justify-center text-[#909090] hover:text-[#505050] hover:bg-[#D8D8D8] border-none bg-transparent cursor-pointer"
              title={sidebarCollapsed ? 'Expand panel' : 'Collapse panel'}
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                {sidebarCollapsed ? <polyline points="10,3 5,8 10,13" /> : <polyline points="6,3 11,8 6,13" />}
              </svg>
            </button>
          </div>

          {!sidebarCollapsed && (
            <>
              {/* Rollback Bar (below tab strip) */}
              <RollbackBar enabled={sidebarTab === 'TREE'} position={1} />

              <div className="flex-grow flex flex-col overflow-hidden">
                {sidebarTab === 'CONFIGS' ? (
                  <ConfigurationManagerPanel />
                ) : sidebarTab === 'DIMX' ? (
                  <DimXpertPanel />
                ) : isSketchMode || sidebarTab === 'PROPERTIES' ? (
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
                      ) : <div className="p-10 text-center text-slate-400 italic text-[11px]">No feature selected</div>
                    )}
                  </div>
                ) : activeTab === 'ASSEMBLY' ? (
                  <div className="flex-1 flex flex-col p-2 gap-2 bg-[#F8FAFC]"><AssemblyTreePanel /><MatePanel /></div>
                ) : measurementMode !== 'NONE' ? (
                  <MeasurementPanel />
                ) : interferenceActive ? (
                  <InterferencePanel />
                ) : activeTab === 'SHEET_METALS' ? (
                  <SheetMetalPanel active={true} />
                ) : (
                  <FeatureManagerPanel
                    features={features}
                    rollbackIndex={rollbackIndex}
                    setRollbackIndex={setRollbackIndex}
                    activePlane={activePlane}
                    setActivePlane={setActivePlane}
                    selectedId={selectedId}
                    setSelectedId={setSelectedId}
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
            </>
          )}
        </aside>

        <section className="flex-grow h-full relative" onContextMenu={(e) => e.preventDefault()}>
          <HeadsUpToolbar /> <ShortcutBox /> <ContextMenu />

          {isSketchMode && hasConflict && (
            <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-red-500/90 border border-red-400 text-white px-5 py-3 rounded-full shadow-sm flex items-center gap-2.5 z-[999] w-[85%] max-w-[500px] pointer-events-none backdrop-blur-md">
              <div className="flex flex-col"><span className="text-[12px] font-extrabold uppercase tracking-wider leading-none">Over-Constrained Conflict</span></div>
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
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
              <div className="w-[380px] bg-slate-900/90 border border-slate-700/60 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-slate-100 items-center">
                <div className="w-10 h-10 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-[14px] font-bold text-slate-200 tracking-wide">Rebuilding Geometry...</span>
                <button onClick={abortRebuild} className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded font-bold transition-all text-[13px]">Abort</button>
              </div>
            </div>
          )}

          {showMassPropsModal && massProperties && <MassPropertiesModal massProps={massProperties} onClose={() => setShowMassPropsModal(false)} />}
          {showEquationsModal && <EquationsModal onClose={() => setShowEquationsModal(false)} />}
          {showTranslatorModal && <TranslatorModal onClose={() => setShowTranslatorModal(false)} onOpenAlternative={async () => { setShowTranslatorModal(false); const r = await fileAPI.open(); if(r) { const res = await fileAPI.read(r.path); if(res.success && res.content) loadCadData(res.content, r.path); } }} />}
          {showExportModal && <ExportModal onClose={() => setShowExportModal(false)} activeTab={activeTab} />}
        </section>

        {/* Right Task Pane (with vertical icon tab strip) */}
        {taskPaneTab !== 'NONE' && (
          <aside className="flex h-full z-10 shrink-0 animate-in slide-in-from-right duration-300">
            {/* Content area */}
            <div className="w-[260px] h-full bg-[#F0F0F0] border-l border-[#D0D0D0] flex flex-col">
              <div className="h-[24px] bg-[#E8E8E8] border-b border-[#D0D0D0] flex items-center px-2 shrink-0">
                <span className="text-[10px] font-medium text-[#505050]">
                  {TASK_PANE_TABS.find(t => t.id === taskPaneTab)?.label ?? ''}
                </span>
                <button
                  onClick={() => setTaskPaneTab('NONE')}
                  className="ml-auto text-[#909090] hover:text-[#505050] text-[12px] leading-none px-1"
                >✕</button>
              </div>
              {taskPaneTab === 'LIBRARY' ? (
                <DesignLibraryPanel />
              ) : (
                <div className="flex-1 flex items-center justify-center text-[11px] text-[#909090] italic px-4 text-center">
                  {TASK_PANE_PLACEHOLDER[taskPaneTab]}
                </div>
              )}
            </div>

            {/* Vertical icon tab strip */}
            <div className="w-[28px] h-full bg-[#E8E8E8] border-l border-[#D0D0D0] flex flex-col items-center py-1 gap-0.5 shrink-0">
              {TASK_PANE_TABS.map((tab) => {
                const isActive = taskPaneTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setTaskPaneTab(tab.id)}
                    title={tab.label}
                    className={`w-[22px] h-[22px] flex items-center justify-center rounded-sm transition-colors ${
                      isActive
                        ? 'bg-white border border-[#C0C0C0]'
                        : 'hover:bg-[#D0D0D0]'
                    }`}
                  >
                    <tab.icon />
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* Task Pane Toggle handle if closed */}
        {taskPaneTab === 'NONE' && (
          <div
            onClick={() => setTaskPaneTab('LIBRARY')}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-24 bg-[#E8E8E8] border-l border-y border-[#D0D0D0] cursor-pointer flex items-center justify-center text-[#909090] hover:text-[#505050] transition-all z-20 group"
          >
            <span className="rotate-90 font-normal text-[9px] whitespace-nowrap tracking-wider group-hover:text-[#505050] transition-colors">TASKS</span>
          </div>
        )}
      </div>
      <StatusBar />
      <MaterialSelectorModal />
    </main>
  );
}
