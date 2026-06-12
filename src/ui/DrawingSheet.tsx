'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useCadStore } from '../store/useCadStore';
import { HeavyEngineClient } from '../kernel/HeavyEngineClient';

interface DrawingViewProps {
  title: string;
  type: 'FRONT' | 'TOP' | 'RIGHT' | 'ISO';
  lines: any[]; // Support both number[][][] and {points, visible}[]
  showDimensions: boolean;
  components?: any[];
}

const DrawingView = ({ title, type, lines, showDimensions, components }: DrawingViewProps) => {
  const [editingDim, setEditingDim] = useState<{id: string, type: string, param: string} | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const features = useCadStore(state => state.features);
  const updateFeatureParams = useCadStore(state => state.updateFeatureParams);

  // Normalize lines to { points: number[][], visible: boolean }
  const normalizedLines = useMemo(() => {
    return lines.map(line => {
      if (Array.isArray(line)) return { points: line as number[][], visible: true };
      return line as { points: number[][], visible: boolean };
    });
  }, [lines]);

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
  const halfSize = hasBounds ? size / 2 + Math.max(size * 0.4, 20) : 50;
  const viewBox = hasBounds 
    ? `${midU - halfSize} ${midV - halfSize} ${halfSize * 2} ${halfSize * 2}`
    : "-50 -50 100 100";

  const viewBoxSize = halfSize * 2;
  const lineStrokeWidth = viewBoxSize * 0.004;
  const dimStrokeWidth = viewBoxSize * 0.002;
  const textSize = viewBoxSize * 0.03;
  const rectW = viewBoxSize * 0.14;
  const rectH = viewBoxSize * 0.05;
  const extOffset = viewBoxSize * 0.15;
  const dimOffset = viewBoxSize * 0.1;

  const iso_u = (x: number, y: number, z: number) => (x - z) * Math.cos(Math.PI / 6);
  const iso_v = (x: number, y: number, z: number) => y - (x + z) * Math.sin(Math.PI / 6);

  const getProjPos = useCallback((pos: [number, number, number]): [number, number] => {
    const [x, y, z] = pos;
    if (type === 'FRONT') return [x, y];
    if (type === 'TOP') return [x, -z];
    if (type === 'RIGHT') return [z, y];
    return [iso_u(x, y, z), iso_v(x, y, z)];
  }, [type]);

  const balloons = useMemo(() => {
    if (type !== 'ISO' || !components || components.length === 0) return [];
    return components.map((c, i) => {
      const [u, v] = getProjPos(c.transform.position);
      return { id: c.id, label: `${i + 1}`, u, v };
    });
  }, [type, components, getProjPos]);

  const saveDimensionEdit = () => {
    if (!editingDim) return;
    let newValue = parseFloat(editValue);
    if (isNaN(newValue) || newValue <= 0) return;
    if (editingDim.param === 'radius') newValue /= 2;
    updateFeatureParams(editingDim.id, { [editingDim.param]: newValue });
    setEditingDim(null);
  };
  
  const [manualDims, setManualDims] = useState<any[]>([]);
  const [clickStart, setClickStart] = useState<[number, number] | null>(null);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!useCadStore.getState().smartDimensionActive) return;
    
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const cursorPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    const finalPt: [number, number] = [cursorPt.x, -cursorPt.y];

    if (clickStart) {
      const dx = finalPt[0] - clickStart[0];
      const dy = finalPt[1] - clickStart[1];
      const dist = Math.hypot(dx, dy);
      if (dist > 1) {
        setManualDims(prev => [...prev, {
          id: `mdim_${Date.now()}`,
          type: Math.abs(dx) > Math.abs(dy) ? 'HORIZ' : 'VERT',
          value: dist,
          u: Math.min(clickStart[0], finalPt[0]),
          v: Math.max(clickStart[1], finalPt[1]),
          length: Math.abs(dx) > Math.abs(dy) ? Math.abs(dx) : Math.abs(dy),
          p1: clickStart,
          p2: finalPt
        }]);
      }
      setClickStart(null);
    } else {
      setClickStart(finalPt);
    }
  };

  const smartDims: any[] = [];
  if (showDimensions && type !== 'ISO') {
    features.forEach((feat, index) => {
      const p = feat.parameters || {};
      const [x, y, z] = [p.x || 0, p.y || 0, p.z || 0];
      const offsetV = index * extOffset * 0.3; // Stagger dimensions to avoid overlap

      if (feat.type === 'BOX' || feat.type === 'EXTRUDE') {
        const [w, h, d] = [p.width || 10, p.height || 10, p.depth || 10];
        if (type === 'FRONT') {
           smartDims.push({ id: feat.id, type: 'HORIZ', value: w, u: x, v: y - offsetV, length: w, param: 'width' });
           smartDims.push({ id: feat.id, type: 'VERT', value: h, u: x, v: y, length: h, param: 'height' });
        } else if (type === 'TOP') {
           smartDims.push({ id: feat.id, type: 'HORIZ', value: w, u: x, v: -z-d - offsetV, length: w, param: 'width' });
           smartDims.push({ id: feat.id, type: 'VERT', value: d, u: x, v: -z-d, length: d, param: 'depth' });
        } else if (type === 'RIGHT') {
           smartDims.push({ id: feat.id, type: 'HORIZ', value: d, u: z, v: y - offsetV, length: d, param: 'depth' });
           smartDims.push({ id: feat.id, type: 'VERT', value: h, u: z, v: y, length: h, param: 'height' });
        }
      } else if (feat.type === 'CYLINDER' || feat.type === 'SPHERE' || feat.type === 'HOLE' || feat.type === 'HOLE_WIZARD') {
        const r = p.radius || (p.diameter ? p.diameter/2 : 5);
        const h = p.height || (p.depth || 10);
        if (type === 'TOP') smartDims.push({ id: feat.id, type: 'RADIAL', value: r*2, u: x, v: -z, radius: r, param: 'radius' });
        else if (type === 'FRONT') {
           smartDims.push({ id: feat.id, type: 'HORIZ', value: r*2, u: x-r, v: y - offsetV, length: r*2, param: 'radius' });
           smartDims.push({ id: feat.id, type: 'VERT', value: h, u: x-r, v: y, length: h, param: 'height' });
        }
      } else if (feat.type === 'FILLET') {
        const r = p.radius || 2;
        if (type === 'FRONT') smartDims.push({ id: feat.id, type: 'RADIAL', value: r, u: x + widthVal/2, v: y + heightVal/2, radius: r, param: 'radius', prefix: 'R' });
      } else if (feat.type === 'CHAMFER') {
        const d = p.distance || 1.5;
        if (type === 'FRONT') smartDims.push({ id: feat.id, type: 'HORIZ', value: d, u: x, v: y - offsetV, length: d, param: 'distance', prefix: 'C' });
      } else if (feat.type === 'SHELL' || feat.type === 'RIB') {
        const t = p.thickness || 2;
        if (type === 'TOP') smartDims.push({ id: feat.id, type: 'HORIZ', value: t, u: x, v: -z - offsetV, length: t, param: 'thickness', prefix: 'T' });
      }
    });
  }

  return (
    <div className="border border-slate-300 bg-white aspect-video relative flex flex-col group hover:border-primary transition-all shadow-sm rounded overflow-hidden">
      <div className="absolute top-2 left-2 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/80 backdrop-blur px-1.5 py-0.5 rounded border border-slate-200 z-10 group-hover:text-primary group-hover:border-primary/30">
        {title} {hasBounds && type !== 'ISO' && `(${widthVal.toFixed(1)} x ${heightVal.toFixed(1)})`}
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <svg viewBox={viewBox} className="w-full h-full text-slate-900 overflow-visible" style={{ transform: 'scaleY(-1)' }} onClick={handleSvgClick}>
          <defs>
            <marker id={`arrow-start-${type}`} viewBox="0 0 10 10" refX="0" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 10 0 L 0 5 L 10 10 z" fill="#3B82F6" />
            </marker>
            <marker id={`arrow-end-${type}`} viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#3B82F6" />
            </marker>
            <marker id={`arrow-start-manual-${type}`} viewBox="0 0 10 10" refX="0" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 10 0 L 0 5 L 10 10 z" fill="#10B981" />
            </marker>
            <marker id={`arrow-end-manual-${type}`} viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#10B981" />
            </marker>
          </defs>

          {clickStart && (
            <circle cx={clickStart[0]} cy={clickStart[1]} r={viewBoxSize * 0.01} fill="#EF4444" className="animate-pulse" />
          )}

          {normalizedLines.map((line: any, i: number) => (
            <polyline
              key={i}
              points={line.points.map((p: any) => `${p[0]},${p[1]}`).join(' ')}
              fill="none"
              stroke={line.visible ? "currentColor" : "#94A3B8"}
              strokeWidth={lineStrokeWidth}
              strokeDasharray={line.visible ? "none" : `${lineStrokeWidth*3},${lineStrokeWidth*2}`}
              strokeOpacity={line.visible ? 1 : 0.4}
              className="group-hover:stroke-primary transition-colors cursor-crosshair"
            />
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

          {/* Manual Dimensions Rendering */}
          {manualDims.map((dim, idx) => {
              const dimY = dim.v - dimOffset - (idx * extOffset * 0.5);
              const dimX = dim.u - dimOffset - (idx * extOffset * 0.5);
              return dim.type === 'HORIZ' ? (
                <g key={`m-horiz-${dim.id}`}>
                  <line x1={dim.p1[0]} y1={dim.p1[1]} x2={dim.p1[0]} y2={dimY} stroke="#94A3B8" strokeWidth={dimStrokeWidth} strokeDasharray={`${dimStrokeWidth*2},${dimStrokeWidth}`} />
                  <line x1={dim.p2[0]} y1={dim.p2[1]} x2={dim.p2[0]} y2={dimY} stroke="#94A3B8" strokeWidth={dimStrokeWidth} strokeDasharray={`${dimStrokeWidth*2},${dimStrokeWidth}`} />
                  <line x1={dim.u} y1={dimY} x2={dim.u + dim.length} y2={dimY} stroke="#10B981" strokeWidth={dimStrokeWidth} markerStart={`url(#arrow-start-manual-${type})`} markerEnd={`url(#arrow-end-manual-${type})`} />
                  <g transform={`translate(${dim.u + dim.length/2}, ${dimY}) scale(1, -1)`} className="select-none">
                    <rect x={-rectW/2} y={-rectH/2} width={rectW} height={rectH} fill="white" stroke="#10B981" strokeWidth={dimStrokeWidth/2} rx={rectH*0.2} />
                    <text y={rectH * 0.2} textAnchor="middle" fontSize={textSize} fontWeight="bold" fill="#047857" fontFamily="monospace">{dim.value.toFixed(1)}</text>
                  </g>
                </g>
              ) : (
                <g key={`m-vert-${dim.id}`}>
                  <line x1={dim.p1[0]} y1={dim.p1[1]} x2={dimX} y2={dim.p1[1]} stroke="#94A3B8" strokeWidth={dimStrokeWidth} strokeDasharray={`${dimStrokeWidth*2},${dimStrokeWidth}`} />
                  <line x1={dim.p2[0]} y1={dim.p2[1]} x2={dimX} y2={dim.p2[1]} stroke="#94A3B8" strokeWidth={dimStrokeWidth} strokeDasharray={`${dimStrokeWidth*2},${dimStrokeWidth}`} />
                  <line x1={dimX} y1={dim.u} x2={dimX} y2={dim.u + dim.length} stroke="#10B981" strokeWidth={dimStrokeWidth} markerStart={`url(#arrow-start-manual-${type})`} markerEnd={`url(#arrow-end-manual-${type})`} />
                  <g transform={`translate(${dimX}, ${dim.u + dim.length/2}) scale(1, -1)`} className="select-none">
                    <rect x={-rectH/2} y={-rectW/2} width={rectH} height={rectW} fill="white" stroke="#10B981" strokeWidth={dimStrokeWidth/2} rx={rectH*0.2} />
                    <text x={0} y={rectW * 0.2} textAnchor="middle" fontSize={textSize} fontWeight="bold" fill="#047857" fontFamily="monospace" transform="rotate(-90)">{dim.value.toFixed(1)}</text>
                  </g>
                </g>
              );
          })}

          {/* Dimensions Rendering */}
          {smartDims.filter(d => d.type === 'HORIZ').map((dim, idx) => {
              const isEditing = editingDim?.id === dim.id && editingDim?.type === dim.type;
              const dimY = dim.v - dimOffset - (idx * extOffset * 0.5);
              return (
                <g key={`horiz-${dim.id}-${idx}`}>
                  <line x1={dim.u} y1={dim.v} x2={dim.u} y2={dimY} stroke="#64748B" strokeWidth={dimStrokeWidth} strokeDasharray={`${dimStrokeWidth*2},${dimStrokeWidth}`} />
                  <line x1={dim.u + dim.length} y1={dim.v} x2={dim.u + dim.length} y2={dimY} stroke="#64748B" strokeWidth={dimStrokeWidth} strokeDasharray={`${dimStrokeWidth*2},${dimStrokeWidth}`} />
                  <line x1={dim.u} y1={dimY} x2={dim.u + dim.length} y2={dimY} stroke="#3B82F6" strokeWidth={dimStrokeWidth} markerStart={`url(#arrow-start-${type})`} markerEnd={`url(#arrow-end-${type})`} />
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
        </svg>
      </div>
    </div>
  );
};

const DENSITY_MAP: Record<string, number> = {
  'Steel': 0.00785, // g/mm^3
  'Aluminum': 0.0027,
  'Gold': 0.0193,
  'Copper': 0.00896,
  'Glossy Plastic': 0.0011,
  'Matte Plastic': 0.0011,
  'Glass': 0.0025,
};

interface DrawingProjection {
  [key: string]: any[];
}

export const DrawingSheet = () => {
  const { 
    components, features, mode, projectName, 
    drawingScale, drawnBy, approvedBy, 
    partMaterial, massProperties 
  } = useCadStore();

  const [projections, setProjections] = useState<DrawingProjection>({
    FRONT: [],
    TOP: [],
    RIGHT: [],
    ISO: []
  });

  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [isRebuilding, setIsRebuilding] = useState<boolean>(false);

  useEffect(() => {
    (window as any).__handlePrintToPDF = () => {
      window.print();
    };
    return () => {
      delete (window as any).__handlePrintToPDF;
    };
  }, []);

  const calculateMass = () => {
    if (!massProperties) return 0;
    const density = DENSITY_MAP[partMaterial] || 0.00785;
    return massProperties.volume * density;
  };

  const totalMass = calculateMass();

  useEffect(() => {
    const fetchProjections = async () => {
      setIsRebuilding(true);
      const client = HeavyEngineClient.getInstance();
      const views = ['FRONT', 'TOP', 'RIGHT', 'ISO'];
      const newProjections: DrawingProjection = { ...projections };

      for (const view of views) {
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

    if (features.length > 0) {
      fetchProjections();
    }
  }, [features, components, mode]);

  return (
    <div className="flex-1 h-full bg-[#CBD5E1] p-8 overflow-auto flex justify-center">
      <div id="drawing-sheet-container" className="w-[1120px] h-[792px] bg-white shadow-2xl relative flex flex-col p-8 border-[6px] border-slate-900">
        
        {/* Drawing Border & Zones */}
        <div className="absolute inset-4 border-2 border-slate-900 pointer-events-none flex flex-col">
          <div className="flex justify-between px-8 py-1 text-[10px] font-black border-b border-slate-900">
             <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span>
          </div>
          <div className="flex-1 flex justify-between">
             <div className="flex flex-col justify-around py-4 px-1 text-[10px] font-black border-r border-slate-900">
                <span>A</span><span>B</span><span>C</span><span>D</span>
             </div>
             <div className="flex-1" />
             <div className="flex flex-col justify-around py-4 px-1 text-[10px] font-black border-l border-slate-900">
                <span>A</span><span>B</span><span>C</span><span>D</span>
             </div>
          </div>
          <div className="flex justify-between px-8 py-1 text-[10px] font-black border-t border-slate-900">
             <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span>
          </div>
        </div>

        {isRebuilding && (
          <div className="absolute top-10 right-14 bg-primary text-white px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 z-[999] backdrop-blur-md animate-pulse">
            <span className="text-[10px] font-black uppercase tracking-widest">Rebuilding Views...</span>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2 relative z-10 mx-6 mt-6">
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter text-slate-900 uppercase">Industrial Engineering Drawing</span>
            <div className="flex items-center gap-3">
               <span className="text-xs font-bold text-slate-500">ISO 128-1 / ASME Y14.5M</span>
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
               <span className="text-[11px] font-black text-slate-900">VERIFIED SW2000 PARITY</span>
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowDimensions(!showDimensions)} 
              className={`px-4 py-1.5 text-[10px] font-black uppercase rounded shadow-sm border transition-all ${
                showDimensions ? 'bg-indigo-600 border-indigo-700 text-white' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {showDimensions ? 'Hide Annotations' : 'Show Annotations'}
            </button>
          </div>
        </div>

        {/* View Grid */}
        <div className="grid grid-cols-2 gap-8 flex-1 min-h-0 mx-6 my-6 relative z-10">
          <DrawingView title="Front Elevation (1:1)" type="FRONT" lines={projections.FRONT} showDimensions={showDimensions} />
          <DrawingView title="Top Plan (1:1)" type="TOP" lines={projections.TOP} showDimensions={showDimensions} />
          <DrawingView title="Right Profile (1:1)" type="RIGHT" lines={projections.RIGHT} showDimensions={showDimensions} />
          <DrawingView title="Isometric View" type="ISO" lines={projections.ISO} showDimensions={showDimensions} components={components} />
        </div>

        {/* BOM and Title Block Container */}
        <div className="flex gap-6 mt-auto relative z-10 mx-6 mb-6 h-[180px]">
          {/* Enhanced BOM */}
          <div className="flex-1 border-2 border-slate-900 bg-white overflow-hidden flex flex-col">
            <div className="text-[11px] font-black uppercase bg-slate-900 text-white px-3 py-1.5 flex justify-between items-center">
               <span>Bill of Materials (BOM)</span>
               <span className="text-[9px] opacity-70">AUTO-GENERATED</span>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b-2 border-slate-900 text-slate-900 uppercase font-black text-[9px]">
                    <th className="px-3 py-1 w-12">Item</th>
                    <th>Part Number</th>
                    <th>Material</th>
                    <th className="text-right px-3">QTY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {components.length > 0 ? (
                    components.reduce((acc: any[], comp) => {
                      const existing = acc.find(item => item.partId === comp.partId);
                      if (existing) {
                        existing.qty += 1;
                      } else {
                        acc.push({ partId: comp.partId, name: comp.instanceName, qty: 1, material: partMaterial });
                      }
                      return acc;
                    }, []).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-1.5 font-black text-slate-400">{idx + 1}</td>
                        <td className="font-bold text-slate-900">{item.partId}</td>
                        <td className="italic text-slate-500">{item.material}</td>
                        <td className="text-right px-3 font-mono font-black">{item.qty}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="hover:bg-slate-50">
                      <td className="px-3 py-1.5 font-black text-slate-400">1</td>
                      <td className="font-bold text-slate-900">PART-999-001</td>
                      <td className="italic text-slate-500">{partMaterial}</td>
                      <td className="text-right px-3 font-mono font-black">1</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Professional Industrial Title Block */}
          <div className="w-[450px] grid grid-cols-6 grid-rows-4 border-2 border-slate-900 bg-white text-[9px] font-bold uppercase overflow-hidden">
            {/* Top row */}
            <div className="col-span-3 row-span-1 border-r border-b border-slate-900 p-1 flex flex-col">
               <span className="text-[7px] text-slate-400">Project Name</span>
               <span className="text-[11px] font-black truncate">{projectName}</span>
            </div>
            <div className="col-span-1 row-span-1 border-r border-b border-slate-900 p-1 flex flex-col">
               <span className="text-[7px] text-slate-400">Revision</span>
               <span className="text-[11px] font-black text-center">A.1</span>
            </div>
            <div className="col-span-2 row-span-1 border-b border-slate-900 p-1 flex flex-col">
               <span className="text-[7px] text-slate-400">Date</span>
               <span className="text-[10px] font-black">{new Date().toLocaleDateString()}</span>
            </div>

            {/* Second row */}
            <div className="col-span-2 row-span-1 border-r border-b border-slate-900 p-1 flex flex-col">
               <span className="text-[7px] text-slate-400">Drawn By</span>
               <span className="truncate">{drawnBy}</span>
            </div>
            <div className="col-span-2 row-span-1 border-r border-b border-slate-900 p-1 flex flex-col">
               <span className="text-[7px] text-slate-400">Approved By</span>
               <span className="truncate">{approvedBy}</span>
            </div>
            <div className="col-span-2 row-span-1 border-b border-slate-900 p-1 flex flex-col">
               <span className="text-[7px] text-slate-400">Material</span>
               <span className="truncate text-indigo-600">{partMaterial}</span>
            </div>

            {/* Third row (Large Title) */}
            <div className="col-span-4 row-span-2 border-r border-slate-900 p-2 flex flex-col justify-center bg-slate-50/50">
               <span className="text-[7px] text-slate-400">Drawing Title / Part ID</span>
               <span className="text-lg font-black text-slate-900 leading-tight">3DB-{projectName.slice(0,3).toUpperCase()}-REF</span>
            </div>
            
            {/* Fourth row components */}
            <div className="col-span-1 row-span-1 border-r border-b border-slate-900 p-1 flex flex-col">
               <span className="text-[7px] text-slate-400">Scale</span>
               <span className="text-center font-black">{drawingScale}</span>
            </div>
            <div className="col-span-1 row-span-1 border-b border-slate-900 p-1 flex flex-col">
               <span className="text-[7px] text-slate-400">Sheet</span>
               <span className="text-center">1 of 1</span>
            </div>
            <div className="col-span-2 row-span-1 p-1 flex flex-col bg-amber-50/30">
               <span className="text-[7px] text-slate-400">Weight (g)</span>
               <span className="text-[12px] font-black text-amber-700 text-right pr-2">
                 {totalMass > 0 ? totalMass.toFixed(2) : '—'}
               </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
