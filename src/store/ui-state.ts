import type { CadToastItem, CadToastType, CADContextMenu, CADShortcutBox, RibbonLayout, MateEntity, ExplodedViewState, MotionStudyState, MotionDriver, SectionViewState, DrawingSheetData, DrawingSheetViewData, CADConfiguration, CADComponent, CADMate, CADFeature, SketchNode, SketchConstraint } from './types';
import type { SelectionFilterType } from '@/utils/selection-filters';
import { DEFAULT_RIBBON_LAYOUT } from './types';

export type UiSlice = {
  contextMenu: CADContextMenu | null;
  setContextMenu: (menu: CADContextMenu | null) => void;
  shortcutBox: CADShortcutBox | null;
  setShortcutBox: (box: CADShortcutBox | null) => void;
  mousePos: [number, number, number];
  setMousePos: (pos: [number, number, number]) => void;
  hint: string;
  setHint: (hint: string) => void;
  danglingNodes: [number, number, number][];
  setDanglingNodes: (nodes: [number, number, number][]) => void;
  toasts: CadToastItem[];
  pushToast: (message: string, type?: CadToastType) => void;
  dismissToast: (id: string) => void;
  activePropertyManager: any;
  setActivePropertyManager: (mgr: any) => void;
  showExportModal: boolean;
  setShowExportModal: (show: boolean) => void;
  viewportDisplayMode: 'SHADED' | 'SHADED_EDGES' | 'WIREFRAME';
  setViewportDisplayMode: (mode: 'SHADED' | 'SHADED_EDGES' | 'WIREFRAME') => void;
  cameraNormalTrigger: number;
  cameraNormalFlip: boolean;
  cameraNormalLastPlane: string | null;
  triggerCameraNormal: () => void;
  controls: any;
  setControls: (controls: any) => void;
  isCameraAnimating: boolean;
  setIsCameraAnimating: (active: boolean) => void;
  partMaterial: string;
  setPartMaterial: (material: string) => void;
  environmentMap: string;
  setEnvironmentMap: (env: string) => void;
  ribbonLayout: RibbonLayout;
  setRibbonLayout: (layout: RibbonLayout) => void;
  resetRibbonLayout: () => void;
  showMaterialModal: boolean;
  setShowMaterialModal: (show: boolean) => void;
  targetMaterialEntity: { type: 'PART' | 'COMPONENT' | 'FEATURE'; id: string } | null;
  setTargetMaterialEntity: (entity: { type: 'PART' | 'COMPONENT' | 'FEATURE'; id: string } | null) => void;
};

export const createUiState = (set: any, get: any) => ({
  contextMenu: null as CADContextMenu | null,
  setContextMenu: (contextMenu: CADContextMenu | null) => set({ contextMenu }),
  shortcutBox: null as CADShortcutBox | null,
  setShortcutBox: (shortcutBox: CADShortcutBox | null) => set({ shortcutBox }),
  mousePos: [0, 0, 0] as [number, number, number],
  setMousePos: (mousePos: [number, number, number]) => set({ mousePos }),

  hint: 'Ready' as string,
  setHint: (hint: string) => set({ hint }),
  danglingNodes: [] as [number, number, number][],
  setDanglingNodes: (danglingNodes: [number, number, number][]) => set({ danglingNodes }),

  toasts: [] as CadToastItem[],
  pushToast: (message: string, type: CadToastType = 'error') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    set((state: any) => ({ toasts: [...state.toasts.slice(-4), { id, message, type }] }));
    setTimeout(() => {
      const current = get().toasts;
      if (current.some((t: CadToastItem) => t.id === id)) {
        set({ toasts: current.filter((t: CadToastItem) => t.id !== id) });
      }
    }, 7000);
  },
  dismissToast: (id: string) =>
    set((state: any) => ({ toasts: state.toasts.filter((t: CadToastItem) => t.id !== id) })),

  activePropertyManager: null as any,
  setActivePropertyManager: (activePropertyManager: any) => set({ activePropertyManager }),

  showExportModal: false,
  setShowExportModal: (showExportModal: boolean) => set({ showExportModal }),

  viewportDisplayMode: 'SHADED_EDGES' as 'SHADED' | 'SHADED_EDGES' | 'WIREFRAME',
  setViewportDisplayMode: (viewportDisplayMode: 'SHADED' | 'SHADED_EDGES' | 'WIREFRAME') => set({ viewportDisplayMode }),

  cameraNormalTrigger: 0,
  cameraNormalFlip: false,
  cameraNormalLastPlane: null as string | null,
  triggerCameraNormal: () =>
    set((state: any) => {
      const isSamePlane = state.cameraNormalLastPlane === state.activePlane;
      return {
        cameraNormalTrigger: state.cameraNormalTrigger + 1,
        cameraNormalLastPlane: state.activePlane,
        cameraNormalFlip: isSamePlane ? !state.cameraNormalFlip : false,
      };
    }),

  controls: null as any,
  setControls: (controls: any) => set({ controls }),
  isCameraAnimating: false,
  setIsCameraAnimating: (isCameraAnimating: boolean) => set({ isCameraAnimating }),

  partMaterial: 'Steel' as string,
  setPartMaterial: (partMaterial: string) => set({ partMaterial }),
  environmentMap: 'studio' as string,
  setEnvironmentMap: (environmentMap: string) => set({ environmentMap }),

  ribbonLayout: DEFAULT_RIBBON_LAYOUT as RibbonLayout,
  setRibbonLayout: (ribbonLayout: RibbonLayout) => set({ ribbonLayout }),
  resetRibbonLayout: () => set({ ribbonLayout: DEFAULT_RIBBON_LAYOUT }),

  showMaterialModal: false,
  setShowMaterialModal: (showMaterialModal: boolean) => set({ showMaterialModal }),
  targetMaterialEntity: null as { type: 'PART' | 'COMPONENT' | 'FEATURE'; id: string } | null,
  setTargetMaterialEntity: (targetMaterialEntity: { type: 'PART' | 'COMPONENT' | 'FEATURE'; id: string } | null) => set({ targetMaterialEntity }),
});
