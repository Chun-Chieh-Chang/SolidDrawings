import { v4 as uuidv4 } from 'uuid';
import type { CADComponent, CADMate, MateEntity, ExplodedViewState, MotionStudyState, MotionDriver, SectionViewState } from './types';
import type { SelectedTopology } from '../kernel/TopologySelector';

// ── Recursive tree helpers ──────────────────────────────────────────────
function findComponentDeep(list: CADComponent[], id: string): CADComponent | undefined {
  for (const c of list) {
    if (c.id === id) return c;
    if (c.children) {
      const found = findComponentDeep(c.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

function updateComponentDeep(list: CADComponent[], id: string, updater: (c: CADComponent) => CADComponent): CADComponent[] {
  return list.map(c => {
    if (c.id === id) return updater(c);
    if (c.children) return { ...c, children: updateComponentDeep(c.children, id, updater) };
    return c;
  });
}

function removeComponentDeep(list: CADComponent[], id: string): CADComponent[] {
  return list.filter(c => {
    if (c.id === id) return false;
    if (c.children) c.children = removeComponentDeep(c.children, id);
    return true;
  }).map(c => c.children ? { ...c, children: removeComponentDeep(c.children, id) } : c);
}

export type AssemblySlice = {
  components: CADComponent[];
  setComponents: (components: CADComponent[]) => void;
  addComponent: (component: CADComponent) => void;
  removeComponent: (id: string) => void;
  updateComponentTransform: (id: string, position: [number, number, number], rotation: [number, number, number]) => void;
  updateComponentColor: (id: string, color: string) => void;
  toggleComponentFixed: (id: string) => void;
  toggleLightweight: (id: string) => void;
  setAllLightweight: (light: boolean) => void;
  activeComponentId: string | null;
  setActiveComponentId: (id: string | null) => void;
  isLargeAssemblyMode: boolean;
  setLargeAssemblyMode: (active: boolean) => void;
  mates: CADMate[];
  setMates: (mates: CADMate[]) => void;
  addMate: (mate: CADMate) => void;
  removeMate: (id: string) => void;
  mateSelection: MateEntity[];
  setMateSelection: (selection: MateEntity[]) => void;
  addMateSelection: (entity: MateEntity) => void;
  clearMateSelection: () => void;
  meshData: any[];
  setMeshData: (data: any[]) => void;
  interferenceMeshes: any[];
  setInterferenceMeshes: (data: any[]) => void;
  interferenceResults: any[];
  setInterferenceResults: (results: any[]) => void;
  interferenceActive: boolean;
  setInterferenceActive: (active: boolean) => void;
  solverReport: { dof: number; residual: number; nodes: Record<string, any>; max_residual?: number; iterations?: number; converged?: boolean } | null;
  setSolverReport: (report: { dof: number; residual: number; nodes: Record<string, any> } | null) => void;
  assemblyPreviewComponents: CADComponent[] | null;
  setAssemblyPreviewComponents: (components: CADComponent[] | null) => void;
  massProperties: { volume: number; surface_area: number; center_of_mass: number[]; inertia_matrix: number[][]; } | null;
  setMassProperties: (props: { volume: number; surface_area: number; center_of_mass: number[]; inertia_matrix: number[][]; } | null) => void;
  computedRefGeometry: any[];
  setComputedRefGeometry: (refGeom: any[]) => void;
  explodedView: ExplodedViewState;
  setExplodedView: (view: Partial<ExplodedViewState>) => void;
  setExplosionFactor: (factor: number) => void;
  calculateAutoExplosion: () => void;
  setExplodedDirection: (componentId: string, direction: [number, number, number]) => void;
  saveExplodeStep: (name: string) => void;
  loadExplodeStep: (index: number) => void;
  deleteExplodeStep: (index: number) => void;
  motionStudy: MotionStudyState;
  setMotionStudy: (study: Partial<MotionStudyState>) => void;
  addMotionDriver: (driver: MotionDriver) => void;
  removeMotionDriver: (id: string) => void;
  sectionView: SectionViewState;
  setSectionView: (view: Partial<SectionViewState>) => void;
  // ── Smart Mates ────────────────────────────────────────────
  smartMateActive: boolean;
  setSmartMateActive: (active: boolean) => void;
  smartMateSource: SelectedTopology | null;
  setSmartMateSource: (src: SelectedTopology | null) => void;
  smartMateDragActive: boolean;
  setSmartMateDragActive: (active: boolean) => void;
  smartMateGhostPosition: [number, number, number] | null;
  setSmartMateGhostPosition: (pos: [number, number, number] | null) => void;
  smartMateHoverTarget: SelectedTopology | null;
  setSmartMateHoverTarget: (target: SelectedTopology | null) => void;
  // ── Sub-assembly CRUD ────────────────────────────────────────
  addSubAssembly: (parentId: string, name: string) => void;
  addToSubAssembly: (subAssemblyId: string, component: CADComponent) => void;
  removeFromSubAssembly: (subAssemblyId: string, componentId: string) => void;
  updateSubComponentTransform: (subAssemblyId: string, componentId: string, position: [number, number, number], rotation: [number, number, number]) => void;
};

export const createAssemblyState = (set: any, get: any) => ({
  components: [] as CADComponent[],
  setComponents: (components: CADComponent[]) => set({ components }),
  addComponent: (component: CADComponent) =>
    set((state: any) => ({ components: [...state.components, component] })),
  removeComponent: (id: string) =>
    set((state: any) => ({
      components: state.components.filter((c: CADComponent) => c.id !== id),
      mates: state.mates.filter((m: CADMate) => m.entity1.componentId !== id && m.entity2.componentId !== id),
    })),
  updateComponentTransform: (id: string, position: [number, number, number], rotation: [number, number, number]) => {
    get().saveSnapshot();
    set((state: any) => ({
      components: state.components.map((c: CADComponent) =>
        c.id === id ? { ...c, transform: { position, rotation } } : c
      ),
    }));
  },
  updateComponentColor: (id: string, color: string) => {
    get().saveSnapshot();
    set((state: any) => ({
      components: state.components.map((c: CADComponent) => (c.id === id ? { ...c, color } : c)),
    }));
  },
  toggleComponentFixed: (id: string) => {
    get().saveSnapshot();
    set((state: any) => ({
      components: state.components.map((c: CADComponent) => (c.id === id ? { ...c, isFixed: !c.isFixed } : c)),
    }));
  },
  toggleLightweight: (id: string) => {
    get().saveSnapshot();
    set((state: any) => ({
      components: state.components.map((c: CADComponent) => (c.id === id ? { ...c, isLightweight: !c.isLightweight } : c)),
    }));
  },
  setAllLightweight: (light: boolean) => {
    get().saveSnapshot();
    set((state: any) => ({
      components: state.components.map((c: CADComponent) => ({ ...c, isLightweight: light })),
    }));
  },

  activeComponentId: null as string | null,
  setActiveComponentId: (activeComponentId: string | null) => set({ activeComponentId }),

  isLargeAssemblyMode: false,
  setLargeAssemblyMode: (isLargeAssemblyMode: boolean) => set({ isLargeAssemblyMode }),

  mates: [] as CADMate[],
  setMates: (mates: CADMate[]) => set({ mates }),
  addMate: (mate: CADMate) => {
    get().saveSnapshot();
    set((state: any) => ({ mates: [...state.mates, mate] }));
  },
  removeMate: (id: string) => {
    get().saveSnapshot();
    set((state: any) => ({ mates: state.mates.filter((m: CADMate) => m.id !== id) }));
  },

  mateSelection: [] as MateEntity[],
  setMateSelection: (mateSelection: MateEntity[]) => set({ mateSelection }),
  addMateSelection: (entity: MateEntity) =>
    set((state: any) => ({ mateSelection: [...state.mateSelection, entity] })),
  clearMateSelection: () => set({ mateSelection: [] }),

  meshData: [] as any[],
  setMeshData: (meshData: any[]) => set({ meshData }),
  interferenceMeshes: [] as any[],
  setInterferenceMeshes: (interferenceMeshes: any[]) => set({ interferenceMeshes }),
  interferenceResults: [] as any[],
  setInterferenceResults: (interferenceResults: any[]) => set({ interferenceResults }),
  interferenceActive: false,
  setInterferenceActive: (interferenceActive: boolean) => set({ interferenceActive }),
  solverReport: null as { dof: number; residual: number; nodes: Record<string, any>; max_residual?: number; iterations?: number; converged?: boolean } | null,
  setSolverReport: (solverReport: { dof: number; residual: number; nodes: Record<string, any> } | null) => set({ solverReport }),
  assemblyPreviewComponents: null as CADComponent[] | null,
  setAssemblyPreviewComponents: (assemblyPreviewComponents: CADComponent[] | null) => set({ assemblyPreviewComponents }),
  massProperties: null as { volume: number; surface_area: number; center_of_mass: number[]; inertia_matrix: number[][]; } | null,
  setMassProperties: (massProperties: { volume: number; surface_area: number; center_of_mass: number[]; inertia_matrix: number[][]; } | null) => set({ massProperties }),
  computedRefGeometry: [] as any[],
  setComputedRefGeometry: (computedRefGeometry: any[]) => set({ computedRefGeometry }),

  sectionView: { isActive: false, plane: 'FRONT', offset: 0, flip: false } as SectionViewState,
  setSectionView: (view: Partial<SectionViewState>) =>
    set((state: any) => ({ sectionView: { ...state.sectionView, ...view } })),

  // ── Smart Mates ────────────────────────────────────────────
  smartMateActive: false,
  setSmartMateActive: (smartMateActive: boolean) => set({ smartMateActive }),
  smartMateSource: null as SelectedTopology | null,
  setSmartMateSource: (smartMateSource: SelectedTopology | null) => set({ smartMateSource }),
  smartMateDragActive: false,
  setSmartMateDragActive: (smartMateDragActive: boolean) => set({ smartMateDragActive }),
  smartMateGhostPosition: null as [number, number, number] | null,
  setSmartMateGhostPosition: (smartMateGhostPosition: [number, number, number] | null) => set({ smartMateGhostPosition }),
  smartMateHoverTarget: null as SelectedTopology | null,
  setSmartMateHoverTarget: (smartMateHoverTarget: SelectedTopology | null) => set({ smartMateHoverTarget }),

  // ── Sub-assembly CRUD ────────────────────────────────────────
  addSubAssembly: (parentId: string, name: string) => {
    get().saveSnapshot();
    const newSub: CADComponent = {
      id: uuidv4(),
      partId: '',
      instanceName: name,
      isSubAssembly: true,
      children: [],
      visible: true,
      transform: { position: [0, 0, 0], rotation: [0, 0, 0] },
    };
    set((state: any) => ({
      components: updateComponentDeep(state.components, parentId, (c) => ({
        ...c,
        children: [...(c.children || []), newSub],
      })),
    }));
  },
  addToSubAssembly: (subAssemblyId: string, component: CADComponent) => {
    get().saveSnapshot();
    set((state: any) => ({
      components: updateComponentDeep(state.components, subAssemblyId, (c) => ({
        ...c,
        children: [...(c.children || []), component],
      })),
    }));
  },
  removeFromSubAssembly: (subAssemblyId: string, componentId: string) => {
    get().saveSnapshot();
    set((state: any) => ({
      components: updateComponentDeep(state.components, subAssemblyId, (c) => ({
        ...c,
        children: (c.children || []).filter((child: CADComponent) => child.id !== componentId),
      })),
    }));
  },
  updateSubComponentTransform: (subAssemblyId: string, componentId: string, position: [number, number, number], rotation: [number, number, number]) => {
    get().saveSnapshot();
    set((state: any) => ({
      components: updateComponentDeep(state.components, subAssemblyId, (c) => ({
        ...c,
        children: (c.children || []).map((child: CADComponent) =>
          child.id === componentId ? { ...child, transform: { position, rotation } } : child
        ),
      })),
    }));
  },

  explodedView: { isActive: false, factor: 0, directions: {}, steps: [], currentStepIndex: -1 } as ExplodedViewState,
  setExplodedView: (view: Partial<ExplodedViewState>) =>
    set((state: any) => ({ explodedView: { ...state.explodedView, ...view } })),
  setExplosionFactor: (factor: number) =>
    set((state: any) => ({ explodedView: { ...state.explodedView, factor } })),
  calculateAutoExplosion: () => {
    const { components } = get();
    if (components.length === 0) return;
    let cx = 0, cy = 0, cz = 0;
    components.forEach((c: CADComponent) => {
      cx += c.transform.position[0];
      cy += c.transform.position[1];
      cz += c.transform.position[2];
    });
    cx /= components.length;
    cy /= components.length;
    cz /= components.length;
    const directions: Record<string, [number, number, number]> = {};
    components.forEach((c: CADComponent) => {
      const dx = c.transform.position[0] - cx;
      const dy = c.transform.position[1] - cy;
      const dz = c.transform.position[2] - cz;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (len > 1e-6) {
        directions[c.id] = [dx / len, dy / len, dz / len];
      } else {
        directions[c.id] = [1, 1, 1];
      }
    });
    set({ explodedView: { ...get().explodedView, directions } });
  },
  setExplodedDirection: (componentId: string, direction: [number, number, number]) =>
    set((state: any) => ({
      explodedView: { ...state.explodedView, directions: { ...state.explodedView.directions, [componentId]: direction } },
    })),
  saveExplodeStep: (name: string) =>
    set((state: any) => ({
      explodedView: {
        ...state.explodedView,
        steps: [...state.explodedView.steps, { name, factor: state.explodedView.factor, directions: { ...state.explodedView.directions } }],
        currentStepIndex: state.explodedView.steps.length,
      },
    })),
  loadExplodeStep: (index: number) =>
    set((state: any) => {
      const step = state.explodedView.steps[index];
      if (!step) return state;
      return { explodedView: { ...state.explodedView, factor: step.factor, directions: { ...step.directions }, currentStepIndex: index } };
    }),
  deleteExplodeStep: (index: number) =>
    set((state: any) => {
      const newSteps = state.explodedView.steps.filter((_: any, i: number) => i !== index);
      const newIndex = state.explodedView.currentStepIndex >= newSteps.length ? newSteps.length - 1 : state.explodedView.currentStepIndex;
      return {
        explodedView: {
          ...state.explodedView,
          steps: newSteps,
          currentStepIndex: newSteps.length > 0 ? (newIndex >= 0 ? newIndex : 0) : -1,
        },
      };
    }),

  motionStudy: { isActive: false, currentTime: 0, playbackSpeed: 1, drivers: [] } as MotionStudyState,
  setMotionStudy: (study: Partial<MotionStudyState>) =>
    set((state: any) => ({ motionStudy: { ...state.motionStudy, ...study } })),
  addMotionDriver: (driver: MotionDriver) =>
    set((state: any) => ({ motionStudy: { ...state.motionStudy, drivers: [...state.motionStudy.drivers, driver] } })),
  removeMotionDriver: (id: string) =>
    set((state: any) => ({ motionStudy: { ...state.motionStudy, drivers: state.motionStudy.drivers.filter((d: MotionDriver) => d.id !== id) } })),
});
