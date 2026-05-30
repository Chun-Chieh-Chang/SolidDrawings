'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { TransformControls } from '@react-three/drei';
import { useCadStore, CADComponent } from '../store/useCadStore';
import OcctShape, { MeshData } from './OcctShape';
import { AssemblyService } from '../kernel/AssemblyService';

interface AssemblyComponentProps {
  comp: CADComponent;
  meshes: { data: MeshData }[];
  isActive: boolean;
}

export const AssemblyComponent: React.FC<AssemblyComponentProps> = ({ comp, meshes, isActive }) => {
  const { updateComponentTransform, setComponents, components, mates } = useCadStore();
  const groupRef = useRef<THREE.Group>(null);
  const transformRef = useRef<any>(null);

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
      position={comp.transform.position} 
      rotation={comp.transform.rotation}
    >
      {meshes.map((mesh, idx) => (
        <OcctShape 
          key={`${comp.id}_${idx}`} 
          data={mesh.data} 
          position={[0, 0, 0]} // Reset local pos because group handles it
          rotation={[0, 0, 0]}
          componentId={comp.id}
          color={comp.color}
        />
      ))}
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
