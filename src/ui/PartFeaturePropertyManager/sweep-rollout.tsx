'use client';

import React from 'react';
import { Rollout } from '../PropertyManager/Rollout';
import type { FeatureContext } from './types';

export const SweepRollout: React.FC<FeatureContext> = ({ selectedFeature, features, onParamChange }) => {
  const params = selectedFeature.parameters;
  const thinEnabled = params.thin_enabled === 'true' || params.thin_thickness;

  return (
    <Rollout title="Profile and Path" icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 22C4 13 14 13 14 4"/><circle cx="14" cy="4" r="2"/><circle cx="4" cy="22" r="2"/></svg>}>
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Profile</label>
          <select
            value={params.profile_id || ''}
            onChange={(e) => {
              onParamChange('profile_id', e.target.value);
              setTimeout(() => { const rb = (window as any).__handleRebuild; if (rb) rb(); }, 0);
            }}
            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[12px] font-bold"
          >
            <option value="">— Select Profile Sketch —</option>
            {(features || []).filter(f => f.type === 'SKETCH').map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Path</label>
          <select
            value={params.path_id || ''}
            onChange={(e) => {
              onParamChange('path_id', e.target.value);
              setTimeout(() => { const rb = (window as any).__handleRebuild; if (rb) rb(); }, 0);
            }}
            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[12px] font-bold"
          >
            <option value="">— Select Path Sketch —</option>
            {(features || []).filter(f => f.type === 'SKETCH').map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div className="text-[9px] text-slate-400 italic px-1">
          💡 SW Style：Also in 3D viewport click directly inSketchProfile and path lines
        </div>
      </div>
    </Rollout>
  );
};

export const SweepOptionsRollout: React.FC<FeatureContext> = ({ selectedFeature, onParamChange }) => {
  const params = selectedFeature.parameters;
  const thinEnabled = params.thin_enabled === 'true' || params.thin_thickness;

  return (
    <Rollout title="Options (Direction andConfiguration)" icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 3v18M3 12h18"/><path d="M7 7l10 10M17 7L7 17"/></svg>}>
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Merge Result (Merge)</label>
          <select
            value={params.merge_result ?? 'MERGE'}
            onChange={(e) => onParamChange('merge_result', e.target.value)}
            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[12px] font-bold"
          >
            <option value="MERGE">Merge Result (Merge)</option>
            <option value="JOIN">Join (Connect)</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Alignment (Align)</label>
          <select
            value={params.alignment ?? 'PARALLEL'}
            onChange={(e) => onParamChange('alignment', e.target.value)}
            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[12px] font-bold"
          >
            <option value="PARALLEL">Parallel to Start Tangent (Parallelat start tangent)</option>
            <option value="PERPENDICULAR">Perpendicular to Path (Perpendicularon path)</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="sweep-flip"
            checked={!!params.flip_profile}
            onChange={(e) => onParamChange('flip_profile', e.target.checked ? 'true' : 'false')}
            className="w-4 h-4 accent-primary"
          />
          <label htmlFor="sweep-flip" className="text-[10px] font-bold text-slate-600 uppercase">Flip Profile (Flip profileFace)</label>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-slate-200 mt-2">
          <input
            type="checkbox"
            id="sweep-thin"
            checked={!!params.thin_thickness}
            onChange={(e) => onParamChange('thin_enabled', e.target.checked ? 'true' : 'false')}
            className="w-4 h-4 accent-primary"
          />
          <label htmlFor="sweep-thin" className="text-[10px] font-bold text-slate-600 uppercase">Thin Feature (Thin feature)</label>
        </div>
        {thinEnabled && (
          <div className="space-y-2 pl-6 border-l-2 border-primary/30">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Thickness (Thickness)</label>
              <input
                type="number"
                step="0.1"
                value={params.thin_thickness || ''}
                onChange={(e) => onParamChange('thin_thickness', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[12px] font-bold"
                placeholder="e.g. 2.0"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Thin Type</label>
              <select
                value={params.thin_type || 'ONE_DIRECTION'}
                onChange={(e) => onParamChange('thin_type', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[12px] font-bold"
              >
                <option value="ONE_DIRECTION">One-Direction (Single direction)</option>
                <option value="MID_PLANE">Mid-Plane (Center lineFace)</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </Rollout>
  );
};
