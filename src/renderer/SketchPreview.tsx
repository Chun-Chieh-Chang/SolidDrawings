import React from 'react';
import * as THREE from 'three';
import { useCadStore } from '../store/useCadStore';
import { Line } from '@react-three/drei';

export const SketchPreview = () => {
  const { sketchPoints, activePlane, isSketchMode } = useCadStore();

  if (!isSketchMode || !activePlane || sketchPoints.length === 0) return null;

  const get3DPoint = (u: number, v: number) => {
    if (activePlane === 'FRONT') return new THREE.Vector3(u, v, 0);
    if (activePlane === 'TOP') return new THREE.Vector3(u, 0, v);
    if (activePlane === 'RIGHT') return new THREE.Vector3(0, u, v);
    return new THREE.Vector3(u, v, 0);
  };

  const solidRenderPoints: [number, number, number][] = [];
  const centerlinePoints: [number, number, number][] = [];

  if (sketchPoints.length > 0) {
    let i = 0;
    while (i < sketchPoints.length) {
      const p_curr = sketchPoints[i];
      const p_next = sketchPoints[i + 1];

      const pt3d = get3DPoint(p_curr[0], p_curr[1]);
      if (p_curr[2] === 'CENTER_LINE') {
        centerlinePoints.push([pt3d.x, pt3d.y, pt3d.z]);
      } else {
        solidRenderPoints.push([pt3d.x, pt3d.y, pt3d.z]);
      }

      if (p_next && p_next[2] === 'ARC_CONTROL') {
        const p_end = sketchPoints[i + 2];
        if (p_end) {
          const p0 = get3DPoint(p_curr[0], p_curr[1]);
          const p1 = get3DPoint(p_next[0], p_next[1]);
          const p2 = get3DPoint(p_end[0], p_end[1]);

          const curve = new THREE.CatmullRomCurve3([p0, p1, p2]);
          const curvePts = curve.getPoints(15);
          for (let k = 1; k < curvePts.length; k++) {
            if (p_curr[2] === 'CENTER_LINE') {
              centerlinePoints.push([curvePts[k].x, curvePts[k].y, curvePts[k].z]);
            } else {
              solidRenderPoints.push([curvePts[k].x, curvePts[k].y, curvePts[k].z]);
            }
          }
          i += 2;
        } else {
          const p_ctrl = get3DPoint(p_next[0], p_next[1]);
          if (p_curr[2] === 'CENTER_LINE') {
            centerlinePoints.push([p_ctrl.x, p_ctrl.y, p_ctrl.z]);
          } else {
            solidRenderPoints.push([p_ctrl.x, p_ctrl.y, p_ctrl.z]);
          }
          i += 1;
        }
      } else {
        i += 1;
      }
    }
  }

  const markers = sketchPoints.map((pt, idx) => {
    const isControl = pt[2] === 'ARC_CONTROL';
    const isCenter = pt[2] === 'CIRCLE_CENTER';
    const isCorner = pt[2] === 'RECT_CORNER';
    const isCenterline = pt[2] === 'CENTER_LINE';
    const pos = get3DPoint(pt[0], pt[1]);
    return { pos, isControl, isCenter, isCorner, isCenterline, isStart: idx === 0 };
  });

  return (
    <group>
      {/* Draw the connected solid lines/curves */}
      {solidRenderPoints.length >= 2 && (
        <Line
          points={solidRenderPoints}
          color="#3b82f6"
          lineWidth={3.5}
          dashed={false}
        />
      )}

      {/* Draw the connected centerline reference lines */}
      {centerlinePoints.length >= 2 && (
        <Line
          points={centerlinePoints}
          color="#6b7280"
          lineWidth={2.5}
          dashed={true}
          dashSize={1.5}
          gapSize={1.0}
        />
      )}

      {/* Draw markers for each point */}
      {markers.map((m, i) => (
        <mesh key={i} position={m.pos}>
          <sphereGeometry args={[m.isControl || m.isCenter || m.isCorner ? 0.35 : 0.5, 8, 8]} />
          <meshBasicMaterial
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
