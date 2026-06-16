'use client';

import React from 'react';
import { Rollout } from '../PropertyManager/Rollout';
import { SelectionBox } from '../PropertyManager/SelectionBox';
import { ParamInput } from './rollouts';
import type { FeatureContext } from './types';

const icons = {
  features: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  direction: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>,
  skip: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>,
  patternType: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>,
  fillBoundary: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  fillSettings: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6v6H9z"/></svg>,
  flip: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m7 11-5 5 5 5v-4h10v4l5-5-5-5v4H7Z"/></svg>,
};

export const PatternRollout: React.FC<FeatureContext> = ({ selectedFeature, features, onParamChange }) => {
  const params = selectedFeature.parameters;
  const patternType = params.pattern_type || 'LINEAR';
  const hasDir2 = params.count2 !== undefined && params.count2 > 0;
  const hasFill = patternType === 'FILL';

  return (
    <>
      <Rollout title="Features to Pattern" icon={icons.features}>
        <div className="space-y-2">
          <select
            value=""
            onChange={(e) => {
              const id = e.target.value;
              if (!id) return;
              const current = params.target_feature_ids || [];
              if (!current.includes(id)) onParamChange('target_feature_ids', [...current, id]);
            }}
            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[12px] font-bold"
          >
            <option value="">+ Add Feature...</option>
            {(features || [])
              .filter((f) => f.id !== selectedFeature.id && f.type !== 'PATTERN' && !(params.target_feature_ids || []).includes(f.id))
              .map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
          </select>
          <SelectionBox
            label="Selected Features"
            items={(params.target_feature_ids || []).map((id: string) => ({ id, name: (features || []).find(f => f.id === id)?.name || id }))}
            onRemove={(id: string) => onParamChange('target_feature_ids', (params.target_feature_ids || []).filter((tid: string) => tid !== id))}
            onClear={() => onParamChange('target_feature_ids', [])}
            placeholder="Select features from the tree or list"
          />
        </div>
      </Rollout>

      <Rollout title="Direction 1" icon={icons.direction}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SelectionBox
                label={patternType === 'CIRCULAR' ? "Rotation Axis" : "Pattern Direction"}
                items={(params.direction_refs || []).map((ref: any, idx: number) => ({ id: ref.id || `${idx}`, name: ref.type === 'FACE' ? `Face ${ref.id.slice(0,4)}` : `Edge ${idx + 1}` }))}
                onRemove={() => onParamChange('direction_refs', [])}
                onClear={() => onParamChange('direction_refs', [])}
                placeholder={patternType === 'CIRCULAR' ? "Select circular edge or face" : "Select edge for direction"}
                maxHeight="60px"
              />
            </div>
            <button
              onClick={() => onParamChange('flip1', !params.flip1)}
              className={`mt-4 p-1.5 border rounded transition-all ${params.flip1 ? 'bg-[#005B9A] border-[#004A7C] text-white shadow-inner' : 'bg-white border-slate-300 text-slate-400 hover:text-slate-600'}`}
              title="Reverse Direction"
            >
              {icons.flip}
            </button>
          </div>

          {patternType === 'CIRCULAR' && (
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Equal Spacing</label>
              <button
                onClick={() => onParamChange('equalSpacing', !params.equalSpacing)}
                className={`px-3 py-1 rounded text-[10px] font-black border transition-all ${params.equalSpacing ? 'bg-[#005B9A] text-white border-[#004A7C]' : 'bg-white text-slate-400 border-slate-200'}`}
              >
                {params.equalSpacing ? 'ON' : 'OFF'}
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <ParamInput
              label={patternType === 'CIRCULAR' ? (params.equalSpacing ? "Total Angle" : "Step Angle") : "Spacing"}
              value={params.spacing}
              onChange={(v: any) => onParamChange('spacing', v)}
              unit={patternType === 'CIRCULAR' ? "deg" : "mm"}
            />
            <ParamInput label="Instances" value={params.count} onChange={(v: any) => onParamChange('count', v)} unit="pcs" />
          </div>
        </div>
      </Rollout>

      {patternType === 'LINEAR' && (
        <Rollout title="Direction 2" icon={icons.direction}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Enable Dir 2</label>
              <button
                onClick={() => onParamChange('count2', params.count2 && params.count2 > 0 ? 0 : 2)}
                className={`px-3 py-1 rounded text-[10px] font-black border transition-all ${hasDir2 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-200'}`}
              >
                {hasDir2 ? 'ON' : 'OFF'}
              </button>
            </div>

            {hasDir2 && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <SelectionBox
                      label="Direction 2"
                      items={(params.direction2_refs || []).map((ref: any, idx: number) => ({ id: ref.id || `${idx}`, name: `Edge ${idx + 1}` }))}
                      onRemove={(id: string) => onParamChange('direction2_refs', (params.direction2_refs || []).filter((r: any) => r.id !== id))}
                      onClear={() => onParamChange('direction2_refs', [])}
                      placeholder="Select edge for Dir 2"
                      maxHeight="60px"
                    />
                  </div>
                  <button
                    onClick={() => onParamChange('flip2', !params.flip2)}
                    className={`mt-4 p-1.5 border rounded transition-all ${params.flip2 ? 'bg-[#005B9A] border-[#004A7C] text-white shadow-inner' : 'bg-white border-slate-300 text-slate-400 hover:text-slate-600'}`}
                    title="Reverse Direction 2"
                  >
                    {icons.flip}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <ParamInput label="Spacing 2" value={params.spacing2 || 10} onChange={(v: any) => onParamChange('spacing2', v)} />
                  <ParamInput label="Instances 2" value={params.count2} onChange={(v: any) => onParamChange('count2', v)} unit="pcs" />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Pattern Seed Only</label>
                  <button
                    onClick={() => onParamChange('patternSeedOnly', !params.patternSeedOnly)}
                    className={`px-3 py-1 rounded text-[10px] font-black border transition-all ${params.patternSeedOnly ? 'bg-amber-600 text-white border-amber-700' : 'bg-white text-slate-400 border-slate-200'}`}
                  >
                    {params.patternSeedOnly ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Rollout>
      )}

      <Rollout title="Instances to Skip" icon={icons.skip}>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Excluded Copies</label>
          <div className="flex flex-wrap gap-1 min-h-[24px]">
            {(params.instancesToSkip || []).map((idx: number) => (
              <button
                key={idx}
                onClick={() => onParamChange('instancesToSkip', (params.instancesToSkip as number[]).filter((i: number) => i !== idx))}
                className="bg-slate-200 hover:bg-red-100 hover:text-red-700 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-black transition-colors"
              >
                #{idx} ×
              </button>
            ))}
            <button
              onClick={() => {
                const input = prompt('Enter instance index to skip (starting from 0):');
                if (input !== null) {
                  const idx = parseInt(input);
                  if (!isNaN(idx)) {
                    const current = params.instancesToSkip || [];
                    if (!current.includes(idx)) onParamChange('instancesToSkip', [...current, idx].sort((a, b) => a - b));
                  }
                }
              }}
              className="bg-white border border-dashed border-slate-300 text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold hover:border-slate-400 hover:text-slate-600"
            >
              + Skip
            </button>
          </div>
        </div>
      </Rollout>

      <Rollout title="Pattern Type" icon={icons.patternType}>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Method</label>
          <select
            value={patternType}
            onChange={(e) => onParamChange('pattern_type', e.target.value)}
            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[12px] font-bold"
          >
            <option value="LINEAR">Linear Pattern</option>
            <option value="CIRCULAR">Circular Pattern</option>
            <option value="FILL">Fill Pattern</option>
          </select>
        </div>
      </Rollout>

      {hasFill && (
        <>
          <Rollout title="Fill Boundary" icon={icons.fillBoundary}>
            <div className="space-y-2">
              <select
                value={params.boundary_id || ''}
                onChange={(e) => onParamChange('boundary_id', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[12px] font-bold"
              >
                <option value="">— Select Boundary Sketch —</option>
                {(features || []).filter(f => f.type === 'SKETCH').map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <div className="p-2 bg-emerald-50 border border-emerald-100 rounded text-[10px] text-emerald-700 font-bold">
                The pattern will be contained within the selected closed sketch.
              </div>
            </div>
          </Rollout>

          <Rollout title="Fill Settings" icon={icons.fillSettings}>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Layout</label>
                <select
                  value={params.fill_layout || 'SQUARE'}
                  onChange={(e) => onParamChange('fill_layout', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[12px] font-bold"
                >
                  <option value="SQUARE">Square / Grid</option>
                  <option value="PERFORATION">Perforation</option>
                  <option value="HEXAGON">Hexagonal / Honeycomb</option>
                </select>
              </div>
              <ParamInput label="Instance Spacing" value={params.spacing} onChange={(v: any) => onParamChange('spacing', v)} badge="SP" />
              <ParamInput label="Margin" value={params.margin || 2.0} onChange={(v: any) => onParamChange('margin', v)} badge="MG" />
              <ParamInput label="Rotation" value={params.fill_angle || 0} onChange={(v: any) => onParamChange('fill_angle', v)} unit="deg" badge="ROT" />
            </div>
          </Rollout>
        </>
      )}
    </>
  );
};
