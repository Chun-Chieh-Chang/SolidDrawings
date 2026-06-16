'use client';

import React from 'react';
import { useCadStore } from '@/store/useCadStore';

const styles: Record<string, string> = {
  error: 'border-red-400 bg-red-50 text-red-900',
  warning: 'border-amber-400 bg-amber-50 text-amber-950',
  info: 'border-slate-300 bg-white text-slate-800',
};

export const CadToast: React.FC = () => {
  const { toasts, dismissToast } = useCadStore();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-10 right-4 z-[200] flex flex-col gap-2 max-w-md pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto shadow-lg border rounded px-3 py-2 text-[11px] font-medium leading-snug flex items-start gap-2 ${styles[t.type] ?? styles.info}`}
          role="alert"
        >
          <span className="flex-1">{t.message}</span>
          <button
            type="button"
            className="shrink-0 text-slate-500 hover:text-slate-800 border-none bg-transparent cursor-pointer text-sm leading-none"
            onClick={() => dismissToast(t.id)}
            aria-label="Deactivate"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};
