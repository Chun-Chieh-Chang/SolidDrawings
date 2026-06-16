'use client';

import { useCallback } from 'react';
import { useCadStore } from '../../store/useCadStore';
import { v4 as uuidv4 } from 'uuid';
import { extractAllClosedLoops, extractAllPaths, findDanglingNodes } from '../../utils/geometry/GraphAdapter';

export interface ExtrudeParams {
  points?: any[][];
  textEntities?: any[];
  sketchNodes?: Record<string, any>;
  sketchEdges?: Record<string, any>;
  sketchConstraints?: Record<string, any>;
  depth?: number;
  x?: number;
  y?: number;
  z?: number;
  operation?: 'ADD' | 'CUT' | 'SURFACE';
  plane?: string;
  faceOrigin?: [number, number, number] | null;
  faceNormal?: [number, number, number] | null;
  faceId?: string | null;
}

interface SharedDeps {
  resetSketchSession: () => void;
  handleRebuild: () => void;
  uvTo3D: (u: number, v: number) => [number, number, number];
}

export const useExtrudeBuilders = (shared: SharedDeps) => {
  const {
    sketchNodes,
    sketchEdges,
    sketchConstraints,
    editingFeatureId,
    features,
    activePlane,
    activeFaceOrigin,
    activeFaceNormal,
    activeFaceId,
    setRollbackIndex,
    setSelectedId,
    pushToast,
    setDanglingNodes,
    updateFeatureParams,
    addFeature,
  } = useCadStore();

  const buildExtrudeFeature = useCallback(
    (operationOverride?: 'ADD' | 'CUT' | 'SURFACE', pointsToExtrude?: any[][]) => {
      if (!pointsToExtrude || pointsToExtrude.length === 0) {
        pushToast('Invalid Sketch Profile: No paths found.', 'error');
        return;
      }
      if (!activePlane) return;

      const textEntities = Object.values(sketchEdges)
        .filter((e) => e.type === 'TEXT')
        .map((e) => ({
          text: e.parameters?.text || '3D Builder',
          height: e.parameters?.height || 10,
          font: e.parameters?.font || 'Arial',
          isSingleLine: e.parameters?.isSingleLine ?? true,
          x: sketchNodes[e.nodeIds[0]]?.x || 0,
          y: sketchNodes[e.nodeIds[0]]?.y || 0,
        }));

      const existingFeature = editingFeatureId
        ? features.find((f) => f.id === editingFeatureId)
        : null;
      const existingParams = existingFeature?.parameters ?? {};
      const nextParams: ExtrudeParams = {
        ...existingParams,
        points: pointsToExtrude,
        textEntities,
        sketchNodes: { ...sketchNodes },
        sketchEdges: { ...sketchEdges },
        sketchConstraints: { ...sketchConstraints },
        depth: existingParams.depth ?? 10,
        x: existingParams.x ?? 0,
        y: existingParams.y ?? 0,
        z: existingParams.z ?? 0,
        operation: operationOverride ?? existingParams.operation ?? 'ADD',
        plane: activePlane,
        ...(activePlane === 'FACE'
          ? { faceOrigin: activeFaceOrigin, faceNormal: activeFaceNormal, faceId: activeFaceId }
          : {}),
      };

      let featureId = editingFeatureId;
      if (featureId && existingFeature) {
        updateFeatureParams(featureId, nextParams);
      } else {
        featureId = `feat_${uuidv4()}`;
        addFeature({
          id: featureId,
          type: 'EXTRUDE',
          name: `Custom Extrude ${features.length + 1}`,
          parameters: nextParams,
        });
      }

      shared.resetSketchSession();
      setRollbackIndex(null);
      setSelectedId(featureId);
      setTimeout(shared.handleRebuild, 50);
    },
    [
      sketchNodes, sketchEdges, sketchConstraints, activePlane, editingFeatureId, features,
      activeFaceOrigin, activeFaceNormal, activeFaceId,
      updateFeatureParams, addFeature, setSelectedId, setRollbackIndex, pushToast,
      shared.resetSketchSession, shared.handleRebuild,
    ]
  );

  const handleExitAndExtrude = useCallback(
    (operationOverride?: 'ADD' | 'CUT' | 'SURFACE') => {
      let pointsToExtrude: any[][] = [];
      if (operationOverride === 'SURFACE') {
        pointsToExtrude = extractAllPaths(sketchNodes, sketchEdges);
        if (pointsToExtrude.length === 0) {
          pushToast('Invalid Sketch Profile: No paths found for surface extrusion.', 'error');
          return;
        }
      } else {
        pointsToExtrude = extractAllClosedLoops(sketchNodes, sketchEdges);
        if (pointsToExtrude.length === 0 || pointsToExtrude[0].length < 3) {
          const danglingIds = findDanglingNodes(sketchNodes, sketchEdges);
          const danglingCoords = danglingIds.map((id) => {
            const node = sketchNodes[id];
            return shared.uvTo3D(node.x, node.y);
          });
          setDanglingNodes(danglingCoords);
          pushToast('Profile not closed. Dangling endpoints highlighted in red.', 'warning');
          return;
        }
      }
      buildExtrudeFeature(operationOverride, pointsToExtrude);
    },
    [sketchNodes, sketchEdges, pushToast, setDanglingNodes, shared.uvTo3D, buildExtrudeFeature]
  );

  return { handleExitAndExtrude, buildExtrudeFeature };
};
