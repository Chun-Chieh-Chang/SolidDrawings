// Shared props type for all Ribbon tab components.
// Every tab gets the full set; each tab picks what it needs.
import type { MeasurementMode, SectionViewState } from '../../../store/types';

export interface RibbonTabProps {
  // Navigation
  setActiveTab: (tab: any) => void;
  // Sketch
  isSketchMode: boolean;
  setSketchMode: (v: boolean) => void;
  sketchTool: string;
  setSketchTool: (v: string) => void;
  setEditingFeatureId: (v: string | null) => void;
  setActivePlane: (v: any) => void;
  activePlane: string;
  triggerCameraNormal: () => void;
  selectedTopology: any;
  setSelectedTopology: (v: any) => void;
  setActiveFaceOrigin: (v: any) => void;
  setActiveFaceNormal: (v: any) => void;
  setActiveFaceId: (v: string) => void;
  // Measure / Evaluate
  setMeasurementMode: (v: MeasurementMode) => void;
  measurementMode: MeasurementMode;
  setMeasurementPoints: (v: any) => void;
  setMeasurementResults: (v: any) => void;
  interferenceActive: boolean;
  setInterferenceActive: (v: boolean) => void;
  // Hints / Toasts
  setHint: (h: string) => void;
  pushToast: (msg: string, type: 'error' | 'warning' | 'info') => void;
  // Features
  pendingFeatureCommand: string | null;
  setPendingFeatureCommand: (v: string | null) => void;
  features: any[];
  addFeature: (f: any) => void;
  setSelectedId: (v: string | null) => void;
  setSelectedSubNodeType: (v: string | null) => void;
  setActivePropertyManager: (v: any) => void;
  sketchNodes: any[];
  sketchEdges: any[];
  // Drawing-specific handlers
  handleCreateStandard3Views?: () => void;
  handleCreateModelView?: () => void;
  // Sheet Metal handlers
  handleCreateEdgeFlange?: (params: any) => void;
  handleCreateMiterFlange?: (params: any) => void;
  handleCreateHem?: (params: any) => void;
  handleCreateFlatPattern?: () => void;
  handleUnfold?: (bendIds?: string[]) => void;
  handleFold?: (bendIds: string[]) => void;
  handleCreateFormingTool?: (params: any) => void;
  // Import
  handleImportStep?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // Evaluate
  onShowMassProps?: () => void;
  onShowEquations?: () => void;
  // Component / Assembly
  components: any[];
  // Viewport
  viewportDisplayMode: string;
  setViewportDisplayMode: (v: string) => void;
  explodedView: any;
  setExplodedView: (v: any) => void;
  calculateAutoExplosion: () => void;
  partMaterial: string;
  setPartMaterial: (v: string) => void;
  environmentMap: string;
  setEnvironmentMap: (v: string) => void;
  // Bend Table
  setShowBendTable: (v: boolean) => void;
  // Extra store access for direct state reads
  getState: () => any;
  solidSketchPointCount: number;
  handleExitAndExtrude?: (op?: any) => void;
  handleRevolveFromSketch?: (op?: any) => void;
  // Reference for file input hack
  fileInputRef?: React.RefObject<HTMLInputElement>;
  // Measurement
  measurementPoints: any[];
  // Assembly extras
  setLargeAssemblyMode: (v: boolean) => void;
  isLargeAssemblyMode: boolean;
}
