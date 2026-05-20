import os

file_path = r"C:\Users\3kids\Downloads\3D-Builder\electron\main.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add globalShortcut and Notification to imports
if "globalShortcut, Notification" not in content:
    content = content.replace(
        "import { app, BrowserWindow, ipcMain, dialog, shell, IpcMainInvokeEvent } from 'electron';",
        "import { app, BrowserWindow, ipcMain, dialog, shell, IpcMainInvokeEvent, globalShortcut, Notification } from 'electron';"
    )

# Add shortcut registration in whenReady
old_ready = """app.whenReady().then(() => {
  createWindow();"""

new_ready = """app.whenReady().then(() => {
  createWindow();

  // Register Global Shortcuts
  globalShortcut.register('CommandOrControl+O', () => {
    ipcMain.emit('file:open', { sender: mainWindow?.webContents } as any);
  });

  globalShortcut.register('CommandOrControl+S', () => {
    mainWindow?.webContents.send('file:save-request');
  });

  globalShortcut.register('CommandOrControl+N', () => {
    mainWindow?.webContents.send('app:new-file');
  });"""

if "globalShortcut.register" not in content:
    content = content.replace(old_ready, new_ready)

# Add notification handler
notify_handler = """ipcMain.handle('app:notify', (event: IpcMainInvokeEvent, title: string, body: string) => {
  new Notification({ title, body }).show();
});\n\n"""

if "app:notify" not in content:
    content = content.replace("// ?伍??賹??", notify_handler + "// ?伍??賹??")

# Handle file open from command line (Windows/Linux)
file_open_handler = """// Handle file open from command line
const getFilePathFromArgs = () => {
  if (process.platform === 'win32' && process.argv.length >= (isDev ? 2 : 1)) {
    const filePath = process.argv[isDev ? 2 : 1];
    if (filePath && fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
      return filePath;
    }
  }
  return null;
};"""

if "getFilePathFromArgs" not in content:
    content = content.replace("let mainWindow: BrowserWindow | null = null;", "let mainWindow: BrowserWindow | null = null;\n\n" + file_open_handler)

# Send file path to renderer after window load
did_finish_load = """  mainWindow.webContents.on('did-finish-load', () => {
    const filePath = getFilePathFromArgs();
    if (filePath) {
      mainWindow?.webContents.send('file:open-path', filePath);
    }
  });"""

if "did-finish-load" not in content:
    content = content.replace("mainWindow.on('closed'", did_finish_load + "\n\n  mainWindow.on('closed'")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("main.ts updated with shortcuts and file handling")
