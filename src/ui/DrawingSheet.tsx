'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useCadStore } from '../store/useCadStore';
import { HeavyEngineClient } from '../kernel/HeavyEngineClient';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragMoveEvent,
} from '@dnd-kit/core';
import { DimensionOverlay } from './DrawingSheet/DimensionOverlay';
import { AnnotationLayer } from './DrawingSheet/AnnotationLayer';
import { SheetFormatSelector } from './DrawingSheet/SheetFormatSelector';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ViewPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface DrawingViewData {
  id: string;
  type: 'FRONT' | 'TOP' | 'RIGHT' | 'ISO' | 'SECTION' | 'DETAIL';
  title: string;
  position: ViewPosition;
  scale: string;
  showDimensions: boolean;
  parentViewId?: string;
  sectionLine?: { u1: number; v1: number; u2: number; v2: number };
}

// ─── Scale Options ───────────────────────────────────────────────────────────

const SCALE_OPTIONS = ['1:1', '1:2', '1:5', '1:10', '2:1', '5:1', '10:1'];

const SCALE_TO_FACTOR: Record<string, number> = {
  '1:1': 1,
  '1:2': 0.5,
  '1:5': 0.2,
  '1:10': 0.1,
  '2:1': 2,
  '5:1': 5,
  '10:1': 10,
};

// ─── DrawingView Component ──────────────────────────────────────────────────

interface DrawingViewProps {
  title: string;
  type: 'FRONT' | 'TOP' | 'RIGHT' | 'ISO' | 'SECTION' | 'DETAIL';
  lines: any[];
  showDimensions: boolean;
  components?: any[];
  scale: string;
  sheetId: string;
  viewId: string;
  parentViewId?: string;
  sectionLine?: { u1: number; v1: number; u2: number; v2: number };
  sectionFill?: { points: number[][] }[];
  detailBounds?: { cx: number; cy: number; radius: number } | null;
  isDragging?: boolean;
  onSectionCreated?: (parentViewId: string, data: any) => void;
  onDetailCreated?: (parentViewId: string, bounds: { cx: number; cy: number; radius: number }) => void;
}

