'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { useCadStore } from '../store/useCadStore';
import { topologySelector } from './Viewport';
import { inferSmartMate } from '../utils/smart-mate-inference';
import { v4 as uuidv4 } from 'uuid';

/**
 * SmartMateOverlay handles the drag-and-drop mate workflow:
 *   1st click on component A ??sets smartMateSource (highlight green)
 *   2nd click on component B ??infers mate type ??creates mate
 *   Right-click or Escape ??cancels
 */
export default function SmartMateOverlay() {
  const {
    smartMateActive,
    smartMateSource,
  } = useCadStore();

  const [inferenceLabel, setInferenceLabel] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // ?? Reset source when turning off Smart Mates ????????????
  // Use a ref to track previous smartMateActive value
  const prevActiveRef = useRef(smartMateActive);
  
  useEffect(() => {
    if (!smartMateActive && prevActiveRef.current) {
      // Only reset when transitioning FROM active TO inactive
      useCadStore.setState({ smartMateSource: null });
      
      setInferenceLabel(null);
    }
    prevActiveRef.current = smartMateActive;
  }, [smartMateActive]);

  // ?? Cancel on Escape ????????????????????????????????????
  useEffect(() => {
    if (!smartMateActive) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Use store.dispatch pattern to avoid react-hooks/immutability violation
        const store = useCadStore.getState();
        store.setSmartMateSource(null);
        
        setInferenceLabel(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [smartMateActive]);

  // ?? Global pointer handler to intercept clicks on meshes ?
  const handlePointerDown = useCallback((e: PointerEvent) => {
    if (!smartMateActive || !topologySelector) return;

    // Only respond to left-click without modifiers
    if (e.button !== 0 || e.ctrlKey || e.metaKey) return;

    // Hit-test via the Three.js scene
    const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
    const ndcY = -(e.clientY / window.innerHeight) * 2 + 1;

    const selected = topologySelector.selectAtPosition(ndcX, ndcY, false, 'ALL' as any);
    if (!selected) {
      // Clicking empty space ??clear source
      if (smartMateSource) {
        useCadStore.setState({ smartMateSource: null });
        
        setInferenceLabel(null);
      }
      return;
    }

    if (!smartMateSource) {
      // ?? FIRST CLICK: select source reference ??
      const hitTopo = topologySelector.selectAtPosition(ndcX, ndcY, false, 'ALL' as any);
      if (hitTopo) {
        // Get componentId from the intersected object
        try {
          const camera = (topologySelector as any).camera as THREE.Camera;
          const scene = (topologySelector as any).scene as THREE.Scene;
          if (camera && scene) {
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera({ x: ndcX, y: ndcY } as any, camera);
            const intersects = raycaster.intersectObjects(scene.children, true);
            if (intersects.length > 0) {
              let obj: any = intersects[0].object;
              while (obj && !obj.userData?.componentId) obj = obj.parent;
              if (obj?.userData?.componentId) {
                hitTopo.componentId = obj.userData.componentId;
              }
            }
          }
        } catch {
          // fallback: componentId may already be set from mesh data
        }

        useCadStore.setState({ smartMateSource: hitTopo });
        
        setInferenceLabel(null);
      }
    } else {
      // ?? SECOND CLICK: infer and create mate ??
      // Attach componentId to the target topology
      try {
        const camera = (topologySelector as any).camera as THREE.Camera;
        const scene = (topologySelector as any).scene as THREE.Scene;
        if (camera && scene) {
          const raycaster = new THREE.Raycaster();
          raycaster.setFromCamera({ x: ndcX, y: ndcY } as any, camera);
          const intersects = raycaster.intersectObjects(scene.children, true);
          if (intersects.length > 0) {
            let obj: any = intersects[0].object;
            while (obj && !obj.userData?.componentId) obj = obj.parent;
            if (obj?.userData?.componentId) {
              selected.componentId = obj.userData.componentId;
            }
          }
        }
      } catch {
        // fallback
      }

      const result = inferSmartMate(smartMateSource, selected);
      if (result && result.confidence >= 0.3) {
        const mate: import('../store/types').CADMate = {
          id: uuidv4(),
          name: `SmartMate_${result.mateType}_${useCadStore.getState().mates.length + 1}`,
          type: result.mateType,
          alignment: result.alignment,
          entity1: {
            componentId: smartMateSource.componentId || '',
            topologyId: smartMateSource.id,
            localOrigin: smartMateSource.coordinates,
            localNormal: smartMateSource.normal,
          },
          entity2: {
            componentId: selected.componentId || '',
            topologyId: selected.id,
            localOrigin: selected.coordinates,
            localNormal: selected.normal,
          },
        };
        useCadStore.getState().addMate(mate);
        useCadStore.getState().setSelectedId(mate.id);
        // Reset source for next mate
        useCadStore.setState({ smartMateSource: null });
        setInferenceLabel(null);
      } else {
        // Low confidence ??show label and keep source
        setInferenceLabel(result ? result.label : 'Invalid mate');
        setTimeout(() => setInferenceLabel(null), 2000);
      }
      
    }
  }, [smartMateActive, smartMateSource]);

  // ?? Track mouse for hover feedback ??????????????????????
  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!smartMateActive || !topologySelector) return;
    if (!smartMateSource) return; // Only show hover after source is picked

    const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
    const ndcY = -(e.clientY / window.innerHeight) * 2 + 1;

    const selected = topologySelector.selectAtPosition(ndcX, ndcY, false, 'ALL' as any);
    if (selected) {
      // Attach componentId
      try {
        const camera = (topologySelector as any).camera as THREE.Camera;
        const scene = (topologySelector as any).scene as THREE.Scene;
        if (camera && scene) {
          const raycaster = new THREE.Raycaster();
          raycaster.setFromCamera({ x: ndcX, y: ndcY } as any, camera);
          const intersects = raycaster.intersectObjects(scene.children, true);
          if (intersects.length > 0) {
            let obj: any = intersects[0].object;
            while (obj && !obj.userData?.componentId) obj = obj.parent;
            if (obj?.userData?.componentId) {
              selected.componentId = obj.userData.componentId;
            }
          }
        }
      } catch {
        // fallback
      }

      if (selected.componentId !== smartMateSource.componentId) {
        
        const inf = inferSmartMate(smartMateSource, selected);
        setInferenceLabel(inf ? `${inf.label} (${Math.round(inf.confidence * 100)}%)` : null);
      } else {
        
        setInferenceLabel(null);
      }
    } else {
      
    }
  }, [smartMateActive, smartMateSource]);

  useEffect(() => {
    if (!smartMateActive) return;
    // Use capture phase to intercept before React/SVG handlers
    window.addEventListener('pointerdown', handlePointerDown, { capture: true });
    window.addEventListener('pointermove', handlePointerMove);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, { capture: true });
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [smartMateActive, handlePointerDown, handlePointerMove]);

  if (!smartMateActive) return null;

  return (
    <div ref={overlayRef} className="fixed inset-0 pointer-events-none z-50">
      {/* Instruction banner at top */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
          <polyline points="10 17 15 12 10 7"/>
          <line x1="15" y1="12" x2="3" y2="12"/>
        </svg>
        {smartMateSource
          ? <span>Click a <strong>target reference</strong> on another component to create a Smart Mate</span>
          : <span>Click a <strong>source reference</strong> (face/edge/point) to begin</span>
        }
        <kbd className="ml-2 bg-indigo-800 px-1.5 py-0.5 rounded text-xs">ESC</kbd>
      </div>

      {/* Inference label near cursor */}
      {inferenceLabel && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white px-4 py-2 rounded-lg text-sm shadow-lg border border-slate-700">
          {inferenceLabel}
        </div>
      )}

      {/* Source reference indicator */}
      {smartMateSource && (
        <div className="absolute bottom-4 right-4 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs shadow-lg flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
          Source: {smartMateSource.type} @ ({smartMateSource.coordinates.map((c: number) => c.toFixed(1)).join(', ')})
        </div>
      )}
    </div>
  );
}
