export type SelectionFilterType =
  | 'NONE'
  | 'VERTEX'
  | 'EDGE'
  | 'FACE'
  | 'SKETCH_ENTITY'
  | 'FEATURE'
  | 'COMPONENT'
  | 'REFERENCE';

interface CadEntity {
  type?: string;
  geometryType?: string;
  featureType?: string;
  componentId?: string;
  isSketchEntity?: boolean;
  isReferenceGeometry?: boolean;
  [key: string]: unknown;
}

const ENTITY_TO_FILTER: Record<string, SelectionFilterType> = {
  VERTEX: 'VERTEX',
  NODE: 'VERTEX',
  NODE_3D: 'VERTEX',
  EDGE: 'EDGE',
  EDGES: 'EDGE',
  LINE: 'EDGE',
  ARC: 'EDGE',
  CIRCLE: 'EDGE',
  SPLINE: 'EDGE',
  FACE: 'FACE',
  FACES: 'FACE',
  SURFACE: 'FACE',
  SKETCH_ENTITY: 'SKETCH_ENTITY',
  SKETCH: 'SKETCH_ENTITY',
  SKETCHEDGE: 'SKETCH_ENTITY',
  SKETCHEDGE_3D: 'SKETCH_ENTITY',
  FEATURE: 'FEATURE',
  FEATUREBODY: 'FEATURE',
  BREP_BODY: 'FEATURE',
  COMPONENT: 'COMPONENT',
  COMPONENT_PART: 'COMPONENT',
  INSTANCED_PART: 'COMPONENT',
  REFERENCE: 'REFERENCE',
  REFERENCE_GEOMETRY: 'REFERENCE',
  REFERENCE_PLANE: 'REFERENCE',
  REFERENCE_AXIS: 'REFERENCE',
  REFERENCE_POINT: 'REFERENCE',
  REFERENCE_COORDINATE_SYSTEM: 'REFERENCE',
  COORDINATE_SYSTEM: 'REFERENCE',
};

function resolveEntityCategory(type: string | undefined, entity: CadEntity): SelectionFilterType | undefined {
  if (entity.isReferenceGeometry || type === 'PLANE' || type === 'AXIS' || type === 'REFERENCE_COORDINATE_SYSTEM') {
    return 'REFERENCE';
  }
  if (entity.isSketchEntity) {
    return 'SKETCH_ENTITY';
  }
  return ENTITY_TO_FILTER[type || ''] || undefined;
}

export function applyFilter(
  entity: CadEntity,
  filter: SelectionFilterType
): boolean {
  if (filter === 'NONE') return true;

  const entityType = resolveEntityCategory(entity.type || '', entity);
  if (!entityType) return true;

  return entityType === filter;
}

export function getEntityCategoryName(filter: SelectionFilterType): string {
  const names: Record<SelectionFilterType, string> = {
    NONE: 'All',
    VERTEX: 'Vertex',
    EDGE: 'Edge',
    FACE: 'Face',
    SKETCH_ENTITY: 'Sketch Entities',
    FEATURE: 'Feature',
    COMPONENT: 'Components',
    REFERENCE: 'Reference Geometry',
  };
  return names[filter];
}

export function getBlockedReason(
  entity: CadEntity,
  filter: SelectionFilterType
): string | null {
  if (filter === 'NONE') return null;

  const entityType = resolveEntityCategory(entity.type || '', entity);
  if (!entityType) return null;

  const entityNameMap: Record<SelectionFilterType, string> = {
    VERTEX: 'Vertex',
    EDGE: 'Edge',
    FACE: 'Face',
    SKETCH_ENTITY: 'Sketch Entities',
    FEATURE: 'Feature',
    COMPONENT: 'Components',
    REFERENCE: 'Reference Geometry',
    NONE: 'All',
  };
  const entityLabel = entityNameMap[entityType] || entityType;

  const filterNameMap: Record<SelectionFilterType, string> = {
    NONE: 'All Entities',
    VERTEX: 'Vertex',
    EDGE: 'Edge',
    FACE: 'Face',
    SKETCH_ENTITY: 'Sketch Entities',
    FEATURE: 'Feature',
    COMPONENT: 'Components',
    REFERENCE: 'Reference Geometry',
  };
  const filterLabel = filterNameMap[filter] || filter;

  return `This selected type does not match ${filterLabel} filter (${entityLabel})`;
}
