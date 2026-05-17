import * as THREE from 'three';
import { useCadStore } from '../store/useCadStore';

export type TopologyType = 'FACE' | 'EDGE' | 'VERTEX';

export interface SelectedTopology {
  type: TopologyType;
  id: string;
  coordinates: [number, number, number];
  normal?: [number, number, number];
}

export class TopologySelector {
  private raycaster: THREE.Raycaster;
  private scene: THREE.Scene;
  private camera: THREE.Camera;

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.raycaster = new THREE.Raycaster();
    this.scene = scene;
    this.camera = camera;
  }

  /**
   * Select a topology element at the given mouse position
   * @param clientX Mouse X coordinate (0-1 normalized or pixel)
   * @param clientY Mouse Y coordinate (0-1 normalized or pixel)
   * @param normalized Whether coordinates are normalized (0-1) or pixel
   * @returns Selected topology or null
   */
  public selectAtPosition(
    clientX: number,
    clientY: number,
    normalized: boolean = false
  ): SelectedTopology | null {
    // Normalize coordinates if needed
    const x = normalized ? clientX : (clientX / window.innerWidth) * 2 - 1;
    const y = normalized ? clientY : -(clientY / window.innerHeight) * 2 + 1;

    // Update raycaster
    this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);

    // Get all mesh objects in scene
    const meshes = this.scene.children.filter(
      (child): child is THREE.Mesh => child instanceof THREE.Mesh
    );

    // Intersect with meshes
    const intersects = this.raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const mesh = hit.object;

      // Extract topology information from hit
      // For now, we'll mark it as a FACE hit
      // In the future, we can extract edge/vertex info from the hit
      const topology: SelectedTopology = {
        type: 'FACE',
        id: mesh.uuid,
        coordinates: [hit.point.x, hit.point.y, hit.point.z],
        normal: hit.face?.normal
          ? [hit.face.normal.x, hit.face.normal.y, hit.face.normal.z]
          : undefined,
      };

      // Update Zustand state
      useCadStore.getState().setSelectedTopology(topology);

      return topology;
    }

    // Clear selection if nothing hit
    useCadStore.getState().setSelectedTopology(null);
    return null;
  }

  /**
   * Get all topology elements within a selection box
   * @param startX Start X coordinate
   * @param startY Start Y coordinate
   * @param endX End X coordinate
   * @param endY End Y coordinate
   * @returns Array of selected topologies
   */
  public selectInBox(
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): SelectedTopology[] {
    // TODO: Implement box selection
    return [];
  }

  /**
   * Clear current selection
   */
  public clearSelection(): void {
    useCadStore.getState().setSelectedTopology(null);
  }

  /**
   * Get current selection from Zustand
   */
  public getCurrentSelection(): SelectedTopology | null {
    return useCadStore.getState().selectedTopology;
  }
}
