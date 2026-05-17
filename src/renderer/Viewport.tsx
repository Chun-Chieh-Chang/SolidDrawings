'use client';

import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Stage, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { useCadStore } from '../store/useCadStore';
import { DatumPlanes } from './DatumPlanes';
import { SketchPreview } from './SketchPreview';
import { TopologySelector } from '../kernel/TopologySelector';

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

// Global topology selector instance
let topologySelector: TopologySelector | null = null;

interface ViewportProps {
  children?: React.ReactNode;
}

export default function Viewport({ children }: ViewportProps) {
  const { isSketchMode } = useCadStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize topology selector when canvas is available
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get the Three.js scene and camera from the Canvas context
    // This is a workaround - in a real implementation, we'd pass these properly
    console.log('[Viewport] Canvas initialized for topology selection');
  }, []);

  return (
    <div className="w-full h-full bg-linear-to-b from-[#FFFFFF] to-[#C8D2DF] relative">
      <Canvas 
        shadows 
        dpr={[1, 2]} 
        ref={canvasRef}
        onClick={(e) => {
          if (isSketchMode) return; // Don't select topology during sketching
          
          // Get mouse position
          const canvas = e.target as HTMLCanvasElement;
          const rect = canvas.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          // Create topology selector (in real implementation, pass scene/camera properly)
          // For now, we'll just log the click
          console.log('[Topology] Click at:', x, y);
        }}
      >
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
          sectionColor="#94A3B8"
          cellColor="#CBD5E1"
        />
        <OrbitControls makeDefault enableRotate={!isSketchMode} />
      </Canvas>

      <div className="absolute top-4 left-4 glass-effect p-2 rounded-lg text-xs font-mono text-slate-700 pointer-events-none">
        VIEWPORT: {isSketchMode ? 'SKETCHING MODE (LOCKED)' : 'PERSPECTIVE'}
      </div>
    </div>
  );
}
