# SOLIDWORKS Compatibility Gap Database & Checklist

This document tracks implementation status, file paths, and alignment strategies for UI/UX compatibility between 3D-Builder and standard SOLIDWORKS conventions.

---

## 1. Keyboard Shortcuts (快速鍵)

| SolidWorks Feature | Key / Interaction | Current Status | Relevant Files | Priority | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Shortcut Box** | `S` key |  Implemented | [Viewport.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/renderer/Viewport.tsx) | High | Opens shortcut toolbar at current cursor via `S` key. |
| **OK / Cancel Corner** | `D` key |  Implemented | [ConfirmationCorner.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/ConfirmationCorner.tsx) | Medium | Confirmation corner widget (check/cross). Moves to cursor via `D` key. |
| **Exit Command** | `Esc` key |  Implemented | [Viewport.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/renderer/Viewport.tsx) | Critical | Stops active line chain, deselects tools, and exits active dialogs. |
| **Delete Command** | `Del` / `BS` |  Implemented | [Viewport.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/renderer/Viewport.tsx) | Critical | Deletes selected entities or constraints via `Delete` or `Backspace`. |
| **Normal To Plane** | `Ctrl + 8` |  Implemented | [Viewport.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/renderer/Viewport.tsx) | High | Automatically rotates camera to look directly normal to active plane/face via `Ctrl+8`. |
| **Isometric View** | `Ctrl + 7` |  Implemented | [Viewport.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/renderer/Viewport.tsx) | Medium | Smoothly transitions view to standard Isometric position via `Ctrl+7`. |
| **Zoom to Fit** | `F` key |  Implemented | [Viewport.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/renderer/Viewport.tsx) | High | Fits entire model bounding box within current graphics area via `F` key. |
| **Orientation Selector** | `Spacebar` |  Implemented | [ViewOrientationSelector.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/ViewOrientationSelector.tsx) | Low | Spacebar triggers a floating panel for rapid view switching (Front, Top, Iso, etc.). |
| **Fully Define Sketch** | UI Button |  Implemented | [SketchPropertyManager.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/SketchPropertyManager.tsx) | High | Automatically adds dimensions to unconstrained entities to lock the sketch. |

---

## 2. Right-Click Context Menus (右鍵快捷選單)

| SolidWorks Feature | Scope | Current Status | Relevant Files | Priority | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Quick Relations** | Sketch Mode |  Implemented | [ContextMenu.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/ContextMenu.tsx) | Critical | Right-click selection to add Parallel, Perpendicular, Tangent, etc. |
| **Select Pointer** | Sketch Mode |  Implemented | [ContextMenu.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/ContextMenu.tsx) | Critical | Right-click select options to exit drawing tool and return to pointer. |
| **End Chain** | Sketch Mode |  Implemented | [ContextMenu.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/ContextMenu.tsx) | Critical | Terminates active Line/Spline segment chain but keeps Line tool active. |
| **Normal To Plane** | Sketch Mode |  Implemented | [ContextMenu.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/ContextMenu.tsx) | Medium | Align camera normal to the active plane during sketch. |
| **Exit Sketch** | Sketch Mode |  Implemented | [ContextMenu.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/ContextMenu.tsx) | High | Closes current sketch and commits nodes. |
| **Construction Geometry**| Sketch Mode |  Implemented | [ContextMenu.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/ContextMenu.tsx) | High | Toggles selected lines between solid modeling lines and dashed construction lines. |
| **Edit Sketch / Feature**| 3D Part Mode |  Implemented | [ContextMenu.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/ContextMenu.tsx) | Critical | Allows right-clicking an item in tree/viewport to edit. |
| **Suppress / Delete** | 3D Part Mode |  Implemented | [ContextMenu.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/ContextMenu.tsx) | High | Toggle suppression or delete selected features in FeatureManager. |
| **Appearances** | 3D Part Mode |  Implemented | [MaterialSelectorModal.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/Modals/MaterialSelectorModal.tsx) | Low | Right-click any feature or background to apply materials/colors from a preset library. |

---

## 3. Viewport Snapping & Cursor Indicators (草圖鎖點與指示)

