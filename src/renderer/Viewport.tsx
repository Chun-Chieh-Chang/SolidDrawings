'use client';

import React, { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Stage, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { useCadStore } from '../store/useCadStore';
import { DatumPlanes } from './DatumPlanes';
import { SketchPreview } from './SketchPreview';

const CameraHandler = () => {
  const { activePlane, isSketchMode } = useCadStore();
  const { camera, controls } = useThree();

  useEffect(() => {
    if (!isSketchMode || !activePlane) return;

    const DISTANCE = 150;
    let targetPos = new THREE.Vector3(DISTANCE, DISTANCE, DISTANCE);
    
    if (activePlane === 'FRONT') targetPos.set(0, 0, DISTANCE);
    else if (activePlane === 'TOP') targetPos.set(0, DISTANCE, 0);
    else if (activePlane === 'RIGHT') targetPos.set(DISTANCE, 0, 0);

    gsap.killTweensOf(camera.position);

    gsap.to(camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 0.8,
      ease: 'expo.out',
      onUpdate: () => {
        camera.lookAt(0, 0, 0);
      }
    });

    if (controls) {
      const orbit = controls as any;
      gsap.to(orbit.target, {
        x: 0, y: 0, z: 0,
        duration: 0.8,
        onUpdate: () => orbit.update()
      });
    }
  }, [activePlane, isSketchMode, camera, controls]);

  return null;
};

interface ViewportProps {
  children?: React.ReactNode;
}

export default function Viewport({ children }: ViewportProps) {
  const { isSketchMode } = useCadStore();

  return (
    <div className="w-full h-full bg-[#0F172A] relative">
      <Canvas shadows dpr={[1, 2]}>
        <CameraHandler />
        <PerspectiveCamera makeDefault position={[100, 100, 100]} fov={45} />
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.5}>
            <DatumPlanes />
            <SketchPreview />
            {children || (
              <mesh>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#60A5FA" />
              </mesh>
            )}
          </Stage>
        </Suspense>
        <Grid 
          infiniteGrid 
          fadeDistance={50} 
          fadeStrength={5} 
          cellSize={1} 
          sectionSize={5} 
          sectionColor="#334155" 
          cellColor="#1E293B" 
        />
        <OrbitControls makeDefault enableRotate={!isSketchMode} />
      </Canvas>
      
      <div className="absolute top-4 left-4 glass-effect p-2 rounded-lg text-xs font-mono text-[#F1F5F9] pointer-events-none">
        VIEWPORT: {isSketchMode ? 'SKETCHING MODE (LOCKED)' : 'PERSPECTIVE'}
      </div>
    </div>
  );
}