const DrawingView = ({ title, type, lines, showDimensions, components, scale, sheetId, viewId, sectionLine, sectionFill, detailBounds, isDragging, onSectionCreated, onDetailCreated }: DrawingViewProps) => {
  const [editingDim, setEditingDim] = useState<{id: string, type: string, param: string} | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [showScaleDropdown, setShowScaleDropdown] = useState(false);
  const [showSectionTool, setShowSectionTool] = useState(false);
  const [sectionStart, setSectionStart] = useState<{u: number, v: number} | null>(null);
  const [sectionEnd, setSectionEnd] = useState<{u: number, v: number} | null>(null);
  const [isDrawingSection, setIsDrawingSection] = useState(false);
  const [showDetailTool, setShowDetailTool] = useState(false);
  const [detailCenter, setDetailCenter] = useState<{u: number, v: number} | null>(null);
  const [detailRadius, setDetailRadius] = useState(50);
  const [isDrawingDetail, setIsDrawingDetail] = useState(false);

  const features = useCadStore(state => state.features);
  const updateFeatureParams = useCadStore(state => state.updateFeatureParams);
  const updateViewScale = useCadStore(state => state.updateViewScale);
  const addViewToSheet = useCadStore(state => state.addViewToSheet);
  const toggleViewDimensions = useCadStore(state => state.toggleViewDimensions);

  // Normalize lines
  const normalizedLines = useMemo(() => {
    return lines.map((line: any) => {
      if (Array.isArray(line)) return { points: line as number[][], visible: true };
      return line as { points: number[][], visible: boolean };
    });
  }, [lines]);

  // Compute bounds
  let minU = Infinity, maxU = -Infinity;
  let minV = Infinity, maxV = -Infinity;

  normalizedLines.forEach((line: {points: number[][], visible: boolean}) => {
    line.points.forEach((p: number[]) => {
      if (p[0] < minU) minU = p[0];
      if (p[0] > maxU) maxU = p[0];
      if (p[1] < minV) minV = p[1];
      if (p[1] > maxV) maxV = p[1];
    });
  });

  const hasBounds = minU !== Infinity && maxU !== -Infinity && minV !== Infinity && maxV !== -Infinity;
  const widthVal = hasBounds ? maxU - minU : 0;
  const heightVal = hasBounds ? maxV - minV : 0;
  const midU = hasBounds ? (minU + maxU) / 2 : 0;
  const midV = hasBounds ? (minV + maxV) / 2 : 0;

  const size = Math.max(widthVal, heightVal);
  let halfSize = hasBounds ? size / 2 + Math.max(size * 0.4, 20) : 50;
  const scaleFactor = SCALE_TO_FACTOR[scale] || 1;
  
  // For DETAIL views, zoom into the detail bounds area
  let viewCenterU = midU;
  let viewCenterV = midV;
  if (type === 'DETAIL' && detailBounds) {
    viewCenterU = detailBounds.cx;
    viewCenterV = detailBounds.cy;
    halfSize = detailBounds.radius * 1.5;
  }
  
  const scaledHalfSize = halfSize / scaleFactor;
  const viewBox = hasBounds 
    ? `${viewCenterU - scaledHalfSize} ${viewCenterV - scaledHalfSize} ${scaledHalfSize * 2} ${scaledHalfSize * 2}`
    : `-50 -50 100 100`;

  const viewBoxSize = halfSize * 2;
  const lineStrokeWidth = viewBoxSize * 0.004;
  const dimStrokeWidth = viewBoxSize * 0.002;
  const textSize = viewBoxSize * 0.03;
  const rectW = viewBoxSize * 0.14;
  const rectH = viewBoxSize * 0.05;
  const extOffset = viewBoxSize * 0.15;
  const dimOffset = viewBoxSize * 0.1;
  const centerMarkSize = Math.max(4 / scaleFactor, 3);

  const iso_u = (x: number, y: number, z: number) => (x - z) * Math.cos(Math.PI / 6);
  const iso_v = (x: number, y: number, z: number) => y - (x + z) * Math.sin(Math.PI / 6);

  const getProjPos = useCallback((pos: [number, number, number]): [number, number] => {
    const [x, y, z] = pos;
    if (type === 'FRONT' || type === 'SECTION') return [x, y];
    if (type === 'TOP') return [x, -z];
    if (type === 'RIGHT') return [z, y];
    if (type === 'DETAIL') return [x, y];
    return [iso_u(x, y, z), iso_v(x, y, z)];
  }, [type]);

  // Detect circular features for center marks
  const circularCenters = useMemo(() => {
    const centers: {u: number, v: number, radius: number}[] = [];
    features.forEach(feat => {
      const p = feat.parameters || {};
      const [x, y, z] = [p.x || 0, p.y || 0, p.z || 0];
      if (feat.type === 'CYLINDER' || feat.type === 'HOLE' || feat.type === 'SPHERE') {
        const r = p.radius || 5;
        const [u, v] = type === 'FRONT' ? [x, y] : type === 'TOP' ? [x, -z] : type === 'RIGHT' ? [z, y] : [x, y];
        centers.push({ u, v, radius: r });
      }
    });
    return centers;
  }, [features, type]);

  // Balloons for ISO
  const balloons = useMemo(() => {
    if (type !== 'ISO' || !components || components.length === 0) return [];
    return components.map((c: any, i: number) => {
      const [u, v] = getProjPos(c.transform.position);
      return { id: c.id, label: `${i + 1}`, u, v };
    });
  }, [type, components, getProjPos]);

  // Dimension editing
  const saveDimensionEdit = () => {
    if (!editingDim) return;
    let newValue = parseFloat(editValue);
    if (isNaN(newValue) || newValue <= 0) return;
    if (editingDim.param === 'radius') newValue /= 2;
    updateFeatureParams(editingDim.id, { [editingDim.param]: newValue });
    setEditingDim(null);
  };
  
  // Smart dimensions
  const smartDims: any[] = [];
  if (showDimensions && type !== 'ISO') {
    features.forEach(feat => {
      const p = feat.parameters || {};
      const [x, y, z] = [p.x || 0, p.y || 0, p.z || 0];
      if (feat.type === 'BOX' || feat.type === 'EXTRUDE') {
        const [w, h, d] = [p.width || 10, p.height || 10, p.depth || 10];
        if (type === 'FRONT') {
           smartDims.push({ id: feat.id, type: 'HORIZ', value: w, u: x, v: y, length: w, param: 'width' });
           smartDims.push({ id: feat.id, type: 'VERT', value: h, u: x, v: y, length: h, param: 'height' });
        } else if (type === 'TOP') {
           smartDims.push({ id: feat.id, type: 'HORIZ', value: w, u: x, v: -z-d, length: w, param: 'width' });
           smartDims.push({ id: feat.id, type: 'VERT', value: d, u: x, v: -z-d, length: d, param: 'depth' });
        } else if (type === 'RIGHT') {
           smartDims.push({ id: feat.id, type: 'HORIZ', value: d, u: z, v: y, length: d, param: 'depth' });
           smartDims.push({ id: feat.id, type: 'VERT', value: h, u: z, v: y, length: h, param: 'height' });
        }
      } else if (feat.type === 'CYLINDER' || feat.type === 'SPHERE' || feat.type === 'HOLE') {
        const r = p.radius || 5;
        const h = p.height || (p.depth || 10);
        if (type === 'TOP') smartDims.push({ id: feat.id, type: 'RADIAL', value: r*2, u: x, v: -z, radius: r, param: 'radius' });
        else if (type === 'FRONT') {
           smartDims.push({ id: feat.id, type: 'HORIZ', value: r*2, u: x-r, v: y, length: r*2, param: 'radius' });
           smartDims.push({ id: feat.id, type: 'VERT', value: h, u: x-r, v: y, length: h, param: 'height' });
        } else if (type === 'RIGHT') {
           smartDims.push({ id: feat.id, type: 'HORIZ', value: r*2, u: z-r, v: y, length: r*2, param: 'radius' });
           smartDims.push({ id: feat.id, type: 'VERT', value: h, u: z-r, v: y, length: h, param: 'height' });
        }
      }
    });
  }

  // Handle section line drawing on click
  const handleSvgClick = (e: React.MouseEvent<SVGElement>) => {
    const svgEl = e.currentTarget as SVGElement & SVGGraphicsElement;
    const svg = svgEl as unknown as SVGSVGElement;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctM = svg.getScreenCTM();
    const svgP = pt.matrixTransform(ctM?.inverse());
    
    if (showSectionTool) {
      if (!isDrawingSection) {
        setSectionStart({ u: svgP.x, v: svgP.y });
        setIsDrawingSection(true);
      } else {
        setSectionEnd({ u: svgP.x, v: svgP.y });
        setIsDrawingSection(false);
      }
    } else if (showDetailTool) {
      if (!isDrawingDetail) {
        setDetailCenter({ u: svgP.x, v: svgP.y });
        setIsDrawingDetail(true);
      } else {
        setDetailRadius(Math.sqrt((svgP.x - (detailCenter?.u ?? 0)) ** 2 + (svgP.y - (detailCenter?.v ?? 0)) ** 2));
        setIsDrawingDetail(false);
      }
    }
  };

  // Scale change handler
  const handleScaleChange = (newScale: string) => {
    updateViewScale(sheetId, viewId, newScale);
    setShowScaleDropdown(false);
  };

  // Add section view from this cutting plane — calls backend API
  const handleCreateSectionView = async () => {
    if (sectionStart && sectionEnd) {
      const client = HeavyEngineClient.getInstance();
      const cutOrigin = [0, 0, 0];
      const cutNormal = [0, 0, 1];
      if (type === 'FRONT') { cutOrigin[1] = 0; cutNormal[1] = 1; }
      else if (type === 'TOP') { cutOrigin[2] = 0; cutNormal[2] = -1; }
      else if (type === 'RIGHT') { cutOrigin[0] = 0; cutNormal[0] = 1; }

      const result = await client.sectionView(features, { origin: cutOrigin, normal: cutNormal }, 'FRONT');
      if (result && result.visible_lines) {
        onSectionCreated?.(viewId, result);
      }
      addViewToSheet('SECTION', sheetId, viewId);
      setShowSectionTool(false);
      setSectionStart(null);
      setSectionEnd(null);
      setIsDrawingSection(false);
    }
  };

  // Add detail view from this circle selection
  const handleCreateDetailView = () => {
    if (detailCenter && detailRadius > 5) {
      onDetailCreated?.(viewId, { cx: detailCenter.u, cy: detailCenter.v, radius: detailRadius });
      addViewToSheet('DETAIL', sheetId, viewId);
      setShowDetailTool(false);
      setDetailCenter(null);
      setDetailRadius(50);
      setIsDrawingDetail(false);
    }
  };

  return (
    <div 
      className={`border border-slate-300 bg-white aspect-video relative flex flex-col group hover:border-primary transition-all shadow-sm rounded overflow-hidden ${isDragging ? 'opacity-50 ring-2 ring-primary' : ''}`}
    >
      {/* View Header Bar */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-slate-900/90 to-slate-800/90 backdrop-blur-sm px-2 py-1 flex items-center justify-between z-20 rounded-t">
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] font-black text-white/60 uppercase tracking-wider">{type}</span>
          <span className="text-[9px] font-bold text-white truncate max-w-[120px]">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Scale Selector */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowScaleDropdown(!showScaleDropdown); }}
              className="px-1.5 py-0.5 text-[8px] font-black text-white bg-slate-700/80 hover:bg-primary rounded border border-slate-600 hover:border-primary transition-all"
            >
              {scale}
            </button>
            {showScaleDropdown && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowScaleDropdown(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-40 py-1 min-w-[60px]">
                  {SCALE_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      onClick={(e) => { e.stopPropagation(); handleScaleChange(opt); }}
                      className={`block w-full text-left px-3 py-1 text-[10px] font-bold hover:bg-slate-100 transition-colors ${scale === opt ? 'text-primary bg-slate-50' : 'text-slate-700'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          {/* Dimension Toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleViewDimensions(sheetId, viewId); }}
            className={`p-0.5 rounded transition-all ${showDimensions ? 'text-emerald-500' : 'text-slate-500'}`}
            title="Toggle dimensions"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
          {/* Section View Tool */}
          {type !== 'SECTION' && type !== 'DETAIL' && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowSectionTool(!showSectionTool); }}
              className={`p-0.5 rounded transition-all ${showSectionTool ? 'text-amber-500' : 'text-slate-500 hover:text-amber-500'}`}
              title="Create section view"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="4" y1="4" x2="20" y2="20"/>
                <line x1="20" y1="4" x2="4" y2="20"/>
              </svg>
            </button>
          )}
          {/* Detail View Tool */}
          {type !== 'DETAIL' && type !== 'SECTION' && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowDetailTool(!showDetailTool); }}
              className={`p-0.5 rounded transition-all ${showDetailTool ? 'text-emerald-500' : 'text-slate-500 hover:text-emerald-500'}`}
              title="Create detail view"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="8"/>
                <circle cx="12" cy="12" r="4"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Section tool overlay */}
      {showSectionTool && (
        <div className="absolute top-8 right-2 bg-white border border-amber-300 rounded-lg shadow-lg z-20 p-2 text-[9px]">
          <div className="text-amber-700 font-bold mb-1">Section Tool</div>
          <div className="text-slate-500 mb-1">Click to set start point</div>
          {isDrawingSection && <div className="text-amber-600 font-bold">Set end point...</div>}
          {sectionStart && sectionEnd && !isDrawingSection && (
            <button
              onClick={(e) => { e.stopPropagation(); handleCreateSectionView(); }}
              className="mt-1 px-2 py-0.5 bg-amber-500 text-white rounded text-[8px] font-bold hover:bg-amber-600"
            >
              Create Section
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setShowSectionTool(false); setSectionStart(null); setSectionEnd(null); setIsDrawingSection(false); }}
            className="ml-1 px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[8px] font-bold hover:bg-slate-300"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Detail tool overlay */}
      {showDetailTool && (
        <div className="absolute top-8 right-2 bg-white border border-emerald-300 rounded-lg shadow-lg z-20 p-2 text-[9px]">
          <div className="text-emerald-700 font-bold mb-1">Detail View Tool</div>
          <div className="text-slate-500 mb-1">Click center, then edge</div>
          {isDrawingDetail && <div className="text-emerald-600 font-bold">Set radius...</div>}
          {detailCenter && !isDrawingDetail && detailRadius > 5 && (
            <button
              onClick={(e) => { e.stopPropagation(); handleCreateDetailView(); }}
              className="mt-1 px-2 py-0.5 bg-emerald-500 text-white rounded text-[8px] font-bold hover:bg-emerald-600"
            >
              Create Detail
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setShowDetailTool(false); setDetailCenter(null); setDetailRadius(50); setIsDrawingDetail(false); }}
            className="ml-1 px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[8px] font-bold hover:bg-slate-300"
          >
            Cancel
          </button>
        </div>
      )}

      {/* View Label Badge */}
      <div className="absolute top-7 left-2 text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/80 backdrop-blur px-1.5 py-0.5 rounded border border-slate-200 z-10 group-hover:text-primary group-hover:border-primary/30 transition-all">
        {hasBounds && type !== 'ISO' && `${widthVal.toFixed(1)} x ${heightVal.toFixed(1)} mm`}
      </div>

      {/* Main SVG Area */}
      <div className="flex-1 flex items-center justify-center p-4 pt-6" onClick={(e) => e.stopPropagation()}>
        <svg 
          viewBox={viewBox} 
          className="w-full h-full text-slate-900 overflow-visible" 
          style={{ transform: 'scaleY(-1)' }}
          onClick={handleSvgClick}
        >
          <defs>
            {/* Proper SW2010 arrowhead markers */}
            <marker id={`arrow-start-${sheetId}-${viewId}`} viewBox="0 0 10 10" refX="0" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 10 1 L 2 5 L 10 9" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </marker>
            <marker id={`arrow-end-${sheetId}-${viewId}`} viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 8 5 L 0 9" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </marker>
            {/* Filled arrowheads */}
            <marker id={`arrow-fill-start-${sheetId}-${viewId}`} viewBox="0 0 10 10" refX="0" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 10 0 L 0 5 L 10 10 z" fill="#3B82F6"/>
            </marker>
            <marker id={`arrow-fill-end-${sheetId}-${viewId}`} viewBox="0 0 10 10" refX="10" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#3B82F6"/>
            </marker>
            {/* Center mark pattern */}
            <pattern id={`centermark-${sheetId}-${viewId}`} width="2" height="2" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.3" fill="#64748B"/>
            </pattern>
            {/* Section hatch pattern for cut faces */}
            {type === 'SECTION' && sectionFill && sectionFill.length > 0 && (
              <pattern id={`hatch-${sheetId}-${viewId}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="6" stroke="#64748B" strokeWidth="0.5" strokeOpacity="0.6"/>
              </pattern>
            )}
          </defs>

          {/* Section fill (hatched cut faces) */}
          {type === 'SECTION' && sectionFill && sectionFill.map((fillPoly: any, fi: number) => (
            <polygon
              key={`sf-${fi}`}
              points={fillPoly.points.map((p: number[]) => `${p[0]},${p[1]}`).join(' ')}
              fill={`url(#hatch-${sheetId}-${viewId})`}
              stroke="#64748B"
              strokeWidth={lineStrokeWidth * 0.5}
              strokeOpacity={0.8}
            />
          ))}

          {/* Model lines */}
          {normalizedLines.map((line: any, i: number) => (
            <polyline
              key={i}
              points={line.points.map((p: any) => `${p[0]},${p[1]}`).join(' ')}
              fill="none"
              stroke={line.visible ? "currentColor" : "#94A3B8"}
              strokeWidth={lineStrokeWidth}
              strokeDasharray={line.visible ? "none" : `${lineStrokeWidth*3},${lineStrokeWidth*2}`}
              strokeOpacity={line.visible ? 1 : 0.4}
              className="group-hover:stroke-primary transition-colors"
            />
          ))}

          {/* Center marks for circular features */}
          {circularCenters.map((center, i) => (
            <g key={`cm-${i}`} transform={`translate(${center.u}, ${center.v})`}>
              {/* Horizontal center line */}
              <line 
                x1={-centerMarkSize - center.radius} 
                y1="0" 
                x2={centerMarkSize + center.radius} 
                y2="0" 
                stroke="#64748B" 
                strokeWidth={dimStrokeWidth * 0.6} 
                strokeDasharray={`${dimStrokeWidth * 2},${dimStrokeWidth * 1.5},${dimStrokeWidth * 0.5},${dimStrokeWidth * 1.5}`}
              />
              {/* Vertical center line */}
              <line 
                x1="0" 
                y1={-centerMarkSize - center.radius} 
                x2="0" 
                y2={centerMarkSize + center.radius} 
                stroke="#64748B" 
                strokeWidth={dimStrokeWidth * 0.6} 
                strokeDasharray={`${dimStrokeWidth * 2},${dimStrokeWidth * 1.5},${dimStrokeWidth * 0.5},${dimStrokeWidth * 1.5}`}
              />
            </g>
          ))}

          {/* Assembly Balloons */}
          {balloons.map((b: any) => (
            <g key={b.id} transform={`translate(${b.u}, ${b.v})`}>
              <line x1="0" y1="0" x2={dimOffset} y2={dimOffset} stroke="#EF4444" strokeWidth={dimStrokeWidth} />
              <g transform={`translate(${dimOffset}, ${dimOffset}) scale(1, -1)`}>
                <circle r={textSize * 0.8} fill="white" stroke="#EF4444" strokeWidth={dimStrokeWidth} />
                <text y={textSize * 0.3} textAnchor="middle" fontSize={textSize * 0.8} fontWeight="black" fill="#EF4444" fontFamily="monospace">{b.label}</text>
              </g>
            </g>
          ))}

          {/* Horizontal Dimensions */}
          {smartDims.filter(d => d.type === 'HORIZ').map((dim, idx) => {
              const isEditing = editingDim?.id === dim.id && editingDim?.type === dim.type;
              const dimY = dim.v - dimOffset - (idx * extOffset * 0.5);
              return (
                <g key={`horiz-${dim.id}-${idx}`}>
                  {/* Extension lines */}
                  <line x1={dim.u} y1={dim.v} x2={dim.u} y2={dimY} stroke="#64748B" strokeWidth={dimStrokeWidth * 0.5} strokeDasharray={`${dimStrokeWidth*2},${dimStrokeWidth}`} />
                  <line x1={dim.u + dim.length} y1={dim.v} x2={dim.u + dim.length} y2={dimY} stroke="#64748B" strokeWidth={dimStrokeWidth * 0.5} strokeDasharray={`${dimStrokeWidth*2},${dimStrokeWidth}`} />
                  {/* Dimension line with arrowheads */}
                  <line 
                    x1={dim.u + 4} y1={dimY} 
                    x2={dim.u + dim.length - 4} y2={dimY} 
                    stroke="#3B82F6" 
                    strokeWidth={dimStrokeWidth} 
                    markerStart={`url(#arrow-fill-start-${sheetId}-${viewId})`} 
                    markerEnd={`url(#arrow-fill-end-${sheetId}-${viewId})`} 
                  />
                  {/* Dimension text box */}
                  <g transform={`translate(${dim.u + dim.length/2}, ${dimY}) scale(1, -1)`} className="cursor-pointer select-none" onDoubleClick={(e) => { e.stopPropagation(); setEditingDim({id: dim.id, type: dim.type, param: dim.param}); setEditValue(dim.value.toString()); }}>
                    <rect x={-rectW/2} y={-rectH/2} width={rectW} height={rectH} fill="white" stroke={isEditing ? '#3B82F6' : '#E2E8F0'} strokeWidth={isEditing ? dimStrokeWidth : dimStrokeWidth/2} rx={rectH*0.2} />
                    {isEditing ? (
                      <foreignObject x={-rectW/2} y={-rectH/2} width={rectW} height={rectH}>
                        <input type="number" step="any" value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') saveDimensionEdit(); else if (e.key === 'Escape') setEditingDim(null); }} autoFocus className="w-full h-full text-center font-mono font-bold text-slate-900 bg-white border-none outline-none" style={{ fontSize: `${textSize}px` }} />
                      </foreignObject>
                    ) : (
                      <text y={rectH * 0.2} textAnchor="middle" fontSize={textSize} fontWeight="bold" fill="#1E293B" fontFamily="monospace">{dim.value.toFixed(1)}</text>
                    )}
                  </g>
                </g>
              );
          })}

          {/* Vertical Dimensions */}
          {smartDims.filter(d => d.type === 'VERT').map((dim, idx) => {
              const isEditing = editingDim?.id === dim.id && editingDim?.type === dim.type;
              const dimX = dim.u - dimOffset - (idx * extOffset * 0.5);
              return (
                <g key={`vert-${dim.id}-${idx}`}>
                  <line x1={dim.u} y1={dim.v} x2={dimX} y2={dim.v} stroke="#64748B" strokeWidth={dimStrokeWidth * 0.5} strokeDasharray={`${dimStrokeWidth*2},${dimStrokeWidth}`} />
                  <line x1={dim.u} y1={dim.v + dim.length} x2={dimX} y2={dim.v + dim.length} stroke="#64748B" strokeWidth={dimStrokeWidth * 0.5} strokeDasharray={`${dimStrokeWidth*2},${dimStrokeWidth}`} />
                  <line 
                    x1={dimX} y1={dim.v + 4} 
                    x2={dimX} y2={dim.v + dim.length - 4} 
                    stroke="#3B82F6" 
                    strokeWidth={dimStrokeWidth} 
                    markerStart={`url(#arrow-fill-start-${sheetId}-${viewId})`} 
                    markerEnd={`url(#arrow-fill-end-${sheetId}-${viewId})`} 
                  />
                  <g transform={`translate(${dimX}, ${dim.v + dim.length/2}) rotate(-90) scale(1, -1)`} className="cursor-pointer select-none" onDoubleClick={(e) => { e.stopPropagation(); setEditingDim({id: dim.id, type: dim.type, param: dim.param}); setEditValue(dim.value.toString()); }}>
                    <rect x={-rectW/2} y={-rectH/2} width={rectW} height={rectH} fill="white" stroke={isEditing ? '#3B82F6' : '#E2E8F0'} strokeWidth={isEditing ? dimStrokeWidth : dimStrokeWidth/2} rx={rectH*0.2} />
                    {isEditing ? (
                      <foreignObject x={-rectW/2} y={-rectH/2} width={rectW} height={rectH}>
                        <input type="number" step="any" value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') saveDimensionEdit(); else if (e.key === 'Escape') setEditingDim(null); }} autoFocus className="w-full h-full text-center font-mono font-bold text-slate-900 bg-white border-none outline-none" style={{ fontSize: `${textSize}px` }} />
                      </foreignObject>
                    ) : (
                      <text y={rectH * 0.2} textAnchor="middle" fontSize={textSize} fontWeight="bold" fill="#1E293B" fontFamily="monospace">{dim.value.toFixed(1)}</text>
                    )}
                  </g>
                </g>
              );
          })}

          {/* Radial Dimensions */}
          {smartDims.filter(d => d.type === 'RADIAL').map((dim) => {
              const isEditing = editingDim?.id === dim.id && editingDim?.type === dim.type;
              const leaderLen = dim.radius + dimOffset * 0.6;
              const angle = Math.PI / 4;
              const lx = dim.u + Math.cos(angle) * leaderLen;
              const ly = dim.v + Math.sin(angle) * leaderLen;
              return (
                <g key={`rad-${dim.id}`}>
                  {/* Leader line from circle edge */}
                  <line 
                    x1={dim.u + Math.cos(angle) * dim.radius} 
                    y1={dim.v + Math.sin(angle) * dim.radius} 
                    x2={lx} 
                    y2={ly} 
                    stroke="#3B82F6" 
                    strokeWidth={dimStrokeWidth} 
                    markerStart={`url(#arrow-fill-start-${sheetId}-${viewId})`} 
                    markerEnd={`url(#arrow-fill-end-${sheetId}-${viewId})`} 
                  />
                  {/* Dimension text */}
                  <g transform={`translate(${lx + 4}, ${ly}) scale(1, -1)`} className="cursor-pointer select-none" onDoubleClick={(e) => { e.stopPropagation(); setEditingDim({id: dim.id, type: dim.type, param: dim.param}); setEditValue(dim.value.toString()); }}>
                    <rect x={-rectW/2} y={-rectH/2} width={rectW} height={rectH} fill="white" stroke={isEditing ? '#3B82F6' : '#E2E8F0'} strokeWidth={isEditing ? dimStrokeWidth : dimStrokeWidth/2} rx={rectH*0.2} />
                    {isEditing ? (
                      <foreignObject x={-rectW/2} y={-rectH/2} width={rectW} height={rectH}>
                        <input type="number" step="any" value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') saveDimensionEdit(); else if (e.key === 'Escape') setEditingDim(null); }} autoFocus className="w-full h-full text-center font-mono font-bold text-slate-900 bg-white border-none outline-none" style={{ fontSize: `${textSize}px` }} />
                      </foreignObject>
                    ) : (
                      <text y={rectH * 0.2} textAnchor="start" fontSize={textSize} fontWeight="bold" fill="#1E293B" fontFamily="monospace">R{dim.radius.toFixed(1)}</text>
                    )}
                  </g>
                </g>
              );
          })}

          {/* Section cut line preview */}
          {showSectionTool && isDrawingSection && sectionStart && (
            <line 
              x1={sectionStart.u} y1={sectionStart.v} 
              x2={sectionStart.u} y2={sectionStart.v} 
              stroke="#F59E0B" 
              strokeWidth="2" 
              strokeDasharray="6,3"
            />
          )}
          {sectionStart && sectionEnd && (
            <g>
              <line 
                x1={sectionStart.u} y1={sectionStart.v} 
                x2={sectionEnd.u} y2={sectionEnd.v} 
                stroke="#F59E0B" 
                strokeWidth="2" 
                strokeDasharray="8,4"
              />
              {/* Arrowheads on section line */}
              <polygon 
                points={`${sectionEnd.u},${sectionEnd.v} ${sectionEnd.u - 6 * Math.cos(Math.atan2(sectionEnd.v - sectionStart.v, sectionEnd.u - sectionStart.u)) - 3 * Math.sin(Math.atan2(sectionEnd.v - sectionStart.v, sectionEnd.u - sectionStart.u))},${sectionEnd.v - 3 * Math.cos(Math.atan2(sectionEnd.v - sectionStart.v, sectionEnd.u - sectionStart.u))} ${sectionEnd.u - 6 * Math.cos(Math.atan2(sectionEnd.v - sectionStart.v, sectionEnd.u - sectionStart.u)) + 3 * Math.sin(Math.atan2(sectionEnd.v - sectionStart.v, sectionEnd.u - sectionStart.u))},${sectionEnd.v + 3 * Math.cos(Math.atan2(sectionEnd.v - sectionStart.v, sectionEnd.u - sectionStart.u))}`}
                fill="#F59E0B"
              />
              <text 
                x={(sectionStart.u + sectionEnd.u) / 2} 
                y={(sectionStart.v + sectionEnd.v) / 2 - 6} 
                textAnchor="middle" 
                fontSize={textSize * 0.8} 
                fill="#F59E0B" 
                fontWeight="bold"
              >
                A
              </text>
            </g>
          )}

          {/* Section line from parent (for section views) */}
          {sectionLine && (
            <line 
              x1={sectionLine.u1} y1={sectionLine.v1} 
              x2={sectionLine.u2} y2={sectionLine.v2} 
              stroke="#F59E0B" 
              strokeWidth="1.5" 
              strokeDasharray="6,3"
            />
          )}

          {/* Detail bounds circle on parent view */}
          {detailBounds && (
            <g>
              <circle
                cx={detailBounds.cx}
                cy={detailBounds.cy}
                r={detailBounds.radius}
                fill="none"
                stroke="#10B981"
                strokeWidth="2"
                strokeDasharray="6,3"
              />
              <text
                x={detailBounds.cx}
                y={detailBounds.cy - detailBounds.radius - 6}
                textAnchor="middle"
                fontSize={textSize * 0.8}
                fill="#10B981"
                fontWeight="bold"
              >
                DETAIL
              </text>
            </g>
          )}

          {/* Detail circle preview while drawing */}
          {showDetailTool && isDrawingDetail && detailCenter && (
            <circle
              cx={detailCenter.u}
              cy={detailCenter.v}
              r={Math.max(detailRadius, 5)}
              fill="none"
              stroke="#10B981"
              strokeWidth="2"
              strokeDasharray="6,3"
            />
          )}

          {/* Dimension overlay for auto-generated linear dimensions */}
          <DimensionOverlay 
            lines={normalizedLines}
            viewId={viewId}
            viewData={{ id: viewId, type: type as any, title, position: { x: 0, y: 0, w: 0, h: 0 }, scale, showDimensions }}
            showDimensions={showDimensions}
          />

          {/* Centerlines and annotation overlay */}
          <AnnotationLayer
            lines={normalizedLines}
            showCenterlines={showDimensions}
            annotations={[]}
          />
        </svg>
      </div>

      {/* Bottom status bar */}
      <div className="px-2 py-0.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-[7px] text-slate-400">
        <span>{type.toLowerCase()} VIEW</span>
        <span>SCALE {scale}</span>
      </div>
    </div>
  );
};

