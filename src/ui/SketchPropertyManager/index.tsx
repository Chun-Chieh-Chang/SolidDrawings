'use client';

import React from 'react';
import { useCadStore } from '@/store/useCadStore';
import { HeaderRollout } from './header-rollout';
import { LinearPatternRollout } from './linear-pattern-rollout';
import { CircularPatternRollout } from './circular-pattern-rollout';
import { MirrorRollout } from './mirror-rollout';
import { EntityPropertiesRollout } from './entity-properties-rollout';
import { TextRollout } from './text-rollout';
import { AllRelationsRollout } from './all-relations-rollout';
import { ConstraintsListRollout } from './constraints-list-rollout';
import { RelationsGrid } from './relations-grid';
import { SelectionRollout } from './selection-rollout';
import { useSketchLogic } from './use-sketch-logic';

export const SketchPropertyManager: React.FC = () => {
  const { setSketchTool } = useCadStore();
  const L = useSketchLogic();

  return (
    <div className="flex flex-col h-full bg-[#F5F6F9] select-none font-sans">
      <HeaderRollout selectedEntityIds={L.selectedEntityIds} solverReport={L.solverReport} sketchNodes={L.sketchNodes} onAutoDefine={L.handleAutoDefine} />
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {L.sketchTool === 'LINEAR_PATTERN' && (
          <LinearPatternRollout setSketchTool={setSketchTool} patternAxisId={L.patternAxisId} setPatternAxisId={L.setPatternAxisId} patternCount={L.patternCount} setPatternCount={L.setPatternCount} patternSpacing={L.patternSpacing} setPatternSpacing={L.setPatternSpacing} selectedEdges={L.selectedEdges} selectedEntityIds={L.selectedEntityIds} executeLinearPattern={L.executeLinearPattern} />
        )}
        {L.sketchTool === 'CIRCULAR_PATTERN' && (
          <CircularPatternRollout setSketchTool={setSketchTool} patternCount={L.patternCount} setPatternCount={L.setPatternCount} patternAngle={L.patternAngle} setPatternAngle={L.setPatternAngle} selectedNodes={L.selectedNodes} executeCircularPattern={L.executeCircularPattern} />
        )}
        {L.sketchTool === 'MIRROR' && (
          <MirrorRollout setSketchTool={setSketchTool} mirrorAxisId={L.mirrorAxisId} setMirrorAxisId={L.setMirrorAxisId} selectedEdges={L.selectedEdges} selectedEntityIds={L.selectedEntityIds} executeSketchMirror={L.executeSketchMirror} />
        )}
        {L.activeEntity && <EntityPropertiesRollout activeEntity={L.activeEntity} sketchNodes={L.sketchNodes} sketchEdges={L.sketchEdges} sketchConstraints={L.sketchConstraints} isEditName={L.isEditName} setIsEditName={L.setIsEditName} updateEntityProperty={L.updateEntityProperty} />}
        {L.showText && <TextRollout selectedEntityIds={L.selectedEntityIds} sketchEdges={L.sketchEdges} updateEntityProperty={L.updateEntityProperty} />}
        {L.showAllRelations && <AllRelationsRollout sketchConstraints={L.sketchConstraints} setHoveredEntityId={L.setHoveredEntityId} setSelectedEntityIds={L.setSelectedEntityIds} onDeleteAll={L.onDeleteAllRelations} />}
        <SelectionRollout selectedNodes={L.selectedNodes} selectedEdges={L.selectedEdges} selectedEntityIds={L.selectedEntityIds} handleDeleteEntities={L.handleDeleteEntities} />
        {!L.hasActiveTool && <RelationsGrid applyConstraint={L.applyConstraint} />}
        {L.selectedConstraints.length > 0 && <ConstraintsListRollout selectedConstraints={L.selectedConstraints} deleteConstraint={L.deleteConstraint} />}
      </div>
    </div>
  );
};
