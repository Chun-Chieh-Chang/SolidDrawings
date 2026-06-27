'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { CadToastItem, CadToastType } from '../store/types';

interface ToastContextValue {
  toasts: CadToastItem[];
  pushToast: (message: string, type?: CadToastType, duration?: number) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/**
 * ToastProvider manages the global toast notification system.
 * Each toast auto-dismisses after a configurable duration.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<CadToastItem[]>([]);

  const pushToast = useCallback((message: string, type: CadToastType = 'info', duration: number = 5000) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const toast: CadToastItem = { id, message, type };
    
    setToasts(prev => [...prev, toast]);

    // Auto-dismiss after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, pushToast, dismissToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

/**
 * ToastContainer renders all active toasts with animations.
 */
function ToastContainer() {
  const { toasts, dismissToast } = useToastContext();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[10000] flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={() => dismissToast(toast.id)} />
      ))}
    </div>
  );
}

/**
 * ToastItem renders a single toast notification.
 */
function ToastItem({ toast, onClose }: { toast: CadToastItem; onClose: () => void }) {
  const typeStyles: Record<CadToastType, { bg: string; border: string; icon: React.ReactNode; text: string }> = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      ),
    },
  };

  const style = typeStyles[toast.type];

  return (
    <div className={`${style.bg} ${style.border} border rounded-lg shadow-lg p-3 flex items-start gap-3 animate-in fade-in slide-in-from-right-4 duration-300`}>
      <div className={`${style.text} mt-0.5 flex-shrink-0`}>{style.icon}</div>
      <p className={`text-sm flex-1 ${style.text} font-medium`}>{toast.message}</p>
      <button
        onClick={onClose}
        className={`${style.text} opacity-60 hover:opacity-100 transition-opacity flex-shrink-0`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Hook to access the toast context.
 */
function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}
