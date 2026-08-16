'use client';

import React from 'react';
import { Rollout } from '../PropertyManager/Rollout';
import { ParamInput } from './rollouts';
import type { FeatureContext } from './types';

const TranslationRollout: React.FC<FeatureContext> = ({ selectedFeature, onParamChange, pendingFeatureCommand }) => {
  const params = selectedFeature.parameters;
  void pendingFeatureCommand;
  return (
    <Rollout title="Translation">
      <div className="space-y-2">
        {['x', 'y', 'z'].map(axis => <ParamInput key={axis} label={axis.toUpperCase()} value={params[axis]} onChange={(v: any) => onParamChange(axis, v)} badge={axis.toUpperCase()} />)}
      </div>
    </Rollout>
  );
};

export const OpenScadRollout: React.FC<FeatureContext> = ({ selectedFeature, onParamChange, pendingFeatureCommand }) => {
  const params = selectedFeature.parameters;
  return (
    <>
      <Rollout title="OpenSCAD Script">
        <div className="space-y-2">
          <textarea
            value={params.scad_code || ''}
            onChange={(e) => onParamChange('scad_code', e.target.value)}
            rows={12}
            spellCheck={false}
            className="w-full bg-slate-900 text-emerald-300 text-[11px] font-mono leading-snug rounded border border-slate-600 p-2 resize-y focus:outline-none focus:border-[#005B9A]"
            placeholder="// OpenSCAD code"
          />
        </div>
      </Rollout>
      <TranslationRollout selectedFeature={selectedFeature} onParamChange={onParamChange} pendingFeatureCommand={pendingFeatureCommand} />
    </>
  );
};

export const ImportedStlRollout: React.FC<FeatureContext> = ({ selectedFeature, onParamChange, pendingFeatureCommand }) => {
  const params = selectedFeature.parameters;
  return (
    <>
      <Rollout title="STL Source">
        <div className="space-y-2">
          <div className="text-[11px] font-mono text-slate-600 bg-white border border-slate-300 rounded px-2 py-1 break-all">
            {params.filepath || 'No file'}
          </div>
        </div>
      </Rollout>
      <TranslationRollout selectedFeature={selectedFeature} onParamChange={onParamChange} pendingFeatureCommand={pendingFeatureCommand} />
    </>
  );
};