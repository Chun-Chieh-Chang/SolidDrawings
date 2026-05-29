import * as THREE from 'three';

/**
 * Geometric signature for topology persistence (SolidWorks-style face tracking fallback).
 * Combines normalized normal, centroid, and area bucket for stable matching after rebuild.
 */
export function computeFaceGeometricSignature(
  normal: THREE.Vector3,
  centroid: THREE.Vector3,
  area: number,
): string {
  const n = normal.clone().normalize();
  const areaBucket = Math.round(area * 1000) / 1000;
  const parts = [
    n.x.toFixed(4),
    n.y.toFixed(4),
    n.z.toFixed(4),
    centroid.x.toFixed(3),
    centroid.y.toFixed(3),
    centroid.z.toFixed(3),
    areaBucket.toFixed(3),
  ];
  return `face_sig_${parts.join('_')}`;
}

export function computeEdgeGeometricSignature(
  start: THREE.Vector3,
  end: THREE.Vector3,
): string {
  const length = start.distanceTo(end);
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  return `edge_sig_${length.toFixed(4)}_${mid.x.toFixed(3)}_${mid.y.toFixed(3)}_${mid.z.toFixed(3)}`;
}
