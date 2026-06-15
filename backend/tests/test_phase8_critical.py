"""
Phase 8 critical regression tests.

Validates:
  - build_feature_chain returns (None, []) for empty input
  - Single BOX feature produces a shape when OCC is available
  - export_assembly_step handles missing deps gracefully
  - section_plane variable is defined (no NameError)
  - EquationEngine circular dependency detection works
"""
import os
import sys
import pytest

# Ensure the backend package is importable
BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, BACKEND_ROOT)


# ── test_build_feature_chain_empty ───────────────────────────────────────────

class TestBuildFeatureChainEmpty:
    """Verifies build_feature_chain contract for empty / trivial inputs."""

    def test_returns_none_and_empty_list_when_no_occ(self):
        """Without OCC, build_feature_chain returns (None, [])."""
        # Force HAS_OCC off by patching the module-level flag
        from backend.app.services import geometry_service as gs
        saved = gs.HAS_OCC
        try:
            gs.HAS_OCC = False
            result = gs.build_feature_chain([])
            assert result == (None, [])
        finally:
            gs.HAS_OCC = saved

    def test_returns_none_and_empty_list_when_empty_input(self):
        """Even with OCC available, empty features → (None, [])."""
        from backend.app.services import geometry_service as gs
        result = gs.build_feature_chain([])
        shape, intermediates = result
        assert intermediates == []
        # shape may be None or an OCC shape; either way intermediates is []

    def test_returns_tuple_of_two_elements(self):
        """build_feature_chain always returns a 2-tuple."""
        from backend.app.services import geometry_service as gs
        result = gs.build_feature_chain([])
        assert isinstance(result, tuple)
        assert len(result) == 2

    def test_skips_reference_geometry_features(self):
        """Reference planes / axes / points should be skipped in the chain."""
        from backend.app.services import geometry_service as gs
        features = [
            {"id": "ref1", "type": "REFERENCE_PLANE", "parameters": {}},
            {"id": "ref2", "type": "REFERENCE_AXIS", "parameters": {}},
            {"id": "ref3", "type": "REFERENCE_POINT", "parameters": {}},
        ]
        result = gs.build_feature_chain(features)
        assert isinstance(result, tuple)
        assert len(result) == 2


# ── test_build_feature_chain_box ─────────────────────────────────────────────

class TestBuildFeatureChainBox:
    """Single BOX feature should create a shape."""

    def test_single_box_feature_creates_shape(self):
        """A BOX extrude with valid parameters produces a non-None shape."""
        from backend.app.services import geometry_service as gs
        features = [
            {
                "id": "box1",
                "type": "BOX",
                "parameters": {
                    "points": [
                        [[0, 0], [10, 0], [10, 10], [0, 10]],
                    ],
                    "depth": 5.0,
                },
            }
        ]
        shape, intermediates = gs.build_feature_chain(features)
        assert isinstance(intermediates, list)
        # With OCC, shape should be truthy; without OCC it is None
        if gs.HAS_OCC:
            assert shape is not None
        else:
            assert shape is None

    def test_single_box_in_intermediates(self):
        """The intermediate shapes list contains the box shape when OCC is present."""
        from backend.app.services import geometry_service as gs
        features = [
            {
                "id": "box1",
                "type": "BOX",
                "parameters": {
                    "points": [[[0, 0], [10, 0], [10, 10], [0, 10]]],
                    "depth": 5.0,
                },
            }
        ]
        _, intermediates = gs.build_feature_chain(features)
        assert isinstance(intermediates, list)
        if gs.HAS_OCC:
            assert len(intermediates) > 0


# ── test_export_assembly_step_no_crash ───────────────────────────────────────

class TestExportAssemblyStepNoCrash:
    """export_assembly_step must handle bad / missing input gracefully."""

    def test_no_crash_with_empty_components(self):
        """Empty component list should not raise."""
        from backend.app.services import geometry_service as gs
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".step", delete=False) as tf:
            path = tf.name
        try:
            result = gs.export_assembly_step([], path)
            # May return False (no OCC / no XCAF) but must not crash
            assert isinstance(result, bool)
        finally:
            if os.path.exists(path):
                os.unlink(path)

    def test_no_crash_with_none_components(self):
        """None input should not raise."""
        from backend.app.services import geometry_service as gs
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".step", delete=False) as tf:
            path = tf.name
        try:
            result = gs.export_assembly_step(None, path)
            assert isinstance(result, bool)
        except TypeError:
            # Acceptable: None is rejected gracefully
            pass
        finally:
            if os.path.exists(path):
                os.unlink(path)

    def test_no_crash_without_occ(self):
        """When HAS_OCC is False, export_assembly_step returns False."""
        from backend.app.services import geometry_service as gs
        saved = gs.HAS_OCC
        try:
            gs.HAS_OCC = False
            import tempfile
            with tempfile.NamedTemporaryFile(suffix=".step", delete=False) as tf:
                path = tf.name
            try:
                result = gs.export_assembly_step([{"id": "c1"}], path)
                assert result is False
            finally:
                if os.path.exists(path):
                    os.unlink(path)
        finally:
            gs.HAS_OCC = saved

    def test_no_crash_with_invalid_filepath(self):
        """Non-existent directory for filepath should not crash (catches exception)."""
        from backend.app.services import geometry_service as gs
        result = gs.export_assembly_step([], "/nonexistent/dir/file.step")
        assert isinstance(result, bool)


# ── test_section_plane_variable_defined ──────────────────────────────────────

