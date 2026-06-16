# 3D-Builder x SOLIDWORKS 2010 ??????????

> Benchmark: SOLIDWORKS 2010 Chinese Edition
> Date: 2026-06-14
> Goal: Align 3D-Builder UI/UX completely with SOLIDWORKS 2010

---

## Summary

This plan restructures 3D-Builder UI/UX to match SOLIDWORKS 2010 interaction norms across 6 phases covering Top Menu, CommandManager, PropertyManager, Mouse Interaction, Status Bar, and Task Pane, plus feature gap filling.

---

## Phase 1: Top Menu + Keyboard Shortcuts

Goal: Rebuild top menu to SW 2010 10-menu structure with full keyboard shortcut mapping.

### Files affected
- src/ui/TopMenu.tsx (8KB -> 20KB+)
- New: src/utils/keyboard-shortcuts.ts

### SW 2010 Menu Structure
- File: New, Open, Save, Save As, Recover, Close, Exit, Recent Files, Page Setup, Print, Print Preview
- Edit: Undo, Redo, Cut, Copy, Paste, Delete, Select All, Deselect All, Preferences, Keyboard Customization
- View: Display Settings, Heads-Up View Toolbar, Toolbars, Customize, Zoom to Fit, Section View, Panel controls
- Insert: Boss/Base, Cut, Reference Geometry, Features, Patterns, Surface, Sketch Block, Component
- Features: Edit Feature, Feature Definitions, Suppress, Disable, Expand, Collapse
- Modifiers: Ctrl, Alt, Ctrl+Alt
- Assembly: Component, Mate, Sub-assembly, Move/Rotate, Display State, Interference Detection, Mass Properties
- Tools: Measure, Mass Properties, Evaluate, Equations, Surface Check, Design Checker
- Window: Tile, Cascade, Close All, Arrange Icons, Snap to Grid, Grid Display, View Orientation
- Help: SOLIDWORKS Help, Help Resources, About SOLIDWORKS

### Keyboard Shortcuts
- Ctrl+N: New | Ctrl+O: Open | Ctrl+S: Save
- Ctrl+Z: Undo | Ctrl+Y: Redo
- Ctrl+C: Copy | Ctrl+V: Paste | Delete: Delete
- Ctrl+A: Select All | F2: Edit | F8: Toggle Angle
- F10: Isometric | Esc: Cancel | Space: Quick Save
- Tab: Cycle Selections

---

## Phase 2: CommandManager + Ribbon

Goal: Rebuild CommandManager to SW 2010 11-tab structure.

### File affected
- src/ui/RibbonBar/RibbonController.tsx (80KB)

### SW 2010 Tabs -> 3D-Builder
- Standard: New, Open, Save, Print, Undo, Redo
- Sketch: Line, Circle, Rectangle, Arc, Spline, Trim, Dimension, Pattern, Offset
- Features: Extrude, Revolve, Sweep, Loft, Fillet, Chamfer, Shell, Draft, Rib, Hole Wizard
- Surfaces: Extrude, Revolve, Sweep, Loft, Trim, Extend, Knit, Offset
- Sheet Metal: (Future phase)
- Weldments: (Future phase)
- Annotations: Smart Dimension, Note, BOM, Table, Center Mark
- DimXpert: (Future phase)
- Motion: Basic Motion, Motion Analysis, Component Contact, Plots
- Scheduling: (Future phase)
- SimulationXpress: (Future phase)

---

## Phase 3: PropertyManager Rebuild

Goal: Rebuild PropertyManager to SW 2010 interactive model.

### Files affected
- src/ui/PartFeaturePropertyManager.tsx (74KB)
- src/ui/SketchPropertyManager.tsx (51KB)
- src/ui/PropertyManager/PMHeader.tsx (1.6KB)
- src/ui/PropertyManager/Rollout.tsx (1.2KB)
- src/ui/PropertyManager/SelectionBox.tsx (2.8KB)

### SW 2010 PropertyManager Structure
- Left panel: Options + Buttons + Rollouts + SelectionBoxes
- Right: Real-time preview
- Callouts: Feature-specific quick options
- Bottom: OK/Cancel buttons

### Implementation
- Restructure PartFeaturePropertyManager to SW left-panel layout
- Add real-time preview (right viewport update)
- Add Callouts support
- Enhance Rollout component with collapse/expand
- Enhance SelectionBox component
- Rebuild validation system

---

## Phase 4: Mouse Interaction + S-Key

Goal: Implement SW 2010 mouse interaction system.

