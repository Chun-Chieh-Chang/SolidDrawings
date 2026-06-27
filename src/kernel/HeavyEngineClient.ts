import { CAD_API } from '@/lib/cad-api';

// Re-export for backward compatibility with existing imports
export interface FaceMetadata {
  id: string;
  area: number;
  v_count: number;
  curvature?: string;
  index_range: [number, number];
}

export interface MeshData {
  vertices: number[];
  indices: number[];
  normals: number[];
  colors?: number[];
  face_metadata?: FaceMetadata[];
}

export interface RebuildMeshPayload {
  type: string;
  data: MeshData;
  ref_geometry?: unknown[];
  warnings?: { feature?: string; code?: string; message: string }[];
}

export class RebuildError extends Error {
  constructor(
    message: string,
    public readonly detail?: string,
  ) {
    super(message);
    this.name = 'RebuildError';
  }
}

export interface CADFeature {
  id: string;
  type: string;
  parameters: any;
  color?: string;
}

export class HeavyEngineClient {
  private static instance: HeavyEngineClient;
  private baseUrl: string = CAD_API.baseUrl;

  private constructor() {}

  public static getInstance(): HeavyEngineClient {
    if (!HeavyEngineClient.instance) {
      HeavyEngineClient.instance = new HeavyEngineClient();
    }
    return HeavyEngineClient.instance;
  }

