'use client';

import React from 'react';

interface RollbackBarProps {
  position?: number;   // 0-1 representing position in feature tree
  enabled?: boolean;
}

/**
 * RollbackBar — thin blue/white gradient bar showing rebuild position.
 * Mimics SOLIDWORKS RollbackBar appearance.
 * Currently UI-only (non-functional).
 */
export const RollbackBar: React.FC<RollbackBarProps> = ({
  position = 1,
  enabled = false,
}) => {
  if (!enabled) return null;

  return (
    <div
      className="relative w-full shrink-0 cursor-pointer group"
      style={{ height: '5px', background: '#E8E8E8', borderTop: '1px solid #C8C8C8' }}
      title="Rollback position — drag to rebuild state"
    >
      {/* Blue gradient indicator bar */}
      <div
        className="absolute top-0 left-0 h-full transition-all duration-150"
        style={{
          width: `${Math.max(position * 100, 5)}%`,
          background: 'linear-gradient(to right, #4A90D9 0%, #6DB3F2 50%, #4A90D9 100%)',
          borderRight: '2px solid #2E6BB5',
        }}
      >
        {/* Drag handle (3 dots) */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-3 flex items-center justify-center gap-[2px] opacity-70 group-hover:opacity-100"
          style={{ background: '#2E6BB5', borderRadius: '0 1px 1px 0' }}
        >
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-[2px] h-[2px] rounded-full bg-white" />
          ))}
        </div>
      </div>
    </div>
  );
};
