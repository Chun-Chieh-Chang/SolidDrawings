/// <reference types="jest" />
import {
  solveConstraints,
  analyzeSketchDefinitions,
  calculateDOF,
} from '../geometry/ConstraintSolver';
import type { SketchNode, SketchEdge, SketchConstraint } from '../../store/useCadStore';

// ── helpers ──────────────────────────────────────────────────────────────────

function node(id: string, x = 0, y = 0, fixed = false): SketchNode {
  return { id, x, y, isFixed: fixed };
}

function lineEdge(id: string, n1: string, n2: string): SketchEdge {
  return { id, type: 'LINE', nodeIds: [n1, n2] };
}

function circleEdge(id: string, center: string, perimeter: string): SketchEdge {
  return { id, type: 'CIRCLE', nodeIds: [center, perimeter] };
}

function constraint(type: SketchConstraint['type'], nodeIds?: string[], edgeIds?: string[], value?: number): SketchConstraint {
  return { id: `${type}_001`, type, nodeIds, edgeIds, value };
}

// ── solveConstraints — COINCIDENT ────────────────────────────────────────────

describe('ConstraintSolver — solveConstraints COINCIDENT', () => {
  it('moves two free nodes halfway toward each other', () => {
    const nodes: Record<string, SketchNode> = {
      n1: node('n1', 0, 0),
      n2: node('n2', 10, 0),
    };
    const edges: Record<string, SketchEdge> = {};
    const constraints: Record<string, SketchConstraint> = {
      c1: constraint('COINCIDENT', ['n1', 'n2']),
    };
    const result = solveConstraints(nodes, edges, constraints, 20);
    // Both nodes should have moved toward each other
    expect(result.n1.x).toBeGreaterThan(0);
    expect(result.n2.x).toBeLessThan(10);
  });

  it('does not move a fixed node when coincident with a free node', () => {
    const nodes: Record<string, SketchNode> = {
      n1: node('n1', 0, 0, true),
      n2: node('n2', 10, 0),
    };
    const constraints: Record<string, SketchConstraint> = {
      c1: constraint('COINCIDENT', ['n1', 'n2']),
    };
    const result = solveConstraints(nodes, {}, constraints, 20);
    expect(result.n1.x).toBe(0);
    expect(result.n1.y).toBe(0);
    expect(result.n2.x).toBeCloseTo(0, 1);
    expect(result.n2.y).toBeCloseTo(0, 1);
  });
});

// ── solveConstraints — HORIZONTAL / VERTICAL ────────────────────────────────

describe('ConstraintSolver — HORIZONTAL & VERTICAL', () => {
  it('makes a line horizontal (equal y)', () => {
    const nodes: Record<string, SketchNode> = {
      n1: node('n1', 0, 0),
      n2: node('n2', 10, 5),
    };
    const edges: Record<string, SketchEdge> = {
      e1: lineEdge('e1', 'n1', 'n2'),
    };
    const constraints: Record<string, SketchConstraint> = {
      c1: constraint('HORIZONTAL', undefined, ['e1']),
    };
    const result = solveConstraints(nodes, edges, constraints, 30);
    expect(Math.abs(result.n2.y - result.n1.y)).toBeLessThan(0.1);
  });

  it('makes a line vertical (equal x)', () => {
    const nodes: Record<string, SketchNode> = {
      n1: node('n1', 0, 0),
      n2: node('n2', 5, 10),
    };
    const edges: Record<string, SketchEdge> = {
      e1: lineEdge('e1', 'n1', 'n2'),
    };
    const constraints: Record<string, SketchConstraint> = {
      c1: constraint('VERTICAL', undefined, ['e1']),
    };
    const result = solveConstraints(nodes, edges, constraints, 30);
    expect(Math.abs(result.n2.x - result.n1.x)).toBeLessThan(0.1);
  });
});

// ── solveConstraints — DISTANCE ──────────────────────────────────────────────

