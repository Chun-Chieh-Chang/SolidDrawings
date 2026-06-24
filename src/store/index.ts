import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  CadMode,
  MeasurementMode,
  MateType,
  MateEntity,
  CADMate,
  CADFeature,
  CADReferencePlane,
  CADConfiguration,
  SketchNode,
  SketchEdge,
  SketchConstraint,
  CADComponent,
  CADShortcutBox,
  SectionViewState,
  ExplodedViewStep,
  ExplodedViewState,
  MotionDriver,
  MotionStudyState,
  CadToastType,
  DrawingSheetData,
  DrawingSheetViewData,
  CadToastItem,
  CADContextMenu,
  MeasurementResult,
  RibbonLayout,
} from './types';
import type { SelectionFilterType } from '@/utils/selection-filters';
import { MATERIAL_PRESETS, DEFAULT_RIBBON_LAYOUT } from './types';
import { createSketchState } from './sketch-state';
import { createFeatureState } from './feature-state';
import { createAssemblyState } from './assembly-state';
import { createDrawingState } from './drawing-state';
import { createHistoryState } from './history-state';
import { createSelectionState } from './selection-state';
import { createConfigState } from './config-state';
import { createUiState } from './ui-state';
import { createAppState } from './app-state';

export type {
  CadMode,
  MeasurementMode,
  MateType,
  MateEntity,
  CADMate,
  CADFeature,
  CADReferencePlane,
  CADConfiguration,
  SketchNode,
  SketchEdge,
  SketchConstraint,
  CADComponent,
  CADShortcutBox,
  SectionViewState,
  ExplodedViewStep,
  ExplodedViewState,
  MotionDriver,
  MotionStudyState,
  CadToastType,
  DrawingSheetData,
  DrawingSheetViewData,
  CadToastItem,
  CADContextMenu,
  MeasurementResult,
  RibbonLayout,
};

export { MATERIAL_PRESETS, DEFAULT_RIBBON_LAYOUT };

export type { SketchSlice } from './sketch-state';
export type { FeatureSlice } from './feature-state';
export type { AssemblySlice } from './assembly-state';
export type { DrawingSlice } from './drawing-state';
export type { HistorySlice } from './history-state';
export type { SelectionSlice } from './selection-state';
export type { ConfigSlice } from './config-state';
export type { AppStateSlice } from './app-state';
export type { UiSlice } from './ui-state';

