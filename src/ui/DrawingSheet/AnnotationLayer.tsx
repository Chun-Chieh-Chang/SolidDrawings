'use client';

import React from 'react';

interface AnnotationLayerProps {
  lines: any[];
  showCenterlines: boolean;
  annotations: Array<{ x: number; y: number; text: string }>;
}

export const AnnotationLayer: React.FC<AnnotationLayerProps> = ({
  lines,
  showCenterlines,
  annotations,
}) => {
  // Detect circular arcs and add centerlines
  const centerlines = React.useMemo(() => {
    if (!showCenterlines || !lines) return [];
    const centers: Array<{ x: number; y: number }> = [];
    
    for (const line of lines) {
      if (line.points && line.points.length >= 3) {
        // Heuristic: if line has many points, it might be an arc
        // Look for circular patterns
        const pts = line.points;
        if (pts.length > 5) {
          // Simple circle detection: check if points form a circular arc
          const first = pts[0];
          const last = pts[pts.length - 1];
          const mid = pts[Math.floor(pts.length / 2)];
          
          // Calculate approximate center from arc points
          const dx1 = mid[0] - first[0];
          const dy1 = mid[1] - first[1];
          const dx2 = last[0] - mid[0];
          const dy2 = last[1] - mid[1];
          
          // Perpendicular bisectors
          const mid1x = (first[0] + mid[0]) / 2;
          const mid1y = (first[1] + mid[1]) / 2;
          const mid2x = (mid[0] + last[0]) / 2;
          const mid2y = (mid[1] + last[1]) / 2;
          
          // Cross product to find intersection
          const det = dx1 * dy2 - dy1 * dx2;
          if (Math.abs(det) > 0.001) {
            const cx = mid1x + (dy2 * (dx1 * mid1y - dy1 * mid1x) - dy1 * (dx2 * mid2y - dy2 * mid2y)) / det;
            const cy = mid1y + (dx2 * (dx1 * mid1y - dy1 * mid1x) - dx1 * (dx2 * mid2y - dy2 * mid2y)) / det;
            
            if (isFinite(cx) && isFinite(cy)) {
              centers.push({ x: cx, y: cy });
            }
          }
        }
      }
    }
    
    return centers;
  }, [lines, showCenterlines]);

  return (
    <g className="annotation-layer" style={{ pointerEvents: 'none' }}>
      {/* Centerlines for detected circular features */}
      {centerlines.map((center, idx) => (
        <g key={`cl-${idx}`}>
          {/* Horizontal centerline */}
          <line
            x1={center.x - 30}
            y1={center.y}
            x2={center.x + 30}
            y2={center.y}
            stroke="#c00"
            strokeWidth="0.3"
            strokeDasharray="15,3,3,3"
          />
          {/* Vertical centerline */}
          <line
            x1={center.x}
            y1={center.y - 30}
            x2={center.x}
            y2={center.y + 30}
            stroke="#c00"
            strokeWidth="0.3"
            strokeDasharray="15,3,3,3"
          />
          {/* Center point */}
          <circle cx={center.x} cy={center.y} r="1.5" fill="none" stroke="#c00" strokeWidth="0.5" />
        </g>
      ))}
      
      {/* Text annotations */}
      {annotations.map((ann, idx) => (
        <g key={`ann-${idx}`}>
          <rect
            x={ann.x - 20}
            y={ann.y - 6}
            width="40"
            height="12"
            fill="white"
            rx="2"
            opacity="0.85"
          />
          <text
            x={ann.x}
            y={ann.y + 1}
            textAnchor="middle"
            fontSize="7"
            fill="#666"
            fontFamily="'Segoe UI', sans-serif"
          >
            {ann.text}
          </text>
        </g>
      ))}
    </g>
  );
};
