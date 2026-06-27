'use client';

import React, { useMemo } from 'react';
import { useCadStore } from '../store/useCadStore';

/**
 * DimXpertOverlay renders dimension annotations in the 3D viewport.
 * Each annotation has a leader line pointing to the feature and a label.
 */
export default function DimXpertOverlay() {
  const { dimxpertFeatures: features, isDimXpertActive } = useCadStore();

  // Filter visible features and their dimensions
  const visibleFeatures = useMemo(() => {
    if (!isDimXpertActive) return [];
    return features.filter((f: any) => f.visible);
  }, [features, isDimXpertActive]);

  if (!isDimXpertActive || visibleFeatures.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {visibleFeatures.map((feature: any) => (
        <DimXpertFeatureAnnotation key={feature.id} feature={feature} />
      ))}
    </div>
  );
}

interface DimXpertFeatureAnnotationProps {
  feature: any;
}

function DimXpertFeatureAnnotation({ feature }: DimXpertFeatureAnnotationProps) {
  // Calculate a pseudo-3D position based on feature parameters
  const position = useMemo(() => {
    const params = feature.parameters;
    if (feature.type === 'HOLE' && params.origin) {
      // Offset from hole center
      return {
        x: params.origin[0] + 20,
        y: params.origin[1] + 20,
        z: params.origin[2] + 20,
      };
    }
    if (feature.type === 'FILLET' && params.radius) {
      return { x: 50, y: 50, z: 50 };
    }
    if (feature.type === 'CHAMFER' && params.distance) {
      return { x: 60, y: 60, z: 60 };
    }
    if (feature.type === 'SLOT' && params.center1) {
      return {
        x: params.center1[0] + 30,
        y: params.center1[1] + 30,
        z: params.center1[2] + 30,
      };
    }
    return { x: 0, y: 0, z: 0 };
  }, [feature]);

  // Get the primary dimension label
  const primaryDimension = feature.dimensions[0];
  if (!primaryDimension) return null;

  return (
    <g className="dimxpert-annotation" style={{ pointerEvents: 'none' }}>
      {/* Leader line */}
      <line
        x1={position.x}
        y1={position.y}
        x2={position.x + 40}
        y2={position.y - 30}
        stroke="#1E40AF"
        strokeWidth={1.5}
        markerEnd="url(#arrowhead)"
      />
      {/* Dimension label */}
      <g transform={`translate(${position.x + 45}, ${position.y - 35})`}>
        <rect
          x={0}
          y={0}
          width={primaryDimension.label.length * 8 + 10}
          height={20}
          fill="white"
          fillOpacity={0.9}
          stroke="#1E40AF"
          strokeWidth={1}
          rx={3}
        />
        <text
          x={primaryDimension.label.length * 4 + 5}
          y={14}
          textAnchor="middle"
          fontSize={11}
          fill="#1E40AF"
          fontWeight={600}
          fontFamily="monospace"
        >
          {primaryDimension.label}
        </text>
      </g>
      {/* Feature type badge */}
      <g transform={`translate(${position.x + 50}, ${position.y - 10})`}>
        <rect
          x={0}
          y={0}
          width={feature.name.length * 7 + 8}
          height={16}
          fill="#3B82F6"
          fillOpacity={0.8}
          rx={2}
        />
        <text
          x={feature.name.length * 3.5 + 4}
          y={12}
          textAnchor="middle"
          fontSize={9}
          fill="white"
          fontWeight={600}
        >
          {feature.name}
        </text>
      </g>
    </g>
  );
}
