# SolidWorks Replicant CAD Continuation & Handover Guide (v2.3.0-alpha)

Last updated: 2026-05-17

This document is the handover anchor for the `3D-Builder` project. Read it first when resuming development so another account, model, or tool can continue without relying on hidden chat context.

## Project Goal

Build `3D-Builder` into a SolidWorks-like feature-based parametric CAD tool:

- **SolidWorks Desktop UX**: CommandManager ribbon (Features / Sketch tabs), FeatureManager design tree, PropertyManager, and cool gray desktop palette.
- **Interactive CAD Build Demo**: Playable Step-by-Step animated construction showing intermediate stages of drawing, dimensioning, B-Rep revolving, and physics analysis.
- **Topology Selection System**: Raycaster-based face, edge, and vertex selection mapping.
- **3D Floating Measurement & Mass Properties Tools**: Measures area and volume properties directly from selected topologies.
- **B-Rep Revolve & STEP Export**: Parametrically revolves custom profiles 360° around Y-axis, exporting standard STEP geometric models.

## Stack

- Frontend: Next.js `16.2.6`, React `19.2.4`, Zustand, React Three Fiber, Three.js.
- Main UI: `src/app/page.tsx`
- Renderer: `src/renderer/Viewport.tsx`, `src/renderer/DatumPlanes.tsx`, `src/renderer/SketchPreview.tsx`
- Store: `src/store/useCadStore.ts`
- Backend: FastAPI + PythonOCC, with geometry rebuild in `backend/app/services/geometry_service.py`
- Frontend dev URL observed in this session: `http://localhost:3000/`
- Backend docs when running: `http://localhost:8000/docs`

## Current Completed State

### v2.2.0 Prior State

- Enabled 3D Topology selection (Vertices, Edges, Faces).
- Implemented Revolve geometry reconstruction on the backend.
- Created high-fidelity Coke Bottle mockup demo loader.

### v2.3.0 Completed In This Session

Added a spectacular **Interactive Step-by-Step CAD Construction Tour** in the UI:

- **`startInteractiveConstructionDemo` State Machine**:
  - Automatically starts sketch mode on Front Plane.
  - Sequentially spawns points P1 ➔ P2 ➔ P3 ➔ P4 ➔ P5 ➔ P6 with 1.8s delay between them, showing the lines growing in real-time.
  - Activates Smart Dimension tool and shows the height driver.
  - Parametrically scales the height from 30.0 mm to 50.0 mm (recalculating coords and keeping loop closed).
  - Triggers B-Rep Revolve feature, sending the final profile to the backend for 3D extrusion.
  - Highlights top face and displays physical measurement results (Area & Volume).
- **Amber Glassmorphic HUD Banner**: Real-time visual messages walking the user step-by-step through the CAD engine pipeline.
- **`🎥 示範建構` Ribbon Button**: Prominent green button placed next to `旋轉-實體` in the Features ribbon.
- **Subagent validation**: Verified the complete animation tour, saving screenshots `tour_step1_front_plane.png` through `tour_step7_final_cup.png` to conversation records with zero console errors.

## Run Commands

Frontend:

```powershell
npm run dev
npm run build
npm run lint
```

Backend:

```powershell
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

## Continuation Rule

When remaining working capacity is near 10%, update this file and `DEV_LOG.md` before stopping. Include:
- What changed.
- What was verified.
- What failed or remains risky.
- Exact next steps.
