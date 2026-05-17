from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services import geometry_service

router = APIRouter()

class BoxParams(BaseModel):
    width: float = 10.0
    height: float = 10.0
    depth: float = 10.0
    w: Optional[float] = None
    h: Optional[float] = None
    d: Optional[float] = None

class CylinderParams(BaseModel):
    radius: float = 5.0
    height: float = 10.0

class SphereParams(BaseModel):
    radius: float = 5.0

class FeatureDefinition(BaseModel):
    id: str
    type: str  # 'BOX', 'CYLINDER', 'SPHERE'
    parameters: dict

class AssemblyRequest(BaseModel):
    features: List[FeatureDefinition]

@router.post("/box")
async def create_box(params: BoxParams):
    try:
        final_w = params.w if params.w is not None else params.width
        final_h = params.h if params.h is not None else params.height
        final_d = params.d if params.d is not None else params.depth
        return geometry_service.generate_box(final_w, final_h, final_d)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cylinder")
async def create_cylinder(params: CylinderParams):
    try:
        return geometry_service.generate_cylinder(params.radius, params.height)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sphere")
async def create_sphere(params: SphereParams):
    try:
        return geometry_service.generate_sphere(params.radius)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rebuild")
async def rebuild_assembly(request: AssemblyRequest):
    try:
        # We now process the entire feature tree as a single B-Rep solid (SolidWorks Part style)
        result = geometry_service.process_features(request.features)
        if result:
            # Return as a single mesh item for the renderer to display as one part
            return [result] 
        return []
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


