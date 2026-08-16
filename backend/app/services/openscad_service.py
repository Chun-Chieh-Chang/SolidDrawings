"""
OpenSCAD integration service.

Bridges the OpenSCAD CLI into the 3D-Builder feature pipeline:

    1. ``compile_scad_to_stl``  — compiles OpenSCAD (.scad) source into an STL
       file via the OpenSCAD command-line executable.
    2. ``import_stl_file``      — imports an STL file into an OCCT
       ``TopoDS_Shape`` (mirrors ``import_step_file`` in geometry_service).
    3. ``openscad_to_shape``    — one-shot: compile + import, returning an
       OCCT shape ready for the boolean feature chain.

The OpenSCAD executable is located via (in priority order):
    ``OPENSCAD_PATH`` env var  >  ``PATH`` lookup  >  common install locations.

If the executable cannot be found, ``compile_scad_to_stl`` returns a
descriptive error so the API layer can respond with a 503 + install hint.
"""

import os
import shutil
import subprocess
import tempfile

# Common OpenSCAD install locations (Windows / macOS / Linux).
_OPENSCAD_CANDIDATES = [
    r"C:\Program Files\OpenSCAD\openscad.exe",
    r"C:\Program Files (x86)\OpenSCAD\openscad.exe",
    "/usr/bin/openscad",
    "/usr/local/bin/openscad",
    "/Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD",
]

# Default compile timeout (seconds). OpenSCAD renders can be slow on
# complex CSG trees; 30s covers typical parametric parts.
DEFAULT_TIMEOUT = 30


def find_openscad():
    """Locate the OpenSCAD executable.

    Priority: ``OPENSCAD_PATH`` env var > ``PATH`` lookup > common install
    locations. Returns the executable path, or ``None`` if not found.
    """
    env_path = os.environ.get("OPENSCAD_PATH")
    if env_path and os.path.exists(env_path):
        return env_path

    which = shutil.which("openscad")
    if which:
        return which

    for candidate in _OPENSCAD_CANDIDATES:
        if os.path.exists(candidate):
            return candidate

    return None


def openscad_available():
    """True if an OpenSCAD executable can be located."""
    return find_openscad() is not None


def compile_scad_to_stl(scad_code, out_stl_path, timeout=DEFAULT_TIMEOUT):
    """Compile OpenSCAD source code to an STL file.

    Args:
        scad_code: OpenSCAD source code string.
        out_stl_path: Destination path for the generated ``.stl`` file.
        timeout: Compile timeout in seconds (default 30).

    Returns:
        dict: ``{"ok": True, "stl_path": ...}`` on success, or
              ``{"ok": False, "error": ...}`` on failure.
    """
    exe = find_openscad()
    if not exe:
        return {
            "ok": False,
            "error": (
                "OpenSCAD not found. Install it from "
                "https://openscad.org/downloads.html or set the "
                "OPENSCAD_PATH environment variable."
            ),
        }

    tmp_dir = tempfile.mkdtemp(prefix="openscad_")
    scad_path = os.path.join(tmp_dir, "model.scad")
    try:
        with open(scad_path, "w", encoding="utf-8") as f:
            f.write(scad_code)

        cmd = [exe, "-o", out_stl_path, scad_path]
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=timeout
        )

        if result.returncode != 0:
            detail = (result.stderr or result.stdout or "").strip()
            return {
                "ok": False,
                "error": f"OpenSCAD compile failed: {detail}",
            }
        if not os.path.exists(out_stl_path):
            return {
                "ok": False,
                "error": "OpenSCAD finished but produced no STL output.",
            }
        return {"ok": True, "stl_path": out_stl_path}
    except subprocess.TimeoutExpired:
        return {
            "ok": False,
            "error": f"OpenSCAD compile timed out after {timeout}s.",
        }
    except Exception as e:
        return {"ok": False, "error": f"OpenSCAD compile error: {e}"}
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


def import_stl_file(filepath):
    """Import an STL file into an OCCT ``TopoDS_Shape``.

    Mirrors ``import_step_file`` in geometry_service for the STL format.
    STL is a faceted format, so the resulting shape is a mesh shell rather
    than an analytic B-Rep solid; boolean operations on it are best-effort.

    Returns the shape, or ``None`` on failure / missing OCC.
    """
    try:
        from OCC.Core.StlAPI import StlAPI_Reader
        from OCC.Core.TopoDS import TopoDS_Shape
    except ImportError:
        print("[ERROR] STL import not available — missing OCC.Core.StlAPI")
        return None

    try:
        shape = TopoDS_Shape()
        reader = StlAPI_Reader()
        status = reader.Read(shape, filepath)
        if not status:
            print(f"[ERROR] Failed to import STL file: {filepath}")
            return None
        if shape.IsNull():
            return None

        # STL orientation can be inconsistent; run a shape fix pass to
        # heal reversed faces / degenerate triangles when available.
        try:
            from OCC.Core.ShapeFix import ShapeFix_Shape

            fixer = ShapeFix_Shape(shape)
            fixer.Perform()
            fixed = fixer.Shape()
            if fixed and not fixed.IsNull():
                shape = fixed
        except ImportError:
            pass

        return shape
    except Exception as e:
        print(f"[ERROR] Failed to import STL file: {e}")
        return None


def openscad_to_shape(scad_code, timeout=DEFAULT_TIMEOUT):
    """Compile OpenSCAD source and import the result as an OCCT shape.

    One-shot helper for the feature pipeline: writes the source to a temp
    file, compiles to STL, imports to a ``TopoDS_Shape``, and cleans up.

    Returns a ``(shape, error)`` tuple. On success ``error`` is ``None``;
    on failure ``shape`` is ``None`` and ``error`` holds a message.
    """
    exe = find_openscad()
    if not exe:
        return None, (
            "OpenSCAD not found. Install it from "
            "https://openscad.org/downloads.html or set the "
            "OPENSCAD_PATH environment variable."
        )

    tmp_dir = tempfile.mkdtemp(prefix="openscad_")
    stl_path = os.path.join(tmp_dir, "model.stl")
    try:
        result = compile_scad_to_stl(scad_code, stl_path, timeout=timeout)
        if not result["ok"]:
            return None, result["error"]

        shape = import_stl_file(stl_path)
        if shape is None or shape.IsNull():
            return None, "Failed to import compiled STL into OCCT."
        return shape, None
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)