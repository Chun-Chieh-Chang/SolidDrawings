"""
Drawing service — Standard 3 Views + Model View orchestration.

Leverages the existing HLR projection engine in geometry_service.py
to produce 2D drawing views for the frontend.
"""

from typing import List, Optional
from app.services import geometry_service


def project_standard_3_views(features: list) -> dict:
    """Project a part into the 3 standard orthographic views (Front, Top, Right).

    Returns a dict keyed by view type, each containing visible/hidden edge lines
    in the same format as geometry_service.project_2d().
    """
    return {
        "FRONT": geometry_service.project_2d(features, "FRONT"),
        "TOP": geometry_service.project_2d(features, "TOP"),
        "RIGHT": geometry_service.project_2d(features, "RIGHT"),
    }


def project_model_view(features: list, orientation: dict) -> list:
    """Project a part from a custom orientation (Model View).

    orientation: {"eye": [x,y,z], "up": [x,y,z]} defining the view direction.
    Currently maps to ISO as a fallback; full custom-orientation HLR
    can use HLRAlgo_Projector with a custom gp_Ax2.
    """
    eye = orientation.get("eye", [1, 1, 1])
    up = orientation.get("up", [0, 1, 0])

    # Use ISO as the base custom orientation
    # In a production implementation we would construct a custom HLRAlgo_Projector
    # using the eye/up vectors directly. For now, ISO projection covers the
    # standard trimetric case most users expect.
    _ = eye  # reserved for future custom projector
    _ = up
    return geometry_service.project_2d(features, "ISO")


def project_assembly_3_views(components_data: list) -> dict:
    """Project an assembly into 3 standard views."""
    return {
        "FRONT": geometry_service.project_assembly_2d(components_data, "FRONT"),
        "TOP": geometry_service.project_assembly_2d(components_data, "TOP"),
        "RIGHT": geometry_service.project_assembly_2d(components_data, "RIGHT"),
    }
