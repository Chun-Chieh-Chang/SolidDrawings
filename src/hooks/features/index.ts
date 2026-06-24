'use client';

import { useCallback } from 'react';
import { useCadStore } from '../../store';
import type { CADFeature, CADReferencePlane } from '../../store';
import { v4 as uuidv4 } from 'uuid';
import { extractAllPaths } from '../../utils/geometry/GraphAdapter';
import { useExtrudeBuilders } from './extrude-builders';
import { useRevolveBuilders } from './revolve-builders';
import { useEntityBuilders } from './entity-builders';
import { useSweepLoftBuilders } from './sweep-loft-builders';
import { useSheetMetalBuilders } from './sheet-metal-builders';

// Re-export sub-modules for direct usage
export { useExtrudeBuilders } from './extrude-builders';
export { useRevolveBuilders } from './revolve-builders';
export { useEntityBuilders } from './entity-builders';
export { useSweepLoftBuilders } from './sweep-loft-builders';
export { useSheetMetalBuilders } from './sheet-metal-builders';

// Re-export param types
export type { ExtrudeParams } from './extrude-builders';
export type { RevolveParams } from './revolve-builders';
export type { ConvertEntitiesParams, OffsetEntitiesParams } from './entity-builders';
export type { SweepParams, LoftParams, HelicalSweepParams } from './sweep-loft-builders';
export type { EdgeFlangeParams } from './sheet-metal-builders';

