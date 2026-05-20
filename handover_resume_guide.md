# 3D-Builder Handoff & Resume Guide

## Current State of Development (2026-05-19)
The project is currently implementing an industrial-grade **SolidWorks-like 3D Web CAD application**. The technology stack includes **Next.js, TailwindCSS, React Three Fiber (R3F), Zustand, and a FastAPI + PythonOCC backend**.

### Recent Major Achievements (v3.5.0-alpha)



1. **O-Snap Smart Sketch Snapping (?箸皜豢???撘?)**: 
   - Implemented a dynamic `onPointerMove` cursor with `SNAP_RADIUS`.
   - Advanced Object Snapping prioritization: Origin > Sketch EndPoints > 3D Feature Vertices > Grid.
   - Built a high-performance `useMemo` orthographic projection engine that maps all existing 3D vertices from `meshData` onto the active 2D sketching plane, matching SolidWorks' reference geometry snapping perfectly.
2. **History Rollback Bar & X-Ray Sketching (????? X-Ray 蝛輸?**:
   - When editing a historical sketch, the system dynamically slices the `features` array before sending it to the backend (`HeavyEngineClient.getInstance().rebuild`), causing all future solids to instantly disappear (SolidWorks Rollback).
   - Applied `depthTest={false}` to all sketch `<Line>` and marker components in `SketchPreview.tsx`, ensuring new sketch geometry perfectly overrides any existing obstructing 3D solids (X-Ray effect).
3. **Double-Click "Flip Normal To" (?蝧餉?甇????**:
   - "Normal To" camera transition was perfected by locking OrbitControls purely declaratively (`isCameraAnimating`).
   - Implemented `cameraNormalFlip` in `useCadStore`. Clicking "Normal To" on the same plane twice elegantly flips the camera 180 degrees (Front/Back) while adjusting the Up-Vector to preserve the Right-Hand Rule and prevent upside-down sketching.
4. **Phase 3.1: Topology Selection System - COMPLETE**:
   - Created `TopologySelector.ts` with Raycaster wrapper for face/edge/vertex selection.
   - Extended `useCadStore.ts` with `selectedTopology` state.
   - Updated `Viewport.tsx` with click handlers and selection highlighting.
   - Created `topology-mapping.ts` with OCCT mapping utilities.
5. **Phase 3.2: Measurement Tools - COMPLETE**:
   - Created `MeasurementService.ts` with distance, angle, area, and volume calculation methods.
   - Extended `useCadStore.ts` with `measurementMode`, `measurementPoints`, and `measurementResults` state.
   - Implemented measurement click handlers in `page.tsx` that respond to `selectedTopology` changes.
   - Measurement modes: DISTANCE (2 vertices), ANGLE (2 edges), AREA (1 face), VOLUME (1 solid).
   - Visual feedback: 3D dashed lines, floating HTML labels showing measurement values.
   - Created `SketchHUD.tsx` component for Heads-Up Display in sketch mode.
6. **Electron Desktop Application - COMPLETE**:
   - Created Electron main process (`electron/main.ts`) with window management
   - Created preload script (`electron/preload.ts`) for secure IPC communication
   - Created renderer integration (`electron/renderer.ts`) for file system API
   - Implemented file operations: open, save, read with native dialog
   - Configured Electron build settings for Windows/macOS/Linux
   - Created startup script (`START-ELECTRON.ps1`) for easy deployment
7. **Phase 3.3: Mass Properties - COMPLETE**:
   - Extended `MeasurementService.ts` with `calculateCenterOfGravity()` method
   - Implemented `calculateInertiaTensor()` with parallel axis theorem
   - Added `formatInertiaTensor()` for display formatting
   - Supports density configuration for accurate mass property calculations
   - TypeScript compilation passes with Exit Code 0
8. **Phase 3.4: UI Component Integration - COMPLETE**:
   - Integrated `MeasurementPanel.tsx` into the sidebar. It now displays real-time measurement results (Distance, Angle, Area, Volume) and Mass Properties.
   - Integrated `SketchHUD.tsx` into the main viewport, providing heads-up status and quick actions (Reset/Exit) during sketch sessions.
9. **Phase 2: Assembly Mates - COMPLETE**:
   - Implemented `CADComponent` and `CADMate` data structures in the store.
   - Created `AssemblyService.ts` for geometric constraint solving.
   - Built `MatePanel.tsx` for managing assembly constraints (Coincident, Parallel, Concentric, Distance, etc.).
   - Updated the renderer to support multi-component transform visualization.
10. **Electron Desktop Application Enhancements - COMPLETE**:
    - **Native File Associations**: Registered `.step`, `.iges`, `.stl`, and `.sldprt` with the OS. The app now handles opening these files via double-click.
    - **Global Shortcuts**: Implemented `Ctrl+S` (Save), `Ctrl+O` (Open), and `Ctrl+N` (New) across the application.
    - **System Notifications**: Integrated native OS notifications for feedback on file operations.
    - **App Icon**: Created a professional `icon.svg` and configured the build pipeline to support native formats.
    - **IPC Architecture**: Refactored the bridge to support bidirectional event-driven communication (Main to Renderer).

### Known Issues & Next Steps
- **Advanced Constraints Solver**: While sketch relations like "Horizontal" and "Equal" exist, they lack a true geometric degree-of-freedom (DOF) solver. The next milestone should be integrating an advanced 2D geometric constraint solver.
- **Measurement UI Panel**: The measurement results are calculated but not yet displayed in a dedicated EVALUATE tab UI. Need to create `MeasurementPanel.tsx` component to show measurement results in the PropertyManager.
- **Mass Properties**: **COMPLETE** - Implemented center of gravity and inertia tensor calculations in `MeasurementService.ts`.
- **Sketch HUD Integration**: `SketchHUD.tsx` component created but needs to be integrated into the main viewport in `page.tsx`.
- **Electron Desktop App**: Basic Electron configuration implemented. Next steps:
  - Create application icon (SVG ??ICO/ICNS/PNG)
  - Implement file association (.step, .stl, .iges)
  - Add auto-update support
  - Implement keyboard shortcuts (Ctrl+S, Ctrl+O, Ctrl+N)
  - Add system notifications

## How to Resume
1. **Server Boot**: Always start the backend first via `uvicorn app.main:app --host 0.0.0.0 --port 8400` in the `backend` folder.
2. **Frontend Boot**: Run `npm run dev` in the root folder.
3. **Electron Desktop**: Run `.\START-ELECTRON.ps1` to build and launch the desktop application.
4. **Code Quality**: Always run `npx tsc --noEmit` after modifying React components to ensure strict type safety.
5. **Agent Instructions**: Read `DEV_LOG.md` to understand the root causes of past issues (e.g. Gimbal Lock avoidance, React Reconciliation conflicts). Never guess; always apply standard CAPA diagnostics.

## Electron Desktop Application

### Quick Start
```powershell
# Run the startup script
.\START-ELECTRON.ps1
```

### Manual Start
```bash
# Install dependencies
cd electron
npm install

# Build application
cd ..
npm run electron:build

# Start Electron
npm run electron:start
```

### Build Distribution
```bash
# Build for current platform
npm run electron:dist

# Build for specific platform
npx electron-builder --win
npx electron-builder --mac
npx electron-builder --linux
```

### Features
- **Native File System Access**: Open, save, and read files with native dialogs
- **Cross-Platform**: Windows (NSIS), macOS (DMG), Linux (AppImage)
- **Secure**: Context isolation and sandboxed renderer process
- **Type-Safe**: Full TypeScript support for main and preload scripts



