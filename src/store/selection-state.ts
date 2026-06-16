import type { SelectionFilterType } from '@/utils/selection-filters';

export type SelectionSlice = {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  selectedTopology: any;
  setSelectedTopology: (topology: any) => void;
  hoveredEntityId: string | null;
  setHoveredEntityId: (id: string | null) => void;
  selectionFilter: SelectionFilterType;
  setSelectionFilter: (filter: SelectionFilterType) => void;
  selection: {
    type?: string;
    ids?: string[];
    nodes: string[];
    edges: string[];
    features: string[];
    faces: string[];
  };
  dimensionSelection: string[];
  addDimensionSelection: (id: string) => void;
  clearDimensionSelection: () => void;
};

export const createSelectionState = (set: any, get: any) => ({
  selectedId: null as string | null,
  setSelectedId: (selectedId: string | null) => set({ selectedId }),

  selectedTopology: null as any,
  setSelectedTopology: (selectedTopology: any) => set({ selectedTopology }),

  hoveredEntityId: null as string | null,
  setHoveredEntityId: (hoveredEntityId: string | null) => set({ hoveredEntityId }),

  selectionFilter: 'NONE' as SelectionFilterType,
  setSelectionFilter: (selectionFilter: SelectionFilterType) => set({ selectionFilter }),

  selection: { nodes: [] as string[], edges: [] as string[], features: [] as string[], faces: [] as string[] },

  dimensionSelection: [] as string[],
  addDimensionSelection: (id: string) =>
    set((state: any) => ({ dimensionSelection: [...state.dimensionSelection, id] })),
  clearDimensionSelection: () => set({ dimensionSelection: [] }),
});
