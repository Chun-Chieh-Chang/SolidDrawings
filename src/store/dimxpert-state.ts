import { v4 as uuidv4 } from 'uuid';

// ── DimXpert types ──────────────────────────────────────────────────────
export interface DimXpertDimension {
  id: string;
  type: 'DIAMETER' | 'RADIUS' | 'LENGTH' | 'WIDTH' | 'DISTANCE' | 'ANGLE' | 'RADIUS';
  value: number;
  tolerance?: number;
  label: string;
}

export interface DimXpertFeature {
  id: string;
  type: 'HOLE' | 'SLOT' | 'FILLET' | 'CHAMFER';
  subtype?: string;
  name: string;
  confidence: number;
  parameters: Record<string, any>;
  faces: string[];
  edges: string[];
  vertices: string[];
  dimensions: DimXpertDimension[];
  visible: boolean;
}

export interface DimXpertAnnotation {
  id: string;
  featureId: string;
  dimension: DimXpertDimension;
  screenPosition: { x: number; y: number };
  leaderEndpoint: { x: number; y: number; z: number };
  visible: boolean;
}

export type DimXpertGrade = 'IT01' | 'IT0' | 'IT1' | 'IT2' | 'IT3' | 'IT4' | 'IT5' | 'IT6' | 'IT7' | 'IT8';

export interface DimXpertTolerance {
  grade: DimXpertGrade;
  tolerance_um: number;
  tolerance_mm: number;
  nominal_size: number;
  upper_deviation: number;
  lower_deviation: number;
}

export interface DimXpertState {
  dimxpertFeatures: DimXpertFeature[];
  setDimxpertFeatures: (features: DimXpertFeature[]) => void;
  addDimxpertFeature: (feature: DimXpertFeature) => void;
  removeDimxpertFeature: (id: string) => void;
  toggleDimxpertFeatureVisibility: (id: string) => void;
  dimxpertAnnotations: DimXpertAnnotation[];
  setDimxpertAnnotations: (annotations: DimXpertAnnotation[]) => void;
  dimxpertActiveGrade: DimXpertGrade;
  setDimxpertActiveGrade: (grade: DimXpertGrade) => void;
  isDimXpertActive: boolean;
  setIsDimXpertActive: (active: boolean) => void;
}

export const createDimXpertState = (set: any, get: any): DimXpertState => ({
  dimxpertFeatures: [] as DimXpertFeature[],
  setDimxpertFeatures: (dimxpertFeatures: DimXpertFeature[]) => set({ dimxpertFeatures }),
  addDimxpertFeature: (feature: DimXpertFeature) => {
    set((state: any) => ({ dimxpertFeatures: [...state.dimxpertFeatures, feature] }));
  },
  removeDimxpertFeature: (id: string) => {
    set((state: any) => ({
      dimxpertFeatures: state.dimxpertFeatures.filter((f: DimXpertFeature) => f.id !== id),
      dimxpertAnnotations: state.dimxpertAnnotations.filter((a: DimXpertAnnotation) => a.featureId !== id),
    }));
  },
  toggleDimxpertFeatureVisibility: (id: string) => {
    set((state: any) => ({
      dimxpertFeatures: state.dimxpertFeatures.map((f: DimXpertFeature) =>
        f.id === id ? { ...f, visible: !f.visible } : f
      ),
    }));
  },
  dimxpertAnnotations: [] as DimXpertAnnotation[],
  setDimxpertAnnotations: (dimxpertAnnotations: DimXpertAnnotation[]) => set({ dimxpertAnnotations }),
  dimxpertActiveGrade: 'IT7' as DimXpertGrade,
  setDimxpertActiveGrade: (dimxpertActiveGrade: DimXpertGrade) => set({ dimxpertActiveGrade }),
  isDimXpertActive: false,
  setIsDimXpertActive: (isDimXpertActive: boolean) => set({ isDimXpertActive }),
});
