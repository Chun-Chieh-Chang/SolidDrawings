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

interface TabDefinition {
  id: string;
  label: string;
  defaultVisible: boolean;
}

const ALL_TABS: TabDefinition[] = [
  { id: 'FEATURES', label: 'Features', defaultVisible: true },
  { id: 'SKETCH', label: 'Sketch', defaultVisible: true },
  { id: 'SURFACING', label: 'Surfaces', defaultVisible: false },
  { id: 'SHEET_METALS', label: 'Sheet Metal', defaultVisible: false },
  { id: 'EVALUATE', label: 'Evaluate', defaultVisible: false },
  { id: 'ASSEMBLY', label: 'Assembly', defaultVisible: false },
  { id: 'DRAWING', label: 'Drawing', defaultVisible: false },
  { id: 'RENDER', label: 'Render', defaultVisible: false },
];

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

  // ── Tab visibility state ──
  const [visibleTabIds, setVisibleTabIds] = React.useState<Set<string>>(
    () => new Set(ALL_TABS.filter(t => t.defaultVisible).map(t => t.id))
  );
  const [showTabMenu, setShowTabMenu] = React.useState(false);
  const [contextMenuPos, setContextMenuPos] = React.useState<{ x: number; y: number } | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const chevronRef = React.useRef<HTMLButtonElement>(null);

  // All tabs visible for selection, sorted by the original order
  const orderedTabs = ALL_TABS;

  // Currently displayed tabs (visible + active if hidden)
  const displayedTabs = React.useMemo(() => {
    const visible = orderedTabs.filter(t => visibleTabIds.has(t.id));
    // Always include active tab even if not in visible set
    const activeInList = orderedTabs.find(t => t.id === activeTab);
    if (activeInList && !visibleTabIds.has(activeTab)) {
      return [...visible, activeInList];
    }
    return visible;
  }, [visibleTabIds, activeTab, orderedTabs]);

  // ── Tab click handlers ──
  const handleTabClick = (tabId: string) => {
    setMeasurementMode('NONE');
    setMeasurementPoints([]);
    setMeasurementResults(null);

    switch (tabId) {
      case 'FEATURES':
        setActiveTab('FEATURES');
        break;
      case 'SKETCH': {
        setActiveTab('SKETCH');
        if (!isSketchMode) {
          setEditingFeatureId(null);
          if (selectedTopology?.type === 'FACE' && selectedTopology.coordinates && selectedTopology.normal) {
            setActiveFaceOrigin(selectedTopology.coordinates);
            setActiveFaceNormal(selectedTopology.normal);
            setActiveFaceId(selectedTopology.id || `face_${uuidv4()}`);
            setActivePlane('FACE');
            triggerCameraNormal();
          } else if (activePlane) {
            triggerCameraNormal();
          } else {
            setActivePlane('FRONT');
            triggerCameraNormal();
          }
          setSketchMode(true);
          setSketchTool('SELECT');
        }
        break;
      }
      case 'SURFACING':
        setActiveTab('SURFACING');
        break;
      case 'SHEET_METALS':
        setActiveTab('SHEET_METALS');
        break;
      case 'EVALUATE':
        setActiveTab('EVALUATE');
        break;
      case 'ASSEMBLY':
        setActiveTab('ASSEMBLY');
        useCadStore.getState().setMode('ASSEMBLY');
        break;
      case 'DRAWING':
        setActiveTab('DRAWING');
        useCadStore.getState().setMode('DRAWING');
        break;
      case 'RENDER':
        setActiveTab('RENDER');
        useCadStore.getState().setMode('RENDER');
        break;
    }
  };

  // ── Toggle tab visibility ──
  const toggleTabVisibility = (tabId: string) => {
    setVisibleTabIds((prev) => {
      const next = new Set(prev);
      if (next.has(tabId)) {
        next.delete(tabId);
      } else {
        next.add(tabId);
      }
      return next;
    });
  };

  // ── Right-click context menu ──
  const handleTabContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleContextMenuToggle = (tabId: string) => {
    toggleTabVisibility(tabId);
    setContextMenuPos(null);
  };

  // Close context menu on outside click
  React.useEffect(() => {
    const handler = () => setContextMenuPos(null);
    if (contextMenuPos) {
      window.addEventListener('click', handler);
      return () => window.removeEventListener('click', handler);
    }
  }, [contextMenuPos]);

  // Close tab dropdown on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          chevronRef.current && !chevronRef.current.contains(e.target as Node)) {
        setShowTabMenu(false);
      }
    };
    if (showTabMenu) {
      window.addEventListener('mousedown', handler);
      return () => window.removeEventListener('mousedown', handler);
    }
  }, [showTabMenu]);

  const TAB_BAR_BG = '#DADADA';
  const CONTENT_BG = '#E8E8E8';
  const TAB_INACTIVE_TEXT = '#505050';
  const TAB_INACTIVE_HOVER = '#C8C8C8';
  const TAB_ACTIVE_BG = '#F0F0F0';
  const TAB_ACTIVE_BORDER = '#B0B0B0';

  return (
    <div className="h-[80px] w-full flex flex-col z-20 shrink-0 select-none" style={{ background: CONTENT_BG }}>
      {/* ── Tab Bar ── */}
      <div
        className="flex items-center px-1 border-b border-[#B8B8B8] shrink-0"
        style={{ background: TAB_BAR_BG, height: '24px' }}
      >
        {displayedTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              onContextMenu={(e) => handleTabContextMenu(e, tab.id)}
              className="h-full px-3 text-[11px] transition-colors border-l border-t border-r border-transparent relative"
              style={{
                color: isActive ? '#000000' : TAB_INACTIVE_TEXT,
                background: isActive ? TAB_ACTIVE_BG : 'transparent',
                borderColor: isActive ? TAB_ACTIVE_BORDER : 'transparent',
                borderBottomColor: isActive ? TAB_ACTIVE_BG : TAB_BAR_BG,
                fontWeight: isActive ? 600 : 400,
                marginBottom: isActive ? '-1px' : '0',
                zIndex: isActive ? 1 : 0,
              }}
              title={`Right-click to customize tabs`}
            >
              {tab.label}
            </button>
          );
        })}

        {/* Tab Chevron Dropdown */}
        <button
          ref={chevronRef}
          onClick={() => setShowTabMenu(!showTabMenu)}
          className="h-full px-2 text-[#505050] hover:bg-[#C8C8C8] transition-colors text-[10px] ml-auto"
          title="Tab List"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <polyline points="2,3.5 5,6.5 8,3.5" />
          </svg>
        </button>

        {/* Tab Dropdown Menu */}
        {showTabMenu && (
          <div
            ref={menuRef}
            className="absolute top-[46px] right-2 w-[160px] bg-white border border-[#C0C0C0] shadow-md py-0.5 z-[200]"
            style={{ top: '46px' }}
          >
            {orderedTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  handleTabClick(tab.id);
                  setShowTabMenu(false);
                }}
                className="w-full text-left px-3 py-1 text-[11px] text-[#303030] hover:bg-[#005B9A] hover:text-white flex items-center justify-between"
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Ribbon Content Panels ── */}
      <div className="flex-1 flex items-center px-3 py-1 gap-1 overflow-x-auto overflow-y-hidden" style={{ background: CONTENT_BG }}>
        {activeTab === 'FEATURES' && <FeaturesTab {...tabProps} />}
        {activeTab === 'SKETCH' && <SketchTab {...tabProps} />}
        {activeTab === 'EVALUATE' && <EvaluateTab {...tabProps} />}
        {activeTab === 'ASSEMBLY' && <AssemblyTab {...tabProps} />}
        {activeTab === 'DRAWING' && <DrawingTab {...tabProps} />}
        {activeTab === 'RENDER' && <RenderTab {...tabProps} />}
        {activeTab === 'SURFACING' && <SurfacingTab {...tabProps} />}
        {activeTab === 'SHEET_METALS' && <SheetMetalsTab {...tabProps} />}
      </div>

      {/* ── Right-click Context Menu ── */}
      {contextMenuPos && (
        <div
          className="fixed w-[200px] bg-white border border-[#C0C0C0] shadow-md py-0.5 z-[300]"
          style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
        >
          <div className="px-3 py-1 text-[10px] text-[#909090] uppercase tracking-wider font-semibold">Show Tabs</div>
          {orderedTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleContextMenuToggle(tab.id)}
              className="w-full text-left px-3 py-1 text-[11px] text-[#303030] hover:bg-[#005B9A] hover:text-white flex items-center justify-between"
            >
              <span>{tab.label}</span>
              <span className={`w-3 h-3 border border-[#B0B0B0] rounded-sm flex items-center justify-center ${visibleTabIds.has(tab.id) ? 'bg-[#005B9A] border-[#005B9A]' : ''}`}>
                {visibleTabIds.has(tab.id) && (
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="white" strokeWidth="1.5">
                    <polyline points="1.5,4 3.5,6 6.5,2" />
                  </svg>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
