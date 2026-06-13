/**
 * useAssemblyPhysics.ts
 * Hook to manage Rapier3D simulation lifecycle and sync with CAD Store.
 */

import { useEffect, useRef } from 'react';
import { useCadStore } from '../store/useCadStore';
import { AssemblyPhysicsService } from '../services/AssemblyPhysicsService';

export function useAssemblyPhysics() {
  const { isPhysicsActive, components, mates } = useCadStore();
  const physicsService = AssemblyPhysicsService.getInstance();
  const requestRef = useRef<number>(null);

  useEffect(() => {
    if (isPhysicsActive) {
      const startPhysics = async () => {
        await physicsService.init();
        physicsService.syncAssembly(components, mates);
        
        const animate = () => {
          physicsService.step();
          
          // Update component transforms in the store (or just local for performance)
          // For MVP, we'll push back to store periodically or use a separate visual-only state
          // To prevent infinite re-renders, we usually use a ref for the meshes.
          
          requestRef.current = requestAnimationFrame(animate);
        };
        requestRef.current = requestAnimationFrame(animate);
      };
      
      startPhysics();
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      physicsService.reset();
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPhysicsActive]);
}
