import os

file_path = r"C:\Users\3kids\Downloads\3D-Builder\electron\renderer.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Update appAPI and add shortcut listeners
old_app_api = """export const appAPI = {
  /**
   * ?踐瘙?嗉??叟 URL
   */
  openExternal: async (url: string): Promise<{ success: boolean }> => {
    if (window.electronAPI) {
      return await window.electronAPI.app.openExternal(url);
    }
    return { success: false };
  },
};"""

new_app_api = """export const appAPI = {
  /**
   * ?踐瘙?嗉??叟 URL
   */
  openExternal: async (url: string): Promise<{ success: boolean }> => {
    if (window.electronAPI) {
      return await window.electronAPI.app.openExternal(url);
    }
    return { success: false };
  },
  
  /**
   * Show a system notification
   */
  notify: async (title: string, body: string): Promise<void> => {
    if (window.electronAPI) {
      await window.electronAPI.app.notify(title, body);
    }
  },
};

/**
 * Listener for file association opening
 */
export const onFileOpen = (callback: (path: string) => void): (() => void) => {
  if (window.electronAPI) {
    return window.electronAPI.onFileOpen(callback);
  }
  return () => {};
};

/**
 * Listener for global Save shortcut
 */
export const onSaveRequest = (callback: () => void): (() => void) => {
  if (window.electronAPI) {
    return window.electronAPI.onSaveRequest(callback);
  }
  return () => {};
};

/**
 * Listener for global New File shortcut
 */
export const onNewFile = (callback: () => void): (() => void) => {
  if (window.electronAPI) {
    return window.electronAPI.onNewFile(callback);
  }
  return () => {};
};"""

if "onFileOpen" not in content:
    content = content.replace(old_app_api, new_app_api)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("renderer.ts updated")
