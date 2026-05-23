'use client';

import React, { useMemo, useState } from 'react';
import * as THREE from 'three';
import { useCadStore } from '../store/useCadStore';
import { Line, Html } from '@react-three/drei';
import { analyzeSketchDefinitions } from '../utils/geometry/ConstraintSolver';

export const SketchPreview = () => {
  const { 
    sketchNodes, sketchEdges, sketchConstraints,
    activePlane, 
    isSketchMode,
    selectedEntityIds,
    setSelectedEntityIds,
    activeFaceOrigin,
    activeFaceNormal,
    referencePlanes,
    selectedId,
    selectedSubNodeType,
    features,
    visibleSketches
  } = useCadStore();

  const [hoveredEntityId, setHoveredEntityId] = useState<string | null>(null);
  const [editingConstraintId, setEditingConstraintId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>('');

  const selectedFeature = useMemo(() => features.find(f => f.id === selectedId), [features, selectedId]);

  const isViewingStoredSketch = useMemo(() => {
    return !isSketchMode && selectedSubNodeType === 'SKETCH' && selectedFeature && 
      (selectedFeature.type === 'EXTRUDE' || selectedFeature.type === 'REVOLVE');
  }, [isSketchMode, selectedSubNodeType, selectedFeature]);

  // Combined list of features whose sketches should be rendered
  const sketchesToRender = useMemo(() => {
    const list: { 
      id: string, 
      points: any, 
      plane: string, 
      faceOrigin?: any, 
      faceNormal?: any, 
      faceId?: any,
      sketchNodes?: Record<string, any>,
      sketchEdges?: Record<string, any>,
      sketchConstraints?: Record<string, any>
    }[] = [];
    
    // 1. Current Active Sketch (handled by sketchNodes/Edges state)
    // We handle this separately in the return JSX to preserve interactivity
    
    // 2. Persistent Visible Sketches from other features
    features.forEach(f => {
      if (visibleSketches.includes(f.id) && (f.type === 'EXTRUDE' || f.type === 'REVOLVE')) {
        // Avoid double rendering if it's the currently selected sketch being viewed
        if (isViewingStoredSketch && f.id === selectedId) return;
        
        list.push({
          id: f.id,
          points: f.parameters.points,
          plane: f.parameters.plane,
          faceOrigin: f.parameters.faceOrigin,
          faceNormal: f.parameters.faceNormal,
          faceId: f.parameters.faceId,
          sketchNodes: f.parameters.sketchNodes,
          sketchEdges: f.parameters.sketchEdges,
          sketchConstraints: f.parameters.sketchConstraints
        });
      }
    });

    // 3. Stored Sketch currently being "viewed" via tree selection
    if (isViewingStoredSketch && selectedFeature) {
      list.push({
        id: selectedFeature.id,
        points: selectedFeature.parameters.points,
        plane: selectedFeature.parameters.plane,
        faceOrigin: selectedFeature.parameters.faceOrigin,
        faceNormal: selectedFeature.parameters.faceNormal,
        faceId: selectedFeature.parameters.faceId,
        sketchNodes: selectedFeature.parameters.sketchNodes,
        sketchEdges: selectedFeature.parameters.sketchEdges,
        sketchConstraints: selectedFeature.parameters.sketchConstraints
      });
    }

    return list;
  }, [features, visibleSketches, isViewingStoredSketch, selectedId, selectedFeature]);

  const faceBasis = useMemo(() => {
    if (activePlane !== 'FACE' || !activeFaceOrigin || !activeFaceNormal) return null;
    const origin = new THREE.Vector3(...activeFaceOrigin);
    const normal = new THREE.Vector3(...activeFaceNormal).normalize();
    let xDir = new THREE.Vector3();
    if (Math.abs(normal.x) < 1e-5 && Math.abs(normal.y) < 1e-5) {
      xDir.set(1, 0, 0);
    } else {
      xDir.set(-normal.y, normal.x, 0).normalize();
    }
    const yDir = new THREE.Vector3().crossVectors(normal, xDir).normalize();
    return { origin, normal, xDir, yDir };
  }, [activePlane, activeFaceOrigin, activeFaceNormal]);

  const customBasis = useMemo(() => {
    if (!activePlane || ['FRONT', 'TOP', 'RIGHT', 'FACE'].includes(activePlane)) return null;
    const plane = referencePlanes.find(p => p.id === activePlane);
    if (!plane) return null;
    const origin = new THREE.Vector3(...plane.origin);
    const normal = new THREE.Vector3(...plane.normal).normalize();
    const xDir = new THREE.Vector3(...plane.xDir).normalize();
    const yDir = new THREE.Vector3(...plane.yDir).normalize();
    return { origin, normal, xDir, yDir };
  }, [activePlane, referencePlanes]);

  const activeBasis = useMemo(() => {
    if (activePlane === 'FACE') return faceBasis;
    return customBasis;
  }, [activePlane, faceBasis, customBasis]);

  const get3DPointForPlane = (u: number, v: number, plane: string, basis?: any): [number, number, number] => {
    if (plane === 'FRONT') return [u, v, 0];
    if (plane === 'TOP') return [u, 0, v];
    if (plane === 'RIGHT') return [0, u, v];
    if (basis) {
      const p = basis.origin.clone()
        .addScaledVector(basis.xDir, u)
        .addScaledVector(basis.yDir, v);
      return [p.x, p.y, p.z];
    }
    return [u, v, 0];
  };

  const getBasisForPlane = (plane: string, origin?: any, normal?: any) => {
    if (plane === 'FRONT' || plane === 'TOP' || plane === 'RIGHT') return null;
    if (plane === 'FACE' && origin && normal) {
      const originVec = new THREE.Vector3(...origin);
      const normalVec = new THREE.Vector3(...normal).normalize();
      let xDir = new THREE.Vector3();
      if (Math.abs(normalVec.x) < 1e-5 && Math.abs(normalVec.y) < 1e-5) {
        xDir.set(1, 0, 0);
      } else {
        xDir.set(-normalVec.y, normalVec.x, 0).normalize();
      }
      const yDir = new THREE.Vector3().crossVectors(normalVec, xDir).normalize();
      return { origin: originVec, normal: normalVec, xDir, yDir };
    }
    // Handle custom planes
    const refPlane = referencePlanes.find(p => p.id === plane);
    if (refPlane) {
      return {
        origin: new THREE.Vector3(...refPlane.origin),
        normal: new THREE.Vector3(...refPlane.normal).normalize(),
        xDir: new THREE.Vector3(...refPlane.xDir).normalize(),
        yDir: new THREE.Vector3(...refPlane.yDir).normalize()
      };
    }
    return null;
  };

  const handleEntityClick = (entId: string) => {
    if (!isSketchMode) return;
    const isSelected = selectedEntityIds.includes(entId);
    if (isSelected) {
      setSelectedEntityIds(selectedEntityIds.filter(id => id !== entId));
    } else {
      setSelectedEntityIds([...selectedEntityIds, entId]);
    }
  };

  const definitionReport = useMemo(() => {
    return analyzeSketchDefinitions(sketchNodes, sketchEdges, sketchConstraints);
  }, [sketchNodes, sketchEdges, sketchConstraints]);

  const distanceConstraints = useMemo(() => {
    return Object.values(sketchConstraints).filter(
      c => c.type === 'DISTANCE' && c.nodeIds && c.nodeIds.length === 2 && c.value !== undefined
    );
  }, [sketchConstraints]);

  const geometricConstraints = useMemo(() => {
    return Object.values(sketchConstraints).filter(
      c => ['HORIZONTAL', 'VERTICAL', 'COINCIDENT', 'EQUAL'].includes(c.type)
    );
  }, [sketchConstraints]);

  const handleSaveConstraintValue = (constraintId: string) => {
    const val = parseFloat(inputValue);
    if (!isNaN(val) && val > 0) {
      const currentConstraints = { ...useCadStore.getState().sketchConstraints };
      if (currentConstraints[constraintId]) {
        currentConstraints[constraintId] = {
          ...currentConstraints[constraintId],
          value: val
        };
        useCadStore.setState({ sketchConstraints: currentConstraints });
      }
    }
    setEditingConstraintId(null);
  };

  if (!isSketchMode && sketchesToRender.length === 0) return null;

  return (
    <group>
      {/* 1. Render Active Sketch (Interactive) */}
      {isSketchMode && activePlane && Object.values(sketchEdges).map((edge) => {
        if (edge.nodeIds.length < 2) return null;
        
        let entityPoints: [number, number, number][] = [];
        const n1 = sketchNodes[edge.nodeIds[0]];
        const n2 = sketchNodes[edge.nodeIds[1]];
        if (!n1 || !n2) return null;

        if (edge.type === 'LINE' || edge.type === 'CENTER_LINE') {
          entityPoints = [get3DPointForPlane(n1.x, n1.y, activePlane, activeBasis), get3DPointForPlane(n2.x, n2.y, activePlane, activeBasis)];
        } else if (edge.type === 'CIRCLE') {
          const R = Math.hypot(n2.x - n1.x, n2.y - n1.y);
          for (let k = 0; k <= 36; k++) {
            const theta = (k / 36) * Math.PI * 2;
            entityPoints.push(get3DPointForPlane(n1.x + R * Math.cos(theta), n1.y + R * Math.sin(theta), activePlane, activeBasis));
          }
        }

        const isSelected = selectedEntityIds.includes(edge.id);
        const isHovered = hoveredEntityId === edge.id;
        const isCenterline = edge.type === 'CENTER_LINE' || edge.isConstruction;
        
        const edgeState = definitionReport.edges[edge.id];
        const strokeColor = isSelected
          ? "#ec4899"
          : isHovered
          ? "#f59e0b"
          : edgeState === 'CONFLICT'
          ? "#ef4444"
          : edgeState === 'FULLY'
          ? "#000000"
          : isCenterline
          ? "#6b7280"
          : "#2563eb"; // SolidWorks Blue for Under Defined

        return (
          <group key={edge.id}>
            <Line
              points={entityPoints}
              color={strokeColor}
              lineWidth={isSelected ? 3.5 : isHovered ? 2.5 : 1.5}
              dashed={isCenterline}
              dashSize={1.5}
              gapSize={1.0}
              depthTest={false}
            />
            
            <Line
              points={entityPoints}
              color="#000000"
              lineWidth={16.0}
              opacity={0.0}
              transparent
              onClick={(e) => { e.stopPropagation(); handleEntityClick(edge.id); }}
              onPointerOver={(e) => { if (!isSketchMode) return; e.stopPropagation(); setHoveredEntityId(edge.id); }}
              onPointerOut={(e) => { if (!isSketchMode) return; setHoveredEntityId(null); }}
            />
          </group>
        );
      })}

      {/* 2. Render Nodes (Points) */}
      {isSketchMode && activePlane && Object.values(sketchNodes).map((node) => {
        const isSelected = selectedEntityIds.includes(node.id);
        const isHovered = hoveredEntityId === node.id;
        const pos = get3DPointForPlane(node.x, node.y, activePlane, activeBasis);

        const nodeState = definitionReport.nodes[node.id];
        const dotColor = isSelected
          ? "#ec4899"
          : isHovered
          ? "#f59e0b"
          : node.isFixed
          ? "#10b981"
          : nodeState === 'CONFLICT'
          ? "#ef4444"
          : nodeState === 'FULLY'
          ? "#0f172a"
          : "#3b82f6";

        return (
          <mesh 
            key={node.id} 
            position={pos}
            onClick={(e) => { e.stopPropagation(); handleEntityClick(node.id); }}
            onPointerOver={(e) => { if (!isSketchMode) return; e.stopPropagation(); setHoveredEntityId(node.id); }}
            onPointerOut={(e) => { if (!isSketchMode) return; setHoveredEntityId(null); }}
          >
            <sphereGeometry args={[isSelected || isHovered ? 0.35 : 0.2, 12, 12]} />
            <meshBasicMaterial
              depthTest={false}
              color={dotColor}
            />
          </mesh>
        );
      })}

      {/* 3. Render Floating Interactive 2D Dimension Lines for DISTANCE constraints */}
      {isSketchMode && activePlane && distanceConstraints.map((constraint) => {
        const nA = sketchNodes[constraint.nodeIds![0]];
        const nB = sketchNodes[constraint.nodeIds![1]];
        if (!nA || !nB) return null;

        const dx = nB.x - nA.x;
        const dy = nB.y - nA.y;
        const len = Math.hypot(dx, dy);
        if (len < 1e-4) return null;

        const ux = dx / len;
        const uy = dy / len;
        const nx = -uy;
        const ny = ux;

        const offsetDist = 12;
        const offAx = nA.x + nx * offsetDist;
        const offAy = nA.y + ny * offsetDist;
        const offBx = nB.x + nx * offsetDist;
        const offBy = nB.y + ny * offsetDist;

        const pA = get3DPointForPlane(nA.x, nA.y, activePlane, activeBasis);
        const pB = get3DPointForPlane(nB.x, nB.y, activePlane, activeBasis);
        const pOffA = get3DPointForPlane(offAx, offAy, activePlane, activeBasis);
        const pOffB = get3DPointForPlane(offBx, offBy, activePlane, activeBasis);

        const midX = (offAx + offBx) / 2;
        const midY = (offAy + offBy) / 2;
        const pMid = get3DPointForPlane(midX, midY, activePlane, activeBasis);

        // Arrowhead vectors for the dimension line
        const arrowSize = 1.2;
        const pArrow1A = get3DPointForPlane(offAx + (ux - nx) * arrowSize, offAy + (uy - ny) * arrowSize, activePlane, activeBasis);
        const pArrow1B = get3DPointForPlane(offAx + (ux + nx) * arrowSize, offAy + (uy + ny) * arrowSize, activePlane, activeBasis);
        const pArrow2A = get3DPointForPlane(offBx + (-ux - nx) * arrowSize, offBy + (-uy - ny) * arrowSize, activePlane, activeBasis);
        const pArrow2B = get3DPointForPlane(offBx + (-ux + nx) * arrowSize, offBy + (-uy + ny) * arrowSize, activePlane, activeBasis);

        const isSelected = selectedEntityIds.includes(constraint.id);
        const hasConflict = definitionReport.nodes[nA.id] === 'CONFLICT' || definitionReport.nodes[nB.id] === 'CONFLICT';

        const dimColor = isSelected ? "#ec4899" : hasConflict ? "#ef4444" : "#4f46e5";

        return (
          <group key={constraint.id}>
            <Line
              points={[pA, pOffA]}
              color="#64748b"
              lineWidth={0.8}
              dashed
              dashSize={0.5}
              gapSize={0.5}
              depthTest={false}
            />
            <Line
              points={[pB, pOffB]}
              color="#64748b"
              lineWidth={0.8}
              dashed
              dashSize={0.5}
              gapSize={0.5}
              depthTest={false}
            />
            {/* Dimension Line */}
            <Line
              points={[pOffA, pOffB]}
              color={dimColor}
              lineWidth={isSelected ? 2.0 : 1.2}
              depthTest={false}
            />
            {/* Arrowheads */}
            <Line
              points={[pArrow1A, pOffA, pArrow1B]}
              color={dimColor}
              lineWidth={isSelected ? 2.0 : 1.2}
              depthTest={false}
            />
            <Line
              points={[pArrow2A, pOffB, pArrow2B]}
              color={dimColor}
              lineWidth={isSelected ? 2.0 : 1.2}
              depthTest={false}
            />
            
            <Html position={pMid} center>
              <div 
                className={`px-1.5 py-0.25 rounded border shadow-lg font-mono text-[10px] font-black transition-all select-none flex items-center gap-1 ${
                  isSelected
                    ? 'bg-pink-50 border-pink-400 text-pink-700 shadow-pink-100'
                    : hasConflict 
                    ? 'bg-red-50 border-red-300 text-red-600'
                    : 'bg-white/90 border-indigo-400 text-indigo-800 shadow-indigo-100/50'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEntityClick(constraint.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingConstraintId(constraint.id);
                  setInputValue(constraint.value!.toString());
                }}
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              >
                {editingConstraintId === constraint.id ? (
                  <input
                    type="number"
                    value={inputValue}
                    autoFocus
                    onChange={(e) => setInputValue(e.target.value)}
                    onBlur={() => handleSaveConstraintValue(constraint.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveConstraintValue(constraint.id);
                      if (e.key === 'Escape') setEditingConstraintId(null);
                    }}
                    className="w-[45px] bg-white border border-indigo-300 rounded px-1 py-0 text-slate-800 text-[10px] font-mono font-bold focus:outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span>{constraint.value!.toFixed(2)}</span>
                )}
              </div>
            </Html>
          </group>
        );
      })}

      {/* 4. Render Geometric Constraint Icons (Horizontal, Vertical, etc.) */}
      {isSketchMode && activePlane && geometricConstraints.map((constraint) => {
        let pos: [number, number, number] | null = null;
        let icon = "";

        if (constraint.type === 'HORIZONTAL' || constraint.type === 'VERTICAL') {
          if (!constraint.edgeIds || constraint.edgeIds.length === 0) return null;
          const edge = sketchEdges[constraint.edgeIds[0]];
          if (!edge || edge.nodeIds.length < 2) return null;
          const n1 = sketchNodes[edge.nodeIds[0]];
          const n2 = sketchNodes[edge.nodeIds[1]];
          if (!n1 || !n2) return null;
          pos = get3DPointForPlane((n1.x + n2.x) / 2, (n1.y + n2.y) / 2, activePlane, activeBasis);
          icon = constraint.type === 'HORIZONTAL' ? "—" : "│";
        } else if (constraint.type === 'COINCIDENT') {
          if (!constraint.nodeIds || constraint.nodeIds.length === 0) return null;
          const n = sketchNodes[constraint.nodeIds[0]];
          if (!n) return null;
          pos = get3DPointForPlane(n.x, n.y, activePlane, activeBasis);
          // Offset slightly to avoid Z-fighting with node
          pos[0] += 1; pos[1] += 1;
          icon = "•";
        }

        if (!pos) return null;

        return (
          <Html key={constraint.id} position={pos} center>
            <div className="w-3 h-3 bg-emerald-500 border border-emerald-600 rounded-sm flex items-center justify-center text-[9px] text-white font-bold shadow-sm pointer-events-none opacity-80">
              {icon}
            </div>
          </Html>
        );
      })}

      {/* 5. Render Passive Sketches (Persistent Visible or Tree-Selected) */}
      {sketchesToRender.map((sketch) => {
        const basis = getBasisForPlane(sketch.plane, sketch.faceOrigin, sketch.faceNormal);
        const isSelected = selectedId === sketch.id && selectedSubNodeType === 'SKETCH';
        const color = isSelected ? "#ec4899" : "#64748b";
        const opacity = isSelected ? 0.9 : 0.6;
        const lineWidth = isSelected ? 2.5 : 1.0;

        // If we have parametric data, use it for richer rendering (including dimensions)
        if (sketch.sketchNodes && sketch.sketchEdges) {
          return (
            <group key={`passive_${sketch.id}`}>
              {/* Edges */}
              {Object.values(sketch.sketchEdges).map((edge: any) => {
                if (edge.nodeIds.length < 2) return null;
                const n1 = sketch.sketchNodes![edge.nodeIds[0]];
                const n2 = sketch.sketchNodes![edge.nodeIds[1]];
                if (!n1 || !n2) return null;

                let entityPoints: [number, number, number][] = [];
                if (edge.type === 'LINE' || edge.type === 'CENTER_LINE') {
                  entityPoints = [
                    get3DPointForPlane(n1.x, n1.y, sketch.plane, basis),
                    get3DPointForPlane(n2.x, n2.y, sketch.plane, basis)
                  ];
                } else if (edge.type === 'CIRCLE') {
                  const R = Math.hypot(n2.x - n1.x, n2.y - n1.y);
                  for (let k = 0; k <= 36; k++) {
                    const theta = (k / 36) * Math.PI * 2;
                    entityPoints.push(get3DPointForPlane(n1.x + R * Math.cos(theta), n1.y + R * Math.sin(theta), sketch.plane, basis));
                  }
                }

                return (
                  <Line
                    key={`${sketch.id}_edge_${edge.id}`}
                    points={entityPoints}
                    color={color}
                    lineWidth={lineWidth}
                    dashed={edge.type === 'CENTER_LINE' || edge.isConstruction}
                    dashSize={1.5}
                    gapSize={1.0}
                    transparent
                    opacity={opacity}
                    depthTest={false}
                  />
                );
              })}

              {/* Dimensions (Only if selected) */}
              {isSelected && sketch.sketchConstraints && Object.values(sketch.sketchConstraints)
                .filter((c: any) => c.type === 'DISTANCE' && c.nodeIds?.length === 2)
                .map((constraint: any) => {
                  const nA = sketch.sketchNodes![constraint.nodeIds[0]];
                  const nB = sketch.sketchNodes![constraint.nodeIds[1]];
                  if (!nA || !nB) return null;

                  const dx = nB.x - nA.x;
                  const dy = nB.y - nA.y;
                  const len = Math.hypot(dx, dy);
                  if (len < 1e-4) return null;

                  const ux = dx / len;
                  const uy = dy / len;
                  const nx = -uy;
                  const ny = ux;

                  const offsetDist = 12;
                  const pA = get3DPointForPlane(nA.x, nA.y, sketch.plane, basis);
                  const pB = get3DPointForPlane(nB.x, nB.y, sketch.plane, basis);
                  const pOffA = get3DPointForPlane(nA.x + nx * offsetDist, nA.y + ny * offsetDist, sketch.plane, basis);
                  const pOffB = get3DPointForPlane(nB.x + nx * offsetDist, nB.y + ny * offsetDist, sketch.plane, basis);
                  const pMid = get3DPointForPlane((nA.x + nB.x) / 2 + nx * offsetDist, (nA.y + nB.y) / 2 + ny * offsetDist, sketch.plane, basis);

                  return (
                    <group key={`${sketch.id}_dim_${constraint.id}`}>
                      <Line points={[pA, pOffA]} color="#94a3b8" lineWidth={0.5} dashed dashSize={0.5} gapSize={0.5} depthTest={false} />
                      <Line points={[pB, pOffB]} color="#94a3b8" lineWidth={0.5} dashed dashSize={0.5} gapSize={0.5} depthTest={false} />
                      <Line points={[pOffA, pOffB]} color={color} lineWidth={1.0} depthTest={false} />
                      <Html position={pMid} center>
                        <div className="bg-white/80 border border-pink-300 text-pink-700 px-1 rounded text-[9px] font-mono font-bold shadow-sm">
                          {constraint.value?.toFixed(1)}
                        </div>
                      </Html>
                    </group>
                  );
                })}
            </group>
          );
        }

        // Fallback to basic loop rendering for legacy features
        const loops: any[][] = Array.isArray(sketch.points[0]) && Array.isArray(sketch.points[0][0]) 
          ? sketch.points 
          : [sketch.points];

        return (
          <group key={`passive_${sketch.id}`}>
            {loops.map((loop, lIdx) => {
              const entityPoints: [number, number, number][] = loop.map((p: any) => 
                get3DPointForPlane(p[0], p[1], sketch.plane, basis)
              );
              // Close the loop for display
              if (entityPoints.length > 0) {
                entityPoints.push(entityPoints[0]);
              }

              return (
                <Line
                  key={`${sketch.id}_loop_${lIdx}`}
                  points={entityPoints}
                  color={isSelected ? "#ec4899" : "#64748b"}
                  lineWidth={isSelected ? 2.5 : 1.0}
                  transparent
                  opacity={isSelected ? 0.9 : 0.6}
                  depthTest={false}
                />
              );
            })}
          </group>
        );
      })}
    </group>
  );
};
