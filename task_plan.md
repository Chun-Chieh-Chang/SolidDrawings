# Task Plan: Sprint STABLE-3 (UI/Kernel State Sync)

## Goal
Fix the "Interactive Deadlock" where UI wizards block robot modeling, and surface hidden kernel errors directly into the Robot HUD.

## Phases

### Phase 1: Suppress Manual Wizards
- [ ] Modify `src/ui/RibbonBar/RibbonController.tsx` to skip `setPendingFeatureCommand` and `setHint` if `robotStatus === 'WORKING'`.
- [ ] This prevents the "STEP 1: SELECT..." prompt from appearing when the robot is injecting a feature.
- Status: `not_started`

### Phase 2: Kernel Error Synchronization
- [ ] Update `RobotOperationService.tsx` to detect if the model rebuild returned errors.
- [ ] Display these errors in the `addAutomationLog` so the robot (and user) knows exactly why a step like "Draft" failed.
- Status: `not_started`

### Phase 3: Robot Script Intelligence
- [ ] Update `backend/tests/e2e_stress_test_sim.py` to stop using `el.click()` for features.
- [ ] Features should be added PURELY via telemetry to avoid creating empty "New Feature" placeholders in the UI.
- [ ] Keep `el.click()` only for Mode/Tab changes.
- Status: `not_started`

### Phase 4: Final Validation
- [ ] Re-run stress test and ensure:
  1. Tree has NO duplicates.
  2. Viewport rebuilds every step.
  3. No "STEP 1: SELECT..." blocks the robot.
- Status: `not_started`
