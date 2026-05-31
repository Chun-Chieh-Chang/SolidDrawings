'use client';

import React from 'react';
import { Billboard, Html } from '@react-three/drei';
import { useCadStore } from '../store/useCadStore';

export const MassPropertiesSymbol: React.FC = () => {
  const { massProperties } = useCadStore();

  if (!massProperties || !massProperties.center_of_mass) return null;

  const [x, y, z] = massProperties.center_of_mass;

  return (
    <group position={[x, y, z]}>
      <Billboard>
        <Html center>
          <div className="relative w-8 h-8 flex items-center justify-center pointer-events-none select-none">
            {/* SW Style COM Icon (Circle with sectors) */}
            <svg width="32" height="32" viewBox="0 0 32 32" className="drop-shadow-md">
              <circle cx="16" cy="16" r="14" fill="white" stroke="#1E293B" strokeWidth="1.5" />
              <path d="M16 16 L16 2 A14 14 0 0 1 30 16 Z" fill="#1E293B" />
              <path d="M16 16 L2 16 A14 14 0 0 1 16 30 Z" fill="#1E293B" />
              <circle cx="16" cy="16" r="1.5" fill="red" />
            </svg>
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/80 text-white text-[9px] font-mono px-1.5 py-0.5 rounded border border-white/20">
              COM: {x.toFixed(2)}, {y.toFixed(2)}, {z.toFixed(2)}
            </div>
          </div>
        </Html>
      </Billboard>
      {/* Dynamic Axis crosshair in 3D */}
      <mesh>
        <boxGeometry args={[10, 0.2, 0.2]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.4} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.2, 10, 0.2]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.4} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.2, 0.2, 10]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.4} />
      </mesh>
    </group>
  );
};
