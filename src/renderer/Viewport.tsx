'use client';

import React, { Suspense, useEffect, useRef, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Stage, PerspectiveCamera, Html } from '@react-three/drei';
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

// R3F context initialization helper rendered inside Canvas
const SceneSelector = () => {
  const { scene, camera } = useThree();

  useEffect(() => {
    topologySelector = new TopologySelector(scene, camera);
    console.log('[Viewport] TopologySelector initialized with R3F scene and camera');
    return () => {
      topologySelector = null;
    };
  }, [scene, camera]);

  return null;
};

// Visual feedback and 3D measurement tags renderer
const HighlightRenderer = () => {
  const { selectedTopology, measurementPoints } = useCadStore();

  return (
    <group>
      {/* 1. Highlight currently selected topology element */}
      {selectedTopology && (() => {
        const { type, coordinates, edgeData } = selectedTopology;
        const posVec = new THREE.Vector3(...coordinates);
        
        if (type === 'VERTEX') {
          return (
            <mesh position={posVec}>
              <sphereGeometry args={[1.2, 16, 16]} />
              <meshBasicMaterial color="#EF4444" depthTest={false} transparent opacity={0.9} />
            </mesh>
          );
        } else if (type === 'EDGE' && edgeData) {
          const start = new THREE.Vector3(...edgeData.start);
          const end = new THREE.Vector3(...edgeData.end);
          const points = [start, end];
          const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
          const material = new THREE.LineBasicMaterial({
            color: 0x3b82f6,
            linewidth: 3,
            depthTest: false,
            transparent: true,
            opacity: 0.9,
          });
          const lineObj = new THREE.Line(lineGeometry, material);
          return <primitive object={lineObj} />;
        } else if (type === 'FACE') {
          return (
            <mesh position={posVec}>
              <sphereGeometry args={[1.0, 16, 16]} />
              <meshBasicMaterial color="#10B981" depthTest={false} transparent opacity={0.8} />
            </mesh>
          );
        }
        return null;
      })()}

      {/* 2. Highlight picked measurement markers */}
      {measurementPoints.map((pt, idx) => {
        const pos = new THREE.Vector3(...pt.coordinates);
        return (
          <group key={idx}>
            <mesh position={pos}>
              <sphereGeometry args={[1.0, 16, 16]} />
              <meshBasicMaterial color="#8B5CF6" depthTest={false} />
            </mesh>
            <Html position={pos} distanceFactor={15}>
              <div className="bg-indigo-600 text-white font-bold font-mono px-1 py-0.5 rounded text-[8px] whitespace-nowrap shadow-md pointer-events-none select-none">
                M{idx + 1}
              </div>
            </Html>
          </group>
        );
      })}

      {/* 3. Connecting measurement line */}
      {measurementPoints.length === 2 && (() => {
        const start = new THREE.Vector3(...measurementPoints[0].coordinates);
        const end = new THREE.Vector3(...measurementPoints[1].coordinates);
        const points = [start, end];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        const material = new THREE.LineBasicMaterial({
          color: 0x8b5cf6,
          linewidth: 2,
          depthTest: false,
        });
        const lineObj = new THREE.Line(lineGeometry, material);
        return (
          <group>
            <primitive object={lineObj} />
            <Html position={midPoint} distanceFactor={15}>
              <div className="bg-slate-900/90 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded text-[9px] font-bold font-mono whitespace-nowrap shadow-2xl pointer-events-none select-none">
                📏 {start.distanceTo(end).toFixed(2)} mm
              </div>
            </Html>
          </group>
        );
      })()}
    </group>
  );
};

interface ViewportProps {
  children?: React.ReactNode;
}

export default function Viewport({ children }: ViewportProps) {
  const { isSketchMode } = useCadStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Handle topology selection click
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isSketchMode) return; // Don't select topology during sketching
    
    // Get mouse position
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    if (topologySelector) {
      const selected = topologySelector.selectAtPosition(ndcX, ndcY);
      console.log('[Topology] Click at NDC:', ndcX, ndcY, 'Selected:', selected);
    }
  }, [isSketchMode, canvasRef]);

  return (
    <div className="w-full h-full bg-linear-to-b from-[#FFFFFF] to-[#C8D2DF] relative">
      <Canvas 
        shadows 
        dpr={[1, 2]} 
        ref={canvasRef}
        onClick={handleCanvasClick}
      >
        <CameraHandler />
        <SceneSelector />
        <PerspectiveCamera makeDefault position={[100, 100, 100]} fov={45} />
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.5}>
            <DatumPlanes />
            <SketchPreview />
            <HighlightRenderer />
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
