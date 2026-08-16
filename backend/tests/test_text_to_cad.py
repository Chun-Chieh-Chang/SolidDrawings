"""
Unit + API tests for the text-to-CAD service (M2).

Covers:
    - build_prompt() / extract_scad_code() parsing
    - generate_scad_code() LLM call handling (mocked httpx)
    - text_to_cad() pipeline error propagation
    - API route /api/v1/text-to-cad/generate status mapping
"""

import os
import sys

import pytest

BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_ROOT)

from app.services import text_to_cad_service  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402

client = TestClient(app)

HAS_OCC = True
try:
    from OCC.Core.TopoDS import TopoDS_Shape  # noqa: F401
except ImportError:
    HAS_OCC = False

requires_occ = pytest.mark.skipif(
    not HAS_OCC, reason="pythonocc-core not available"
)


class FakeResponse:
    """Minimal stand-in for httpx.Response used by the tests."""

    def __init__(self, status_code=200, json_data=None, text=""):
        self.status_code = status_code
        self._json_data = json_data
        self.text = text

    def json(self):
        return self._json_data


def _mock_post(monkeypatch, response):
    monkeypatch.setattr(
        text_to_cad_service.httpx, "post", lambda *a, **k: response
    )


# ------------------------------------------------------------------ build_prompt

class TestBuildPrompt:
    def test_includes_description(self):
        prompt = text_to_cad_service.build_prompt("a small gear")
        assert "a small gear" in prompt
        assert "OpenSCAD" in prompt


# ------------------------------------------------------------ extract_scad_code

class TestExtractScadCode:
    def test_fenced_scad_block(self):
        text = 'Here you go:\n```scad\ncube([10, 10, 10]);\n```\nDone.'
        assert text_to_cad_service.extract_scad_code(text) == "cube([10, 10, 10]);"

    def test_fenced_plain_block(self):
        text = "```\ncylinder(r=5, h=10);\n```"
        assert text_to_cad_service.extract_scad_code(text) == "cylinder(r=5, h=10);"

    def test_plain_code_with_prose(self):
        text = "Here is the model:\n\nmodule thing() {\n  cube(10);\n}\nthing();\n\nLet me know if you need changes."
        code = text_to_cad_service.extract_scad_code(text)
        assert code is not None
        assert "module thing()" in code
        assert "Let me know" not in code

    def test_empty_returns_none(self):
        assert text_to_cad_service.extract_scad_code("") is None
        assert text_to_cad_service.extract_scad_code(None) is None

    def test_prose_only_returns_none(self):
        assert text_to_cad_service.extract_scad_code(
            "I cannot generate that model."
        ) is None


# ---------------------------------------------------------- generate_scad_code

class TestGenerateScadCode:
    def test_missing_api_key(self, monkeypatch):
        monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
        code, err, etype = text_to_cad_service.generate_scad_code("a cube")
        assert code is None
        assert etype == "missing_api_key"
        assert "OPENROUTER_API_KEY" in err

    def test_success_fenced(self, monkeypatch):
        monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
        _mock_post(monkeypatch, FakeResponse(
            json_data={"choices": [{"message": {"content": "```scad\ncube([10, 10, 10]);\n```"}}]}
        ))
        code, err, etype = text_to_cad_service.generate_scad_code("a cube")
        assert err is None and etype is None
        assert "cube" in code

    def test_success_plain_code(self, monkeypatch):
        monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
        _mock_post(monkeypatch, FakeResponse(
            json_data={"choices": [{"message": {"content": "cube([10, 10, 10]);"}}]}
        ))
        code, err, etype = text_to_cad_service.generate_scad_code("a cube")
        assert err is None and etype is None
        assert code == "cube([10, 10, 10]);"

    def test_timeout(self, monkeypatch):
        monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")

        def raise_timeout(*a, **k):
            raise text_to_cad_service.httpx.TimeoutException("timeout")

        monkeypatch.setattr(text_to_cad_service.httpx, "post", raise_timeout)
        code, err, etype = text_to_cad_service.generate_scad_code("a cube")
        assert code is None
        assert etype == "llm_timeout"

    def test_http_error(self, monkeypatch):
        monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")

        def raise_http(*a, **k):
            raise text_to_cad_service.httpx.HTTPError("conn refused")

        monkeypatch.setattr(text_to_cad_service.httpx, "post", raise_http)
        code, err, etype = text_to_cad_service.generate_scad_code("a cube")
        assert code is None
        assert etype == "llm_http_error"

    def test_api_error_status(self, monkeypatch):
        monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
        _mock_post(monkeypatch, FakeResponse(status_code=429, text="rate limited"))
        code, err, etype = text_to_cad_service.generate_scad_code("a cube")
        assert code is None
        assert etype == "llm_api_error"
        assert "429" in err

    def test_unexpected_response_shape(self, monkeypatch):
        monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
        _mock_post(monkeypatch, FakeResponse(json_data={"foo": "bar"}))
        code, err, etype = text_to_cad_service.generate_scad_code("a cube")
        assert code is None
        assert etype == "llm_response_shape"

    def test_no_usable_code(self, monkeypatch):
        monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
        _mock_post(monkeypatch, FakeResponse(
            json_data={"choices": [{"message": {"content": "Sorry, I can't do that."}}]}
        ))
        code, err, etype = text_to_cad_service.generate_scad_code("a cube")
        assert code is None
        assert etype == "llm_no_code"


