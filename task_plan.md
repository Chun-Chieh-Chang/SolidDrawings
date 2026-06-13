# Task Plan: Sprint ASM-2 (Advanced Mechanical Joints & LCS)

## Goal
Achieve high-precision mechanical joint mapping by implementing Local Coordinate System (LCS) anchoring and specialized joint types (Prismatic, Cylindrical) in Rapier3D.

## Phases

### Phase 1: LCS Extraction & Anchor Logic
- [ ] Refine `AssemblyPhysicsService.ts` to calculate precise local anchors from `MateEntity` topology.
- [ ] Use `localNormal` to align the Z-axis of the physics joints for Revolute and Prismatic types.
- Status: `in_progress`

### Phase 2: Prismatic & Cylindrical Joints
- [ ] Implement mapping for COINCIDENT (Parallel Planes) + DISTANCE -> Prismatic (Slider).
- [ ] Implement mapping for CONCENTRIC (Cylindrical Surfaces) without translation lock -> Cylindrical Joint.
- [ ] Implement Joint Limits (Min/Max Distance/Angle).
- Status: `not_started`

### Phase 3: Integration with CAD Store
- [ ] Update `CADMate` interface if necessary to store more physical parameters.
- [ ] Ensure `syncAssembly` handles complex multi-mate scenarios on a single component.
- Status: `not_started`

### Phase 4: Validation
- [ ] Verify a slider-crank mechanism or a simple piston model.
- [ ] Update `PROJECT_ROADMAP.md` (re-adjusting from placeholder 100% to true functional 100%).
- Status: `not_started`
