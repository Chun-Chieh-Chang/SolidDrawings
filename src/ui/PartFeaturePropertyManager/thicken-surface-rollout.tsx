'use client';

import React from 'react';
import { useCadStore } from '@/store/useCadStore';
import { Rollout } from '../PropertyManager/Rollout';
import { SelectionBox } from '../PropertyManager/SelectionBox';
import { ParamInput } from './rollouts';
import type { FeatureContext } from './types';

export const ThickenSurfaceRollout: React.FC<FeatureContext> = ({ selectedFeature, features, onParamChange, pendingFeatureCommand }) => {
  const params = selectedFeature.parameters;
  const type = selectedFeature.type;

  if (type === 'THICKEN') {
    return (
      <Rollout title="Thicken" icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="7.5 4.21 12 6.81 16.5 4.21"/><polyline points="7.5 19.79 12 17.19 16.5 19.79"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>}>
        <div className="space-y-3">
          <ParamInput
            label="Thickness"
            value={params.thickness || 1.0}
            onChange={(v: any) => onParamChange('thickness', v)}
            badge="T1"
          />
          <div className="p-2 bg-orange-50 border border-orange-100 rounded text-[10px] text-orange-700 font-bold">
            Converts a surface or shell into a solid by adding the specified thickness.
          </div>
        </div>
      </Rollout>
    );
  }

  if (type === 'SURFACE_OFFSET') {
    return (
      <Rollout title="Surface Offset" icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M16 14l4-4-4-4"/><path d="M20 10H4"/></svg>}>
        <div className="space-y-3">
          <SelectionBox
            label="Faces to Offset"
            selectedCount={params.refs?.length || 0}
            onClear={() => onParamChange('refs', [])}
            active={pendingFeatureCommand === 'SURFACE_OFFSET'}
            onClick={() => useCadStore.setState({ pendingFeatureCommand: 'SURFACE_OFFSET' })}
          />
          <ParamInput label="Offset Distance" value={params.distance} onChange={(v: any) => onParamChange('distance', v)} badge="DIST" />
        </div>
      </Rollout>
    );
  }

  if (type === 'SURFACE_KNIT') {
    return (
      <Rollout title="Knit Surface" icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M16 3H8l-5 9 5 9h8l5-9-5-9z"/><path d="M12 3v18"/><path d="M3 12h18"/></svg>}>
        <div className="space-y-3">
          <SelectionBox
            label="Surfaces to Knit"
            selectedCount={params.refs?.length || 0}
            onClear={() => onParamChange('refs', [])}
            active={pendingFeatureCommand === 'SURFACE_KNIT'}
            onClick={() => useCadStore.setState({ pendingFeatureCommand: 'SURFACE_KNIT' })}
          />
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded text-[10px] text-indigo-700 font-bold">
            Merge multiple surfaces into a single manifold body.
          </div>
        </div>
      </Rollout>
    );
  }

  if (type === 'SURFACE_CUT') {
    return (
      <Rollout title="Surface Cut" icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="7.5 4.21 12 6.81 16.5 4.21"/><polyline points="7.5 19.79 7.5 14.6 3 12"/><polyline points="21 12 16.5 14.6 16.5 19.79"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>}>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Cutting Tool</label>
            <select
              value={params.tool_feature_id || ''}
              onChange={(e) => onParamChange('tool_feature_id', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[12px] font-bold"
            >
              <option value="">— Select Surface Feature —</option>
              {features?.filter(f => f.type === 'SURFACE_OFFSET' || f.type === 'SURFACE_KNIT' || f.type === 'REFERENCE_PLANE').map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Flip Direction</label>
            <button
              onClick={() => onParamChange('flip', !params.flip)}
              className={`px-3 py-1 rounded text-[10px] font-black border transition-all ${params.flip ? 'bg-amber-600 text-white border-amber-700' : 'bg-white text-slate-400 border-slate-200'}`}
            >
              {params.flip ? 'REVERSE' : 'NORMAL'}
            </button>
          </div>
          <div className="p-2 bg-amber-50 border border-amber-100 rounded text-[10px] text-amber-700 font-bold">
            Removes material from the side indicated by the surface normal.
          </div>
        </div>
      </Rollout>
    );
  }

  return null;
};
