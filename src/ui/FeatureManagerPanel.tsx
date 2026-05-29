'use client';

import React, { Fragment, useState } from 'react';
import type { CADFeature } from '@/store/useCadStore';
import { getFeatureTreeRelation, getParentsAndChildren, type TreeRelation, type RelationNode } from '@/utils/feature-tree-relations';

export interface FeatureManagerPanelProps {
  features: CADFeature[];
  rollbackIndex: number | null;
  setRollbackIndex: (index: number | null) => void;
  activePlane: string | null;
  setActivePlane: (plane: string | null) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  selectedSubNodeType: 'SKETCH' | 'FEATURE' | null;
  setSelectedSubNodeType: (type: 'SKETCH' | 'FEATURE' | null) => void;
  editingFeatureId: string | null;
  visibleSketches: string[];
  toggleSketchVisibility: (featureId: string) => void;
  removeFeature: (id: string) => void;
  removeFeatures: (ids: string[]) => void;
  onRebuild: () => void;
  onEditFeatureSketch: (feature: CADFeature) => void;
  onStartPlaneSketch: (plane: 'FRONT' | 'TOP' | 'RIGHT') => void;
  onPlaneContextMenu: (event: React.MouseEvent, plane: string) => void;
}

function relationClass(rel: TreeRelation, selected: boolean, active: boolean): string {
  if (selected || active) return '';
  if (rel === 'PARENT') return 'bg-blue-50 border-blue-200 text-blue-900 font-medium';
  if (rel === 'CHILD') return 'bg-purple-50 border-purple-200 text-purple-900 font-medium';
  return 'hover:bg-slate-100 border-transparent hover:text-primary-text';
}

