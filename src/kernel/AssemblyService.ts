import { CADComponent, CADMate } from '../store/useCadStore';
import { HeavyEngineClient } from './HeavyEngineClient';
import {
  componentsToSolverDict,
  matesToSolverPayload,
  type MateSelectionEntity,
} from './mate-payload';

export class AssemblyService {
  /**
   * Register a component's B-Rep with the backend to avoid sending full history on every solve.
   */
  public async registerComponent(componentId: string, features: any[]): Promise<boolean> {
    const client = HeavyEngineClient.getInstance();
    return await client.registerComponent(componentId, features);
  }

  /**
   * Solve assembly mates using the backend Scipy solver.
   */
  public async solve(
    components: CADComponent[],
    mates: CADMate[],
    mateSelection: MateSelectionEntity[] = [],
  ): Promise<CADComponent[]> {
    const client = HeavyEngineClient.getInstance();
    const componentsDict = componentsToSolverDict(components);
    const matesPayload = matesToSolverPayload(mates, mateSelection);

    try {
      const result = await client.solveAssembly(componentsDict, matesPayload);
      if (result && result.components) {
        // Map back to array
        return components.map(c => result.components[c.id] || c);
      }
      return components;
    } catch (err) {
      console.error('[AssemblyService] Solver failed:', err);
      return components;
    }
  }
}