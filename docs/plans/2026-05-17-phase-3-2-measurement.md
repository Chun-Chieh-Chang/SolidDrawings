# 2026-05-17 Phase 3.2: Measurement Tools Plan

## 1. Objective
Implement measurement tools for distance, angle, area, and volume calculations using OCCT.

## 2. Current State
- Phase 3.1 Topology Selection System: **COMPLETE**
- TopologySelector: Raycaster-based selection
- topology-mapping.ts: Basic OCCT mapping utilities

## 3. Implementation Tasks

### 3.1 Measurement Service
**File**: `src/kernel/MeasurementService.ts`

**Tasks**:
- Create measurement service wrapper for OCCT GProp and BRepGProp classes
- Implement distance calculation between two vertices
- Implement angle calculation between two edges
- Implement face area calculation
- Implement solid volume calculation

**OCCT Classes**:
- `GProp_GProps` - Properties of a geometric system
- `BRepGProp` - Static functions for computing mass properties
- `GProp_CentreMass` - Center of mass calculation

### 3.2 State Management
**File**: `src/store/useCadStore.ts`

**Tasks**:
- Add `measurementMode` state (DistanceMode, AngleMode, AreaMode, VolumeMode)
- Add `measurementPoints` array for storing selected points
- Add `measurementResults` object for storing calculation results

### 3.3 UI Components
**Files**: 
- `src/renderer/MeasurementOverlay.tsx`
- `src/ui/MeasurementPanel.tsx`

**Tasks**:
- Create measurement overlay for visual feedback
- Create measurement panel in PropertyManager
- Implement measurement mode toggle
- Display measurement results

### 3.4 Integration
**File**: `src/renderer/Viewport.tsx`

**Tasks**:
- Add measurement click handler
- Support multi-click for multi-point measurements
- Update selection state during measurement

## 4. Verification

### Manual Testing
1. **Distance Measurement**:
   - Select two vertices
   - Verify distance displays correctly
   - Test with known geometry (e.g., unit cube)

2. **Angle Measurement**:
   - Select two edges
   - Verify angle displays correctly
   - Test with perpendicular edges (90°)

3. **Area Measurement**:
   - Select a face
   - Verify area displays correctly
   - Test with known geometry (e.g., 10x10 square = 100)

4. **Volume Measurement**:
   - Select a solid
   - Verify volume displays correctly
   - Test with known geometry (e.g., 10x10x10 cube = 1000)

### TypeScript Compilation
- [ ] `npx tsc --noEmit` - Exit code 0

## 5. Success Criteria
- [ ] Distance measurement between two points works
- [ ] Angle measurement between two edges works
- [ ] Area calculation for faces works
- [ ] Volume calculation for solids works
- [ ] Measurement results display in PropertyManager
- [ ] Zero console errors

## 6. References
- [OCCT GProp Documentation](https://dev.opencascade.org/doc/overview/html)
- [BRepGProp Examples](https://github.com/pythonocc/pythonocc-core)
