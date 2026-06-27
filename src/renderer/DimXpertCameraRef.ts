'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Module-level camera reference for use outside React Three Fiber's Canvas.
 */
let cameraRef: THREE.Camera | null = null;

/**
 * Get the current Three.js camera (read-only).
 * Returns null before CameraCapture has mounted or after unmount.
 */
export function getDimXpertCamera(): THREE.Camera | null {
  return cameraRef;
}

/**
 * Project a 3D world point to 2D screen pixel coordinates.
 * Returns { x, y } or null if camera is not available.
 */
export function projectToScreen(worldPos: THREE.Vector3 | [number, number, number]): { x: number; y: number; z: number } | null {
  const cam = cameraRef;
  if (!cam) return null;

  const vec = worldPos instanceof THREE.Vector3
    ? worldPos.clone()
    : new THREE.Vector3(worldPos[0], worldPos[1], worldPos[2]);

  vec.project(cam);

  // Convert NDC to screen pixel coordinates
  const width = window.innerWidth;
  const height = window.innerHeight;
  const x = (vec.x * 0.5 + 0.5) * width;
  const y = (-vec.y * 0.5 + 0.5) * height;

  return { x, y, z: vec.z };
}

/**
 * Place this component inside the R3F Canvas to capture and maintain
 * a live reference to the current camera.
 *
 * Usage in Viewport.tsx:
 *   <Canvas>
 *     <CameraCapture />
 *   </Canvas>
 */
export function CameraCapture() {
  const { camera } = useThree();

  useEffect(() => {
    cameraRef = camera;
    return () => {
      cameraRef = null;
    };
  }, [camera]);

  return null;
}
