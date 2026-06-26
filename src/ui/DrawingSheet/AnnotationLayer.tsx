'use client';

import React, { useCallback, useRef, useState } from 'react';
import type { DrawingAnnotation, DatumFeature, GeometricTolerance } from '@/store/types';

// ─── GD&T symbol → Unicode map ─────────────────────────────────────
const GD_SYMBOL_MAP: Record<string, string> = {
  STRAIGHTNESS: '⏤',
  FLATNESS: '⌒',
  CIRCULARITY: '○',
  CYLINDRICITY: '◎',
  PROFILE_LINE: '⌓',
  PROFILE_SURFACE: '⌓',
  ANGULARITY: '∠',
  PERPENDICULARITY: '⟂',
  PARALLELISM: '∥',
  POSITION: '⨁',
  CONCENTRICITY: '◎',
  SYMMETRY: '⌯',
  CIRCULAR_RUNOUT: '↗',
  TOTAL_RUNOUT: '↗↗',
};

// ─── Helpers ────────────────────────────────────────────────────────

function datumTrianglePath(cx: number, cy: number, size: number): string {
  const half = size * 0.5;
  return `M ${cx} ${cy} L ${cx - half} ${cy - size * 1.5} L ${cx + half} ${cy - size * 1.5} Z`;
}

function gdSymbolLabel(symbol: string): string {
  return GD_SYMBOL_MAP[symbol] ?? symbol;
}

// ─── Props ──────────────────────────────────────────────────────────

interface AnnotationLayerProps {
  annotations: DrawingAnnotation[];
  /** If true, rendered annotations support mouse-drag repositioning */
  draggable?: boolean;
  onPositionChange?: (annotationId: string, x: number, y: number) => void;
}

// ─── Sub-renderers ──────────────────────────────────────────────────

const DatumRenderer: React.FC<{
  annotation: DatumFeature;
  isDraggable: boolean;
  onDragEnd?: (id: string, x: number, y: number) => void;
}> = ({ annotation, isDraggable, onDragEnd }) => {
  const { id, label, x, y } = annotation;
  const triSize = 14;
  const boxW = 22;
  const boxH = 16;
  const boxX = x - boxW / 2;
  const boxY = y + 2;

  return (
    <DnDGroup
      id={id}
      x={x}
      y={y}
      draggable={isDraggable}
      onDragEnd={onDragEnd}
    >
      {/* Leader line */}
      <line x1={x} y1={y} x2={x} y2={y + triSize * 1.5 + 6} stroke="#111" strokeWidth="0.8" />
      {/* Datum triangle (filled) */}
      <path d={datumTrianglePath(x, y + triSize * 1.5 + 6, triSize)} fill="#111" stroke="none" />
      {/* Label box */}
      <rect x={boxX} y={boxY} width={boxW} height={boxH} fill="white" stroke="#111" strokeWidth="0.8" rx="1" />
      <text
        x={x}
        y={boxY + boxH - 4}
        textAnchor="middle"
        fontSize="10"
        fontWeight="bold"
        fill="#111"
        fontFamily="'Segoe UI', Arial, sans-serif"
        style={{ fontStyle: 'italic' }}
      >
        {label}
      </text>
    </DnDGroup>
  );
};

