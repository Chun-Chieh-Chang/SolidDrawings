import os

file_path = r"C:\Users\3kids\Downloads\3D-Builder\src\store\useCadStore.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add Mate and Component types
old_types = """export type CadMode = 'PART' | 'ASSEMBLY' | 'DRAWING';
export type MeasurementMode = 'NONE' | 'DISTANCE' | 'ANGLE' | 'AREA' | 'VOLUME';

export interface CADContextMenu {"""

new_types = """export type CadMode = 'PART' | 'ASSEMBLY' | 'DRAWING';
export type MeasurementMode = 'NONE' | 'DISTANCE' | 'ANGLE' | 'AREA' | 'VOLUME';
export type MateType = 'COINCIDENT' | 'PARALLEL' | 'CONCENTRIC' | 'DISTANCE' | 'PERPENDICULAR' | 'TANGENT';

export interface MateEntity {
  componentId: string;
  topologyId: string;
}

export interface CADMate {
  id: string;
  name: string;
  type: MateType;
  entity1: MateEntity;
  entity2: MateEntity;
  alignment: 'ALIGNED' | 'ANTI_ALIGNED';
  offset?: number;
}

export interface CADComponent {
  id: string;
  partId: string;
  instanceName: string;
  transform: {
    position: [number, number, number];
    rotation: [number, number, number];
  };
  visible: boolean;
}

export interface CADContextMenu {"""

content = content.replace(old_types, new_types)

# Extend CadState interface
old_state = """  // Measurement State
  measurementMode: MeasurementMode;
  setMeasurementMode: (mode: MeasurementMode) => void;
  measurementPoints: any[];
  setMeasurementPoints: (points: any[]) => void;
  measurementResults: MeasurementResult | null;
  setMeasurementResults: (results: MeasurementResult | null) => void;"""

new_state = """  // Measurement State
  measurementMode: MeasurementMode;
  setMeasurementMode: (mode: MeasurementMode) => void;
  measurementPoints: any[];
  setMeasurementPoints: (points: any[]) => void;
  measurementResults: MeasurementResult | null;
  setMeasurementResults: (results: MeasurementResult | null) => void;

  // Assembly & Mate State
  components: CADComponent[];
  setComponents: (components: CADComponent[]) => void;
  addComponent: (component: CADComponent) => void;
  mates: CADMate[];
  setMates: (mates: CADMate[]) => void;
  addMate: (mate: CADMate) => void;"""

content = content.replace(old_state, new_state)

# Implement the state in create
old_impl = """      measurementResults: null,
      setMeasurementResults: (measurementResults) => set({ measurementResults }),"""

new_impl = """      measurementResults: null,
      setMeasurementResults: (measurementResults) => set({ measurementResults }),

      components: [],
      setComponents: (components) => set({ components }),
      addComponent: (component) => set((state) => ({ components: [...state.components, component] })),
      mates: [],
      setMates: (mates) => set({ mates }),
      addMate: (mate) => set((state) => ({ mates: [...state.mates, mate] })),"""

content = content.replace(old_impl, new_impl)

# Update partialize to persist components and mates
old_partial = """        selectedId: state.selectedId,
        selectedTopology: state.selectedTopology,
        selectedEntityIds: state.selectedEntityIds,
      }), // Don't persist meshData"""

new_partial = """        selectedId: state.selectedId,
        selectedTopology: state.selectedTopology,
        selectedEntityIds: state.selectedEntityIds,
        components: state.components,
        mates: state.mates,
      }), // Don't persist meshData"""

content = content.replace(old_partial, new_partial)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("useCadStore.ts updated")
