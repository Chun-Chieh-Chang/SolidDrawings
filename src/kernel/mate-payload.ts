import type { CADMate, CADComponent } from '@/store/useCadStore';

export interface MateSelectionEntity {
  id: string;
  type?: string;
  componentId?: string;
  coordinates?: number[];
  normal?: number[];
}

/** Maps UI mate selection / store mates to the backend assembly solver contract. */
export function mateToSolverPayload(
  mate: CADMate,
  selectionByTopologyId: Record<string, MateSelectionEntity>,
): Record<string, unknown> {
  const resolveEntity = (ent: CADMate['entity1']) => {
    const picked = selectionByTopologyId[ent.topologyId];
    const coords = ent.localOrigin ?? picked?.coordinates ?? [0, 0, 0];
    const normal = ent.localNormal ?? picked?.normal ?? [0, 0, 1];
    return {
      componentId: ent.componentId,
      topologyId: ent.topologyId,
      localOrigin: coords,
      localNormal: normal,
    };
  };

  const offset =
    mate.parameters?.offset ?? mate.offset ?? 0;

  return {
    type: mate.type,
    entity1: resolveEntity(mate.entity1),
    entity2: resolveEntity(mate.entity2),
    parameters: {
      offset,
      alignmentFlip: mate.parameters?.alignmentFlip ?? mate.alignment === 'ANTI_ALIGNED',
    },
  };
}

export function matesToSolverPayload(
  mates: CADMate[],
  mateSelection: MateSelectionEntity[],
): Record<string, unknown>[] {
  const byTopology: Record<string, MateSelectionEntity> = {};
  for (const ent of mateSelection) {
    byTopology[ent.id] = ent;
  }
  return mates.map((m) => mateToSolverPayload(m, byTopology));
}

export function componentsToSolverDict(components: CADComponent[]): Record<string, unknown> {
  const dict: Record<string, unknown> = {};
  for (const c of components) {
    dict[c.id] = {
      ...c,
      isFixed: c.isFixed ?? false,
    };
  }
  return dict;
}
