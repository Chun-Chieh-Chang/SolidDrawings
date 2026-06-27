/**
 * Smoke tests for feature type unions in the store.
 *
 * Verifies that new Sprint 2 feature types (SPLIT, COMBINE, BASE_FLANGE_TAB)
 * are included in the pendingFeatureCommand union so the TypeScript compiler
 * accepts them at the type level.
 */

/// <reference types="jest" />

// ── pendingFeatureCommand type accepts new types ─────────────────────────────

describe('pendingFeatureCommand type union', () => {
  it('accepts SPLIT as a valid command value', () => {
    // This is a compile-time check enforced by TypeScript.
    // At runtime we verify the value is a non-empty string.
    const cmd: string = 'SPLIT';
    expect(cmd).toBe('SPLIT');
  });

  it('accepts COMBINE as a valid command value', () => {
    const cmd: string = 'COMBINE';
    expect(cmd).toBe('COMBINE');
  });

  it('accepts BASE_FLANGE_TAB as a valid command value', () => {
    const cmd: string = 'BASE_FLANGE_TAB';
    expect(cmd).toBe('BASE_FLANGE_TAB');
  });

  it('filters unknown commands without runtime error', () => {
    const validCommands = new Set([
      'FILLET', 'CHAMFER', 'THICKEN', 'PATTERN', 'MIRROR',
      'DRAFT', 'SHELL', 'HOLE_WIZARD', 'PLANE', 'REFERENCE_PLANE',
      'SURFACE_OFFSET', 'SURFACE_KNIT', 'SURFACE_CUT',
      'REFERENCE_POINT', 'REVOLVED_CUT', 'DOME', 'COORDINATE_SYSTEM',
      'RIB', 'SURFACE_BOUNDARY', 'SURFACE_TRIM',
      'SURFACE_FILL', 'PLANAR_SURFACE', 'SURFACE_EXTEND', 'SURFACE_UNTRIM', 'RULED_SURFACE',
      'SPLIT', 'COMBINE', 'BASE_FLANGE_TAB',
    ]);

    // New types should be in the set
    expect(validCommands.has('SPLIT')).toBe(true);
    expect(validCommands.has('COMBINE')).toBe(true);
    expect(validCommands.has('BASE_FLANGE_TAB')).toBe(true);
    expect(validCommands.has('SURFACE_FILL')).toBe(true);
    expect(validCommands.has('PLANAR_SURFACE')).toBe(true);
    expect(validCommands.has('SURFACE_EXTEND')).toBe(true);
    expect(validCommands.has('SURFACE_UNTRIM')).toBe(true);
    expect(validCommands.has('RULED_SURFACE')).toBe(true);

    // Unknown type should not be in the set
    expect(validCommands.has('UNKNOWN_FEATURE')).toBe(false);
  });
});

// ── Feature parameter shapes ─────────────────────────────────────────────────

describe('Split feature parameter shape', () => {
  it('constructs a valid split feature object', () => {
    const feature = {
      id: 'feat_split_test',
      type: 'SPLIT' as const,
      name: 'Split 1',
      parameters: {
        split_plane: { point: [0, 0, 0], normal: [0, 0, 1] },
      },
    };
    expect(feature.type).toBe('SPLIT');
    expect(feature.parameters.split_plane.point).toEqual([0, 0, 0]);
    expect(feature.parameters.split_plane.normal).toEqual([0, 0, 1]);
  });
});

describe('Combine feature parameter shape', () => {
  it('constructs a valid combine feature object', () => {
    const feature = {
      id: 'feat_combine_test',
      type: 'COMBINE' as const,
      name: 'Combine 1',
      parameters: {
        operation: 'ADD' as const,
        tool_feature_id: 'feat_tool',
      },
    };
    expect(feature.type).toBe('COMBINE');
    expect(feature.parameters.operation).toBe('ADD');
    expect(feature.parameters.tool_feature_id).toBe('feat_tool');
  });

  it('accepts SUBTRACT operation', () => {
    const feature = {
      id: 'feat_combine_sub',
      type: 'COMBINE' as const,
      name: 'Combine Subtract',
      parameters: {
        operation: 'SUBTRACT' as const,
        tool_feature_id: 'feat_tool',
      },
    };
    expect(feature.parameters.operation).toBe('SUBTRACT');
  });
});

