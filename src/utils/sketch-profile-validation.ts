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
  /** User-facing message (繁體中文) */
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
      message: '草圖尚無可拉伸的幾何。請先繪製線段、矩形或圓，並形成封閉輪廓。',
      loops: [],
      hint: '草圖：無幾何',
    };
  }

  const definition = analyzeSketchDefinitions(nodes, edges, constraints);
  if (definition.hasConflict) {
    return {
      ok: false,
      code: 'SKETCH_CONFLICT',
      message:
        '草圖過度定義或約束衝突。請刪除多餘的尺寸／幾何關係，或修正標示為紅色的實體後再拉伸。',
      loops: [],
      hint: '草圖：過度定義',
    };
  }

  const loops = extractAllClosedLoops(nodes, edges);

  if (loops.length === 0) {
    if (hasOpenChainInSketch(nodes, edges)) {
      return {
        ok: false,
        code: 'OPEN_PROFILE',
        message:
          '輪廓未封閉。請將最後一點與起點重合，或使用「重合」約束連接端點，再執行拉伸。',
        loops: [],
        hint: '草圖：開放輪廓',
      };
    }
    return {
      ok: false,
      code: 'NO_CLOSED_LOOP',
      message:
        '找不到封閉輪廓。請確認所有線段首尾相連，且未遺留獨立線段或開放鏈。',
      loops: [],
      hint: '草圖：無封閉輪廓',
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
      message: '封閉輪廓點數不足（至少需要 3 個頂點）。請補齊草圖後再拉伸。',
      loops,
      hint: '草圖：輪廓過小',
    };
  }

  const underDefined = Object.keys(nodes).some(
    (id) => definition.nodes[id] === 'UNDER',
  );

  return {
    ok: true,
    loops,
    message: underDefined
      ? '草圖欠定義，但已找到封閉輪廓；可繼續拉伸（建議補齊尺寸）。'
      : '封閉輪廓有效。',
    hint: underDefined ? '草圖：欠定義' : undefined,
  };
}
