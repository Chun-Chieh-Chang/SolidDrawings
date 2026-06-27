'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useCadStore } from '../store/useCadStore';
import { projectToScreen, getDimXpertCamera } from './DimXpertCameraRef';
import * as THREE from 'three';

/**
 * DimXpertOverlay renders dimension annotations in the 3D viewport.
 * Each annotation has a leader line pointing to the feature and a label.
 * Uses the Three.js camera to project 3D feature positions to screen coordinates.
 */
export default function DimXpertOverlay() {
  const { dimxpertFeatures: features, isDimXpertActive } = useCadStore();
  const [, setTick] = useState(0);

  // Poll the camera on each animation frame so annotations track orbiting
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isDimXpertActive) return;
    const loop = () => {
      setTick(t => t + 1);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isDimXpertActive]);

  // Filter visible features
  const visibleFeatures = useMemo(() => {
    if (!isDimXpertActive) return [];
    return features.filter((f: any) => f.visible);
  }, [features, isDimXpertActive]);

  if (!isDimXpertActive || visibleFeatures.length === 0) return null;

  return (
    <svg className="absolute inset-0 pointer-events-none z-40" width="100%" height="100%">
      <defs>
        <marker id="dimxpert-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6" fill="#1E40AF" />
        </marker>
      </defs>
      {visibleFeatures.map((feature: any) => (
        <DimXpertFeatureAnnotation key={feature.id} feature={feature} />
      ))}
    </svg>
  );
}

interface DimXpertFeatureAnnotationProps {
  feature: any;
}

function DimXpertFeatureAnnotation({ feature }: DimXpertFeatureAnnotationProps) {
  // Get 3D world position from feature parameters
  const screenPos = useMemo(() => {
    let worldPos: [number, number, number] | null = null;

    const params = feature.parameters || {};
    if (params.origin) {
      worldPos = [params.origin[0], params.origin[1], params.origin[2]];
    } else if (params.center) {
      worldPos = [params.center[0], params.center[1], params.center[2]];
    } else if (params.center1) {
      // Midpoint of slot centers
      const c1 = params.center1;
      const c2 = params.center2 || params.center1;
      worldPos = [(c1[0] + c2[0]) / 2, (c1[1] + c2[1]) / 2, (c1[2] + c2[2]) / 2];
    } else if (feature.type === 'FILLET' && params.radius) {
      // Edge midpoint approximation
      worldPos = [0, 0, 0];
    } else if (feature.type === 'CHAMFER' && params.distance) {
      worldPos = [0, 0, 0];
    }

    if (!worldPos) return null;
    return projectToScreen(worldPos);
  }, [feature]);

  const primaryDimension = feature.dimensions?.[0];
  if (!screenPos || !primaryDimension) return null;

  const labelWidth = primaryDimension.label.length * 8 + 10;

  // Offset annotation to the right and up from the feature position
  const labelX = screenPos.x + 40;
  const labelY = screenPos.y - 30;

  return (
    <g className="dimxpert-annotation">
      {/* Leader line from feature point to label */}
      <line
        x1={screenPos.x}
        y1={screenPos.y}
        x2={labelX}
        y2={labelY}
        stroke="#1E40AF"
        strokeWidth={1.5}
        markerEnd="url(#dimxpert-arrow)"
      />
      {/* Dimension label box */}
      <g transform={`translate(${labelX}, ${labelY - 8})`}>
        <rect
          x={0}
          y={0}
          width={labelWidth}
          height={18}
          fill="white"
          fillOpacity={0.92}
          stroke="#1E40AF"
          strokeWidth={1}
          rx={3}
        />
        <text
          x={labelWidth / 2}
          y={13}
          textAnchor="middle"
          fontSize={10}
          fill="#1E40AF"
          fontWeight={700}
          fontFamily="monospace"
        >
          {primaryDimension.label}
        </text>
      </g>
      {/* Feature type badge below label */}
      <g transform={`translate(${labelX}, ${labelY + 14})`}>
        <rect
          x={0}
          y={0}
          width={feature.name.length * 7 + 8}
          height={15}
          fill="#3B82F6"
          fillOpacity={0.8}
          rx={2}
        />
        <text
          x={(feature.name.length * 7 + 8) / 2}
          y={11}
          textAnchor="middle"
          fontSize={8}
          fill="white"
          fontWeight={600}
        >
          {feature.name}
        </text>
      </g>
      {/* Small dot at feature position */}
      <circle cx={screenPos.x} cy={screenPos.y} r={3} fill="#1E40AF" opacity={0.7} />
    </g>
  );
}
