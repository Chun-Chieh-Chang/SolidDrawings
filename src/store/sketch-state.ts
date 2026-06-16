import { v4 as uuidv4 } from 'uuid';
import type { SketchNode, SketchEdge, SketchConstraint } from './types';

export type SketchSlice = {
  sketchNodes: Record<string, SketchNode>;
  sketchEdges: Record<string, SketchEdge>;
  sketchConstraints: Record<string, SketchConstraint>;
  lastClickedNodeId: string | null;
  setLastClickedNodeId: (id: string | null) => void;
  firstChainNodeId: string | null;
  setFirstChainNodeId: (id: string | null) => void;
  sketchNewChain: boolean;
  setSketchNewChain: (active: boolean) => void;
  selectedEntityIds: string[];
  setSelectedEntityIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  setSketchNodes: (nodes: Record<string, SketchNode> | ((prev: Record<string, SketchNode>) => Record<string, SketchNode>)) => void;
  setSketchEdges: (edges: Record<string, SketchEdge> | ((prev: Record<string, SketchEdge>) => Record<string, SketchEdge>)) => void;
  setSketchConstraints: (constraints: Record<string, SketchConstraint> | ((prev: Record<string, SketchConstraint>) => Record<string, SketchConstraint>)) => void;
  convertEntities: (selectedEdgeIds: string[]) => void;
};

export const createSketchState = (set: any, get: any) => ({
  sketchNodes: {} as Record<string, SketchNode>,
  sketchEdges: {} as Record<string, SketchEdge>,
  sketchConstraints: {} as Record<string, SketchConstraint>,

  lastClickedNodeId: null as string | null,
  setLastClickedNodeId: (lastClickedNodeId: string | null) => set({ lastClickedNodeId }),

  firstChainNodeId: null as string | null,
  setFirstChainNodeId: (firstChainNodeId: string | null) => set({ firstChainNodeId }),

  sketchNewChain: false,
  setSketchNewChain: (sketchNewChain: boolean) => set({ sketchNewChain }),

  selectedEntityIds: [] as string[],
  setSelectedEntityIds: (ids: string[] | ((prev: string[]) => string[])) =>
    set((state: any) => ({ selectedEntityIds: typeof ids === 'function' ? ids(state.selectedEntityIds) : ids })),

  setSketchNodes: (nodes: Record<string, SketchNode> | ((prev: Record<string, SketchNode>) => Record<string, SketchNode>)) => {
    get().saveSnapshot();
    get().markRebuildDirty(0);
    set((state: any) => ({ sketchNodes: typeof nodes === 'function' ? nodes(state.sketchNodes) : nodes }));
  },

  setSketchEdges: (edges: Record<string, SketchEdge> | ((prev: Record<string, SketchEdge>) => Record<string, SketchEdge>)) => {
    get().saveSnapshot();
    get().markRebuildDirty(0);
    set((state: any) => ({ sketchEdges: typeof edges === 'function' ? edges(state.sketchEdges) : edges }));
  },

  setSketchConstraints: (constraints: Record<string, SketchConstraint> | ((prev: Record<string, SketchConstraint>) => Record<string, SketchConstraint>)) => {
    get().saveSnapshot();
    get().markRebuildDirty(0);
    set((state: any) => ({ sketchConstraints: typeof constraints === 'function' ? constraints(state.sketchConstraints) : constraints }));
  },

  convertEntities: (selectedEdgeIds: string[]) => {
    get().saveSnapshot();
    set((state: any) => {
      const nextNodes = { ...state.sketchNodes };
      const nextEdges = { ...state.sketchEdges };
      selectedEdgeIds.forEach((id: string, idx: number) => {
        const n1 = uuidv4();
        const n2 = uuidv4();
        nextNodes[n1] = { id: n1, x: 0 + idx * 10, y: 0 };
        nextNodes[n2] = { id: n2, x: 10 + idx * 10, y: 0 };
        const eId = uuidv4();
        nextEdges[eId] = { id: eId, type: 'LINE', nodeIds: [n1, n2] };
      });
      return { sketchNodes: nextNodes, sketchEdges: nextEdges };
    });
  },
});
