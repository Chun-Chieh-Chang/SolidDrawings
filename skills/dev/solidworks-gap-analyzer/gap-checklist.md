# SOLIDWORKS Compatibility Gap Database & Checklist

This document tracks implementation status, file paths, and alignment strategies for UI/UX compatibility between 3D-Builder and standard SOLIDWORKS conventions.

---

## 1. Keyboard Shortcuts (快速鍵)

| SolidWorks Feature | Key / Interaction | Current Status | Relevant Files | Priority | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Shortcut Box** | `S` key | ✅ Implemented | [Viewport.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/renderer/Viewport.tsx) | High | Opens shortcut toolbar at current cursor. Currently only closes on Esc but listener doesn't open it. |
| **OK / Cancel Corner** | `D` key | ✅ Implemented | [Viewport.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/renderer/Viewport.tsx) | Medium | Moves confirmation corner closer to the cursor location. |
| **Exit Command** | `Esc` key | ✅ Implemented | [Viewport.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/renderer/Viewport.tsx) | Critical | Stops active line chain, deselects tools, and exits active dialogs. |
| **Normal To Plane** | `Ctrl + 8` | ✅ Implemented | [Viewport.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/renderer/Viewport.tsx) | High | Automatically rotates camera to look directly normal to active plane/face. |
| **Isometric View** | `Ctrl + 7` | ✅ Implemented | [Viewport.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/renderer/Viewport.tsx) | Medium | Smoothly transitions view to standard Isometric position. |
| **Zoom to Fit** | `F` key | ✅ Implemented | [Viewport.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/renderer/Viewport.tsx) | High | Fits entire model bounding box within current graphics area. |
| **Orientation Selector** | `Spacebar` | ✅ Implemented | [Viewport.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/renderer/Viewport.tsx) | Low | Pops up the view orientation cube / selector menu. |

---

## 2. Right-Click Context Menus (右鍵快捷選單)

| SolidWorks Feature | Scope | Current Status | Relevant Files | Priority | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Select Pointer** | Sketch Mode | ✅ Implemented | [ContextMenu.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/ContextMenu.tsx) | Critical | Right-click select options to exit drawing tool and return to pointer. |
| **End Chain** | Sketch Mode | ✅ Implemented | [ContextMenu.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/ContextMenu.tsx) | Critical | Terminates active Line/Spline segment chain but keeps Line tool active. |
| **Normal To Plane** | Sketch Mode | ✅ Implemented | [ContextMenu.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/ContextMenu.tsx) | Medium | Align camera normal to the active plane during sketch. |
| **Exit Sketch** | Sketch Mode | ✅ Implemented | [ContextMenu.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/ContextMenu.tsx) | High | Closes current sketch and commits nodes. |
| **Construction Geometry**| Sketch Mode | ✅ Implemented | [ContextMenu.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/ContextMenu.tsx) | High | Toggles selected lines between solid modeling lines and dashed construction lines. |
| **Edit Sketch / Feature**| 3D Part Mode | ✅ Implemented | [ContextMenu.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/ContextMenu.tsx) | Critical | Allows right-clicking an item in tree/viewport to edit. |
| **Suppress / Delete** | 3D Part Mode | ✅ Implemented | [ContextMenu.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/ContextMenu.tsx) | High | Toggle suppression or delete selected features in FeatureManager. |
| **Appearances** | 3D Part Mode | ⚠️ Partial | [ContextMenu.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/ContextMenu.tsx) | Low | Right-click to edit colors or materials. Button exists but lacks popup page. |

---

## 3. Viewport Snapping & Cursor Indicators (草圖鎖點與指示)

| SolidWorks Feature | Mode | Current Status | Relevant Files | Priority | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cursor Badges** | Sketch Mode | ✅ Implemented | [DatumPlanes.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/renderer/DatumPlanes.tsx) | High | Shows cursor icon suffix representing active tool (Line, Trim, Dimension, etc.). |
| **Coincident Badge** | Sketch Mode | ✅ Implemented | [DatumPlanes.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/renderer/DatumPlanes.tsx) | High | Displays yellow point icon when snapped to a node or origin. |
| **Horizontal / Vertical** | Sketch Mode | ✅ Implemented | [DatumPlanes.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/renderer/DatumPlanes.tsx) | High | Displays yellow indicator icons for horizontal (`-`) and vertical (`\|`) constraints. |
| **Tangent Badge** | Sketch Mode | ❌ Missing | [DatumPlanes.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/renderer/DatumPlanes.tsx) | Medium | Snap indicator when a line is drawn tangent to a circle. |
| **Inference Lines** | Sketch Mode | ✅ Implemented | [DatumPlanes.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/renderer/DatumPlanes.tsx) | High | Displays orange dashed alignment lines tracking X/Y of other nodes. |

---

## 4. UI Elements & Configuration (介面佈局)

| SolidWorks Feature | UI Element | Current Status | Relevant Files | Priority | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Confirmation Corner** | Viewport Top-Right | ✅ Implemented | [Viewport.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/renderer/Viewport.tsx) | High | Transparent check/cross buttons at top-right of graphics view to finish/cancel sketch/feature editing. |
| **Design Tree** | Side Panel | ✅ Implemented | [FeatureManagerPanel.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/FeatureManagerPanel.tsx) | Critical | Displays history/tree hierarchy. Supports **Drag-and-Drop Feature Reordering** with visual handles for full modeling history control (SolidWorks Parity). |
| **PropertyManager** | Left Side panel | ✅ Implemented | [SketchPropertyManager.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/SketchPropertyManager.tsx) | High | Panel showing active parameters for Extrude/Revolve/Fillet. Now includes **Tabbed Interface (General/Leaders)** for advanced constraints. |

