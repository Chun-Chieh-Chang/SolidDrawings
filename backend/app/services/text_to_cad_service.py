"""
Text-to-CAD service (CADAM-style).

Turns a natural-language description into an OpenSCAD parametric model
via an LLM (OpenRouter), compiles it to STL through the OpenSCAD CLI,
and returns the mesh for preview.

Pipeline:

    description
        → build_prompt() → LLM (OpenRouter chat completions) → .scad code
        → openscad_service.compile_scad_to_stl() → STL
        → openscad_service.import_stl_file() → OCCT shape → mesh

Configuration (environment variables):
    OPENROUTER_API_KEY   — required; OpenRouter API key.
    TEXT_TO_CAD_MODEL    — optional; model id (default "openai/gpt-4o-mini").

Limitations (from the CADAM tool spec): best-effort generation — not
suitable for precision tolerances, engineering drawings, or FEA-grade
designs. Complex organic surfaces are out of scope.
"""

import os

import httpx

from app.services import openscad_service

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "openai/gpt-4o-mini"
DEFAULT_LLM_TIMEOUT = 30

_SYSTEM_PROMPT = """\
You are a mechanical engineering assistant that writes OpenSCAD code.

Rules:
- Output ONLY valid OpenSCAD code. No explanations, no markdown code fences, no trailing commentary.
- Use millimeters as the unit.
- Use parametric variables at the top of the file (e.g. length, width, height, radius, thickness).
- Build the model from primitives (cube, cylinder, sphere, linear_extrude, rotate_extrude) and CSG operations (union, difference, intersection).
- The code must be self-contained: no includes, no external libraries.
- Keep $fn at or below 100 for rendering performance.
- If the request is ambiguous, make reasonable engineering assumptions and note them as comments.
- The final statement must be a single 3D object (a union of the whole model).
"""


def build_prompt(description):
    """Build the user prompt for the LLM from a natural-language description."""
    return (
        "Generate OpenSCAD code for the following part description:\n\n"
        f"{description}\n\n"
        "Remember: output ONLY the OpenSCAD code."
    )


def extract_scad_code(text):
    """Strip markdown code fences / surrounding prose from LLM output.

    Returns the raw OpenSCAD source, or None if no code could be found.
    """
    if not text:
        return None

    content = text.strip()

    # Case 1: fenced block ```scad ... ``` or ``` ... ```
    if "```" in content:
        import re

        match = re.search(r"```(?:scad|openscad)?\s*(.*?)```", content, re.DOTALL)
        if match:
            return match.group(1).strip()

    # Case 2: plain code (no fences) — strip leading/trailing prose lines
    _CODE_STARTS = (
        "$", "module ", "function ", "cube(", "cylinder(", "sphere(",
        "difference", "union", "intersection", "linear_extrude",
        "rotate_extrude", "translate", "rotate", "scale", "mirror",
        "color", "if ", "for ", "echo", "include", "use ", "import",
        "polyhedron", "circle(", "square(", "polygon(", "text(",
        "hull", "minkowski", "offset", "resize", "render", "projection",
        "surface", "//", "/*", "*/",
    )
    lines = content.splitlines()
    code_lines = []
    seen_code = False
    for line in lines:
        stripped = line.strip()
        if not seen_code:
            if stripped.startswith(_CODE_STARTS):
                seen_code = True
            else:
                continue
        code_lines.append(line)

    # Trim trailing prose — lines that don't look like OpenSCAD
    while code_lines:
        s = code_lines[-1].strip()
        if s and not (
            s.endswith((";", "{", "}", ")", ","))
            or s.startswith(("//", "/*", "*/", "$"))
        ):
            code_lines.pop()
        else:
            break

    if code_lines:
        return "\n".join(code_lines).strip()

    return None


def generate_scad_code(description, api_key=None, model=None, timeout=DEFAULT_LLM_TIMEOUT):
    """Call the OpenRouter LLM to generate OpenSCAD code for a description.

    Returns a ``(scad_code, error, error_type)`` tuple. On success ``error``
    and ``error_type`` are None. ``error_type`` is one of:
        "missing_api_key", "llm_timeout", "llm_http_error",
        "llm_api_error", "llm_response_shape", "llm_no_code"
    """
    api_key = api_key or os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        return None, (
            "OPENROUTER_API_KEY is not set. Add it to the backend environment "
            "to use text-to-CAD."
        ), "missing_api_key"

    model = model or os.environ.get("TEXT_TO_CAD_MODEL") or DEFAULT_MODEL

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": build_prompt(description)},
        ],
        "temperature": 0.2,
        "max_tokens": 2000,
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        resp = httpx.post(OPENROUTER_URL, json=payload, headers=headers, timeout=timeout)
    except httpx.TimeoutException:
        return None, f"LLM request timed out after {timeout}s.", "llm_timeout"
    except httpx.HTTPError as e:
        return None, f"LLM request failed: {e}", "llm_http_error"

    if resp.status_code != 200:
        detail = resp.text[:300]
        return None, f"LLM API error {resp.status_code}: {detail}", "llm_api_error"

    try:
        content = resp.json()["choices"][0]["message"]["content"]
    except (KeyError, IndexError, ValueError) as e:
        return None, f"Unexpected LLM response shape: {e}", "llm_response_shape"

    scad_code = extract_scad_code(content)
    if not scad_code:
        return None, "LLM returned no usable OpenSCAD code.", "llm_no_code"
    return scad_code, None, None


def text_to_cad(description, api_key=None, model=None, llm_timeout=DEFAULT_LLM_TIMEOUT,
                compile_timeout=openscad_service.DEFAULT_TIMEOUT):
    """Full text-to-CAD pipeline: LLM → OpenSCAD compile → STL → OCCT shape.

    Returns a dict:
        on success: {"ok": True, "scad_code": ..., "stl_path": ..., "shape": ...}
        on failure: {"ok": False, "error": ..., "error_type": ...}
    """
    scad_code, err, error_type = generate_scad_code(
        description, api_key=api_key, model=model, timeout=llm_timeout
    )
    if err:
        return {"ok": False, "error": err, "error_type": error_type}

    if not openscad_service.openscad_available():
        return {
            "ok": False,
            "error": (
                "OpenSCAD not found. Install it from https://openscad.org/downloads.html "
                "or set the OPENSCAD_PATH environment variable."
            ),
            "error_type": "missing_openscad",
        }

    import shutil
    import tempfile

    tmp_dir = tempfile.mkdtemp(prefix="text_to_cad_")
    stl_path = os.path.join(tmp_dir, "model.stl")
    try:
        result = openscad_service.compile_scad_to_stl(
            scad_code, stl_path, timeout=compile_timeout
        )
        if not result["ok"]:
            return {
                "ok": False,
                "error": f"LLM generated invalid OpenSCAD code: {result['error']}",
                "error_type": "invalid_code",
            }

        shape = openscad_service.import_stl_file(stl_path)
        if shape is None or shape.IsNull():
            return {
                "ok": False,
                "error": "Failed to import generated STL into OCCT.",
                "error_type": "import_failed",
            }
        return {"ok": True, "scad_code": scad_code, "stl_path": stl_path, "shape": shape}
    finally:
        # The STL file is only a compile intermediate — the shape lives in
        # OCCT memory after import, so the temp directory can be removed.
        shutil.rmtree(tmp_dir, ignore_errors=True)