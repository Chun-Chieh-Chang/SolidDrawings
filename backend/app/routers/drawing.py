"""
Drawing router — Standard 3 Views / Model View API endpoints.

Provides:
- POST /project_views — generate Front + Top + Right views in one call
- POST /model_view — generate a view from custom orientation
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services import drawing_service

router = APIRouter()


class StandardViewsRequest(BaseModel):
    features: list


class ModelViewRequest(BaseModel):
    features: list
    orientation: Optional[dict] = None


class AssemblyViewsRequest(BaseModel):
    components: list


@router.post("/project_views")
async def project_standard_views(request: StandardViewsRequest):
    """Generate Front, Top, Right orthographic views in a single call."""
    try:
        views = drawing_service.project_standard_3_views(request.features)
        return views
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/model_view")
async def project_model_view(request: ModelViewRequest):
    """Generate a drawing view from a custom orientation."""
    try:
        orientation = request.orientation or {"eye": [1, 1, 1], "up": [0, 1, 0]}
        lines = drawing_service.project_model_view(request.features, orientation)
        return lines
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/project_assembly_views")
async def project_assembly_views(request: AssemblyViewsRequest):
    """Generate Front, Top, Right views for an assembly."""
    try:
        views = drawing_service.project_assembly_3_views(request.components)
        return views
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class SectionViewRequest(BaseModel):
    features: list
    cutPlane: dict
    planeType: Optional[str] = "FRONT"


@router.post("/section_view")
async def section_view_endpoint(request: SectionViewRequest):
    """Generate a section view by cutting a 3D model with a plane."""
    try:
        from app.services.geometry_service import generate_section_view
        result = generate_section_view(request.features, request.cutPlane, request.planeType)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
