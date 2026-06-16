import React, { useState } from 'react';
import { SketchNode, SketchEdge, SketchConstraint } from '@/store/useCadStore';
import { SmartNumericInput } from './smart-numeric-input';
import { Tabs, Tab } from '../components/Tabs';

interface EntityPropertiesRolloutProps {
  activeEntity: SketchNode | SketchEdge | SketchConstraint | null;
  sketchNodes: Record<string, SketchNode>;
  sketchEdges: Record<string, SketchEdge>;
  sketchConstraints: Record<string, SketchConstraint>;
  isEditName: string | null;
  setIsEditName: (id: string | null) => void;
  updateEntityProperty: (id: string, key: string, value: any) => void;
}

export const EntityPropertiesRollout: React.FC<EntityPropertiesRolloutProps> = ({
  activeEntity,
  sketchNodes,
  sketchEdges,
  sketchConstraints,
  isEditName,
  setIsEditName,
  updateEntityProperty,
}) => {
  const isNode = !!activeEntity && !!sketchNodes[(activeEntity as SketchNode).id];
  const isEdge = !!activeEntity && !!sketchEdges[(activeEntity as SketchEdge).id];
  const isConstraint = !!activeEntity && !!sketchConstraints[(activeEntity as SketchConstraint).id];

  if (!activeEntity) return null;

  return (
    <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
      <div className="px-2 py-1 bg-slate-100 border-b border-slate-300 flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-700">Properties</span>
        <span className="text-[9px] font-mono text-slate-400">{activeEntity.id.slice(0, 8)}</span>
      </div>
      <div className="p-3 space-y-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Entity Name</label>
          {isEditName === activeEntity.id ? (
            <input
              autoFocus
              type="text"
              defaultValue={((activeEntity as any).name || activeEntity.id.slice(0, 6))}
              onBlur={(e) => {
                updateEntityProperty(activeEntity.id, 'name', e.target.value);
                setIsEditName(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              className="w-full bg-white border border-blue-400 rounded px-2 py-1 text-[12px] font-bold outline-none shadow-sm"
            />
          ) : (
            <div
              onClick={() => setIsEditName(activeEntity.id)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[12px] font-bold text-slate-700 cursor-text hover:border-blue-300"
            >
              {((activeEntity as any).name || activeEntity.id.slice(0, 6))}
            </div>
          )}
        </div>

        {isNode && (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">X Coord</label>
              <input
                type="number"
                value={(activeEntity as SketchNode).x.toFixed(2)}
                onChange={(e) => updateEntityProperty(activeEntity.id, 'x', parseFloat(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[12px] font-mono font-bold text-right"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Y Coord</label>
              <input
                type="number"
                value={(activeEntity as SketchNode).y.toFixed(2)}
                onChange={(e) => updateEntityProperty(activeEntity.id, 'y', parseFloat(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[12px] font-mono font-bold text-right"
              />
            </div>
          </div>
        )}

        {isEdge && (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Parameters</label>
            <div className="p-2 bg-slate-50 border border-slate-200 rounded space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Type:</span>
                <span className="font-bold text-slate-700">{(activeEntity as SketchEdge).type}</span>
              </div>
              {(activeEntity as SketchEdge).type === 'CIRCLE' && (
                <div className="pt-1">
                  <SmartNumericInput
                    label="Radius"
                    value={(activeEntity as any).radius || 10}
                    onChange={(v) => updateEntityProperty(activeEntity.id, 'radius', v)}
                    badge="R1"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {isConstraint && (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Parameters</label>
            <div className="bg-slate-50 border border-slate-200 rounded overflow-hidden">
              {((activeEntity as SketchConstraint).type === 'DISTANCE' && (activeEntity as any).arcCondition) ? (
                <Tabs>
                  <Tab label="General">
                    <div className="space-y-2 p-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Type:</span>
                        <span className="font-bold text-slate-700">DISTANCE</span>
                      </div>
                      <SmartNumericInput
                        label="Dimension Value"
                        value={(activeEntity as any).value || 0}
                        onChange={(v) => updateEntityProperty(activeEntity.id, 'value', v)}
                        badge="D1"
                      />
                    </div>
                  </Tab>
                  <Tab label="Leaders">
                    <div className="space-y-2 p-1">
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-500 text-[10px] font-bold uppercase">Arc Condition</span>
                        <div className="grid grid-cols-1 gap-1">
                          {['CENTER', 'MIN', 'MAX'].map(condition => (
                            <button
                              key={condition}
                              onClick={() => updateEntityProperty(activeEntity.id, 'arcCondition', condition)}
                              className={`px-2 py-1.5 rounded text-[11px] font-bold text-left transition-all ${
                                (activeEntity as any).arcCondition === condition
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                              }`}
                            >
                              {condition.charAt(0) + condition.slice(1).toLowerCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Tab>
                </Tabs>
              ) : (
                <div className="p-2 space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Type:</span>
                    <span className="font-bold text-slate-700">{(activeEntity as SketchConstraint).type}</span>
                  </div>
                  {((activeEntity as any).type === 'DISTANCE' || (activeEntity as any).type === 'ANGLE') && (
                    <SmartNumericInput
                      label="Value"
                      value={(activeEntity as any).value || 0}
                      onChange={(v) => updateEntityProperty(activeEntity.id, 'value', v)}
                      badge={(activeEntity as any).type === 'ANGLE' ? 'ANG' : 'D1'}
                      unit={(activeEntity as any).type === 'ANGLE' ? 'deg' : 'mm'}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
