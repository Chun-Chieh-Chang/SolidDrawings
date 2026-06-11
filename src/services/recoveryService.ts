/**
 * RecoveryService — Auto-Save & Auto-Recovery via IndexedDB
 * 
 * Periodically snapshots the CadStore into IndexedDB for crash recovery.
 * On app startup, checks for orphaned sessions and offers recovery.
 */

const DB_NAME = '3d-builder-recovery';
const DB_VERSION = 1;
const STORE_NAME = 'auto_saves';
const MAX_BACKUPS = 10;
const SESSION_KEY = '3db_session_id';

interface AutoSaveEntry {
  id: string;            // session_timestamp
  sessionId: string;     // unique session identifier
  timestamp: number;     // Date.now()
  projectName: string;
  featureCount: number;
  stateJson: string;     // compressed store snapshot
  wasCleanClose: boolean;
}

/**
 * Open (or create) the recovery database.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('sessionId', 'sessionId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generate or retrieve the current session ID.
 */
export function getSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Save a snapshot of the current store state to IndexedDB.
 */
export async function saveAutoSnapshot(state: any): Promise<void> {
  try {
    const db = await openDB();
    const sessionId = getSessionId();
    const entry: AutoSaveEntry = {
      id: `${sessionId}_${Date.now()}`,
      sessionId,
      timestamp: Date.now(),
      projectName: state.projectName || 'Untitled',
      featureCount: state.features?.length || 0,
      stateJson: JSON.stringify({
        projectName: state.projectName,
        features: state.features,
        sketchNodes: state.sketchNodes,
        sketchEdges: state.sketchEdges,
        sketchConstraints: state.sketchConstraints,
        components: state.components,
        mates: state.mates,
        configurations: state.configurations,
        activeConfigurationId: state.activeConfigurationId,
        globalVariables: state.globalVariables,
        activePlane: state.activePlane,
        viewportDisplayMode: state.viewportDisplayMode,
        partMaterial: state.partMaterial,
        environmentMap: state.environmentMap,
        drawingScale: state.drawingScale,
        drawnBy: state.drawnBy,
        approvedBy: state.approvedBy,
      }),
      wasCleanClose: false,
    };

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    await new Promise<void>((resolve, reject) => {
      const req = store.put(entry);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Prune old entries for this session (keep only MAX_BACKUPS)
    const allKeys: string[] = await new Promise((resolve, reject) => {
      const idx = store.index('sessionId');
      const range = IDBKeyRange.only(sessionId);
      const req = idx.getAllKeys(range);
      req.onsuccess = () => resolve(req.result as string[]);
      req.onerror = () => reject(req.error);
    });

    if (allKeys.length > MAX_BACKUPS) {
      const toDelete = allKeys.slice(0, allKeys.length - MAX_BACKUPS);
      for (const key of toDelete) {
        store.delete(key);
      }
    }

    db.close();
  } catch (err) {
    console.warn('[RecoveryService] Auto-save failed:', err);
  }
}

/**
 * Mark the current session as cleanly closed.
 */
export async function markCleanClose(): Promise<void> {
  try {
    const db = await openDB();
    const sessionId = getSessionId();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const idx = store.index('sessionId');

    const entries: AutoSaveEntry[] = await new Promise((resolve, reject) => {
      const req = idx.getAll(IDBKeyRange.only(sessionId));
      req.onsuccess = () => resolve(req.result as AutoSaveEntry[]);
      req.onerror = () => reject(req.error);
    });

    for (const entry of entries) {
      entry.wasCleanClose = true;
      store.put(entry);
    }

    db.close();
  } catch (err) {
    console.warn('[RecoveryService] markCleanClose failed:', err);
  }
}

/**
 * Check for recoverable sessions (sessions that were NOT cleanly closed).
 * Returns the most recent auto-save from each orphaned session.
 */
export async function getRecoverableSessions(): Promise<Array<{
  sessionId: string;
  timestamp: number;
  projectName: string;
  featureCount: number;
  stateJson: string;
}>> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const currentSessionId = getSessionId();

    const allEntries: AutoSaveEntry[] = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as AutoSaveEntry[]);
      req.onerror = () => reject(req.error);
    });

    db.close();

    // Group by session, find orphaned ones
    const sessionMap = new Map<string, AutoSaveEntry[]>();
    for (const entry of allEntries) {
      if (entry.sessionId === currentSessionId) continue; // Skip current
      if (!sessionMap.has(entry.sessionId)) sessionMap.set(entry.sessionId, []);
      sessionMap.get(entry.sessionId)!.push(entry);
    }

    const recoverable: Array<{
      sessionId: string;
      timestamp: number;
      projectName: string;
      featureCount: number;
      stateJson: string;
    }> = [];

    for (const [sessionId, entries] of sessionMap) {
      // If any entry in this session is NOT cleanly closed, it's recoverable
      const hasUnclean = entries.some(e => !e.wasCleanClose);
      if (hasUnclean) {
        // Get the most recent entry
        const latest = entries.sort((a, b) => b.timestamp - a.timestamp)[0];
        recoverable.push({
          sessionId,
          timestamp: latest.timestamp,
          projectName: latest.projectName,
          featureCount: latest.featureCount,
          stateJson: latest.stateJson,
        });
      }
    }

    return recoverable.sort((a, b) => b.timestamp - a.timestamp);
  } catch (err) {
    console.warn('[RecoveryService] getRecoverableSessions failed:', err);
    return [];
  }
}

/**
 * Delete all auto-saves for a given session.
 */
export async function clearSession(sessionId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const idx = store.index('sessionId');

    const keys: string[] = await new Promise((resolve, reject) => {
      const req = idx.getAllKeys(IDBKeyRange.only(sessionId));
      req.onsuccess = () => resolve(req.result as string[]);
      req.onerror = () => reject(req.error);
    });

    for (const key of keys) {
      store.delete(key);
    }

    db.close();
  } catch (err) {
    console.warn('[RecoveryService] clearSession failed:', err);
  }
}

/**
 * Purge all recovery data older than a given age (in ms). Default: 7 days.
 */
export async function purgeOldData(maxAgeMs = 7 * 24 * 60 * 60 * 1000): Promise<void> {
  try {
    const db = await openDB();
    const cutoff = Date.now() - maxAgeMs;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const idx = store.index('timestamp');

    const oldKeys: string[] = await new Promise((resolve, reject) => {
      const range = IDBKeyRange.upperBound(cutoff);
      const req = idx.getAllKeys(range);
      req.onsuccess = () => resolve(req.result as string[]);
      req.onerror = () => reject(req.error);
    });

    for (const key of oldKeys) {
      store.delete(key);
    }

    db.close();
  } catch (err) {
    console.warn('[RecoveryService] purgeOldData failed:', err);
  }
}