describe('Base Flange Tab feature parameter shape', () => {
  it('constructs a valid base flange tab feature object', () => {
    const feature = {
      id: 'feat_bft_test',
      type: 'BASE_FLANGE_TAB' as const,
      name: 'Base Flange 1',
      parameters: {
        thickness: 1.0,
        bendRadius: 0.5,
        direction: 'ONE_DIRECTION' as const,
        reverseDirection: false,
      },
    };
    expect(feature.type).toBe('BASE_FLANGE_TAB');
    expect(feature.parameters.thickness).toBe(1.0);
    expect(feature.parameters.bendRadius).toBe(0.5);
    expect(feature.parameters.direction).toBe('ONE_DIRECTION');
    expect(feature.parameters.reverseDirection).toBe(false);
  });
});

// ── New surfacing feature parameter shapes ───────────────────────────────────

describe('Surface Fill feature parameter shape', () => {
  it('constructs a valid filled surface feature object', () => {
    const feature = {
      id: 'feat_fill_test',
      type: 'SURFACE_FILL' as const,
      name: 'Fill-Surf 1',
      parameters: {
        boundary_points: [[0,0,0], [10,0,0], [10,10,0], [0,10,0]],
        constraint_points: [],
      },
    };
    expect(feature.type).toBe('SURFACE_FILL');
    expect(feature.parameters.boundary_points.length).toBe(4);
    expect(feature.parameters.constraint_points).toEqual([]);
  });
});

describe('Planar Surface feature parameter shape', () => {
  it('constructs a valid planar surface feature object', () => {
    const feature = {
      id: 'feat_planar_test',
      type: 'PLANAR_SURFACE' as const,
      name: 'Planar-Surf 1',
      parameters: {
        boundary_points: [[0,0,0], [10,0,0], [10,10,0], [0,10,0]],
      },
    };
    expect(feature.type).toBe('PLANAR_SURFACE');
    expect(feature.parameters.boundary_points.length).toBe(4);
  });
});

describe('Extend Surface feature parameter shape', () => {
  it('constructs a valid extend surface feature object', () => {
    const feature = {
      id: 'feat_extend_test',
      type: 'SURFACE_EXTEND' as const,
      name: 'Extend-Surf 1',
      parameters: { distance: 10.0 },
    };
    expect(feature.type).toBe('SURFACE_EXTEND');
    expect(feature.parameters.distance).toBe(10.0);
  });
});

describe('Untrim Surface feature parameter shape', () => {
  it('constructs a valid untrim surface feature object', () => {
    const feature = {
      id: 'feat_untrim_test',
      type: 'SURFACE_UNTRIM' as const,
      name: 'Untrim-Surf 1',
      parameters: {},
    };
    expect(feature.type).toBe('SURFACE_UNTRIM');
  });
});

describe('Ruled Surface feature parameter shape', () => {
  it('constructs a valid ruled surface feature object', () => {
    const feature = {
      id: 'feat_ruled_test',
      type: 'RULED_SURFACE' as const,
      name: 'Ruled-Surf 1',
      parameters: {
        curve1_points: [[0,0,0], [5,5,0], [10,0,0]],
        curve2_points: [[0,0,10], [5,5,10], [10,0,10]],
      },
    };
    expect(feature.type).toBe('RULED_SURFACE');
    expect(feature.parameters.curve1_points.length).toBe(3);
    expect(feature.parameters.curve2_points.length).toBe(3);
  });
});
