export type HistorySlice = {
  history: { past: any[]; future: any[] };
  saveSnapshot: () => void;
  undo: () => void;
  redo: () => void;
};

export const createHistoryState = (set: any, get: any) => ({
  history: { past: [] as any[], future: [] as any[] },

  saveSnapshot: () =>
    set((state: any) => {
      const snapshot = {
        features: state.features,
        sketchNodes: state.sketchNodes,
        sketchEdges: state.sketchEdges,
        sketchConstraints: state.sketchConstraints,
        mates: state.mates,
        components: state.components,
      };
      return { history: { past: [...state.history.past.slice(-50), snapshot], future: [] } };
    }),

  undo: () =>
    set((state: any) => {
      if (state.history.past.length === 0) return state;
      const previous = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(0, state.history.past.length - 1);
      const current = {
        features: state.features,
        sketchNodes: state.sketchNodes,
        sketchEdges: state.sketchEdges,
        sketchConstraints: state.sketchConstraints,
        mates: state.mates,
        components: state.components,
      };
      return { ...previous, rebuildDirty: true, history: { past: newPast, future: [current, ...state.history.future] } };
    }),

  redo: () =>
    set((state: any) => {
      if (state.history.future.length === 0) return state;
      const next = state.history.future[0];
      const newFuture = state.history.future.slice(1);
      const current = {
        features: state.features,
        sketchNodes: state.sketchNodes,
        sketchEdges: state.sketchEdges,
        sketchConstraints: state.sketchConstraints,
        mates: state.mates,
        components: state.components,
      };
      return { ...next, rebuildDirty: true, history: { past: [...state.history.past, current], future: newFuture } };
    }),
});