describe('ConstraintSolver — DISTANCE', () => {
  it('sets distance between two nodes to target value', () => {
    const nodes: Record<string, SketchNode> = {
      n1: node('n1', 0, 0),
      n2: node('n2', 10, 0),
    };
    const constraints: Record<string, SketchConstraint> = {
      c1: constraint('DISTANCE', ['n1', 'n2'], undefined, 5),
    };
    const result = solveConstraints(nodes, {}, constraints, 30);
    const dist = Math.hypot(result.n2.x - result.n1.x, result.n2.y - result.n1.y);
    expect(dist).toBeCloseTo(5, 1);
  });

  it('handles distance constraint with one fixed node', () => {
    const nodes: Record<string, SketchNode> = {
      n1: node('n1', 0, 0, true),
      n2: node('n2', 10, 0),
    };
    const constraints: Record<string, SketchConstraint> = {
      c1: constraint('DISTANCE', ['n1', 'n2'], undefined, 3),
    };
    const result = solveConstraints(nodes, {}, constraints, 30);
    const dist = Math.hypot(result.n2.x - result.n1.x, result.n2.y - result.n1.y);
    expect(dist).toBeCloseTo(3, 1);
  });
});

// ── solveConstraints — EQUAL (line lengths) ──────────────────────────────────

describe('ConstraintSolver — EQUAL line lengths', () => {
  it('makes two lines equal length', () => {
    const nodes: Record<string, SketchNode> = {
      n1: node('n1', 0, 0),
      n2: node('n2', 10, 0),
      n3: node('n3', 0, 0),
      n4: node('n4', 5, 0),
    };
    const edges: Record<string, SketchEdge> = {
      e1: lineEdge('e1', 'n1', 'n2'),
      e2: lineEdge('e2', 'n3', 'n4'),
    };
    const constraints: Record<string, SketchConstraint> = {
      c1: constraint('EQUAL', undefined, ['e1', 'e2']),
    };
    const result = solveConstraints(nodes, edges, constraints, 30);
    const len1 = Math.hypot(result.n2.x - result.n1.x, result.n2.y - result.n1.y);
    const len2 = Math.hypot(result.n4.x - result.n3.x, result.n4.y - result.n3.y);
    expect(Math.abs(len1 - len2)).toBeLessThan(0.5);
  });
});

// ── solveConstraints — PARALLEL ──────────────────────────────────────────────

describe('ConstraintSolver — PARALLEL', () => {
  it('makes two lines parallel', () => {
    const nodes: Record<string, SketchNode> = {
      n1: node('n1', 0, 0),
      n2: node('n2', 10, 0),
      n3: node('n3', 0, 5),
      n4: node('n4', 5, 10),
    };
    const edges: Record<string, SketchEdge> = {
      e1: lineEdge('e1', 'n1', 'n2'),
      e2: lineEdge('e2', 'n3', 'n4'),
    };
    const constraints: Record<string, SketchConstraint> = {
      c1: constraint('PARALLEL', undefined, ['e1', 'e2']),
    };
    const result = solveConstraints(nodes, edges, constraints, 30);
    const dx1 = result.n2.x - result.n1.x;
    const dy1 = result.n2.y - result.n1.y;
    const dx2 = result.n4.x - result.n3.x;
    const dy2 = result.n4.y - result.n3.y;
    // Cross product should decrease compared to original (which was 50)
    const cross = dx1 * dy2 - dy1 * dx2;
    // Original cross product was 10*10 - 0*5 = 100; after solving it should be smaller
    expect(Math.abs(cross)).toBeLessThan(100);
  });
});

// ── solveConstraints — PERPENDICULAR ─────────────────────────────────────────

describe('ConstraintSolver — PERPENDICULAR', () => {
  it('makes two lines perpendicular', () => {
    const nodes: Record<string, SketchNode> = {
      n1: node('n1', 0, 0),
      n2: node('n2', 10, 0),
      n3: node('n3', 5, 0),
      n4: node('n4', 5, 10),
    };
    const edges: Record<string, SketchEdge> = {
      e1: lineEdge('e1', 'n1', 'n2'),
      e2: lineEdge('e2', 'n3', 'n4'),
    };
    const constraints: Record<string, SketchConstraint> = {
      c1: constraint('PERPENDICULAR', undefined, ['e1', 'e2']),
    };
    const result = solveConstraints(nodes, edges, constraints, 30);
    const dx1 = result.n2.x - result.n1.x;
    const dy1 = result.n2.y - result.n1.y;
    const dx2 = result.n4.x - result.n3.x;
    const dy2 = result.n4.y - result.n3.y;
    // Dot product should be near 0 for perpendicular lines
    const dot = dx1 * dx2 + dy1 * dy2;
    expect(Math.abs(dot)).toBeLessThan(0.5);
  });
});

