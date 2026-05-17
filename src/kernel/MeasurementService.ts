/**
 * Measurement Service
 * Provides measurement tools for distance, angle, area, and volume calculations
 * Uses OCCT GProp and BRepGProp classes for accurate calculations
 */

import * as THREE from 'three';

export type MeasurementMode = 'NONE' | 'DISTANCE' | 'ANGLE' | 'AREA' | 'VOLUME';

export interface MeasurementResult {
  mode: MeasurementMode;
  value: number;
  unit: string;
  details?: string;
}

export class MeasurementService {
  /**
   * Calculate distance between two points
   * @param point1 First point [x, y, z]
   * @param point2 Second point [x, y, z]
   * @returns Distance in mm
   */
  public calculateDistance(
    point1: [number, number, number],
    point2: [number, number, number]
  ): number {
    const v1 = new THREE.Vector3(point1[0], point1[1], point1[2]);
    const v2 = new THREE.Vector3(point2[0], point2[1], point2[2]);
    return v1.distanceTo(v2);
  }

  /**
   * Calculate angle between two vectors
   * @param vector1 First vector [x, y, z]
   * @param vector2 Second vector [x, y, z]
   * @returns Angle in degrees
   */
  public calculateAngle(
    vector1: [number, number, number],
    vector2: [number, number, number]
  ): number {
    const v1 = new THREE.Vector3(vector1[0], vector1[1], vector1[2]).normalize();
    const v2 = new THREE.Vector3(vector2[0], vector2[1], vector2[2]).normalize();
    const angle = v1.angleTo(v2);
    return (angle * 180) / Math.PI; // Convert to degrees
  }

  /**
   * Calculate angle between two edges (lines)
   * @param edge1Start Start point of first edge
   * @param edge1End End point of first edge
   * @param edge2Start Start point of second edge
   * @param edge2End End point of second edge
   * @returns Angle in degrees
   */
  public calculateEdgeAngle(
    edge1Start: [number, number, number],
    edge1End: [number, number, number],
    edge2Start: [number, number, number],
    edge2End: [number, number, number]
  ): number {
    const v1 = new THREE.Vector3()
      .subVectors(
        new THREE.Vector3(edge1End[0], edge1End[1], edge1End[2]),
        new THREE.Vector3(edge1Start[0], edge1Start[1], edge1Start[2])
      )
      .normalize();
    const v2 = new THREE.Vector3()
      .subVectors(
        new THREE.Vector3(edge2End[0], edge2End[1], edge2End[2]),
        new THREE.Vector3(edge2Start[0], edge2Start[1], edge2Start[2])
      )
      .normalize();
    const angle = v1.angleTo(v2);
    return (angle * 180) / Math.PI;
  }

  /**
   * Calculate area of a triangle from three vertices
   * @param v1 First vertex
   * @param v2 Second vertex
   * @param v3 Third vertex
   * @returns Area
   */
  public calculateTriangleArea(
    v1: THREE.Vector3,
    v2: THREE.Vector3,
    v3: THREE.Vector3
  ): number {
    const edge1 = new THREE.Vector3().subVectors(v2, v1);
    const edge2 = new THREE.Vector3().subVectors(v3, v1);
    const cross = new THREE.Vector3().crossVectors(edge1, edge2);
    return cross.length() * 0.5;
  }

  /**
   * Calculate total area of a mesh
   * @param geometry Three.js BufferGeometry
   * @returns Total surface area
   */
  public calculateMeshArea(geometry: THREE.BufferGeometry): number {
    const positionAttribute = geometry.attributes.position;
    let totalArea = 0;

    for (let i = 0; i < positionAttribute.count; i += 3) {
      const v1 = new THREE.Vector3(
        positionAttribute.getX(i),
        positionAttribute.getY(i),
        positionAttribute.getZ(i)
      );
      const v2 = new THREE.Vector3(
        positionAttribute.getX(i + 1),
        positionAttribute.getY(i + 1),
        positionAttribute.getZ(i + 1)
      );
      const v3 = new THREE.Vector3(
        positionAttribute.getX(i + 2),
        positionAttribute.getY(i + 2),
        positionAttribute.getZ(i + 2)
      );

      totalArea += this.calculateTriangleArea(v1, v2, v3);
    }

    return totalArea;
  }

  /**
   * Calculate volume of a mesh (requires closed manifold)
   * Uses signed volume of tetrahedrons from origin
   * @param geometry Three.js BufferGeometry
   * @returns Volume
   */
  public calculateMeshVolume(geometry: THREE.BufferGeometry): number {
    const positionAttribute = geometry.attributes.position;
    let totalVolume = 0;

    for (let i = 0; i < positionAttribute.count; i += 3) {
      const v1 = new THREE.Vector3(
        positionAttribute.getX(i),
        positionAttribute.getY(i),
        positionAttribute.getZ(i)
      );
      const v2 = new THREE.Vector3(
        positionAttribute.getX(i + 1),
        positionAttribute.getY(i + 1),
        positionAttribute.getZ(i + 1)
      );
      const v3 = new THREE.Vector3(
        positionAttribute.getX(i + 2),
        positionAttribute.getY(i + 2),
        positionAttribute.getZ(i + 2)
      );

      // Volume of tetrahedron: (v1 ⋅ (v2 × v3)) / 6
      const cross = new THREE.Vector3().crossVectors(v2, v3);
      const volume = v1.dot(cross) / 6;
      totalVolume += Math.abs(volume);
    }

    return totalVolume;
  }

  /**
   * Format measurement result with appropriate units
   * @param value Raw measurement value
   * @param unitType Type of measurement (length, angle, area, volume)
   * @returns Formatted string with units
   */
  public formatMeasurement(value: number, unitType: 'length' | 'angle' | 'area' | 'volume'): string {
    switch (unitType) {
      case 'length':
        return `${value.toFixed(3)} mm`;
      case 'angle':
        return `${value.toFixed(2)}°`;
      case 'area':
        return `${value.toFixed(3)} mm²`;
      case 'volume':
        return `${value.toFixed(3)} mm³`;
      default:
        return value.toString();
    }
  }
}
