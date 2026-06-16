'use client';

import React from 'react';
import { Rollout } from '../PropertyManager/Rollout';
import { SelectionBox } from '../PropertyManager/SelectionBox';
import { ParamInput } from './rollouts';
import type { FeatureContext } from './types';

const icons = {
  from: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>,
  direction: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>,
  draft: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  thin: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/></svg>,
  flip: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 11V7l-5 5 5 5v-4h10v4l5-5-5-5v4z"/></svg>,
};

export const ExtrudeRollout: React.FC<FeatureContext> = ({ selectedFeature, onParamChange }) => {
  const params = selectedFeature.parameters;
  const endCond = params.endCondition || 'BLIND';
  const isBlind = endCond === 'BLIND';
  const isThin = !!params.isThin;
  const thinDir = params.thinDirection || 'ONE_DIRECTION';
  const hasDraft = params.draftAngle !== undefined && params.draftAngle > 0;
  const operation = params.operation === 'CUT' ? 'CUT' : 'ADD';

  return (
    <>
      <Rollout title="From" icon={icons.from}>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Start Condition</label>
          <select value="SKETCH_PLANE" disabled className="w-full bg-[#F5F5F5] border border-slate-300 rounded px-2 py-1 text-[12px] text-slate-500">
            <option value="SKETCH_PLANE">Sketch Plane</option>
          </select>
        </div>
      </Rollout>

      <Rollout title="Direction 1" icon={icons.direction}>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <select
              value={operation}
              onChange={(e) => onParamChange('operation', e.target.value)}
              className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 text-[12px] font-bold"
            >
              <option value="ADD">Boss/Base</option>
              <option value="CUT">Cut</option>
            </select>
            <button
              onClick={() => onParamChange('flip', !params.flip)}
              className={`p-1 border rounded hover:bg-slate-100 transition-colors ${params.flip ? 'bg-[#005B9A] border-[#004A7C] text-white' : 'border-slate-300 text-slate-600'}`}
              title="Reverse Direction"
            >
              {icons.flip}
            </button>
          </div>

          <div className="space-y-1 mt-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">End Condition</label>
            <select
              value={endCond}
              onChange={(e) => {
                onParamChange('endCondition', e.target.value);
                if (e.target.value === 'THROUGH_ALL') onParamChange('depth', 9999);
              }}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[12px] font-bold"
            >
              <option value="BLIND">Blind</option>
              <option value="THROUGH_ALL">Through All</option>
              <option value="UP_TO_NEXT">Up To Next</option>
              <option value="UP_TO_SURFACE">Up To Surface</option>
            </select>
          </div>

          {isBlind && <ParamInput label="Depth" value={params.depth} onChange={(v: any) => onParamChange('depth', v)} badge="D1" />}

          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
            <button
              onClick={() => onParamChange('isSurfaceOnly', !params.isSurfaceOnly)}
              className={`flex-1 py-1 rounded text-[10px] font-black border transition-all ${params.isSurfaceOnly ? 'bg-orange-50 border-orange-400 text-orange-700' : 'bg-white border-slate-200 text-slate-400'}`}
            >
              {params.isSurfaceOnly ? 'SURFACE MODE ON' : 'SOLID BOSS/BASE'}
            </button>
          </div>
        </div>
      </Rollout>

      <Rollout title="Draft" icon={icons.draft}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Draft On/Off</label>
            <button
              onClick={() => onParamChange('draftAngle', params.draftAngle ? 0 : 5)}
              className={`px-3 py-1 rounded text-[10px] font-black border transition-all ${hasDraft ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-200'}`}
            >
              {hasDraft ? 'ON' : 'OFF'}
            </button>
          </div>
          {hasDraft && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
              <ParamInput label="Draft Angle" value={params.draftAngle} onChange={(v: any) => onParamChange('draftAngle', v)} unit="deg" badge="ANG" />
              <button
                onClick={() => onParamChange('draftOutward', !params.draftOutward)}
                className={`w-full py-1 rounded text-[10px] font-bold border ${params.draftOutward ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white text-slate-600 border-slate-200'}`}
              >
                {params.draftOutward ? 'Draft Outward' : 'Draft Inward'}
              </button>
            </div>
          )}
        </div>
      </Rollout>

      <Rollout title="Thin Feature" icon={icons.thin}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Thin Feature On/Off</label>
            <button
              onClick={() => onParamChange('isThin', !params.isThin)}
              className={`px-3 py-1 rounded text-[10px] font-black border transition-all ${isThin ? 'bg-rose-600 text-white border-rose-600 shadow-sm' : 'bg-white text-slate-400 border-slate-200'}`}
            >
              {isThin ? 'ON' : 'OFF'}
            </button>
          </div>
          {isThin && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Type</label>
                <select
                  value={thinDir}
                  onChange={(e) => onParamChange('thinDirection', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[12px] font-bold"
                >
                  <option value="ONE_DIRECTION">One-Direction</option>
                  <option value="MID_PLANE">Mid-Plane</option>
                  <option value="TWO_DIRECTIONS">Two-Directions</option>
                </select>
              </div>
              <ParamInput label="Thickness" value={params.thinThickness || 1.0} onChange={(v: any) => onParamChange('thinThickness', v)} badge="T1" />
              {thinDir === 'TWO_DIRECTIONS' && (
                <ParamInput label="Thickness 2" value={params.thinThickness2 || 1.0} onChange={(v: any) => onParamChange('thinThickness2', v)} badge="T2" />
              )}
            </div>
          )}
        </div>
      </Rollout>
    </>
  );
};
