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

/** Cached result from /api/v1/tolerance/calculate */
export interface ToleranceCacheEntry {
  nominal_mm: number;
  grade: DimXpertGrade;
  tolerance_um: number;
  tolerance_mm: number;
  size_range: string;
  loading: boolean;
  error?: string;
}

/** Cached result from /api/v1/tolerance/deviations */
export interface DeviationCacheEntry {
  nominal_mm: number;
  grade: DimXpertGrade;
  fit_type: string;
  upper_deviation_um: number;
  lower_deviation_um: number;
  upper_deviation_mm: number;
  lower_deviation_mm: number;
  loading: boolean;
  error?: string;
}

/** Shape of the raw API response from /api/v1/tolerance/calculate */
interface ToleranceApiResponse {
  status: string;
  data: {
    nominal_mm: number;
    grade: string;
    tolerance_um: number;
    tolerance_mm: number;
    size_range: string;
  };
}

/** Shape of the raw API response from /api/v1/tolerance/deviations */
interface DeviationApiResponse {
  status: string;
  data: {
    nominal_mm: number;
    grade: string;
    fit_type: string;
    upper_deviation_um: number;
    lower_deviation_um: number;
    upper_deviation_mm: number;
    lower_deviation_mm: number;
  };
}

const TOLERANCE_BASE_URL = process.env.NEXT_PUBLIC_TOLERANCE_API_URL || 'http://127.0.0.1:8400/api/v1';

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
  /** Cache of tolerance calculations keyed by `${nominal_mm}_${grade}` */
  toleranceCache: Record<string, ToleranceCacheEntry>;
  /** Cache of deviation calculations keyed by `${nominal_mm}_${grade}_${fitType}` */
  deviationCache: Record<string, DeviationCacheEntry>;
  /** Compute tolerance for a nominal size & grade, caching the result */
  computeTolerance: (nominal_mm: number, grade: DimXpertGrade) => Promise<ToleranceCacheEntry>;
  /** Compute deviations for a nominal size, grade & fit type */
  computeDeviations: (nominal_mm: number, grade: DimXpertGrade, fitType: string) => Promise<DeviationCacheEntry>;
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
  toleranceCache: {},
  deviationCache: {},
  computeTolerance: async (nominal_mm: number, grade: DimXpertGrade) => {
    const key = `${nominal_mm}_${grade}`;
    const cached = get().toleranceCache[key];
    if (cached && !cached.loading && !cached.error) return cached;

    // Mark as loading
    set((s: any) => ({
      toleranceCache: { ...s.toleranceCache, [key]: { nominal_mm, grade, loading: true, tolerance_um: 0, tolerance_mm: 0, size_range: '' } as ToleranceCacheEntry },
    }));

    try {
      const resp = await fetch(`${TOLERANCE_BASE_URL}/tolerance/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nominal_mm, grade }),
      });
      if (!resp.ok) throw new Error(`Tolerance API error: ${resp.status}`);
      const json: ToleranceApiResponse = await resp.json();
      const entry: ToleranceCacheEntry = { ...json.data as ToleranceCacheEntry, loading: false };
      set((s: any) => ({ toleranceCache: { ...s.toleranceCache, [key]: entry } }));
      return entry;
    } catch (err: any) {
      const entry: ToleranceCacheEntry = { nominal_mm, grade, loading: false, tolerance_um: 0, tolerance_mm: 0, size_range: '', error: err.message ?? 'Unknown error' };
      set((s: any) => ({ toleranceCache: { ...s.toleranceCache, [key]: entry } }));
      return entry;
    }
  },
  computeDeviations: async (nominal_mm: number, grade: DimXpertGrade, fitType: string) => {
    const key = `${nominal_mm}_${grade}_${fitType}`;
    const cached = get().deviationCache[key];
    if (cached && !cached.loading && !cached.error) return cached;

    set((s: any) => ({
      deviationCache: { ...s.deviationCache, [key]: { nominal_mm, grade, fit_type: fitType, loading: true, upper_deviation_um: 0, lower_deviation_um: 0, upper_deviation_mm: 0, lower_deviation_mm: 0 } as DeviationCacheEntry },
    }));

    try {
      const resp = await fetch(`${TOLERANCE_BASE_URL}/tolerance/deviations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nominal_mm, grade, fit_type: fitType }),
      });
      if (!resp.ok) throw new Error(`Deviation API error: ${resp.status}`);
      const json: DeviationApiResponse = await resp.json();
      const entry: DeviationCacheEntry = { ...json.data as DeviationCacheEntry, loading: false };
      set((s: any) => ({ deviationCache: { ...s.deviationCache, [key]: entry } }));
      return entry;
    } catch (err: any) {
      const entry: DeviationCacheEntry = { nominal_mm, grade, fit_type: fitType, loading: false, upper_deviation_um: 0, lower_deviation_um: 0, upper_deviation_mm: 0, lower_deviation_mm: 0, error: err.message ?? 'Unknown error' };
      set((s: any) => ({ deviationCache: { ...s.deviationCache, [key]: entry } }));
      return entry;
    }
  },
});
