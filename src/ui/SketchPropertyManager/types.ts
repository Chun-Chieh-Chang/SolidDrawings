export type SolverReport = {
  dof: number;
  residual: number;
  nodes: Record<string, any>;
  max_residual?: number;
  iterations?: number;
  converged?: boolean;
};
