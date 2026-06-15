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

    if (!solverReport) return { text: 'Under Defined', color: '#3b82f6' };

    if (solverReport.dof < 0) {
      return { text: 'Over Defined', color: '#ef4444' };
    }
    if (solverReport.dof === 0) {
      return { text: 'Fully Defined', color: '#22c55e' };
    } else {
      return { text: `Under Defined (${solverReport.dof} DOF)`, color: '#3b82f6' };
    }
  }, [isSketchMode, sketchNodes, solverReport]);

  const displayMode = useMemo(() => {
    switch (viewportDisplayMode) {
      case 'SHADED': return 'Shaded';
      case 'SHADED_EDGES': return 'Shaded w/ Edges';
      case 'WIREFRAME': return 'Wireframe';
      case 'HIDDEN_LINES': return 'Hidden Lines Removed';
      default: return 'Shaded';
    }
  }, [viewportDisplayMode]);

  return (
    <footer className="h-[26px] w-full flex items-center select-none text-[11px] font-sans border-t border-[#A0A0A0]" style={{ background: "linear-gradient(to bottom, #E8E8E8 0%, #D6D6D6 100%)" }}>
      {/* Left Section */}
      <div className="flex items-center gap-4 px-2 h-full flex-1">
        <span className="text-[#404040] font-medium whitespace-nowrap">
          {isLargeAssemblyMode ? 'Large Assembly' : isSketchMode ? 'Sketch Mode' : 'Part Mode'}
        </span>
        
        {definitionStatus && (
          <span className="font-bold text-xs whitespace-nowrap" style={{ color: definitionStatus.color }}>
            ● {definitionStatus.text}
          </span>
        )}
        
        <span className="text-[#404040] font-mono whitespace-nowrap">
          {displayCoords}
        </span>
      </div>
      
      {/* Divider */}
      <div className="w-[1px] h-4 bg-[#A0A0A0]" />
      
      {/* Right Section */}
      <div className="flex items-center gap-3 px-2 h-full">
        <span className="text-[#404040] font-medium whitespace-nowrap">
          {displayMode}
        </span>
        
        <span className="text-[#404040] font-medium whitespace-nowrap">
          MMGS
        </span>
        
        <span className="text-[#404040] font-medium whitespace-nowrap">
          1:1
        </span>
      </div>
    </footer>
  );
};
