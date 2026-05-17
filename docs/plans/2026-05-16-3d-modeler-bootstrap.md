# 2026-05-16 3D Modeler Bootstrap Plan

## 1. Objective
Establish a modern, high-performance web-based 3D modeling environment using the SkillsBuilder framework.

## 2. Technical Stack (The "Industrial" Choice)
- **Engine**: [opencascade.js](https://github.com/donalffons/opencascade.js) (Wasm port of Open CASCADE).
- **Frontend**: Next.js 14+ (App Router, Server Components where applicable).
- **3D Visualization**: [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction) + [Three.js].
- **Drafting Engine**: SVG/Canvas for 2D Drawing projections.
- **Styling**: Vanilla CSS + [Glass Order Tokens].
- **State Management**: [Zustand] with support for Part/Assembly hierarchy.

## 3. MECE Directory Structure
```text
/src
  /kernel        # OCCT Wasm wrappers and geometry logic
  /renderer      # Three.js viewports, shaders, and controls
  /ui            # Glass-morphic components (Feature Tree, Property Manager)
  /store         # Centralized state for parametric model
  /utils         # CAD-specific math and file I/O (STEP, IGES)
```

## 4. Phase 1: The "Parametric Box" (MVP)
The goal is to prove the pipeline from UI -> Kernel -> Renderer.
1. [ ] Setup Next.js environment with Tailwind/Glass Order tokens.
2. [ ] Integrate `opencascade.js` and handle Wasm loading lifecycle.
3. [ ] Create a "Box" command that takes Width, Height, Depth.
4. [ ] Render the generated OCCT shape in a Three.js viewport.
5. [ ] Update the shape in real-time when sliders move.

## 5. Phase 2: Assembly & 2D Drawing (Roadmap)
- **Assembly**: 
  - Implementation of "Mates" (Coincident, Parallel, etc.) using the constraint solver.
  - Component Instance management (Shared geometries).
- **2D Drawing**:
  - Orthographic View projection logic.
  - Dimensioning (Smart Dimension) for 2D entities.
  - Title block and sheet management.

## 6. Success Criteria
- [ ] No "Vibe Coding": Every logic change must be documented in DEV_LOG.md.
- [ ] Zero Console Errors.
- [ ] Responsive UI (Mobile viewport supports 3D view).
- [ ] Successful generation of a B-Rep object from parameters.
