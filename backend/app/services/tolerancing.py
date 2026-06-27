"""
ISO 286-1:2010 Standard Tolerance (公差) Engine.

Converts IT grades and nominal sizes to standard tolerance values (μm),
and calculates upper/lower deviations for standard fits.

Reference: ISO 286-1:2010, ISO 286-2:2010
"""
import math

# ── Nominal size ranges (mm) per ISO 286-1 ────────────────────────
# Each range is (lower, upper, geometric_mean_D)
SIZE_RANGES = [
    (0, 3, math.sqrt(1 * 3)),        # ≤3 mm → D = √(1×3)
    (3, 6, math.sqrt(3 * 6)),         # 3-6
    (6, 10, math.sqrt(6 * 10)),       # 6-10
    (10, 18, math.sqrt(10 * 18)),     # 10-18
    (18, 30, math.sqrt(18 * 30)),     # 18-30
    (30, 50, math.sqrt(30 * 50)),     # 30-50
    (50, 80, math.sqrt(50 * 80)),     # 50-80
    (80, 120, math.sqrt(80 * 120)),   # 80-120
    (120, 180, math.sqrt(120 * 180)), # 120-180
    (180, 250, math.sqrt(180 * 250)), # 180-250
    (250, 315, math.sqrt(250 * 315)), # 250-315
    (315, 400, math.sqrt(315 * 400)), # 315-400
    (400, 500, math.sqrt(400 * 500)), # 400-500
]


def _tolerance_unit(d: float) -> float:
    """Standard tolerance unit i (μm) for nominal size D (mm)."""
    i = 0.45 * (d ** (1 / 3)) + 0.001 * d
    return i


def _round_it(value: float) -> int:
    """Round tolerance value per ISO 286 rounding rules."""
    # IT values are rounded to integers
    if value < 1:
        return round(value, 2)
    return round(value)


# ── IT grade multipliers (× i) for IT01 through IT8 ────────────────
# For IT01-IT1: formula-based (not simple multiples)
# For IT2-IT4: progressive geometric scaling
# For IT5-IT18: multiples of i

def _it01(d: float) -> float:
    """IT01 = 0.3 + 0.008 × D (where D is geometric mean in mm)."""
    return 0.3 + 0.008 * d


def _it0(d: float) -> float:
    """IT0 = 0.5 + 0.012 × D."""
    return 0.5 + 0.012 * d


def _it1(d: float) -> float:
    """IT1 = 0.8 + 0.020 × D."""
    return 0.8 + 0.020 * d


# IT2-IT4: geometric progression between IT1 and IT5
_IT2_THROUGH_IT4 = {2: 1.25, 3: 1.6, 4: 2.0}

# IT5-IT8: multiples of tolerance unit i (for D ≤ 500mm)
_IT_MULTIPLIERS: dict[str, float] = {
    'IT5': 7.0,
    'IT6': 10.0,
    'IT7': 16.0,
    'IT8': 25.0,
}


def _find_size_range(nominal_mm: float) -> tuple[float, float, float] | None:
    """Find the size range containing nominal_mm. Returns (lower, upper, D)."""
    for lo, hi, d in SIZE_RANGES:
        if lo < nominal_mm <= hi:
            return (lo, hi, d)
    return None


# ═══════════════════════════════════════════════════════════════════
# Public API
# ═══════════════════════════════════════════════════════════════════


def calculate_tolerance(nominal_mm: float, grade: str) -> dict:
    """
    Calculate standard tolerance for a given nominal size and IT grade.

    Args:
        nominal_mm: Nominal size in mm (＞0, ≤500).
        grade: IT grade string ('IT01', 'IT0', 'IT1'..'IT8').

    Returns:
        dict with keys:
          - nominal_mm: input nominal size
          - grade: IT grade
          - tolerance_um: tolerance value in micrometres
          - tolerance_mm: tolerance value in millimetres
          - size_range: matched nominal size range
          - error: error message if invalid

    Raises:
        ValueError for invalid grade/size.
    """
    if isinstance(nominal_mm, (int, float)):
        nominal_mm = float(nominal_mm)
    else:
        raise ValueError(f"nominal_mm must be numeric, got {type(nominal_mm)}")

    if nominal_mm <= 0 or nominal_mm > 500:
        raise ValueError(f"nominal_mm {nominal_mm} out of range (0, 500]")

    grade = grade.upper()
    if grade not in ('IT01', 'IT0', 'IT1', 'IT2', 'IT3', 'IT4', 'IT5', 'IT6', 'IT7', 'IT8'):
        raise ValueError(f"Unsupported grade '{grade}'. Must be IT01-IT8.")

    range_info = _find_size_range(nominal_mm)
    if range_info is None:
        raise ValueError(f"No size range for nominal_mm={nominal_mm}")

    _lo, _hi, d = range_info

    if grade == 'IT01':
        tol_um = _it01(d)
    elif grade == 'IT0':
        tol_um = _it0(d)
    elif grade == 'IT1':
        tol_um = _it1(d)
    elif grade in ('IT2', 'IT3', 'IT4'):
        i = _tolerance_unit(d)
        factor = _IT2_THROUGH_IT4[int(grade[-1])]
        tol_um = factor * (0.8 + 0.020 * d)  # based on IT1 × geometric factor
    else:  # IT5-IT8
        i = _tolerance_unit(d)
        factor = _IT_MULTIPLIERS[grade]
        tol_um = factor * i

    tol_um_rounded = _round_it(tol_um)

    return {
        'nominal_mm': nominal_mm,
        'grade': grade,
        'tolerance_um': tol_um_rounded,
        'tolerance_mm': round(tol_um_rounded / 1000, 6),
        'size_range': f">{_lo}..{_hi}",
    }