### Files affected
- src/ui/ContextMenu.tsx (9.8KB)
- src/renderer/Viewport.tsx (43KB)
- New: src/utils/mouse-gestures.ts
- New: src/utils/s-key.tsx

### S-Key Context Menu
- Create circular menu component (src/utils/s-key.tsx)
- Listen for S key press to show menu
- Context-aware menu items based on current mode
- Release S to execute command in hovered sector

### Mouse Gesture Recognition
- Create gesture recognizer (src/utils/mouse-gestures.ts)
- Detect drag direction in Graphics Area
- Trigger commands based on gesture direction

### Right-click Context Menu
- Restructure ContextMenu.tsx to SW 2010 style
- Context-aware menu items with separators and sub-menus
- Keyboard shortcut hints

### Multi-select Support
- Add Shift/Ctrl modifier support in useSelectionLogic.ts
- Shift+Click: Add to selection
- Ctrl+Click: Toggle selection

---

## Phase 5: Status Bar + Task Pane

Goal: Rebuild status bar to SW 2010 style and add right-side Task Pane.

### Files affected
- src/ui/StatusBar.tsx (4.5KB)
- New: src/ui/TaskPane/TaskPane.tsx
- New: src/ui/TaskPane/panels/

### Status Bar Rebuild
- SW 2010 layout: [bottom-left] Selection/Definition/Cursor/Scale | [bottom-right] Display/Unit
- Definition status color indicator: Green=Fully Defined, Blue=Under Defined, Red=Over Defined
- Cursor format: Part mode X/Y/Z, Sketch mode U/V

### Task Pane Addition
- Right-side Task Pane with tabs:
  - SolidWorks Resources: Learning, Customer Portal, Tech Support
  - Design Library: Part library, Feature library, Surface library
  - Standards: Drawing standards, Symbol standards
  - Annotation Wizard: Annotation templates, Symbol library
- Resizable by drag, minimizable/maximizable

---

## Phase 6: Feature Gap Filling

Goal: Fill missing core features from SW 2010.

### 6.1 Sheet Metal Module
- New: src/ui/SheetMetal/
- Flat Pattern development
- Bend Allowance / K-Factor calculation
- Forming Tools (blanks, embosses, retractors)
- Converting solid bodies to sheet metal

### 6.2 Tolerancing Module
- New: src/ui/Tolerancing/
- DimXpert auto-dimensioning
- TolAnalyst tolerance analysis

### 6.3 Weldments Module
- New: src/ui/Weldments/
- Structural Members (profiles/cut lists)
- Weldment Features (trim/extend/gussets/end caps/fillet welds)

---

## Test Plan

### Interaction Logic Tests
| Test Item | Method | Success Criteria |
|-----------|--------|-----------------|
| Top Menu completeness | Compare each menu against SW 2010 | All 10 menus and sub-items implemented |
| Keyboard shortcuts | Test each SW 2010 shortcut key | All shortcuts functional |
| S-Key | Press S key for circular menu | Menu appears and executes commands |
| PropertyManager | Create feature and observe PM | Layout/options/validation match SW 2010 |
| Mouse interaction | Test all mouse operations | All match SW 2010 behavior |
| Status bar | Observe status across modes | Display matches SW 2010 |

### Feature Completeness Tests
| Test Item | Method | Success Criteria |
|-----------|--------|-----------------|
| Sketch | Create various sketch entities and constraints | All sketch features work |
| Features | Create various features | All feature features work |
| Assembly | Create assembly with mates | All assembly features work |
| Drawing | Create drawing view | All drawing features work |
| Sheet Metal | Create sheet metal part | Sheet metal features complete |
| Tolerancing | Add tolerances | Tolerance features complete |
| Weldments | Create welded structure | Weldment features complete |

---

## Assumptions
1. UI framework: Existing React + TypeScript + Tailwind CSS stack
2. Graphics rendering: Existing Three.js + React Three Fiber
3. Physics engine: Existing Rapier3D
4. CAD kernel: Existing Python + OpenCASCADE backend
5. State management: Existing Zustand
6. Localization: Chinese UI prioritized, English in future phase
7. Performance: Large assemblies (>1000 components) need optimization

---

## Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| RibbonController.tsx is large (80KB) | Hard to maintain | Split into multiple sub-components in Phase 2 |
| PropertyManager rebuild is large effort | Schedule delay | Prioritize core features, phase advanced features |
| S-Key implementation complexity | Technical risk | Use existing circular menu library as base |
| Task Pane content is rich | Development time | Build basic framework first, fill content gradually |