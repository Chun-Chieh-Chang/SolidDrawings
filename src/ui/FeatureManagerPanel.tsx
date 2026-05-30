'use client';

import React, { Fragment, useState, useMemo } from 'react';
import type { CADFeature } from '@/store/useCadStore';
import { getFeatureTreeRelation, getParentsAndChildren, type TreeRelation, type RelationNode } from '@/utils/feature-tree-relations';
import { useCadStore } from '@/store/useCadStore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

function SortableRollbackBar({ id, rollbackIndex, setRollbackIndex }: { id: string, rollbackIndex: number | null, setRollbackIndex: (i: number | null) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="py-0.5 my-1 outline-none">
      <div
        className={`h-1.5 w-full rounded-full transition-all cursor-grab active:cursor-grabbing ${
          isDragging ? 'bg-blue-600 shadow-lg scale-y-150' : rollbackIndex === -1 ? 'bg-blue-600 h-1.5 shadow-md' : 'bg-blue-400 hover:bg-blue-500 hover:h-2'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          setRollbackIndex(rollbackIndex === -1 ? null : -1);
        }}
        title="特徵控制棒 (Rollback Bar) - 拖曳以退回設計歷史"
      />
    </div>
  );
}

function SortableFeatureItem({ 
  id, feature, fIdx, isRolledBack, relState, 
  editingFeatureId, selectedId, selectedSubNodeType, visibleSketches, 
  setSelectedId, setSelectedSubNodeType, onEditFeatureSketch, 
  removeFeature, setDeletingFeature, toggleSketchVisibility, onRebuild, features, setHoveredTreeId
}: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  const isExtrudeOrRevolve = feature.type === 'EXTRUDE' || feature.type === 'REVOLVE';
  const extrudeFeats = features.filter((x: any) => x.type === 'EXTRUDE' || x.type === 'REVOLVE');
  const sketchNum = extrudeFeats.findIndex((x: any) => x.id === feature.id) >= 0
    ? extrudeFeats.findIndex((x: any) => x.id === feature.id) + 1
    : fIdx + 1;

  const setHoveredChildren = useCadStore(s => s.setHoveredChildren);

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`flex flex-col border border-transparent rounded transition-all outline-none ${
        isRolledBack ? 'opacity-40 grayscale-[0.5]' : ''
      }`}
      onMouseEnter={() => setHoveredTreeId(feature.id)}
      onMouseLeave={() => setHoveredTreeId(null)}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          setSelectedId(feature.id);
          setSelectedSubNodeType('FEATURE');
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onEditFeatureSketch(feature);
        }}
        className={`group flex items-center justify-between p-1.5 rounded cursor-pointer transition-all border ${
          editingFeatureId === feature.id
            ? 'bg-emerald-50 border-emerald-300 text-slate-900 font-bold'
            : feature.type === 'SKETCH' && selectedId === feature.id && selectedSubNodeType === 'FEATURE'
              ? 'bg-blue-100 border-blue-400 text-blue-900 font-bold'
              : feature.type === 'SKETCH'
                ? 'bg-blue-50/60 border-blue-200/80 text-blue-800 hover:bg-blue-100 hover:border-blue-300'
                : selectedId === feature.id && selectedSubNodeType === 'FEATURE'
                  ? 'bg-primary/10 border-primary/30 text-primary-text font-bold'
                  : relationClass(relState, selectedId === feature.id, false)
        }`}
        title={feature.type === 'SKETCH' ? '雙擊進入草圖編輯' : '雙擊編輯特徵草圖'}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm cursor-grab active:cursor-grabbing">
            {feature.type === 'REVOLVE'
              ? '🔄'
              : feature.type === 'EXTRUDE'
                ? feature.parameters.operation === 'CUT'
                  ? '🔨'
                  : '🏗️'
                : feature.type === 'SKETCH'
                  ? '📐'
                  : feature.type === 'SWEEP'
                    ? '〰️'
                    : feature.type === 'LOFT'
                      ? '🔺'
                      : feature.type === 'BOX'
                        ? '📦'
                        : feature.type === 'CYLINDER'
                          ? '🛢️'
                          : feature.type === 'SPHERE'
                            ? '🔮'
                            : feature.type === 'FILLET'
                              ? '🌈'
                              : feature.type === 'CHAMFER'
                                ? '📐'
                                : feature.type === 'SHELL'
                                  ? '🐚'
                                  : feature.type === 'HOLE_WIZARD'
                                    ? '🕳️'
                                    : feature.type === 'MIRROR'
                                      ? '🪞'
                                      : feature.type === 'PATTERN'
                                        ? '💠'
                                        : '🛠️'}
          </span>
          <div className="flex flex-col">
            <span className="text-[12px] font-bold truncate max-w-[140px] leading-tight">{feature.name}</span>
            {isExtrudeOrRevolve && (
              <span className="text-[9px] text-slate-400 font-mono">[{feature.parameters.plane}]</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {feature.type === 'SKETCH' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSketchVisibility(feature.id);
              }}
              className={`w-6 h-6 flex items-center justify-center rounded-md border transition-all ${
                visibleSketches.includes(feature.id)
                  ? 'bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200'
                  : 'bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200'
              }`}
              title={visibleSketches.includes(feature.id) ? '隱藏草圖' : '顯示草圖'}
            >
              <span className="text-[10px]">{visibleSketches.includes(feature.id) ? '👁️' : '🕶️'}</span>
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const { children } = getParentsAndChildren(feature, features);
              if (children.length > 0) {
                setDeletingFeature({ target: feature, children });
                setHoveredChildren(children.map(c => c.id));
              } else {
                removeFeature(feature.id);
                onRebuild();
              }
            }}
            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-500 hover:text-white transition-all text-slate-400 border border-transparent hover:border-red-600"
            title="刪除特徵"
          >
            <span className="text-[12px] font-bold">×</span>
          </button>
        </div>
      </div>

      {isExtrudeOrRevolve && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            setSelectedId(feature.id);
            setSelectedSubNodeType('SKETCH');
          }}
          className={`pl-7 pr-2 py-1 flex items-center justify-between gap-1.5 cursor-pointer text-[14px] rounded transition-all cursor-default ${
            selectedId === feature.id && selectedSubNodeType === 'SKETCH'
              ? 'bg-blue-100/50 text-blue-700 font-bold border-l-2 border-blue-500'
              : 'text-slate-500 hover:bg-slate-100/50'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-[10px]">📐</span>
            <span className="text-[11px] font-medium tracking-tight">草圖 {sketchNum}</span>
          </div>
          {visibleSketches.includes(feature.id) ? null : <span className="text-[10px] opacity-40">🕶️</span>}
        </div>
      )}

      {feature.type === 'SWEEP' && (
        <div className="pl-7 space-y-0.5 mt-0.5">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            Profile: {features.find((f: CADFeature) => f.id === feature.parameters.profile_id)?.name || 'None'}
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            Path: {features.find((f: CADFeature) => f.id === feature.parameters.path_id)?.name || 'None'}
          </div>
        </div>
      )}

      {feature.type === 'LOFT' && (
        <div className="pl-7 space-y-0.5 mt-0.5">
          {(feature.parameters.profile_ids || []).map((pid: string, idx: number) => (
            <div key={pid} className="text-[10px] text-slate-400 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              P{idx+1}: {features.find((f: CADFeature) => f.id === pid)?.name || 'None'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
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
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const hoveredTreeId = useCadStore(state => state.hoveredTreeId);
  const setHoveredTreeId = useCadStore(state => state.setHoveredTreeId);
  const setHoveredChildren = useCadStore(state => state.setHoveredChildren);
  
  const [deletingFeature, setDeletingFeature] = useState<{ target: CADFeature, children: RelationNode[] } | null>(null);
  const pushToast = useCadStore(state => state.pushToast);
  const reorderFeatures = useCadStore(state => state.reorderFeatures);

  const rel = (targetId: string) => getFeatureTreeRelation(features, targetId, hoveredTreeId);

  const planes = [
    { id: 'FRONT', label: '前基準面 (Front)' },
    { id: 'TOP', label: '上基準面 (Top)' },
    { id: 'RIGHT', label: '右基準面 (Right)' },
  ];

  const items = useMemo(() => {
    const ids = features.map(f => f.id);
    if (rollbackIndex === null) {
      return [...ids, 'ROLLBACK_BAR'];
    }
    const result = [...ids];
    result.splice(rollbackIndex + 1, 0, 'ROLLBACK_BAR');
    return result;
  }, [features, rollbackIndex]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id === 'ROLLBACK_BAR') {
      const overIndex = items.indexOf(over.id as string);
      const itemsWithoutBar = items.filter(id => id !== 'ROLLBACK_BAR');
      const finalIndex = overIndex > items.indexOf('ROLLBACK_BAR') ? overIndex - 1 : overIndex;
      setRollbackIndex(finalIndex === itemsWithoutBar.length - 1 ? null : finalIndex);
      return;
    }

    if (active.id !== over.id) {
      const itemsWithoutRollback = items.filter(id => id !== 'ROLLBACK_BAR');
      const sourceIndex = itemsWithoutRollback.indexOf(active.id as string);
      const destIndex = itemsWithoutRollback.indexOf(over.id as string);

      const sourceFeature = features[sourceIndex];
      // Topology Check
      const { parents, children } = getParentsAndChildren(sourceFeature, features);
      const parentIds = parents.map(p => p.id);
      const childIds = children.map(c => c.id);

      // If moving UP, it cannot cross any parent.
      if (destIndex < sourceIndex) {
        for (let i = destIndex; i < sourceIndex; i++) {
          if (parentIds.includes(itemsWithoutRollback[i])) {
            pushToast('無法重新排序：違反特徵相依性 (不能移至父特徵之前)', 'error');
            return;
          }
        }
      }
      // If moving DOWN, it cannot cross any child.
      else {
        for (let i = sourceIndex + 1; i <= destIndex; i++) {
          if (childIds.includes(itemsWithoutRollback[i])) {
            pushToast('無法重新排序：違反特徵相依性 (不能移至子特徵之後)', 'error');
            return;
          }
        }
      }

      reorderFeatures(sourceIndex, destIndex);
      onRebuild();
    }
  };

  return (
    <div className="w-[340px] bg-[#F1F5F9] border-r border-slate-200 flex flex-col shadow-[4px_0_12px_rgba(0,0,0,0.03)] z-10 shrink-0 select-none overflow-hidden h-full">
      <div className="p-3 bg-gradient-to-b from-white to-[#F8FAFC] border-b border-slate-200">
        <h2 className="text-[13px] font-black text-slate-800 tracking-wider uppercase mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
          FeatureManager
        </h2>
        
        <div className="space-y-0.5 text-sm font-semibold">
          <div className="text-secondary-text mb-2 px-1 text-[11px] uppercase tracking-wider">標準基準面</div>
          {planes.map(({ id, label }) => (
            <div
              key={id}
              onClick={() => setActivePlane(id)}
              onDoubleClick={() => onStartPlaneSketch(id as any)}
              onContextMenu={(e) => onPlaneContextMenu(e, id)}
              onMouseEnter={() => setHoveredTreeId(id)}
              onMouseLeave={() => setHoveredTreeId(null)}
              className={`flex items-center justify-between p-1 rounded cursor-pointer transition-colors ${
                activePlane === id
                  ? 'bg-blue-100 border-blue-400 text-blue-900 font-bold'
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

      <div className="p-2 overflow-y-auto flex-1 space-y-1 relative">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items}
            strategy={verticalListSortingStrategy}
          >
            {items.map((id, index) => {
              if (id === 'ROLLBACK_BAR') {
                return <SortableRollbackBar key={id} id={id} rollbackIndex={rollbackIndex} setRollbackIndex={setRollbackIndex} />;
              }

              const f = features.find(feat => feat.id === id);
              if (!f) return null;
              
              const fIdx = features.findIndex(feat => feat.id === id);
              const isRolledBack = rollbackIndex !== null && fIdx > rollbackIndex;
              const relState = rel(f.id);

              return (
                <SortableFeatureItem 
                  key={id} 
                  id={id} 
                  feature={f} 
                  fIdx={fIdx} 
                  isRolledBack={isRolledBack} 
                  relState={relState}
                  editingFeatureId={editingFeatureId}
                  selectedId={selectedId}
                  selectedSubNodeType={selectedSubNodeType}
                  visibleSketches={visibleSketches}
                  setSelectedId={setSelectedId}
                  setSelectedSubNodeType={setSelectedSubNodeType}
                  onEditFeatureSketch={onEditFeatureSketch}
                  removeFeature={removeFeature}
                  setDeletingFeature={setDeletingFeature}
                  toggleSketchVisibility={toggleSketchVisibility}
                  onRebuild={onRebuild}
                  features={features}
                  setHoveredTreeId={setHoveredTreeId}
                />
              );
            })}
          </SortableContext>
        </DndContext>
      </div>

      {deletingFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[400px] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-lg font-bold text-red-800">確認刪除相依特徵</h3>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-700 mb-4 leading-relaxed">
                您正準備刪除 <strong className="text-slate-900">{deletingFeature.target.name}</strong>，
                這會導致依賴它的 <strong>{deletingFeature.children.length}</strong> 個子特徵也被一併刪除：
              </p>
              <ul className="max-h-40 overflow-y-auto space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200 mb-6">
                {deletingFeature.children.map(child => (
                  <li key={child.id} className="text-sm text-slate-600 flex items-center gap-2">
                    <span className="text-red-400">↳</span>
                    {child.name} <span className="text-xs text-slate-400">({child.type})</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  onClick={() => {
                    setDeletingFeature(null);
                    setHoveredChildren([]);
                  }}
                >
                  取消
                </button>
                <button
                  className="px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm shadow-red-200"
                  onClick={() => {
                    removeFeatures([deletingFeature.target.id, ...deletingFeature.children.map(c => c.id)]);
                    setSelectedId(null);
                    setDeletingFeature(null);
                    setHoveredChildren([]);
                    onRebuild();
                  }}
                >
                  全部刪除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
