export interface MeshData {
  vertices: number[];
  indices: number[];
  normals: number[];
}

export interface BoxParams {
  width: number;
  height: number;
  depth: number;
}

export interface CADFeature {
  id: string;
  type: string;
  parameters: any;
}

export class HeavyEngineClient {
  private static instance: HeavyEngineClient;
  private baseUrl: string = 'http://localhost:8000/api/v1/geometry';

  private constructor() {}

  public static getInstance(): HeavyEngineClient {
    if (!HeavyEngineClient.instance) {
      HeavyEngineClient.instance = new HeavyEngineClient();
    }
    return HeavyEngineClient.instance;
  }

  /**
   * Request a parametric box mesh from the heavy engine.
   */
  public async createBox(params: BoxParams): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/box`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Engine error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[HeavyEngineClient] Failed to create box:', error);
      throw error;
    }
  }

  /**
   * Request an assembly rebuild from the heavy engine.
   */
  public async rebuild(features: CADFeature[]): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/rebuild`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ features }),
      });

      if (!response.ok) {
        throw new Error(`Engine error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[HeavyEngineClient] Failed to rebuild assembly:', error);
      throw error;
    }
  }

  /**
   * Health check for the backend engine.
   */
  public async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:8000/');
      return response.ok;
    } catch {
      return false;
    }
  }
}

