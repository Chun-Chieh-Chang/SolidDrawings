'use client';

import React, { Fragment, useState, useMemo } from 'react';
import type { CADFeature, CadState } from '@/store/useCadStore';
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

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  SKETCH: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
  ),
  EXTRUDE: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
  ),
  REVOLVE: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><polyline points="21 3 21 8 16 8"/></svg>
  ),
  SWEEP: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 22C4 13 14 13 14 4"/><circle cx="14" cy="4" r="2"/><circle cx="4" cy="22" r="2"/></svg>
  ),
  LOFT: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 20h16"/><path d="M6 12h12"/><path d="M8 4h8"/><path d="M4 20L8 4"/><path d="M20 20L16 4"/></svg>
  ),
  FILLET: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 2a7 7 0 0 1 7 7"/></svg>
  ),
  CHAMFER: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="2" x2="19" y2="9"/></svg>
  ),
  HOLE_WIZARD: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
  ),
  PATTERN: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  ),
  MIRROR: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
  ),
  TOOLBOX_PART: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.7a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.7z"/></svg>
  ),
  DUMB_SOLID: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
  ),
  PLANE: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
  ),
  REFERENCE_PLANE: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
  ),
  REFERENCE_AXIS: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="2" x2="12" y2="22"/><polyline points="5 12 12 12 19 12"/></svg>
  )
};

function relationClass(state: TreeRelation | null, isSelected: boolean, isRollback: boolean) {
  if (isSelected) return 'bg-[#005B9A] border-[#004A7C] text-white shadow-sm';
  if (isRollback) return 'opacity-40 grayscale-[0.8] text-slate-400';
  if (state === 'PARENT') return 'bg-emerald-50 border-emerald-200 text-emerald-800';
  if (state === 'CHILD') return 'bg-blue-50 border-blue-200 text-blue-800';
  return 'hover:bg-slate-100 border-transparent hover:text-primary-text';
}

function SortableRollbackBar({ id, rollbackIndex, setRollbackIndex }: { id: string, rollbackIndex: number | null, setRollbackIndex: (i: number | null) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: 50,
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
        title="特徵控制棒 (Rollback Bar)"
      />
    </div>
  );
}

