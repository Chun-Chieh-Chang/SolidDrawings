import React, { useState, useMemo } from 'react';
import { Plane, Text, Html, Sphere, Line } from '@react-three/drei';
import { useCadStore } from '../store/useCadStore';
import * as THREE from 'three';

export const DatumPlanes = () => {
  const { 
    activePlane, setActivePlane, 
    isSketchMode, setSketchMode,
    sketchPoints, setSketchPoints,
    sketchTool, setSketchTool,
    gridSnap,
    setSketchRelations, setEditingFeatureId,
    contextMenu, setContextMenu,
    meshData,
    sketchNewChain, setSketchNewChain,
    activeFaceOrigin,
    activeFaceNormal,
    activeFaceId,
    referencePlanes,
    referenceAxes
  } = useCadStore();
  
  const [hovered, setHovered] = useState<string | null>(null);
  
  // Click-Drag and Auto Arc Switch detection states
  const [dragStartUV, setDragStartUV] = useState<{u: number, v: number} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastClickedUV, setLastClickedUV] = useState<{u: number, v: number} | null>(null);
  const [hasMovedAway, setHasMovedAway] = useState(false);

  // --- O-SNAP (Object Snapping) Engine ---
  const [cursorState, setCursorState] = useState<{u: number, v: number, type: string | null} | null>(null);

  const faceBasis = useMemo(() => {
    if (activePlane !== 'FACE' || !activeFaceOrigin || !activeFaceNormal) {
      return null;
    }
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
    if (!activePlane || ['FRONT', 'TOP', 'RIGHT', 'FACE'].includes(activePlane)) {
      return null;
    }
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

  const getCustomFaceUV = (point: THREE.Vector3) => {
    const basis = activeBasis;
    if (!basis) return { u: 0, v: 0 };
    const diff = point.clone().sub(basis.origin);
    const u = diff.dot(basis.xDir);
    const v = diff.dot(basis.yDir);
    return { u, v };
  };

  const get3DPnt = (u: number, v: number) => {
    if (activePlane === 'FRONT') return new THREE.Vector3(u, v, 0);
    if (activePlane === 'TOP') return new THREE.Vector3(u, 0, v);
    if (activePlane === 'RIGHT') return new THREE.Vector3(0, u, v);
    const basis = activeBasis;
    if (basis) {
      return basis.origin.clone()
        .addScaledVector(basis.xDir, u)
        .addScaledVector(basis.yDir, v);
    }
    return new THREE.Vector3(u, v, 0);
  };

  const featureSnapPoints = useMemo(() => {
    if (!isSketchMode || !activePlane || !meshData) return [];
    
    const points: [number, number][] = [];
    const threshold = 1e-4; // Dedup threshold
    
    for (const mesh of meshData) {
      if (!mesh.data || !mesh.data.vertices) continue;
      const verts = mesh.data.vertices;
      for (let i = 0; i < verts.length; i += 3) {
        const x = verts[i];
        const y = verts[i + 1];
        const z = verts[i + 2];
        
        let u = 0, v = 0;
        if (activePlane === 'FRONT') { u = x; v = y; }
        else if (activePlane === 'TOP') { u = x; v = z; }
        else if (activePlane === 'RIGHT') { u = y; v = z; }
        else {
          const basis = activeBasis;
          if (basis) {
            const P = new THREE.Vector3(x, y, z);
            const diff = P.clone().sub(basis.origin);
            u = diff.dot(basis.xDir);
            v = diff.dot(basis.yDir);
          } else {
            continue;
          }
        }
        
        // Deduplicate
        const exists = points.some(p => Math.abs(p[0] - u) < threshold && Math.abs(p[1] - v) < threshold);
        if (!exists) points.push([u, v]);
      }
    }
    return points;
  }, [isSketchMode, activePlane, meshData, activeBasis]);

  const getSnappedUV = (rawU: number, rawV: number) => {
    const SNAP_RADIUS = 2.5;
    
    // 1. Origin Priority
    if (Math.hypot(rawU, rawV) < SNAP_RADIUS) {
      return { u: 0, v: 0, type: 'ORIGIN' };
    }
    
    // 2. Existing Sketch Points
    for (const pt of sketchPoints) {
      if (Math.hypot(rawU - pt[0], rawV - pt[1]) < SNAP_RADIUS) {
        return { u: pt[0], v: pt[1], type: 'SKETCH_POINT' };
      }
    }
    
    // 3. 3D Feature Vertices
    for (const pt of featureSnapPoints) {
      if (Math.hypot(rawU - pt[0], rawV - pt[1]) < SNAP_RADIUS) {
        return { u: pt[0], v: pt[1], type: 'FEATURE_VERTEX' };
      }
    }
    
    // 4. Grid Snap
    if (gridSnap) {
      return { u: Math.round(rawU), v: Math.round(rawV), type: 'GRID' };
    }
    
    return { u: rawU, v: rawV, type: null };
  };

  const handlePointerDown = (plane: string, event: any) => {
    if (!isSketchMode || activePlane !== plane) return;
    event.stopPropagation();
    
    const point = event.point;
    let rawU = 0, rawV = 0;
    if (plane === 'FRONT') { rawU = point.x; rawV = point.y; }
    else if (plane === 'TOP') { rawU = point.x; rawV = point.z; }
    else if (plane === 'RIGHT') { rawU = point.y; rawV = point.z; }
    else {
      const uv = getCustomFaceUV(point);
      rawU = uv.u;
      rawV = uv.v;
    }
    
    const snapped = getSnappedUV(rawU, rawV);
    setDragStartUV({ u: snapped.u, v: snapped.v });
    setIsDragging(false);
  };

  const handlePointerUp = (plane: string, event: any) => {
    if (!isSketchMode || activePlane !== plane || !dragStartUV) return;
    event.stopPropagation();
    
    const point = event.point;
    let rawU = 0, rawV = 0;
    if (plane === 'FRONT') { rawU = point.x; rawV = point.y; }
    else if (plane === 'TOP') { rawU = point.x; rawV = point.z; }
    else if (plane === 'RIGHT') { rawU = point.y; rawV = point.z; }
    else {
      const uv = getCustomFaceUV(point);
      rawU = uv.u;
      rawV = uv.v;
    }
    
    const snapped = getSnappedUV(rawU, rawV);
    const u = snapped.u;
    const v = snapped.v;
    
    const dist = Math.hypot(u - dragStartUV.u, v - dragStartUV.v);
    
    if (isDragging && dist > 0.8) {
      // Click-Drag (Single Segment Draw)
      if (sketchTool === 'LINE' || sketchTool === 'CENTER_LINE') {
        const startTag = sketchTool === 'CENTER_LINE' ? 'START,CENTER_LINE' : 'START';
        const endTag = sketchTool === 'CENTER_LINE' ? 'CENTER_LINE' : undefined;
        
        const startPt = [dragStartUV.u, dragStartUV.v, startTag];
        const endPt = endTag ? [u, v, endTag] : [u, v];
        
        setSketchPoints([...sketchPoints, startPt, endPt]);
        setSketchNewChain(true);
      } else if (sketchTool === 'MIDPOINT_LINE') {
        const u_c = dragStartUV.u;
        const v_c = dragStartUV.v;
        const oppU = 2 * u_c - u;
        const oppV = 2 * v_c - v;
        
        const startPt = [oppU, oppV, 'START'];
        const endPt = [u, v];
        
        setSketchPoints([...sketchPoints, startPt, endPt]);
        setSketchNewChain(true);
      }
    } else {
      // Click-Click (Continuous Draw)
      handlePlaneClick(plane, event);
    }
    
    setDragStartUV(null);
    setIsDragging(false);
  };

  const handlePointerMove = (plane: string, event: any) => {
    if (!isSketchMode || activePlane !== plane) {
      if (cursorState) setCursorState(null);
      return;
    }
    event.stopPropagation();
    
    const point = event.point;
    let rawU = 0, rawV = 0;
    if (plane === 'FRONT') { rawU = point.x; rawV = point.y; }
    else if (plane === 'TOP') { rawU = point.x; rawV = point.z; }
    else if (plane === 'RIGHT') { rawU = point.y; rawV = point.z; }
    else {
      const uv = getCustomFaceUV(point);
      rawU = uv.u;
      rawV = uv.v;
    }
    
    const snapped = getSnappedUV(rawU, rawV);
    setCursorState(snapped);
    
    // Drag detection
    if (dragStartUV) {
      const dist = Math.hypot(snapped.u - dragStartUV.u, snapped.v - dragStartUV.v);
      if (dist > 0.5) {
        setIsDragging(true);
      }
    }
    
    // Arc Auto-switch detection
    if (lastClickedUV && sketchTool === 'LINE' && sketchPoints.length > 0) {
      const dist = Math.hypot(rawU - lastClickedUV.u, rawV - lastClickedUV.v);
      if (dist > 3.0) {
        setHasMovedAway(true);
      }
      if (hasMovedAway && dist < 1.0) {
        // Return to previous endpoint -> Auto switch to ARC!
        setSketchTool('ARC');
        setHasMovedAway(false);
        setLastClickedUV(null);
      }
    }
  };

  const size = 60;
  const opacity = 0.1;
  const hoverOpacity = 0.3;
  const activeOpacity = 0.5;

  const handlePlaneClick = (plane: string, event: any) => {
    if (!isSketchMode) {
      event.stopPropagation();
      setEditingFeatureId(null);
      setSketchPoints([]);
      setSketchRelations([]);
      setActivePlane(plane);
      setContextMenu({
        plane,
        position: [event.point.x, event.point.y, event.point.z]
      });
      return;
    }

    if (activePlane !== plane) return;

    event.stopPropagation();

    const point = event.point;
    let rawU = 0, rawV = 0;

    if (plane === 'FRONT') { rawU = point.x; rawV = point.y; }
    else if (plane === 'TOP') { rawU = point.x; rawV = point.z; }
    else if (plane === 'RIGHT') { rawU = point.y; rawV = point.z; }
    else {
      const uv = getCustomFaceUV(point);
      rawU = uv.u;
      rawV = uv.v;
    }

    const snapped = getSnappedUV(rawU, rawV);
    const u = snapped.u;
    const v = snapped.v;

    // --- CIRCLE DRAWING TOOL ---
    if (sketchTool === 'CIRCLE') {
      const lastPt = sketchPoints[sketchPoints.length - 1];
      if (sketchPoints.length === 0 || (lastPt && lastPt[2] !== 'CIRCLE_CENTER')) {
        setSketchPoints([...sketchPoints, [u, v, 'CIRCLE_CENTER']]);
      } else {
        const [u_c, v_c] = lastPt;
        const R = Math.hypot(u - u_c, v - v_c);
        if (R > 0.1) {
          const circlePoints: any[] = [];
          const DIVISIONS = 36;
          for (let k = 0; k <= DIVISIONS; k++) {
            const theta = (k / DIVISIONS) * Math.PI * 2;
            circlePoints.push([
              parseFloat((u_c + R * Math.cos(theta)).toFixed(3)),
              parseFloat((v_c + R * Math.sin(theta)).toFixed(3)),
              k === 0 ? 'START' : undefined
            ]);
          }
          setSketchPoints([...sketchPoints.slice(0, -1), ...circlePoints]);
          setSketchNewChain(true);
        }
      }
      return;
    }

    // --- RECTANGLE DRAWING TOOL ---
    if (sketchTool === 'RECTANGLE') {
      const lastPt = sketchPoints[sketchPoints.length - 1];
      if (sketchPoints.length === 0 || (lastPt && lastPt[2] !== 'RECT_CORNER')) {
        setSketchPoints([...sketchPoints, [u, v, 'RECT_CORNER']]);
      } else {
        const [u1, v1] = lastPt;
        const rectPoints = [
          [u1, v1, 'START'],
          [u, v1],
          [u, v],
          [u1, v],
          [u1, v]
        ];
        setSketchPoints([...sketchPoints.slice(0, -1), ...rectPoints]);
        setSketchNewChain(true);
      }
      return;
    }

    // --- MIDPOINT_LINE DRAWING TOOL ---
    if (sketchTool === 'MIDPOINT_LINE') {
      const lastPt = sketchPoints[sketchPoints.length - 1];
      if (lastPt && lastPt[2] && lastPt[2].includes('MIDPOINT_CENTER')) {
        const u_c = lastPt[0];
        const v_c = lastPt[1];
        const oppU = 2 * u_c - u;
        const oppV = 2 * v_c - v;

        const startPt = [oppU, oppV, 'START'];
        const endPt = [u, v];

        setSketchPoints([...sketchPoints.slice(0, -1), startPt, endPt]);
        setSketchNewChain(true);
      } else {
        const centerPt = [u, v, sketchNewChain ? 'START,MIDPOINT_CENTER' : 'MIDPOINT_CENTER'];
        setSketchPoints([...sketchPoints, centerPt]);
        setSketchNewChain(false);
      }
      return;
    }

    // --- CENTER_LINE DRAWING TOOL ---
    if (sketchTool === 'CENTER_LINE') {
      const startTag = sketchNewChain ? 'START,CENTER_LINE' : 'CENTER_LINE';
      const newPt = [u, v, startTag];
      setSketchPoints([...sketchPoints, newPt]);
      setSketchNewChain(false);
      setLastClickedUV({ u, v });
      setHasMovedAway(false);
      return;
    }

    // --- STANDARD LINE & ARC DRAWING ---
    let startTag: string | undefined = undefined;
    if (sketchNewChain) {
      startTag = 'START';
    }
    
    let newPt: any = [u, v, startTag];
    if (sketchTool === 'ARC' && sketchPoints.length % 3 === 1) {
      newPt = [u, v, 'ARC_CONTROL'];
    }

    const newPoints: any[] = [...sketchPoints, newPt];
    
    const isClosing = newPoints.length > 2 && 
      (Math.hypot(newPoints[0][0] - u, newPoints[0][1] - v) < 2);

    if (isClosing) {
      const firstPoint = newPoints[0];
      setSketchPoints([...newPoints.slice(0, -1), [firstPoint[0], firstPoint[1], firstPoint[2]]]);
      setSketchNewChain(true);
    } else {
      setSketchPoints(newPoints);
      setSketchNewChain(false);
      setLastClickedUV({ u, v });
      setHasMovedAway(false);
      
      if (sketchTool === 'ARC' && newPoints.length % 3 === 0) {
        setSketchTool('LINE');
      }
    }
  };

  const handlePlaneDoubleClick = (plane: string, event: any) => {
    if (!isSketchMode || activePlane !== plane) return;
    event.stopPropagation();
    
    let newPts = [...sketchPoints];
    if (newPts.length > 1) {
      const last = newPts[newPts.length - 1];
      const prev = newPts[newPts.length - 2];
      if (Math.hypot(last[0] - prev[0], last[1] - prev[1]) < 1.0) {
        newPts.pop(); // Remove duplicate
      }
    }
    setSketchPoints(newPts);
    setSketchNewChain(true);
  };

  const getOpacity = (plane: string) => {
    if (activePlane === plane) return activeOpacity;
    if (hovered === plane) return hoverOpacity;
    return opacity;
  };

  const renderSnapCursor = () => {
    if (!isSketchMode || !cursorState) return null;
    
    const snappedP = get3DPnt(cursorState.u, cursorState.v);
    const position: [number, number, number] = [snappedP.x, snappedP.y, snappedP.z];

    const isSnapped = cursorState.type !== null;
    const color = isSnapped ? "#f59e0b" : "#3b82f6"; // Amber Gold for snapped, Blue for free

    return (
      <group position={position}>
        <Sphere args={[isSnapped ? 0.8 : 0.4, 16, 16]}>
          <meshBasicMaterial color={color} depthTest={false} />
        </Sphere>
        {sketchTool === 'ARC' && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.0, 1.3, 32]} />
            <meshBasicMaterial color="#ec4899" depthTest={false} transparent opacity={0.7} />
          </mesh>
        )}
        {isSnapped && (
          <Html position={[1.5, 1.5, 0]} center style={{ pointerEvents: 'none' }}>
            <div className="bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded shadow-sm border border-amber-200 text-[14px] font-mono font-bold text-amber-600 whitespace-nowrap">
              {cursorState.type === 'ORIGIN' ? '◎ Origin' : 
               cursorState.type === 'SKETCH_POINT' ? '● EndPoint' : 
               cursorState.type === 'FEATURE_VERTEX' ? '♦ Vertex' : 
               '⊞ Grid'}
            </div>
          </Html>
        )}
      </group>
    );
  };

  const renderRubberBand = () => {
    if (!isSketchMode || !cursorState || sketchPoints.length === 0) return null;

    const snappedP = get3DPnt(cursorState.u, cursorState.v);

    if (sketchTool === 'LINE' || sketchTool === 'CENTER_LINE') {
      const lastPt = sketchPoints[sketchPoints.length - 1];
      if (lastPt) {
        const tag = lastPt[2];
        if (tag === 'CIRCLE_CENTER' || tag === 'RECT_CORNER' || sketchNewChain) {
          return null;
        }

        const last3D = get3DPnt(lastPt[0], lastPt[1]);
        const pts = [
          [last3D.x, last3D.y, last3D.z],
          [snappedP.x, snappedP.y, snappedP.z]
        ] as [number, number, number][];

        return (
          <Line
            points={pts}
            color={sketchTool === 'CENTER_LINE' ? '#94a3b8' : '#3b82f6'}
            lineWidth={2.0}
            dashed
            dashSize={1.5}
            gapSize={1.0}
            depthTest={false}
          />
        );
      }
    }

    if (sketchTool === 'MIDPOINT_LINE') {
      const lastPt = sketchPoints[sketchPoints.length - 1];
      if (lastPt && lastPt[2] && lastPt[2].includes('MIDPOINT_CENTER')) {
        const last3D = get3DPnt(lastPt[0], lastPt[1]);
        const oppU = lastPt[0] - (cursorState.u - lastPt[0]);
        const oppV = lastPt[1] - (cursorState.v - lastPt[1]);
        const opp3D = get3DPnt(oppU, oppV);

        const pts = [
          [opp3D.x, opp3D.y, opp3D.z],
          [last3D.x, last3D.y, last3D.z],
          [snappedP.x, snappedP.y, snappedP.z]
        ] as [number, number, number][];

        return (
          <Line
            points={pts}
            color="#3b82f6"
            lineWidth={2.0}
            dashed
            dashSize={1.5}
            gapSize={1.0}
            depthTest={false}
          />
        );
      }
    }

    if (sketchTool === 'CIRCLE') {
      const lastPt = sketchPoints[sketchPoints.length - 1];
      if (lastPt && lastPt[2] === 'CIRCLE_CENTER') {
        const u_c = lastPt[0];
        const v_c = lastPt[1];
        const R = Math.hypot(cursorState.u - u_c, cursorState.v - v_c);
        if (R > 0.1) {
          const circlePts: [number, number, number][] = [];
          const DIVISIONS = 36;
          for (let k = 0; k <= DIVISIONS; k++) {
            const theta = (k / DIVISIONS) * Math.PI * 2;
            const p3D = get3DPnt(u_c + R * Math.cos(theta), v_c + R * Math.sin(theta));
            circlePts.push([p3D.x, p3D.y, p3D.z]);
          }
          return (
            <Line
              points={circlePts}
              color="#3b82f6"
              lineWidth={1.5}
              dashed
              dashSize={1.5}
              gapSize={1.0}
              depthTest={false}
            />
          );
        }
      }
    }

    if (sketchTool === 'RECTANGLE') {
      const lastPt = sketchPoints[sketchPoints.length - 1];
      if (lastPt && lastPt[2] === 'RECT_CORNER') {
        const u1 = lastPt[0];
        const v1 = lastPt[1];
        const u2 = cursorState.u;
        const v2 = cursorState.v;
        
        const rPts = [
          get3DPnt(u1, v1),
          get3DPnt(u2, v1),
          get3DPnt(u2, v2),
          get3DPnt(u1, v2),
          get3DPnt(u1, v1)
        ].map(p => [p.x, p.y, p.z]) as [number, number, number][];

        return (
          <Line
            points={rPts}
            color="#3b82f6"
            lineWidth={1.5}
            dashed
            dashSize={1.5}
            gapSize={1.0}
            depthTest={false}
          />
        );
      }
    }

    return null;
  };

  return (
    <group onPointerMissed={() => setContextMenu(null)}>
      {renderSnapCursor()}
      {renderRubberBand()}
      
      {/* Front Plane (XY) */}
      <group>
        <Plane 
          args={[size, size]} 
          onPointerDown={(e) => handlePointerDown('FRONT', e)}
          onPointerUp={(e) => handlePointerUp('FRONT', e)}
          onPointerOver={(e) => { e.stopPropagation(); setHovered('FRONT'); }}
          onPointerOut={() => { setHovered(null); setCursorState(null); }}
          onPointerMove={(e) => handlePointerMove('FRONT', e)}
          onDoubleClick={(e) => handlePlaneDoubleClick('FRONT', e)}
        >
          <meshStandardMaterial color="#3b82f6" transparent opacity={getOpacity('FRONT')} side={2} depthWrite={false} />
        </Plane>
        <Text position={[size/2, size/2, 0]} fontSize={2} color="#3b82f6">FRONT (XY)</Text>
      </group>

      {/* Top Plane (XZ) */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <Plane 
          args={[size, size]} 
          onPointerDown={(e) => handlePointerDown('TOP', e)}
          onPointerUp={(e) => handlePointerUp('TOP', e)}
          onPointerOver={(e) => { e.stopPropagation(); setHovered('TOP'); }}
          onPointerOut={() => { setHovered(null); setCursorState(null); }}
          onPointerMove={(e) => handlePointerMove('TOP', e)}
          onDoubleClick={(e) => handlePlaneDoubleClick('TOP', e)}
        >
          <meshStandardMaterial color="#10b981" transparent opacity={getOpacity('TOP')} side={2} depthWrite={false} />
        </Plane>
        <Text position={[size/2, size/2, 0]} fontSize={2} color="#10b981">TOP (XZ)</Text>
      </group>

      {/* Right Plane (YZ) */}
      <group rotation={[0, Math.PI / 2, 0]}>
        <Plane 
          args={[size, size]} 
          onPointerDown={(e) => handlePointerDown('RIGHT', e)}
          onPointerUp={(e) => handlePointerUp('RIGHT', e)}
          onPointerOver={(e) => { e.stopPropagation(); setHovered('RIGHT'); }}
          onPointerOut={() => { setHovered(null); setCursorState(null); }}
          onPointerMove={(e) => handlePointerMove('RIGHT', e)}
          onDoubleClick={(e) => handlePlaneDoubleClick('RIGHT', e)}
        >
          <meshStandardMaterial color="#ef4444" transparent opacity={getOpacity('RIGHT')} side={2} depthWrite={false} />
        </Plane>
        <Text position={[size/2, size/2, 0]} fontSize={2} color="#ef4444">RIGHT (YZ)</Text>
      </group>

      {/* Custom Face Plane */}
      {activePlane === 'FACE' && activeFaceOrigin && activeFaceNormal && faceBasis && (
        <group>
          <Plane 
            args={[size, size]} 
            position={[activeFaceOrigin[0], activeFaceOrigin[1], activeFaceOrigin[2]]}
            quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...activeFaceNormal).normalize())}
            onPointerDown={(e) => handlePointerDown('FACE', e)}
            onPointerUp={(e) => handlePointerUp('FACE', e)}
            onPointerOver={(e) => { e.stopPropagation(); setHovered('FACE'); }}
            onPointerOut={() => { setHovered(null); setCursorState(null); }}
            onPointerMove={(e) => handlePointerMove('FACE', e)}
            onDoubleClick={(e) => handlePlaneDoubleClick('FACE', e)}
          >
            <meshStandardMaterial color="#6366f1" transparent opacity={getOpacity('FACE')} side={2} depthWrite={false} />
          </Plane>
          <Text 
            position={[
              activeFaceOrigin[0] + faceBasis.xDir.x * (size/2) + faceBasis.yDir.x * (size/2),
              activeFaceOrigin[1] + faceBasis.xDir.y * (size/2) + faceBasis.yDir.y * (size/2),
              activeFaceOrigin[2] + faceBasis.xDir.z * (size/2) + faceBasis.yDir.z * (size/2)
            ]} 
            fontSize={2} 
            color="#6366f1"
            quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...activeFaceNormal).normalize())}
          >
            FACE PLANAR LCS
          </Text>
        </group>
      )}

      {/* Custom Reference Planes */}
      {referencePlanes.map((plane) => {
        const origin = new THREE.Vector3(...plane.origin);
        const normal = new THREE.Vector3(...plane.normal).normalize();
        const xDir = new THREE.Vector3(...plane.xDir).normalize();
        const yDir = new THREE.Vector3(...plane.yDir).normalize();
        const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
        
        return (
          <group key={plane.id}>
            <Plane 
              args={[size, size]} 
              position={origin}
              quaternion={quaternion}
              onPointerDown={(e) => handlePointerDown(plane.id, e)}
              onPointerUp={(e) => handlePointerUp(plane.id, e)}
              onPointerOver={(e) => { e.stopPropagation(); setHovered(plane.id); }}
              onPointerOut={() => { setHovered(null); setCursorState(null); }}
              onPointerMove={(e) => handlePointerMove(plane.id, e)}
              onDoubleClick={(e) => handlePlaneDoubleClick(plane.id, e)}
              onClick={(e) => {
                e.stopPropagation();
                const mgr = useCadStore.getState().activePropertyManager;
                if (mgr) {
                  const alreadyExists = mgr.refs.some((r: any) => r.id === plane.id);
                  if (!alreadyExists) {
                    useCadStore.setState({
                      activePropertyManager: {
                        ...mgr,
                        refs: [...mgr.refs, {
                          type: 'FACE',
                          id: plane.id,
                          coordinates: plane.origin,
                          normal: plane.normal
                        }]
                      }
                    });
                  }
                }
              }}
            >
              <meshStandardMaterial 
                color="#6366f1" 
                transparent 
                opacity={getOpacity(plane.id)} 
                side={THREE.DoubleSide} 
                depthWrite={false} 
              />
            </Plane>
            <Text 
              position={[
                origin.x + xDir.x * (size/2) + yDir.x * (size/2),
                origin.y + xDir.y * (size/2) + yDir.y * (size/2),
                origin.z + xDir.z * (size/2) + yDir.z * (size/2)
              ]} 
              fontSize={2} 
              color="#6366f1"
              quaternion={quaternion}
            >
              {plane.name || plane.id.toUpperCase()}
            </Text>
          </group>
        );
      })}

      {/* Custom Reference Axes */}
      {referenceAxes.map((axis) => {
        const originVec = new THREE.Vector3(...axis.origin);
        const dirVec = new THREE.Vector3(...axis.direction).normalize();
        
        const startPoint = originVec.clone().addScaledVector(dirVec, -size / 2);
        const endPoint = originVec.clone().addScaledVector(dirVec, size / 2);
        const points = [
          [startPoint.x, startPoint.y, startPoint.z],
          [endPoint.x, endPoint.y, endPoint.z]
        ] as [number, number, number][];

        const isHovered = hovered === axis.id;

        return (
          <group key={axis.id}>
            <Line
              points={points}
              color={isHovered ? "#3B82F6" : "#60A5FA"}
              lineWidth={isHovered ? 4.0 : 2.0}
              dashed
              dashSize={1.5}
              gapSize={1.0}
              onPointerOver={(e) => { e.stopPropagation(); setHovered(axis.id); }}
              onPointerOut={() => setHovered(null)}
              onClick={(e) => {
                e.stopPropagation();
                // Add to PropertyManager selection if active
                const mgr = useCadStore.getState().activePropertyManager;
                if (mgr) {
                  const alreadyExists = mgr.refs.some((r: any) => r.id === axis.id);
                  if (!alreadyExists) {
                    useCadStore.setState({
                      activePropertyManager: {
                        ...mgr,
                        refs: [...mgr.refs, {
                          type: 'EDGE',
                          id: axis.id,
                          coordinates: axis.origin,
                          edgeData: { start: points[0], end: points[1] }
                        }]
                      }
                    });
                  }
                }
              }}
            />
            <Text
              position={[originVec.x, originVec.y + 2, originVec.z]}
              fontSize={1.5}
              color="#60A5FA"
            >
              {axis.name || axis.id.toUpperCase()}
            </Text>
          </group>
        );
      })}

      {/* Context Menu Overlay */}
      {contextMenu && (
        <Html position={new THREE.Vector3(...contextMenu.position)} center>
          <div 
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            className="flex flex-col bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-lg p-2 w-[160px] gap-1.5 select-none animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="text-[14px] font-bold text-slate-400 px-2 py-0.5 uppercase tracking-wider font-mono border-b border-slate-200/50 pb-1 mb-0.5 flex justify-between items-center">
              <span>{contextMenu.plane} PLANE</span>
              <button 
                onClick={(e) => { e.stopPropagation(); setContextMenu(null); }} 
                className="text-slate-400 hover:text-red-500 font-bold ml-2 text-[14px] leading-none transition-all"
              >
                ✕
              </button>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingFeatureId(null);
                setSketchPoints([]);
                setSketchRelations([]);
                setActivePlane(contextMenu.plane);
                setSketchMode(true);
                setSketchNewChain(true);
                setContextMenu(null);
              }}
              type="button"
              className="flex items-center gap-2.5 px-2 py-1.5 text-[12px] text-slate-700 hover:text-primary hover:bg-primary/10 rounded-md font-semibold transition-all duration-150 text-left border border-transparent hover:border-primary/20 shadow-sm hover:shadow-md"
            >
              <span className="text-sm">✏️</span>
              <span>草圖繪製 (Sketch)</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActivePlane(contextMenu.plane);
                useCadStore.getState().triggerCameraNormal();
                setContextMenu(null);
              }}
              type="button"
              className="flex items-center gap-2.5 px-2 py-1.5 text-[12px] text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-md font-semibold transition-all duration-150 text-left border border-transparent hover:border-indigo-100 shadow-sm hover:shadow-md"
            >
              <span className="text-sm">🎯</span>
              <span>正對其 (Normal To)</span>
            </button>
          </div>
        </Html>
      )}

      <axesHelper args={[size/2]} />
    </group>
  );
};
