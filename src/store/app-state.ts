import type { CadMode, MeasurementMode, MateType, MateEntity, CADMate, CADFeature, CADReferencePlane, CADConfiguration, SketchNode, SketchEdge, SketchConstraint, CADComponent, CADShortcutBox, SectionViewState, ExplodedViewStep, ExplodedViewState, MotionDriver, MotionStudyState, CadToastType, DrawingSheetData, DrawingSheetViewData, CadToastItem, CADContextMenu, MeasurementResult, RibbonLayout, DrawingSheetViewData as DSV } from './types';
import type { SelectionFilterType } from '@/utils/selection-filters';
import { DEFAULT_RIBBON_LAYOUT } from './types';

export type AppStateSlice = {
  projectName: string;
  setProjectName: (name: string) => void;
  drawingScale: string;
  setDrawingScale: (scale: string) => void;
  drawnBy: string;
  setDrawnBy: (name: string) => void;
  approvedBy: string;
  setApprovedBy: (name: string) => void;
  mode: CadMode;
  setMode: (mode: CadMode) => void;
  activeTab: 'FEATURES' | 'SKETCH' | 'EVALUATE' | 'ASSEMBLY' | 'DRAWING' | 'RENDER' | 'SURFACING' | 'SHEET_METALS';
  setActiveTab: (tab: 'FEATURES' | 'SKETCH' | 'EVALUATE' | 'ASSEMBLY' | 'DRAWING' | 'RENDER' | 'SURFACING' | 'SHEET_METALS') => void;
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
  hoveredTreeId: string | null;
  setHoveredTreeId: (id: string | null) => void;
  hoveredChildren: string[];
  setHoveredChildren: (ids: string[]) => void;
  measurementMode: MeasurementMode;
  setMeasurementMode: (mode: MeasurementMode) => void;
  measurementPoints: any[];
  setMeasurementPoints: (points: any[]) => void;
  measurementResults: MeasurementResult | null;
  setMeasurementResults: (results: MeasurementResult | null) => void;
  referencePlanes: CADReferencePlane[];
  setReferencePlanes: (planes: CADReferencePlane[]) => void;
  referenceAxes: any[];
  setReferenceAxes: (axes: any[]) => void;
  referencePoints: any[];
  setReferencePoints: (points: any[]) => void;
  referenceCoordinateSystems: any[];
  setReferenceCoordinateSystems: (systems: any[]) => void;
  pendingFeatureCommand: 'FILLET' | 'CHAMFER' | 'THICKEN' | 'PATTERN' | 'MIRROR' | 'DRAFT' | 'SHELL' | 'HOLE_WIZARD' | 'PLANE' | 'REFERENCE_PLANE' | 'SURFACE_OFFSET' | 'SURFACE_KNIT' | 'SURFACE_CUT' | 'REFERENCE_POINT' | 'REVOLVED_CUT' | 'DOME' | 'COORDINATE_SYSTEM' | 'RIB' | 'SURFACE_BOUNDARY' | 'SURFACE_TRIM' | 'SURFACE_FILL' | 'PLANAR_SURFACE' | 'SURFACE_EXTEND' | 'SURFACE_UNTRIM' | 'RULED_SURFACE' | 'SPLIT' | 'COMBINE' | 'BASE_FLANGE_TAB' | null;
  setPendingFeatureCommand: (cmd: 'FILLET' | 'CHAMFER' | 'THICKEN' | 'PATTERN' | 'MIRROR' | 'DRAFT' | 'SHELL' | 'HOLE_WIZARD' | 'PLANE' | 'REFERENCE_PLANE' | 'SURFACE_OFFSET' | 'SURFACE_KNIT' | 'SURFACE_CUT' | 'REFERENCE_POINT' | 'REVOLVED_CUT' | 'DOME' | 'COORDINATE_SYSTEM' | 'RIB' | 'SURFACE_BOUNDARY' | 'SURFACE_TRIM' | 'SURFACE_FILL' | 'PLANAR_SURFACE' | 'SURFACE_EXTEND' | 'SURFACE_UNTRIM' | 'RULED_SURFACE' | 'SPLIT' | 'COMBINE' | 'BASE_FLANGE_TAB' | null) => void;
  defaultFilletRadius: number;
  defaultChamferDistance: number;
  commitPreciseSketchSolve: () => void;
  viewOrientationSelectorVisible: boolean;
  setViewOrientationSelectorVisible: (visible: boolean) => void;
  engineStatus: 'CONNECTED' | 'DISCONNECTED';
  setEngineStatus: (status: 'CONNECTED' | 'DISCONNECTED') => void;
  units: 'MMGS' | 'IPS';
  setUnits: (units: 'MMGS' | 'IPS') => void;
};

