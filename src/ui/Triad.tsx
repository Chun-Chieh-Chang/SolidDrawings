'use client';

import React from 'react';

/**
 * Triad — SW2010-style XYZ axis indicator at bottom-left of viewport.
 * X=Red, Y=Green, Z=Blue with axis labels.
 */
export const Triad: React.FC = () => {
  return (
    <div className="absolute bottom-3 left-3 z-50 pointer-events-none select-none">
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        {/* X axis — Red */}
        <line x1="4" y1="22" x2="32" y2="22" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
        <polygon points="32,18 38,22 32,26" fill="#EF4444" />

        {/* Y axis — Green */}
        <line x1="22" y1="40" x2="22" y2="12" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" />
        <polygon points="18,12 22,6 26,12" fill="#22C55E" />

        {/* Z axis — Blue */}
        <line x1="22" y1="22" x2="36" y2="36" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
        <polygon points="33,33 39,39 36,40 35,37" fill="#3B82F6" />

        {/* Labels */}
        <text x="30" y="16" fontSize="9" fontWeight="700" fill="#EF4444" fontFamily="Segoe UI, sans-serif">X</text>
        <text x="24" y="8" fontSize="9" fontWeight="700" fill="#22C55E" fontFamily="Segoe UI, sans-serif">Y</text>
        <text x="36" y="34" fontSize="9" fontWeight="700" fill="#3B82F6" fontFamily="Segoe UI, sans-serif">Z</text>
      </svg>
    </div>
  );
};
