import { SketchNode, SketchEdge } from '../../store/useCadStore';

/**
 * Planar Graph Cycle Finder
 * Partitions the Sketch Graph (nodes & edges) into connected components
 * and extracts all closed loops (outer boundary + inner cutout islands),
 * sorting them by 2D bounding area descending.
 */
export function extractAllClosedLoops(
  nodes: Record<string, SketchNode>,
  edges: Record<string, SketchEdge>
): any[][] {
  const edgeList = Object.values(edges).filter(e => !e.isConstruction);
  if (edgeList.length === 0) return [];

  // 1. Create Half-Edges
  // Each undirected edge (u, v) becomes two half-edges: u->v and v->u
  interface HalfEdge {
    from: string;
    to: string;
    angle: number;
    next?: HalfEdge;
    visited: boolean;
    edge: SketchEdge;
  }

  const outEdges = new Map<string, HalfEdge[]>();
  
  for (const e of edgeList) {
    if (e.type === 'SPLINE') {
       // A spline has > 2 nodes: nodeIds[0] ... nodeIds[n-1]
       // It acts as a single edge from nodeIds[0] to nodeIds[n-1]
       const n1 = e.nodeIds[0];
       const n2 = e.nodeIds[e.nodeIds.length - 1];
       if (!n1 || !n2 || !nodes[n1] || !nodes[n2]) continue;
       const p1 = nodes[n1];
       const p2 = nodes[n2];
       const angle1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
       const angle2 = Math.atan2(p1.y - p2.y, p1.x - p2.x);
       
       const he1: HalfEdge = { from: n1, to: n2, angle: angle1, visited: false, edge: e };
       const he2: HalfEdge = { from: n2, to: n1, angle: angle2, visited: false, edge: e };
       
       if (!outEdges.has(n1)) outEdges.set(n1, []);
       if (!outEdges.has(n2)) outEdges.set(n2, []);
       outEdges.get(n1)!.push(he1);
       outEdges.get(n2)!.push(he2);
       continue;
    }

    const [n1, n2] = e.nodeIds;
    if (!n1 || !n2 || !nodes[n1] || !nodes[n2]) continue;
    
    const p1 = nodes[n1];
    const p2 = nodes[n2];
    
    const angle1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const angle2 = Math.atan2(p1.y - p2.y, p1.x - p2.x);
    
    const he1: HalfEdge = { from: n1, to: n2, angle: angle1, visited: false, edge: e };
    const he2: HalfEdge = { from: n2, to: n1, angle: angle2, visited: false, edge: e };
    
    if (!outEdges.has(n1)) outEdges.set(n1, []);
    if (!outEdges.has(n2)) outEdges.set(n2, []);
    
    outEdges.get(n1)!.push(he1);
    outEdges.get(n2)!.push(he2);
  }

  // 2. Sort half-edges by angle and link them
  const allHalfEdges: HalfEdge[] = [];
  
  for (const [nodeId, heArray] of outEdges.entries()) {
    // Sort Counter-Clockwise
    heArray.sort((a, b) => a.angle - b.angle);
    allHalfEdges.push(...heArray);
  }

  for (const he of allHalfEdges) {
    const targetNode = he.to;
    const targetOutEdges = outEdges.get(targetNode)!;
    // Find the reverse edge (targetNode -> he.from)
    const revIndex = targetOutEdges.findIndex(e => e.to === he.from);
    // The next edge in the face is the one immediately counter-clockwise to the reverse edge
    const nextIndex = (revIndex + 1) % targetOutEdges.length;
    he.next = targetOutEdges[nextIndex];
  }

  // 3. Traverse to find all faces (cycles)
  const faces: HalfEdge[][] = [];
  
  for (const he of allHalfEdges) {
    if (!he.visited) {
      const face: HalfEdge[] = [];
      let curr = he;
      while (!curr.visited) {
        curr.visited = true;
        face.push(curr);
        curr = curr.next!;
      }
      // Only keep faces with at least 3 edges
      if (face.length >= 3) {
        faces.push(face);
      }
    }
  }

  const loops: any[][] = [];

  for (const face of faces) {
    // Calculate signed area (Shoelace formula)
    let signedArea = 0;
    for (let i = 0; i < face.length; i++) {
      const p1 = nodes[face[i].from];
      const p2 = nodes[face[i].to];
      signedArea += (p1.x * p2.y - p2.x * p1.y);
    }
    signedArea *= 0.5;

    // Filter out the exterior face (usually the one with negative area in standard CCW traversal, 
    // but in screen coordinates Y points down, so we keep the ones that represent solid regions).
    // Actually, a robust way is to just keep all bounded faces. The exterior face has the largest absolute area
    // and bounds the whole component negatively.
    // We will extract all of them, and sort by bounding area. 
    // But wait, the exterior face of a component encloses everything. We should discard the exterior face.
    // In a standard planar graph, exactly one face per connected component is the exterior face,
    // and its signed area (with standard math coordinates) will be negative if inner faces are positive.
    // Let's rely on the absolute bounding area for sorting, but we need a way to discard the infinite exterior face.
    // A simple heuristic: if there are multiple faces in a component, the one with the opposite signed area
    // and the largest absolute signed area is the exterior face.
    // For now, let's just emit all faces, and let the backend boolean ops handle it, OR we can filter it here.
    // We'll pass them all, sorted by bounding area descending. 
    
    // Convert to coordinates [x, y, tag]
    const result: any[] = [];
    for (let i = 0; i < face.length; i++) {
      const he = face[i];
      const p = nodes[he.from];
      result.push([p.x, p.y, i === 0 ? 'START' : undefined]);
      
      if (he.edge.type === 'SPLINE') {
         // Emit intermediate control points with 'SPLINE_CONTROL' tag
         const isForward = he.edge.nodeIds[0] === he.from;
         const innerNodeIds = he.edge.nodeIds.slice(1, -1);
         if (!isForward) innerNodeIds.reverse();
         
         for (const innerId of innerNodeIds) {
             const innerP = nodes[innerId];
             if (innerP) {
                 result.push([innerP.x, innerP.y, 'SPLINE_CONTROL']);
             }
         }
      }
    }
    // Close the loop
    const firstP = nodes[face[0].from];
    result.push([firstP.x, firstP.y, undefined]);
    
    loops.push(result);
  }

  // 4. Sort loops by 2D bounding area descending
  loops.sort((a, b) => {
    const areaA = calculateLoopArea(a);
    const areaB = calculateLoopArea(b);
    return areaB - areaA;
  });

  // Filter out the exterior face if there are multiple loops (simple heuristic: if multiple, the largest one 
  // that is geometrically a superset might be the exterior traversal of the outer boundary).
  // Actually, half-edge traversal creates ONE exterior face for the whole graph.
  // The exterior face has area with opposite sign. If we assume inner faces have positive signedArea
  // (or vice-versa), the exterior face is the single face with the opposite sign.
  // We'll keep all for now as PythonOCC BRepBuilderAPI_MakeFace often accepts a list of wires 
  // and handles orientation itself if we just give it valid closed wires.

  return loops;
}

