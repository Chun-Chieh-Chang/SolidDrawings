'use client';

import React from 'react';
import { Rollout } from '../PropertyManager/Rollout';
import { SelectionBox } from '../PropertyManager/SelectionBox';
import { ParamInput } from './rollouts';
import type { FeatureContext } from './types';

const icons = {
  shell: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/></svg>,
  faces: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
};

export const ShellDraftRollout: React.FC<FeatureContext> = ({ selectedFeature, onParamChange }) => {
  const type = selectedFeature.type;
  const params = selectedFeature.parameters;

  if (type === 'SHELL') {
    return (
      <>
        <Rollout title="Parameters" icon={icons.shell}>
          <div className="space-y-3">
            <ParamInput label="Thickness" value={params.thickness} onChange={(v: any) => onParamChange('thickness', v)} badge="T1" />
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Shell Outward</label>
              <button
                onClick={() => onParamChange('flip', !params.flip)}
                className={`px-3 py-1 rounded text-[11px] font-bold transition-all border ${
                  params.flip ? 'bg-teal-600 text-white border-teal-600 shadow-sm' : 'bg-white text-teal-600 border-teal-200 hover:bg-teal-50'
                }`}
              >
                {params.flip ? 'OUTWARD' : 'OFF'}
              </button>
            </div>
          </div>
        </Rollout>
        <Rollout title="Faces to Remove" icon={icons.faces}>
          <SelectionBox
            label="Selected Faces"
            items={(params.faces_to_remove_refs || []).map((ref: any) => ({ id: ref.id, name: `Face ${ref.id.slice(0, 4)}` }))}
            onRemove={(id: string) => onParamChange('faces_to_remove_refs', (params.faces_to_remove_refs as any[]).filter((r: any) => r.id !== id))}
            onClear={() => onParamChange('faces_to_remove_refs', [])}
            placeholder="Select faces to remove"
          />
        </Rollout>
      </>
    );
  }

  return null;
};
