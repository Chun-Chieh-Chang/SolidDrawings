import type { MateType, CADMate } from '../store/types';
import type { SelectedTopology, FaceSignature, EdgeSignature } from '../kernel/TopologySelector';

const EPS = 1e-4;

/** Dot product of two 3-tuples */
function dot(a: [number, number, number], b: [number, number, number]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function vecLen(v: [number, number, number]): number {
  return Math.sqrt(dot(v, v));
}

function normalize(v: [number, number, number]): [number, number, number] {
  const len = vecLen(v);
  if (len < EPS) return [0, 0, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}

function isFace(sig: FaceSignature | EdgeSignature | undefined): sig is FaceSignature {
  return sig !== undefined && 'surface_type' in sig;
}

function isEdge(sig: FaceSignature | EdgeSignature | undefined): sig is EdgeSignature {
  return sig !== undefined && 'length' in sig && !('surface_type' in sig);
}

function getFaceSignature(sig: FaceSignature | EdgeSignature | undefined): FaceSignature | null {
  return isFace(sig) ? sig : null;
}

function faceCurvature(sig: FaceSignature | EdgeSignature | undefined): 'PLANE' | 'CYLINDRICAL' | 'SPHERICAL' | 'CONICAL' | 'UNKNOWN' {
  const f = getFaceSignature(sig);
  if (!f) return 'UNKNOWN';
  if (f.surface_type === 'PLANE' || (f.curvature === 'ZERO' && f.surface_type !== 'CYLINDER')) return 'PLANE';
  if (f.surface_type === 'CYLINDER' || f.curvature === 'CONSTANT') return 'CYLINDRICAL';
  if (f.surface_type === 'CONE' || f.curvature === 'CONE') return 'CONICAL';
  if (f.curvature === 'SPHERE') return 'SPHERICAL';
  return 'UNKNOWN';
}

function topoTypeLabel(t: SelectedTopology): string {
  if (t.type === 'VERTEX') return 'POINT';
  if (t.type === 'EDGE') return 'EDGE';
  if (t.type === 'FACE') {
    const curv = faceCurvature(t.signature);
    if (curv === 'PLANE') return 'PLANE';
    if (curv === 'CYLINDRICAL') return 'CYLINDRICAL_FACE';
    if (curv === 'CONICAL') return 'CONICAL';
    return 'FACE';
  }
  return 'UNKNOWN';
}

export interface MateInference {
  mateType: MateType;
  alignment: 'ALIGNED' | 'ANTI_ALIGNED';
  confidence: number; // 0.0 - 1.0
  label: string;
}

/**
 * Thread-safe rule-based Smart Mate inference.
 * Returns the best mate type + alignment given two selected topologies.
 */
export function inferSmartMate(
  source: SelectedTopology,
  target: SelectedTopology,
): MateInference | null {
  // Cannot mate a component to itself
  if (source.componentId && target.componentId && source.componentId === target.componentId) {
    return null;
  }

  const sLabel = topoTypeLabel(source);
  const tLabel = topoTypeLabel(target);
  const sNorm = source.normal ? normalize(source.normal) : null;
  const tNorm = target.normal ? normalize(target.normal) : null;

  // ── FACE + FACE ─────────────────────────────────────────
  if (sLabel === 'PLANE' && tLabel === 'PLANE' && sNorm && tNorm) {
    const nd = dot(sNorm, tNorm);
    if (Math.abs(nd - 1) < 0.01) {
      return { mateType: 'COINCIDENT', alignment: 'ALIGNED', confidence: 0.95, label: 'Coincident (aligned faces)' };
    }
    if (Math.abs(nd + 1) < 0.01) {
      return { mateType: 'COINCIDENT', alignment: 'ANTI_ALIGNED', confidence: 0.95, label: 'Coincident (opposed faces)' };
    }
    if (Math.abs(nd) < 0.01) {
      return { mateType: 'PARALLEL', alignment: 'ALIGNED', confidence: 0.7, label: 'Parallel faces' };
    }
    return { mateType: 'ANGLE', alignment: 'ALIGNED', confidence: 0.6, label: 'Angle between faces' };
  }

  // ── PLANE + PLANE (non-face topology planes, e.g. reference planes) ──
  // (handled above since both are FACE type with PLANE curvature)

  // ── CYLINDRICAL + CYLINDRICAL → Concentric ──────────────
  if (sLabel === 'CYLINDRICAL_FACE' && tLabel === 'CYLINDRICAL_FACE') {
    const sSig = getFaceSignature(source.signature);
    const tSig = getFaceSignature(target.signature);
    const rDiff = sSig && tSig && sSig.radius !== undefined && tSig.radius !== undefined
      ? Math.abs(sSig.radius - tSig.radius) : 0;
    // Same or near-same radius → CONCENTRIC, otherwise → COINCIDENT
    if (rDiff < EPS) {
      return { mateType: 'CONCENTRIC', alignment: 'ALIGNED', confidence: 0.95, label: 'Concentric (cylindrical)' };
    }
    return { mateType: 'CONCENTRIC', alignment: 'ALIGNED', confidence: 0.6, label: `Concentric (radius diff ${rDiff.toFixed(2)})` };
  }

  // ── CYLINDRICAL + PLANE → TANGENT ───────────────────────
  if ((sLabel === 'CYLINDRICAL_FACE' && tLabel === 'PLANE') ||
      (sLabel === 'PLANE' && tLabel === 'CYLINDRICAL_FACE')) {
    // Check if cylindrical axis is parallel to plane normal → tangent
    const cylLabel = sLabel === 'CYLINDRICAL_FACE' ? sLabel : tLabel;
    const planeLabel = sLabel === 'PLANE' ? sLabel : tLabel;
    const cylTopo = sLabel === 'CYLINDRICAL_FACE' ? source : target;
    const planeTopo = sLabel === 'PLANE' ? source : target;
    const cylSig = getFaceSignature(cylTopo.signature);
    const pNorm = planeTopo.normal ? normalize(planeTopo.normal) : null;
    const cylAxis = cylSig?.axis_direction ? normalize(cylSig.axis_direction) : null;

    if (cylAxis && pNorm) {
      const axDot = Math.abs(dot(cylAxis, pNorm));
      if (axDot < 0.1) {
        // Cylinder axis is perpendicular to plane normal → tangent ball/cylinder to plane
        return { mateType: 'TANGENT', alignment: 'ALIGNED', confidence: 0.85, label: 'Tangent (cyl to plane)' };
      }
    }
    return { mateType: 'TANGENT', alignment: 'ALIGNED', confidence: 0.7, label: 'Tangent' };
  }

  // ── EDGE + EDGE → Coincident ────────────────────────────
  if (sLabel === 'EDGE' && tLabel === 'EDGE') {
    return { mateType: 'COINCIDENT', alignment: 'ALIGNED', confidence: 0.8, label: 'Coincident (edge to edge)' };
  }

  // ── EDGE + FACE → Coincident ────────────────────────────
  if ((sLabel === 'EDGE' && (tLabel === 'PLANE' || tLabel === 'FACE')) ||
      ((sLabel === 'PLANE' || sLabel === 'FACE') && tLabel === 'EDGE')) {
    return { mateType: 'COINCIDENT', alignment: 'ALIGNED', confidence: 0.75, label: 'Coincident (edge on face)' };
  }

  // ── EDGE + VERTEX → Coincident ──────────────────────────
  if ((sLabel === 'EDGE' && tLabel === 'POINT') || (sLabel === 'POINT' && tLabel === 'EDGE')) {
    return { mateType: 'COINCIDENT', alignment: 'ALIGNED', confidence: 0.8, label: 'Coincident (edge to point)' };
  }

  // ── POINT + POINT → Coincident ──────────────────────────
  if (sLabel === 'POINT' && tLabel === 'POINT') {
    return { mateType: 'COINCIDENT', alignment: 'ALIGNED', confidence: 0.9, label: 'Coincident (point to point)' };
  }

  // ── POINT + PLANE → Distance (0) / Coincident ───────────
  if (sLabel === 'POINT' && tLabel === 'PLANE') {
    return { mateType: 'COINCIDENT', alignment: 'ALIGNED', confidence: 0.7, label: 'Coincident (point on plane)' };
  }

  // ── SPHERICAL + SPHERICAL → Concentric ──────────────────
  if (sLabel === 'SPHERICAL' && tLabel === 'SPHERICAL') {
    return { mateType: 'CONCENTRIC', alignment: 'ALIGNED', confidence: 0.8, label: 'Concentric (spherical)' };
  }

  // ── SPHERICAL + PLANE → Tangent ────────────────────────
  if ((sLabel === 'SPHERICAL' && tLabel === 'PLANE') || (sLabel === 'PLANE' && tLabel === 'SPHERICAL')) {
    return { mateType: 'TANGENT', alignment: 'ALIGNED', confidence: 0.8, label: 'Tangent (sphere to plane)' };
  }

  // ── CONICAL + CONICAL → Concentric ─────────────────────
  if (sLabel === 'CONICAL' && tLabel === 'CONICAL') {
    return { mateType: 'CONCENTRIC', alignment: 'ALIGNED', confidence: 0.75, label: 'Concentric (conical)' };
  }

  // ── CONICAL + PLANE → Coincident ───────────────────────
  if ((sLabel === 'CONICAL' && tLabel === 'PLANE') || (sLabel === 'PLANE' && tLabel === 'CONICAL')) {
    return { mateType: 'COINCIDENT', alignment: 'ALIGNED', confidence: 0.6, label: 'Coincident (cone to plane)' };
  }

  // ── CONICAL + CYLINDRICAL → Concentric ─────────────────
  if ((sLabel === 'CONICAL' && tLabel === 'CYLINDRICAL_FACE') || (sLabel === 'CYLINDRICAL_FACE' && tLabel === 'CONICAL')) {
    return { mateType: 'CONCENTRIC', alignment: 'ALIGNED', confidence: 0.7, label: 'Concentric (cone to cylinder)' };
  }

  // ── Fallback: Coincident with low confidence ────────────
  return { mateType: 'COINCIDENT', alignment: 'ALIGNED', confidence: 0.3, label: `Coincident (${sLabel} to ${tLabel})` };
}
