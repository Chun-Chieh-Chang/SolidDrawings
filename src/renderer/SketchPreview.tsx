import React from 'react';
import * as THREE from 'three';
import { useCadStore } from '../store/useCadStore';
import { Line } from '@react-three/drei';

export const SketchPreview = () => {
  const { sketchPoints, activePlane, isSketchMode } = useCadStore();

  if (!isSketchMode || !activePlane || sketchPoints.length === 0) return null;

  // Map 2D points to 3D based on active plane
  const points3d = sketchPoints.map(([u, v]) => {
    if (activePlane === 'FRONT') return new THREE.Vector3(u, v, 0);
    if (activePlane === 'TOP') return new THREE.Vector3(u, 0, v);
    if (activePlane === 'RIGHT') return new THREE.Vector3(0, u, v);
    return new THREE.Vector3(u, v, 0);
  });

  // Add the first point at the end to show closure if there are multiple points
  // But for preview, we just show the polyline
  const polyPoints = points3d.map(p => [p.x, p.y, p.z] as [number, number, number]);

  return (
    <group>
      {/* Draw the connected lines */}
      {polyPoints.length >= 2 && (
        <Line 
          points={polyPoints} 
          color="#3b82f6" 
          lineWidth={3} 
          dashed={false} 
        />
      )}
      
      {/* Draw markers for each point */}
      {points3d.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.5, 8, 8]} />
          <meshBasicMaterial color={i === 0 ? "#ef4444" : "#3b82f6"} />
        </mesh>
      ))}
    </group>
  );
};
