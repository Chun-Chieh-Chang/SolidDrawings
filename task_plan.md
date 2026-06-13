# Task Plan: Sprint ASM-3 (Drag to Animate & Interaction)

## Goal
Finalize the project by implementing real-time mouse interaction within the dynamic assembly simulation, enabling users to "play" with mechanisms to verify their motion.

## Phases

### Phase 1: LCS & Joint Mapping (Sprint ASM-2 Refinement)
- [x] Refine `AssemblyPhysicsService.ts` to calculate precise local anchors from `MateEntity` topology.
- [x] Implement Revolute, Spherical, and Prismatic (Slider) joints with axis alignment.
- Status: `complete`

### Phase 2: Drag to Animate Implementation (Sprint ASM-3)
- [ ] Implement `AssemblyMouseInteraction` system in the Viewport.
- [ ] Capture 3D cursor position during simulation and apply "spring-like" drag forces to the selected rigid body.
- [ ] Ensure smooth synchronization between Three.js mesh transforms and physics-calculated positions.
- Status: `in_progress`

### Phase 3: Final Project Audit & Baseline (畢業 🎓)
- [ ] Re-calculate final **SolidWorks Compatibility Score (SCS)**.
- [ ] Update `PROJECT_ROADMAP.md` to show absolute 100% completion across all modules.
- [ ] Finalize `DEV_LOG.md` and generate the terminal `handover_resume_guide.md`.
- Status: `not_started`

## Errors Encountered
*(No critical errors in ASM-2)*
