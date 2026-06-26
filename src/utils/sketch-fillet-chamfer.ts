/**
 * 2D Sketch Fillet & Chamfer geometry computation.
 *
 * Given two intersecting line edges in the sketch plane (XY),
 * compute the fillet arc (circular arc of radius r) or chamfer
 * (straight line at angle × distance) that connects them.
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface SketchEdgeData {
  id: string;
  start: Point2D;
  end: Point2D;
}

export interface FilletResult {
  /** The arc connecting the two trimmed edges */
  arc: { center: Point2D; startAngle: number; endAngle: number; radius: number; start: Point2D; end: Point2D };
  /** Trimmed versions of the input edges */
  edge1: { id: string; start: Point2D; end: Point2D };
  edge2: { id: string; start: Point2D; end: Point2D };
}

export interface ChamferResult {
  /** The chamfer line connecting the two trimmed edges */
  line: { start: Point2D; end: Point2D };
  /** Trimmed versions of the input edges */
  edge1: { id: string; start: Point2D; end: Point2D };
  edge2: { id: string; start: Point2D; end: Point2D };
}

// ─── Vector helpers ──────────────────────────────────────────────────────────

function sub(a: Point2D, b: Point2D): Point2D {
  return { x: a.x - b.x, y: a.y - b.y };
}

function add(a: Point2D, b: Point2D): Point2D {
  return { x: a.x + b.x, y: a.y + b.y };
}

function scale(v: Point2D, s: number): Point2D {
  return { x: v.x * s, y: v.y * s };
}

function dot(a: Point2D, b: Point2D): number {
  return a.x * b.x + a.y * b.y;
}

function cross2(a: Point2D, b: Point2D): number {
  return a.x * b.y - a.y * b.x;
}

function length(v: Point2D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

function normalize(v: Point2D): Point2D {
  const len = length(v);
  return len === 0 ? { x: 0, y: 0 } : { x: v.x / len, y: v.y / len };
}

function distance(a: Point2D, b: Point2D): number {
  return length(sub(a, b));
}

// ─── Line intersection ───────────────────────────────────────────────────────

/**
 * Find intersection point of two line segments (infinite lines).
 * Returns null if lines are parallel.
 */
function lineIntersection(p1: Point2D, p2: Point2D, p3: Point2D, p4: Point2D): Point2D | null {
  const d1 = sub(p2, p1);
  const d2 = sub(p4, p3);
  const denom = cross2(d1, d2);
  if (Math.abs(denom) < 1e-10) return null; // parallel

  const t = cross2(sub(p3, p1), d2) / denom;
  return { x: p1.x + t * d1.x, y: p1.y + t * d1.y };
}

// ─── Fillet computation ──────────────────────────────────────────────────────

/**
 * Compute a 2D fillet (arc) between two line segments.
 *
 * @param e1 - First edge (must share endpoint with e2 or intersect)
 * @param e2 - Second edge
 * @param radius - Fillet radius
 * @returns FilletResult or null if computation fails
 */
export function computeFillet(e1: SketchEdgeData, e2: SketchEdgeData, radius: number): FilletResult | null {
  // Find intersection point of the two lines
  const ip = lineIntersection(e1.start, e1.end, e2.start, e2.end);
  if (!ip) return null;

  // Direction vectors from intersection to edge endpoints (away from intersection)
  const d1 = normalize(sub(e1.start, ip));
  const d2 = normalize(sub(e1.end, ip));
  // Pick the direction that points along the edge (not back toward intersection)
  const dir1 = length(sub(e1.start, ip)) > length(sub(e1.end, ip)) ? d1 : d2;

  const d3 = normalize(sub(e2.start, ip));
  const d4 = normalize(sub(e2.end, ip));
  const dir2 = length(sub(e2.start, ip)) > length(sub(e2.end, ip)) ? d3 : d4;

  // Angle between the two edge directions
  const angle = Math.acos(Math.max(-1, Math.min(1, dot(dir1, dir2))));
  const halfAngle = angle / 2;

  // Distance from intersection to fillet center along the bisector
  const centerDist = radius / Math.sin(halfAngle);

  // Bisector direction (average of the two edge direction normals)
  const bisector = normalize(add(dir1, dir2));
  const bisectorLen = length(bisector);
  if (bisectorLen < 1e-10) return null;

  // Fillet center
  const center = add(ip, scale(bisector, centerDist));

  // Tangent points (where arc meets the edges)
  const tanDist = radius / Math.tan(halfAngle);
  const tan1 = add(ip, scale(dir1, tanDist));
  const tan2 = add(ip, scale(dir2, tanDist));

  // Calculate start and end angles for the arc
  const startAngle = Math.atan2(tan1.y - center.y, tan1.x - center.x);
  const endAngle = Math.atan2(tan2.y - center.y, tan2.x - center.x);

  // Determine which edge endpoint gets replaced by the tangent point
  const distToStart1 = distance(e1.start, ip);
  const distToEnd1 = distance(e1.end, ip);

  const trimmed1 = distToStart1 > distToEnd1
    ? { id: e1.id, start: e1.start, end: tan1 }
    : { id: e1.id, start: tan1, end: e1.end };

  const distToStart2 = distance(e2.start, ip);
  const distToEnd2 = distance(e2.end, ip);

  const trimmed2 = distToStart2 > distToEnd2
    ? { id: e2.id, start: e2.start, end: tan2 }
    : { id: e2.id, start: tan2, end: e2.end };

  return {
    arc: { center, startAngle, endAngle, radius, start: tan1, end: tan2 },
    edge1: trimmed1,
    edge2: trimmed2,
  };
}

// ─── Chamfer computation ─────────────────────────────────────────────────────

/**
 * Compute a 2D chamfer (angled line) between two line segments.
 *
 * @param e1 - First edge
 * @param e2 - Second edge
 * @param distance - Chamfer distance from intersection along both edges
 * @returns ChamferResult or null if computation fails
 */
export function computeChamfer(e1: SketchEdgeData, e2: SketchEdgeData, chamferDist: number): ChamferResult | null {
  const ip = lineIntersection(e1.start, e1.end, e2.start, e2.end);
  if (!ip) return null;

  // Direction vectors from intersection outward along each edge
  const toStart1 = normalize(sub(e1.start, ip));
  const toEnd1 = normalize(sub(e1.end, ip));
  const dir1 = length(sub(e1.start, ip)) > length(sub(e1.end, ip)) ? toStart1 : toEnd1;

  const toStart2 = normalize(sub(e2.start, ip));
  const toEnd2 = normalize(sub(e2.end, ip));
  const dir2 = length(sub(e2.start, ip)) > length(sub(e2.end, ip)) ? toStart2 : toEnd2;

  // Chamfer points along each edge at the given distance from intersection
  const cp1 = add(ip, scale(dir1, chamferDist));
  const cp2 = add(ip, scale(dir2, chamferDist));

  // Determine which edge endpoint gets replaced
  const distToStart1 = distance(e1.start, ip);
  const distToEnd1 = distance(e1.end, ip);

  const trimmed1 = distToStart1 > distToEnd1
    ? { id: e1.id, start: e1.start, end: cp1 }
    : { id: e1.id, start: cp1, end: e1.end };

  const distToStart2 = distance(e2.start, ip);
  const distToEnd2 = distance(e2.end, ip);

  const trimmed2 = distToStart2 > distToEnd2
    ? { id: e2.id, start: e2.start, end: cp2 }
    : { id: e2.id, start: cp2, end: e2.end };

  return {
    line: { start: cp1, end: cp2 },
    edge1: trimmed1,
    edge2: trimmed2,
  };
}
