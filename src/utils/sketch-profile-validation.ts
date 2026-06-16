import type { SketchConstraint, SketchEdge, SketchNode } from '@/store/useCadStore';
import { extractAllClosedLoops } from '@/utils/geometry/CycleFinder';
import { analyzeSketchDefinitions } from '@/utils/geometry/ConstraintSolver';

export type SketchProfileIssueCode =
  | 'NO_GEOMETRY'
  | 'OPEN_PROFILE'
  | 'NO_CLOSED_LOOP'
  | 'LOOP_TOO_SMALL'
  | 'SKETCH_CONFLICT';

export interface SketchProfileValidation {
  ok: boolean;
  code?: SketchProfileIssueCode;
  /** User-facing message (traditional Chinese) */
  message: string;
  loops: any[][];
  /** Optional secondary hint for status bar */
  hint?: string;
}

function hasOpenChainInSketch(
  nodes: Record<string, SketchNode>,
  edges: Record<string, SketchEdge>,
): boolean {
  const solidEdges = Object.values(edges).filter((e) => !e.isConstruction);
  if (solidEdges.length === 0) return false;

  const degree = new Map<string, number>();
  for (const e of solidEdges) {
    const [a, b] = e.nodeIds;
    if (!a || !b) continue;
    degree.set(a, (degree.get(a) ?? 0) + 1);
    degree.set(b, (degree.get(b) ?? 0) + 1);
  }

  for (const count of degree.values()) {
    if (count === 1) return true;
  }

  const nodeIds = new Set<string>();
  for (const e of solidEdges) {
    e.nodeIds.forEach((id) => nodeIds.add(id));
  }
  if (nodeIds.size >= 3 && solidEdges.length < nodeIds.size) {
    return true;
  }

  return false;
}

/**
 * Pre-extrude / pre-revolve profile check (M1-T2).
 * Returns closed loops when ok; otherwise a readable blocking reason.
 */
export function validateSketchProfile(
  nodes: Record<string, SketchNode>,
  edges: Record<string, SketchEdge>,
  constraints: Record<string, SketchConstraint>,
): SketchProfileValidation {
  const solidEdges = Object.values(edges).filter((e) => !e.isConstruction);
  const nodeCount = Object.keys(nodes).length;

  if (nodeCount === 0 || solidEdges.length === 0) {
    return {
      ok: false,
      code: 'NO_GEOMETRY',
      message: 'Sketch has no extrudable geometry. Draw lines, rectangles, or circles to form a closed profile.',
      loops: [],
      hint: 'Sketch: no geometry',
    };
  }

  const definition = analyzeSketchDefinitions(nodes, edges, constraints);
  if (definition.hasConflict) {
    return {
      ok: false,
      code: 'SKETCH_CONFLICT',
      message:
        'Sketch is overdefined or has conflicting constraints. Delete extra dimensions or relations, or fix red-highlighted geometry before extruding.',
      loops: [],
      hint: 'Sketch: overdefined',
    };
  }

  const loops = extractAllClosedLoops(nodes, edges);

  if (loops.length === 0) {
    if (hasOpenChainInSketch(nodes, edges)) {
      return {
        ok: false,
        code: 'OPEN_PROFILE',
        message:
          'ProfProfile not closed。ConnectConnect the last point to the first，oruse a Coincident constraint tostraintConconnect endpoints before extruding。',
        loops: [],
        hint: 'Sketch: open profile',
      };
    }
    return {
      ok: false,
      code: 'NO_CLOSED_LOOP',
      message:
        'No closed loop found. Confirm all segments are connected end-to-end with no stray or open chains.',
      loops: [],
      hint: 'Sketch: no closed loop',
    };
  }

  const outer = loops[0];
  const uniqueVerts =
    outer.length > 1 &&
    outer[0][0] === outer[outer.length - 1][0] &&
    outer[0][1] === outer[outer.length - 1][1]
      ? outer.length - 1
      : outer.length;

  if (uniqueVerts < 3) {
    return {
      ok: false,
      code: 'LOOP_TOO_SMALL',
      message: 'Closed loop has insufficient points (minimum 3 vertices). Complete the sketch before extruding.',
      loops,
      hint: 'Sketch: loop too small',
    };
  }

  const underDefined = Object.keys(nodes).some(
    (id) => definition.nodes[id] === 'UNDER',
  );

  return {
    ok: true,
    loops,
    message: underDefined
      ? 'Sketch is underdefined but closed loop found. Can proceed with extrude (recommended: add dimensions).'
      : 'Closed loop is valid.',
    hint: underDefined ? 'Sketch: underdefined' : undefined,
  };
}
