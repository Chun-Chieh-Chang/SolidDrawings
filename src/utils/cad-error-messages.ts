/** Map backend / kernel strings to user-facing traditional Chinese messages. */
export function formatCadErrorMessage(raw: string): string {
  const text = (raw || '').trim();
  if (!text) return 'Geometry Rebuild failed. Check Feature tree and Sketch profile.';

  const lower = text.toLowerCase();

  if (lower.includes('fillet') || lower.includes('Fillet')) {
    if (lower.includes('radius') || lower.includes('Radius') || lower.includes('too large')) {
      return 'Fillet radius too large or conflicts with adjacent faces. Reduce radius or select different edge.';
    }
    return `Fillet feature failed：${text}`;
  }

  if (lower.includes('chamfer') || lower.includes('Chamfer')) {
    return 'Chamfer distance too large or cannot apply to selected edge. Reduce distance or reselect edge.';
  }

  if (lower.includes('edge_not_found') || lower.includes('not found') && lower.includes('edge')) {
    return 'Previously selected edge not found (topology may have changed after rebuild). Reselect edge and apply fillet/chamfer.';
  }

  if (lower.includes('profile') || lower.includes('loop') || lower.includes('wire')) {
    if (lower.includes('open') || lower.includes('not closed')) {
      return 'Sketch profile not closed or cannot create face. Check closed profile before extruding.';
    }
    return 'Sketch profile cannot be used for this feature. Check closed profile and intersection.';
  }

  if (lower.includes('extrude') || lower.includes('prism')) {
    return 'Extrude failed. Confirm sketch is a valid closed profile and depth is positive.';
  }

  if (lower.includes('revolve')) {
    return 'Revolve failed. Confirm sketch is a closed profile and revolve axis does not intersect it.';
  }

  if (lower.includes('boolean') || lower.includes('cut')) {
    return 'Boolean cut failed. Target solid and tool bodies do not intersect or volume is empty.';
  }

  return text.length > 120 ? `${text.slice(0, 117)}…` : text;
}

export interface FeatureWarning {
  feature?: string;
  code?: string;
  message: string;
}

export function formatFeatureWarnings(warnings: FeatureWarning[]): string | null {
  if (!warnings?.length) return null;
  const first = warnings[0];
  return formatCadErrorMessage(first.message || String(first.code || ''));
}