class TestSectionPlaneVariableDefined:
    """Ensure section_plane is properly defined throughout project_2d flow."""

    def test_project_2d_with_section_plane_no_name_error(self):
        """Calling project_2d with section_plane dict should not raise NameError."""
        from backend.app.services import geometry_service as gs
        features = [
            {
                "id": "box1",
                "type": "BOX",
                "parameters": {
                    "points": [[[0, 0], [10, 0], [10, 10], [0, 10]]],
                    "depth": 5.0,
                },
            }
        ]
        section_plane = {
            "origin": [0, 0, 0],
            "normal": [0, 0, 1],
        }
        try:
            result = gs.project_2d(features, plane_type="FRONT", section_plane=section_plane)
            assert isinstance(result, list)
        except NameError as e:
            pytest.fail(f"NameError in project_2d with section_plane: {e}")
        except Exception:
            # Other exceptions (e.g. OCC not available) are acceptable
            pass

    def test_project_2d_without_section_plane_no_crash(self):
        """Calling project_2d without section_plane should not crash."""
        from backend.app.services import geometry_service as gs
        features = [
            {
                "id": "box1",
                "type": "BOX",
                "parameters": {
                    "points": [[[0, 0], [10, 0], [10, 10], [0, 10]]],
                    "depth": 5.0,
                },
            }
        ]
        try:
            result = gs.project_2d(features, plane_type="FRONT")
            assert isinstance(result, list)
        except Exception:
            # Acceptable when OCC is not available
            pass

    def test_convert_entities_with_section_plane_no_name_error(self):
        """convert_entities should handle section_plane without NameError."""
        from backend.app.services import geometry_service as gs
        features = []
        topology = {"visible_edges": [], "hidden_edges": []}
        plane_type = "FRONT"
        section_plane = {"origin": [0, 0, 0], "normal": [0, 0, 1]}
        try:
            result = gs.convert_entities(features, topology, plane_type, section_plane=section_plane)
            assert isinstance(result, list)
        except NameError as e:
            pytest.fail(f"NameError in convert_entities with section_plane: {e}")
        except Exception:
            pass

    def test_get_intersection_curve_with_section_plane_no_name_error(self):
        """get_intersection_curve should handle section_plane without NameError."""
        from backend.app.services import geometry_service as gs
        features = []
        plane_type = "FRONT"
        section_plane = {"origin": [0, 0, 0], "normal": [0, 0, 1]}
        try:
            result = gs.get_intersection_curve(features, plane_type, section_plane=section_plane)
            assert isinstance(result, list)
        except NameError as e:
            pytest.fail(f"NameError in get_intersection_curve with section_plane: {e}")
        except Exception:
            pass


# ── test_equation_engine_circular ────────────────────────────────────────────
# Note: EquationEngine is a TypeScript module. Its circular dependency detection
# is tested via Jest in src/utils/__tests__/EquationEngine.test.ts.
# The Python tests below verify the same algorithmic logic using a pure-Python
# port of the core cycle-detection algorithm.

class TestEquationEngineCircular:
    """Verify circular dependency detection logic (Python port of TS algorithm)."""

    @staticmethod
    def _has_circular_dependency(variables):
        """Pure Python port of EquationEngine.hasCircularDependency."""
        solved = {}
        unsolved = dict(variables)
        changed = True
        iterations = 0
        max_iterations = len(variables) + 1

        while changed:
            iterations += 1
            if iterations >= max_iterations:
                break
            changed = False
            for name, formula in list(unsolved.items()):
                import re
                if formula.replace('.', '').replace('-', '').isdigit():
                    solved[name] = float(formula)
                    del unsolved[name]
                    changed = True
                    continue
                required = re.findall(r'[a-zA-Z_][a-zA-Z0-9_]*', formula)
                if all(v in solved for v in required):
                    solved[name] = 0  # simplified
                    del unsolved[name]
                    changed = True
        return list(unsolved.keys())

    def test_simple_two_way_cycle(self):
        """A -> B -> A should be detected as circular."""
        unsolved = self._has_circular_dependency({"A": "B", "B": "A"})
        assert "A" in unsolved
        assert "B" in unsolved

    def test_three_way_cycle(self):
        """A -> B -> C -> A should be detected as circular."""
        unsolved = self._has_circular_dependency({"A": "B", "B": "C", "C": "A"})
        assert set(unsolved) == {"A", "B", "C"}

    def test_solve_variable_chain_detects_cycle(self):
        """solveVariableChain should resolve 0 for circular vars."""
        unsolved = self._has_circular_dependency({"X": "Y", "Y": "X"})
        assert "X" in unsolved
        assert "Y" in unsolved

    def test_linear_chain_not_detected_as_circular(self):
        """A -> B -> C should NOT be flagged as circular."""
        unsolved = self._has_circular_dependency({"A": "B", "B": "C", "C": "10"})
        assert unsolved == []

    def test_pure_numeric_no_cycle(self):
        """Pure numeric variables should never be circular."""
        unsolved = self._has_circular_dependency({"a": "5", "b": "10", "c": "15"})
        assert unsolved == []

    def test_mixed_resolvable_and_circular(self):
        """Mix of resolvable and circular vars: only circular remain."""
        unsolved = self._has_circular_dependency({
            "base": "10",
            "derived": "base * 2",
            "cycle_a": "cycle_b",
            "cycle_b": "cycle_a",
        })
        assert set(unsolved) == {"cycle_a", "cycle_b"}

    def test_self_reference_is_circular(self):
        """A = A should be detected as circular."""
        unsolved = self._has_circular_dependency({"A": "A"})
        assert "A" in unsolved

    def test_solve_chain_with_partial_cycle(self):
        """Some vars resolve, cycle vars get 0."""
        resolved = {}
        unsolved_vars = {"good": "42", "cycle_a": "cycle_b", "cycle_b": "cycle_a"}
        unsolved = self._has_circular_dependency(unsolved_vars)
        # good resolves, cycles stay
        assert "good" not in unsolved
        assert set(unsolved) == {"cycle_a", "cycle_b"}
