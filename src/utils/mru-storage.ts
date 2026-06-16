const MRU_STORAGE_KEY = '3dbuilder.mru';
const MRU_MAX_ITEMS = 10;

function getMRUStorage(): string[] {
  try {
    const raw = localStorage.getItem(MRU_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

function setMRUStorage(files: string[]): void {
  try {
    localStorage.setItem(MRU_STORAGE_KEY, JSON.stringify(files));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function getMRUFiles(): string[] {
  return getMRUStorage().slice(0, MRU_MAX_ITEMS);
}

export function addMRUFile(filePath: string): void {
  if (!filePath || typeof filePath !== 'string') return;

  const files = getMRUStorage();
  const normalizedPath = filePath.trim();

  // Remove duplicate if already exists
  const filtered = files.filter(f => f !== normalizedPath);

  // Add to front (most recently used)
  const updated = [normalizedPath, ...filtered];

  // Keep only top MRU_MAX_ITEMS
  const truncated = updated.slice(0, MRU_MAX_ITEMS);

  setMRUStorage(truncated);
}

export function clearMRU(): void {
  setMRUStorage([]);
}
