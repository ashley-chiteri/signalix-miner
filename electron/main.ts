import { app, BrowserWindow, ipcMain } from 'electron'
//import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
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
    icon: path.join(process.env.VITE_PUBLIC ?? RENDERER_DIST, 'favicon.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
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

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
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

app.whenReady().then(() => {
  db = new SimpleMiningDatabase()
  createWindow()
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
