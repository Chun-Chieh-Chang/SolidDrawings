/**
 * AssemblyPhysicsService.ts
 * Bridge between CAD Assembly structure and Rapier3D physics engine.
 */

import RAPIER from '@dimforge/rapier3d-compat';
import { CADComponent, CADMate } from '../store/useCadStore';

export class AssemblyPhysicsService {
  private static instance: AssemblyPhysicsService;
  private world: RAPIER.World | null = null;
  private rigidBodies: Map<string, RAPIER.RigidBody> = new Map();
  private initialized: boolean = false;

  private constructor() {}

  public static getInstance(): AssemblyPhysicsService {
    if (!AssemblyPhysicsService.instance) {
      AssemblyPhysicsService.instance = new AssemblyPhysicsService();
    }
    return AssemblyPhysicsService.instance;
  }

  public async init() {
    if (this.initialized) return;
    await RAPIER.init();
    this.world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });
    this.initialized = true;
    console.log('[Physics] Rapier3D World Initialized.');
  }

  public reset() {
    if (!this.world) return;
    this.world.free();
    this.world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });
    this.rigidBodies.clear();
  }

  public syncAssembly(components: CADComponent[], mates: CADMate[]) {
    if (!this.world) return;
    this.reset();

    // 1. Create Rigid Bodies
    components.forEach(comp => {
      if (!comp.visible) return;

      const bodyDesc = comp.isFixed 
        ? RAPIER.RigidBodyDesc.fixed() 
        : RAPIER.RigidBodyDesc.dynamic();
      
      bodyDesc.setTranslation(comp.transform.position[0], comp.transform.position[1], comp.transform.position[2]);
      // Note: Rotation conversion would go here (Quaternion)
      
      const body = this.world!.createRigidBody(bodyDesc);
      
      // Add a simple box collider based on bounding box (or placeholder)
      const colliderDesc = RAPIER.ColliderDesc.cuboid(10, 10, 10); // Default placeholder
      this.world!.createCollider(colliderDesc, body);
      
      this.rigidBodies.set(comp.id, body);
    });

    // 2. Map Mates to Joints
    mates.forEach(mate => {
      const body1 = this.rigidBodies.get(mate.entity1.componentId);
      const body2 = this.rigidBodies.get(mate.entity2.componentId);

      if (!body1 || !body2) return;

      if (mate.type === 'COINCIDENT' || mate.type === 'CONCENTRIC') {
        // Map to Ball/Hinge joint at local anchor points
        const anchor1 = { x: 0, y: 0, z: 0 }; // Should be derived from localOrigin
        const anchor2 = { x: 0, y: 0, z: 0 };
        
        const params = RAPIER.JointData.spherical(anchor1, anchor2);
        this.world!.createImpulseJoint(params, body1, body2, true);
      }
    });
  }

  public step() {
    if (!this.world) return;
    this.world.step();
  }

  public getTransform(componentId: string) {
    const body = this.rigidBodies.get(componentId);
    if (!body) return null;
    return {
      position: body.translation(),
      rotation: body.rotation()
    };
  }
}
