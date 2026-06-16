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
    NONE: '全部',
    VERTEX: '頂點',
    EDGE: '邊線',
    FACE: '面',
    SKETCH_ENTITY: '草圖圖元',
    FEATURE: '特徵',
    COMPONENT: '零組件',
    REFERENCE: '參考幾何',
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
    VERTEX: '頂點',
    EDGE: '邊線',
    FACE: '面',
    SKETCH_ENTITY: '草圖圖元',
    FEATURE: '特徵',
    COMPONENT: '零組件',
    REFERENCE: '參考幾何',
    NONE: '全部',
  };
  const entityLabel = entityNameMap[entityType] || entityType;

  const filterNameMap: Record<SelectionFilterType, string> = {
    NONE: '全部圖元',
    VERTEX: '頂點',
    EDGE: '邊線',
    FACE: '面',
    SKETCH_ENTITY: '草圖圖元',
    FEATURE: '特徵',
    COMPONENT: '零組件',
    REFERENCE: '參考幾何',
  };
  const filterLabel = filterNameMap[filter] || filter;

  return `此選取類型不符合 ${filterLabel} 過濾器 (${entityLabel})`;
}
