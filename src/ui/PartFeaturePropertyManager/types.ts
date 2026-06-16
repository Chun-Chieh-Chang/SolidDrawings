import type { CADFeature } from '@/store/useCadStore';

export interface PartFeaturePropertyManagerProps {
  selectedFeature: CADFeature;
  features: CADFeature[];
  onParamChange: (key: string, value: any) => void;
  onEditSketch: (feature: CADFeature) => void;
  onSelectFeature: (id: string) => void;
  onBuildSweepLoft?: (feature: CADFeature) => void;
}

export interface FeatureContext {
  selectedFeature: CADFeature;
  features?: CADFeature[];
  onParamChange: (key: string, value: any) => void;
  pendingFeatureCommand: string | null;
}

export const HOLE_PRESETS: Record<string, { diameter: number; cb_diameter?: number; cb_depth?: number; cs_diameter?: number; cs_angle?: number }> = {
  'M3': { diameter: 3.4, cb_diameter: 6.0, cb_depth: 3.3, cs_diameter: 6.6, cs_angle: 90 },
  'M4': { diameter: 4.5, cb_diameter: 8.0, cb_depth: 4.4, cs_diameter: 8.6, cs_angle: 90 },
  'M5': { diameter: 5.5, cb_diameter: 10.0, cb_depth: 5.4, cs_diameter: 10.4, cs_angle: 90 },
  'M6': { diameter: 6.6, cb_diameter: 11.0, cb_depth: 6.5, cs_diameter: 12.6, cs_angle: 90 },
  'M8': { diameter: 9.0, cb_diameter: 15.0, cb_depth: 8.6, cs_diameter: 16.8, cs_angle: 90 },
};
