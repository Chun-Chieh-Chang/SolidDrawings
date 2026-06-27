'use client';

import React from 'react';

interface ConfirmationCornerProps {
  /** True when sketch or feature command is active */
  active: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

/**
 * Confirmation Corner — SW2010-style green check / red X at top-right of viewport.
 * Passive state: grayed-out (no active command).
 * Active state: green check, red X (during sketch/feature command).
 */
export const ConfirmationCorner: React.FC<ConfirmationCornerProps> = ({
  active,
  onConfirm,
  onCancel,
}) => {
  return (
    <div
      className="absolute top-2 right-2 z-50 flex items-center border rounded-sm overflow-hidden transition-opacity duration-200"
      style={{
        borderColor: active ? '#B0B0B0' : '#D0D0D0',
        background: active ? '#FFFFFF' : '#F5F5F5',
        opacity: active ? 1 : 0.5,
        height: '22px',
      }}
    >
      {/* Green check / Confirm */}
      <button
        onClick={(e) => { e.stopPropagation(); onConfirm?.(); }}
        title={active ? 'Confirm (Enter)' : ''}
        className={`w-[26px] h-full flex items-center justify-center transition-colors ${
          active
            ? 'text-[#2E7D32] hover:bg-[#E8F5E9] cursor-pointer'
            : 'text-[#C0C0C0] cursor-default'
        }`}
        tabIndex={-1}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </button>

      {/* Divider */}
      <div className="w-px h-3" style={{ background: active ? '#D0D0D0' : '#E0E0E0' }} />

      {/* Red X / Cancel */}
      <button
        onClick={(e) => { e.stopPropagation(); onCancel?.(); }}
        title={active ? 'Cancel (Esc)' : ''}
        className={`w-[26px] h-full flex items-center justify-center transition-colors ${
          active
            ? 'text-[#C62828] hover:bg-[#FFEBEE] cursor-pointer'
            : 'text-[#C0C0C0] cursor-default'
        }`}
        tabIndex={-1}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
};
