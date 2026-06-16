'use client';

import { useCallback } from 'react';
import { useCadStore } from '../../store/useCadStore';
import { v4 as uuidv4 } from 'uuid';
import { extractAllClosedLoops, findDanglingNodes } from '../../utils/geometry/GraphAdapter';

export interface RevolveParams {
  points?: any[][];
  sketchNodes?: Record<string, any>;
  sketchEdges?: Record<string, any>;
  sketchConstraints?: Record<string, any>;
  angle?: number;
  axis_edge_id?: string | null;
  axis_points?: [number, number, number][] | null;
  axis_uv_points?: [number, number][] | null;
  x?: number;
  y?: number;
  z?: number;
  operation?: 'ADD' | 'CUT';
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

export const useRevolveBuilders = (shared: SharedDeps) => {
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

  const handleRevolveFromSketch = useCallback(
    (operationOverride?: 'ADD' | 'CUT') => {
      const solidLoops = extractAllClosedLoops(sketchNodes, sketchEdges);
      if (solidLoops.length === 0 || solidLoops[0].length < 3) {
        const danglingIds = findDanglingNodes(sketchNodes, sketchEdges);
        const danglingCoords = danglingIds.map((id) => {
          const node = sketchNodes[id];
          return shared.uvTo3D(node.x, node.y);
        });
        setDanglingNodes(danglingCoords);
        pushToast('Profile not closed. Dangling endpoints highlighted in red.', 'warning');
        return;
      }
      if (!activePlane) return;

      const constructionEdges = Object.values(sketchEdges).filter(
        (e) => e.type === 'CENTER_LINE' || e.isConstruction
      );
      let autoAxisEdgeId: string | null = null;
      let autoAxisPoints: [number, number, number][] | null = null;
      let autoAxisUVPoints: [number, number][] | null = null;

      if (constructionEdges.length > 0) {
        const axis = constructionEdges[0];
        autoAxisEdgeId = axis.id;
        const n1 = sketchNodes[axis.nodeIds[0]];
        const n2 = sketchNodes[axis.nodeIds[1]];
        if (n1 && n2) {
          autoAxisPoints = [shared.uvTo3D(n1.x, n1.y), shared.uvTo3D(n2.x, n2.y)];
          autoAxisUVPoints = [[n1.x, n1.y], [n2.x, n2.y]];
        }
      }

      const existingFeature = editingFeatureId
        ? features.find((f) => f.id === editingFeatureId)
        : null;
      const existingParams = existingFeature?.parameters ?? {};
      const op = operationOverride ?? existingParams.operation ?? 'ADD';

      const nextParams: RevolveParams = {
        ...existingParams,
        points: solidLoops,
        sketchNodes: { ...sketchNodes },
        sketchEdges: { ...sketchEdges },
        sketchConstraints: { ...sketchConstraints },
        angle: existingParams.angle ?? 360,
        axis_edge_id: existingParams.axis_edge_id ?? autoAxisEdgeId,
        axis_points: existingParams.axis_points ?? autoAxisPoints,
        axis_uv_points: existingParams.axis_uv_points ?? autoAxisUVPoints,
        x: existingParams.x ?? 0,
        y: existingParams.y ?? 0,
        z: existingParams.z ?? 0,
        operation: op,
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
          type: 'REVOLVE',
          name: `${op === 'CUT' ? 'Revolve-Cut' : 'Revolve'} ${features.length + 1}`,
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
      setDanglingNodes, shared.uvTo3D, shared.resetSketchSession, shared.handleRebuild,
    ]
  );

  return { handleRevolveFromSketch };
};