---

## 5. Feature Engine Capabilities (特徵能力)

| SolidWorks Feature | Capability | Current Status | Relevant Files | Priority | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Extrude End Conditions** | Up To Next / Surface | ✅ Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py) | High | Ray-casting logic to extrude up to the nearest solid body or a specific target surface. |
| **Sketch Constraints** | Arc Condition (Min/Max/Center) | ✅ Implemented | [ConstraintSolver.ts](file:///c:/Users/USER/Downloads/3D-Builder/src/utils/geometry/ConstraintSolver.ts) | High | Full SolidWorks parity for dimensioning to Arc/Circle edges. Supports Point-to-Circle and Line-to-Circle with 'Leaders' tab UI for Min/Max/Center selection. |
| **Feature Engine** | Loft with Guides | ✅ Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py) | Critical | Full support for multi-profile Loft with **Guide Curves**, **Thin Features**, **Lofted Cut** operation, and **Start/End Constraints** (Normal to Profile). Includes PropertyManager controls and Ribbon command. |
| **Feature Engine** | Fill Pattern | ✅ Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py) | High | Ability to fill a closed sketch boundary with a feature. Supports Square, Perforation, and Hexagonal layouts with margin control. |
| **Feature Engine** | Surface Cut | ✅ Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py) | High | Ability to cut solid bodies using a Surface Feature as a tool. Supports half-space intersection and flip direction control. |
| **Feature Engine** | Circular Pattern | ✅ Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py) | High | Full support for Circular Pattern with **Equal Spacing** and **Instances to Skip**. Supports axis resolution from cylindrical faces or circular edges. |
| **Feature Engine** | 2D Linear Pattern | ✅ Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py) | High | Support for Direction 2 in Linear Pattern. Allows creating grids/meshes. Includes UI rollout for Dir 2. |
| **Feature Engine** | Unit Intelligence | ✅ Implemented | [EquationEngine.ts](file:///c:/Users/USER/Downloads/3D-Builder/src/utils/EquationEngine.ts) | Medium | Automatic conversion of unit suffixes (mm, in, inch, cm, m) in all numeric inputs. Supports mixed-unit expressions (e.g., '1in + 5mm'). |
| **Thin Feature** | Extrude / Revolve | ✅ Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py) | High | Ability to create hollow tubes or thin-walled solids from sketch profiles. Supports One-Direction and Mid-Plane thickness. |
| **Feature Engine** | Revolved Cut | ✅ Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py) | High | Explicit support for Revolved Cut via 'CUT' operation in Revolve feature. Includes dedicated Ribbon button and PropertyManager UI. |
| **Feature Engine** | Thin Feature Sweep | ✅ Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py) + [PartFeaturePropertyManager.tsx](file:///c:/Users/USER/Downloads/3D-Builder/src/ui/PartFeaturePropertyManager.tsx) | High | Thin-walled sweep (ONE_DIRECTION / MID_PLANE) with thickness parameter. Uses BRepOffsetAPI_MakeOffsetShape for inner/outer offset boolean difference. |
| **Ref Geometry** | Reference Point | ✅ Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py) | Medium | Supports creating reference points via Face Center, Offset, and Intersection methods. |
| **Ref Geometry** | Reference Plane | ✅ Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py) | High | Supports creating reference planes via Offset from Plane, Three Points, and Angle (rotated around Edge/Axis) aligning with SolidWorks 2025 Online Help. |
| **Feature Engine** | Sweep (Guides/Circular/Thin/Cut/Twist) | ✅ Implemented | [geometry_service.py](file:///c:/Users/USER/Downloads/3D-Builder/backend/app/services/geometry_service.py) | Critical | Fully implements sweep features supporting path/guide curves, circular profile generation, thin wall hollows, boolean swept cuts, and **twist along path** (by Degrees or Turns). |

---

## 6. File Management & Auto-Recovery (檔案管理與自動復原)

| SolidWorks Feature | Capability / Key | Current Status | Relevant Files | Priority | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Save / Load** | Native JSON project `.3db.json` I/O | ✅ Implemented | [projectService.ts](file:///c:/Users/3kids/Downloads/3D-Builder/src/services/projectService.ts) | Critical | Local project storage and loading with versioning, schema validation, and file integrity check. |
| **Save/Open Shortcuts**| `Ctrl + S` / `Ctrl + O` / `Ctrl + N` / `Ctrl+Shift+S` | ✅ Implemented | [Viewport.tsx](file:///c:/Users/3kids/Downloads/3D-Builder/src/renderer/Viewport.tsx) | High | Standard keyboard shortcuts for Save, Open, New, and Save As. |
| **Auto-Save (自動儲存)**| Background periodic snapshot | ✅ Implemented | [useAutoSave.ts](file:///c:/Users/3kids/Downloads/3D-Builder/src/hooks/useAutoSave.ts) | Critical | Periodically auto-saves the active project state to local IndexedDB every 5 minutes if changes are detected. |
| **Auto-Recovery (自動復原)**| Recovery UI on abnormal close | ✅ Implemented | [recoveryService.ts](file:///c:/Users/3kids/Downloads/3D-Builder/src/services/recoveryService.ts) | High | Prompts the user with a list of recoverable sessions if the previous session was not cleanly closed. |
