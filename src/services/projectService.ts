/**
 * ProjectService — Project Persistence Layer
 * 
 * Provides Save / Load / New capabilities for 3D-Builder projects.
 * Uses the File System Access API (showSaveFilePicker / showOpenFilePicker)
 * with graceful fallback to Blob-download for unsupported browsers.
 * 
 * File format: .3db.json (versioned JSON)
 */

const PROJECT_VERSION = '1.0.0';
const FILE_EXTENSION = '.3db.json';

export interface ProjectFile {
  version: string;
  name: string;
  createdAt: string;
  modifiedAt: string;
  features: any[];
  sketchNodes: Record<string, any>;
  sketchEdges: Record<string, any>;
  sketchConstraints: Record<string, any>;
  components: any[];
  mates: any[];
  configurations: any[];
  activeConfigurationId: string;
  globalVariables: Record<string, string>;
  viewState: {
    activePlane: string | null;
    viewportDisplayMode: string;
    partMaterial: string;
    environmentMap: string;
  };
  metadata: {
    drawingScale: string;
    drawnBy: string;
    approvedBy: string;
  };
}

// Keep a handle for "Save" (overwrite same file) after initial "Save As"
let _currentFileHandle: FileSystemFileHandle | null = null;

/**
 * Serialize current store state into a ProjectFile object.
 */
export function serializeProject(state: any): ProjectFile {
  return {
    version: PROJECT_VERSION,
    name: state.projectName || 'Untitled',
    createdAt: state._projectCreatedAt || new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    features: state.features || [],
    sketchNodes: state.sketchNodes || {},
    sketchEdges: state.sketchEdges || {},
    sketchConstraints: state.sketchConstraints || {},
    components: state.components || [],
    mates: state.mates || [],
    configurations: state.configurations || [],
    activeConfigurationId: state.activeConfigurationId || 'default',
    globalVariables: state.globalVariables || {},
    viewState: {
      activePlane: state.activePlane,
      viewportDisplayMode: state.viewportDisplayMode || 'SHADED_EDGES',
      partMaterial: state.partMaterial || 'Steel',
      environmentMap: state.environmentMap || 'studio',
    },
    metadata: {
      drawingScale: state.drawingScale || '1:1',
      drawnBy: state.drawnBy || '',
      approvedBy: state.approvedBy || '',
    },
  };
}

/**
 * Validate a parsed ProjectFile. Returns null if valid, error message otherwise.
 */
export function validateProjectFile(data: any): string | null {
  if (!data || typeof data !== 'object') return 'Invalid file format: not a JSON object.';
  if (!data.version) return 'Invalid file format: missing version field.';
  if (!data.features || !Array.isArray(data.features)) return 'Invalid file format: missing features array.';
  // Version compatibility check
  const [major] = data.version.split('.').map(Number);
  const [currentMajor] = PROJECT_VERSION.split('.').map(Number);
  if (major > currentMajor) return `File version ${data.version} is newer than supported ${PROJECT_VERSION}. Please update 3D-Builder.`;
  return null;
}

/**
 * Deserialize a ProjectFile into partial store state.
 */
export function deserializeProject(project: ProjectFile): Record<string, any> {
  return {
    projectName: project.name,
    _projectCreatedAt: project.createdAt,
    features: project.features,
    sketchNodes: project.sketchNodes || {},
    sketchEdges: project.sketchEdges || {},
    sketchConstraints: project.sketchConstraints || {},
    components: project.components || [],
    mates: project.mates || [],
    configurations: project.configurations || [{ id: 'default', name: 'Default', featureSuppression: {}, parameterOverrides: {} }],
    activeConfigurationId: project.activeConfigurationId || 'default',
    globalVariables: project.globalVariables || {},
    activePlane: project.viewState?.activePlane || null,
    viewportDisplayMode: project.viewState?.viewportDisplayMode || 'SHADED_EDGES',
    partMaterial: project.viewState?.partMaterial || 'Steel',
    environmentMap: project.viewState?.environmentMap || 'studio',
    drawingScale: project.metadata?.drawingScale || '1:1',
    drawnBy: project.metadata?.drawnBy || '',
    approvedBy: project.metadata?.approvedBy || '',
    // Trigger rebuild
    rebuildDirty: true,
    dirtyFromFeatureIndex: 0,
    // Clear transient state
    isDirty: false,
    lastSavedAt: new Date().toISOString(),
    projectFilePath: null,
  };
}

