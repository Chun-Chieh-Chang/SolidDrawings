"""
Unit + API tests for the OpenSCAD integration (M1).

Covers:
    - find_openscad() resolution priority
    - compile_scad_to_stl() success / failure / timeout / missing binary
    - import_stl_file() and openscad_to_shape() round-trip (skip if no OpenSCAD/OCC)
    - API routes: /openscad/compile, /upload_stl, /openscad/import_preview
"""

import os
import sys
import subprocess

import pytest

BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_ROOT)

from app.services import openscad_service  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402

client = TestClient(app)

HAS_OCC = True
try:
    from OCC.Core.TopoDS import TopoDS_Shape  # noqa: F401
except ImportError:
    HAS_OCC = False

REAL_OPENSCAD = openscad_service.openscad_available()

requires_openscad = pytest.mark.skipif(
    not REAL_OPENSCAD, reason="OpenSCAD executable not installed"
)
requires_occ = pytest.mark.skipif(
    not HAS_OCC, reason="pythonocc-core not available"
)


# ---------------------------------------------------------------- find_openscad

class TestFindOpenScad:
    def test_env_var_wins(self, monkeypatch):
        """OPENSCAD_PATH env var takes priority over PATH/candidates."""
        monkeypatch.setenv("OPENSCAD_PATH", sys.executable)
        monkeypatch.setattr(openscad_service, "_OPENSCAD_CANDIDATES", [])
        monkeypatch.setattr(openscad_service.shutil, "which", lambda name: None)
        assert openscad_service.find_openscad() == sys.executable

    def test_env_var_ignored_when_missing(self, monkeypatch):
        """A non-existent OPENSCAD_PATH falls through to PATH lookup."""
        monkeypatch.setenv("OPENSCAD_PATH", r"C:\does_not_exist\openscad.exe")
        monkeypatch.setattr(openscad_service, "_OPENSCAD_CANDIDATES", [])
        monkeypatch.setattr(
            openscad_service.shutil, "which", lambda name: "/usr/bin/openscad"
        )
        assert openscad_service.find_openscad() == "/usr/bin/openscad"

    def test_returns_none_when_not_found(self, monkeypatch):
        """No env var, no PATH entry, no candidates -> None."""
        monkeypatch.delenv("OPENSCAD_PATH", raising=False)
        monkeypatch.setattr(openscad_service, "_OPENSCAD_CANDIDATES", [])
        monkeypatch.setattr(openscad_service.shutil, "which", lambda name: None)
        assert openscad_service.find_openscad() is None
        assert openscad_service.openscad_available() is False


# ------------------------------------------------------------ compile_scad_to_stl

class TestCompileScadToStl:
    def test_missing_binary_returns_error(self, monkeypatch):
        """No OpenSCAD binary -> descriptive error, never a crash."""
        monkeypatch.setattr(
            openscad_service, "find_openscad", lambda: None
        )
        result = openscad_service.compile_scad_to_stl("cube(10);", "out.stl")
        assert result["ok"] is False
        assert "OpenSCAD not found" in result["error"]

    def test_timeout_returns_error(self, monkeypatch):
        """subprocess timeout -> clean error message."""
        monkeypatch.setattr(
            openscad_service, "find_openscad", lambda: r"C:\fake\openscad.exe"
        )

        def fake_run(*args, **kwargs):
            raise subprocess.TimeoutExpired("openscad", 30)

        monkeypatch.setattr(openscad_service.subprocess, "run", fake_run)
        result = openscad_service.compile_scad_to_stl("cube(10);", "out.stl")
        assert result["ok"] is False
        assert "timed out" in result["error"]

    def test_exception_returns_error(self, monkeypatch):
        """Unexpected subprocess exception -> clean error message."""
        monkeypatch.setattr(
            openscad_service, "find_openscad", lambda: r"C:\fake\openscad.exe"
        )
        monkeypatch.setattr(
            openscad_service.subprocess, "run",
            lambda *a, **k: (_ for _ in ()).throw(OSError("boom")),
        )
        result = openscad_service.compile_scad_to_stl("cube(10);", "out.stl")
        assert result["ok"] is False
        assert "boom" in result["error"]

    @requires_openscad
    def test_compile_success_real_binary(self, tmp_path):
        """A real OpenSCAD compiles a cube to a non-empty STL."""
        out_stl = str(tmp_path / "cube.stl")
        result = openscad_service.compile_scad_to_stl(
            "cube([10, 10, 10]);", out_stl
        )
        assert result["ok"] is True
        assert os.path.exists(out_stl)
        assert os.path.getsize(out_stl) > 0

    @requires_openscad
    def test_compile_invalid_code_fails(self, tmp_path):
        """Invalid OpenSCAD source -> ok=False with diagnostics."""
        out_stl = str(tmp_path / "bad.stl")
        result = openscad_service.compile_scad_to_stl(
            "this is not valid scad !!!", out_stl
        )
        assert result["ok"] is False
        assert "compile failed" in result["error"]