| SolidWorks Feature | Mode | Current Status | Relevant Files | Priority | Description |
| :--- | :--- | : :--- | :--- | :--- | :--- |
| **Interactive Icons** | Sketch Mode |  Implemented | [SketchPreview.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/renderer/SketchPreview.tsx) | High | Constraint icons are clickable, hoverable, and deletable. Highlights linked entities on hover. |
| **Cursor Badges** | Sketch Mode |  Implemented | [DatumPlanes.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/renderer/DatumPlanes.tsx) | High | Shows cursor icon suffix representing active tool (Line, Trim, Dimension, etc.). |
| **Coincident Badge** | Sketch Mode |  Implemented | [DatumPlanes.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/renderer/DatumPlanes.tsx) | High | Displays yellow point icon when snapped to a node, origin, or edge (Point-on-Edge). |
| **Horizontal / Vertical** | Sketch Mode |  Implemented | [DatumPlanes.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/renderer/DatumPlanes.tsx) | High | Displays yellow indicator icons for horizontal (`-`) and vertical (`\|`) constraints. |
| **Midpoint Snap** | Sketch Mode |  Implemented | [DatumPlanes.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/renderer/DatumPlanes.tsx) | High | Snaps to segment midpoints and auto-adds `MIDPOINT` constraint. |
| **Tangent Badge** | Sketch Mode |  Implemented | [DatumPlanes.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/renderer/DatumPlanes.tsx) | Medium | Snap indicator when a line is drawn tangent to a circle. Auto-constraint added. |
| **Inference Lines** | Sketch Mode |  Implemented | [DatumPlanes.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/renderer/DatumPlanes.tsx) | High | Displays orange dashed alignment lines tracking X/Y of other nodes. |
| **Parallel & Perpendicular** | Sketch Solver |  Implemented | [ConstraintSolver.ts](file:///c:/Users/USER/Downloads/3D-Builder/src/utils/geometry/ConstraintSolver.ts) | High | Backend/Solver logic implemented for Parallel and Perpendicular constraints. |
| **Collinear** | Sketch Solver |  Implemented | [ConstraintSolver.ts](file:///c:/Users/USER/Downloads/3D-Builder/src/utils/geometry/ConstraintSolver.ts) | High | Backend/Solver logic implemented for Collinear constraint. UI icon "⬌" added. |
| **Equal** | Sketch Solver |  Implemented | [ConstraintSolver.ts](file:///c:/Users/USER/Downloads/3D-Builder/src/utils/geometry/ConstraintSolver.ts) | High | Supports Equal Length for lines and Equal Radius for circles/arcs. UI icon "=" added. |
| **Fix / Unfix** | Sketch Mode |  Implemented | [SketchPropertyManager.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/SketchPropertyManager.tsx) | Medium | Locked coordinates support via UI button and solver. |

---

## 4. UI Elements & Configuration (介面佈局)

| SolidWorks Feature | UI Element | Current Status | Relevant Files | Priority | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UI Customization** | CommandManager | ✅ Implemented | [RibbonController.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/RibbonBar/RibbonController.tsx) | Medium | Right-click to add/remove/reorder ribbon and shortcut buttons. |
| **Confirmation Corner** | Viewport Top-Right |  Implemented | [ConfirmationCorner.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/ConfirmationCorner.tsx) | High | Transparent check/cross buttons at top-right of graphics view. Supports `D` key to move to cursor. |
| **Design Tree** | Side Panel |  Implemented | [FeatureManagerPanel.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/FeatureManagerPanel.tsx) | Critical | Displays history/tree hierarchy. |
| **Feature Reordering** | Design Tree | ✅ Implemented | [FeatureManagerPanel.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/FeatureManagerPanel.tsx) | Critical | Drag & drop feature reordering strictly validated by chronological parent-child topological constraints. |
| **PropertyManager** | Left Side panel |  Implemented | [SketchPropertyManager.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/SketchPropertyManager.tsx) | High | Panel showing active parameters and **Existing Relations** for selection. |
| **Global Relations List**| Sketch Mode |  Implemented | [SketchPropertyManager.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/SketchPropertyManager.tsx) | High | List of all relations in the sketch when nothing is selected. |
| **Status Bar UV** | UI Footer |  Implemented | [StatusBar.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/StatusBar.tsx) | Low | Displays UV coordinates relative to sketch origin when in Sketch Mode. |

---

## 5. Modeling Features (建模特徵)

| SolidWorks Feature | Category | Current Status | Relevant Files | Priority | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Variable Size Fillet** | Features | ✅ Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py), [PartFeaturePropertyManager.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/PartFeaturePropertyManager.tsx) | Medium | Different radii at different points along an edge with smooth/straight transitions. |
| **Sweep (Guide Curves)** | Features | ✅ Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py), [PartFeaturePropertyManager.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/PartFeaturePropertyManager.tsx) | High | Support for one or more guide curves to control sweep shape. |
| **Circular Pattern (Axis)** | Features | ✅ Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py), [PartFeaturePropertyManager.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/PartFeaturePropertyManager.tsx) | High | Selection of rotation axis and equal spacing options for circular patterns. |
| **Hole Wizard Enhancements** | Features | ✅ Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py), [PartFeaturePropertyManager.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/PartFeaturePropertyManager.tsx) | High | Standardized hole sizes (M3, M4, M5), C-Bore/C-Sink parameters, and multi-point placement. |
| **Revolved Cut** | Features | ✅ Implemented | [RibbonController.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/RibbonBar/RibbonController.tsx), [useFeatureBuilders.ts](file:///c:/Users/USER/Downloads/3D-Builder/src/hooks/useFeatureBuilders.ts) | High | Symmetric material removal via revolution. |
| **Revolve (Mid Plane, Dir 2, Thin)** | Features | ✅ Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py), [PartFeaturePropertyManager.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/PartFeaturePropertyManager.tsx) | High | Symmetric rotation, bi-directional angles, and thin solid generation. |
| **Sketch Text** | Sketch Tools | ✅ Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py), [RibbonController.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/RibbonBar/RibbonController.tsx) | High | Ability to add text as sketch entities, including support for single-line (CNC) fonts. |
| **Advanced Chamfer Types** | Features | ✅ Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py), [PartFeaturePropertyManager.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/PartFeaturePropertyManager.tsx) | High | Support for Angle-Distance, Distance-Distance, and other chamfer types. |
| **Fillet Profiles (Conic & G2)** | Features | ✅ Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py), [PartFeaturePropertyManager.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/PartFeaturePropertyManager.tsx) | Medium | Selection of fillet cross-section profiles including Conic Rho and Curvature Continuous. |
| **Fillet (Setback & Options)** | Features | ✅ Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py), [PartFeaturePropertyManager.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/PartFeaturePropertyManager.tsx) | Medium | Advanced corner setback control and fillet overflow options. |
| **Fillet (Face Selection & Multi-Radius)** | Features | ✅ Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py), [PartFeaturePropertyManager.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/PartFeaturePropertyManager.tsx) | Medium-High | Support for selecting a face to fillet all its edges, per-item radius overrides, and advanced Face Fillet options (Hold Line, Constant Width). |
| **Extrude (Up To Surface & Offset)** | Features | ✅ Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py), [PartFeaturePropertyManager.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/PartFeaturePropertyManager.tsx) | High | Termination of extrusion at or offset from a selected face. |
| **Extrude (Up To Vertex)** | Features | ✅ Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py), [PartFeaturePropertyManager.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/PartFeaturePropertyManager.tsx) | High | Termination of extrusion at a plane passing through a selected vertex. |
| **Extrude (Up To Next)** | Features | ✅ Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py), [PartFeaturePropertyManager.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/PartFeaturePropertyManager.tsx) | High | Automatic termination of extrusion at the next encountered solid surface. |
| **Mirror Feature** | Features | ✅ Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py), [PartFeaturePropertyManager.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/PartFeaturePropertyManager.tsx) | High | Mirroring features or bodies across a plane or planar face. |
| **Selected Contours** | Features | ✅ Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py), [PartFeaturePropertyManager.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/PartFeaturePropertyManager.tsx) | Critical | Allows extruding specific regions or contours from a complex/intersecting sketch. |
| **Extrude (Mid Plane & Two Directions)** | Features | ✅ Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py), [PartFeaturePropertyManager.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/PartFeaturePropertyManager.tsx) | Critical | Support for symmetric extrusion (Mid Plane) and bidirectional depths (Direction 2). |
| **Smart Dimension** | Sketch Tools |  Implemented | [DatumPlanes.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/renderer/DatumPlanes.tsx) | Critical | Intelligent dimensioning supporting single edges, point-to-point, and line-to-line angles. |
| **Center Rectangle** | Sketch Tools |  Implemented | [RectangleTool.ts](file:///c:/Users/USER/Downloads/3D-Builder/src/utils/sketch/ToolHandlers/RectangleTool.ts) | High | Creates rectangle with construction diagonals and automatic midpoint center constraints. |
| **Shell** | Features |  Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py) | High | Hallows out a solid part with uniform wall thickness. |
| **Dome** | Features |  Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py) | Medium | Adds a rounded cap to a planar face using loft-to-vertex logic. UI button added. |
| **Sweep & Loft** | Features |  Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py) | High | Advanced geometry construction. Supports Loft Start/End constraints (Normal to Profile). |
| **Loft Advanced Boundary**| Features |  Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py) | Medium | Supports `Normal to Profile`, `Direction Vector`, `Draft Angle`, and `Curvature to Face (G2)`. |
| **Thin Loft** | Features |  Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py) | Low | Integrates hollow shelling directly into the Loft feature. |