/**
 * Check if File System Access API is supported.
 */
function hasFileSystemAccess(): boolean {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window;
}

/**
 * Save project to file.
 * - If a file handle exists (from previous Save/Open), overwrites.
 * - Otherwise prompts "Save As" dialog.
 */
export async function saveProject(state: any, forceNewFile = false): Promise<{ success: boolean; filename?: string; error?: string }> {
  try {
    const project = serializeProject(state);
    const jsonStr = JSON.stringify(project, null, 2);

    if (hasFileSystemAccess() && !forceNewFile && _currentFileHandle) {
      // Overwrite existing file
      const writable = await _currentFileHandle.createWritable();
      await writable.write(jsonStr);
      await writable.close();
      return { success: true, filename: _currentFileHandle.name };
    }

    if (hasFileSystemAccess()) {
      // Show Save As picker
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: `${project.name}${FILE_EXTENSION}`,
        types: [{
          description: '3D-Builder Project',
          accept: { 'application/json': [FILE_EXTENSION] },
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(jsonStr);
      await writable.close();
      _currentFileHandle = handle;
      return { success: true, filename: handle.name };
    }

    // Fallback: Blob download
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}${FILE_EXTENSION}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { success: true, filename: `${project.name}${FILE_EXTENSION}` };

  } catch (err: any) {
    if (err?.name === 'AbortError') return { success: false, error: 'Save cancelled by user.' };
    return { success: false, error: err?.message || 'Unknown save error.' };
  }
}

/**
 * Save As — always prompts for a new file location.
 */
export async function saveProjectAs(state: any): Promise<{ success: boolean; filename?: string; error?: string }> {
  _currentFileHandle = null;
  return saveProject(state, true);
}

/**
 * Open a project file from disk.
 */
export async function openProject(): Promise<{ success: boolean; data?: Record<string, any>; filename?: string; error?: string }> {
  try {
    let jsonStr: string;
    let filename: string;

    if (hasFileSystemAccess()) {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [{
          description: '3D-Builder Project',
          accept: { 'application/json': [FILE_EXTENSION, '.json'] },
        }],
        multiple: false,
      });
      const file = await handle.getFile();
      jsonStr = await file.text();
      filename = handle.name;
      _currentFileHandle = handle;
    } else {
      // Fallback: file input
      const result = await new Promise<{ text: string; name: string }>((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = `${FILE_EXTENSION},.json`;
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) { reject(new Error('No file selected.')); return; }
          const text = await file.text();
          resolve({ text, name: file.name });
        };
        input.click();
      });
      jsonStr = result.text;
      filename = result.name;
    }

    // Parse with corruption guard
    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return { success: false, error: 'File is corrupted: invalid JSON. Try a backup file.' };
    }

    const validationError = validateProjectFile(parsed);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const storeData = deserializeProject(parsed as ProjectFile);
    return { success: true, data: storeData, filename };

  } catch (err: any) {
    if (err?.name === 'AbortError') return { success: false, error: 'Open cancelled by user.' };
    return { success: false, error: err?.message || 'Unknown open error.' };
  }
}

/**
 * Reset state for a new project. Clears the current file handle.
 */
export function getNewProjectState(): Record<string, any> {
  _currentFileHandle = null;
  return {
    projectName: 'Untitled Project',
    _projectCreatedAt: new Date().toISOString(),
    features: [],
    sketchNodes: {},
    sketchEdges: {},
    sketchConstraints: {},
    components: [],
    mates: [],
    configurations: [{ id: 'default', name: 'Default', featureSuppression: {}, parameterOverrides: {} }],
    activeConfigurationId: 'default',
    globalVariables: {},
    activePlane: null,
    editingFeatureId: null,
    selectedId: null,
    rollbackIndex: null,
    rebuildDirty: true,
    dirtyFromFeatureIndex: 0,
    isDirty: false,
    lastSavedAt: null,
    projectFilePath: null,
    meshData: [],
    computedRefGeometry: [],
    referencePlanes: [],
    referenceAxes: [],
    referencePoints: [],
    history: { past: [], future: [] },
  };
}

/**
 * Get the current file handle name (if any).
 */
export function getCurrentFileName(): string | null {
  return _currentFileHandle?.name || null;
}
