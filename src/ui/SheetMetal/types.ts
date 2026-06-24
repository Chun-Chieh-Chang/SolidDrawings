export interface SheetMetalParams {
  type: 'FLAT_PATTERN' | 'BEND_ALLOWANCE' | 'FORMING_TOOL' | 'BEND_LINE' | 'K-FACEOR' | 'EDGE_FLANGE' | 'MITER_FLANGE' | 'HEM' | 'SPLIT' | 'JOINDER';
  thickness: number;
  bendRadius: number;
  bendAngle: number;
  kFactor?: number;
  reliefType?: 'RECTANGULAR' | 'ROUND' | 'NONE';
  reliefWidth?: number;
  reliefDepth?: number;
}

export const SHEET_METAL_TOOL_ORDER = [
  'FLAT_PATTERN',
  'BEND_ALLOWANCE',
  'BEND_LINE',
  'K-FACEOR',
  'FORMING_TOOL',
  'EDGE_FLANGE',
  'MITER_FLANGE',
  'HEM',
  'SPLIT',
  'JOINDER',
] as const;
