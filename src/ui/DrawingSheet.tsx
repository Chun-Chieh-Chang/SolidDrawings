'use client';

import React, { useEffect, useState } from 'react';
import { useCadStore } from '../store/useCadStore';
import { HeavyEngineClient } from '../kernel/HeavyEngineClient';

interface DrawingViewProps {
  title: string;
  type: 'FRONT' | 'TOP' | 'RIGHT' | 'ISO';
  lines: number[][][];
}

const DrawingView = ({ title, type, lines }: DrawingViewProps) => {
  return (
    <div className="border border-slate-300 bg-white aspect-video relative flex flex-col group hover:border-primary transition-all shadow-sm rounded overflow-hidden">
      <div className="absolute top-2 left-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/80 backdrop-blur px-1.5 py-0.5 rounded border border-slate-200 z-10 group-hover:text-primary group-hover:border-primary/30">
        {title}
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <svg viewBox="-50 -50 100 100" className="w-full h-full text-slate-900 overflow-visible" style={{ transform: 'scaleY(-1)' }}>
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.1" className="opacity-10"/>
            </pattern>
          </defs>
          <rect x="-100" y="-100" width="200" height="200" fill="url(#grid)" />
          
          {lines.length > 0 ? (
            lines.map((line, i) => (
              <polyline
                key={i}
                points={line.map(p => `${p[0]},${p[1]}`).join(' ')}
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="group-hover:stroke-primary transition-colors"
              />
            ))
          ) : (
            <text x="0" y="0" textAnchor="middle" transform="scale(1, -1)" className="text-[4px] fill-slate-300 font-mono italic">
              GENERATING VIEW...
            </text>
          )}
        </svg>
      </div>
    </div>
  );
};

export const DrawingSheet = () => {
  const { components, features, mode, projectName } = useCadStore();
  const [projections, setProjections] = useState<{ [key: string]: number[][][] }>({
    FRONT: [],
    TOP: [],
    RIGHT: [],
    ISO: []
  });

  useEffect(() => {
    const fetchProjections = async () => {
      const client = HeavyEngineClient.getInstance();
      const views = ['FRONT', 'TOP', 'RIGHT'];
      const newProjections: any = { ...projections };

      for (const view of views) {
        try {
          const lines = await client.project(features, view);
          newProjections[view] = lines;
        } catch (e) {
          console.error(`Failed to fetch projection for ${view}`, e);
        }
      }
      
      newProjections['ISO'] = newProjections['TOP'];
      setProjections(newProjections);
    };

    if (features.length > 0) {
      fetchProjections();
    }
  }, [features]);

  return (
    <div className="flex-1 h-full bg-[#CBD5E1] p-8 overflow-auto flex justify-center">
      <div className="w-[1120px] h-[792px] bg-white shadow-2xl border-2 border-slate-400 relative flex flex-col p-12 space-y-8">
        
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter text-slate-900 uppercase">Engineering Drawing</span>
            <span className="text-sm font-bold text-slate-500">PROJECT: {projectName || 'Professional CAD Project'}</span>
          </div>
          <div className="text-right flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase">Standard</span>
            <span className="text-sm font-bold text-slate-900">ISO 128 (GPS)</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 flex-1">
          <DrawingView title="Front Elevation" type="FRONT" lines={projections.FRONT} />
          <DrawingView title="Top Plan" type="TOP" lines={projections.TOP} />
          <DrawingView title="Right Profile" type="RIGHT" lines={projections.RIGHT} />
          <DrawingView title="Isometric View" type="ISO" lines={projections.ISO} />
        </div>

        {(mode === 'ASSEMBLY' || components.length > 0) && (
          <div className="mt-4 border-2 border-slate-900 p-4">
            <div className="text-xs font-black uppercase mb-2 bg-slate-900 text-white px-2 py-1 inline-block">Bill of Materials (BOM)</div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-300 text-slate-500 uppercase font-bold">
                  <th className="py-1">Item No.</th>
                  <th>Part Number</th>
                  <th>Description</th>
                  <th className="text-right">QTY</th>
                </tr>
              </thead>
              <tbody>
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
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-2 font-bold">{idx + 1}</td>
                      <td>{item.partId}</td>
                      <td>{item.name}</td>
                      <td className="text-right font-mono">{item.qty}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-b border-slate-100">
                    <td className="py-2 font-bold">1</td>
                    <td>PART-001</td>
                    <td>{projectName || 'Current Part'}</td>
                    <td className="text-right font-mono">1</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-auto pt-4 flex justify-between text-[10px] font-bold text-slate-400 uppercase border-t border-slate-200">
          <div className="flex gap-4">
            <span>Drawn By: Gemini CLI</span>
            <span>Date: 2026-05-19</span>
          </div>
          <div className="flex flex-col items-end">
            <span>Sheet 1 of 1</span>
            <span className="text-slate-300 italic">AUTOMATICALLY GENERATED BY OCCT HLR ENGINE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
