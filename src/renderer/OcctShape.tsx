'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';

export interface MeshData {
  vertices: number[];
  normals: number[];
  indices: number[];
}

interface OcctShapeProps {
  data: MeshData;
  color?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export default function OcctShape({ 
  data, 
  color = '#60A5FA',
  position = [0, 0, 0],
  rotation = [0, 0, 0]
}: OcctShapeProps) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    
    // Convert arrays to Float32Array/Uint32Array for Three.js
    const positions = new Float32Array(data.vertices);
    const normals = new Float32Array(data.normals);
    const indices = new Uint32Array(data.indices);

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    if (normals.length > 0) {
      geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    } else {
      geo.computeVertexNormals();
    }

    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    return geo;
  }, [data]);

  return (
    <mesh geometry={geometry} position={position} rotation={rotation}>
      <meshStandardMaterial 
        color={color} 
        roughness={0.3} 
        metalness={0.2} 
        flatShading={false}
        side={THREE.DoubleSide}
      />
      {/* Edge visualization */}
      <lineSegments>
        <edgesGeometry args={[geometry]} />
        <lineBasicMaterial color="#1E293B" linewidth={1} />
      </lineSegments>
    </mesh>
  );
}
