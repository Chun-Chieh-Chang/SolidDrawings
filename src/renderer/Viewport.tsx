'use client';

import React, { Suspense, useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Stage, PerspectiveCamera, Html, Line, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { useCadStore } from '../store/useCadStore';
import { DatumPlanes } from './DatumPlanes';
import { SketchPreview } from './SketchPreview';
import { TopologySelector } from '../kernel/TopologySelector';
import { ConfirmationCorner } from '../ui/ConfirmationCorner';
import { ViewOrientationSelector } from '../ui/ViewOrientationSelector';
import { commitPreciseSketchSolve } from '@/kernel/SketchSolverService';

const CameraHandler = () => {
  const activePlane = useCadStore(state => state.activePlane);
  const isSketchMode = useCadStore(state => state.isSketchMode);
  const cameraNormalTrigger = useCadStore(state => state.cameraNormalTrigger);
  const cameraNormalFlip = useCadStore(state => state.cameraNormalFlip);
  const controls = useCadStore(state => state.controls);
  const setIsCameraAnimating = useCadStore(state => state.setIsCameraAnimating);
  const { camera } = useThree();
  const lastTriggerRef = useRef(0);

  useEffect(() => {
    const triggerNormal = cameraNormalTrigger > lastTriggerRef.current;
    lastTriggerRef.current = cameraNormalTrigger;

    if (!activePlane) return;
    if (!isSketchMode && !triggerNormal) return;

    const DISTANCE = 150;
    const dir = cameraNormalFlip ? -1 : 1;
    const targetPos = new THREE.Vector3(DISTANCE, DISTANCE, DISTANCE);
    const upVector = new THREE.Vector3(0, 1, 0);
    const targetOrbitCenter = new THREE.Vector3(0, 0, 0);

    if (activePlane === 'FRONT') {
      targetPos.set(0, 0, DISTANCE * dir);
      upVector.set(0, 1, 0);
    } else if (activePlane === 'TOP') {
      targetPos.set(0, DISTANCE * dir, 0);
      upVector.set(0, 0, dir === 1 ? -1 : 1);
    } else if (activePlane === 'RIGHT') {
      targetPos.set(DISTANCE * dir, 0, 0);
      upVector.set(0, 1, 0);
    } else if (activePlane === 'FACE') {
      const state = useCadStore.getState();
      const activeFaceOrigin = state.activeFaceOrigin;
      const activeFaceNormal = state.activeFaceNormal;
      if (activeFaceOrigin && activeFaceNormal) {
        const originVec = new THREE.Vector3(...activeFaceOrigin);
        const normalVec = new THREE.Vector3(...activeFaceNormal).normalize();
        targetOrbitCenter.copy(originVec);
        targetPos.copy(originVec).addScaledVector(normalVec, DISTANCE * dir);
        const xDir = new THREE.Vector3();
        if (Math.abs(normalVec.x) < 1e-5 && Math.abs(normalVec.y) < 1e-5) xDir.set(1, 0, 0);
        else xDir.set(-normalVec.y, normalVec.x, 0).normalize();
        const yDir = new THREE.Vector3().crossVectors(normalVec, xDir).normalize();
        upVector.copy(yDir);
      }
    } else {
      const activeCustomPlane = useCadStore.getState().referencePlanes.find(p => p.id === activePlane);
      if (activeCustomPlane) {
        const originVec = new THREE.Vector3(...activeCustomPlane.origin);
        const normalVec = new THREE.Vector3(...activeCustomPlane.normal).normalize();
        targetOrbitCenter.copy(originVec);
        targetPos.copy(originVec).addScaledVector(normalVec, DISTANCE * dir);
        const yDir = new THREE.Vector3(...activeCustomPlane.yDir).normalize();
        upVector.copy(yDir);
      }
    }

    gsap.killTweensOf(camera.position);
    if (controls) gsap.killTweensOf(controls.target);

    setIsCameraAnimating(true);
    gsap.to(camera.position, {
      x: targetPos.x, y: targetPos.y, z: targetPos.z,
      duration: 0.8, ease: 'expo.out',
      onUpdate: () => {
        camera.up.copy(upVector);
        camera.lookAt(targetOrbitCenter);
      },
      onComplete: () => {
        setIsCameraAnimating(false);
        if (controls) controls.update();
      }
    });

    if (controls) {
      gsap.to(controls.target, {
        x: targetOrbitCenter.x, y: targetOrbitCenter.y, z: targetOrbitCenter.z,
        duration: 0.8, ease: 'expo.out'
      });
    }
  }, [activePlane, isSketchMode, cameraNormalTrigger, cameraNormalFlip, camera, controls, setIsCameraAnimating]);

  return null;
};

const DanglingNodesRenderer = () => {
  const danglingNodes = useCadStore(state => state.danglingNodes);
  const isSketchMode = useCadStore(state => state.isSketchMode);
  if (!isSketchMode || danglingNodes.length === 0) return null;
  return (
    <group>
      {danglingNodes.map((pos, idx) => (
        <mesh key={idx} position={new THREE.Vector3(...pos)}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshBasicMaterial color="#EF4444" depthTest={false} transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
};

export let topologySelector: TopologySelector | null = null;
const SceneSelector = () => {
  const { scene, camera } = useThree();
  useEffect(() => {
    topologySelector = new TopologySelector(scene, camera);
    return () => { topologySelector = null; };
  }, [scene, camera]);
  return null;
};

const HighlightRenderer = () => {
  const selectedTopology = useCadStore(state => state.selectedTopology);
  const measurementPoints = useCadStore(state => state.measurementPoints);
  return (
    <group>
      {selectedTopology && (() => {
        const { type, coordinates, edgeData } = selectedTopology;
        if (type === 'VERTEX') return <mesh position={new THREE.Vector3(...coordinates)}><sphereGeometry args={[1.2, 16, 16]} /><meshBasicMaterial color="#EF4444" depthTest={false} /></mesh>;
        if (type === 'EDGE' && edgeData) return <Line points={[new THREE.Vector3(...edgeData.start), new THREE.Vector3(...edgeData.end)]} color="#3b82f6" lineWidth={3} depthTest={false} />;
        if (type === 'FACE') return <mesh position={new THREE.Vector3(...coordinates)}><sphereGeometry args={[1.0, 16, 16]} /><meshBasicMaterial color="#10B981" depthTest={false} /></mesh>;
        return null;
      })()}
      {measurementPoints.map((pt, idx) => <mesh key={idx} position={new THREE.Vector3(...pt.coordinates)}><sphereGeometry args={[1.0, 16, 16]} /><meshBasicMaterial color="#8B5CF6" depthTest={false} /></mesh>)}
    </group>
  );
};

const FeatureOutlines = () => {
  const features = useCadStore(state => state.features);
  const selectedId = useCadStore(state => state.selectedId);
  const isSketchMode = useCadStore(state => state.isSketchMode);
  if (isSketchMode || features.length === 0) return null;
  return (
    <group>
      {features.map(f => {
        if (f.type === 'EXTRUDE' && f.parameters.points) {
          const depth = f.parameters.depth || 20;
          const isSelected = selectedId === f.id;
          return <group key={f.id}>
            <Line points={f.parameters.points.map((p: any) => [p[0], 0, p[1]])} color={isSelected ? "#60A5FA" : "#94A3B8"} lineWidth={isSelected ? 3 : 1} />
            <Line points={f.parameters.points.map((p: any) => [p[0], depth, p[1]])} color={isSelected ? "#60A5FA" : "#94A3B8"} lineWidth={isSelected ? 3 : 1} />
          </group>;
        }
        return null;
      })}
    </group>
  );
};

const OrbitControlsWrapper = React.memo(() => {
  const isSketchMode = useCadStore(state => state.isSketchMode);
  const setControls = useCadStore(state => state.setControls);
  const isCameraAnimating = useCadStore(state => state.isCameraAnimating);
  return <OrbitControls ref={(ref) => ref && setControls(ref)} makeDefault enableRotate={!isSketchMode} enabled={!isCameraAnimating} />;
});
OrbitControlsWrapper.displayName = 'OrbitControlsWrapper';

const MouseTracker = () => {
  const { raycaster, mouse, camera } = useThree();
  const setMousePos = useCadStore(state => state.setMousePos);
  const activePlane = useCadStore(state => state.activePlane);

  useFrame(() => {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(camera.parent?.children || [], true);
    const hit = intersects.find(i => i.object.name === activePlane) || intersects[0];
    if (hit) {
      setMousePos([hit.point.x, hit.point.y, hit.point.z]);
    }
  });
  return null;
};

const Viewport = ({ children }: { children?: React.ReactNode }) => {
  const isSketchMode = useCadStore(state => state.isSketchMode);
  const setSelectedId = useCadStore(state => state.setSelectedId);
  const setShortcutBox = useCadStore(state => state.setShortcutBox);
  const triggerCameraNormal = useCadStore(state => state.triggerCameraNormal);
  const setViewOrientationSelectorVisible = useCadStore(state => state.setViewOrientationSelectorVisible);
  const viewOrientationSelectorVisible = useCadStore(state => state.viewOrientationSelectorVisible);
  const controls = useCadStore(state => state.controls);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSketchMode) useCadStore.setState({ sketchNewChain: true, lastClickedNodeId: null, firstChainNodeId: null });
        setShortcutBox(null);
        setViewOrientationSelectorVisible(false);
      }
      if (e.key === 's' || e.key === 'S') setShortcutBox({ visible: true, x: mouseRef.current.x, y: mouseRef.current.y });
      if (e.ctrlKey && e.key === '8') { e.preventDefault(); triggerCameraNormal(); }
      if (e.ctrlKey && e.key === '7') {
        e.preventDefault();
        if (controls) {
          const isoPos = new THREE.Vector3(1, 1, 1).normalize().multiplyScalar(250);
          gsap.to(controls.object.position, { x: isoPos.x, y: isoPos.y, z: isoPos.z, duration: 0.8, onUpdate: () => controls.update() });
          gsap.to(controls.target, { x: 0, y: 0, z: 0, duration: 0.8 });
        }
      }
      if (e.key === 'f' || e.key === 'F') {
        if (controls) controls.reset();
      }
      if (e.key === ' ') {
        e.preventDefault();
        setViewOrientationSelectorVisible(!viewOrientationSelectorVisible);
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (isSketchMode) {
          const state = useCadStore.getState();
          if (state.selectedEntityIds.length > 0) {
            const nextNodes = { ...state.sketchNodes };
            const nextEdges = { ...state.sketchEdges };
            const nextConstraints = { ...state.sketchConstraints };
            const toDelete = state.selectedEntityIds;

            toDelete.forEach(id => {
              if (nextNodes[id]) delete nextNodes[id];
              if (nextEdges[id]) delete nextEdges[id];
              if (nextConstraints[id]) delete nextConstraints[id];
            });

            Object.values(nextEdges).forEach(edge => {
              if (edge.nodeIds.some(nid => !nextNodes[nid])) delete nextEdges[edge.id];
            });
            Object.values(nextConstraints).forEach(c => {
              if (c.nodeIds?.some(nid => !nextNodes[nid])) delete nextConstraints[c.id];
              if (c.edgeIds?.some(eid => !nextEdges[eid])) delete nextConstraints[c.id];
            });

            useCadStore.setState({
              sketchNodes: nextNodes,
              sketchEdges: nextEdges,
              sketchConstraints: nextConstraints,
              selectedEntityIds: []
            });
            
            commitPreciseSketchSolve().then(() => {
              const rebuildHook = (window as any).__handleRebuild;
              if (rebuildHook) rebuildHook();
            });
          }
        }
      }
    };
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      (window as any).__lastMousePos = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('mousemove', handleMouseMove); };
  }, [isSketchMode, setShortcutBox, triggerCameraNormal, controls, viewOrientationSelectorVisible, setViewOrientationSelectorVisible]);

  return (
    <div className="w-full h-full bg-slate-100 relative">
      <Canvas shadows gl={{ localClippingEnabled: true }} onPointerMissed={() => setSelectedId(null)}>
        <CameraHandler />
        <MouseTracker />
        <SceneSelector />
        <PerspectiveCamera makeDefault position={[150, 150, 150]} fov={45} />
        <Suspense fallback={null}>
          <Stage adjustCamera={false} intensity={0.5}>
            <DatumPlanes />
            <SketchPreview />
            <DanglingNodesRenderer />
            <HighlightRenderer />
            <FeatureOutlines />
            {children}
          </Stage>
        </Suspense>
        <Grid infiniteGrid sectionSize={5} sectionColor="#94A3B8" cellColor="#CBD5E1" />
        <OrbitControlsWrapper />
      </Canvas>
      <ConfirmationCorner />
      <ViewOrientationSelector />
    </div>
  );
};

export default React.memo(Viewport);