// Backward-compat aliases — these represent the combined store shape
export type CombinedState = {
  projectName: string;
  setProjectName: (name: string) => void;
  drawingScale: string;
  setDrawingScale: (scale: string) => void;
  drawnBy: string;
  setDrawnBy: (name: string) => void;
  approvedBy: string;
  setApprovedBy: (name: string) => void;
  configurations: import('./types').CADConfiguration[];
  activeConfigurationId: string;
  setConfigurations: (configs: import('./types').CADConfiguration[]) => void;
  setActiveConfiguration: (id: string) => void;
  addConfiguration: (config: import('./types').CADConfiguration) => void;
  deleteConfiguration: (id: string) => void;
  toggleFeatureSuppression: (featureId: string, configId?: string) => void;
  globalVariables: Record<string, string>;
  evaluatedVariables: Record<string, number>;
  setGlobalVariable: (name: string, formula: string) => void;
  removeGlobalVariable: (name: string) => void;
  refreshEvaluatedVariables: () => void;
  mode: import('./types').CadMode;
  setMode: (mode: import('./types').CadMode) => void;
  activeTab: 'FEATURES' | 'SKETCH' | 'EVALUATE' | 'ASSEMBLY' | 'DRAWING' | 'RENDER' | 'SURFACING' | 'SHEET_METALS';
  setActiveTab: (tab: 'FEATURES' | 'SKETCH' | 'EVALUATE' | 'ASSEMBLY' | 'DRAWING' | 'RENDER' | 'SURFACING' | 'SHEET_METALS') => void;
  activeComponentId: string | null;
  setActiveComponentId: (id: string | null) => void;
  isSketchMode: boolean;
  setSketchMode: (active: boolean) => void;
  smartDimensionActive: boolean;
  setSmartDimensionActive: (active: boolean) => void;
  activePlane: string | null;
  setActivePlane: (plane: string | null) => void;
  activeFaceOrigin: [number, number, number] | null;
  setActiveFaceOrigin: (origin: [number, number, number] | null) => void;
  activeFaceNormal: [number, number, number] | null;
  setActiveFaceNormal: (normal: [number, number, number] | null) => void;
  activeFaceId: string | null;
  setActiveFaceId: (id: string | null) => void;
  revolveAxisId: string | null;
  setRevolveAxisId: (id: string | null) => void;
  sketchTool: string;
  setSketchTool: (tool: string) => void;
  gridSnap: boolean;
  setGridSnap: (active: boolean) => void;
  sketchNewChain: boolean;
  setSketchNewChain: (active: boolean) => void;
  lastClickedNodeId: string | null;
  setLastClickedNodeId: (id: string | null) => void;
  firstChainNodeId: string | null;
  setFirstChainNodeId: (id: string | null) => void;
  convertEntities: (selectedEdgeIds: string[]) => void;
  selectedEntityIds: string[];
  setSelectedEntityIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  sketchNodes: Record<string, import('./types').SketchNode>;
  setSketchNodes: (nodes: Record<string, import('./types').SketchNode> | ((prev: Record<string, import('./types').SketchNode>) => Record<string, import('./types').SketchNode>)) => void;
  sketchEdges: Record<string, import('./types').SketchEdge>;
  setSketchEdges: (edges: Record<string, import('./types').SketchEdge> | ((prev: Record<string, import('./types').SketchEdge>) => Record<string, import('./types').SketchEdge>)) => void;
  sketchConstraints: Record<string, import('./types').SketchConstraint>;
  setSketchConstraints: (constraints: Record<string, import('./types').SketchConstraint> | ((prev: Record<string, import('./types').SketchConstraint>) => Record<string, import('./types').SketchConstraint>)) => void;
  features: import('./types').CADFeature[];
  setFeatures: (features: import('./types').CADFeature[]) => void;
  addFeature: (feature: import('./types').CADFeature) => void;
  removeFeature: (id: string) => void;
  removeFeatures: (ids: string[]) => void;
  updateFeatureParams: (id: string, params: any) => void;
  updateFeatureProperty: (id: string, key: string, value: any) => void;
  editingFeatureId: string | null;
  setEditingFeatureId: (id: string | null) => void;
  rollbackIndex: number | null;
  setRollbackIndex: (index: number | null) => void;
  rebuildDirty: boolean;
  dirtyFromFeatureIndex: number;
  markRebuildDirty: (fromFeatureIndex?: number) => void;
  clearRebuildDirty: () => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  selectedSubNodeType: 'SKETCH' | 'FEATURE' | null;
  setSelectedSubNodeType: (type: 'SKETCH' | 'FEATURE' | null) => void;
  visibleSketches: string[];
  toggleSketchVisibility: (featureId: string) => void;
  setSuppressed: (id: string, suppressed: boolean) => void;
  reorderFeatures: (startIndex: number, endIndex: number) => void;
  checkDependencies: () => void;
  hoveredTreeId: string | null;
  setHoveredTreeId: (id: string | null) => void;
  hoveredChildren: string[];
  setHoveredChildren: (ids: string[]) => void;
  history: { past: any[]; future: any[] };
  undo: () => void;
  redo: () => void;
  saveSnapshot: () => void;
  selectedTopology: any;
  setSelectedTopology: (topology: any) => void;
  measurementMode: import('./types').MeasurementMode;
  setMeasurementMode: (mode: import('./types').MeasurementMode) => void;
  measurementPoints: any[];
  setMeasurementPoints: (points: any[]) => void;
  measurementResults: import('./types').MeasurementResult | null;
  setMeasurementResults: (results: import('./types').MeasurementResult | null) => void;
  dimensionSelection: string[];
  addDimensionSelection: (id: string) => void;
  clearDimensionSelection: () => void;
  components: import('./types').CADComponent[];
  setComponents: (components: import('./types').CADComponent[]) => void;
  addComponent: (component: import('./types').CADComponent) => void;
  removeComponent: (id: string) => void;
  updateComponentTransform: (id: string, position: [number, number, number], rotation: [number, number, number]) => void;
  updateComponentColor: (id: string, color: string) => void;
  toggleComponentFixed: (id: string) => void;
  toggleLightweight: (id: string) => void;
  setAllLightweight: (light: boolean) => void;
  isLargeAssemblyMode: boolean;
  setLargeAssemblyMode: (active: boolean) => void;
  mates: import('./types').CADMate[];
  setMates: (mates: import('./types').CADMate[]) => void;
  addMate: (mate: import('./types').CADMate) => void;
  removeMate: (id: string) => void;
  mateSelection: any[];
  setMateSelection: (selection: any[]) => void;
  addMateSelection: (entity: any) => void;
  clearMateSelection: () => void;
  meshData: any[];
  setMeshData: (data: any[]) => void;
  interferenceMeshes: any[];
  setInterferenceMeshes: (data: any[]) => void;
  interferenceResults: any[];
  setInterferenceResults: (results: any[]) => void;
  interferenceActive: boolean;
  setInterferenceActive: (active: boolean) => void;
  solverReport: { dof: number; residual: number; nodes: Record<string, any>; max_residual?: number; iterations?: number; converged?: boolean } | null;
  setSolverReport: (report: { dof: number; residual: number; nodes: Record<string, any> } | null) => void;
  assemblyPreviewComponents: import('./types').CADComponent[] | null;
  setAssemblyPreviewComponents: (components: import('./types').CADComponent[] | null) => void;
  massProperties: { volume: number; surface_area: number; center_of_mass: number[]; inertia_matrix: number[][]; } | null;
  setMassProperties: (props: { volume: number; surface_area: number; center_of_mass: number[]; inertia_matrix: number[][]; } | null) => void;
  computedRefGeometry: any[];
  setComputedRefGeometry: (refGeom: any[]) => void;
  contextMenu: import('./types').CADContextMenu | null;
  setContextMenu: (menu: import('./types').CADContextMenu | null) => void;
  shortcutBox: import('./types').CADShortcutBox | null;
  setShortcutBox: (box: import('./types').CADShortcutBox | null) => void;
  mousePos: [number, number, number];
  setMousePos: (pos: [number, number, number]) => void;
  hint: string;
  setHint: (hint: string) => void;
  danglingNodes: [number, number, number][];
  setDanglingNodes: (nodes: [number, number, number][]) => void;
  toasts: import('./types').CadToastItem[];
  pushToast: (message: string, type?: import('./types').CadToastType) => void;
  dismissToast: (id: string) => void;
  pendingFeatureCommand: 'FILLET' | 'CHAMFER' | 'THICKEN' | 'PATTERN' | 'MIRROR' | 'DRAFT' | 'SHELL' | 'HOLE_WIZARD' | 'PLANE' | 'REFERENCE_PLANE' | 'SURFACE_OFFSET' | 'SURFACE_KNIT' | 'SURFACE_CUT' | 'REFERENCE_POINT' | 'REVOLVED_CUT' | 'DOME' | 'COORDINATE_SYSTEM' | null;
  setPendingFeatureCommand: (cmd: 'FILLET' | 'CHAMFER' | 'THICKEN' | 'PATTERN' | 'MIRROR' | 'DRAFT' | 'SHELL' | 'HOLE_WIZARD' | 'PLANE' | 'REFERENCE_PLANE' | 'SURFACE_OFFSET' | 'SURFACE_KNIT' | 'SURFACE_CUT' | 'REFERENCE_POINT' | 'REVOLVED_CUT' | 'DOME' | 'COORDINATE_SYSTEM' | null) => void;
  defaultFilletRadius: number;
  defaultChamferDistance: number;
  referencePlanes: import('./types').CADReferencePlane[];
  setReferencePlanes: (planes: import('./types').CADReferencePlane[]) => void;
  referenceAxes: any[];
  setReferenceAxes: (axes: any[]) => void;
  referencePoints: any[];
  setReferencePoints: (points: any[]) => void;
  referenceCoordinateSystems: any[];
  setReferenceCoordinateSystems: (systems: any[]) => void;
  activePropertyManager: any;
  setActivePropertyManager: (mgr: any) => void;
  showExportModal: boolean;
  setShowExportModal: (show: boolean) => void;
  viewportDisplayMode: 'SHADED' | 'SHADED_EDGES' | 'WIREFRAME';
  setViewportDisplayMode: (mode: 'SHADED' | 'SHADED_EDGES' | 'WIREFRAME') => void;
  cameraNormalTrigger: number;
  cameraNormalFlip: boolean;
  cameraNormalLastPlane: string | null;
  triggerCameraNormal: () => void;
  controls: any;
  setControls: (controls: any) => void;
  isCameraAnimating: boolean;
  setIsCameraAnimating: (active: boolean) => void;
  sectionView: import('./types').SectionViewState;
  setSectionView: (view: Partial<import('./types').SectionViewState>) => void;
  explodedView: import('./types').ExplodedViewState;
  setExplodedView: (view: Partial<import('./types').ExplodedViewState>) => void;
  setExplosionFactor: (factor: number) => void;
  calculateAutoExplosion: () => void;
  setExplodedDirection: (componentId: string, direction: [number, number, number]) => void;
  saveExplodeStep: (name: string) => void;
  loadExplodeStep: (index: number) => void;
  deleteExplodeStep: (index: number) => void;
  motionStudy: import('./types').MotionStudyState;
  setMotionStudy: (study: Partial<import('./types').MotionStudyState>) => void;
  addMotionDriver: (driver: import('./types').MotionDriver) => void;
  removeMotionDriver: (id: string) => void;
  partMaterial: string;
  setPartMaterial: (material: string) => void;
  environmentMap: string;
  setEnvironmentMap: (env: string) => void;
  ribbonLayout: import('./types').RibbonLayout;
  setRibbonLayout: (layout: import('./types').RibbonLayout) => void;
  resetRibbonLayout: () => void;
  commitPreciseSketchSolve: () => void;
  viewOrientationSelectorVisible: boolean;
  setViewOrientationSelectorVisible: (visible: boolean) => void;
  showMaterialModal: boolean;
  setShowMaterialModal: (show: boolean) => void;
  targetMaterialEntity: { type: 'PART' | 'COMPONENT' | 'FEATURE'; id: string } | null;
  setTargetMaterialEntity: (entity: { type: 'PART' | 'COMPONENT' | 'FEATURE'; id: string } | null) => void;
  hoveredEntityId: string | null;
  setHoveredEntityId: (id: string | null) => void;
  selectionFilter: import('@/utils/selection-filters').SelectionFilterType;
  setSelectionFilter: (filter: import('@/utils/selection-filters').SelectionFilterType) => void;
  selection: { type?: string; ids?: string[]; nodes: string[]; edges: string[]; features: string[]; faces: string[] };
  drawingSheets: import('./types').DrawingSheetData[];
  activeSheetId: string;
  setDrawingSheets: (sheets: import('./types').DrawingSheetData[]) => void;
  addDrawingSheet: (name: string) => void;
  deleteDrawingSheet: (id: string) => void;
  renameDrawingSheet: (id: string, name: string) => void;
  setActiveSheet: (id: string) => void;
  updateViewPosition: (sheetId: string, viewId: string, position: { x: number; y: number; w: number; h: number }) => void;
  updateViewScale: (sheetId: string, viewId: string, scale: string) => void;
  addViewToSheet: (viewType: 'FRONT' | 'TOP' | 'RIGHT' | 'ISO' | 'SECTION', sheetId?: string, parentViewId?: string) => void;
  removeViewFromSheet: (sheetId: string, viewId: string) => void;
  updateViewTitle: (sheetId: string, viewId: string, title: string) => void;
  toggleViewDimensions: (sheetId: string, viewId: string) => void;
};

