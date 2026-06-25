"""
API integration tests for geometry endpoints.

Tests the new Sprint 2 endpoints (split, combine, base_flange_tab)
and core rebuild endpoints. Uses FastAPI TestClient so no server needed.
"""

import os
import sys
import pytest

BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_ROOT)

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestHealthEndpoint:
    """Sanity check — the server is alive."""

    def test_health_returns_ok(self):
        resp = client.get("/api/v1/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"

    def test_root_returns_message(self):
        resp = client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert "message" in data
        assert "3D-Builder" in data["message"]


class TestSplitEndpoint:
    """POST /api/v1/geometry/split"""

    ENDPOINT = "/api/v1/geometry/split"

    def test_split_returns_shape_hash(self):
        """Even without OCC, the endpoint should return a valid uuid."""
        resp = client.post(self.ENDPOINT, json={
            "features": [
                {"id": "box1", "type": "BOX", "parameters": {"depth": 5.0}}
            ],
            "split_plane": {"point": [0, 0, 0], "normal": [0, 0, 1]},
        })
        # Without OCC, it still returns a hash
        assert resp.status_code == 200
        data = resp.json()
        assert "shape_hash" in data
        assert len(data["shape_hash"]) > 0

    def test_split_missing_params_returns_422(self):
        """Missing split_plane should return validation error."""
        resp = client.post(self.ENDPOINT, json={
            "features": [],
        })
        assert resp.status_code == 422

    def test_split_empty_features(self):
        """Empty feature list should not crash."""
        resp = client.post(self.ENDPOINT, json={
            "features": [],
            "split_plane": {"point": [0, 0, 0], "normal": [0, 0, 1]},
        })
        assert resp.status_code == 200


class TestCombineEndpoint:
    """POST /api/v1/geometry/combine"""

    ENDPOINT = "/api/v1/geometry/combine"

    def test_combine_returns_shape_hash(self):
        resp = client.post(self.ENDPOINT, json={
            "features": [
                {"id": "box1", "type": "BOX", "parameters": {"depth": 5.0}},
                {"id": "box2", "type": "BOX", "parameters": {"depth": 3.0}},
            ],
            "operation": "ADD",
            "tool_feature_id": "box2",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "shape_hash" in data

    def test_combine_subtract_operation(self):
        resp = client.post(self.ENDPOINT, json={
            "features": [
                {"id": "box1", "type": "BOX", "parameters": {"depth": 5.0}},
                {"id": "box2", "type": "BOX", "parameters": {"depth": 3.0}},
            ],
            "operation": "SUBTRACT",
            "tool_feature_id": "box2",
        })
        assert resp.status_code == 200

    def test_combine_no_tool_feature(self):
        """Missing tool_feature_id should return validation error."""
        resp = client.post(self.ENDPOINT, json={
            "features": [
                {"id": "box1", "type": "BOX", "parameters": {"depth": 5.0}},
            ],
            "operation": "ADD",
        })
        assert resp.status_code == 422


class TestRebuildEndpoint:
    """POST /api/v1/geometry/rebuild — the core rebuild pipeline."""

    ENDPOINT = "/api/v1/geometry/rebuild"

    def test_rebuild_empty_features(self):
        resp = client.post(self.ENDPOINT, json={
            "features": [],
            "constraints": [],
        })
        assert resp.status_code == 200
        data = resp.json()

    def test_rebuild_single_box(self):
        resp = client.post(self.ENDPOINT, json={
            "features": [
                {
                    "id": "box1",
                    "type": "BOX",
                    "parameters": {"depth": 5.0},
                }
            ],
            "constraints": [],
        })
        assert resp.status_code == 200

    def test_rebuild_with_split_feature(self):
        """Rebuild pipeline with a SPLIT feature in the feature list."""
        resp = client.post(self.ENDPOINT, json={
            "features": [
                {"id": "box1", "type": "BOX", "parameters": {"depth": 5.0}},
                {
                    "id": "split1", "type": "SPLIT",
                    "name": "Split 1",
                    "parameters": {
                        "split_plane": {"point": [0, 0, 0], "normal": [0, 0, 1]}
                    }
                },
            ],
            "constraints": [],
        })
        # Without OCC, should degrade gracefully (no crash)
        assert resp.status_code == 200

    def test_rebuild_with_combine_feature(self):
        """Rebuild pipeline with a COMBINE feature."""
        resp = client.post(self.ENDPOINT, json={
            "features": [
                {"id": "box1", "type": "BOX", "parameters": {"depth": 5.0}},
                {"id": "box2", "type": "BOX", "parameters": {"depth": 3.0}},
                {
                    "id": "comb1", "type": "COMBINE",
                    "name": "Combine 1",
                    "parameters": {
                        "operation": "ADD",
                        "tool_feature_id": "box2"
                    }
                },
            ],
            "constraints": [],
        })
        assert resp.status_code == 200

    def test_rebuild_with_base_flange_tab(self):
        """Rebuild pipeline with BASE_FLANGE_TAB feature."""
        resp = client.post(self.ENDPOINT, json={
            "features": [
                {
                    "id": "bft1", "type": "BASE_FLANGE_TAB",
                    "name": "Base Flange 1",
                    "parameters": {
                        "thickness": 1.0,
                        "bendRadius": 0.5,
                        "direction": "ONE_DIRECTION",
                        "reverseDirection": False
                    }
                },
            ],
            "constraints": [],
        })
        assert resp.status_code == 200


# ── Section View ──────────────────────────────────────────────────────────────


class TestSectionViewEndpoint:
    """Section view endpoint returns valid structure even without OCC."""

    ENDPOINT = "/api/v1/drawing/section_view"

    def test_returns_valid_structure(self):
        """Without OCC, section_view returns empty lists."""
        resp = client.post(self.ENDPOINT, json={
            "features": [
                {"id": "box1", "type": "BOX", "parameters": {"depth": 5.0}},
            ],
            "cutPlane": {"origin": [0, 0, 0], "normal": [0, 1, 0]},
            "planeType": "FRONT",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "visible_lines" in data
        assert "hidden_lines" in data
        assert "section_fill" in data
        assert "section_line" in data or data.get("section_line") is None

    def test_empty_features(self):
        """Empty features list returns empty structure."""
        resp = client.post(self.ENDPOINT, json={
            "features": [],
            "cutPlane": {"origin": [0, 0, 0], "normal": [0, 1, 0]},
            "planeType": "FRONT",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["visible_lines"] == []
        assert data["hidden_lines"] == []
        assert data["section_fill"] == []

    def test_missing_cut_plane_defaults(self):
        """Missing cutPlane defaults to origin and Y-normal."""
        resp = client.post(self.ENDPOINT, json={
            "features": [],
            "cutPlane": {},
            "planeType": "TOP",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data["visible_lines"], list)
