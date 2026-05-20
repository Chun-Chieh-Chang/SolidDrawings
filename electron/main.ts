/**
 * Electron Main Process
 * 這是 Electron 桌面應用的主進程，負責：
 * 1. 建立應用程式視窗
 * 2. 管理應用程式生命週期
 * 3. 處理原生 API (檔案系統、對話框等)
 * 4. IPC 通訊 (與 Renderer Process 通訊)
 */

import { app, BrowserWindow, ipcMain, dialog, shell, IpcMainInvokeEvent, globalShortcut, Notification } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// 檢查是否為開發模式
const isDev = !app.isPackaged;

// 保存視窗引用，避免被垃圾回收
let mainWindow: BrowserWindow | null = null;

// Handle file open from command line
const getFilePathFromArgs = () => {
  if (process.platform === 'win32' && process.argv.length >= (isDev ? 2 : 1)) {
    const filePath = process.argv[isDev ? 2 : 1];
    if (filePath && fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
      return filePath;
    }
  }
  return null;
};

// 建立視窗
function createWindow() {
  // 建立瀏覽器視窗
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1280,
    minHeight: 720,
    backgroundColor: '#EBEBEB', // SolidWorks 淺色主題
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: false,
      sandbox: true,
    },
    icon: path.join(__dirname, '../assets/icon.ico'),
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
  });

  // 載入應用程式
  if (isDev) {
    // 開發模式：載入 Next.js 開發伺服器
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // 生產模式：載出靜態檔案
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
  }

  // 視窗關閉事件
    mainWindow.webContents.on('did-finish-load', () => {
    const filePath = getFilePathFromArgs();
    if (filePath) {
      mainWindow?.webContents.send('file:open-path', filePath);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 檔案系統操作 IPC handlers
ipcMain.handle('file:open', async (event: IpcMainInvokeEvent) => {
  const result = (await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [
      { name: 'CAD Files', extensions: ['step', 'stl', 'iges', 'igs'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })) as any;

  if (!result.canceled && result.filePaths.length > 0) {
    return { path: result.filePaths[0] };
  }
  return null;
});

ipcMain.handle('file:save', async (event: IpcMainInvokeEvent, data: string) => {
  const result = (await dialog.showSaveDialog(mainWindow!, {
    filters: [
      { name: 'STEP Files', extensions: ['step'] },
      { name: 'STL Files', extensions: ['stl'] },
      { name: 'IGES Files', extensions: ['iges', 'igs'] },
    ],
  })) as any;

  if (!result.canceled && result.filePath) {
    try {
      await fs.promises.writeFile(result.filePath, data);
      return { success: true, path: result.filePath };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
  return null;
});

ipcMain.handle('file:read', async (event: IpcMainInvokeEvent, filePath: string) => {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('app:open-external', async (event: IpcMainInvokeEvent, url: string) => {
  await shell.openExternal(url);
  return { success: true };
});

// 應用程式生命週期
app.whenReady().then(() => {
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
  });

  app.on('activate', () => {
    // macOS: 點擊 dock 圖示時重新建立視窗
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // 非 macOS: 所有視窗關閉時退出應用
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // macOS: 點擊 dock 圖示時重新建立視窗
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 清理資源
app.on('before-quit', () => {
  // 可以在這裡保存應用程式狀態
});
