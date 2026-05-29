import type { CADFeature } from '@/store/useCadStore';

/** Stable fingerprint for skipping redundant heavy-engine rebuild requests. */
export function featureTreeFingerprint(features: CADFeature[]): string {
  return JSON.stringify(
    features.map((f) => ({
      id: f.id,
      type: f.type,
      name: f.name,
      parameters: f.parameters,
      isSuppressed: f.isSuppressed ?? false,
      isBroken: f.isBroken ?? false,
    })),
  );
}