export type CadState = CombinedState;

export const useCadStore = create<CombinedState>()(
  persist(
    (set, get) => ({
      ...createSketchState(set, get),
      ...createFeatureState(set, get),
      ...createAssemblyState(set, get),
      ...createDrawingState(set, get),
      ...createHistoryState(set, get),
      ...createSelectionState(set, get),
      ...createConfigState(set, get),
      ...createUiState(set, get),
      ...createAppState(set, get),
    }),
    {
      name: 'cad-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state: any) => ({
        projectName: state.projectName,
        drawingScale: state.drawingScale,
        drawnBy: state.drawnBy,
        approvedBy: state.approvedBy,
        configurations: state.configurations,
        activeConfigurationId: state.activeConfigurationId,
        globalVariables: state.globalVariables,
        mode: state.mode,
        activeTab: state.activeTab,
        activeComponentId: state.activeComponentId,
        isSketchMode: state.isSketchMode,
        smartDimensionActive: state.smartDimensionActive,
        activePlane: state.activePlane,
        activeFaceOrigin: state.activeFaceOrigin,
        activeFaceNormal: state.activeFaceNormal,
        activeFaceId: state.activeFaceId,
        revolveAxisId: state.revolveAxisId,
        sketchTool: state.sketchTool,
        gridSnap: state.gridSnap,
        sketchNewChain: state.sketchNewChain,
        lastClickedNodeId: state.lastClickedNodeId,
        firstChainNodeId: state.firstChainNodeId,
        selectedEntityIds: state.selectedEntityIds,
        sketchNodes: state.sketchNodes,
        sketchEdges: state.sketchEdges,
        sketchConstraints: state.sketchConstraints,
        features: state.features,
        editingFeatureId: state.editingFeatureId,
        rollbackIndex: state.rollbackIndex,
        selectedId: state.selectedId,
        selectedSubNodeType: state.selectedSubNodeType,
        visibleSketches: state.visibleSketches,
        hoveredTreeId: state.hoveredTreeId,
        hoveredChildren: state.hoveredChildren,
        selectedTopology: state.selectedTopology,
        measurementMode: state.measurementMode,
        measurementPoints: state.measurementPoints,
        measurementResults: state.measurementResults,
        dimensionSelection: state.dimensionSelection,
        components: state.components,
        mates: state.mates,
        mateSelection: state.mateSelection,
        meshData: state.meshData,
        interferenceMeshes: state.interferenceMeshes,
        interferenceResults: state.interferenceResults,
        interferenceActive: state.interferenceActive,
        solverReport: state.solverReport,
        assemblyPreviewComponents: state.assemblyPreviewComponents,
        massProperties: state.massProperties,
        computedRefGeometry: state.computedRefGeometry,
        contextMenu: state.contextMenu,
        shortcutBox: state.shortcutBox,
        mousePos: state.mousePos,
        hint: state.hint,
        danglingNodes: state.danglingNodes,
        pendingFeatureCommand: state.pendingFeatureCommand,
        defaultFilletRadius: state.defaultFilletRadius,
        defaultChamferDistance: state.defaultChamferDistance,
        referencePlanes: state.referencePlanes,
        referenceAxes: state.referenceAxes,
        referencePoints: state.referencePoints,
        referenceCoordinateSystems: state.referenceCoordinateSystems,
        activePropertyManager: state.activePropertyManager,
        showExportModal: state.showExportModal,
        viewportDisplayMode: state.viewportDisplayMode,
        cameraNormalTrigger: state.cameraNormalTrigger,
        cameraNormalFlip: state.cameraNormalFlip,
        cameraNormalLastPlane: state.cameraNormalLastPlane,
        sectionView: state.sectionView,
        explodedView: state.explodedView,
        motionStudy: state.motionStudy,
        partMaterial: state.partMaterial,
        environmentMap: state.environmentMap,
        ribbonLayout: state.ribbonLayout,
        viewOrientationSelectorVisible: state.viewOrientationSelectorVisible,
        showMaterialModal: state.showMaterialModal,
        targetMaterialEntity: state.targetMaterialEntity,
        hoveredEntityId: state.hoveredEntityId,
        selectionFilter: state.selectionFilter,
        selection: state.selection,
        drawingSheets: state.drawingSheets,
        activeSheetId: state.activeSheetId,
      }),
    }
  )
);
