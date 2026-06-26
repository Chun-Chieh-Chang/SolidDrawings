import { useCadStore, SketchNode, SketchEdge, SketchConstraint } from './useCadStore';
import { requireValidPoint } from '../utils/sketch/DataIntegrity';
import { v4 as uuidv4 } from 'uuid';

/**
 * Command Center for all Sketch Mutations.
 * Do not modify sketchNodes/sketchEdges/sketchConstraints directly from UI components.
 * Always dispatch through these actions to guarantee Data Integrity and Cascading Deletes.
 */

const gc = (nodes: Record<string, SketchNode>, edges: Record<string, SketchEdge>, constraints: Record<string, SketchConstraint>) => {
  let changed = false;
  // 1. Find orphan nodes
  const usedNodeIds = new Set<string>();
  Object.values(edges).forEach((edge: any) => {
    edge.nodeIds.forEach((nid: string) => usedNodeIds.add(nid));
  });

  Object.values(nodes).forEach((node: any) => {
    if (!usedNodeIds.has(node.id) && !node.isFixed) {
      delete nodes[node.id];
      changed = true;
    }
  });

  // 2. Find invalid constraints (referencing missing edges or nodes)
  Object.values(constraints).forEach((c: any) => {
    let invalid = false;
    if (c.edgeIds?.some((eid: string) => !edges[eid])) invalid = true;
    if (c.nodeIds?.some((nid: string) => !nodes[nid])) invalid = true;
    if (invalid) {
      delete constraints[c.id];
      changed = true;
    }
  });

  return changed;
};

