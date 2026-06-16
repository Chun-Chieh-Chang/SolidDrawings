import type { SelectionFilterType } from '@/utils/selection-filters';

// ── Primitive types ──────────────────────────────────────────────
export type CadMode = 'PART' | 'ASSEMBLY' | 'DRAWING' | 'RENDER';
export type MeasurementMode = 'NONE' | 'DISTANCE' | 'ANGLE' | 'AREA' | 'VOLUME';
export type MateType = 'COINCIDENT' | 'PARALLEL' | 'CONCENTRIC' | 'DISTANCE' | 'PERPENDICULAR' | 'TANGENT' | 'ANGLE' | 'GEAR' | 'SCREW' | 'WIDTH' | 'SYMMETRY' | 'LOCK' | 'SNAP';
export type CadToastType = 'error' | 'warning' | 'info';

// ── Mate types ───────────────────────────────────────────────────
export interface MateEntity {
  componentId: string;
  topologyId: string;
  localOrigin?: [number, number, number];
  localNormal?: [number, number, number];
}

export interface CADMate {
  id: string;
  name: string;
  type: MateType;
  entity1: MateEntity;
  entity2: MateEntity;
  parameters?: {
    offset?: number;
    angle?: number;
    alignmentFlip?: boolean;
    isLimitAngle?: boolean;
    minAngle?: number;
    maxAngle?: number;
    ratio?: number;
    pitch?: number;
    initialTransforms?: Record<string, { position: [number, number, number], rotation: [number, number, number] }>;
    widthOffset?: number;
    symmetryPlane?: string;
    snapOffset?: [number, number, number];
  };
  alignment?: 'ALIGNED' | 'ANTI_ALIGNED';
  offset?: number;
  angle?: number;
}

// ── Feature types ────────────────────────────────────────────────
export interface CADFeature {
  id: string;
  type: string;
  name: string;
  parameters: {
    [key: string]: any;
    draftAngle?: number;
    draftOutward?: boolean;
    isSurfaceOnly?: boolean;
    isThin?: boolean;
    thinThickness?: number;
    thinDirection?: 'ONE_DIRECTION' | 'MID_PLANE' | 'TWO_DIRECTIONS';
    count2?: number;
    spacing2?: number;
    direction2_refs?: any[];
    flip1?: boolean;
    flip2?: boolean;
    patternSeedOnly?: boolean;
    equalSpacing?: boolean;
    instancesToSkip?: number[];
    boundary_id?: string;
    fill_layout?: 'SQUARE' | 'PERFORATION' | 'HEXAGON';
    margin?: number;
    fill_angle?: number;
    tool_feature_id?: string;
  };
  isSuppressed?: boolean;
  isBroken?: boolean;
  color?: string;
  materialId?: string;
}

export interface CADReferencePlane {
  id: string;
  name: string;
  origin: [number, number, number];
  normal: [number, number, number];
  xDir: [number, number, number];
  yDir: [number, number, number];
}

// ── Configuration types ──────────────────────────────────────────
export interface CADConfiguration {
  id: string;
  name: string;
  description?: string;
  featureSuppression: Record<string, boolean>;
  parameterOverrides: Record<string, Record<string, any>>;
}

// ── Sketch types ─────────────────────────────────────────────────
export interface SketchNode {
  id: string;
  x: number;
  y: number;
  isFixed?: boolean;
}

export interface SketchEdge {
  id: string;
  type: 'LINE' | 'ARC' | 'CIRCLE' | 'CENTER_LINE' | 'SPLINE' | 'TEXT';
  nodeIds: string[];
  isConstruction?: boolean;
  parameters?: any;
}

export interface SketchConstraint {
  id: string;
  type: 'COINCIDENT' | 'HORIZONTAL' | 'VERTICAL' | 'DISTANCE' | 'EQUAL' | 'CONCENTRIC' | 'TANGENT' | 'ANGLE' | 'PARALLEL' | 'PERPENDICULAR' | 'SYMMETRIC' | 'MIDPOINT' | 'COLLINEAR' | 'PIERCE';
  nodeIds?: string[];
  edgeIds?: string[];
  value?: number;
  offset?: number;
  arcCondition?: 'CENTER' | 'MIN' | 'MAX';
  label?: string;
}

// ── Assembly types ───────────────────────────────────────────────
export interface CADComponent {
  id: string;
  partId: string;
  instanceName: string;
  transform: {
    position: [number, number, number];
    rotation: [number, number, number];
  };
  visible: boolean;
  isFixed?: boolean;
  isLightweight?: boolean;
  color?: string;
  materialId?: string;
  features?: CADFeature[];
}

