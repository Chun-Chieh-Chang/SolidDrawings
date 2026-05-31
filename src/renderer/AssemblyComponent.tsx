'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { TransformControls } from '@react-three/drei';
import { useCadStore, CADComponent } from '../store/useCadStore';
import OcctShape, { MeshData } from './OcctShape';
import { AssemblyService } from '../kernel/AssemblyService';
import { Box, Edges } from '@react-three/drei';

interface AssemblyComponentProps {
  comp: CADComponent;
  meshes: { data: MeshData }[];
  isActive: boolean;
}

export const AssemblyComponent: React.FC<AssemblyComponentProps> = ({ comp, meshes, isActive }) => {
  const { updateComponentTransform, setComponents, components, mates, explodedView } = useCadStore();
  const groupRef = useRef<THREE.Group>(null);
  const transformRef = useRef<any>(null);

  // Compute bounding box for lightweight mode
  const boundingBox = useMemo(() => {
    if (!meshes || meshes.length === 0) return null;
    const box = new THREE.Box3();
    meshes.forEach(m => {
      const posAttr = m.data.vertices;
      for (let i = 0; i < posAttr.length; i += 3) {
        box.expandByPoint(new THREE.Vector3(posAttr[i], posAttr[i+1], posAttr[i+2]));
      }
    });
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    return { size, center };
  }, [meshes]);

  useEffect(() => {
    if (transformRef.current) {
      const controls = transformRef.current;
      
      const onDraggingChanged = (event: any) => {
        // Disable OrbitControls while dragging Gizmo
        const orbitControls = useCadStore.getState().controls;
        if (orbitControls) {
          orbitControls.enabled = !event.value;
        }

        // When drag finishes (event.value === false)
        if (!event.value && groupRef.current) {
          const pos = groupRef.current.position;
          const rot = groupRef.current.rotation;
          
          updateComponentTransform(
            comp.id, 
            [pos.x, pos.y, pos.z], 
            [rot.x, rot.y, rot.z]
          );

          // Re-solve mates to snap to constraints
          const assemblyService = new AssemblyService();
          // Need to pull latest components from store
          const latestComponents = useCadStore.getState().components;
          assemblyService.solve(latestComponents, mates, []).then(updated => {
            setComponents(updated);
          });
        }
      };

      controls.addEventListener('dragging-changed', onDraggingChanged);
      return () => {
        controls.removeEventListener('dragging-changed', onDraggingChanged);
      };
    }
  }, [isActive, comp.id, updateComponentTransform, setComponents, mates]);

  const content = (
    <group 
      ref={groupRef} 
      position={[
        comp.transform.position[0] + (explodedView.isActive ? (explodedView.directions[comp.id]?.[0] || 0) * explodedView.factor * 100 : 0),
        comp.transform.position[1] + (explodedView.isActive ? (explodedView.directions[comp.id]?.[1] || 0) * explodedView.factor * 100 : 0),
        comp.transform.position[2] + (explodedView.isActive ? (explodedView.directions[comp.id]?.[2] || 0) * explodedView.factor * 100 : 0)
      ]} 
      rotation={comp.transform.rotation}
    >
      {comp.isLightweight && boundingBox ? (
        <group position={[boundingBox.center.x, boundingBox.center.y, boundingBox.center.z]}>
          <Box args={[boundingBox.size.x, boundingBox.size.y, boundingBox.size.z]}>
            <meshBasicMaterial color={comp.color || '#64748B'} wireframe transparent opacity={0.1} />
            <Edges color={comp.color || '#64748B'} />
          </Box>
        </group>
      ) : (
        meshes.map((mesh, idx) => (
          <OcctShape 
            key={`${comp.id}_${idx}`} 
            data={mesh.data} 
            position={[0, 0, 0]} // Reset local pos because group handles it
            rotation={[0, 0, 0]}
            componentId={comp.id}
            color={comp.color}
          />
        ))
      )}
    </group>
  );

  if (isActive && !comp.isFixed) {
    return (
      <TransformControls ref={transformRef} mode="translate">
        {content}
      </TransformControls>
    );
  }

  return content;
};