export const sketchActions = {
  addNode: (u: number, v: number, isFixed: boolean = false): string | null => {
    if (!requireValidPoint(u, v, 'addNode')) return null;
    
    useCadStore.getState().saveSnapshot();
    
    const state = useCadStore.getState();
    const nId = uuidv4();
    const newNode: SketchNode = { id: nId, x: u, y: v, isFixed };
    
    useCadStore.setState({
      sketchNodes: { ...state.sketchNodes, [nId]: newNode }
    });
    
    return nId;
  },

  addEdge: (type: 'LINE' | 'ARC' | 'SPLINE' | 'CIRCLE' | 'CENTER_LINE', nodeIds: string[]): string => {
    useCadStore.getState().saveSnapshot();
    
    const state = useCadStore.getState();
    const eId = uuidv4();
    const newEdge: SketchEdge = { 
      id: eId, 
      type: type === 'CENTER_LINE' ? 'LINE' : type, 
      nodeIds,
      isConstruction: type === 'CENTER_LINE'
    };
    
    useCadStore.setState({
      sketchEdges: { ...state.sketchEdges, [eId]: newEdge }
    });
    
    return eId;
  },

  addConstraint: (type: string, edgeIds: string[] = [], nodeIds: string[] = [], value?: number): string => {
    useCadStore.getState().saveSnapshot();
    
    const state = useCadStore.getState();
    const cId = uuidv4();
    const newConstraint: SketchConstraint = { id: cId, type: type as any, edgeIds, nodeIds, value };
    
    useCadStore.setState({
      sketchConstraints: { ...state.sketchConstraints, [cId]: newConstraint }
    });
    
    return cId;
  },

  deleteEdges: (edgeIdsToDelete: string[]) => {
    useCadStore.getState().saveSnapshot();
    
    const state = useCadStore.getState();
    const nextEdges = { ...state.sketchEdges };
    const nextNodes = { ...state.sketchNodes };
    const nextConstraints = { ...state.sketchConstraints };

    edgeIdsToDelete.forEach(id => delete nextEdges[id]);

    gc(nextNodes, nextEdges, nextConstraints);

    useCadStore.setState({
      sketchEdges: nextEdges,
      sketchNodes: nextNodes,
      sketchConstraints: nextConstraints,
    });
  },

  deleteNodes: (nodeIdsToDelete: string[]) => {
    useCadStore.getState().saveSnapshot();
    
    const state = useCadStore.getState();
    const nextNodes = { ...state.sketchNodes };
    const nextEdges = { ...state.sketchEdges };
    const nextConstraints = { ...state.sketchConstraints };
    
    // 1. Delete the explicitly requested nodes
    nodeIdsToDelete.forEach(id => delete nextNodes[id]);

    // 2. Delete edges that reference missing nodes
    Object.values(nextEdges).forEach((edge: any) => {
      if (edge.nodeIds.some((nid: string) => !nextNodes[nid])) {
        delete nextEdges[edge.id];
      }
    });

    // 3. Garbage collect orphan nodes and invalid constraints
    gc(nextNodes, nextEdges, nextConstraints);

    useCadStore.setState({
      sketchNodes: nextNodes,
      sketchEdges: nextEdges,
      sketchConstraints: nextConstraints,
    });
  },

  deleteEntities: (entityIds: string[]) => {
    useCadStore.getState().saveSnapshot();
    
    const state = useCadStore.getState();
    const nextNodes = { ...state.sketchNodes };
    const nextEdges = { ...state.sketchEdges };
    const nextConstraints = { ...state.sketchConstraints };

    entityIds.forEach(id => {
      if (nextNodes[id]) delete nextNodes[id];
      if (nextEdges[id]) delete nextEdges[id];
      if (nextConstraints[id]) delete nextConstraints[id];
    });

    // Delete edges that reference missing nodes
    Object.values(nextEdges).forEach((edge: any) => {
      if (edge.nodeIds.some((nid: string) => !nextNodes[nid])) {
        delete nextEdges[edge.id];
      }
    });

    gc(nextNodes, nextEdges, nextConstraints);

    useCadStore.setState({
      sketchNodes: nextNodes,
      sketchEdges: nextEdges,
      sketchConstraints: nextConstraints,
    });
  },

  updateNodePosition: (nodeId: string, u: number, v: number) => {
    if (!requireValidPoint(u, v, 'updateNodePosition')) return;
    const state = useCadStore.getState();
    if (state.sketchNodes[nodeId]) {
      useCadStore.getState().saveSnapshot();
      useCadStore.setState({
        sketchNodes: { 
          ...state.sketchNodes, 
          [nodeId]: { ...state.sketchNodes[nodeId], x: u, y: v } 
        }
      });
    }
  },

  splitEdge: (edgeId: string, x: number, y: number): string[] => {
    useCadStore.getState().saveSnapshot();
    
    const state = useCadStore.getState();
    const edge = state.sketchEdges[edgeId];
    if (!edge || edge.type !== 'LINE') return [];

    const n1 = state.sketchNodes[edge.nodeIds[0]];
    const n2 = state.sketchNodes[edge.nodeIds[1]];
    if (!n1 || !n2) return [];

    // 1. Create split node
    const splitNodeId = uuidv4();
    const splitNode: SketchNode = { id: splitNodeId, x, y };

    // 2. Create two new edges
    const e1Id = uuidv4();
    const e2Id = uuidv4();
    const e1: SketchEdge = { ...edge, id: e1Id, nodeIds: [edge.nodeIds[0], splitNodeId] };
    const e2: SketchEdge = { ...edge, id: e2Id, nodeIds: [splitNodeId, edge.nodeIds[1]] };

    const nextNodes = { ...state.sketchNodes, [splitNodeId]: splitNode };
    const nextEdges = { ...state.sketchEdges };
    delete nextEdges[edgeId];
    nextEdges[e1Id] = e1;
    nextEdges[e2Id] = e2;

    useCadStore.setState({
      sketchNodes: nextNodes,
      sketchEdges: nextEdges
    });

    return [e1Id, e2Id];
  },

  selectChain: (startingEdgeId: string) => {
    const state = useCadStore.getState();
    const startEdge = state.sketchEdges[startingEdgeId];
    if (!startEdge) return;

    const chainEdgeIds = new Set<string>([startingEdgeId]);
    const queue = [...startEdge.nodeIds];
    const visitedNodes = new Set<string>();

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visitedNodes.has(nodeId)) continue;
      visitedNodes.add(nodeId);

      // Find all edges connected to this node
      Object.values(state.sketchEdges).forEach(edge => {
        if (edge.nodeIds.includes(nodeId) && !chainEdgeIds.has(edge.id)) {
          // In Select Chain, we usually stop at junctions (degree > 2)
          // But for a simple "Select Chain", we can just select all connected.
          // SolidWorks usually follows the path.
          chainEdgeIds.add(edge.id);
          edge.nodeIds.forEach(nid => {
            if (nid !== nodeId) queue.push(nid);
          });
        }
      });
    }

    useCadStore.setState({
      selection: {
        type: 'SKETCH',
        ids: Array.from(chainEdgeIds),
        nodes: [],
        edges: [],
        features: [],
        faces: []
      }
    });
  },
  
  commitBatch: (
    newNodes: Record<string, SketchNode>,
    newEdges: Record<string, SketchEdge>,
    newConstraints: Record<string, SketchConstraint>
  ) => {
    useCadStore.getState().saveSnapshot();
    
    useCadStore.setState({
      sketchNodes: newNodes,
      sketchEdges: newEdges,
      sketchConstraints: newConstraints
    });
  },

  addConstraintObj: (constraint: SketchConstraint) => {
    useCadStore.getState().saveSnapshot();
    
    const state = useCadStore.getState();
    useCadStore.setState({
      sketchConstraints: { ...state.sketchConstraints, [constraint.id]: constraint }
    });
  },
  
  updateConstraint: (id: string, updates: Partial<SketchConstraint>) => {
    useCadStore.getState().saveSnapshot();
    
    const state = useCadStore.getState();
    if (state.sketchConstraints[id]) {
      useCadStore.setState({
        sketchConstraints: {
          ...state.sketchConstraints,
          [id]: { ...state.sketchConstraints[id], ...updates }
        }
      });
    }
  },

  /**
   * Apply a 2D fillet between two sketch edges.
   * @param edgeId1 - First edge ID
   * @param edgeId2 - Second edge ID
   * @param radius - Fillet radius
   * @returns true if successful
   */
  applyFillet: (edgeId1: string, edgeId2: string, radius: number): boolean => {
    const state = useCadStore.getState();
    const e1 = state.sketchEdges[edgeId1];
    const e2 = state.sketchEdges[edgeId2];
    if (!e1 || !e2 || e1.nodeIds.length < 2 || e2.nodeIds.length < 2) return false;

    const n1a = state.sketchNodes[e1.nodeIds[0]];
    const n1b = state.sketchNodes[e1.nodeIds[1]];
    const n2a = state.sketchNodes[e2.nodeIds[0]];
    const n2b = state.sketchNodes[e2.nodeIds[1]];
    if (!n1a || !n1b || !n2a || !n2b) return false;

    // Dynamic import to avoid circular dependency
    const { computeFillet } = require('../utils/sketch-fillet-chamfer');
    const result = computeFillet(
      { id: e1.id, start: { x: n1a.x, y: n1a.y }, end: { x: n1b.x, y: n1b.y } },
      { id: e2.id, start: { x: n2a.x, y: n2a.y }, end: { x: n2b.x, y: n2b.y } },
      radius
    );
    if (!result) return false;

    useCadStore.getState().saveSnapshot();

    // Create arc center node
    const centerNodeId = `fillet_center_${Date.now()}`;
    const arcStartNodeId = `fillet_start_${Date.now()}`;
    const arcEndNodeId = `fillet_end_${Date.now()}`;

    const newNodes: Record<string, SketchNode> = {
      ...state.sketchNodes,
      [centerNodeId]: { id: centerNodeId, x: result.arc.center.x, y: result.arc.center.y, isFixed: true },
      [arcStartNodeId]: { id: arcStartNodeId, x: result.arc.start.x, y: result.arc.start.y },
      [arcEndNodeId]: { id: arcEndNodeId, x: result.arc.end.x, y: result.arc.end.y },
    };

    // Update existing edges (trimmed)
    const newEdges: Record<string, SketchEdge> = { ...state.sketchEdges };
    newEdges[edgeId1] = {
      ...e1,
      nodeIds: [e1.nodeIds[0], arcStartNodeId],
    };
    newEdges[edgeId2] = {
      ...e2,
      nodeIds: [e2.nodeIds[0], arcEndNodeId],
    };

    // Add fillet arc edge
    const arcId = `fillet_arc_${Date.now()}`;
    newEdges[arcId] = {
      id: arcId,
      type: 'ARC',
      nodeIds: [arcStartNodeId, arcEndNodeId],
      parameters: {
        center: result.arc.center,
        radius: result.arc.radius,
        startAngle: result.arc.startAngle,
        endAngle: result.arc.endAngle,
      },
    };

    useCadStore.setState({ sketchNodes: newNodes, sketchEdges: newEdges });
    return true;
  },

  /**
   * Apply a 2D chamfer between two sketch edges.
   * @param edgeId1 - First edge ID
   * @param edgeId2 - Second edge ID
   * @param distance - Chamfer distance from intersection
   * @returns true if successful
   */
  applyChamfer: (edgeId1: string, edgeId2: string, distance: number): boolean => {
    const state = useCadStore.getState();
    const e1 = state.sketchEdges[edgeId1];
    const e2 = state.sketchEdges[edgeId2];
    if (!e1 || !e2 || e1.nodeIds.length < 2 || e2.nodeIds.length < 2) return false;

    const n1a = state.sketchNodes[e1.nodeIds[0]];
    const n1b = state.sketchNodes[e1.nodeIds[1]];
    const n2a = state.sketchNodes[e2.nodeIds[0]];
    const n2b = state.sketchNodes[e2.nodeIds[1]];
    if (!n1a || !n1b || !n2a || !n2b) return false;

    const { computeChamfer } = require('../utils/sketch-fillet-chamfer');
    const result = computeChamfer(
      { id: e1.id, start: { x: n1a.x, y: n1a.y }, end: { x: n1b.x, y: n1b.y } },
      { id: e2.id, start: { x: n2a.x, y: n2a.y }, end: { x: n2b.x, y: n2b.y } },
      distance
    );
    if (!result) return false;

    useCadStore.getState().saveSnapshot();

    // Create chamfer endpoint nodes
    const cp1Id = `chamfer_p1_${Date.now()}`;
    const cp2Id = `chamfer_p2_${Date.now()}`;

    const newNodes: Record<string, SketchNode> = {
      ...state.sketchNodes,
      [cp1Id]: { id: cp1Id, x: result.line.start.x, y: result.line.start.y },
      [cp2Id]: { id: cp2Id, x: result.line.end.x, y: result.line.end.y },
    };

    // Update existing edges (trimmed)
    const newEdges: Record<string, SketchEdge> = { ...state.sketchEdges };
    newEdges[edgeId1] = {
      ...e1,
      nodeIds: [e1.nodeIds[0], cp1Id],
    };
    newEdges[edgeId2] = {
      ...e2,
      nodeIds: [e2.nodeIds[0], cp2Id],
    };

    // Add chamfer line edge
    const chamferId = `chamfer_line_${Date.now()}`;
    newEdges[chamferId] = {
      id: chamferId,
      type: 'LINE',
      nodeIds: [cp1Id, cp2Id],
    };

    useCadStore.setState({ sketchNodes: newNodes, sketchEdges: newEdges });
    return true;
  },
};
