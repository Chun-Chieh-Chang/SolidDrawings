"""
Text-to-CAD API routes (CADAM-style).

POST /api/v1/text-to-cad/generate
    {description: str} → LLM generates OpenSCAD code → compiles to STL
    → imports to OCCT shape → returns mesh preview + scad_code.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.services import geometry_service, text_to_cad_service

router = APIRouter()

# error_type → HTTP status mapping
_ERROR_STATUS = {
    "missing_api_key": 503,
    "missing_openscad": 503,
    "llm_timeout": 502,
    "llm_http_error": 502,
    "llm_api_error": 502,
    "llm_response_shape": 502,
    "llm_no_code": 502,
    "invalid_code": 400,
    "import_failed": 500,
}


class TextToCadRequest(BaseModel):
    description: str
    model: Optional[str] = None


@router.post("/generate")
async def generate_text_to_cad(request: TextToCadRequest):
    """Generate a CAD model from a natural-language description."""
    if not request.description.strip():
        raise HTTPException(status_code=422, detail="description must not be empty.")

    result = text_to_cad_service.text_to_cad(
        request.description, model=request.model
    )
    if not result["ok"]:
        status = _ERROR_STATUS.get(result.get("error_type"), 500)
        raise HTTPException(status_code=status, detail=result["error"])

    shape = result["shape"]
    mesh = geometry_service._shape_to_mesh(shape)
    return {
        "ok": True,
        "scad_code": result["scad_code"],
        "mesh": mesh,
    }