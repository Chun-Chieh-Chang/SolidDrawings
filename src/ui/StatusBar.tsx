'use client';



import React, { useMemo } from 'react';

import { useCadStore } from '../store/useCadStore';

import { analyzeSketchDefinitions } from '../utils/geometry/ConstraintSolver';



export const StatusBar: React.FC = () => {

  const { 

    isSketchMode, 

    sketchNodes, 

    sketchEdges, 

    sketchConstraints,

    mousePos,

    hint,

    activePlane

  } = useCadStore();



  const definitionReport = useMemo(() => {

    if (!isSketchMode) return null;

    return analyzeSketchDefinitions(sketchNodes, sketchEdges, sketchConstraints);

  }, [isSketchMode, sketchNodes, sketchEdges, sketchConstraints]);



  const definitionStatus = useMemo(() => {

    if (!isSketchMode || !definitionReport) return null;

    

    if (definitionReport.hasConflict) {

      return { text: ' (Over Defined)', color: 'text-red-500 font-black' };

    }



    const nodeIds = Object.keys(sketchNodes);

    if (nodeIds.length === 0) return { text: ' (Empty)', color: 'text-slate-400' };



    const isFullyDefined = nodeIds.every(id => definitionReport.nodes[id] === 'FULLY');

    

    if (isFullyDefined) {

      return { text: 'Fully Defined', color: 'text-slate-800 font-bold' };

    } else {

      return { text: 'Under Defined', color: 'text-blue-500 font-bold' };

    }

  }, [isSketchMode, sketchNodes, definitionReport]);



  return (
    <footer className="h-[26px] w-full bg-[#E8E8E8] border-t border-[#A0A0A0] flex items-center justify-between px-3 text-[10px] text-slate-700 select-none z-50 shrink-0 font-sans font-bold uppercase tracking-tighter">
      {/* Left: Hint & Mode */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-slate-500 font-black">▶</span>
          <span className="truncate max-w-[400px]" title={hint}>{hint}</span>
        </div>
        
        {isSketchMode && (
          <div className="flex items-center gap-2 px-3 border-l border-slate-400">
            <span className="text-slate-500 font-black">STATUS:</span>
            <span className={definitionStatus?.color}>{definitionStatus?.text}</span>
          </div>
        )}
      </div>

      {/* Right: Units & Coordinates */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="px-3 border-l border-slate-400 flex items-center gap-2">
          <span className="text-slate-500 font-black">COORD:</span>
          <span className="font-mono text-slate-900 bg-white/50 px-1 rounded">X: {mousePos[0].toFixed(2)}  Y: {mousePos[1].toFixed(2)}</span>
        </div>
        <div className="px-3 border-l border-slate-400 flex items-center gap-1.5 text-[#005B9A]">
          MMGS (mm, g, s)
        </div>
      </div>
    </footer>
  );

};