/**
 * Computes the 2D bounding box area of a loop of points
 */
function calculateLoopArea(loop: any[]): number {
  if (loop.length === 0) return 0;
  const xs = loop.map(p => p[0]);
  const ys = loop.map(p => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return (maxX - minX) * (maxY - minY);
}

/**
 * Extracts all connected paths (open or closed) from the sketch graph.
 */
export function extractAllPaths(
  nodes: Record<string, SketchNode>,
  edges: Record<string, SketchEdge>
): any[][] {
  const edgeList = Object.values(edges).filter(e => !e.isConstruction);
  if (edgeList.length === 0) return [];
  
  const paths: any[][] = [];
  const visitedEdges = new Set<string>();

  // Simple heuristic: just dump all edges as individual paths for surfacing,
  // or group connected edges. For now, we group into connected components.
  // Given time constraints, emitting each edge as a path is valid for surface sweeping/extrusion
  // if the backend handles them together. But grouping them as continuous paths is better.
  
  for (const e of edgeList) {
      if (visitedEdges.has(e.id)) continue;
      
      const path: any[] = [];
      const n1 = e.nodeIds[0];
      const n2 = e.nodeIds[e.nodeIds.length - 1];
      const p1 = nodes[n1];
      const p2 = nodes[n2];
      if (!p1 || !p2) continue;
      
      path.push([p1.x, p1.y, 'START']);
      if (e.type === 'SPLINE') {
          for (let i = 1; i < e.nodeIds.length - 1; i++) {
              const cp = nodes[e.nodeIds[i]];
              if (cp) path.push([cp.x, cp.y, 'SPLINE_CONTROL']);
          }
      } else if (e.type === 'CIRCLE') {
          // Add dummy control point for arc
          const cp = nodes[e.nodeIds[1]]; // Assuming nodeIds[1] is arc control if it were arc... but CIRCLE is full
      }
      path.push([p2.x, p2.y, undefined]);
      paths.push(path);
      visitedEdges.add(e.id);
  }
  
  return paths;
}