export function FeatureManagerPanel({
  features,
  rollbackIndex,
  setRollbackIndex,
  activePlane,
  setActivePlane,
  selectedId,
  setSelectedId,
  selectedSubNodeType,
  setSelectedSubNodeType,
  editingFeatureId,
  visibleSketches,
  toggleSketchVisibility,
  removeFeature,
  removeFeatures,
  onRebuild,
  onEditFeatureSketch,
  onStartPlaneSketch,
  onPlaneContextMenu,
}: FeatureManagerPanelProps) {
  const [hoveredTreeId, setHoveredTreeId] = useState<string | null>(null);
  const [deletingFeature, setDeletingFeature] = useState<{ target: CADFeature, children: RelationNode[] } | null>(null);

  const rel = (targetId: string) => getFeatureTreeRelation(features, targetId, hoveredTreeId);

  const planes: { id: 'FRONT' | 'TOP' | 'RIGHT'; label: string }[] = [
    { id: 'FRONT', label: '前視基準面' },
    { id: 'TOP', label: '上視基準面' },
    { id: 'RIGHT', label: '右視基準面' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-3 flex flex-col">
      <div className="text-[11px] uppercase tracking-[0.2em] text-secondary-text mb-4 font-black flex justify-between items-center border-b border-border pb-2">
        <span>特徵樹 (Feature Tree)</span>
        <button
          type="button"
          onClick={onRebuild}
          className="text-primary hover:text-primary-dark transition-all"
          title="重建模型"
        >
          🔄
        </button>
      </div>

      <div className="space-y-1.5 text-[14px] select-none">
        <div className="flex items-center gap-2 p-1 text-primary-text font-bold">
          <span>📦</span>
          <span>零件1</span>
        </div>
        <div className="pl-4 space-y-1 text-secondary-text border-b border-border/40 pb-1.5">
          {planes.map(({ id, label }) => (
            <div
              key={id}
              onClick={(e) => {
                setActivePlane(id);
                setSelectedId(null);
                onPlaneContextMenu(e, id);
              }}
              onDoubleClick={() => onStartPlaneSketch(id)}
              onMouseEnter={() => setHoveredTreeId(id)}
              onMouseLeave={() => setHoveredTreeId(null)}
              className={`flex items-center justify-between p-1 rounded cursor-pointer transition-all border ${
                activePlane === id
                  ? 'bg-primary/10 border-primary/30 text-primary font-bold'
                  : relationClass(rel(id), false, activePlane === id)
              }`}
              title="雙擊進入草圖"
            >
              <div className="flex items-center gap-2">
                <span>📄</span>
                <span>{label}</span>
              </div>
            </div>
          ))}
          <div
            onMouseEnter={() => setHoveredTreeId('ORIGIN')}
            onMouseLeave={() => setHoveredTreeId(null)}
            className={`flex items-center gap-2 p-1 rounded cursor-pointer ${relationClass(rel('ORIGIN'), false, false)}`}
          >
            <span>📍</span>
            <span>原點</span>
          </div>
        </div>
      </div>

      <div className="pl-2 pt-2 space-y-1 relative">
        <div
          className={`h-1 w-full rounded-full transition-all cursor-row-resize ${
            rollbackIndex === -1 ? 'bg-blue-600 h-1.5 shadow-md' : 'bg-transparent hover:bg-blue-200'
          }`}
          onClick={() => setRollbackIndex(rollbackIndex === -1 ? null : -1)}
          title="退回至開頭"
        />

        {features.map((f, fIdx) => {
          const relState = rel(f.id);
          const isExtrudeOrRevolve = f.type === 'EXTRUDE' || f.type === 'REVOLVE';
          const isRolledBack = rollbackIndex !== null && fIdx > rollbackIndex;
          const extrudeFeats = features.filter((x) => x.type === 'EXTRUDE' || x.type === 'REVOLVE');
          const sketchNum =
            extrudeFeats.findIndex((x) => x.id === f.id) >= 0
              ? extrudeFeats.findIndex((x) => x.id === f.id) + 1
              : fIdx + 1;

          return (
            <Fragment key={f.id}>
              <div
                className={`flex flex-col border border-transparent rounded transition-all ${
                  isRolledBack ? 'opacity-40 grayscale-[0.5]' : ''
                }`}
                onMouseEnter={() => setHoveredTreeId(f.id)}
                onMouseLeave={() => setHoveredTreeId(null)}
              >
                <div
                  onClick={() => {
                    setSelectedId(f.id);
                    setSelectedSubNodeType('FEATURE');
                  }}
                  onDoubleClick={() => onEditFeatureSketch(f)}
                  className={`group flex items-center justify-between p-1.5 rounded cursor-pointer transition-all border ${
                    editingFeatureId === f.id
                      ? 'bg-emerald-50 border-emerald-300 text-slate-900 font-bold'
                      : selectedId === f.id && selectedSubNodeType === 'FEATURE'
                        ? 'bg-primary/10 border-primary/30 text-primary-text font-bold'
                        : relationClass(relState, selectedId === f.id, false)
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {f.type === 'REVOLVE'
                        ? '🔄'
                        : f.type === 'EXTRUDE'
                          ? f.parameters.operation === 'CUT'
                            ? '🔨'
                            : '🏗️'
                          : f.type === 'BOX'
                            ? '📦'
                            : f.type === 'CYLINDER'
                              ? '🛢️'
                              : '🛠️'}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[14px] leading-tight">{f.name}</span>
                      <span className="text-[13px] text-secondary-text font-mono leading-none uppercase">
                        {f.type === 'EXTRUDE' ? f.parameters.operation : f.type}
                      </span>
                      {editingFeatureId === f.id && (
                        <span className="mt-0.5 text-[12px] text-emerald-700 font-bold uppercase">
                          編輯草圖中
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const { children } = getParentsAndChildren(f, features);
                      if (children.length > 0) {
                        setDeletingFeature({ target: f, children });
                      } else {
                        removeFeature(f.id);
                        setSelectedId(null);
                        onRebuild();
                      }
                    }}
                    onDoubleClick={(e) => e.stopPropagation()}
                    className="opacity-30 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition-all"
                    title="刪除特徵"
                  >
                    🗑️
                  </button>
                </div>

                {isExtrudeOrRevolve && (
                  <div
                    onClick={() => {
                      setSelectedId(f.id);
                      setSelectedSubNodeType('SKETCH');
                    }}
                    onDoubleClick={() => onEditFeatureSketch(f)}
                    className={`pl-7 pr-2 py-1 flex items-center justify-between gap-1.5 cursor-pointer text-[14px] rounded transition-all ${
                      selectedId === f.id && selectedSubNodeType === 'SKETCH'
                        ? 'bg-pink-100/90 border border-pink-300 text-pink-700 font-bold'
                        : 'text-secondary-text hover:text-primary hover:bg-slate-100/50'
                    }`}
                  >
                    <span className="italic truncate">草圖 {sketchNum}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSketchVisibility(f.id);
                      }}
                      className={`p-0.5 rounded ${
                        visibleSketches.includes(f.id) ? 'text-primary' : 'text-slate-300'
                      }`}
                      title={visibleSketches.includes(f.id) ? '隱藏草圖' : '顯示草圖'}
                    >
                      👁
                    </button>
                  </div>
                )}
              </div>

              <div
                className={`h-1 w-full rounded-full transition-all cursor-row-resize ${
                  rollbackIndex === fIdx ? 'bg-blue-600 h-1.5 shadow-md' : 'bg-transparent hover:bg-blue-200'
                }`}
                onClick={() => setRollbackIndex(rollbackIndex === fIdx ? null : fIdx)}
                title="退回至此特徵"
              />
            </Fragment>
          );
        })}
      </div>

      {deletingFeature && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg shadow-2xl max-w-sm w-full overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="px-4 py-3 border-b border-border bg-red-50 flex items-center gap-3">
              <span className="text-red-500 text-xl">⚠️</span>
              <h3 className="font-bold text-red-900 text-[15px]">確認刪除 (Confirm Delete)</h3>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <p className="text-[13px] text-primary-text mb-3 leading-relaxed">
                您即將刪除特徵 <span className="font-bold">{deletingFeature.target.name}</span>。
                <br />
                以下相依特徵將會**一併被刪除**，請問是否繼續？
              </p>
              <div className="bg-slate-50 border border-border rounded p-2 max-h-[120px] overflow-y-auto space-y-1">
                {deletingFeature.children.map(c => (
                  <div key={c.id} className="flex items-center gap-2 text-[12px] text-slate-700 bg-white px-2 py-1 rounded shadow-sm border border-slate-100">
                    <span>{c.type === 'SKETCH' ? '✏️' : '🔗'}</span>
                    <span className="font-medium">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-4 py-3 border-t border-border bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setDeletingFeature(null)}
                className="px-4 py-1.5 rounded text-[13px] font-bold text-slate-600 hover:bg-slate-200 transition-all"
              >
                取消 (Cancel)
              </button>
              <button
                onClick={() => {
                  const idsToDelete = [deletingFeature.target.id, ...deletingFeature.children.map(c => c.id)];
                  removeFeatures(idsToDelete);
                  setSelectedId(null);
                  setDeletingFeature(null);
                  onRebuild();
                }}
                className="px-4 py-1.5 rounded text-[13px] font-bold bg-red-500 hover:bg-red-600 text-white shadow-sm transition-all"
              >
                刪除全部 (Yes)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
