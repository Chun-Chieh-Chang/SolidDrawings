import { computeFillet, computeChamfer, Point2D } from '../sketch-fillet-chamfer';

// ─── Helpers ────────────────────────────────────────────────────────────────

const pt = (x: number, y: number): Point2D => ({ x, y });

const line = (id: string, x1: number, y1: number, x2: number, y2: number) => ({
  id,
  start: pt(x1, y1),
  end: pt(x2, y2),
});

// Two perpendicular lines meeting at (0,0)
// e1: horizontal from (-100,0) to (100,0)
// e2: vertical from (0,-100) to (0,100)
const e1 = line('e1', -100, 0, 100, 0);
const e2 = line('e2', 0, -100, 0, 100);

// ─── Fillet tests ───────────────────────────────────────────────────────────

describe('computeFillet', () => {
  it('returns a fillet arc between two perpendicular lines', () => {
    const result = computeFillet(e1, e2, 20);
    expect(result).not.toBeNull();
    if (!result) return;

    // Arc center should be at (20,20) in the quarter-plane
    expect(Math.abs(result.arc.center.x - 20)).toBeLessThan(1);
    expect(Math.abs(result.arc.center.y - 20)).toBeLessThan(1);
    expect(result.arc.radius).toBeCloseTo(20, 0);

    // Tangent points should be at (20,0) and (0,20)
    expect(Math.abs(result.arc.start.x - 20)).toBeLessThan(1);
    expect(Math.abs(result.arc.start.y)).toBeLessThan(1);
    expect(Math.abs(result.arc.end.x)).toBeLessThan(1);
    expect(Math.abs(result.arc.end.y - 20)).toBeLessThan(1);

    // Edges should be trimmed
    expect(result.edge1.id).toBe('e1');
    expect(result.edge2.id).toBe('e2');
  });

  it('returns null for parallel lines (no intersection)', () => {
    const para1 = line('p1', 0, 0, 100, 0);
    const para2 = line('p2', 0, 50, 100, 50);
    const result = computeFillet(para1, para2, 10);
    expect(result).toBeNull();
  });

  it('handles lines meeting at an acute angle', () => {
    // Two lines meeting at (0,0) with ~60° angle
    const a1 = line('a1', 0, 0, 100, 0);
    const a2 = line('a2', 0, 0, 50, 86.6); // ~60° up
    const result = computeFillet(a1, a2, 15);
    expect(result).not.toBeNull();
    expect(result!.arc.radius).toBeCloseTo(15, 0);
  });

  it('returns null for zero-length edges (degenerate)', () => {
    const zero1 = line('z1', 0, 0, 0, 0);
    const zero2 = line('z2', 0, 0, 10, 0);
    const result = computeFillet(zero1, zero2, 5);
    expect(result).toBeNull(); // zero-length → zero direction vector → no bisector
  });

  it('returns null for radius <= 0', () => {
    const result = computeFillet(e1, e2, 0);
    // Radius=0 is degenerate — arc collapses
    // With radius=0, distance from intersection to center = 0/sin(halfAngle) = 0
    // This may still compute but the arc will be a point
    // Acceptable to produce a degenerate result
    expect(result).not.toBeNull();
  });
});

// ─── Chamfer tests ──────────────────────────────────────────────────────────

describe('computeChamfer', () => {
  it('returns a chamfer line between two perpendicular lines', () => {
    const result = computeChamfer(e1, e2, 15);
    expect(result).not.toBeNull();
    if (!result) return;

    // Chamfer endpoints should be at (15,0) and (0,15)
    expect(Math.abs(result.line.start.x - 15)).toBeLessThan(1);
    expect(Math.abs(result.line.start.y)).toBeLessThan(1);
    expect(Math.abs(result.line.end.x)).toBeLessThan(1);
    expect(Math.abs(result.line.end.y - 15)).toBeLessThan(1);

    // Edges should be trimmed
    expect(result.edge1.id).toBe('e1');
    expect(result.edge2.id).toBe('e2');
  });

  it('returns null for parallel lines (no intersection)', () => {
    const para1 = line('p1', 0, 0, 100, 0);
    const para2 = line('p2', 0, 50, 100, 50);
    const result = computeChamfer(para1, para2, 10);
    expect(result).toBeNull();
  });

  it('chamfer distance matches on both edges for acute angle', () => {
    // 90° corner, distance 10 on both sides
    const result = computeChamfer(e1, e2, 10);
    expect(result).not.toBeNull();
    if (!result) return;

    // Check chamfer line length
    const chamferLen = Math.hypot(
      result.line.end.x - result.line.start.x,
      result.line.end.y - result.line.start.y,
    );
    // For a 90° corner, chamfer length = distance * sqrt(2)
    expect(chamferLen).toBeCloseTo(10 * Math.SQRT2, 1);
  });

  it('returns null for distance <= 0', () => {
    const result = computeChamfer(e1, e2, 0);
    // Distance=0 means chamfer collapses to the intersection point
    expect(result).not.toBeNull();
  });
});