// ─── Sheet Tab Component ────────────────────────────────────────────────────

interface SheetTabProps {
  sheet: { id: string; name: string; viewCount: number };
  isActive: boolean;
  onActivate: () => void;
  onRename: () => void;
  onDelete: () => void;
}

const SheetTab = ({ sheet, isActive, onActivate, onRename, onDelete }: SheetTabProps) => {
  const [contextPos, setContextPos] = useState<{x: number, y: number} | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <button
        onClick={onActivate}
        onContextMenu={handleContextMenu}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold border-t-2 transition-all whitespace-nowrap ${
          isActive
            ? 'bg-white border-primary text-primary'
            : 'bg-slate-200/50 border-transparent text-slate-500 hover:bg-slate-200 hover:text-slate-700'
        }`}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
        </svg>
        {sheet.name}
        <span className={`text-[8px] ${isActive ? 'text-primary' : 'text-slate-400'}`}>{sheet.viewCount}</span>
      </button>
      {contextPos && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setContextPos(null)} />
          <div className="fixed z-50 bg-white border border-slate-200 rounded-lg shadow-xl py-1 min-w-[120px]" style={{ left: contextPos.x, top: contextPos.y }}>
            <button
              onClick={() => { onRename(); setContextPos(null); }}
              className="block w-full text-left px-3 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-100"
            >
              Rename
            </button>
            <button
              onClick={() => { onDelete(); setContextPos(null); }}
              className="block w-full text-left px-3 py-1.5 text-[10px] font-bold text-red-600 hover:bg-red-50"
            >
              Delete Sheet
            </button>
          </div>
        </>
      )}
    </>
  );
};

// ─── DrawingSheet Component ─────────────────────────────────────────────────

export const DrawingSheet = () => {
  const { 
    components, features, mode, projectName, 
    drawingScale, drawnBy, approvedBy, 
    partMaterial, massProperties,
    drawingSheets, activeSheetId, setDrawingSheets, setActiveSheet,
    addDrawingSheet, deleteDrawingSheet, renameDrawingSheet,
    updateViewPosition, addViewToSheet,
  } = useCadStore();

  const [projections, setProjections] = useState<Record<string, any[]>>({
    FRONT: [],
    TOP: [],
    RIGHT: [],
    ISO: [],
    SECTION: [],
  });

  const [isRebuilding, setIsRebuilding] = useState<boolean>(false);
  const [renamingSheetId, setRenamingSheetId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [sectionData, setSectionData] = useState<Record<string, any>>({});
  const [detailBounds, setDetailBounds] = useState<Record<string, { cx: number; cy: number; radius: number }>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const activeSheet = useMemo(() => 
    drawingSheets.find(s => s.id === activeSheetId) || drawingSheets[0],
    [drawingSheets, activeSheetId]
  );

  const calculateMass = () => {
    if (!massProperties) return 0;
    const density: Record<string, number> = {
      'Steel': 0.00785,
      'Aluminum': 0.0027,
      'Gold': 0.0193,
      'Copper': 0.00896,
      'Glossy Plastic': 0.0011,
      'Matte Plastic': 0.0011,
      'Glass': 0.0025,
    };
    return massProperties.volume * (density[partMaterial] || 0.00785);
  };

  const totalMass = calculateMass();

  useEffect(() => {
    const fetchProjections = async () => {
      setIsRebuilding(true);
      const client = HeavyEngineClient.getInstance();
      const viewTypes = ['FRONT', 'TOP', 'RIGHT', 'ISO', 'SECTION'];
      const newProjections: Record<string, any[]> = { ...projections };

      for (const view of viewTypes) {
        try {
          const lines = mode === 'ASSEMBLY' 
            ? await client.projectAssembly(components, view)
            : await client.project(features, view);
          newProjections[view] = lines;
        } catch (e) {
          console.error(`Failed to fetch projection for ${view}`, e);
        }
      }
      
      setProjections(newProjections);
      setIsRebuilding(false);
    };

    if (features.length > 0 || components.length > 0) {
      fetchProjections();
    }
  }, [features, components, mode]);

  // Drag handlers
  const [draggingViewId, setDraggingViewId] = React.useState<string | null>(null);
  const dragOffsets = useRef<{x: number, y: number} | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const viewId = event.active.id as string;
    setDraggingViewId(viewId);
    const sheet = drawingSheets.find(s => s.id === activeSheetId);
    const view = sheet?.views.find(v => v.id === viewId);
    if (view && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      dragOffsets.current = {
        x: event.active.rect.current?.translated?.left ?? 0 - rect.left,
        y: event.active.rect.current?.translated?.top ?? 0 - rect.top,
      };
    }
  };

  const handleDragMove = (event: DragMoveEvent) => {
    if (!draggingViewId || !dragOffsets.current) return;
    const sheet = drawingSheets.find(s => s.id === activeSheetId);
    const view = sheet?.views.find(v => v.id === draggingViewId);
    if (!view) return;

    const newX = (event.delta.x) ;
    const newY = event.delta.y;
    updateViewPosition(activeSheetId, draggingViewId, {
      ...view.position,
      x: Math.max(0, newX),
      y: Math.max(0, newY),
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingViewId(null);
    dragOffsets.current = null;
  };

  const handleSectionCreated = useCallback((parentViewId: string, data: any) => {
    setSectionData(prev => ({ ...prev, [parentViewId]: data }));
  }, []);

  const handleDetailCreated = useCallback((parentViewId: string, bounds: { cx: number; cy: number; radius: number }) => {
    setDetailBounds(prev => ({ ...prev, [parentViewId]: bounds }));
  }, []);

  const handleRenameSheet = (sheetId: string) => {
    const sheet = drawingSheets.find(s => s.id === sheetId);
    setRenamingSheetId(sheetId);
    setRenameValue(sheet?.name || '');
  };

  const confirmRename = () => {
    if (renamingSheetId && renameValue.trim()) {
      renameDrawingSheet(renamingSheetId, renameValue.trim());
    }
    setRenamingSheetId(null);
    setRenameValue('');
  };

  const activeSheetData = drawingSheets.find(s => s.id === activeSheetId);

  return (
    <div className="flex-1 h-full bg-[#CBD5E1] p-4 overflow-auto flex flex-col">
      {/* Sheet Container */}
      <div 
        ref={containerRef}
        id="drawing-sheet-container" 
        className="w-[1120px] min-h-[792px] bg-white shadow-2xl relative flex flex-col border-[6px] border-slate-900 mx-auto"
      >
        
        {/* Drawing Border & Frame Reference */}
        <div className="absolute inset-3 border-2 border-slate-900 pointer-events-none flex flex-col">
          <div className="flex justify-between px-6 py-0.5 text-[9px] font-black text-slate-300">
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <span key={n}>{n}</span>)}
          </div>
          <div className="flex-1 flex justify-between">
            <div className="flex flex-col justify-around py-2 px-0.5 text-[9px] font-black text-slate-300">
              {['A','B','C','D','E'].map(l => <span key={l}>{l}</span>)}
            </div>
            <div className="flex-1" />
            <div className="flex flex-col justify-around py-2 px-0.5 text-[9px] font-black text-slate-300">
              {['A','B','C','D','E'].map(l => <span key={l}>{l}</span>)}
            </div>
          </div>
          <div className="flex justify-between px-6 py-0.5 text-[9px] font-black text-slate-300">
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <span key={n}>{n}</span>)}
          </div>
        </div>

        {isRebuilding && (
          <div className="absolute top-14 right-8 bg-primary text-white px-3 py-1 rounded-full shadow-lg flex items-center gap-2 z-[999] backdrop-blur-md animate-pulse">
            <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
            <span className="text-[9px] font-black uppercase tracking-widest">Rebuilding Views...</span>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-1.5 relative z-10 mx-5 mt-5">
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">Industrial Engineering Drawing</span>
            <div className="flex items-center gap-2 mt-0.5">
               <span className="text-[9px] font-bold text-slate-500">ISO 128-1 / ASME Y14.5M</span>
               <div className="w-1 h-1 rounded-full bg-emerald-500" />
               <span className="text-[9px] font-black text-slate-900">VERIFIED SW2000 PARITY</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                if (activeSheetData) {
                  addViewToSheet('FRONT', activeSheetId, undefined);
                }
              }} 
              className="px-3 py-1 text-[9px] font-black uppercase rounded shadow-sm border bg-white border-slate-300 text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add View
            </button>
          </div>
        </div>

        {/* View Grid */}
        <div className="flex-1 min-h-0 mx-5 my-4 relative z-10 overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          >
            <div className="grid gap-3 h-full" style={{ 
              gridTemplateColumns: `repeat(${activeSheetData?.views.length && activeSheetData.views.length % 2 !== 0 ? activeSheetData.views.length : Math.ceil((activeSheetData?.views.length || 0) / 1) / 2 || 2}, 1fr)`,
              gridTemplateRows: `repeat(${activeSheetData && activeSheetData.views.length > 0 ? Math.ceil(activeSheetData.views.length / 2) : 2}, 1fr)` ,
            }}>
              {activeSheetData?.views.map((viewData: DrawingViewData) => {
                // For DETAIL views, inherit lines from the parent view
                let viewLines: any[] = [];
                if (viewData.type === 'DETAIL' && viewData.parentViewId) {
                  const detailParentView = activeSheetData?.views.find(v => v.id === viewData.parentViewId);
                  if (detailParentView) {
                    // If parent is a SECTION view, use its section data lines
                    if (detailParentView.type === 'SECTION' && sectionData[viewData.parentViewId]) {
                      viewLines = sectionData[viewData.parentViewId]?.visible_lines || [];
                    } else {
                      viewLines = projections[detailParentView.type] || [];
                    }
                  }
                } else {
                  viewLines = projections[viewData.type] || [];
                }
                return (
                <DrawingView
                  key={viewData.id}
                  title={viewData.title}
                  type={viewData.type}
                  lines={viewLines}
                  showDimensions={viewData.showDimensions}
                  components={components}
                  scale={viewData.scale}
                  sheetId={activeSheetId}
                  viewId={viewData.id}
                  parentViewId={viewData.parentViewId}
                  sectionLine={viewData.sectionLine}
                  sectionFill={viewData.type === 'SECTION' && viewData.parentViewId ? (sectionData[viewData.parentViewId]?.section_fill || []) : undefined}
                  detailBounds={viewData.parentViewId ? (detailBounds[viewData.parentViewId] || null) : null}
                  isDragging={draggingViewId === viewData.id}
                  onSectionCreated={handleSectionCreated}
                  onDetailCreated={handleDetailCreated}
                />
              );
            })}
            </div>
          </DndContext>
        </div>

        {/* BOM and Title Block Container */}
        <div className="flex gap-4 mt-auto relative z-10 mx-5 mb-5 h-[150px]">
          {/* BOM */}
          <div className="flex-1 border-2 border-slate-900 bg-white overflow-hidden flex flex-col">
            <div className="text-[10px] font-black uppercase bg-slate-900 text-white px-2 py-1 flex justify-between items-center">
               <span>Bill of Materials</span>
               <span className="text-[8px] opacity-70">AUTO-GENERATED</span>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-[10px]">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b-2 border-slate-900 text-slate-900 uppercase font-black text-[8px]">
                    <th className="px-2 py-0.5 w-10">Item</th>
                    <th>Part Number</th>
                    <th>Material</th>
                    <th className="text-right px-2">QTY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {components.length > 0 ? (
                    components.reduce((acc: any[], comp) => {
                      const existing = acc.find((item: any) => item.partId === comp.partId);
                      if (existing) {
                        existing.qty += 1;
                      } else {
                        acc.push({ partId: comp.partId, name: comp.instanceName, qty: 1, material: partMaterial });
                      }
                      return acc;
                    }, []).map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-2 py-1 font-black text-slate-400">{idx + 1}</td>
                        <td className="font-bold text-slate-900">{item.partId}</td>
                        <td className="italic text-slate-500">{item.material}</td>
                        <td className="text-right px-2 font-mono font-black">{item.qty}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="hover:bg-slate-50">
                      <td className="px-2 py-1 font-black text-slate-400">1</td>
                      <td className="font-bold text-slate-900">PART-999-001</td>
                      <td className="italic text-slate-500">{partMaterial}</td>
                      <td className="text-right px-2 font-mono font-black">1</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Title Block */}
          <div className="w-[400px] grid grid-cols-6 grid-rows-4 border-2 border-slate-900 bg-white text-[8px] font-bold uppercase overflow-hidden">
            <div className="col-span-3 row-span-1 border-r border-b border-slate-900 p-0.5 flex flex-col">
               <span className="text-[6px] text-slate-400">Project Name</span>
               <span className="text-[10px] font-black truncate">{projectName}</span>
            </div>
            <div className="col-span-1 row-span-1 border-r border-b border-slate-900 p-0.5 flex flex-col">
               <span className="text-[6px] text-slate-400">Revision</span>
               <span className="text-[10px] font-black text-center">A.1</span>
            </div>
            <div className="col-span-2 row-span-1 border-b border-slate-900 p-0.5 flex flex-col">
               <span className="text-[6px] text-slate-400">Date</span>
               <span className="text-[9px] font-black">{new Date().toLocaleDateString()}</span>
            </div>

            <div className="col-span-2 row-span-1 border-r border-b border-slate-900 p-0.5 flex flex-col">
               <span className="text-[6px] text-slate-400">Drawn By</span>
               <span className="truncate">{drawnBy}</span>
            </div>
            <div className="col-span-2 row-span-1 border-r border-b border-slate-900 p-0.5 flex flex-col">
               <span className="text-[6px] text-slate-400">Approved By</span>
               <span className="truncate">{approvedBy}</span>
            </div>
            <div className="col-span-2 row-span-1 border-b border-slate-900 p-0.5 flex flex-col">
               <span className="text-[6px] text-slate-400">Material</span>
               <span className="truncate text-indigo-600">{partMaterial}</span>
            </div>

            <div className="col-span-4 row-span-2 border-r border-slate-900 p-1.5 flex flex-col justify-center bg-slate-50/50">
               <span className="text-[6px] text-slate-400">Drawing Title / Part ID</span>
               <span className="text-base font-black text-slate-900 leading-tight">3DB-{projectName.slice(0,3).toUpperCase()}-REF</span>
            </div>
            
            <div className="col-span-1 row-span-1 border-r border-b border-slate-900 p-0.5 flex flex-col">
               <span className="text-[6px] text-slate-400">Scale</span>
               <span className="text-center font-black">{drawingScale}</span>
            </div>
            <div className="col-span-1 row-span-1 border-b border-slate-900 p-0.5 flex flex-col">
               <span className="text-[6px] text-slate-400">Sheet</span>
               <span className="text-center">{drawingSheets.findIndex(s => s.id === activeSheetId) + 1} of {drawingSheets.length}</span>
            </div>
            <div className="col-span-2 row-span-1 p-0.5 flex flex-col bg-amber-50/30">
               <span className="text-[6px] text-slate-400">Weight (g)</span>
               <span className="text-[11px] font-black text-amber-700 text-right pr-1">
                 {totalMass > 0 ? totalMass.toFixed(2) : '—'}
               </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sheet Tabs Bar */}
      <div className="mt-2 mx-auto w-[1120px]">
        <div className="flex items-center gap-2 mb-1">
          <SheetFormatSelector
            currentSize={activeSheetData?.sheetSize || 'A4'}
            onChange={(size: string) => {
              const validSizes = ['A4', 'A3', 'A2', 'A1', 'A0'] as const;
              const sheetSize = validSizes.includes(size as any) ? size : 'A4';
              // Update active sheet with new size
              setDrawingSheets(drawingSheets.map(s => 
                s.id === activeSheetId ? { ...s, sheetSize: sheetSize as any } : s
              ));
            }}
          />
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
            Third Angle Projection
          </span>
        </div>
        <div className="flex items-center gap-0 bg-slate-300/50 border border-slate-400 rounded-t-lg overflow-x-auto">
          {drawingSheets.map(sheet => (
            <SheetTab
              key={sheet.id}
              sheet={{ ...sheet, viewCount: sheet.views.length }}
              isActive={sheet.id === activeSheetId}
              onActivate={() => setActiveSheet(sheet.id)}
              onRename={() => handleRenameSheet(sheet.id)}
              onDelete={() => deleteDrawingSheet(sheet.id)}
            />
          ))}
          {/* Add Sheet Button */}
          <button
            onClick={() => addDrawingSheet(`Sheet ${drawingSheets.length + 1}`)}
            className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold text-slate-500 hover:bg-slate-200 hover:text-slate-700 border-t-2 border-transparent transition-all ml-auto"
            title="Add new sheet"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
        {/* Sheet content area background */}
        <div className="bg-slate-300/30 h-1 w-full" />
      </div>

      {/* Rename Modal */}
      {renamingSheetId && (
        <div className="fixed inset-0 bg-black/30 z-[100] flex items-center justify-center" onClick={() => setRenamingSheetId(null)}>
          <div className="bg-white rounded-lg shadow-xl p-4 w-[280px]" onClick={(e) => e.stopPropagation()}>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Rename Sheet</label>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setRenamingSheetId(null); }}
              autoFocus
              className="w-full mt-1 px-2 py-1 border border-slate-300 rounded text-[11px] font-bold focus:outline-none focus:border-primary"
            />
            <div className="flex gap-2 mt-3 justify-end">
              <button onClick={() => setRenamingSheetId(null)} className="px-3 py-1 text-[9px] font-bold bg-slate-100 text-slate-600 rounded hover:bg-slate-200">Cancel</button>
              <button onClick={confirmRename} className="px-3 py-1 text-[9px] font-bold bg-primary text-white rounded hover:bg-blue-700">Rename</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