export interface ExplodedViewStep {
  name: string;
  factor: number;
  directions: Record<string, [number, number, number]>;
}

export interface ExplodedViewState {
  isActive: boolean;
  factor: number;
  directions: Record<string, [number, number, number]>;
  steps: ExplodedViewStep[];
  currentStepIndex: number;
}

export interface MotionDriver {
  id: string;
  mateId: string;
  type: 'ROTARY' | 'LINEAR';
  velocity: number;
}

export interface MotionStudyState {
  isActive: boolean;
  currentTime: number;
  playbackSpeed: number;
  drivers: MotionDriver[];
}

export interface SectionViewState {
  isActive: boolean;
  plane: 'FRONT' | 'TOP' | 'RIGHT';
  offset: number;
  flip: boolean;
}

// ── Drawing types ────────────────────────────────────────────────
export interface DrawingSheetViewData {
  id: string;
  type: 'FRONT' | 'TOP' | 'RIGHT' | 'ISO' | 'SECTION';
  title: string;
  position: { x: number; y: number; w: number; h: number };
  scale: string;
  showDimensions: boolean;
  parentViewId?: string;
  sectionLine?: { u1: number; v1: number; u2: number; v2: number };
}

export interface DrawingSheetData {
  id: string;
  name: string;
  views: DrawingSheetViewData[];
  sheetSize?: 'A4' | 'A3' | 'A2' | 'A1' | 'A0';
}

// ── UI / Toast / Context types ───────────────────────────────────
export interface CadToastItem {
  id: string;
  message: string;
  type: CadToastType;
}

export interface CADContextMenu {
  visible: boolean;
  x: number;
  y: number;
  type?: 'BACKGROUND' | 'ENTITY' | 'FEATURE';
  data?: any;
}

export interface CADShortcutBox {
  visible: boolean;
  x: number;
  y: number;
}

// ── Measurement types ────────────────────────────────────────────
export interface MeasurementResult {
    mode?: string;
    value?: number;
    offset?: number;
    unit?: string;
    details?: any;
    distance?: number;
    angle?: number;
    area?: number;
    volume?: number;
    center_of_mass?: [number, number, number];
    inertia_matrix?: number[][];
}

// ── Ribbon types ─────────────────────────────────────────────────
export interface RibbonLayout {
  FEATURES: string[];
  SKETCH: string[];
  EVALUATE: string[];
  ASSEMBLY?: string[];
  DRAWING?: string[];
  RENDER?: string[];
  SURFACING?: string[];
}

// ── Constants ────────────────────────────────────────────────────
export const MATERIAL_PRESETS: Record<string, {
  color: string;
  roughness: number;
  metalness: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  transmission?: number;
  ior?: number;
  thickness?: number;
}> = {
  Steel: { color: '#8c929c', roughness: 0.3, metalness: 0.8, clearcoat: 0.1 },
  Aluminum: { color: '#d5d7db', roughness: 0.4, metalness: 0.9 },
  Gold: { color: '#f0ce4a', roughness: 0.1, metalness: 1.0, clearcoat: 0.2 },
  Copper: { color: '#b87333', roughness: 0.2, metalness: 0.95 },
  'Glossy Plastic': { color: '#e74c3c', roughness: 0.05, metalness: 0.05, clearcoat: 1.0, clearcoatRoughness: 0.1 },
  'Matte Plastic': { color: '#2c3e50', roughness: 0.8, metalness: 0.0 },
  Glass: { color: '#ffffff', roughness: 0.0, metalness: 0.0, transmission: 1.0, ior: 1.5, thickness: 2.0, clearcoat: 1.0 },
};

export const DEFAULT_RIBBON_LAYOUT: RibbonLayout = {
  FEATURES: ['EXTRUDE', 'REVOLVE', 'EXTRUDE_CUT', 'REVOLVED_CUT', 'SWEEP', 'LOFT', 'FILLET', 'CHAMFER', 'MIRROR', 'PATTERN', 'SHELL', 'DOME', 'DRAFT', 'REFERENCE_PLANE', 'REFERENCE_AXIS', 'REFERENCE_POINT', 'REFERENCE_COORDINATE_SYSTEM', 'HOLE_WIZARD'],
  SKETCH: ['LINE', 'CIRCLE', 'ARC', 'RECTANGLE', 'POLYGON', 'SMART_DIMENSION', 'TRIM', 'EXTEND', 'OFFSET', 'MIRROR', 'PATTERN', 'TEXT', 'SPLINE'],
  EVALUATE: ['MEASURE', 'MASS_PROPS', 'INTERFERENCE', 'SECTION_VIEW', 'EQUATIONS']
};