export const useFeatureBuilders = (handleRebuild: () => void) => {
  const {
    features,
    editingFeatureId,
    sketchNodes,
    sketchEdges,
    sketchConstraints,
    activePlane,
    activeFaceOrigin,
    activeFaceNormal,
    activeFaceId,
    referencePlanes,
    setEditingFeatureId,
    setSketchNodes,
    setSketchEdges,
    setSketchConstraints,
    setSketchMode,
    setActivePlane,
    setActiveFaceOrigin,
    setActiveFaceNormal,
    setActiveFaceId,
    setSmartDimensionActive,
    setSelectedEntityIds,
    setDanglingNodes,
    updateFeatureParams,
    addFeature,
    setSelectedId,
    setRollbackIndex,
    pushToast,
  } = useCadStore();

  // ── Shared Utilities ───────────────────────────────────────────

  const uvTo3D = useCallback(
    (u: number, v: number): [number, number, number] => {
      if (!activePlane) return [0, 0, 0];
      if (activePlane === 'FRONT') return [u, v, 0];
      if (activePlane === 'TOP') return [u, 0, v];
      if (activePlane === 'RIGHT') return [0, u, v];

      const customPlane = referencePlanes.find((p: CADReferencePlane) => p.id === activePlane);
      if (customPlane) {
        const [ox, oy, oz] = customPlane.origin;
        const [xx, xy, xz] = customPlane.xDir;
        const [yx, yy, yz] = customPlane.yDir;
        return [
          ox + u * xx + v * yx,
          oy + u * xy + v * yy,
          oz + u * xz + v * yz,
        ];
      }

      if (activePlane === 'FACE' && activeFaceOrigin && activeFaceNormal) {
        const [nx, ny, nz] = activeFaceNormal;
        let ux = 0,
          uy = 1,
          uz = 0;
        if (Math.abs(ny) > 0.9) {
          ux = 0;
          uy = 0;
          uz = 1;
        }
        let xx = uy * nz - uz * ny;
        let xy = uz * nx - ux * nz;
        let xz = ux * ny - uy * nx;
        const xLen = Math.sqrt(xx * xx + xy * xy + xz * xz) || 1;
        xx /= xLen;
        xy /= xLen;
        xz /= xLen;
        const yx = ny * xz - nz * xy;
        const yy = nz * xx - nx * xz;
        const yz = nx * xy - ny * xx;
        return [
          activeFaceOrigin[0] + u * xx + v * yx,
          activeFaceOrigin[1] + u * xy + v * yy,
          activeFaceOrigin[2] + u * xz + v * yz,
        ];
      }
      return [0, 0, 0];
    },
    [activePlane, activeFaceOrigin, activeFaceNormal, referencePlanes]
  );

  const resetSketchSession = useCallback(() => {
    setSketchNodes({});
    setSketchEdges({});
    setSketchConstraints({});
    setSketchMode(false);
    setActivePlane(null);
    setEditingFeatureId(null);
    setSmartDimensionActive(false);
    setSelectedEntityIds([]);
    setActiveFaceOrigin(null);
    setActiveFaceNormal(null);
    setActiveFaceId(null);
    setDanglingNodes([]);
  }, [
    setSketchNodes,
    setSketchEdges,
    setSketchConstraints,
    setSketchMode,
    setActivePlane,
    setEditingFeatureId,
    setSelectedEntityIds,
    setActiveFaceOrigin,
    setActiveFaceNormal,
    setActiveFaceId,
    setSmartDimensionActive,
    setDanglingNodes,
  ]);

  const sketchFeatureTo3DPoints = useCallback(
    (sketchFeat: CADFeature): any[][] => {
      const points = sketchFeat.parameters.points as any[][] | undefined;
      if (!points || points.length === 0) return [];
      const plane = sketchFeat.parameters.plane as string;
      const faceOrigin = sketchFeat.parameters.faceOrigin as
        | [number, number, number]
        | undefined;
      const faceNormal = sketchFeat.parameters.faceNormal as
        | [number, number, number]
        | undefined;

      const result: any[][] = [];
      for (const loop of points) {
        const transformedLoop: any[] = [];
        for (const pt of loop) {
          if (!pt || pt.length < 2) continue;
          const [u, v] = [Number(pt[0]), Number(pt[1])];
          let x = 0,
            y = 0,
            z = 0;
          let pnx = 0,
            pny = 0,
            pnz = 1;

          if (plane === 'FRONT') {
            x = u;
            y = v;
            z = 0;
            pnx = 0;
            pny = 0;
            pnz = 1;
          } else if (plane === 'TOP') {
            x = u;
            y = 0;
            z = v;
            pnx = 0;
            pny = 1;
            pnz = 0;
          } else if (plane === 'RIGHT') {
            x = 0;
            y = u;
            z = v;
            pnx = 1;
            pny = 0;
            pnz = 0;
          } else if (plane === 'FACE' && faceOrigin && faceNormal) {
            const [nx, ny, nz] = faceNormal;
            pnx = nx;
            pny = ny;
            pnz = nz;

            let ux = 0,
              uy = 1,
              uz = 0;
            if (Math.abs(ny) > 0.9) {
              ux = 0;
              uy = 0;
              uz = 1;
            }
            let xx = uy * nz - uz * ny;
            let xy = uz * nx - ux * nz;
            let xz = ux * ny - uy * nx;
            const xLen = Math.sqrt(xx * xx + xy * xy + xz * xz) || 1;
            xx /= xLen;
            xy /= xLen;
            xz /= xLen;
            const yx = ny * xz - nz * xy;
            const yy = nz * xx - nx * xz;
            const yz = nx * xy - ny * xx;

            x = faceOrigin[0] + u * xx + v * yx;
            y = faceOrigin[1] + u * xy + v * yy;
            z = faceOrigin[2] + u * xz + v * yz;
          } else {
            const customPlane = referencePlanes.find((p: CADReferencePlane) => p.id === plane);
            if (customPlane) {
              const [ox, oy, oz] = customPlane.origin;
              const [nnx, nny, nnz] = customPlane.normal;
              const [cxx, cxy, cxz] = customPlane.xDir;
              const [cyx, cyy, cyz] = customPlane.yDir;
              pnx = nnx;
              pny = nny;
              pnz = nnz;
              x = ox + u * cxx + v * cyx;
              y = oy + u * cxy + v * cyy;
              z = oz + u * cxz + v * cyz;
            }
          }

          const labels = pt.slice(2);
          const metadataIdx = labels.findIndex(
            (l: any) => typeof l === 'object' && l !== null
          );
          let metadata = metadataIdx >= 0 ? labels[metadataIdx] : {};
          metadata = { ...metadata, planeNormal: [pnx, pny, pnz] };

          if (metadataIdx >= 0) {
            labels[metadataIdx] = metadata;
          } else if (labels.length > 0) {
            labels.push(metadata);
          } else {
            labels.push(undefined, metadata);
          }

          transformedLoop.push([x, y, z, ...labels]);
        }
        if (transformedLoop.length > 0) {
          result.push(transformedLoop);
        }
      }
      return result;
    },
    [referencePlanes]
  );

  // ── Feature Builder Sub-hooks ──────────────────────────────────

  const sharedForExtrudeRevolve = { resetSketchSession, handleRebuild, uvTo3D };
  const extrudeModule = useExtrudeBuilders(sharedForExtrudeRevolve);
  const revolveModule = useRevolveBuilders(sharedForExtrudeRevolve);
  const entityModule = useEntityBuilders();
  const sweepLoftModule = useSweepLoftBuilders({
    sketchFeatureTo3DPoints,
    handleRebuild,
  });
  const sheetMetalModule = useSheetMetalBuilders(handleRebuild);

  // ── Save Sketch Only ───────────────────────────────────────────

  const handleSaveSketchOnly = useCallback(() => {
    if (!activePlane) return;

    const pointsToExtrude = extractAllPaths(sketchNodes, sketchEdges);
    if (pointsToExtrude.length === 0) {
      pushToast('Invalid Sketch Profile: No paths found.', 'error');
      return;
    }

    const existingFeature = editingFeatureId
      ? features.find((f: CADFeature) => f.id === editingFeatureId)
      : null;
    const existingParams = existingFeature?.parameters ?? {};

    const nextParams = {
      ...existingParams,
      points: pointsToExtrude,
      sketchNodes: { ...sketchNodes },
      sketchEdges: { ...sketchEdges },
      sketchConstraints: { ...sketchConstraints },
      plane: activePlane,
      ...(activePlane === 'FACE'
        ? { faceOrigin: activeFaceOrigin, faceNormal: activeFaceNormal, faceId: activeFaceId }
        : {}),
    };

    if (editingFeatureId && existingFeature && existingFeature.type === 'SKETCH') {
      updateFeatureParams(editingFeatureId, nextParams);
    } else {
      addFeature({
        id: `feat_${uuidv4()}`,
        type: 'SKETCH',
        name: `Sketch ${features.filter((f: CADFeature) => f.type === 'SKETCH').length + 1}`,
        parameters: nextParams,
      });
    }

    resetSketchSession();
  }, [
    activePlane,
    sketchNodes,
    sketchEdges,
    editingFeatureId,
    features,
    sketchConstraints,
    activeFaceOrigin,
    activeFaceNormal,
    activeFaceId,
    updateFeatureParams,
    resetSketchSession,
    addFeature,
    pushToast,
  ]);

  return {
    resetSketchSession,
    handleSaveSketchOnly,
    handleExitAndExtrude: extrudeModule.handleExitAndExtrude,
    handleRevolveFromSketch: revolveModule.handleRevolveFromSketch,
    handleBuildSweepLoft: sweepLoftModule.handleBuildSweepLoft,
    sketchFeatureTo3DPoints,
    handleConvertEntities: entityModule.handleConvertEntities,
    handleOffsetEntities: entityModule.handleOffsetEntities,
    handleCreateEdgeFlange: sheetMetalModule.handleCreateEdgeFlange,
    handleCreateMiterFlange: sheetMetalModule.handleCreateMiterFlange,
    handleCreateHem: sheetMetalModule.handleCreateHem,
    handleCreateFlatPattern: sheetMetalModule.handleCreateFlatPattern,
  };
};