function SortableFeatureItem({ 
  id, feature, fIdx, isRolledBack, relState, 
  editingFeatureId, selectedId, selectedSubNodeType, 
  setSelectedId, setSelectedSubNodeType, onEditFeatureSketch, 
  onRebuild, features, setHoveredTreeId
}: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  const isExtrudeOrRevolve = feature.type === 'EXTRUDE' || feature.type === 'REVOLVE';
  const isSelected = selectedId === feature.id && selectedSubNodeType === 'FEATURE';

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`flex flex-col border border-transparent rounded transition-all outline-none ${
        isRolledBack || feature.isSuppressed ? 'opacity-40 grayscale-[0.8]' : ''
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
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setSelectedId(feature.id);
          setSelectedSubNodeType('FEATURE');
          useCadStore.setState({ 
            contextMenu: { visible: true, x: e.clientX, y: e.clientY, type: 'FEATURE', data: { id: feature.id } } 
          });
        }}
        className={`group flex items-center justify-between p-1.5 rounded cursor-pointer transition-all border ${
          relationClass(relState, isSelected, isRolledBack || (feature.isSuppressed ?? false))
        }`}
        title={feature.type === 'SKETCH' ? '雙擊進入草圖編輯' : '雙擊編輯特徵草圖'}
      >
        <div className="flex items-center gap-2 truncate">
          <div className={`shrink-0 transition-colors ${feature.isSuppressed ? 'text-slate-400' : isSelected ? 'text-white' : 'text-[#005B9A]'}`}>
            {FEATURE_ICONS[feature.type] || FEATURE_ICONS.EXTRUDE}
          </div>
          <div className="flex flex-col truncate">
            <span className={`text-[12px] font-bold truncate max-w-[160px] leading-tight ${feature.isSuppressed ? 'italic font-normal' : ''}`}>
              {feature.name}
            </span>
            {isExtrudeOrRevolve && !isSelected && (
              <span className="text-[9px] text-slate-400 font-mono">[{feature.parameters.plane}]</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeatureManagerPanel({ 
  features, rollbackIndex, setRollbackIndex, activePlane, setActivePlane,
  selectedId, setSelectedId, selectedSubNodeType, setSelectedSubNodeType,
  editingFeatureId, onRebuild, onEditFeatureSketch,
  onStartPlaneSketch, onPlaneContextMenu
}: any) {
  const setHoveredTreeId = useCadStore(s => s.setHoveredTreeId);
  const reorderFeatures = useCadStore(s => s.reorderFeatures);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = features.findIndex((f: any) => f.id === active.id);
      const newIndex = features.findIndex((f: any) => f.id === over.id);
      reorderFeatures(oldIndex, newIndex);
      setTimeout(onRebuild, 50);
    }
  };

  const { parents, children } = useMemo(() => {
    const feat = features.find((f: any) => f.id === selectedId);
    if (!feat) return { parents: [], children: [] };
    return getParentsAndChildren(feat, features);
  }, [selectedId, features]);

  const treeData = useMemo(() => {
    const data: any[] = [];
    features.forEach((f: any, idx: number) => {
      let rel: TreeRelation | null = null;
      if (parents.some(p => p.id === f.id)) rel = 'PARENT';
      if (children.some(c => c.id === f.id)) rel = 'CHILD';
      
      data.push({
        id: f.id,
        feature: f,
        fIdx: idx,
        isRolledBack: rollbackIndex !== null && idx > rollbackIndex,
        relState: rel
      });

      if (rollbackIndex !== null && idx === rollbackIndex) {
        data.push({ id: 'rollback-bar', type: 'ROLLBACK' });
      }
    });
    
    if (rollbackIndex === -1) {
       data.unshift({ id: 'rollback-bar', type: 'ROLLBACK' });
    } else if (rollbackIndex === null && features.length > 0) {
       data.push({ id: 'rollback-bar', type: 'ROLLBACK' });
    }
    
    return data;
  }, [features, rollbackIndex, parents, children]);

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">FeatureManager Design Tree</span>
      </div>

      {/* Origin/Planes Section */}
      <div className="p-2 space-y-0.5 border-b border-slate-100">
        {['FRONT', 'TOP', 'RIGHT'].map((plane) => (
          <div
            key={plane}
            onClick={() => { setActivePlane(plane); setSelectedId(null); }}
            onContextMenu={(e) => onPlaneContextMenu(e, plane)}
            className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-all ${
              activePlane === plane ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-500'
            }`}
          >
            <div className="text-[#005B9A]">{FEATURE_ICONS.PLANE}</div>
            <span className="text-[12px]">{plane} Plane</span>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={features.map((f: any) => f.id)} strategy={verticalListSortingStrategy}>
            {treeData.map((item) => (
              item.type === 'ROLLBACK' ? (
                <SortableRollbackBar 
                  key="rollback-bar" 
                  id="rollback-bar" 
                  rollbackIndex={rollbackIndex} 
                  setRollbackIndex={setRollbackIndex} 
                />
              ) : (
                <SortableFeatureItem
                  key={item.id}
                  id={item.id}
                  feature={item.feature}
                  fIdx={item.fIdx}
                  isRolledBack={item.isRolledBack}
                  relState={item.relState}
                  editingFeatureId={editingFeatureId}
                  selectedId={selectedId}
                  selectedSubNodeType={selectedSubNodeType}
                  setSelectedId={setSelectedId}
                  setSelectedSubNodeType={setSelectedSubNodeType}
                  onEditFeatureSketch={onEditFeatureSketch}
                  onRebuild={onRebuild}
                  features={features}
                  setHoveredTreeId={setHoveredTreeId}
                />
              )
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