  public async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(CAD_API.healthUrl);
      return response.ok;
    } catch {
      return false;
    }
  }

  public async registerComponent(id: string, features: CADFeature[]): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/register_component`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, features }),
      });
      return response.ok;
    } catch (error) {
      console.error('[HeavyEngineClient] Register component error:', error);
      return false;
    }
  }

  public async rebuild(
    features: CADFeature[],
    deflection: number = 0.01,
    signal?: AbortSignal,
    options?: { fromFeatureIndex?: number; featureFingerprint?: string },
  ): Promise<RebuildMeshPayload[]> {
    try {
      const response = await fetch(`${this.baseUrl}/rebuild`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          features,
          deflection,
          fromFeatureIndex: options?.fromFeatureIndex ?? 0,
          featureFingerprint: options?.featureFingerprint,
        }),
        signal,
      });
      if (!response.ok) {
        let detail = '';
        try {
          const body = await response.json();
          detail = typeof body?.detail === 'string' ? body.detail : JSON.stringify(body);
        } catch {
          detail = await response.text().catch(() => '');
        }
        throw new RebuildError(detail || `Rebuild failed (${response.status})`, detail);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof RebuildError) throw error;
      if ((error as Error).name === 'AbortError') throw error;
      console.error('[HeavyEngineClient] Rebuild error:', error);
      throw new RebuildError((error as Error).message || 'Rebuild failed');
    }
  }

  public async calculateMassProperties(features: CADFeature[], materialId: string = "GENERIC"): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/mass_properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features, materialId }),
      });
      if (!response.ok) throw new Error('Mass properties failed');
      return await response.json();
    } catch (error) {
      console.error('[HeavyEngineClient] Mass properties error:', error);
      return null;
    }
  }

  public async recognizeDimXpert(features: CADFeature[]): Promise<{ features: any[]; count: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/dimxpert/recognize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features }),
      });
      if (!response.ok) throw new Error('DimXpert recognition failed');
      return await response.json();
    } catch (error) {
      console.error('[HeavyEngineClient] DimXpert recognition error:', error);
      return { features: [], count: 0 };
    }
  }

  public async project(features: CADFeature[], plane: string, sectionPlane?: any): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features, plane, sectionPlane }),
      });
      if (!response.ok) throw new Error('Project failed');
      return await response.json();
    } catch (error) {
      console.error('[HeavyEngineClient] Project error:', error);
      return [];
    }
  }

  public async projectAssembly(components: any[], plane: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/project_assembly`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components, plane }),
      });
      if (!response.ok) throw new Error('Project assembly failed');
      return await response.json();
    } catch (error) {
      console.error('[HeavyEngineClient] Project assembly error:', error);
      return [];
    }
  }

  public async sectionView(features: CADFeature[], cutPlane: any, planeType?: string): Promise<any> {
    try {
      const drawingBaseUrl = this.baseUrl.replace('/geometry', '/drawing');
      const response = await fetch(`${drawingBaseUrl}/section_view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features, cutPlane, planeType: planeType || 'FRONT' }),
      });
      if (!response.ok) throw new Error('Section view failed');
      return await response.json();
    } catch (error) {
      console.error('[HeavyEngineClient] Section view error:', error);
      return { visible_lines: [], hidden_lines: [], section_fill: [], section_line: null };
    }
  }

  public async projectViews(features: CADFeature[]): Promise<Record<string, any[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/project_views`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features }),
      });
      if (!response.ok) throw new Error('Project views failed');
      return await response.json();
    } catch (error) {
      console.error('[HeavyEngineClient] Project views error:', error);
      return { FRONT: [], TOP: [], RIGHT: [] };
    }
  }

  public async exportCadFile(features: CADFeature[], format: string, filepath: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features, format, filepath }),
      });
      const res = await response.json();
      return res.status === 'SUCCESS';
    } catch (error) {
      console.error('[HeavyEngineClient] Export error:', error);
      return false;
    }
  }

  public async analyzeTopology(features: CADFeature[], subshapeId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/analyze_topology`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features, subshape_id: subshapeId }),
      });
      if (!response.ok) throw new Error('Topology analysis failed');
      return await response.json();
    } catch (error) {
      console.error('[HeavyEngineClient] Topology analysis error:', error);
      return { type: 'UNKNOWN' };
    }
  }

  public async solveSketch(nodes: any, edges: any, constraints: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/solve_sketch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges, constraints }),
      });
      if (!response.ok) throw new Error('Solve sketch failed');
      return await response.json();
    } catch (error) {
      console.error('[HeavyEngineClient] Solve sketch error:', error);
      throw error;
    }
  }

  public async solveAssembly(components: any, mates: any[]): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/solve_assembly`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components, mates }),
      });
      if (!response.ok) throw new Error('Solve assembly failed');
      return await response.json();
    } catch (error) {
      console.error('[HeavyEngineClient] Solve assembly error:', error);
      throw error;
    }
  }

  public async checkInterferences(components: any[]): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/check_interferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components }),
      });
      if (!response.ok) throw new Error('Interference check failed');
      return await response.json();
    } catch (error) {
      console.error('[HeavyEngineClient] Interference detection error:', error);
      return [];
    }
  }

  public async exportAssemblyStep(components: any[], filename: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/export_assembly/step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components, filename }),
      });
      if (!response.ok) throw new Error('Export assembly failed');
      const res = await response.json();
      return res.status === 'SUCCESS';
    } catch (error) {
      console.error('[HeavyEngineClient] Export assembly error:', error);
      return false;
    }
  }

  public async uploadStepFile(file: File): Promise<{ filepath: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${this.baseUrl}/upload_step`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to upload STEP file');
      }
      return await response.json();
    } catch (error) {
      console.error('[HeavyEngineClient] STEP upload error:', error);
      throw error;
    }
  }

  public async convertEntities(features: CADFeature[], topology: any, planeType: string, faceOrigin?: number[], faceNormal?: number[]): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/convert_entities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features, topology, planeType, faceOrigin, faceNormal }),
      });
      if (!response.ok) throw new Error('Convert entities failed');
      const data = await response.json();
      return data.points || [];
    } catch (error) {
      console.error('[HeavyEngineClient] Convert entities error:', error);
      throw error;
    }
  }

  public async offsetEntities(points2D: number[][], distance: number, planeType: string, faceOrigin?: number[], faceNormal?: number[]): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/offset_entities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points2D, distance, planeType, faceOrigin, faceNormal }),
      });
      if (!response.ok) throw new Error('Offset entities failed');
      const data = await response.json();
      return data.points || [];
    } catch (error) {
      console.error('[HeavyEngineClient] Offset entities error:', error);
      throw error;
    }
  }

  public async createEdgeFlange(params: {
    base_feature_id: string;
    edge_ref: string;
    flange_height: number;
    bend_radius: number;
    bend_angle: number;
    thickness: number;
    k_factor?: number;
    direction: 'INSIDE' | 'OUTSIDE';
    relief_type?: string;
  }): Promise<{ success: boolean; shapeHash?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/edge_flange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        const err = await response.text();
        return { success: false, error: err };
      }
      const data = await response.json();
      return { success: true, shapeHash: data.shape_hash };
    } catch (error: any) {
      console.error('[HeavyEngineClient] Edge flange error:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  public async createMiterFlange(params: {
    base_feature_id: string;
    edge_refs: string[];
    flange_height: number;
    bend_radius: number;
    bend_angle: number;
    thickness: number;
    k_factor?: number;
    direction: 'INSIDE' | 'OUTSIDE';
    corner_angle?: number;
  }): Promise<{ success: boolean; shapeHash?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/miter_flange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        const err = await response.text();
        return { success: false, error: err };
      }
      const data = await response.json();
      return { success: true, shapeHash: data.shape_hash };
    } catch (error: any) {
      console.error('[HeavyEngineClient] Miter flange error:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  public async createHem(params: {
    edge_ref: string;
    hem_length: number;
    hem_radius: number;
    thickness: number;
    hem_type?: 'CLOSED' | 'OPEN' | 'TEARDROP';
    gap?: number;
  }): Promise<{ success: boolean; shapeHash?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/hem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        const err = await response.text();
        return { success: false, error: err };
      }
      const data = await response.json();
      return { success: true, shapeHash: data.shape_hash };
    } catch (error: any) {
      console.error('[HeavyEngineClient] Hem error:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  public async createBoundarySurface(params: {
    features: Array<{ id: string; type: string; parameters: Record<string, any> }>;
    boundary_curves: Array<{ points: number[][] }>;
    continuity?: string;
  }): Promise<{ success: boolean; shapeHash?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/boundary_surface`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        const err = await response.text();
        return { success: false, error: err };
      }
      const data = await response.json();
      return { success: true, shapeHash: data.shape_hash };
    } catch (error: any) {
      console.error('[HeavyEngineClient] Boundary surface error:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  public async createTrimSurface(params: {
    features: Array<{ id: string; type: string; parameters: Record<string, any> }>;
    trim_curve: { points: number[][] };
    keep_side?: string;
  }): Promise<{ success: boolean; shapeHash?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/trim_surface`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        const err = await response.text();
        return { success: false, error: err };
      }
      const data = await response.json();
      return { success: true, shapeHash: data.shape_hash };
    } catch (error: any) {
      console.error('[HeavyEngineClient] Trim surface error:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  public async createFormingTool(params: {
    tool_type: string;
    width: number;
    height: number;
    depth: number;
    radius: number;
    angle: number;
    thickness: number;
    direction: string;
  }): Promise<{ success: boolean; shapeHash?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/forming_tool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        const err = await response.text();
        return { success: false, error: err };
      }
      const data = await response.json();
      return { success: true, shapeHash: data.shape_hash };
    } catch (error: any) {
      console.error('[HeavyEngineClient] Forming tool error:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  public async createFlatPattern(params: {
    features: Array<{ id: string; type: string; parameters: Record<string, any> }>;
    k_factor?: number;
    thickness?: number;
  }): Promise<{ success: boolean; shapeHash?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/flat_pattern`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        const err = await response.text();
        return { success: false, error: err };
      }
      const data = await response.json();
      return { success: true, shapeHash: data.shape_hash };
    } catch (error: any) {
      console.error('[HeavyEngineClient] Flat pattern error:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  /** Unfold: selectively flatten specific bends. */
  public async createUnfold(params: {
    features: Array<{ id: string; type: string; parameters: Record<string, any> }>;
    bend_ids?: string[];
    k_factor?: number;
    thickness?: number;
  }): Promise<{ success: boolean; shapeHash?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/unfold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        const err = await response.text();
        return { success: false, error: err };
      }
      const data = await response.json();
      return { success: true, shapeHash: data.shape_hash };
    } catch (error: any) {
      console.error('[HeavyEngineClient] Unfold error:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  /** Fold: re-fold previously unfolded bends. */
  public async createFold(params: {
    features: Array<{ id: string; type: string; parameters: Record<string, any> }>;
    bend_ids: string[];
    k_factor?: number;
    thickness?: number;
  }): Promise<{ success: boolean; shapeHash?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/fold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        const err = await response.text();
        return { success: false, error: err };
      }
      const data = await response.json();
      return { success: true, shapeHash: data.shape_hash };
    } catch (error: any) {
      console.error('[HeavyEngineClient] Fold error:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }
}
