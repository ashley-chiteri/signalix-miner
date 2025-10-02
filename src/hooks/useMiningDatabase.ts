// src/hooks/useMiningDatabase.ts
import { useState, useCallback } from 'react';
import { MiningStats, MiningSession, MiningStatSnapshot, OverallStats } from '../types/mining';

declare global {
  interface Window {
    electronAPI: {
      database: {
        startSession: () => Promise<number>;
        stopSession: (sessionId: number) => Promise<void>;
        updateStats: (sessionId: number, stats: MiningStats) => Promise<void>;
        addStatsSnapshot: (sessionId: number, hashesPerSecond: number, totalHashes: number) => Promise<void>;
        getSessions: () => Promise<MiningSession[]>;
        getSessionStats: (sessionId: number) => Promise<MiningStatSnapshot[]>;
        getOverallStats: () => Promise<OverallStats>;
      };
    };
  }
}

export const useMiningDatabase = () => {
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);

  const startSession = useCallback(async (): Promise<number> => {
    const sessionId = await window.electronAPI.database.startSession();
    setCurrentSessionId(sessionId);
    return sessionId;
  }, []);

  const stopSession = useCallback(async (sessionId: number): Promise<void> => {
    await window.electronAPI.database.stopSession(sessionId);
    setCurrentSessionId(null);
  }, []);

  const updateStats = useCallback(async (sessionId: number, stats: MiningStats): Promise<void> => {
    await window.electronAPI.database.updateStats(sessionId, stats);
  }, []);

  const addStatsSnapshot = useCallback(async (sessionId: number, hashesPerSecond: number, totalHashes: number): Promise<void> => {
    await window.electronAPI.database.addStatsSnapshot(sessionId, hashesPerSecond, totalHashes);
  }, []);

  const getSessions = useCallback(async (): Promise<MiningSession[]> => {
    return await window.electronAPI.database.getSessions();
  }, []);

  const getSessionStats = useCallback(async (sessionId: number): Promise<MiningStatSnapshot[]> => {
    return await window.electronAPI.database.getSessionStats(sessionId);
  }, []);

  const getOverallStats = useCallback(async (): Promise<OverallStats> => {
    return await window.electronAPI.database.getOverallStats();
  }, []);

  return {
    currentSessionId,
    startSession,
    stopSession,
    updateStats,
    addStatsSnapshot,
    getSessions,
    getSessionStats,
    getOverallStats,
  };
};