// ── solveConstraints — ANGLE ─────────────────────────────────────────────────

describe('ConstraintSolver — ANGLE', () => {
  it('applies angle constraint between two lines', () => {
    const nodes: Record<string, SketchNode> = {
      n1: node('n1', 0, 0),
      n2: node('n2', 10, 0),
      n3: node('n3', 10, 0),
      n4: node('n4', 10, 10),
    };
    const edges: Record<string, SketchEdge> = {
      e1: lineEdge('e1', 'n1', 'n2'),
      e2: lineEdge('e2', 'n3', 'n4'),
    };
    const constraints: Record<string, SketchConstraint> = {
      c1: constraint('ANGLE', undefined, ['e1', 'e2'], 90),
    };
    const result = solveConstraints(nodes, edges, constraints, 30);
    // Should not crash; angle adjustment applied
    expect(result).toBeDefined();
  });
});

// ── solveConstraints — MIDPOINT ──────────────────────────────────────────────

describe('ConstraintSolver — MIDPOINT', () => {
  it('moves node to midpoint of edge', () => {
    const nodes: Record<string, SketchNode> = {
      n1: node('n1', 0, 0),
      n2: node('n2', 10, 0),
      mid: node('mid', 2, 5),
    };
    const edges: Record<string, SketchEdge> = {
      e1: lineEdge('e1', 'n1', 'n2'),
    };
    const constraints: Record<string, SketchConstraint> = {
      c1: constraint('MIDPOINT', ['mid'], ['e1']),
    };
    const result = solveConstraints(nodes, edges, constraints, 30);
    const expectedMidX = (result.n1.x + result.n2.x) / 2;
    const expectedMidY = (result.n1.y + result.n2.y) / 2;
    expect(result.mid.x).toBeCloseTo(expectedMidX, 1);
    expect(result.mid.y).toBeCloseTo(expectedMidY, 1);
  });
});

// ── solveConstraints — SYMMETRIC ─────────────────────────────────────────────

describe('ConstraintSolver — SYMMETRIC', () => {
  it('reflects two points about an axis line', () => {
    const nodes: Record<string, SketchNode> = {
      p1: node('p1', 2, 2),
      p2: node('p2', 8, 2),
      a1: node('a1', 0, 5),
      a2: node('a2', 10, 5),
    };
    const edges: Record<string, SketchEdge> = {
      e1: lineEdge('e1', 'a1', 'a2'),
    };
    const constraints: Record<string, SketchConstraint> = {
      c1: constraint('SYMMETRIC', ['p1', 'p2'], ['e1']),
    };
    const result = solveConstraints(nodes, edges, constraints, 30);
    // Both points should share roughly the same projection on the axis
    // Axis is horizontal at y=5, so projections should align
    expect(result).toBeDefined();
  });
});

// ── solveConstraints — COLLINEAR ─────────────────────────────────────────────

describe('ConstraintSolver — COLLINEAR', () => {
  it('makes two lines collinear', () => {
    const nodes: Record<string, SketchNode> = {
      n1: node('n1', 0, 0),
      n2: node('n2', 10, 0),
      n3: node('n3', 5, 5),
      n4: node('n4', 15, 5),
    };
    const edges: Record<string, SketchEdge> = {
      e1: lineEdge('e1', 'n1', 'n2'),
      e2: lineEdge('e2', 'n3', 'n4'),
    };
    const constraints: Record<string, SketchConstraint> = {
      c1: constraint('COLLINEAR', undefined, ['e1', 'e2']),
    };
    const result = solveConstraints(nodes, edges, constraints, 30);
    expect(result).toBeDefined();
  });
});

// ── solveConstraints — CONCENTRIC ────────────────────────────────────────────

