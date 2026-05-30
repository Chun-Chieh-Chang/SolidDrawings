'use client';



import React, { useEffect, useState } from 'react';

import { useCadStore } from '../store/useCadStore';

import { HeavyEngineClient } from '../kernel/HeavyEngineClient';



interface DrawingViewProps {

  title: string;
  type: 'FRONT' | 'TOP' | 'RIGHT' | 'ISO';
  lines: number[][][];
  showDimensions: boolean;
}

const DrawingView = ({ title, type, lines, showDimensions }: DrawingViewProps) => {
  const [editingDim, setEditingDim] = useState<{id: string, type: string, param: string} | null>(null);
  const [editValue, setEditValue] = useState<string>('');


  const features = useCadStore(state => state.features);

  const selectedId = useCadStore(state => state.selectedId);

  const updateFeatureParams = useCadStore(state => state.updateFeatureParams);



  let minU = Infinity, maxU = -Infinity;

  let minV = Infinity, maxV = -Infinity;

  lines.forEach(line => {

    line.forEach(p => {

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

  const halfSize = hasBounds ? size / 2 + Math.max(size * 0.35, 15) : 50;

  const viewBox = hasBounds 

    ? `${midU - halfSize} ${midV - halfSize} ${halfSize * 2} ${halfSize * 2}`

    : "-50 -50 100 100";



  const viewBoxSize = halfSize * 2;

  const lineStrokeWidth = viewBoxSize * 0.005;

  const dimStrokeWidth = viewBoxSize * 0.0025;

  const textSize = viewBoxSize * 0.035;

  const rectW = viewBoxSize * 0.16;

  const rectH = viewBoxSize * 0.055;

  const extOffset = viewBoxSize * 0.18;

  const dimOffset = viewBoxSize * 0.13;



  const saveDimensionEdit = () => {
    if (!editingDim) return;
    let newValue = parseFloat(editValue);
    if (isNaN(newValue) || newValue <= 0) return;

    if (editingDim.param === 'radius') {
        newValue = newValue / 2;
    }

    const paramUpdates: Record<string, number> = { [editingDim.param]: newValue };
    updateFeatureParams(editingDim.id, paramUpdates);
    setEditingDim(null);
  };
  
  const smartDims: any[] = [];
  if (showDimensions && type !== 'ISO') {
    features.forEach(feat => {
      const p = feat.parameters || {};
      const x = p.x || 0;
      const y = p.y || 0;
      const z = p.z || 0;
      
      if (feat.type === 'BOX' || feat.type === 'EXTRUDE') {
        const w = p.width || 10;
        const h = p.height || 10;
        const d = p.depth || 10;
        
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
        if (type === 'TOP') {
           smartDims.push({ id: feat.id, type: 'RADIAL', value: r*2, u: x, v: -z, radius: r, param: 'radius' });
        } else if (type === 'FRONT' && feat.type !== 'SPHERE') {
           smartDims.push({ id: feat.id, type: 'HORIZ', value: r*2, u: x-r, v: y, length: r*2, param: 'radius' });
           smartDims.push({ id: feat.id, type: 'VERT', value: h, u: x-r, v: y, length: h, param: 'height' });
        } else if (type === 'FRONT' && feat.type === 'SPHERE') {
           smartDims.push({ id: feat.id, type: 'RADIAL', value: r*2, u: x, v: y, radius: r, param: 'radius' });
        }
      }
    });
  }



  return (

    <div className="border border-slate-300 bg-white aspect-video relative flex flex-col group hover:border-primary transition-all shadow-sm rounded overflow-hidden animate-fade-in"> <div className="absolute top-2 left-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/80 backdrop-blur px-1.5 py-0.5 rounded border border-slate-200 z-10 group-hover:text-primary group-hover:border-primary/30">

        {title} {hasBounds && type !== 'ISO' && `(${widthVal.toFixed(1)} x ${heightVal.toFixed(1)})`}

      </div> <div className="flex-1 flex items-center justify-center p-4"> <svg viewBox={viewBox} className="w-full h-full text-slate-900 overflow-visible" style={{ transform: 'scaleY(-1)' }}> <defs> <marker id={`arrow-start-${type}`} viewBox="0 0 10 10" refX="0" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"> <path d="M 10 0 L 0 5 L 10 10 z" fill="#3B82F6" /> </marker> <marker id={`arrow-end-${type}`} viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"> <path d="M 0 0 L 10 5 L 0 10 z" fill="#3B82F6" /> </marker> <pattern id={`grid-${type}`} width={viewBoxSize * 0.1} height={viewBoxSize * 0.1} patternUnits="userSpaceOnUse"> <path d={`M ${viewBoxSize * 0.1} 0 L 0 0 0 ${viewBoxSize * 0.1}`} fill="none" stroke="currentColor" strokeWidth={lineStrokeWidth * 0.2} className="opacity-10"/> </pattern> </defs> <rect x={midU - halfSize * 2} y={midV - halfSize * 2} width={halfSize * 4} height={halfSize * 4} fill={`url(#grid-${type})`} />

          

          {lines.length > 0 ? (

            lines.map((line, i) => (

              <polyline

                key={i}

                points={line.map(p => `${p[0]},${p[1]}`).join(' ')}

                fill="none"

                stroke="currentColor"

                strokeWidth={lineStrokeWidth}

                className="group-hover:stroke-primary transition-colors"

              />

            ))

          ) : (

            <g transform="scale(1, -1)"> <text x="0" y="0" textAnchor="middle" className="text-[6px] fill-slate-300 font-mono italic">

                GENERATING VIEW...

              </text> </g>

          )}



          {/* Feature-Aware Smart Dimensions */}
          {smartDims.filter(d => d.type === 'HORIZ').map((dim, idx) => {
              const isEditing = editingDim?.id === dim.id && editingDim?.type === dim.type;
              const dimY = dim.v - dimOffset - (idx * extOffset * 0.5);
              return (
                <g key={`horiz-${dim.id}-${idx}`}>
                  <line x1={dim.u} y1={dim.v} x2={dim.u} y2={dimY} stroke="#64748B" strokeWidth={dimStrokeWidth} strokeDasharray={`${dimStrokeWidth*2},${dimStrokeWidth}`} />
                  <line x1={dim.u + dim.length} y1={dim.v} x2={dim.u + dim.length} y2={dimY} stroke="#64748B" strokeWidth={dimStrokeWidth} strokeDasharray={`${dimStrokeWidth*2},${dimStrokeWidth}`} />
                  <line x1={dim.u} y1={dimY} x2={dim.u + dim.length} y2={dimY} stroke="#3B82F6" strokeWidth={dimStrokeWidth} markerStart={`url(#arrow-start-${type})`} markerEnd={`url(#arrow-end-${type})`} />
                  <g transform={`translate(${dim.u + dim.length/2}, ${dimY}) scale(1, -1)`} className="cursor-pointer select-none" onDoubleClick={(e) => { e.stopPropagation(); setEditingDim({id: dim.id, type: dim.type, param: dim.param}); setEditValue(dim.value.toString()); }}>
                    <rect x={-rectW/2} y={-rectH/2} width={rectW} height={rectH} fill="white" stroke={isEditing ? '#3B82F6' : '#E2E8F0'} strokeWidth={isEditing ? dimStrokeWidth : dimStrokeWidth/2} rx={rectH*0.2} className="hover:stroke-blue-500 hover:fill-blue-50/50 transition-all duration-200" />
                    {isEditing ? (
                      <foreignObject x={-rectW/2} y={-rectH/2} width={rectW} height={rectH}>
                        <input type="number" step="any" value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') saveDimensionEdit(); else if (e.key === 'Escape') setEditingDim(null); }} onBlur={saveDimensionEdit} onDoubleClick={(e) => e.stopPropagation()} autoFocus className="w-full h-full text-center font-mono font-bold text-slate-900 bg-white border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 select-all" style={{ fontSize: `${textSize}px`, padding: 0, margin: 0, border: 'none', outline: 'none', background: 'transparent' }} />
                      </foreignObject>
                    ) : (
                      <text x="0" y={rectH * 0.18} textAnchor="middle" fontSize={textSize} fontWeight="bold" fill="#1E293B" fontFamily="monospace" className="pointer-events-none hover:fill-blue-600">{dim.value.toFixed(1)}</text>
                    )}
                  </g>
                </g>
              );
          })}

          {smartDims.filter(d => d.type === 'VERT').map((dim, idx) => {
              const isEditing = editingDim?.id === dim.id && editingDim?.type === dim.type;
              const dimX = dim.u - dimOffset - (idx * extOffset * 0.5);
              return (
                <g key={`vert-${dim.id}-${idx}`}>
                  <line x1={dim.u} y1={dim.v} x2={dimX} y2={dim.v} stroke="#64748B" strokeWidth={dimStrokeWidth} strokeDasharray={`${dimStrokeWidth*2},${dimStrokeWidth}`} />
                  <line x1={dim.u} y1={dim.v + dim.length} x2={dimX} y2={dim.v + dim.length} stroke="#64748B" strokeWidth={dimStrokeWidth} strokeDasharray={`${dimStrokeWidth*2},${dimStrokeWidth}`} />
                  <line x1={dimX} y1={dim.v} x2={dimX} y2={dim.v + dim.length} stroke="#3B82F6" strokeWidth={dimStrokeWidth} markerStart={`url(#arrow-start-${type})`} markerEnd={`url(#arrow-end-${type})`} />
                  <g transform={`translate(${dimX}, ${dim.v + dim.length/2}) scale(1, -1)`} className="cursor-pointer select-none" onDoubleClick={(e) => { e.stopPropagation(); setEditingDim({id: dim.id, type: dim.type, param: dim.param}); setEditValue(dim.value.toString()); }}>
                    <rect x={-rectW/2} y={-rectH/2} width={rectW} height={rectH} fill="white" stroke={isEditing ? '#3B82F6' : '#E2E8F0'} strokeWidth={isEditing ? dimStrokeWidth : dimStrokeWidth/2} rx={rectH*0.2} className="hover:stroke-blue-500 hover:fill-blue-50/50 transition-all duration-200" transform="rotate(-90)" />
                    {isEditing ? (
                      <foreignObject x={-rectH/2} y={-rectW/2} width={rectH} height={rectW} style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}>
                        <input type="number" step="any" value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') saveDimensionEdit(); else if (e.key === 'Escape') setEditingDim(null); }} onBlur={saveDimensionEdit} onDoubleClick={(e) => e.stopPropagation()} autoFocus className="w-full h-full text-center font-mono font-bold text-slate-900 bg-white border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 select-all" style={{ fontSize: `${textSize}px`, padding: 0, margin: 0, border: 'none', outline: 'none', background: 'transparent' }} />
                      </foreignObject>
                    ) : (
                      <text x="0" y={rectH * 0.18} textAnchor="middle" fontSize={textSize} fontWeight="bold" fill="#1E293B" fontFamily="monospace" className="pointer-events-none hover:fill-blue-600" transform="rotate(-90)">{dim.value.toFixed(1)}</text>
                    )}
                  </g>
                </g>
              );
          })}

          {smartDims.filter(d => d.type === 'RADIAL').map((dim, idx) => {
              const isEditing = editingDim?.id === dim.id && editingDim?.type === dim.type;
              const angle = Math.PI / 4 + (idx * 0.2); // slight offset for multiple
              const ex = dim.u + Math.cos(angle) * (dim.radius + dimOffset);
              const ey = dim.v + Math.sin(angle) * (dim.radius + dimOffset);
              return (
                <g key={`rad-${dim.id}-${idx}`}>
                  <line x1={dim.u} y1={dim.v} x2={ex} y2={ey} stroke="#3B82F6" strokeWidth={dimStrokeWidth} markerEnd={`url(#arrow-end-${type})`} />
                  <line x1={ex} y1={ey} x2={ex + dimOffset} y2={ey} stroke="#3B82F6" strokeWidth={dimStrokeWidth} />
                  <g transform={`translate(${ex + dimOffset + rectW/2}, ${ey}) scale(1, -1)`} className="cursor-pointer select-none" onDoubleClick={(e) => { e.stopPropagation(); setEditingDim({id: dim.id, type: dim.type, param: dim.param}); setEditValue((dim.value).toString()); }}>
                    <rect x={-rectW/2} y={-rectH/2} width={rectW} height={rectH} fill="white" stroke={isEditing ? '#3B82F6' : '#E2E8F0'} strokeWidth={isEditing ? dimStrokeWidth : dimStrokeWidth/2} rx={rectH*0.2} className="hover:stroke-blue-500 hover:fill-blue-50/50 transition-all duration-200" />
                    {isEditing ? (
                      <foreignObject x={-rectW/2} y={-rectH/2} width={rectW} height={rectH}>
                        <input type="number" step="any" value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') saveDimensionEdit(); else if (e.key === 'Escape') setEditingDim(null); }} onBlur={saveDimensionEdit} onDoubleClick={(e) => e.stopPropagation()} autoFocus className="w-full h-full text-center font-mono font-bold text-slate-900 bg-white border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 select-all" style={{ fontSize: `${textSize}px`, padding: 0, margin: 0, border: 'none', outline: 'none', background: 'transparent' }} />
                      </foreignObject>
                    ) : (
                      <text x="0" y={rectH * 0.18} textAnchor="middle" fontSize={textSize} fontWeight="bold" fill="#1E293B" fontFamily="monospace" className="pointer-events-none hover:fill-blue-600">Ø{dim.value.toFixed(1)}</text>
                    )}
                  </g>
                </g>
              );
          })}

        </svg> </div> </div>

  );

};



export const DrawingSheet = () => {

  const { components, features, mode, projectName, drawingScale, drawnBy, approvedBy } = useCadStore();

  const [projections, setProjections] = useState<{ [key: string]: number[][][] }>({

    FRONT: [],

    TOP: [],

    RIGHT: [],

    ISO: []

  });

  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [isRebuilding, setIsRebuilding] = useState<boolean>(false);



  useEffect(() => {

    const fetchProjections = async () => {

      setIsRebuilding(true);

      const client = HeavyEngineClient.getInstance();

      const views = ['FRONT', 'TOP', 'RIGHT', 'ISO'];

      const newProjections: any = { ...projections };



      for (const view of views) {

        try {

          const lines = await client.project(features, view);

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

  }, [features]);



  return (

    <div className="flex-1 h-full bg-[#CBD5E1] p-8 overflow-auto flex justify-center"> <div id="drawing-sheet-container" className="w-[1120px] h-[792px] bg-white shadow-2xl border-2 border-slate-400 relative flex flex-col p-12 space-y-6">

        

        {isRebuilding && (

          <div className="absolute top-6 right-12 bg-blue-500/90 border border-blue-400 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-[999] backdrop-blur-md transition-all animate-pulse"> <span className="text-sm"> </span> <span className="text-[11px] font-extrabold uppercase tracking-wider"> (Rebuilding...)</span> </div>

        )}



        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2"> <div className="flex flex-col"> <span className="text-2xl font-black tracking-tighter text-slate-900 uppercase">Engineering Drawing</span> <span className="text-sm font-bold text-slate-500">PROJECT: {projectName || 'Professional CAD Project'}</span> </div> <div className="flex gap-4"> <button onClick={() => setShowDimensions(!showDimensions)} className={`px-3 py-1 text-xs font-bold uppercase rounded border transition-colors ${showDimensions ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200'}`}> {showDimensions ? 'Hide Dimensions' : 'Show Dimensions'} </button> <div className="text-right flex flex-col"> <span className="text-xs font-bold text-slate-400 uppercase">Standard</span> <span className="text-sm font-bold text-slate-900">ISO 128 (GPS)</span> </div> </div> </div> <div className="grid grid-cols-2 gap-6 flex-1 min-h-0"> <DrawingView title="Front Elevation" type="FRONT" lines={projections.FRONT} showDimensions={showDimensions} /> <DrawingView title="Top Plan" type="TOP" lines={projections.TOP} showDimensions={showDimensions} /> <DrawingView title="Right Profile" type="RIGHT" lines={projections.RIGHT} showDimensions={showDimensions} /> <DrawingView title="Isometric View" type="ISO" lines={projections.ISO} showDimensions={showDimensions} /> </div>



        {(mode === 'ASSEMBLY' || components.length > 0) && (

          <div className="mt-2 border-2 border-slate-900 p-3 max-h-[120px] overflow-auto"> <div className="text-[10px] font-black uppercase mb-1 bg-slate-900 text-white px-2 py-0.5 inline-block">Bill of Materials (BOM)</div> <table className="w-full text-left text-[10px]"> <thead> <tr className="border-b border-slate-300 text-slate-500 uppercase font-bold"> <th className="py-0.5">Item No.</th> <th>Part Number</th> <th>Description</th> <th className="text-right">QTY</th> </tr> </thead> <tbody>

                {components.length > 0 ? (

                  components.reduce((acc: any[], comp) => {

                    const existing = acc.find(item => item.partId === comp.partId);

                    if (existing) {

                      existing.qty += 1;

                    } else {

                      acc.push({ partId: comp.partId, name: comp.instanceName, qty: 1 });

                    }

                    return acc;

                  }, []).map((item, idx) => (

                    <tr key={idx} className="border-b border-slate-100"> <td className="py-1 font-bold">{idx + 1}</td> <td>{item.partId}</td> <td>{item.name}</td> <td className="text-right font-mono">{item.qty}</td> </tr>

                  ))

                ) : (

                  <tr className="border-b border-slate-100"> <td className="py-1 font-bold">1</td> <td>PART-001</td> <td>{projectName || 'Current Part'}</td> <td className="text-right font-mono">1</td> </tr>

                )}

              </tbody> </table> </div>

        )}



        <div className="mt-auto pt-3 border-t-2 border-slate-900 grid grid-cols-4 gap-4 text-xs font-bold text-slate-800 uppercase"> <div className="flex flex-col border-r border-slate-200 pr-4"> <span className="text-[9px] text-slate-400 font-bold">PROJECT NAME</span> <span className="text-xs font-black text-slate-900 truncate">{projectName || 'Professional CAD Project'}</span> </div> <div className="flex flex-col border-r border-slate-200 px-4"> <span className="text-[9px] text-slate-400 font-bold">DESIGNED BY</span> <span className="text-xs font-extrabold text-slate-900">{drawnBy || 'CAD Engineer'}</span> </div> <div className="flex flex-col border-r border-slate-200 px-4"> <span className="text-[9px] text-slate-400 font-bold">APPROVED BY</span> <span className="text-xs font-extrabold text-slate-900">{approvedBy || 'Lead Architect'}</span> </div> <div className="flex justify-between items-center pl-4"> <div className="flex flex-col"> <span className="text-[9px] text-slate-400 font-bold">SCALE</span> <span className="text-xs font-black text-primary">{drawingScale || '1:1'}</span> </div> <div className="flex flex-col items-end"> <span className="text-[9px] text-slate-400 font-bold">SHEET</span> <span className="text-xs font-extrabold text-slate-900">1 OF 1</span> </div> </div> </div> </div> </div>

  );

};