# ------------------------------------------------------------------- text_to_cad

class TestTextToCad:
    def test_missing_api_key_propagates(self, monkeypatch):
        monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
        result = text_to_cad_service.text_to_cad("a cube")
        assert result["ok"] is False
        assert result["error_type"] == "missing_api_key"

    def test_missing_openscad(self, monkeypatch):
        monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
        monkeypatch.setattr(
            text_to_cad_service, "generate_scad_code",
            lambda *a, **k: ("cube([10, 10, 10]);", None, None),
        )
        monkeypatch.setattr(
            text_to_cad_service.openscad_service, "openscad_available",
            lambda: False,
        )
        result = text_to_cad_service.text_to_cad("a cube")
        assert result["ok"] is False
        assert result["error_type"] == "missing_openscad"

    def test_invalid_llm_code(self, monkeypatch):
        monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
        monkeypatch.setattr(
            text_to_cad_service, "generate_scad_code",
            lambda *a, **k: ("garbage !!!", None, None),
        )
        monkeypatch.setattr(
            text_to_cad_service.openscad_service, "compile_scad_to_stl",
            lambda *a, **k: {"ok": False, "error": "syntax error"},
        )
        result = text_to_cad_service.text_to_cad("a cube")
        assert result["ok"] is False
        assert result["error_type"] == "invalid_code"

    @requires_occ
    def test_success_pipeline_with_mocked_llm(self, monkeypatch):
        """LLM mocked, real OpenSCAD + OCC -> ok with a real shape."""
        from app.services import openscad_service

        if not openscad_service.openscad_available():
            pytest.skip("OpenSCAD executable not installed")

        monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
        monkeypatch.setattr(
            text_to_cad_service, "generate_scad_code",
            lambda *a, **k: ("cube([10, 10, 10]);", None, None),
        )
        result = text_to_cad_service.text_to_cad("a cube")
        assert result["ok"] is True
        assert "cube" in result["scad_code"]
        assert result["shape"] is not None
        assert not result["shape"].IsNull()


# ------------------------------------------------------------------------- API

class TestTextToCadApi:
    def test_empty_description_returns_422(self):
        resp = client.post(
            "/api/v1/text-to-cad/generate", json={"description": "   "}
        )
        assert resp.status_code == 422

    def test_missing_description_returns_422(self):
        resp = client.post("/api/v1/text-to-cad/generate", json={})
        assert resp.status_code == 422

    def test_missing_api_key_returns_503(self, monkeypatch):
        monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
        resp = client.post(
            "/api/v1/text-to-cad/generate", json={"description": "a cube"}
        )
        assert resp.status_code == 503
        assert "OPENROUTER_API_KEY" in resp.json()["detail"]

    def test_invalid_code_returns_400(self, monkeypatch):
        monkeypatch.setattr(
            text_to_cad_service, "text_to_cad",
            lambda *a, **k: {
                "ok": False,
                "error": "LLM generated invalid OpenSCAD code: syntax error",
                "error_type": "invalid_code",
            },
        )
        resp = client.post(
            "/api/v1/text-to-cad/generate", json={"description": "a cube"}
        )
        assert resp.status_code == 400

    def test_llm_api_error_returns_502(self, monkeypatch):
        monkeypatch.setattr(
            text_to_cad_service, "text_to_cad",
            lambda *a, **k: {
                "ok": False,
                "error": "LLM API error 429: rate limited",
                "error_type": "llm_api_error",
            },
        )
        resp = client.post(
            "/api/v1/text-to-cad/generate", json={"description": "a cube"}
        )
        assert resp.status_code == 502

    def test_success_returns_mesh(self, monkeypatch):
        """Mock the full pipeline; mesh comes from a mocked _shape_to_mesh."""
        monkeypatch.setattr(
            text_to_cad_service, "text_to_cad",
            lambda *a, **k: {
                "ok": True,
                "scad_code": "cube([10, 10, 10]);",
                "shape": object(),
            },
        )
        from app.routers import text_to_cad as text_to_cad_router
        from app.services import geometry_service

        monkeypatch.setattr(
            geometry_service, "_shape_to_mesh",
            lambda shape: {"vertices": [0, 0, 0], "indices": [], "normals": []},
        )
        resp = client.post(
            "/api/v1/text-to-cad/generate", json={"description": "a cube"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["ok"] is True
        assert "cube" in data["scad_code"]
        assert "vertices" in data["mesh"]