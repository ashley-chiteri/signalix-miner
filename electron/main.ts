import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { autoUpdater } from 'electron-updater';
//import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import log from 'electron-log'
import { electronApp, is } from '@electron-toolkit/utils'
import { SimpleMiningDatabase } from './database-simple'

//const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let db: SimpleMiningDatabase

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC ?? RENDERER_DIST, 'favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: !is.dev, // Enable webSecurity in production for security
    },
  })
 
  win.setMenu(null);

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (db) {
      db.close()
    }
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('before-quit', () => {
  if (db) {
    db.close()
  }
})

// --- AUTO-UPDATER LOGIC ---
const setupAutoUpdater = () => {
  log.transports.file.level = 'info';
  autoUpdater.logger = log;

  autoUpdater.autoDownload = false;

  autoUpdater.on('update-available', (info) => {
    console.log('⬆️ Update available:', info.version);
    if (win) {
      dialog.showMessageBox(win, {
        type: 'info',
        title: 'Update Available',
        message: `A new version of Signalix Miner (${info.version}) is available. Do you want to download it now?`,
        buttons: ['Download Now', 'Later'],
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.downloadUpdate();
          if (win) {
            dialog.showMessageBox(win, {
              type: 'info',
              title: 'Downloading Update',
              message: 'Downloading update in the background. You will be prompted when it\'s ready to install.',
              buttons: ['OK'],
            });
          }
        }
      });
    }
  });

  autoUpdater.on('update-not-available', () => {
    console.log('No updates available.');
  });

  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = `Download speed: ${progressObj.bytesPerSecond}`;
    log_message += ` - Downloaded ${progressObj.percent}%`;
    log_message += ` (${progressObj.transferred}/${progressObj.total})`;
    console.log(log_message);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('⬇️ Update downloaded:', info.version);
    if (win) {
      dialog.showMessageBox(win, {
        type: 'info',
        title: 'Update Ready',
        message: 'The update has been downloaded. Restart Signalix Miner to apply the update.',
        buttons: ['Restart Now', 'Later'],
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    }
  });

  autoUpdater.on('error', (error) => {
    console.error('❌ Update Error:', error);
    if (win) {
      dialog.showErrorBox('Update Error', `Failed to check for updates: ${error.message}`);
    }
  });

  autoUpdater.checkForUpdates();
};
// --- END AUTO-UPDATER LOGIC ---

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron');

  db = new SimpleMiningDatabase()
  createWindow()

   if (!VITE_DEV_SERVER_URL) {
    setupAutoUpdater();
  }
})

// Database IPC handlers
ipcMain.handle('database-start-session', async () => {
  return db.startSession()
})

ipcMain.handle('database-stop-session', async (_event, sessionId: number) => {
  db.stopSession(sessionId)
  return { success: true }
})

interface SessionStats {
  hashesPerSecond: number
  totalHashes: number
  acceptedHashes: number
  [key: string]: unknown
}

ipcMain.handle('database-update-stats', async (_event, sessionId: number, stats: SessionStats) => {
  db.updateSessionStats(sessionId, stats)
  return { success: true }
})

ipcMain.handle('database-add-stats-snapshot', async (_event, sessionId: number, hashesPerSecond: number, totalHashes: number) => {
  db.addStatsSnapshot(sessionId, hashesPerSecond, totalHashes)
  return { success: true }
})

ipcMain.handle('database-get-sessions', async () => {
  return db.getSessions()
})

ipcMain.handle('database-get-session-stats', async (_event, sessionId: number) => {
  return db.getSessionStats(sessionId)
})

ipcMain.handle('database-get-overall-stats', async () => {
  return db.getOverallStats()
})