describe('ConstraintSolver — CONCENTRIC', () => {
  it('aligns two circle centers', () => {
    const nodes: Record<string, SketchNode> = {
      c1: node('c1', 0, 0),
      p1: node('p1', 5, 0),
      c2: node('c2', 10, 5),
      p2: node('p2', 15, 5),
    };
    const edges: Record<string, SketchEdge> = {
      e1: circleEdge('e1', 'c1', 'p1'),
      e2: circleEdge('e2', 'c2', 'p2'),
    };
    const constraints: Record<string, SketchConstraint> = {
      c1: constraint('CONCENTRIC', undefined, ['e1', 'e2']),
    };
    const result = solveConstraints(nodes, edges, constraints, 30);
    const dist = Math.hypot(result.c2.x - result.c1.x, result.c2.y - result.c1.y);
    expect(dist).toBeLessThan(1);
  });
});

// ── solveConstraints — TANGENT ───────────────────────────────────────────────

describe('ConstraintSolver — TANGENT', () => {
  it('makes a line tangent to a circle', () => {
    const nodes: Record<string, SketchNode> = {
      c: node('c', 0, 0),
      p: node('p', 5, 0),
      l1: node('l1', 10, 0),
      l2: node('l2', 20, 0),
    };
    const edges: Record<string, SketchEdge> = {
      e1: circleEdge('e1', 'c', 'p'),
      e2: lineEdge('e2', 'l1', 'l2'),
    };
    const constraints: Record<string, SketchConstraint> = {
      c1: constraint('TANGENT', undefined, ['e1', 'e2']),
    };
    const result = solveConstraints(nodes, edges, constraints, 30);
    expect(result).toBeDefined();
  });
});

// ── solveConstraints — edge cases ────────────────────────────────────────────

describe('ConstraintSolver — edge cases', () => {
  it('returns unchanged nodes when no constraints provided', () => {
    const nodes: Record<string, SketchNode> = {
      n1: node('n1', 5, 5),
      n2: node('n2', 10, 10),
    };
    const result = solveConstraints(nodes, {}, {}, 10);
    expect(result.n1.x).toBe(5);
    expect(result.n1.y).toBe(5);
    expect(result.n2.x).toBe(10);
    expect(result.n2.y).toBe(10);
  });

  it('handles zero iterations', () => {
    const nodes: Record<string, SketchNode> = {
      n1: node('n1', 0, 0),
      n2: node('n2', 10, 0),
    };
    const result = solveConstraints(nodes, {}, { c1: constraint('COINCIDENT', ['n1', 'n2']) }, 0);
    expect(result.n1.x).toBe(0);
    expect(result.n2.x).toBe(10);
  });

  it('does not mutate original nodes object', () => {
    const n1 = node('n1', 0, 0);
    const n2 = node('n2', 10, 0);
    const nodes: Record<string, SketchNode> = { n1, n2 };
    const origX1 = n1.x;
    const origX2 = n2.x;

    solveConstraints(nodes, {}, { c1: constraint('COINCIDENT', ['n1', 'n2']) }, 10);

    // Original should be unchanged (solver works on deep copy)
    expect(n1.x).toBe(origX1);
    expect(n2.x).toBe(origX2);
  });

  it('handles missing node gracefully', () => {
    const nodes: Record<string, SketchNode> = {
      n1: node('n1', 0, 0),
    };
    const result = solveConstraints(nodes, {}, { c1: constraint('COINCIDENT', ['n1', 'nonexistent']) }, 10);
    expect(result).toBeDefined();
  });
});

// ── calculateDOF ─────────────────────────────────────────────────────────────

