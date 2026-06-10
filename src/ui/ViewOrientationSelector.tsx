'use client';

import React from 'react';
import { useCadStore } from '../store/useCadStore';
import * as THREE from 'three';
import { gsap } from 'gsap';

export const ViewOrientationSelector: React.FC = () => {
  const { 
    viewOrientationSelectorVisible, 
    setViewOrientationSelectorVisible,
    controls,
    triggerCameraNormal
  } = useCadStore();

  if (!viewOrientationSelectorVisible) return null;

  const VIEWS = [
    { id: 'FRONT', label: 'Front', icon: '🟦', pos: [0, 0, 250] },
    { id: 'BACK', label: 'Back', icon: '⬜', pos: [0, 0, -250] },
    { id: 'TOP', label: 'Top', icon: '🟩', pos: [0, 250, 0], up: [0, 0, -1] },
    { id: 'BOTTOM', label: 'Bottom', icon: '🟨', pos: [0, -250, 0], up: [0, 0, 1] },
    { id: 'LEFT', label: 'Left', icon: '🟧', pos: [-250, 0, 0] },
    { id: 'RIGHT', label: 'Right', icon: '🟥', pos: [250, 0, 0] },
    { id: 'ISOMETRIC', label: 'Isometric', icon: '🧊', isSpecial: true },
    { id: 'NORMAL_TO', label: 'Normal To', icon: '🎯', isSpecial: true },
  ];

  const handleSetView = (view: any) => {
    if (view.id === 'NORMAL_TO') {
      triggerCameraNormal();
    } else if (view.id === 'ISOMETRIC') {
      if (controls) {
        const isoPos = new THREE.Vector3(1, 1, 1).normalize().multiplyScalar(250);
        gsap.to(controls.object.position, { x: isoPos.x, y: isoPos.y, z: isoPos.z, duration: 0.6, ease: 'power2.out', onUpdate: () => controls.update() });
        gsap.to(controls.target, { x: 0, y: 0, z: 0, duration: 0.6 });
      }
    } else if (view.pos && controls) {
      const up = view.up || [0, 1, 0];
      gsap.to(controls.object.position, { 
        x: view.pos[0], y: view.pos[1], z: view.pos[2], 
        duration: 0.6, ease: 'power2.out', 
        onUpdate: () => {
          controls.object.up.set(up[0], up[1], up[2]);
          controls.update();
        }
      });
      gsap.to(controls.target, { x: 0, y: 0, z: 0, duration: 0.6 });
    }
    setViewOrientationSelectorVisible(false);
  };

  return (
    <div 
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/10 backdrop-blur-[2px]"
      onClick={() => setViewOrientationSelectorVisible(false)}
    >
      <div 
        className="bg-white/90 border border-slate-200 rounded-xl shadow-2xl p-4 grid grid-cols-4 gap-3 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {VIEWS.map(v => (
          <button
            key={v.id}
            onClick={() => handleSetView(v)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-all group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">{v.icon}</span>
            <span className="text-[10px] font-black uppercase tracking-tighter">{v.label}</span>
          </button>
        ))}
      </div>
      <div className="absolute bottom-10 text-white font-black text-xs uppercase tracking-[0.2em] animate-pulse">
        Press Space or Click to Close
      </div>
    </div>
  );
};
