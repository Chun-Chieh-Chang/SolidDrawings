import os

file_path = r"C:\Users\3kids\Downloads\3D-Builder\src\store\useCadStore.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add mateSelection to CadState
old_state_part = """  addMate: (mate: CADMate) => void;"""
new_state_part = """  addMate: (mate: CADMate) => void;

  // Assembly Selection State
  mateSelection: any[];
  setMateSelection: (selection: any[]) => void;
  addMateSelection: (entity: any) => void;
  clearMateSelection: () => void;"""

if "mateSelection" not in content:
    content = content.replace(old_state_part, new_state_part)

# Add implementation
old_impl_part = """      addMate: (mate) => set((state) => ({ mates: [...state.mates, mate] })),"""
new_impl_part = """      addMate: (mate) => set((state) => ({ mates: [...state.mates, mate] })),

      mateSelection: [],
      setMateSelection: (mateSelection) => set({ mateSelection }),
      addMateSelection: (entity) => set((state) => ({ mateSelection: [...state.mateSelection, entity] })),
      clearMateSelection: () => set({ mateSelection: [] }),"""

if "mateSelection: []" not in content:
    content = content.replace(old_impl_part, new_impl_part)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("useCadStore.ts updated with mateSelection")