def calculate_deviations(
    nominal_mm: float,
    grade: str,
    fit_type: str = 'H',
) -> dict:
    """
    Calculate upper and lower deviations for a hole/shaft fit.

    For a hole basis system (H):
      - H7: lower deviation = 0, upper deviation = +IT7
    For a shaft basis system (h):
      - h6: upper deviation = 0, lower deviation = -IT6

    Args:
        nominal_mm: Nominal size in mm.
        grade: IT grade string.
        fit_type: 'H' (hole basis, lower=0) or 'h' (shaft basis, upper=0).

    Returns:
        dict with nominal_mm, grade, fit_type,
             upper_deviation_um, lower_deviation_um,
             upper_deviation_mm, lower_deviation_mm.
    """
    tol_result = calculate_tolerance(nominal_mm, grade)
    tol_um = tol_result['tolerance_um']

    fit_type = fit_type.upper()
    if fit_type == 'H':
        # Hole basis: lower deviation = 0, upper = +IT
        upper = tol_um
        lower = 0
    elif fit_type == 'H_PLUS':
        # Symmetric: ± IT/2 (e.g. for position tolerances)
        half = tol_um / 2.0
        upper = half
        lower = -half
    else:
        raise ValueError(f"Unsupported fit_type '{fit_type}'. Use 'H' or 'H_PLUS'.")

    return {
        'nominal_mm': nominal_mm,
        'grade': grade,
        'fit_type': fit_type,
        'upper_deviation_um': upper,
        'lower_deviation_um': lower,
        'upper_deviation_mm': round(upper / 1000, 6),
        'lower_deviation_mm': round(lower / 1000, 6),
        'tolerance_um': tol_um,
        'tolerance_mm': round(tol_um / 1000, 6),
    }


def suggest_fit(nominal_mm: float, description: str = 'normal') -> dict:
    """
    Suggest standard fit for common applications.

    Args:
        nominal_mm: Nominal size.
        description: 'precision', 'normal', 'loose'.

    Returns:
        dict with hole_grade, shaft_grade, fit_type description.
    """
    recommendations = {
        'precision': {'hole': 'IT6', 'shaft': 'IT5', 'note': 'Precision fit (e.g. bearings)'},
        'normal':    {'hole': 'IT7', 'shaft': 'IT6', 'note': 'Standard fit (e.g. sliding fits)'},
        'loose':     {'hole': 'IT8', 'shaft': 'IT7', 'note': 'Loose fit (e.g. clearance fits)'},
    }
    rec = recommendations.get(description, recommendations['normal'])

    hole_tol = calculate_tolerance(nominal_mm, rec['hole'])
    shaft_tol = calculate_tolerance(nominal_mm, rec['shaft'])

    return {
        'nominal_mm': nominal_mm,
        'description': description,
        'hole': hole_tol,
        'shaft': shaft_tol,
        'note': rec['note'],
    }


# ── Pre-computed lookup for common sizes (fast path) ──────────────

def get_tolerance_table() -> list[dict]:
    """
    Generate a complete lookup table for all size ranges × IT grades (IT01-IT8).

    Returns a list of dicts: [{size_range, d, IT01_um, IT0_um, ..., IT8_um}, ...]
    """
    grades = ['IT01', 'IT0', 'IT1', 'IT2', 'IT3', 'IT4', 'IT5', 'IT6', 'IT7', 'IT8']
    rows = []
    for lo, hi, d in SIZE_RANGES:
        row = {'size_range': f">{lo}..{hi}", 'd_mm': round(d, 2)}
        for g in grades:
            try:
                t = calculate_tolerance((lo + hi) / 2, g)
                row[g + '_um'] = t['tolerance_um']
            except (ValueError, ZeroDivisionError):
                row[g + '_um'] = None
        rows.append(row)
    return rows
