export interface Point2D {
  x: number;
  y: number;
}

/**
 * Finds the intersection point between two finite line segments.
 */
export function intersectSegments(
  p1: Point2D, p2: Point2D, 
  p3: Point2D, p4: Point2D
): Point2D | null {
  const den = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  if (den === 0) return null;

  const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / den;
  const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / den;

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      x: p1.x + ua * (p2.x - p1.x),
      y: p1.y + ua * (p2.y - p1.y)
    };
  }

  return null;
}

/**
 * Finds the intersection point between two infinite lines.
 */
export function intersectLines(
  p1: Point2D, p2: Point2D,
  p3: Point2D, p4: Point2D
): Point2D | null {
  const x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y;
  const x3 = p3.x, y3 = p3.y, x4 = p4.x, y4 = p4.y;
  
  const den = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (den === 0) return null;

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / den;
  return {
    x: x1 + ua * (x2 - x1),
    y: y1 + ua * (y2 - y1)
  };
}

/**
 * Finds intersections between a line segment and a circle.
 */
export function intersectSegmentCircle(
  p1: Point2D, p2: Point2D,
  center: Point2D, radius: number
): Point2D[] {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const fx = p1.x - center.x;
  const fy = p1.y - center.y;

  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = (fx * fx + fy * fy) - radius * radius;

  let discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return [];

  discriminant = Math.sqrt(discriminant);
  const t1 = (-b - discriminant) / (2 * a);
  const t2 = (-b + discriminant) / (2 * a);

  const results: Point2D[] = [];
  if (t1 >= 0 && t1 <= 1) {
    results.push({ x: p1.x + t1 * dx, y: p1.y + t1 * dy });
  }
  if (t2 >= 0 && t2 <= 1) {
    results.push({ x: p1.x + t2 * dx, y: p1.y + t2 * dy });
  }

  return results;
}

/**
 * Finds intersections between two circles.
 */
export function intersectCircles(
  c1: Point2D, r1: number,
  c2: Point2D, r2: number
): Point2D[] {
  const d2 = (c2.x - c1.x) ** 2 + (c2.y - c1.y) ** 2;
  const d = Math.sqrt(d2);

  if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) return [];

  const a = (r1 * r1 - r2 * r2 + d2) / (2 * d);
  const h = Math.sqrt(r1 * r1 - a * a);
  
  const x2 = c1.x + a * (c2.x - c1.x) / d;
  const y2 = c1.y + a * (c2.y - c1.y) / d;

  const rx = -(c2.y - c1.y) * (h / d);
  const ry = (c2.x - c1.x) * (h / d);

  return [
    { x: x2 + rx, y: y2 + ry },
    { x: x2 - rx, y: y2 - ry }
  ];
}