export const createAppState = (set: any, get: any) => ({
  projectName: 'Professional CAD Project',
  setProjectName: (projectName: string) => set({ projectName }),
  drawingScale: '1:1' as string,
  setDrawingScale: (drawingScale: string) => set({ drawingScale }),
  drawnBy: 'SkillsBuilder' as string,
  setDrawnBy: (drawnBy: string) => set({ drawnBy }),
  approvedBy: 'Admin' as string,
  setApprovedBy: (approvedBy: string) => set({ approvedBy }),

  mode: 'PART' as CadMode,
  setMode: (mode: CadMode) =>
    set({
      mode,
      activeTab: mode === 'ASSEMBLY' ? 'ASSEMBLY' : mode === 'DRAWING' ? 'DRAWING' : 'FEATURES',
    }),
  activeTab: 'FEATURES' as 'FEATURES' | 'SKETCH' | 'EVALUATE' | 'ASSEMBLY' | 'DRAWING' | 'RENDER' | 'SURFACING' | 'SHEET_METALS',
  setActiveTab: (activeTab: 'FEATURES' | 'SKETCH' | 'EVALUATE' | 'ASSEMBLY' | 'DRAWING' | 'RENDER' | 'SURFACING' | 'SHEET_METALS') => set({ activeTab }),

  isSketchMode: false,
  setSketchMode: (isSketchMode: boolean) =>
    set((state: any) => ({
      isSketchMode,
      activeTab: isSketchMode ? 'SKETCH' : state.activeTab === 'SKETCH' ? 'FEATURES' : state.activeTab,
    })),

  smartDimensionActive: false,
  setSmartDimensionActive: (smartDimensionActive: boolean) => set({ smartDimensionActive }),

  activePlane: null as string | null,
  setActivePlane: (activePlane: string | null) => set({ activePlane }),
  activeFaceOrigin: null as [number, number, number] | null,
  setActiveFaceOrigin: (activeFaceOrigin: [number, number, number] | null) => set({ activeFaceOrigin }),
  activeFaceNormal: null as [number, number, number] | null,
  setActiveFaceNormal: (activeFaceNormal: [number, number, number] | null) => set({ activeFaceNormal }),
  activeFaceId: null as string | null,
  setActiveFaceId: (activeFaceId: string | null) => set({ activeFaceId }),
  revolveAxisId: null as string | null,
  setRevolveAxisId: (revolveAxisId: string | null) => set({ revolveAxisId }),

  sketchTool: 'SELECT' as string,
  setSketchTool: (sketchTool: string) =>
    set({
      sketchTool,
      lastClickedNodeId: null,
      sketchNewChain: true,
      firstChainNodeId: null,
    }),

  gridSnap: true,
  setGridSnap: (gridSnap: boolean) => set({ gridSnap }),

  hoveredTreeId: null as string | null,
  setHoveredTreeId: (hoveredTreeId: string | null) => set({ hoveredTreeId }),
  hoveredChildren: [] as string[],
  setHoveredChildren: (hoveredChildren: string[]) => set({ hoveredChildren }),

  measurementMode: 'NONE' as MeasurementMode,
  setMeasurementMode: (measurementMode: MeasurementMode) =>
    set((state: any) => ({
      measurementMode,
      activeTab: measurementMode !== 'NONE' ? 'EVALUATE' : state.activeTab,
    })),
  measurementPoints: [] as any[],
  setMeasurementPoints: (measurementPoints: any[]) => set({ measurementPoints }),
  measurementResults: null as MeasurementResult | null,
  setMeasurementResults: (measurementResults: MeasurementResult | null) => set({ measurementResults }),

  referencePlanes: [] as CADReferencePlane[],
  setReferencePlanes: (referencePlanes: CADReferencePlane[]) => set({ referencePlanes }),
  referenceAxes: [] as any[],
  setReferenceAxes: (referenceAxes: any[]) => set({ referenceAxes }),
  referencePoints: [] as any[],
  setReferencePoints: (referencePoints: any[]) => set({ referencePoints }),
  referenceCoordinateSystems: [] as any[],
  setReferenceCoordinateSystems: (referenceCoordinateSystems: any[]) => set({ referenceCoordinateSystems }),

  pendingFeatureCommand: null as ('FILLET' | 'CHAMFER' | 'THICKEN' | 'PATTERN' | 'MIRROR' | 'DRAFT' | 'SHELL' | 'HOLE_WIZARD' | 'PLANE' | 'REFERENCE_PLANE' | 'SURFACE_OFFSET' | 'SURFACE_KNIT' | 'SURFACE_CUT' | 'REFERENCE_POINT' | 'REVOLVED_CUT' | 'DOME' | 'COORDINATE_SYSTEM' | 'RIB' | 'SURFACE_BOUNDARY' | 'SURFACE_TRIM' | 'SURFACE_FILL' | 'PLANAR_SURFACE' | 'SURFACE_EXTEND' | 'SURFACE_UNTRIM' | 'RULED_SURFACE' | 'SPLIT' | 'COMBINE' | 'BASE_FLANGE_TAB' | null),
  setPendingFeatureCommand: (pendingFeatureCommand: 'FILLET' | 'CHAMFER' | 'THICKEN' | 'PATTERN' | 'MIRROR' | 'DRAFT' | 'SHELL' | 'HOLE_WIZARD' | 'PLANE' | 'REFERENCE_PLANE' | 'SURFACE_OFFSET' | 'SURFACE_KNIT' | 'SURFACE_CUT' | 'REFERENCE_POINT' | 'REVOLVED_CUT' | 'DOME' | 'COORDINATE_SYSTEM' | 'RIB' | 'SURFACE_BOUNDARY' | 'SURFACE_TRIM' | 'SURFACE_FILL' | 'PLANAR_SURFACE' | 'SURFACE_EXTEND' | 'SURFACE_UNTRIM' | 'RULED_SURFACE' | 'SPLIT' | 'COMBINE' | 'BASE_FLANGE_TAB' | null) => set({ pendingFeatureCommand }),
  defaultFilletRadius: 2 as number,
  defaultChamferDistance: 1.5 as number,

  commitPreciseSketchSolve: () => { /* Logic would go here */ },
  viewOrientationSelectorVisible: false,
  setViewOrientationSelectorVisible: (viewOrientationSelectorVisible: boolean) => set({ viewOrientationSelectorVisible }),

  engineStatus: 'DISCONNECTED' as 'CONNECTED' | 'DISCONNECTED',
  setEngineStatus: (engineStatus: 'CONNECTED' | 'DISCONNECTED') => set({ engineStatus }),

  units: 'MMGS' as 'MMGS' | 'IPS',
  setUnits: (units: 'MMGS' | 'IPS') => set({ units }),
});
