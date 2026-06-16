'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCadStore } from '../store/useCadStore';

export const MouseGestureOverlay: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [lastPos, setLastPos] = useState<{ direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'NONE'; distance: number }>({ direction: 'NONE', distance: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const threshold = 30;

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      setIsDragging(true);
      setStartPos({ x: e.clientX, y: e.clientY });
      setLastPos({ direction: 'NONE', distance: 0 });
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      setCurrentPos({ x: e.clientX, y: e.clientY });

      const dx = e.clientX - startPos.x;
      const dy = e.clientY - startPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      let direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'NONE' = 'NONE';
      if (distance >= threshold) {
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const normalizedAngle = ((angle % 360) + 360) % 360;
        
        if (normalizedAngle >= 315 || normalizedAngle < 45) direction = 'RIGHT';
        else if (normalizedAngle >= 45 && normalizedAngle < 135) direction = 'DOWN';
        else if (normalizedAngle >= 135 && normalizedAngle < 225) direction = 'LEFT';
        else direction = 'UP';
      }

      setLastPos({ direction, distance });
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      
      const dx = e.clientX - startPos.x;
      const dy = e.clientY - startPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance >= threshold) {
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const normalizedAngle = ((angle % 360) + 360) % 360;
        
        let direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'NONE' = 'NONE';
        if (normalizedAngle >= 315 || normalizedAngle < 45) direction = 'RIGHT';
        else if (normalizedAngle >= 45 && normalizedAngle < 135) direction = 'DOWN';
        else if (normalizedAngle >= 135 && normalizedAngle < 225) direction = 'LEFT';
        else direction = 'UP';

        // Execute gesture-based command
        if (direction === 'DOWN') {
          useCadStore.getState().setHint('Gesture: Zoom Out');
        } else if (direction === 'UP') {
          useCadStore.getState().setHint('Gesture: Zoom In');
        } else if (direction === 'LEFT') {
          useCadStore.getState().setHint('Gesture: Pan Left');
        } else if (direction === 'RIGHT') {
          useCadStore.getState().setHint('Gesture: Pan Right');
        }
      }

      setIsDragging(false);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('pointerdown', handlePointerDown);
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      if (container) {
        container.removeEventListener('pointerdown', handlePointerDown);
      }
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, startPos]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {children}
      {isDragging && (
        <div 
          className="absolute pointer-events-none z-50 border-2 border-[#005B9A] rounded-full opacity-50"
          style={{
            left: Math.min(startPos.x, currentPos.x) - 25,
            top: Math.min(startPos.y, currentPos.y) - 25,
            width: Math.abs(currentPos.x - startPos.x) + 50,
            height: Math.abs(currentPos.y - startPos.y) + 50,
          }}
        />
      )}
      {lastPos.direction !== 'NONE' && (
        <div className="absolute top-2 right-2 bg-[#005B9A] text-white text-xs font-bold px-2 py-1 rounded z-50">
          Gesture: {lastPos.direction}
        </div>
      )}
    </div>
  );
};
