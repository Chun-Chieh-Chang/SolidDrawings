import type { SketchNode, SketchEdge, SketchConstraint } from '@/store/useCadStore';

export type { SketchNode, SketchEdge, SketchConstraint };

export type ConstraintType = SketchConstraint['type'];

export interface SolveResult {
  nodes: Record<string, SketchNode>;
  hasConflict: boolean;
  dof: number;
}
