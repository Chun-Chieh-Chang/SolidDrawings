# Task Plan: Sprint ASM-1 (Rapier3D Integration)

## Goal
Integrate the Rapier3D physics engine to enable dynamic assembly simulation and mechanical linkage verification.

## Phases

### Phase 1: Environment & Dependency Setup
- [x] Audit `package.json` for Rapier3D availability (Found: Not installed).
- [ ] Install `@dimforge/rapier3d-compat`.
- Status: `in_progress`

### Phase 2: Assembly Physics Engine (Core)
- [ ] Implement `src/services/AssemblyPhysicsService.ts`.
- [ ] Initialize the Rapier World.
- [ ] Implement `convertComponentToRigidBody(component)` logic.
- Status: `not_started`

### Phase 3: CAD Mate to Physics Joint Mapping
- [ ] Implement mapping for core mates:
  - COINCIDENT (Point-to-Point) -> Ball Joint
  - CONCENTRIC -> Hinge Joint
  - PARALLEL/FIXED -> Fixed Joint
- Status: `not_started`

### Phase 4: Frontend Integration & Animate Mode
- [ ] Add "Enable Physics" toggle in the Assembly Ribbon.
- [ ] Implement a simulation loop that syncs Three.js meshes with Rapier rigid bodies.
- [ ] Implement mouse-drag interaction during simulation.
- Status: `not_started`

### Phase 5: Validation & Phase 4 Initiation
- [ ] Verify that a simple linkage (e.g., 2 bars with a concentric mate) can rotate in real-time.
- [ ] Update `gap-checklist.md`, `PROJECT_ROADMAP.md`, and `DEV_LOG.md`.
- Status: `not_started`
