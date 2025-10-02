// electron/preload.ts
import { ipcRenderer, contextBridge } from 'electron'

// Types for our database API
interface Session {
  id: number;
  startedAt: string;
  endedAt?: string;
  // Add other session properties as needed
}

interface DatabaseAPI {
  startSession: () => Promise<number>
  stopSession: (sessionId: number) => Promise<{ success: boolean }>
  updateStats: (sessionId: number, stats: Record<string, unknown>) => Promise<{ success: boolean }>
  addStatsSnapshot: (sessionId: number, hashesPerSecond: number, totalHashes: number) => Promise<{ success: boolean }>
  getSessions: () => Promise<Session[]>
  getSessionStats: (sessionId: number) => Promise<Record<string, unknown>[]>
  getOverallStats: () => Promise<Record<string, unknown>[]>
}

// Expose protected methods that allow the renderer process to use the ipcRenderer
contextBridge.exposeInMainWorld('electronAPI', {
  database: {
    startSession: () => ipcRenderer.invoke('database-start-session'),
    stopSession: (sessionId: number) => ipcRenderer.invoke('database-stop-session', sessionId),
    updateStats: (sessionId: number, stats: Record<string, unknown>) => ipcRenderer.invoke('database-update-stats', sessionId, stats),
    addStatsSnapshot: (sessionId: number, hashesPerSecond: number, totalHashes: number) => 
      ipcRenderer.invoke('database-add-stats-snapshot', sessionId, hashesPerSecond, totalHashes),
    getSessions: () => ipcRenderer.invoke('database-get-sessions'),
    getSessionStats: (sessionId: number) => ipcRenderer.invoke('database-get-session-stats', sessionId),
    getOverallStats: () => ipcRenderer.invoke('database-get-overall-stats'),
  } as DatabaseAPI,

  // Keep your existing ipcRenderer exposure
  ipcRenderer: {
    on(channel: string, func: (...args: unknown[]) => void) {
      ipcRenderer.on(channel, (_event, ...args) => func(...args))
    },
    off(channel: string, func: (...args: unknown[]) => void) {
      ipcRenderer.removeListener(channel, func)
    },
    send(channel: string, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args)
    },
    invoke(channel: string, ...args: unknown[]) {
      return ipcRenderer.invoke(channel, ...args)
    },
  },
})