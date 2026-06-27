"""
Tolerance API router — ISO 286 tolerance calculations.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator

from app.services.tolerancing import (
    calculate_tolerance,
    calculate_deviations,
    suggest_fit,
    get_tolerance_table,
)

router = APIRouter()


# ── Request / Response models ──────────────────────────────────────


class ToleranceRequest(BaseModel):
    nominal_mm: float = Field(..., gt=0, le=500, description="Nominal size in mm")
    grade: str = Field(..., pattern=r'^IT\d+$', description="IT grade (IT01-IT8)")

    @field_validator('grade')
    @classmethod
    def validate_grade(cls, v: str) -> str:
        v = v.upper()
        allowed = {'IT01', 'IT0', 'IT1', 'IT2', 'IT3', 'IT4', 'IT5', 'IT6', 'IT7', 'IT8'}
        if v not in allowed:
            raise ValueError(f"Grade must be one of {', '.join(sorted(allowed))}")
        return v


class DeviationRequest(ToleranceRequest):
    fit_type: str = Field(default='H', pattern=r'^(H|H_PLUS)$', description="Fit type: H (hole basis) or H_PLUS (symmetric ±)")


class FitSuggestionRequest(BaseModel):
    nominal_mm: float = Field(..., gt=0, le=500)
    description: str = Field(default='normal', pattern=r'^(precision|normal|loose)$')


# ── Endpoints ──────────────────────────────────────────────────────


@router.post("/tolerance/calculate", summary="Calculate IT tolerance value")
def api_calculate_tolerance(req: ToleranceRequest):
    """Calculate the standard tolerance value (in μm and mm) for a given nominal size and IT grade."""
    try:
        result = calculate_tolerance(req.nominal_mm, req.grade)
        return {"status": "ok", "data": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/tolerance/deviations", summary="Calculate upper/lower deviations")
def api_calculate_deviations(req: DeviationRequest):
    """Calculate upper and lower deviations for a hole/shaft fit."""
    try:
        result = calculate_deviations(req.nominal_mm, req.grade, req.fit_type)
        return {"status": "ok", "data": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/tolerance/suggest-fit", summary="Suggest standard fit")
def api_suggest_fit(req: FitSuggestionRequest):
    """Suggest a standard hole/shaft fit for common applications."""
    try:
        result = suggest_fit(req.nominal_mm, req.description)
        return {"status": "ok", "data": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/tolerance/table", summary="Get complete IT tolerance lookup table")
def api_tolerance_table():
    """Return the full ISO 286 tolerance table for all size ranges and IT01-IT8."""
    try:
        table = get_tolerance_table()
        return {"status": "ok", "data": table}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
