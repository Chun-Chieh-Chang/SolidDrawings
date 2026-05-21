'use client';

import React, { useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useCadStore } from '../store/useCadStore';
import { Line, Html } from '@react-three/drei';

interface DimensionInputProps {
  value: number;
  prefix?: string;
  onCommit: (newVal: number) => void;
}

const DimensionInput = ({ value, prefix = '', onCommit }: DimensionInputProps) => {
  const [tempVal, setTempVal] = useState(value.toFixed(1));
  const [isFocused, setIsFocused] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Sync value from props if not focused
  useEffect(() => {
    if (!isFocused) {
      setTempVal(value.toFixed(1));
    }
  }, [value, isFocused]);

  const handleCommit = () => {
    const parsed = parseFloat(tempVal);
    if (!isNaN(parsed) && parsed > 0.1) {
      onCommit(parsed);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1000);
    } else {
      setTempVal(value.toFixed(1));
    }
    setIsFocused(false);
  };

  return (
    <div 
      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md backdrop-blur-md transition-all border duration-300 shadow-lg ${
        justSaved 
          ? 'bg-emerald-950/90 border-emerald-500/80 shadow-emerald-950/30 text-emerald-300 scale-105' 
          : isFocused 
          ? 'bg-slate-900/95 border-sky-400/90 shadow-sky-950/30 text-white' 
          : 'bg-slate-900/85 border-slate-700/80 shadow-slate-950/40 text-slate-200'
      }`}
      style={{ pointerEvents: 'auto' }}
    >
      <span className="text-[12px] font-bold text-sky-400 font-mono select-none">{prefix}</span>
      <input
        type="text"
        value={tempVal}
        onChange={(e) => setTempVal(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={handleCommit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleCommit();
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="w-11 bg-transparent text-center font-mono font-bold text-[13px] border-none outline-none focus:ring-0 p-0 text-white"
      />
      <span className="text-[12px] text-slate-400 font-medium select-none">mm</span>
    </div>
  );
};

export const SketchPreview = () => {
  const { 
    sketchPoints, 
    activePlane, 
    isSketchMode,
    selectedEntityIds,
    setSelectedEntityIds,
    activeFaceOrigin,
    activeFaceNormal,
    selectedId,
    selectedSubNodeType,
    features,
    setSketchPoints,
    updateFeatureParams
  } = useCadStore();

  const [hoveredEntityId, setHoveredEntityId] = useState<string | null>(null);

  const selectedFeature = useMemo(() => features.find(f => f.id === selectedId), [features, selectedId]);

  // Determine if we are viewing/highlighting a stored sketch node in normal 3D mode (SolidWorks Tree Style)
  const isViewingStoredSketch = useMemo(() => {
    return !isSketchMode && selectedSubNodeType === 'SKETCH' && selectedFeature && 
      (selectedFeature.type === 'EXTRUDE' || selectedFeature.type === 'REVOLVE');
  }, [isSketchMode, selectedSubNodeType, selectedFeature]);

  // Get source coordinates list
  const pointsToRender = useMemo(() => {
    if (isViewingStoredSketch && selectedFeature) {
      return selectedFeature.parameters?.points || [];
    }
    return sketchPoints;
  }, [isViewingStoredSketch, selectedFeature, sketchPoints]);

  // Get active coordinate plane mapping
  const renderPlane = useMemo(() => {
    if (isViewingStoredSketch && selectedFeature) {
      return selectedFeature.parameters?.plane || 'FRONT';
    }
    return activePlane;
  }, [isViewingStoredSketch, selectedFeature, activePlane]);

  const renderFaceOrigin = useMemo(() => {
    if (isViewingStoredSketch && selectedFeature) {
      return selectedFeature.parameters?.faceOrigin;
    }
    return activeFaceOrigin;
  }, [isViewingStoredSketch, selectedFeature, activeFaceOrigin]);

  const renderFaceNormal = useMemo(() => {
    if (isViewingStoredSketch && selectedFeature) {
      return selectedFeature.parameters?.faceNormal;
    }
    return activeFaceNormal;
  }, [isViewingStoredSketch, selectedFeature, activeFaceNormal]);

  const faceBasis = useMemo(() => {
    if (renderPlane !== 'FACE' || !renderFaceOrigin || !renderFaceNormal) {
      return null;
    }
    const origin = new THREE.Vector3(...renderFaceOrigin);
    const normal = new THREE.Vector3(...renderFaceNormal).normalize();
    let xDir = new THREE.Vector3();
    if (Math.abs(normal.x) < 1e-5 && Math.abs(normal.y) < 1e-5) {
      xDir.set(1, 0, 0);
    } else {
      xDir.set(-normal.y, normal.x, 0).normalize();
    }
    const yDir = new THREE.Vector3().crossVectors(normal, xDir).normalize();
    return { origin, normal, xDir, yDir };
  }, [renderPlane, renderFaceOrigin, renderFaceNormal]);

  const get3DPoint = (u: number, v: number) => {
    if (renderPlane === 'FRONT') return new THREE.Vector3(u, v, 0);
    if (renderPlane === 'TOP') return new THREE.Vector3(u, 0, v);
    if (renderPlane === 'RIGHT') return new THREE.Vector3(0, u, v);
    if (renderPlane === 'FACE' && faceBasis) {
      return faceBasis.origin.clone()
        .addScaledVector(faceBasis.xDir, u)
        .addScaledVector(faceBasis.yDir, v);
    }
    return new THREE.Vector3(u, v, 0);
  };

  // 1. Parse pointsToRender into independent entities
  const entities = useMemo(() => {
    const list: any[] = [];
    let i = 0;
    
    while (i < pointsToRender.length) {
      // Circle check (37 points closed loop)
      if (i + 36 < pointsToRender.length) {
        const pStart = pointsToRender[i];
        const pEnd = pointsToRender[i + 36];
        if (pStart && pEnd && Math.hypot(pStart[0] - pEnd[0], pStart[1] - pEnd[1]) < 0.1) {
          list.push({
            id: `circle_${i}`,
            type: 'CIRCLE',
            name: `圓圈 C${list.filter(e => e.type === 'CIRCLE').length + 1}`,
            pointIndices: Array.from({ length: 37 }, (_, k) => i + k)
          });
          i += 37;
          continue;
        }
      }
      
      // Rectangle check (5 points closed loop)
      if (i + 4 < pointsToRender.length) {
        const pStart = pointsToRender[i];
        const pEnd = pointsToRender[i + 4];
        if (pStart && pEnd && Math.hypot(pStart[0] - pEnd[0], pStart[1] - pEnd[1]) < 0.1) {
          list.push({
            id: `rect_${i}`,
            type: 'RECTANGLE',
            name: `矩形 R${list.filter(e => e.type === 'RECTANGLE').length + 1}`,
            pointIndices: Array.from({ length: 5 }, (_, k) => i + k)
          });
          i += 5;
          continue;
        }
      }
      
      // Standard segment check
      const pCurr = pointsToRender[i];
      const pNext = pointsToRender[i + 1];
      if (pNext) {
        if (pNext[2] && pNext[2].includes('START')) {
          i += 1;
        } else if (pCurr[2] && pCurr[2].includes('CENTER_LINE')) {
          list.push({
            id: `cline_${i}`,
            type: 'CENTER_LINE',
            name: `中心線 CL${list.filter(e => e.type === 'CENTER_LINE').length + 1}`,
            pointIndices: [i, i + 1]
          });
          i += 1;
        } else if (pNext[2] === 'ARC_CONTROL') {
          const pEnd = pointsToRender[i + 2];
          if (pEnd) {
            list.push({
              id: `arc_${i}`,
              type: 'LINE',
              name: `圓弧 A${list.filter(e => e.type === 'LINE' && e.name.includes('圓弧')).length + 1}`,
              pointIndices: [i, i + 1, i + 2]
            });
            i += 2;
          } else {
            list.push({
              id: `line_${i}`,
              type: 'LINE',
              name: `線段 L${list.filter(e => e.type === 'LINE' && !e.name.includes('圓弧')).length + 1}`,
              pointIndices: [i, i + 1]
            });
            i += 1;
          }
        } else {
          list.push({
            id: `line_${i}`,
            type: 'LINE',
            name: `線段 L${list.filter(e => e.type === 'LINE' && !e.name.includes('圓弧')).length + 1}`,
            pointIndices: [i, i + 1]
          });
          i += 1;
        }
      } else {
        i += 1;
      }
    }
    return list;
  }, [pointsToRender]);

  // 2. Generate 3D point array for a single entity
  const getEntityPoints = (ent: any): [number, number, number][] => {
    const pts: [number, number, number][] = [];
    const indices = ent.pointIndices;
    let idx = 0;
    
    while (idx < indices.length) {
      const ptIdx = indices[idx];
      const p_curr = pointsToRender[ptIdx];
      if (!p_curr) {
        idx++;
        continue;
      }
      
      const pt3d = get3DPoint(p_curr[0], p_curr[1]);
      
      // ARC special interpolation
      if (p_curr[2] === 'ARC_CONTROL') {
        const p_prev_idx = indices[idx - 1];
        const p_end_idx = indices[idx + 1];
        if (p_prev_idx !== undefined && p_end_idx !== undefined) {
          const p_prev = pointsToRender[p_prev_idx];
          const p_end = pointsToRender[p_end_idx];
          if (p_prev && p_end) {
            const p0 = get3DPoint(p_prev[0], p_prev[1]);
            const p1 = get3DPoint(p_curr[0], p_curr[1]);
            const p2 = get3DPoint(p_end[0], p_end[1]);
            const curve = new THREE.CatmullRomCurve3([p0, p1, p2]);
            const curvePts = curve.getPoints(15);
            for (let k = 1; k < curvePts.length; k++) {
              pts.push([curvePts[k].x, curvePts[k].y, curvePts[k].z]);
            }
            idx += 2;
            continue;
          }
        }
      }
      
      pts.push([pt3d.x, pt3d.y, pt3d.z]);
      idx++;
    }
    return pts;
  };

  // 3. Selection handler
  const handleEntityClick = (entId: string) => {
    if (!isSketchMode) return;
    const isSelected = selectedEntityIds.includes(entId);
    if (isSelected) {
      setSelectedEntityIds(selectedEntityIds.filter(id => id !== entId));
    } else {
      if (selectedEntityIds.length >= 2) {
        setSelectedEntityIds([selectedEntityIds[1], entId]);
      } else {
        setSelectedEntityIds([...selectedEntityIds, entId]);
      }
    }
  };

  // 4. Node markers (filtering out circle boundary points and adding a single center + perimeter marker instead)
  const markers = useMemo(() => {
    if (!isSketchMode) return [];
    const list: any[] = [];
    const hiddenIndices = new Set<number>();

    // Scan entities for circles
    entities.forEach((ent) => {
      if (ent.type === 'CIRCLE') {
        const indices = ent.pointIndices;
        const pts = indices.map((idx: number) => pointsToRender[idx]);
        const us = pts.map((p: any) => p[0]);
        const vs = pts.map((p: any) => p[1]);
        const minU = Math.min(...us);
        const maxU = Math.max(...us);
        const minV = Math.min(...vs);
        const maxV = Math.max(...vs);
        const cU = (minU + maxU) / 2;
        const cV = (minV + maxV) / 2;
        const radius = (maxU - minU) / 2;

        // Hide all 37 circumference points
        indices.forEach((idx: number) => hiddenIndices.add(idx));

        // Add 1 center marker (SolidWorks Style!)
        list.push({
          pos: get3DPoint(cU, cV),
          isCenter: true,
          isControl: false,
          isCorner: false,
          isCenterline: false,
          isStart: false
        });

        // Add 1 circumference point as a drag handle (SolidWorks Style!)
        list.push({
          pos: get3DPoint(cU + radius, cV),
          isCenter: false,
          isControl: true,
          isCorner: false,
          isCenterline: false,
          isStart: false
        });
      }
    });

    // Add remaining non-circle sketch points
    pointsToRender.forEach((pt: any[], idx: number) => {
      if (hiddenIndices.has(idx)) return;
      const isControl = pt[2] === 'ARC_CONTROL';
      const isCenter = pt[2] === 'CIRCLE_CENTER';
      const isCorner = pt[2] === 'RECT_CORNER';
      const isCenterline = pt[2] === 'CENTER_LINE';
      const pos = get3DPoint(pt[0], pt[1]);
      list.push({ pos, isControl, isCenter, isCorner, isCenterline, isStart: idx === 0 });
    });

    return list;
  }, [pointsToRender, entities, renderPlane, isSketchMode]);

  // 5. Parametric drive solver to scale geometry coordinates upon dimension input commit
  const commitValue = (ent: any, dimensionType: string, newValue: number) => {
    const currentPts = JSON.parse(JSON.stringify(pointsToRender));
    let isChanged = false;

    if (ent.type === 'CIRCLE') {
      const indices = ent.pointIndices;
      const pts = indices.map((idx: number) => currentPts[idx]);
      const us = pts.map((p: any) => p[0]);
      const vs = pts.map((p: any) => p[1]);
      const minU = Math.min(...us);
      const maxU = Math.max(...us);
      const minV = Math.min(...vs);
      const maxV = Math.max(...vs);
      const cU = (minU + maxU) / 2;
      const cV = (minV + maxV) / 2;

      // New radius based on new diameter input
      const rNew = newValue / 2;

      // Re-generate circle 37 points precisely
      for (let k = 0; k <= 36; k++) {
        const idx = indices[k];
        if (currentPts[idx]) {
          const theta = (k / 36) * Math.PI * 2;
          currentPts[idx] = [
            parseFloat((cU + rNew * Math.cos(theta)).toFixed(3)),
            parseFloat((cV + rNew * Math.sin(theta)).toFixed(3)),
            k === 0 ? 'START' : undefined
          ];
        }
      }
      isChanged = true;
    }

    else if (ent.type === 'RECTANGLE') {
      const indices = ent.pointIndices;
      const p0 = currentPts[indices[0]];
      const p1 = currentPts[indices[1]];
      const p2 = currentPts[indices[2]];
      const p3 = currentPts[indices[3]];
      
      if (p0 && p1 && p2 && p3) {
        const u0 = p0[0], v0 = p0[1];
        const u1 = p1[0], v1 = p1[1];
        const u2 = p2[0], v2 = p2[1];
        const u3 = p3[0], v3 = p3[1];

        if (dimensionType === 'WIDTH') {
          const sign = u1 >= u0 ? 1 : -1;
          const uNew = u0 + sign * newValue;
          currentPts[indices[1]] = [parseFloat(uNew.toFixed(3)), v1, p1[2]];
          currentPts[indices[2]] = [parseFloat(uNew.toFixed(3)), v2, p2[2]];
          isChanged = true;
        } else if (dimensionType === 'HEIGHT') {
          const sign = v2 >= v1 ? 1 : -1;
          const vNew = v1 + sign * newValue;
          currentPts[indices[2]] = [u2, parseFloat(vNew.toFixed(3)), p2[2]];
          currentPts[indices[3]] = [u3, parseFloat(vNew.toFixed(3)), p3[2]];
          isChanged = true;
        }
      }
    }

    else if (ent.type === 'LINE' || ent.type === 'CENTER_LINE') {
      const idx0 = ent.pointIndices[0];
      const idx1 = ent.pointIndices[1];
      const p0 = currentPts[idx0];
      const p1 = currentPts[idx1];

      if (p0 && p1) {
        const u1 = p0[0], v1 = p0[1];
        const u2 = p1[0], v2 = p1[1];
        const dist = Math.hypot(u2 - u1, v2 - v1);

        if (dist > 1e-4) {
          const du = (u2 - u1) / dist;
          const dv = (v2 - v1) / dist;

          const uNew = u1 + du * newValue;
          const vNew = v1 + dv * newValue;

          const deltaU = uNew - u2;
          const deltaV = vNew - v2;

          // Update tail node
          currentPts[idx1] = [parseFloat(uNew.toFixed(3)), parseFloat(vNew.toFixed(3)), p1[2]];

          // Shift subsequent points in continuous chain to prevent sketch shape deformation
          for (let k = idx1 + 1; k < currentPts.length; k++) {
            const pt = currentPts[k];
            if (pt) {
              if (pt[2] && pt[2].includes('START')) {
                break; // Stop shifting when hitting new contour boundary
              }
              currentPts[k] = [
                parseFloat((pt[0] + deltaU).toFixed(3)),
                parseFloat((pt[1] + deltaV).toFixed(3)),
                pt[2]
              ];
            }
          }
          isChanged = true;
        }
      }
    }

    if (isChanged) {
      if (isSketchMode) {
        setSketchPoints(currentPts);
      } else if (isViewingStoredSketch && selectedId) {
        updateFeatureParams(selectedId, { points: currentPts });
      }
    }
  };

  if ((!isSketchMode && !isViewingStoredSketch) || !renderPlane || pointsToRender.length === 0) return null;

  return (
    <group>
      {/* Draw each entity dynamically with full hover/click interaction */}
      {entities.map((ent) => {
        const entityPoints = getEntityPoints(ent);
        if (entityPoints.length < 2) return null;

        const isSelected = isViewingStoredSketch || selectedEntityIds.includes(ent.id);
        const isHovered = hoveredEntityId === ent.id;
        const isCenterline = ent.type === 'CENTER_LINE';

        return (
          <group key={ent.id}>
            {/* Elegant high-precision visible line */}
            <Line
              points={entityPoints}
              color={
                isSelected 
                  ? "#ec4899" // Vibrant Magenta when selected (SolidWorks selection style)
                  : isHovered 
                  ? "#f59e0b" // Warm Amber Gold on hover (SolidWorks hover highlight style)
                  : isCenterline 
                  ? "#6b7280" // Muted grey for centerline
                  : "#3b82f6" // Royal Blue for standard lines
              }
              lineWidth={isSelected ? 5.5 : isHovered ? 4.5 : 3.0}
              dashed={isCenterline}
              dashSize={1.5}
              gapSize={1.0}
              depthTest={false}
            />
            
            {/* Thick transparent interactive click-receiver layer (Solves thin-line click accuracy) */}
            <Line
              points={entityPoints}
              color="#000000"
              lineWidth={16.0}
              opacity={0.0}
              transparent
              onClick={(e) => {
                e.stopPropagation();
                handleEntityClick(ent.id);
              }}
              onPointerOver={(e) => {
                if (!isSketchMode) return;
                e.stopPropagation();
                setHoveredEntityId(ent.id);
              }}
              onPointerOut={(e) => {
                if (!isSketchMode) return;
                setHoveredEntityId(null);
              }}
            />
          </group>
        );
      })}

      {/* Render interactive smart dimensions overlay */}
      {entities.map((ent) => {
        if (ent.type === 'CIRCLE') {
          const indices = ent.pointIndices;
          const pts = indices.map((idx: number) => pointsToRender[idx]);
          if (pts.length === 0 || !pts[0]) return null;
          const us = pts.map((p: any) => p[0]);
          const vs = pts.map((p: any) => p[1]);
          const minU = Math.min(...us);
          const maxU = Math.max(...us);
          const minV = Math.min(...vs);
          const maxV = Math.max(...vs);
          const cU = (minU + maxU) / 2;
          const cV = (minV + maxV) / 2;
          const radius = (maxU - minU) / 2;
          const diameter = radius * 2;

          const angle = Math.PI / 4; // 45 degrees offset for diameter badge
          const uDim = cU + radius * Math.cos(angle);
          const vDim = cV + radius * Math.sin(angle);
          const pos3d = get3DPoint(uDim, vDim);

          return (
            <Html key={`dim_circle_${ent.id}`} position={pos3d} center distanceFactor={15}>
              <DimensionInput 
                value={diameter} 
                prefix="Ø" 
                onCommit={(val) => commitValue(ent, 'DIAMETER', val)} 
              />
            </Html>
          );
        }

        if (ent.type === 'RECTANGLE') {
          const indices = ent.pointIndices;
          const p0 = pointsToRender[indices[0]];
          const p1 = pointsToRender[indices[1]];
          const p2 = pointsToRender[indices[2]];
          if (p0 && p1 && p2) {
            const u0 = p0[0], v0 = p0[1];
            const u1 = p1[0], v1 = p1[1];
            const u2 = p2[0], v2 = p2[1];

            const width = Math.abs(u1 - u0);
            const height = Math.abs(v2 - v1);

            const midU_W = (u0 + u1) / 2;
            const offsetV = (v2 > v0) ? -2.0 : 2.0;
            const vW = v0 + offsetV;
            const pos3d_W = get3DPoint(midU_W, vW);

            const midV_H = (v1 + v2) / 2;
            const offsetU = (u1 > u0) ? 2.0 : -2.0;
            const uH = u1 + offsetU;
            const pos3d_H = get3DPoint(uH, midV_H);

            return (
              <group key={`dim_rect_${ent.id}`}>
                <Html position={pos3d_W} center distanceFactor={15}>
                  <DimensionInput 
                    value={width} 
                    prefix="W" 
                    onCommit={(val) => commitValue(ent, 'WIDTH', val)} 
                  />
                </Html>
                <Html position={pos3d_H} center distanceFactor={15}>
                  <DimensionInput 
                    value={height} 
                    prefix="H" 
                    onCommit={(val) => commitValue(ent, 'HEIGHT', val)} 
                  />
                </Html>
              </group>
            );
          }
        }

        if (ent.type === 'LINE' || ent.type === 'CENTER_LINE') {
          // Skip arcs / segments with too many control points
          if (ent.pointIndices.length > 2) return null;
          
          const idx0 = ent.pointIndices[0];
          const idx1 = ent.pointIndices[1];
          const p0 = pointsToRender[idx0];
          const p1 = pointsToRender[idx1];
          if (p0 && p1) {
            const u1 = p0[0], v1 = p0[1];
            const u2 = p1[0], v2 = p1[1];
            const length = Math.hypot(u2 - u1, v2 - v1);

            const midU = (u1 + u2) / 2;
            const midV = (v1 + v2) / 2;
            const pos3d = get3DPoint(midU, midV);

            return (
              <Html key={`dim_line_${ent.id}`} position={pos3d} center distanceFactor={15}>
                <DimensionInput 
                  value={length} 
                  prefix="L" 
                  onCommit={(val) => commitValue(ent, 'LENGTH', val)} 
                />
              </Html>
            );
          }
        }

        return null;
      })}

      {/* Draw node markers only during active drawing mode */}
      {isSketchMode && markers.map((m, i) => (
        <mesh key={i} position={m.pos}>
          <sphereGeometry args={[m.isControl || m.isCenter || m.isCorner ? 0.35 : 0.5, 8, 8]} />
          <meshBasicMaterial
            depthTest={false}
            color={
              m.isCenter
                ? "#f59e0b" // Center point: Amber Gold
                : m.isCorner
                ? "#8b5cf6" // Rectangle Corner: Purple
                : m.isStart
                ? "#ef4444" // Start Point: Red
                : m.isControl
                ? "#10b981" // Arc Control Point: Emerald Green
                : m.isCenterline
                ? "#6b7280" // Centerline Node: Slate Grey
                : "#3b82f6" // Standard Line Node: Royal Blue
            }
          />
        </mesh>
      ))}
    </group>
  );
};
