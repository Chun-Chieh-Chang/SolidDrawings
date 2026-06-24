/**
 * Sheet Metal Bend Allowance Calculator
 * 
 * Formula: BA = π × (θ/180) × (R + K × t)
 * Where:
 *   BA = Bend Allowance (neutral axis arc length)
 *   θ = Bend angle in degrees
 *   R = Inside bend radius
 *   t = Material thickness
 *   K = K-factor (neutral axis shift factor, typically 0.3-0.5)
 * 
 * Based on ISO 3768 and SOLIDWORKS sheet metal standards.
 */

export interface BendAllowanceResult {
  bendAllowance: number; // Neutral axis arc length (mm)
  setback: number; // Setback = tan(θ/2) × (R + t)
  outerHeight: number; // Outer height after bend
  totalFlatLength: number; // Total flat pattern length
  kFactor: number;
  radius: number;
  thickness: number;
  angle: number;
}

/**
 * Calculate bend allowance using the standard formula.
 */
export function calculateBendAllowance(params: {
  thickness: number;
  bendRadius: number;
  bendAngle: number;
  kFactor?: number;
  outerHeight?: number;
}): BendAllowanceResult {
  const { thickness, bendRadius, bendAngle, kFactor = 0.5, outerHeight } = params;

  // BA = π × (θ/180) × (R + K × t)
  const ba = (Math.PI * (bendAngle / 180)) * (bendRadius + kFactor * thickness);

  // Setback = tan(θ/2) × (R + t)
  const angleRad = (bendAngle * Math.PI) / 180;
  const setback = Math.tan(angleRad / 2) * (bendRadius + thickness);

  // Outer height (distance from bend line to outer face)
  const oh = outerHeight ?? (bendRadius + thickness);

  // Total flat pattern length (for a single L-flange)
  const totalFlatLength = oh - setback + ba;

  return {
    bendAllowance: parseFloat(ba.toFixed(6)),
    setback: parseFloat(setback.toFixed(6)),
    outerHeight: oh,
    totalFlatLength: parseFloat(totalFlatLength.toFixed(6)),
    kFactor,
    radius: bendRadius,
    thickness,
    angle: bendAngle,
  };
}

/**
 * Calculate K-factor from empirical data.
 * Typical values:
 *   - Steel, thin gauge (t < 1mm): K ≈ 0.3-0.35
 *   - Steel, medium (1-3mm): K ≈ 0.4-0.45
 *   - Aluminum: K ≈ 0.4-0.45
 *   - Stainless steel: K ≈ 0.45-0.5
 */
export function getDefaultKFactor(thickness: number, material: string = 'Steel'): number {
  if (material.toLowerCase().includes('aluminum') || material.toLowerCase().includes('alu')) {
    return thickness < 1 ? 0.4 : 0.45;
  }
  if (material.toLowerCase().includes('stainless') || material.toLowerCase().includes('ss')) {
    return thickness < 1 ? 0.45 : 0.5;
  }
  // Default carbon steel
  return thickness < 1 ? 0.3 : 0.45;
}

/**
 * Calculate flat pattern development for a simple L-flange.
 */
export function calculateFlatPattern(params: {
  flange1Length: number;
  flange2Length: number;
  thickness: number;
  bendRadius: number;
  bendAngle: number;
  kFactor?: number;
}): { flatLength: number; bendAllowance: number; setback: number } {
  const baResult = calculateBendAllowance({
    thickness: params.thickness,
    bendRadius: params.bendRadius,
    bendAngle: params.bendAngle,
    kFactor: params.kFactor,
  });

  const flatLength =
    (params.flange1Length - baResult.setback) +
    (params.flange2Length - baResult.setback) +
    baResult.bendAllowance;

  return {
    flatLength: parseFloat(flatLength.toFixed(6)),
    bendAllowance: baResult.bendAllowance,
    setback: baResult.setback,
  };
}
