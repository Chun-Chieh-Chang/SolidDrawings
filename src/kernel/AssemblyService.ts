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

  /**
   * Suggests a mate type and alignment based on selected topologies.
   */
  public async suggestMate(
    selections: { componentId: string; features: any[]; subshapeId: string }[]
  ): Promise<{ type: string; alignment: 'ALIGNED' | 'ANTI_ALIGNED' }> {
    if (selections.length !== 2) return { type: 'COINCIDENT', alignment: 'ANTI_ALIGNED' };

    const client = HeavyEngineClient.getInstance();
    const results = await Promise.all(
      selections.map(s => client.analyzeTopology(s.features, s.subshapeId))
    );

    const [t1, t2] = results;

    let type = 'COINCIDENT';
    let alignment: 'ALIGNED' | 'ANTI_ALIGNED' = 'ANTI_ALIGNED';

    // Smart logic: If both are cylindrical/circular, suggest CONCENTRIC
    if (
      (t1.type === 'CYLINDRICAL_FACE' || t1.type === 'CIRCULAR_EDGE') &&
      (t2.type === 'CYLINDRICAL_FACE' || t2.type === 'CIRCULAR_EDGE')
    ) {
      type = 'CONCENTRIC';
      
      // Auto-Flip heuristic: if normals (axes) are already roughly aligned, keep ALIGNED, else ANTI_ALIGNED
      if (t1.axis && t2.axis) {
        const dot = t1.axis[0] * t2.axis[0] + t1.axis[1] * t2.axis[1] + t1.axis[2] * t2.axis[2];
        alignment = dot >= 0 ? 'ALIGNED' : 'ANTI_ALIGNED';
      }
    }

    return { type, alignment };
  }
}