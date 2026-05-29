import type { CADFeature } from '@/store/useCadStore';

export type TreeRelation = 'NONE' | 'PARENT' | 'CHILD';

export interface RelationNode {
  id: string;
  name: string;
  type: string;
}

export function getParentsAndChildren(targetFeature: CADFeature, allFeatures: CADFeature[]) {
  const parents: RelationNode[] = [];
  const children: RelationNode[] = [];
  const targetIdx = allFeatures.findIndex((f) => f.id === targetFeature.id);
  if (targetIdx === -1) return { parents, children };

  for (let i = 0; i < targetIdx; i++) {
    const f = allFeatures[i];
    if (targetFeature.type === 'EXTRUDE') {
      if (
        targetFeature.parameters.operation === 'CUT' &&
        f.type === 'EXTRUDE' &&
        f.parameters.operation === 'ADD'
      ) {
        parents.push({ id: f.id, name: f.name, type: f.type });
      }
    } else if (targetFeature.type === 'FILLET' || targetFeature.type === 'CHAMFER') {
      if (['EXTRUDE', 'BOX', 'CYLINDER', 'SPHERE', 'REVOLVE'].includes(f.type)) {
        parents.push({ id: f.id, name: f.name, type: f.type });
      }
    } else if (targetFeature.type === 'REVOLVE') {
      if (f.type === 'EXTRUDE' && f.parameters.operation === 'ADD') {
        parents.push({ id: f.id, name: f.name, type: f.type });
      }
    }
  }

  if (targetFeature.type === 'EXTRUDE' || targetFeature.type === 'REVOLVE') {
    const sketchNum = targetFeature.name.match(/\d+/)?.[0] || '1';
    parents.unshift({
      id: `${targetFeature.id}_sketch`,
      name: `草圖 ${sketchNum}`,
      type: 'SKETCH',
    });
  }

  for (let i = targetIdx + 1; i < allFeatures.length; i++) {
    const f = allFeatures[i];
    if (targetFeature.type === 'EXTRUDE' && targetFeature.parameters.operation === 'ADD') {
      if (['EXTRUDE', 'FILLET', 'CHAMFER', 'REVOLVE'].includes(f.type)) {
        children.push({ id: f.id, name: f.name, type: f.type });
      }
    } else if (targetFeature.type === 'EXTRUDE' && targetFeature.parameters.operation === 'CUT') {
      if (f.type === 'FILLET' || f.type === 'CHAMFER') {
        children.push({ id: f.id, name: f.name, type: f.type });
      }
    } else if (targetFeature.type === 'BOX' || targetFeature.type === 'CYLINDER' || targetFeature.type === 'SPHERE' || targetFeature.type === 'REVOLVE') {
      if (f.type === 'FILLET' || f.type === 'CHAMFER' || (f.type === 'EXTRUDE' && f.parameters.operation === 'CUT')) {
        children.push({ id: f.id, name: f.name, type: f.type });
      }
    }
  }

  return { parents, children };
}

/** SolidWorks-style parent/child highlight hints in the FeatureManager tree. */
export function getFeatureTreeRelation(
  features: CADFeature[],
  targetId: string,
  hoveredId: string | null,
): TreeRelation {
  if (!hoveredId || targetId === hoveredId) return 'NONE';

  if (hoveredId.startsWith('feat_') || hoveredId.startsWith('ID')) {
    const hoveredFeat = features.find((f) => f.id === hoveredId);
    if (!hoveredFeat) return 'NONE';

    const { parents, children } = getParentsAndChildren(hoveredFeat, features);
    if (parents.some(p => p.id === targetId)) return 'PARENT';
    if (children.some(c => c.id === targetId)) return 'CHILD';
    
    // Also check if hovered is a Sketch
    const hoveredPlane = hoveredFeat?.parameters?.plane;
    if (targetId === hoveredPlane || targetId === 'ORIGIN') return 'PARENT';
  }

  if (hoveredId === 'FRONT' || hoveredId === 'TOP' || hoveredId === 'RIGHT' || hoveredId === 'ORIGIN') {
    if (targetId.startsWith('feat_') || targetId.startsWith('ID')) {
      const targetFeat = features.find((f) => f.id === targetId);
      const targetPlane = targetFeat?.parameters?.plane;
      if (hoveredId === 'ORIGIN') return 'CHILD';
      if (targetPlane === hoveredId) return 'CHILD';
    }
  }

  return 'NONE';
}
