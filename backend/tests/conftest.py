import os
import pytest


@pytest.fixture(scope="session")
def cad_api_url():
    """Return the CAD API base URL from env var, or default."""
    return os.environ.get("CAD_API_URL", "http://127.0.0.1:8400")


@pytest.fixture(scope="session")
def has_occ():
    """Check whether OpenCASCADE (pythonocc-core) is importable."""
    try:
        from OCP.gp import gp_Pnt  # noqa: F401
        return True
    except ImportError:
        return False


@pytest.fixture(scope="session")
def sample_features():
    """Return a list of sample feature dicts for testing."""
    return [
        {
            "id": "extrude_001",
            "type": "extrude",
            "profile": {"vertices": [[0, 0], [10, 0], [10, 10], [0, 10]]},
            "depth": 5.0,
            "direction": [0, 0, 1],
        },
        {
            "id": "hole_001",
            "type": "hole",
            "position": [5, 5, 10],
            "radius": 2.5,
            "depth": 8.0,
        },
        {
            "id": "fillet_001",
            "type": "fillet",
            "edge_ids": [12, 13, 14],
            "radius": 1.0,
        },
    ]


@pytest.fixture(scope="session")
def sample_assembly():
    """Return a sample assembly with components and mates."""
    return {
        "components": [
            {
                "id": "comp_base",
                "name": "Base Plate",
                "part_file": "base_plate.step",
                "transform": {
                    "translation": [0, 0, 0],
                    "rotation": [0, 0, 0],
                },
            },
            {
                "id": "comp_wall",
                "name": "Wall Bracket",
                "part_file": "wall_bracket.step",
                "transform": {
                    "translation": [10, 0, 0],
                    "rotation": [0, 0, 0],
                },
            },
        ],
        "mates": [
            {
                "type": "coincident",
                "component_a": "comp_base",
                "component_b": "comp_wall",
                "face_a": "top",
                "face_b": "bottom",
            },
        ],
    }
