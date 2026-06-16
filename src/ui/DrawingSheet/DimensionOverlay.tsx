'use client';

import React, { useMemo } from 'react';
import type { DrawingSheetViewData } from '@/store/types';

interface DimensionAnnotationProps {
  lines: any[];
  viewId: string;
  viewData: DrawingSheetViewData;
  showDimensions: boolean;
}

export const DimensionOverlay: React.FC<DimensionAnnotationProps> = ({
  lines,
  viewData,
  showDimensions,
}) => {
  const dimensions = useMemo(() => {
    if (!showDimensions || !lines || lines.length === 0) return [];
    
    const dims: Array<{
      x1: number; y1: number; x2: number; y2: number;
      label: string; angle: number;
    }> = [];

    // Group lines into segments and compute dimensions
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.points || line.points.length < 2) continue;
      
      const pts = line.points;
      const p1 = pts[0];
      const p2 = pts[pts.length - 1];
      
      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Skip very short lines
      if (dist < 2) continue;
      
      const cx = (p1[0] + p2[0]) / 2;
      const cy = (p1[1] + p2[1]) / 2;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      // Round to reasonable precision
      const label = dist.toFixed(1);
      
      dims.push({ x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1], label, angle });
    }
    
    return dims;
  }, [lines, showDimensions]);

  if (dimensions.length === 0) return null;

  return (
    <g className="dimension-overlay" style={{ pointerEvents: 'none' }}>
      {dimensions.map((dim, idx) => {
        const midX = (dim.x1 + dim.x2) / 2;
        const midY = (dim.y1 + dim.y2) / 2;
        const offset = 12;
        
        // Position label perpendicular to line
        const rad = Math.atan2(dim.y2 - dim.y1, dim.x2 - dim.x1);
        const perpX = -Math.sin(rad) * offset;
        const perpY = Math.cos(rad) * offset;
        
        const lx = midX + perpX;
        const ly = midY + perpY;
        
        return (
          <g key={idx}>
            {/* Dimension line */}
            <line
              x1={dim.x1}
              y1={dim.y1}
              x2={dim.x2}
              y2={dim.y2}
              stroke="#666"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
            {/* Dimension arrow heads */}
            <polygon
              points={`${dim.x1},${dim.y1} ${dim.x1 + 4 * Math.cos(rad + 0.3)},${dim.y1 + 4 * Math.sin(rad + 0.3)} ${dim.x1 + 4 * Math.cos(rad - 0.3)},${dim.y1 + 4 * Math.sin(rad - 0.3)}`}
              fill="#333"
            />
            <polygon
              points={`${dim.x2},${dim.y2} ${dim.x2 - 4 * Math.cos(rad + 0.3)},${dim.y2 - 4 * Math.sin(rad + 0.3)} ${dim.x2 - 4 * Math.cos(rad - 0.3)},${dim.y2 - 4 * Math.sin(rad - 0.3)}`}
              fill="#333"
            />
            {/* Dimension text */}
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="8"
              fill="#333"
              fontFamily="'Consolas', 'Courier New', monospace"
              fontWeight="bold"
              transform={`rotate(${dim.angle}, ${lx}, ${ly})`}
            >
              {dim.label}
            </text>
            {/* Text background */}
            <rect
              x={lx - 15}
              y={ly - 5}
              width="30"
              height="10"
              fill="white"
              rx="1"
              opacity="0.9"
            />
            {/* Redraw text on top */}
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="8"
              fill="#333"
              fontFamily="'Consolas', 'Courier New', monospace"
              fontWeight="bold"
              transform={`rotate(${dim.angle}, ${lx}, ${ly})`}
            >
              {dim.label}
            </text>
          </g>
        );
      })}
    </g>
  );
};