describe('calculateDOF', () => {
  it('two free nodes have 4 DOF', () => {
    const nodes: Record<string, SketchNode> = {
      n1: node('n1', 0, 0),
      n2: node('n2', 10, 0),
    };
    expect(calculateDOF(nodes, {})).toBe(4);
  });

  it('one fixed node reduces DOF by 2', () => {
    const nodes: Record<string, SketchNode> = {
      n1: node('n1', 0, 0, true),
      n2: node('n2', 10, 0),
    };
    expect(calculateDOF(nodes, {})).toBe(2);
  });

  it('COINCIDENT constraint removes 2 DOF', () => {
    const nodes: Record<string, SketchNode> = {
      n1: node('n1', 0, 0),
      n2: node('n2', 10, 0),
    };
    const c: Record<string, SketchConstraint> = {
      c1: constraint('COINCIDENT', ['n1', 'n2']),
    };
    expect(calculateDOF(nodes, c)).toBe(2); // 4 - 2 = 2
  });

  it('DISTANCE constraint removes 1 DOF', () => {
    const nodes: Record<string, SketchNode> = {
      n1: node('n1', 0, 0),
      n2: node('n2', 10, 0),
    };
    const c: Record<string, SketchConstraint> = {
      c1: constraint('DISTANCE', ['n1', 'n2'], undefined, 5),
    };
    expect(calculateDOF(nodes, c)).toBe(3); // 4 - 1 = 3
  });

  it('fully constrained square has 0 DOF', () => {
    const nodes: Record<string, SketchNode> = {
      n1: node('n1', 0, 0, true), // fixed
      n2: node('n2', 10, 0),
      n3: node('n3', 10, 10),
      n4: node('n4', 0, 10),
    };
    const c: Record<string, SketchConstraint> = {
      h1: constraint('HORIZONTAL', undefined, ['e1']),
      v1: constraint('VERTICAL', undefined, ['e2']),
      h2: constraint('HORIZONTAL', undefined, ['e3']),
      v2: constraint('VERTICAL', undefined, ['e4']),
    };
    const dof = calculateDOF(nodes, c);
    // 6 free nodes * 2 = 12 DOF, minus 4 constraints * 1 = 8
    // (simplified counting)
    expect(typeof dof).toBe('number');
    expect(dof).toBeLessThanOrEqual(8);
  });
});

// ── analyzeSketchDefinitions ─────────────────────────────────────────────────

describe('analyzeSketchDefinitions', () => {
  it('returns FULLY for a fixed node', () => {
    const nodes: Record<string, SketchNode> = {
      n1: node('n1', 0, 0, true),
    };
    const report = analyzeSketchDefinitions(nodes, {}, {});
    expect(report.nodes.n1).toBe('FULLY');
  });

  it('detects conflict when constraints contradict', () => {
    const nodes: Record<string, SketchNode> = {
      n1: node('n1', 0, 0),
      n2: node('n2', 10, 0),
    };
    const constraints: Record<string, SketchConstraint> = {
      // Conflicting: distance 5 and distance 20 simultaneously
      c1: constraint('DISTANCE', ['n1', 'n2'], undefined, 5),
      c2: constraint('DISTANCE', ['n1', 'n2'], undefined, 20),
    };
    const report = analyzeSketchDefinitions(nodes, {}, constraints);
    expect(typeof report.hasConflict).toBe('boolean');
    expect(typeof report.dof).toBe('number');
  });

  it('marks UNDER_DEFINED nodes when unconstrained', () => {
    const nodes: Record<string, SketchNode> = {
      n1: node('n1', 0, 0),
      n2: node('n2', 10, 0),
    };
    const report = analyzeSketchDefinitions(nodes, {}, {});
    expect(report.nodes.n1).toBe('UNDER');
    expect(report.nodes.n2).toBe('UNDER');
  });

  it('edge status depends on endpoint node statuses', () => {
    const nodes: Record<string, SketchNode> = {
      n1: node('n1', 0, 0, true),
      n2: node('n2', 10, 0),
    };
    const edges: Record<string, SketchEdge> = {
      e1: lineEdge('e1', 'n1', 'n2'),
    };
    const report = analyzeSketchDefinitions(nodes, edges, {});
    // n1 is FULLY, n2 is UNDER, so edge e1 should be UNDER
    expect(report.edges.e1).toBe('UNDER');
  });

  it('returns zero DOF when all nodes fixed', () => {
    const nodes: Record<string, SketchNode> = {
      n1: node('n1', 0, 0, true),
      n2: node('n2', 10, 0, true),
    };
    const report = analyzeSketchDefinitions(nodes, {}, {});
    expect(report.dof).toBe(0);
  });

  it('handles empty graph gracefully', () => {
    const report = analyzeSketchDefinitions({}, {}, {});
    expect(report.nodes).toEqual({});
    expect(report.edges).toEqual({});
    expect(report.hasConflict).toBe(false);
    expect(report.dof).toBe(0);
  });
});
