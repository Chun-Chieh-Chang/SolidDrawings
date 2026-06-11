'use client';

import { useEffect, useRef } from 'react';
import { useCadStore } from '../store/useCadStore';
import { saveAutoSnapshot, markCleanClose, purgeOldData } from '../services/recoveryService';

const AUTO_SAVE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * useAutoSave — React hook that:
 * 1. Periodically snapshots the CadStore to IndexedDB
 * 2. Marks clean closure on beforeunload
 * 3. Purges old recovery data on mount
 */
export function useAutoSave() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSavedHash = useRef<string>('');

  useEffect(() => {
    // Purge old data on mount (>7 days)
    purgeOldData().catch(() => {});

    // Periodic auto-save
    intervalRef.current = setInterval(() => {
      const state = useCadStore.getState();

      // Simple dirty check: hash features + sketch length
      const hash = `${state.features.length}_${Object.keys(state.sketchNodes).length}_${state.projectName}`;
      if (hash === lastSavedHash.current) return; // No changes

      saveAutoSnapshot(state).then(() => {
        lastSavedHash.current = hash;
        console.log('[AutoSave] Snapshot saved at', new Date().toLocaleTimeString());
      }).catch(err => {
        console.warn('[AutoSave] Failed:', err);
      });
    }, AUTO_SAVE_INTERVAL_MS);

    // beforeunload: final snapshot + mark clean close
    const handleBeforeUnload = () => {
      const state = useCadStore.getState();
      // Synchronous approach: we can't await here, so fire and forget
      try {
        saveAutoSnapshot(state);
        markCleanClose();
      } catch {
        // Best effort
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Mark clean close on unmount (SPA navigation)
      markCleanClose().catch(() => {});
    };
  }, []);
}
