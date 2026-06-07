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

  // Helper to check immediate dependency
  const isDirectChild = (parent: CADFeature, potentialChild: CADFeature): boolean => {
    const params = potentialChild.parameters || {};
    
    // 1. Explicit reference by ID (Mirror, Pattern, Sweep, Loft)
    if (params.target_feature_id === parent.id) return true;
    if (params.target_feature_ids?.includes(parent.id)) return true;
    if (params.profile_id === parent.id || params.path_id === parent.id) return true;
    if (params.profile_ids?.includes(parent.id)) return true;

    // 2. Topology-based reference (Fillet, Chamfer, Shell, Hole)
    // If a feature uses edges/faces from a parent body
    if (['FILLET', 'CHAMFER', 'SHELL', 'HOLE_WIZARD', 'DRAFT'].includes(potentialChild.type)) {
      // For now, we assume these depend on the solid body state produced by features before them.
      // A more robust TNS 3.0 check would look at specific topology IDs.
      // SolidWorks logic: If parent is a solid producer and child is a dress-up feature, it's likely a child.
      const parentIdx = allFeatures.findIndex(f => f.id === parent.id);
      const childIdx = allFeatures.findIndex(f => f.id === potentialChild.id);
      return parentIdx < childIdx && ['EXTRUDE', 'REVOLVE', 'BOX', 'CYLINDER', 'SPHERE', 'SWEEP', 'LOFT', 'MIRROR', 'PATTERN'].includes(parent.type);
    }

    return false;
  };

  // Recursive search for all descendants
  const findDescendants = (parentId: string) => {
    const parent = allFeatures.find(f => f.id === parentId);
    if (!parent) return;

    allFeatures.forEach(potentialChild => {
      if (isDirectChild(parent, potentialChild)) {
        if (!children.some(c => c.id === potentialChild.id)) {
          children.push({ id: potentialChild.id, name: potentialChild.name, type: potentialChild.type });
          findDescendants(potentialChild.id);
        }
      }
    });
  };

  // Recursive search for all ancestors
  const findAncestors = (childId: string) => {
    const child = allFeatures.find(f => f.id === childId);
    if (!child) return;

    allFeatures.forEach(potentialParent => {
      if (isDirectChild(potentialParent, child)) {
        if (!parents.some(p => p.id === potentialParent.id)) {
          parents.push({ id: potentialParent.id, name: potentialParent.name, type: potentialParent.type });
          findAncestors(potentialParent.id);
        }
      }
    });
  };

  findDescendants(targetFeature.id);
  findAncestors(targetFeature.id);

  // Parents (simplified for now: immediate sketch dependency)
  if (targetFeature.type === 'EXTRUDE' || targetFeature.type === 'REVOLVE') {
    const sketchNum = targetFeature.name.match(/\d+/)?.[0] || '1';
    parents.unshift({
      id: `${targetFeature.id}_sketch`,
      name: `草圖 ${sketchNum}`,
      type: 'SKETCH',
    });
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
