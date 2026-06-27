'use client';

import React, { useMemo } from 'react';
import { useCadStore } from '../store/useCadStore';
import * as THREE from 'three';

export const StatusBar: React.FC = () => {
  const { 
    isSketchMode, 
    sketchNodes, 
    mousePos,
    solverReport,
    components,
    activePlane,
    activeFaceOrigin,
    activeFaceNormal,
    referencePlanes,
    viewportDisplayMode,
    isLargeAssemblyMode,
    engineStatus,
    units,
    setUnits,
    gridSnap,
    setGridSnap,
  } = useCadStore();

  const activeBasis = useMemo(() => {
    if (isSketchMode && activePlane && activePlane !== 'FRONT' && activePlane !== 'TOP' && activePlane !== 'RIGHT') {
      if (activePlane === 'FACE' && activeFaceOrigin && activeFaceNormal) {
        const origin = new THREE.Vector3(...activeFaceOrigin);
        const normal = new THREE.Vector3(...activeFaceNormal).normalize();
        const xDir = new THREE.Vector3();
        if (Math.abs(normal.x) < 1e-5 && Math.abs(normal.y) < 1e-5) xDir.set(1, 0, 0);
        else xDir.set(-normal.y, normal.x, 0).normalize();
        const yDir = new THREE.Vector3().crossVectors(normal, xDir).normalize();
        return { origin, xDir, yDir };
      }
      const custom = referencePlanes?.find(p => p.id === activePlane);
      if (custom) {
        return { 
          origin: new THREE.Vector3(...custom.origin), 
          xDir: new THREE.Vector3(...custom.xDir), 
          yDir: new THREE.Vector3(...custom.yDir) 
        };
      }
    }
    return null;
  }, [isSketchMode, activePlane, activeFaceOrigin, activeFaceNormal, referencePlanes]);

  const displayCoords = useMemo(() => {
    if (isSketchMode && activePlane) {
      let u = 0, v = 0;
      const p = new THREE.Vector3(...mousePos);
      if (activePlane === 'FRONT') { u = p.x; v = p.y; }
      else if (activePlane === 'TOP') { u = p.x; v = p.z; }
      else if (activePlane === 'RIGHT') { u = p.y; v = p.z; }
      else if (activeBasis) {
        const diff = p.sub(activeBasis.origin);
        u = diff.dot(activeBasis.xDir);
        v = diff.dot(activeBasis.yDir);
      }
      return `U: ${u.toFixed(2)}  V: ${v.toFixed(2)}`;
    }
    return `X: ${mousePos[0].toFixed(2)}  Y: ${mousePos[1].toFixed(2)}  Z: ${mousePos[2].toFixed(2)}`;
  }, [isSketchMode, activePlane, mousePos, activeBasis]);

  const definitionStatus = useMemo(() => {
    if (!isSketchMode) return null;
    
    const nodeIds = Object.keys(sketchNodes || {});
    if (nodeIds.length === 0) return { text: 'Empty', color: '#9ca3af' };

    if (!solverReport) return { text: 'Under Defined', color: '#2563eb' };

    if (solverReport.dof < 0) {
      return { text: 'Over Defined', color: '#dc2626' };
    }
    if (solverReport.dof === 0) {
      return { text: 'Fully Defined', color: '#16a34a' };
    } else {
      return { text: `Under Defined (${solverReport.dof} DOF)`, color: '#2563eb' };
    }
  }, [isSketchMode, sketchNodes, solverReport]);

  const displayMode = useMemo(() => {
    switch (viewportDisplayMode) {
      case 'SHADED': return 'Shaded';
      case 'SHADED_EDGES': return 'Shaded w/ Edges';
      case 'WIREFRAME': return 'Wireframe';
      default: return 'Shaded';
    }
  }, [viewportDisplayMode]);

  return (
    <footer
      className="flex items-center select-none text-[10px] font-sans border-t border-[#D0D0D0] shrink-0"
      style={{ background: '#E8E8E8', height: '22px' }}
    >
      {/* Left Section — Contextual prompts */}
      <div className="flex items-center gap-3 px-2 h-full flex-1 min-w-0">
        {/* Mode label */}
        <span className="text-[#404040] font-medium whitespace-nowrap">
          {isLargeAssemblyMode ? 'Large Assembly' : isSketchMode ? 'Sketch Mode' : 'Part Mode'}
        </span>
        
        {/* Sketch status indicator */}
        {definitionStatus && (
          <span className="font-semibold whitespace-nowrap" style={{ color: definitionStatus.color }}>
            ● {definitionStatus.text}
          </span>
        )}
        
        {/* Coordinates */}
        <span className="text-[#404040] font-mono whitespace-nowrap text-[10px]">
          {displayCoords}
        </span>
      </div>
      
      {/* Divider */}
      <div className="w-px h-3 bg-[#B0B0B0] mx-1" />
      
      {/* Right Section — Controls */}
      <div className="flex items-center h-full">
        {/* Display style */}
        <span className="text-[#404040] font-medium whitespace-nowrap px-2 text-[10px]">
          {displayMode}
        </span>
        
        <div className="w-px h-3 bg-[#B0B0B0]" />

        {/* Grid Snap Toggle */}
        <button
          onClick={() => setGridSnap(!gridSnap)}
          className={`h-full px-2 flex items-center gap-1 border-none bg-transparent cursor-pointer transition-colors text-[10px] hover:bg-[#D0D0D0] ${gridSnap ? 'text-[#005B9A]' : 'text-[#606060]'}`}
          title="Grid Snap"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
            <rect x="2" y="2" width="12" height="12" rx="1" />
            <circle cx="8" cy="8" r="2" />
            <path d="M8 2v3M8 11v3M2 8h3M11 8h3" />
          </svg>
        </button>

        <div className="w-px h-3 bg-[#B0B0B0]" />

        {/* Units Quick-Switch */}
        <button
          onClick={() => setUnits(units === 'MMGS' ? 'IPS' : 'MMGS')}
          className="h-full px-2 flex items-center border-none bg-transparent cursor-pointer text-[#404040] font-medium hover:bg-[#D0D0D0] transition-colors text-[10px] whitespace-nowrap"
          title={`Switch to ${units === 'MMGS' ? 'IPS' : 'MMGS'}`}
        >
          {units}
        </button>

        <div className="w-px h-3 bg-[#B0B0B0]" />

        {/* Scale placeholder */}
        <span className="text-[#404040] font-medium whitespace-nowrap px-2 text-[10px]">
          1:1
        </span>

        <div className="w-px h-3 bg-[#B0B0B0]" />

        {/* Kernel Status Dot */}
        <div className="px-2 flex items-center gap-1">
          <span
            className="inline-block w-[6px] h-[6px] rounded-full"
            style={{
              background: engineStatus === 'CONNECTED' ? '#16a34a' : '#dc2626',
              boxShadow: engineStatus === 'CONNECTED' ? '0 0 3px rgba(22,163,74,0.5)' : '0 0 3px rgba(220,38,38,0.5)',
            }}
            title={`Kernel ${engineStatus === 'CONNECTED' ? 'Connected' : 'Offline'}`}
          />
        </div>
      </div>
    </footer>
  );
};
