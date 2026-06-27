'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { useCadStore } from '../store/useCadStore';
import { topologySelector } from './Viewport';
import { inferSmartMate } from '../utils/smart-mate-inference';
import { v4 as uuidv4 } from 'uuid';

function resolveComponentId(
  ndcX: number,
  ndcY: number,
  topo: { componentId?: string },
): void {
  try {
    const camera = (topologySelector as any).camera as THREE.Camera;
    const scene = (topologySelector as any).scene as THREE.Scene;
    if (!camera || !scene) return;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera({ x: ndcX, y: ndcY } as any, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
      let obj: any = intersects[0].object;
      while (obj && !obj.userData?.componentId) obj = obj.parent;
      if (obj?.userData?.componentId) {
        topo.componentId = obj.userData.componentId;
      }
    }
  } catch {
    // fallback: componentId may already be set from mesh data
  }
}

/**
 * SmartMateOverlay handles the drag-and-drop mate workflow:
 *   Button-toggle mode: 1st click source → 2nd click target → create mate
 *   Alt+Drag mode:      Alt+click source → drag to target → release to create
 *   Right-click or Escape → cancels
 */
export default function SmartMateOverlay() {
  const {
    smartMateActive,
    smartMateSource,
    smartMateDragActive,
    setSmartMateDragActive,
    setSmartMateGhostPosition,
    setSmartMateHoverTarget,
  } = useCadStore();

  const [inferenceLabel, setInferenceLabel] = useState<string | null>(null);
  const [ghostScreenPos, setGhostScreenPos] = useState<{ x: number; y: number } | null>(null);
  const [hoverScreenPos, setHoverScreenPos] = useState<{ x: number; y: number } | null>(null);
  const [isAltDrag, setIsAltDrag] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const altPressedRef = useRef(false);
  const dragSourceRef = useRef<{ ndcX: number; ndcY: number } | null>(null);

  // ── Alt key tracking ──────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        altPressedRef.current = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        altPressedRef.current = false;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // ── Reset source when turning off Smart Mates ─────────────────
  const prevActiveRef = useRef(smartMateActive);
  useEffect(() => {
    if (!smartMateActive && prevActiveRef.current) {
      useCadStore.setState({ smartMateSource: null });
      setSmartMateDragActive(false);
      setSmartMateGhostPosition(null);
      setSmartMateHoverTarget(null);
      setInferenceLabel(null);
      setGhostScreenPos(null);
      setHoverScreenPos(null);
      setIsAltDrag(false);
      dragSourceRef.current = null;
    }
    prevActiveRef.current = smartMateActive;
  }, [smartMateActive, setSmartMateDragActive, setSmartMateGhostPosition, setSmartMateHoverTarget]);

  // ── Cancel on Escape ──────────────────────────────────────────
  useEffect(() => {
    if (!smartMateActive) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const store = useCadStore.getState();
        store.setSmartMateSource(null);
        setSmartMateDragActive(false);
        setSmartMateGhostPosition(null);
        setSmartMateHoverTarget(null);
        setInferenceLabel(null);
        setGhostScreenPos(null);
        setHoverScreenPos(null);
        setIsAltDrag(false);
        dragSourceRef.current = null;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [smartMateActive, setSmartMateDragActive, setSmartMateGhostPosition, setSmartMateHoverTarget]);

  // ── Hit-test helper ───────────────────────────────────────────
  const hitTest = useCallback((e: PointerEvent) => {
    if (!topologySelector) return null;
    const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
    const ndcY = -(e.clientY / window.innerHeight) * 2 + 1;
    const selected = topologySelector.selectAtPosition(ndcX, ndcY, false, 'ALL' as any);
    if (selected) {
      resolveComponentId(ndcX, ndcY, selected);
    }
    return selected;
  }, []);

  // ── Create mate from source and target ────────────────────────
  type SelectorNonNull = NonNullable<typeof topologySelector>;
  const createMate = useCallback((
    source: NonNullable<ReturnType<typeof useCadStore.getState>['smartMateSource']>,
    target: NonNullable<ReturnType<SelectorNonNull['selectAtPosition']>>,
  ) => {
    const result = inferSmartMate(source, target);
    if (result && result.confidence >= 0.3) {
      const mate: import('../store/types').CADMate = {
        id: uuidv4(),
        name: `SmartMate_${result.mateType}_${useCadStore.getState().mates.length + 1}`,
        type: result.mateType,
        alignment: result.alignment,
        entity1: {
          componentId: source.componentId || '',
          topologyId: source.id,
          localOrigin: source.coordinates,
          localNormal: source.normal,
        },
        entity2: {
          componentId: target.componentId || '',
          topologyId: target.id,
          localOrigin: target.coordinates,
          localNormal: target.normal,
        },
      };
      useCadStore.getState().addMate(mate);
      useCadStore.getState().setSelectedId(mate.id);
      return true;
    }
    return false;
  }, []);

  // ── Global pointer handlers ───────────────────────────────────
  const handlePointerDown = useCallback((e: PointerEvent) => {
    if (!smartMateActive || !topologySelector) return;

    // Only respond to left-click
    if (e.button !== 0) return;

    const isAlt = altPressedRef.current;

    // Button-toggle mode: existing two-click workflow
    if (!isAlt) {
      if (e.ctrlKey || e.metaKey) return;
      if (smartMateSource) return; // wait for second click in toggle mode

      const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
      const ndcY = -(e.clientY / window.innerHeight) * 2 + 1;
      const selected = topologySelector.selectAtPosition(ndcX, ndcY, false, 'ALL' as any);
      if (!selected) return;

      resolveComponentId(ndcX, ndcY, selected);
      useCadStore.setState({ smartMateSource: selected });
      setInferenceLabel(null);
      return;
    }

    // ── Alt+Drag mode ─────────────────────────────────────────
    // Prevent default to suppress OrbitControls Alt+click
    e.preventDefault();

    const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
    const ndcY = -(e.clientY / window.innerHeight) * 2 + 1;
    const selected = topologySelector.selectAtPosition(ndcX, ndcY, false, 'ALL' as any);
    if (!selected) return;

    resolveComponentId(ndcX, ndcY, selected);
    useCadStore.setState({ smartMateSource: selected });
    setSmartMateDragActive(true);
    setIsAltDrag(true);
    dragSourceRef.current = { ndcX, ndcY };
    setGhostScreenPos({ x: e.clientX, y: e.clientY });
  }, [smartMateActive, smartMateSource, setSmartMateDragActive]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!smartMateActive || !topologySelector) return;

    if (smartMateDragActive && smartMateSource) {
      // ── Alt+Drag hover feedback ─────────────────────────────
      const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
      const ndcY = -(e.clientY / window.innerHeight) * 2 + 1;

      // Update ghost screen position
      setGhostScreenPos({ x: e.clientX, y: e.clientY });

      // Hit-test for hover target
      const hovered = topologySelector.selectAtPosition(ndcX, ndcY, false, 'ALL' as any);
      if (hovered) {
        resolveComponentId(ndcX, ndcY, hovered);
        setSmartMateHoverTarget(hovered);

        if (hovered.componentId !== smartMateSource.componentId) {
          const inf = inferSmartMate(smartMateSource, hovered);
          setInferenceLabel(inf ? `${inf.label} (${Math.round(inf.confidence * 100)}%)` : null);
          setHoverScreenPos({ x: e.clientX, y: e.clientY });
        } else {
          setInferenceLabel(null);
          setHoverScreenPos(null);
        }
      } else {
        setSmartMateHoverTarget(null);
        setInferenceLabel(null);
        setHoverScreenPos(null);
      }
      return;
    }

    // Button-toggle mode hover feedback (existing behavior)
    if (!smartMateSource) return;
    const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
    const ndcY = -(e.clientY / window.innerHeight) * 2 + 1;
    const selected = topologySelector.selectAtPosition(ndcX, ndcY, false, 'ALL' as any);
    if (selected) {
      resolveComponentId(ndcX, ndcY, selected);
      if (selected.componentId !== smartMateSource.componentId) {
        const inf = inferSmartMate(smartMateSource, selected);
        setInferenceLabel(inf ? `${inf.label} (${Math.round(inf.confidence * 100)}%)` : null);
      } else {
        setInferenceLabel(null);
      }
    } else {
      setInferenceLabel(null);
    }
  }, [smartMateActive, smartMateSource, smartMateDragActive, setSmartMateHoverTarget]);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (!smartMateActive || !topologySelector || !smartMateDragActive) return;

    e.preventDefault();

    const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
    const ndcY = -(e.clientY / window.innerHeight) * 2 + 1;
    const target = topologySelector.selectAtPosition(ndcX, ndcY, false, 'ALL' as any);

    if (target && smartMateSource) {
      resolveComponentId(ndcX, ndcY, target);

      if (target.componentId !== smartMateSource.componentId) {
        const created = createMate(smartMateSource, target);
        if (!created) {
          setInferenceLabel('Invalid mate');
          setTimeout(() => setInferenceLabel(null), 2000);
        }
      }
    }

    // Reset drag state
    useCadStore.setState({ smartMateSource: null });
    setSmartMateDragActive(false);
    setSmartMateGhostPosition(null);
    setSmartMateHoverTarget(null);
    setGhostScreenPos(null);
    setHoverScreenPos(null);
    setIsAltDrag(false);
    dragSourceRef.current = null;
    setInferenceLabel(null);
  }, [smartMateActive, smartMateSource, smartMateDragActive, createMate, setSmartMateDragActive, setSmartMateGhostPosition, setSmartMateHoverTarget]);

  // ── Second click handler for button-toggle mode ───────────────
  const handleSecondClick = useCallback((e: PointerEvent) => {
    if (!smartMateActive || !topologySelector || !smartMateSource) return;
    if (altPressedRef.current) return; // handled by Alt+Drag
    if (e.button !== 0 || e.ctrlKey || e.metaKey) return;

    const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
    const ndcY = -(e.clientY / window.innerHeight) * 2 + 1;
    const selected = topologySelector.selectAtPosition(ndcX, ndcY, false, 'ALL' as any);
    if (!selected) {
      useCadStore.setState({ smartMateSource: null });
      setInferenceLabel(null);
      return;
    }

    resolveComponentId(ndcX, ndcY, selected);

    const source = smartMateSource;
    const created = createMate(source, selected);
    if (created) {
      useCadStore.setState({ smartMateSource: null });
      setInferenceLabel(null);
    } else {
      const result = inferSmartMate(source, selected);
      setInferenceLabel(result ? result.label : 'Invalid mate');
      setTimeout(() => setInferenceLabel(null), 2000);
    }
  }, [smartMateActive, smartMateSource, createMate]);

  // ── Register event listeners ──────────────────────────────────
  useEffect(() => {
    if (!smartMateActive) return;
    // Use capture phase to intercept before React/SVG handlers
    window.addEventListener('pointerdown', handlePointerDown, { capture: true });
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp, { capture: true });
    window.addEventListener('pointerup', handleSecondClick, { capture: true });
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, { capture: true });
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp, { capture: true });
      window.removeEventListener('pointerup', handleSecondClick, { capture: true });
    };
  }, [smartMateActive, handlePointerDown, handlePointerMove, handlePointerUp, handleSecondClick]);

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
        {smartMateDragActive ? (
          <span>Drag to target component then <strong>release</strong> to create Smart Mate</span>
        ) : smartMateSource ? (
          <span>Click a <strong>target reference</strong> on another component, or <kbd className="bg-indigo-800 px-1.5 py-0.5 rounded text-xs mx-1">Alt</kbd>+drag</span>
        ) : (
          <span>Click a <strong>source reference</strong> (face/edge/point) or <kbd className="bg-indigo-800 px-1.5 py-0.5 rounded text-xs mx-1">Alt</kbd>+drag to begin</span>
        )}
        <kbd className="ml-2 bg-indigo-800 px-1.5 py-0.5 rounded text-xs">ESC</kbd>
      </div>

      {/* Ghost ring during Alt+Drag */}
      {smartMateDragActive && ghostScreenPos && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: ghostScreenPos.x - 16,
            top: ghostScreenPos.y - 16,
            width: 32,
            height: 32,
          }}
        >
          {/* Outer ring */}
          <div className="w-full h-full rounded-full border-2 border-indigo-400 bg-indigo-500/10 animate-pulse shadow-[0_0_12px_rgba(99,102,241,0.5)]" />
        </div>
      )}

      {/* Source-to-ghost dashed line */}
      {smartMateDragActive && smartMateSource && ghostScreenPos && dragSourceRef.current && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ overflow: 'visible' }}
        >
          <line
            x1={(dragSourceRef.current.ndcX * 0.5 + 0.5) * (typeof window !== 'undefined' ? window.innerWidth : 0)}
            y1={(-dragSourceRef.current.ndcY * 0.5 + 0.5) * (typeof window !== 'undefined' ? window.innerHeight : 0)}
            x2={ghostScreenPos.x}
            y2={ghostScreenPos.y}
            stroke="rgba(99, 102, 241, 0.4)"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
        </svg>
      )}

      {/* Hover highlight ring */}
      {!smartMateDragActive && hoverScreenPos && smartMateSource && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: hoverScreenPos.x - 20,
            top: hoverScreenPos.y - 20,
            width: 40,
            height: 40,
          }}
        >
          <div className="w-full h-full rounded-full border-2 border-emerald-400 bg-emerald-500/10 shadow-[0_0_14px_rgba(52,211,153,0.5)]" />
        </div>
      )}

      {/* Inference label */}
      {inferenceLabel && !smartMateDragActive && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white px-4 py-2 rounded-lg text-sm shadow-lg border border-slate-700">
          {inferenceLabel}
        </div>
      )}

      {/* Drag inference label (shown during Alt+Drag, follows cursor) */}
      {inferenceLabel && smartMateDragActive && ghostScreenPos && (
        <div
          className="fixed bg-slate-900/90 text-white px-3 py-1.5 rounded-lg text-xs shadow-lg border border-slate-700 pointer-events-none whitespace-nowrap"
          style={{
            left: ghostScreenPos.x + 20,
            top: ghostScreenPos.y - 10,
          }}
        >
          {inferenceLabel}
        </div>
      )}

      {/* Source reference indicator */}
      {smartMateSource && !smartMateDragActive && (
        <div className="absolute bottom-4 right-4 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs shadow-lg flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
          Source: {smartMateSource.type} @ ({smartMateSource.coordinates.map((c: number) => c.toFixed(1)).join(', ')})
        </div>
      )}
    </div>
  );
}
