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

class ExportStepRequest(BaseModel):
    features: List[FeatureDefinition]
    filename: Optional[str] = "part.step"

@router.post("/export/step")
async def export_step(request: ExportStepRequest):
    try:
        import os
        from OCC.Core.STEPControl import STEPControl_Writer, STEPControl_AsIs
        
        shape = geometry_service.build_shape_only(request.features)
        if not shape or shape.IsNull():
            raise HTTPException(status_code=400, detail="Failed to build a valid 3D shape from features.")
        
        # Save step file inside artifacts directory
        target_dir = r"C:\Users\3kids\.gemini\antigravity\brain\c393fd10-6f9e-42cf-9722-9cb722fd18e2"
        os.makedirs(target_dir, exist_ok=True)
        filepath = os.path.join(target_dir, request.filename)
        
        writer = STEPControl_Writer()
        writer.Transfer(shape, STEPControl_AsIs)
        status = writer.Write(filepath)
        
        if status != 1:
            raise HTTPException(status_code=500, detail=f"STEP writer failed to save shape (status={status})")
            
        return {
            "status": "SUCCESS", 
            "filepath": filepath, 
            "message": f"Successfully exported to {request.filename}"
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))



class ProjectRequest(BaseModel):
    features: List[FeatureDefinition]
    plane: str = 'FRONT'

@router.post("/project")
async def project_2d(request: ProjectRequest):
    try:
        return geometry_service.project_2d(request.features, request.plane)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
