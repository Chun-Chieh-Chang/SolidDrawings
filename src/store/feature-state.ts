import type { CADFeature } from './types';

export type FeatureSlice = {
  features: CADFeature[];
  editingFeatureId: string | null;
  setEditingFeatureId: (id: string | null) => void;
  setFeatures: (features: CADFeature[]) => void;
  addFeature: (feature: CADFeature) => void;
  removeFeature: (id: string) => void;
  removeFeatures: (ids: string[]) => void;
  updateFeatureParams: (id: string, params: any) => void;
  updateFeatureProperty: (id: string, key: string, value: any) => void;
  setSuppressed: (id: string, suppressed: boolean) => void;
  reorderFeatures: (startIndex: number, endIndex: number) => void;
  checkDependencies: () => void;
  rollbackIndex: number | null;
  setRollbackIndex: (index: number | null) => void;
  rebuildDirty: boolean;
  dirtyFromFeatureIndex: number;
  markRebuildDirty: (fromFeatureIndex?: number) => void;
  clearRebuildDirty: () => void;
  visibleSketches: string[];
  toggleSketchVisibility: (featureId: string) => void;
  selectedSubNodeType: 'SKETCH' | 'FEATURE' | null;
  setSelectedSubNodeType: (type: 'SKETCH' | 'FEATURE' | null) => void;
};

export const createFeatureState = (set: any, get: any) => ({
  features: [] as CADFeature[],

  rebuildDirty: true,
  dirtyFromFeatureIndex: 0,
  markRebuildDirty: (fromFeatureIndex: number = 0) =>
    set((state: any) => ({ rebuildDirty: true, dirtyFromFeatureIndex: Math.min(state.dirtyFromFeatureIndex, fromFeatureIndex) })),
  clearRebuildDirty: () => set({ rebuildDirty: false, dirtyFromFeatureIndex: Number.MAX_SAFE_INTEGER }),

  editingFeatureId: null as string | null,
  setEditingFeatureId: (editingFeatureId: string | null) => set({ editingFeatureId }),

  rollbackIndex: null as number | null,
  setRollbackIndex: (rollbackIndex: number | null) => set({ rollbackIndex, rebuildDirty: true }),

  selectedSubNodeType: null as 'SKETCH' | 'FEATURE' | null,
  setSelectedSubNodeType: (selectedSubNodeType: 'SKETCH' | 'FEATURE' | null) => set({ selectedSubNodeType }),

  visibleSketches: [] as string[],
  toggleSketchVisibility: (featureId: string) =>
    set((state: any) => ({
      visibleSketches: state.visibleSketches.includes(featureId)
        ? state.visibleSketches.filter((id: string) => id !== featureId)
        : [...state.visibleSketches, featureId],
    })),

  setFeatures: (features: CADFeature[]) => {
    get().saveSnapshot();
    get().markRebuildDirty(0);
    set({ features });
  },

  addFeature: (feature: CADFeature) => {
    get().saveSnapshot();
    const fromIndex = get().features.length;
    get().markRebuildDirty(fromIndex);
    set((state: any) => ({ features: [...state.features, feature] }));
  },

  removeFeature: (id: string) => {
    get().saveSnapshot();
    const fromIndex = get().features.findIndex((f: CADFeature) => f.id === id);
    get().markRebuildDirty(fromIndex >= 0 ? fromIndex : 0);
    set((state: any) => ({ features: state.features.filter((f: CADFeature) => f.id !== id) }));
  },

  removeFeatures: (ids: string[]) => {
    get().saveSnapshot();
    let minIndex = get().features.length;
    ids.forEach((id: string) => {
      const idx = get().features.findIndex((f: CADFeature) => f.id === id);
      if (idx >= 0 && idx < minIndex) minIndex = idx;
    });
    get().markRebuildDirty(minIndex < get().features.length ? minIndex : 0);
    set((state: any) => ({ features: state.features.filter((f: CADFeature) => !ids.includes(f.id)) }));
  },

  updateFeatureParams: (id: string, params: any) => {
    get().saveSnapshot();
    const fromIndex = get().features.findIndex((f: CADFeature) => f.id === id);
    get().markRebuildDirty(fromIndex >= 0 ? fromIndex : 0);
    set((state: any) => ({
      features: state.features.map((f: CADFeature) =>
        f.id === id ? { ...f, parameters: { ...f.parameters, ...params } } : f
      ),
    }));
  },

  updateFeatureProperty: (id: string, key: string, value: any) => {
    get().saveSnapshot();
    const fromIndex = get().features.findIndex((f: CADFeature) => f.id === id);
    get().markRebuildDirty(fromIndex >= 0 ? fromIndex : 0);
    set((state: any) => ({
      features: state.features.map((f: CADFeature) => (f.id === id ? { ...f, [key]: value } : f)),
    }));
  },

  setSuppressed: (id: string, suppressed: boolean) => {
    get().saveSnapshot();
    const fromIndex = get().features.findIndex((f: CADFeature) => f.id === id);
    get().markRebuildDirty(fromIndex >= 0 ? fromIndex : 0);
    set((state: any) => ({
      features: state.features.map((f: CADFeature) => (f.id === id ? { ...f, isSuppressed: suppressed } : f)),
    }));
  },

  reorderFeatures: (startIndex: number, endIndex: number) => {
    get().saveSnapshot();
    get().markRebuildDirty(Math.min(startIndex, endIndex));
    set((state: any) => {
      const nextFeatures = [...state.features];
      const [removed] = nextFeatures.splice(startIndex, 1);
      nextFeatures.splice(endIndex, 0, removed);
      return { features: nextFeatures };
    });
  },

  checkDependencies: () =>
    set((state: any) => {
      const features = [...state.features];
      return {
        features: features.map((f: CADFeature, idx: number) => {
          if (f.type === 'FILLET' || f.type === 'CHAMFER') {
            const targetId = f.parameters?.target_feature_id;
            if (targetId) {
              const parentIdx = features.findIndex((p: CADFeature) => p.id === targetId);
              if (parentIdx === -1 || parentIdx >= idx) {
                return { ...f, isBroken: true };
              }
            }
          }
          return { ...f, isBroken: false };
        }),
      };
    }),
});
