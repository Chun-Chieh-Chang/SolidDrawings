'use client';

import React from 'react';
import type { CADFeature } from '@/store/useCadStore';

export interface PartFeaturePropertyManagerProps {
  selectedFeature: CADFeature;
  features: CADFeature[];
  onParamChange: (key: string, value: string) => void;
  onEditSketch: (feature: CADFeature) => void;
  onSelectFeature: (id: string) => void;
}

import { getParentsAndChildren } from '@/utils/feature-tree-relations';

export function PartFeaturePropertyManager({
  selectedFeature,
  features,
  onParamChange,
  onEditSketch,
  onSelectFeature,
}: PartFeaturePropertyManagerProps) {
  const { parents, children } = getParentsAndChildren(selectedFeature, features);
  const relations = selectedFeature.parameters.relations as string[] | undefined;

  return (
    <div className="h-[250px] w-full border-t border-border bg-surface flex flex-col p-3 z-10 shrink-0">
      <div className="text-[14px] uppercase tracking-wider text-secondary-text mb-2 font-bold flex justify-between items-center border-b border-border/40 pb-1">
        <span>屬性管理器 (PropertyManager)</span>
        <span className="text-[13px] bg-primary/10 text-primary px-1 rounded uppercase font-mono">
          {selectedFeature.type}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {selectedFeature.type === 'PATTERN' ? (
          <div className="bg-surface p-2 rounded border border-border shadow-sm space-y-2 text-[14px]">
            <label className="flex items-center justify-between gap-2">
              <span className="text-[13px] text-secondary-text">目標特徵</span>
              <select
                value={selectedFeature.parameters.target_feature_id || ''}
                onChange={(e) => onParamChange('target_feature_id', e.target.value)}
                className="border border-[#C4C7CE] rounded px-1 py-0.5 w-[120px]"
              >
                <option value="">—</option>
                {features
                  .filter((f) => f.id !== selectedFeature.id && f.type !== 'PATTERN')
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="flex items-center justify-between gap-2">
              <span className="text-[13px] text-secondary-text">陣列類型</span>
              <select
                value={selectedFeature.parameters.pattern_type || 'CIRCULAR'}
                onChange={(e) => onParamChange('pattern_type', e.target.value)}
                className="border border-[#C4C7CE] rounded px-1 py-0.5 w-[120px]"
              >
                <option value="CIRCULAR">圓周陣列</option>
                <option value="LINEAR">線性陣列</option>
              </select>
            </label>
            <label className="flex items-center justify-between gap-2">
              <span className="text-[13px] text-secondary-text">數量</span>
              <input
                type="number"
                min={1}
                value={selectedFeature.parameters.count ?? 4}
                onChange={(e) => onParamChange('count', e.target.value)}
                className="border border-[#C4C7CE] rounded px-1.5 py-0.5 w-[120px] text-right font-mono"
              />
            </label>
            <label className="flex items-center justify-between gap-2">
              <span className="text-[13px] text-secondary-text">間距</span>
              <input
                type="number"
                value={selectedFeature.parameters.spacing ?? 90}
                onChange={(e) => onParamChange('spacing', e.target.value)}
                className="border border-[#C4C7CE] rounded px-1.5 py-0.5 w-[120px] text-right font-mono"
              />
            </label>
          </div>
        ) : selectedFeature.type === 'EXTRUDE' ? (
          <div className="space-y-2">
            <div className="bg-surface p-0 rounded border border-border shadow-sm overflow-hidden text-[14px]">
              <div className="bg-slate-50 px-2 py-1.5 border-b border-border font-bold text-slate-700 text-[13px] flex items-center gap-1">
                <span className="text-[14px]">▼</span> 操作 (Operation)
              </div>
              <div className="p-2">
                <select
                  value={selectedFeature.parameters.operation || 'ADD'}
                  onChange={(e) => onParamChange('operation', e.target.value)}
                  className="border border-[#C4C7CE] rounded px-1 py-1 w-full"
                >
                  <option value="ADD">加入 (Boss)</option>
                  <option value="CUT">切除 (Cut)</option>
                </select>
              </div>
            </div>
            
            <div className="bg-surface p-0 rounded border border-border shadow-sm overflow-hidden text-[14px]">
              <div className="bg-slate-50 px-2 py-1.5 border-b border-border font-bold text-slate-700 text-[13px] flex items-center gap-1">
                <span className="text-[14px]">▼</span> 方向 1 (Direction 1)
              </div>
              <div className="p-2 space-y-2">
                <select
                  value="BLIND"
                  disabled
                  className="border border-[#C4C7CE] rounded px-1 py-1 w-full bg-slate-50 text-slate-500"
                >
                  <option value="BLIND">給定深度 (Blind)</option>
                </select>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[20px] text-slate-400" title="深度">↕</span>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={selectedFeature.parameters.depth || 10}
                      onChange={(e) => onParamChange('depth', e.target.value)}
                      className="border border-[#C4C7CE] rounded px-2 py-1 w-full text-right font-mono"
                    />
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">D1</span>
                  </div>
                  <span className="text-[12px] text-slate-500">mm</span>
                </div>
              </div>
            </div>
          </div>
        ) : selectedFeature.type === 'DUMB_SOLID' ? (
          <div className="space-y-2">
            <div className="bg-surface p-0 rounded border border-border shadow-sm overflow-hidden text-[14px]">
              <div className="bg-slate-50 px-2 py-1.5 border-b border-border font-bold text-slate-700 text-[13px] flex items-center gap-1">
                <span className="text-[14px]">▼</span> 平移定位 (Translation)
              </div>
              <div className="p-2 space-y-2">
                {['x', 'y', 'z'].map(axis => (
                  <div key={axis} className="flex items-center justify-between gap-2">
                    <span className="text-[13px] text-slate-500 uppercase">{axis}</span>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        value={selectedFeature.parameters[axis] || 0}
                        onChange={(e) => onParamChange(axis, e.target.value)}
                        className="border border-[#C4C7CE] rounded px-2 py-1 w-full text-right font-mono"
                      />
                    </div>
                    <span className="text-[12px] text-slate-500">mm</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-surface p-0 rounded border border-border shadow-sm overflow-hidden text-[14px]">
              <div className="bg-slate-50 px-2 py-1.5 border-b border-border font-bold text-slate-700 text-[13px] flex items-center gap-1">
                <span className="text-[14px]">▼</span> 檔案資訊 (File Info)
              </div>
              <div className="p-2">
                <div className="text-[11px] text-slate-500 break-all font-mono">
                  {selectedFeature.parameters.filepath}
                </div>
              </div>
            </div>
          </div>
        ) : selectedFeature.type === 'FILLET' || selectedFeature.type === 'CHAMFER' ? (
          <div className="space-y-2">
            <div className="bg-surface p-0 rounded border border-border shadow-sm overflow-hidden text-[14px]">
              <div className="bg-slate-50 px-2 py-1.5 border-b border-border font-bold text-slate-700 text-[13px] flex items-center gap-1">
                <span className="text-[14px]">▼</span> 參數 (Parameters)
              </div>
              <div className="p-2 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[20px] text-slate-400" title={selectedFeature.type === 'FILLET' ? '半徑' : '距離'}>
                    {selectedFeature.type === 'FILLET' ? 'R' : 'D'}
                  </span>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={selectedFeature.parameters[selectedFeature.type === 'FILLET' ? 'radius' : 'distance'] || 2}
                      onChange={(e) => onParamChange(selectedFeature.type === 'FILLET' ? 'radius' : 'distance', e.target.value)}
                      className="border border-[#C4C7CE] rounded px-2 py-1 w-full text-right font-mono"
                    />
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">
                      {selectedFeature.type === 'FILLET' ? 'R1' : 'D1'}
                    </span>
                  </div>
                  <span className="text-[12px] text-slate-500">mm</span>
                </div>
              </div>
            </div>
          </div>
        ) : selectedFeature.type === 'REVOLVE' ? (
          <div className="space-y-2">
            <div className="bg-surface p-0 rounded border border-border shadow-sm overflow-hidden text-[14px]">
              <div className="bg-slate-50 px-2 py-1.5 border-b border-border font-bold text-slate-700 text-[13px] flex items-center gap-1">
                <span className="text-[14px]">▼</span> 旋轉參數 (Revolve Parameters)
              </div>
              <div className="p-2 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[20px] text-slate-400" title="角度">↻</span>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={selectedFeature.parameters.angle || 360}
                      onChange={(e) => onParamChange('angle', e.target.value)}
                      className="border border-[#C4C7CE] rounded px-2 py-1 w-full text-right font-mono"
                    />
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">A1</span>
                  </div>
                  <span className="text-[12px] text-slate-500">deg</span>
                </div>
              </div>
            </div>
          </div>
        ) : ['BOX', 'CYLINDER', 'SPHERE'].includes(selectedFeature.type) ? (
          <div className="space-y-2">
            <div className="bg-surface p-0 rounded border border-border shadow-sm overflow-hidden text-[14px]">
              <div className="bg-slate-50 px-2 py-1.5 border-b border-border font-bold text-slate-700 text-[13px] flex items-center gap-1">
                <span className="text-[14px]">▼</span> 尺寸 (Dimensions)
              </div>
              <div className="p-2 space-y-2">
                {['width', 'height', 'depth', 'radius'].map(dim => {
                  if (selectedFeature.parameters[dim] === undefined) return null;
                  return (
                    <div key={dim} className="flex items-center justify-between gap-2">
                      <span className="text-[13px] text-slate-500 uppercase w-12">{dim}</span>
                      <div className="relative flex-1">
                        <input
                          type="number"
                          value={selectedFeature.parameters[dim]}
                          onChange={(e) => onParamChange(dim, e.target.value)}
                          className="border border-[#C4C7CE] rounded px-2 py-1 w-full text-right font-mono"
                        />
                      </div>
                      <span className="text-[12px] text-slate-500">mm</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="bg-surface p-0 rounded border border-border shadow-sm overflow-hidden text-[14px]">
              <div className="bg-slate-50 px-2 py-1.5 border-b border-border font-bold text-slate-700 text-[13px] flex items-center gap-1">
                <span className="text-[14px]">▼</span> 平移定位 (Translation)
              </div>
              <div className="p-2 space-y-2">
                {['x', 'y', 'z'].map(axis => (
                  <div key={axis} className="flex items-center justify-between gap-2">
                    <span className="text-[13px] text-slate-500 uppercase">{axis}</span>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        value={selectedFeature.parameters[axis] || 0}
                        onChange={(e) => onParamChange(axis, e.target.value)}
                        className="border border-[#C4C7CE] rounded px-2 py-1 w-full text-right font-mono"
                      />
                    </div>
                    <span className="text-[12px] text-slate-500">mm</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-surface p-2 rounded border border-border shadow-sm space-y-2 text-[14px]">
            <div className="text-[13px] text-primary font-bold uppercase mb-1">參數</div>
            {Object.keys(selectedFeature.parameters).map((key) => {
              if (
                key === 'points' ||
                key === 'relations' ||
                key === 'faceOrigin' ||
                key === 'faceNormal' ||
                key === 'faceId' ||
                key === 'operation' ||
                key === 'plane' ||
                key === 'x' ||
                key === 'y' ||
                key === 'z'
              ) {
                return null;
              }
              const val = selectedFeature.parameters[key];
              return (
                <label key={key} className="flex items-center justify-between gap-2">
                  <span className="text-[13px] text-secondary-text uppercase">{key}</span>
                  <input
                    type="number"
                    value={val}
                    onChange={(e) => onParamChange(key, e.target.value)}
                    className="border border-[#C4C7CE] rounded px-1.5 py-0.5 w-[120px] text-right font-mono"
                  />
                </label>
              );
            })}
          </div>
        )}

        {relations && relations.length > 0 && (
          <div className="bg-surface p-2.5 rounded border border-border shadow-sm">
            <div className="text-[13px] font-bold uppercase mb-1">草圖關係</div>
            <div className="space-y-1 max-h-[85px] overflow-y-auto">
              {relations.map((rel, i) => (
                <div key={i} className="text-[13px] font-mono bg-slate-50 px-1.5 py-0.5 rounded border">
                  {rel}
                </div>
              ))}
            </div>
          </div>
        )}

        {(parents.length > 0 || children.length > 0) && (
          <div className="bg-surface p-2.5 rounded border border-border shadow-sm">
            <div className="text-[13px] font-bold uppercase mb-2">父子關係</div>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <div>
                <div className="text-slate-500 mb-1">父項</div>
                {parents.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      p.type === 'SKETCH' ? onEditSketch(selectedFeature) : onSelectFeature(p.id)
                    }
                    className="w-full text-left mb-1 px-1.5 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-800"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              <div>
                <div className="text-slate-500 mb-1">子項</div>
                {children.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSelectFeature(c.id)}
                    className="w-full text-left mb-1 px-1.5 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-800"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
