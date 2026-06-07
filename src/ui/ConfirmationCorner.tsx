'use client';

import React, { useState, useEffect } from 'react';
import { useCadStore } from '../store/useCadStore';

export const ConfirmationCorner: React.FC = () => {
  const { 
    isSketchMode, setSketchMode, 
    editingFeatureId, setEditingFeatureId,
    pendingFeatureCommand, setPendingFeatureCommand,
    selectedId, setSelectedId
  } = useCadStore();

  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  // Listen for 'D' key to move confirmation corner to mouse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'd' || e.key === 'D') && (isSketchMode || editingFeatureId)) {
         // This is a bit tricky since we need mouse coords from the window
         // We can use a global window variable set by Viewport
         const mouse = (window as any).__lastMousePos || { x: 100, y: 100 };
         setPosition({ x: mouse.x, y: mouse.y });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSketchMode, editingFeatureId]);

  if (!isSketchMode && !editingFeatureId) return null;

  const handleConfirm = () => {
    if (isSketchMode) {
      setSketchMode(false);
    } else if (editingFeatureId) {
      const confirmHook = (window as any).__handleConfirmFeature;
      if (confirmHook) confirmHook();
      setEditingFeatureId(null);
      setPendingFeatureCommand(null);
      setSelectedId(null);
    }
    setPosition(null);
  };

  const handleCancel = () => {
    if (isSketchMode) {
      setSketchMode(false);
      // In a real CAD we might want to revert sketch changes
    } else if (editingFeatureId) {
      const cancelHook = (window as any).__handleCancelFeature;
      if (cancelHook) cancelHook();
      setEditingFeatureId(null);
      setPendingFeatureCommand(null);
      setSelectedId(null);
    }
    setPosition(null);
  };

  const style: React.CSSProperties = position 
    ? { position: 'fixed', left: position.x, top: position.y, transform: 'translate(-50%, -50%)' }
    : { position: 'absolute', top: '20px', right: '20px' };

  return (
    <div 
      className="z-[1200] flex gap-2 animate-in fade-in duration-300 pointer-events-auto"
      style={style}
    >
      <button 
        onClick={handleConfirm}
        className="w-10 h-10 rounded-full bg-emerald-500/80 hover:bg-emerald-600 text-white shadow-xl flex items-center justify-center border-2 border-white/50 backdrop-blur-sm transition-all hover:scale-110 active:scale-95 group"
        title="Confirm (D key)"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </button>
      <button 
        onClick={handleCancel}
        className="w-10 h-10 rounded-full bg-red-500/80 hover:bg-red-600 text-white shadow-xl flex items-center justify-center border-2 border-white/50 backdrop-blur-sm transition-all hover:scale-110 active:scale-95"
        title="Cancel"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
};