const GeometricToleranceRenderer: React.FC<{
  annotation: GeometricTolerance;
  isDraggable: boolean;
  onDragEnd?: (id: string, x: number, y: number) => void;
}> = ({ annotation, isDraggable, onDragEnd }) => {
  const { id, symbol, tolerance, diameterPrefix, materialCondition, datums, x, y } = annotation;

  // Cell layout
  const cellH = 18;
  const symW = 24;
  const tolW = 40;
  const datumW = Math.max(24, datums.length * 20);
  const frameW = symW + tolW + datumW;

  const symX = x;
  const tolX = symX + symW;
  const datumX = tolX + tolW;

  return (
    <DnDGroup
      id={id}
      x={x}
      y={y}
      draggable={isDraggable}
      onDragEnd={onDragEnd}
    >
      {/* Feature control frame background */}
      <rect x={symX} y={y} width={frameW} height={cellH} fill="white" stroke="#111" strokeWidth="0.8" rx="1" />
      {/* Vertical dividers */}
      <line x1={tolX} y1={y} x2={tolX} y2={y + cellH} stroke="#111" strokeWidth="0.8" />
      <line x1={datumX} y1={y} x2={datumX} y2={y + cellH} stroke="#111" strokeWidth="0.8" />

      {/* Cell 1: GD&T symbol */}
      <text
        x={symX + symW / 2}
        y={y + cellH / 2 + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="12"
        fill="#111"
        fontFamily="'Segoe UI', Arial, sans-serif"
      >
        {gdSymbolLabel(symbol)}
      </text>

      {/* Cell 2: Tolerance value */}
      <text
        x={tolX + tolW / 2}
        y={y + cellH / 2 + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="9"
        fill="#111"
        fontFamily="'Segoe UI', Arial, sans-serif"
      >
        {diameterPrefix ? 'φ' : ''}{tolerance}{materialCondition ? `(${materialCondition})` : ''}
      </text>

      {/* Cell 3+: Datum references */}
      {datums.map((d, i) => (
        <text
          key={d}
          x={datumX + 6 + i * 20}
          y={y + cellH / 2 + 1}
          dominantBaseline="central"
          fontSize="9"
          fontWeight="bold"
          fill="#111"
          fontFamily="'Segoe UI', Arial, sans-serif"
        >
          {d}
        </text>
      ))}

      {/* Leader line from left edge */}
      <line x1={symX} y1={y + cellH / 2} x2={symX - 20} y2={y + cellH / 2} stroke="#111" strokeWidth="0.8" />
    </DnDGroup>
  );
};

// ─── Simple draggable group wrapper ────────────────────────────────

interface DnDGroupProps {
  id: string;
  x: number;
  y: number;
  draggable: boolean;
  onDragEnd?: (id: string, x: number, y: number) => void;
  children: React.ReactNode;
}

const DnDGroup: React.FC<DnDGroupProps> = ({ id, x, y, draggable, onDragEnd, children }) => {
  const offsetRef = useRef({ dx: 0, dy: 0 });
  const [dragging, setDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!draggable) return;
    offsetRef.current.dx = e.clientX - x;
    offsetRef.current.dy = e.clientY - y;
    setDragging(true);
  }, [draggable, x, y]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    // During drag, we update the DOM position via transform
    const g = (e.target as SVGElement).closest('g') as SVGGElement | null;
    if (g) {
      const dx = e.clientX - offsetRef.current.dx - x;
      const dy = e.clientY - offsetRef.current.dy - y;
      g.setAttribute('transform', `translate(${dx}, ${dy})`);
    }
  }, [dragging, x, y]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setDragging(false);
    const newX = e.clientX - offsetRef.current.dx;
    const newY = e.clientY - offsetRef.current.dy;
    onDragEnd?.(id, newX, newY);
  }, [dragging, id, onDragEnd]);

  return (
    <g
      style={{ cursor: draggable ? (dragging ? 'grabbing' : 'grab') : undefined }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={dragging ? handleMouseUp : undefined}
    >
      {children}
    </g>
  );
};

// ─── Main AnnotationLayer ───────────────────────────────────────────

export const AnnotationLayer: React.FC<AnnotationLayerProps> = ({
  annotations,
  draggable = false,
  onPositionChange,
}) => {
  return (
    <g className="annotation-layer">
      {annotations.map((ann) => {
        if (ann.type === 'DATUM') {
          return (
            <DatumRenderer
              key={ann.id}
              annotation={ann}
              isDraggable={draggable}
              onDragEnd={onPositionChange}
            />
          );
        }
        if (ann.type === 'GEOMETRIC_TOLERANCE') {
          return (
            <GeometricToleranceRenderer
              key={ann.id}
              annotation={ann}
              isDraggable={draggable}
              onDragEnd={onPositionChange}
            />
          );
        }
        return null;
      })}
    </g>
  );
};

export default AnnotationLayer;
