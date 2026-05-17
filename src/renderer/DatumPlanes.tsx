import React, { useState } from 'react';
import { Plane, Text } from '@react-three/drei';
import { useCadStore } from '../store/useCadStore';
import * as THREE from 'three';

export const DatumPlanes = () => {
  const { 
    activePlane, setActivePlane, 
    isSketchMode, setSketchMode,
    sketchPoints, setSketchPoints,
    sketchTool, gridSnap,
    setSketchRelations, setEditingFeatureId
  } = useCadStore();
  const [hovered, setHovered] = useState<string | null>(null);

  const size = 60;
  const opacity = 0.1;
  const hoverOpacity = 0.3;
  const activeOpacity = 0.5;

  const handlePlaneClick = (plane: 'FRONT' | 'TOP' | 'RIGHT', event: any) => {
    if (!isSketchMode) {
      setEditingFeatureId(null);
      setSketchPoints([]);
      setSketchRelations([]);
      setActivePlane(plane);
      setSketchMode(true);
      return;
    }

    if (activePlane !== plane) return;

    // We are in Sketch Mode and clicked the active plane
    // Extract local UV coordinates or project world point to local
    const point = event.point; // World coordinate
    let u = 0, v = 0;

    if (plane === 'FRONT') { u = point.x; v = point.y; }
    else if (plane === 'TOP') { u = point.x; v = point.z; }
    else if (plane === 'RIGHT') { u = point.y; v = point.z; }

    // Apply SolidWorks precision grid snapping
    if (gridSnap) {
      u = Math.round(u);
      v = Math.round(v);
    }

    // --- CIRCLE DRAWING TOOL ---
    if (sketchTool === 'CIRCLE') {
      if (sketchPoints.length === 0) {
        setSketchPoints([[u, v, 'CIRCLE_CENTER']]);
      } else {
        const [u_c, v_c] = sketchPoints[0];
        const R = Math.hypot(u - u_c, v - v_c);
        if (R > 0.1) {
          const circlePoints: any[] = [];
          const DIVISIONS = 36;
          for (let k = 0; k <= DIVISIONS; k++) {
            const theta = (k / DIVISIONS) * Math.PI * 2;
            circlePoints.push([u_c + R * Math.cos(theta), v_c + R * Math.sin(theta)]);
          }
          setSketchPoints(circlePoints);
        }
      }
      return;
    }

    // --- RECTANGLE DRAWING TOOL ---
    if (sketchTool === 'RECTANGLE') {
      if (sketchPoints.length === 0) {
        setSketchPoints([[u, v, 'RECT_CORNER']]);
      } else {
        const [u1, v1] = sketchPoints[0];
        const rectPoints = [
          [u1, v1],
          [u, v1],
          [u, v],
          [u1, v],
          [u1, v]
        ];
        setSketchPoints(rectPoints);
      }
      return;
    }

    // --- CENTER_LINE DRAWING TOOL ---
    if (sketchTool === 'CENTER_LINE') {
      const newPt = [u, v, 'CENTER_LINE'];
      setSketchPoints([...sketchPoints, newPt]);
      return;
    }

    // --- STANDARD LINE & ARC DRAWING ---
    let newPt: any = [u, v];
    if (sketchTool === 'ARC' && sketchPoints.length % 3 === 1) {
      newPt = [u, v, 'ARC_CONTROL'];
    }

    const newPoints: any[] = [...sketchPoints, newPt];
    
    // Check if we should finish (e.g., if clicked near the start point or if points > 3 and user clicks again)
    const isClosing = newPoints.length > 2 && 
      (Math.hypot(newPoints[0][0] - u, newPoints[0][1] - v) < 2);

    if (isClosing) {
      const firstPoint = newPoints[0];
      setSketchPoints([...newPoints.slice(0, -1), [firstPoint[0], firstPoint[1], firstPoint[2]]]);
    } else {
      setSketchPoints(newPoints);
    }
  };



  const getOpacity = (plane: string) => {
    if (activePlane === plane) return activeOpacity;
    if (hovered === plane) return hoverOpacity;
    return opacity;
  };

  return (
    <group>
      {/* Front Plane (XY) */}
      <group>
        <Plane 
          args={[size, size]} 
          onPointerOver={(e) => { e.stopPropagation(); setHovered('FRONT'); }}
          onPointerOut={() => setHovered(null)}
          onClick={(e) => { e.stopPropagation(); handlePlaneClick('FRONT', e); }}
        >
          <meshStandardMaterial color="#3b82f6" transparent opacity={getOpacity('FRONT')} side={2} depthWrite={false} />
        </Plane>
        <Text position={[size/2, size/2, 0]} fontSize={2} color="#3b82f6">FRONT (XY)</Text>
      </group>

      {/* Top Plane (XZ) */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <Plane 
          args={[size, size]} 
          onPointerOver={(e) => { e.stopPropagation(); setHovered('TOP'); }}
          onPointerOut={() => setHovered(null)}
          onClick={(e) => { e.stopPropagation(); handlePlaneClick('TOP', e); }}
        >
          <meshStandardMaterial color="#10b981" transparent opacity={getOpacity('TOP')} side={2} depthWrite={false} />
        </Plane>
        <Text position={[size/2, size/2, 0]} fontSize={2} color="#10b981">TOP (XZ)</Text>
      </group>

      {/* Right Plane (YZ) */}
      <group rotation={[0, Math.PI / 2, 0]}>
        <Plane 
          args={[size, size]} 
          onPointerOver={(e) => { e.stopPropagation(); setHovered('RIGHT'); }}
          onPointerOut={() => setHovered(null)}
          onClick={(e) => { e.stopPropagation(); handlePlaneClick('RIGHT', e); }}
        >

          <meshStandardMaterial color="#ef4444" transparent opacity={getOpacity('RIGHT')} side={2} depthWrite={false} />
        </Plane>
        <Text position={[size/2, size/2, 0]} fontSize={2} color="#ef4444">RIGHT (YZ)</Text>
      </group>

      <axesHelper args={[size/2]} />
    </group>
  );
};
