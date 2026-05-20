import os

file_path = r"C:\Users\3kids\Downloads\3D-Builder\electron\preload.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add notify and more listeners
old_app = """  app: {
    openExternal: (url: string) => ipcRenderer.invoke('app:open-external'),
  },"""

new_app = """  app: {
    openExternal: (url: string) => ipcRenderer.invoke('app:open-external', url),
    notify: (title: string, body: string) => ipcRenderer.invoke('app:notify', title, body),
  },

  // Listeners for shortcuts and file associations
  onFileOpen: (callback: (path: string) => void) => {
    const listener = (_: any, path: string) => callback(path);
    ipcRenderer.on('file:open-path', listener);
    return () => ipcRenderer.off('file:open-path', listener);
  },
  onSaveRequest: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('file:save-request', listener);
    return () => ipcRenderer.off('file:save-request', listener);
  },
  onNewFile: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('app:new-file', listener);
    return () => ipcRenderer.off('app:new-file', listener);
  },"""

if "onFileOpen" not in content:
    content = content.replace(old_app, new_app)

# Update TypeScript declaration
old_decl = """      app: {
        openExternal: (url: string) => Promise<{ success: boolean }>;
      };"""

new_decl = """      app: {
        openExternal: (url: string) => Promise<{ success: boolean }>;
        notify: (title: string, body: string) => Promise<void>;
      };
      onFileOpen: (callback: (path: string) => void) => () => void;
      onSaveRequest: (callback: () => void) => () => void;
      onNewFile: (callback: () => void) => () => void;"""

if "onFileOpen" not in content:
    content = content.replace(old_decl, new_decl)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("preload.ts updated")
