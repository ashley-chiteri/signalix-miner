// electron-env.d.ts
/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    APP_ROOT: string
    VITE_PUBLIC: string
  }
}

import { MiningSession, MiningStatSnapshot, OverallStats, MiningStats } from './src/types/mining';

interface Window {
  electronAPI: {
    database: {
      startSession: () => Promise<number>
      stopSession: (sessionId: number) => Promise<{ success: boolean }>
      updateStats: (sessionId: number, stats: MiningStats) => Promise<{ success: boolean }>
      addStatsSnapshot: (sessionId: number, hashesPerSecond: number, totalHashes: number) => Promise<{ success: boolean }>
      getSessions: () => Promise<MiningSession[]>
      getSessionStats: (sessionId: number) => Promise<MiningStatSnapshot[]>
      getOverallStats: () => Promise<OverallStats>
    }
    ipcRenderer: {
      on: (channel: string, func: (...args: unknown[]) => void) => void
      off: (channel: string, func: (...args: unknown[]) => void) => void
      send: (channel: string, ...args: unknown[]) => void
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
    }
  }
}