# ---------------------------------------------------------------- import / shape

class TestImportStl:
    @requires_openscad
    @requires_occ
    def test_openscad_to_shape_round_trip(self):
        """Compile + import produces a non-null OCCT shape."""
        shape, err = openscad_service.openscad_to_shape(
            "cube([10, 10, 10]);"
        )
        assert err is None
        assert shape is not None
        assert not shape.IsNull()

    @requires_openscad
    @requires_occ
    def test_import_stl_file(self, tmp_path):
        """import_stl_file reads a compiled STL into a valid shape."""
        out_stl = str(tmp_path / "cube.stl")
        result = openscad_service.compile_scad_to_stl(
            "cube([10, 10, 10]);", out_stl
        )
        assert result["ok"] is True
        shape = openscad_service.import_stl_file(out_stl)
        assert shape is not None
        assert not shape.IsNull()

    @requires_occ
    def test_import_stl_missing_file(self):
        """Nonexistent STL path -> None (no crash)."""
        assert openscad_service.import_stl_file(
            r"C:\does_not_exist\model.stl"
        ) is None

    def test_openscad_to_shape_without_binary(self, monkeypatch):
        """No binary -> (None, error) tuple, no exception."""
        monkeypatch.setattr(
            openscad_service, "find_openscad", lambda: None
        )
        shape, err = openscad_service.openscad_to_shape("cube(10);")
        assert shape is None
        assert "OpenSCAD not found" in err


# ---------------------------------------------------------------------- API

class TestOpenScadApi:
    def test_compile_returns_503_without_binary(self, monkeypatch):
        """Missing binary -> 503 with install hint."""
        monkeypatch.setattr(
            openscad_service, "openscad_available", lambda: False
        )
        resp = client.post(
            "/api/v1/geometry/openscad/compile",
            json={"scad_code": "cube([10, 10, 10]);"},
        )
        assert resp.status_code == 503
        assert "OpenSCAD not found" in resp.json()["detail"]

    def test_compile_missing_scad_code_returns_422(self):
        """Missing required scad_code field -> validation error."""
        resp = client.post("/api/v1/geometry/openscad/compile", json={})
        assert resp.status_code == 422

    @requires_openscad
    @requires_occ
    def test_compile_success_returns_mesh(self):
        """Real compile -> 200 with filepath + mesh preview."""
        resp = client.post(
            "/api/v1/geometry/openscad/compile",
            json={"scad_code": "cube([10, 10, 10]);"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["ok"] is True
        assert os.path.exists(data["filepath"])
        assert "vertices" in data["mesh"]
        assert len(data["mesh"]["vertices"]) > 0

    def test_upload_stl_rejects_wrong_extension(self):
        """Non-.stl upload -> 400."""
        resp = client.post(
            "/api/v1/geometry/upload_stl",
            files={"file": ("model.step", b"dummy", "application/octet-stream")},
        )
        assert resp.status_code == 400

    def test_upload_stl_accepts_stl(self):
        """Valid .stl upload -> 200 with absolute filepath."""
        resp = client.post(
            "/api/v1/geometry/upload_stl",
            files={"file": ("model.stl", b"solid dummy", "application/octet-stream")},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "filepath" in data
        assert os.path.isabs(data["filepath"])

    def test_import_preview_missing_file_returns_404(self):
        """Nonexistent STL path -> 404."""
        resp = client.post(
            "/api/v1/geometry/openscad/import_preview",
            json={"filepath": r"C:\does_not_exist\model.stl"},
        )
        assert resp.status_code == 404

    @requires_openscad
    @requires_occ
    def test_import_preview_uploaded_stl(self, tmp_path):
        """Upload a real STL then preview it -> 200 with mesh."""
        # Compile a real cube STL to upload
        stl_path = str(tmp_path / "cube.stl")
        result = openscad_service.compile_scad_to_stl(
            "cube([10, 10, 10]);", stl_path
        )
        assert result["ok"] is True
        with open(stl_path, "rb") as f:
            stl_bytes = f.read()

        upload = client.post(
            "/api/v1/geometry/upload_stl",
            files={"file": ("cube.stl", stl_bytes, "application/octet-stream")},
        )
        assert upload.status_code == 200
        filepath = upload.json()["filepath"]

        resp = client.post(
            "/api/v1/geometry/openscad/import_preview",
            json={"filepath": filepath},
        )
        assert resp.status_code == 200
        assert resp.json()["ok"] is True
        assert "vertices" in resp.json()["mesh"]