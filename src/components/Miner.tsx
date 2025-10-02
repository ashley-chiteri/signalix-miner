// src/components/Miner.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useMiningDatabase } from '../hooks/useMiningDatabase';
import { SimpleMiner } from '../utils/miner';
import { MiningStats, MiningSession, OverallStats } from '../types/mining';

const Miner: React.FC = () => {
  const [isMining, setIsMining] = useState<boolean>(false);
  const [stats, setStats] = useState<MiningStats>({
    hashesPerSecond: 0,
    totalHashes: 0,
    acceptedHashes: 0
  });
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [sessions, setSessions] = useState<MiningSession[]>([]);
  
  const miner = React.useRef<SimpleMiner>(new SimpleMiner());
  const {
    currentSessionId,
    startSession,
    stopSession,
    updateStats,
    addStatsSnapshot,
    getSessions,
    getOverallStats
  } = useMiningDatabase();

  const loadSessions = useCallback(async (): Promise<void> => {
    const sessionList = await getSessions();
    setSessions(sessionList);
  }, [getSessions]);

  const loadOverallStats = useCallback(async (): Promise<void> => {
    const stats = await getOverallStats();
    setOverallStats(stats);
  }, [getOverallStats]);

  // Load initial data
  useEffect(() => {
    loadSessions();
    loadOverallStats();
  }, [loadSessions, loadOverallStats]);

  const startMining = async (): Promise<void> => {
    try {
      const sessionId = await startSession();
      setIsMining(true);
      
      // Setup miner callbacks
      miner.current.onUpdate = async (newStats: MiningStats) => {
        setStats(newStats);
        await updateStats(sessionId, newStats);
        await addStatsSnapshot(sessionId, newStats.hashesPerSecond, newStats.totalHashes);
      };

      await miner.current.startMining();
      
    } catch (error) {
      console.error('Failed to start mining session:', error);
    }
  };

  const stopMining = async (): Promise<void> => {
    if (currentSessionId) {
      miner.current.stopMining();
      await stopSession(currentSessionId);
      setIsMining(false);
      setStats({ hashesPerSecond: 0, totalHashes: 0, acceptedHashes: 0 });
      
      // Refresh data
      await loadSessions();
      await loadOverallStats();
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    }
    return num.toFixed(2);
  };

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Crypto Miner Pro
          </h1>
          <p className="text-gray-400 mt-2">Professional Cryptocurrency Mining Application</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mining Control Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-2xl font-semibold mb-4">Mining Control</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {formatNumber(stats.hashesPerSecond)}
                  </div>
                  <div className="text-gray-400 text-sm">Hash Rate (H/s)</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {formatNumber(stats.totalHashes)}
                  </div>
                  <div className="text-gray-400 text-sm">Total Hashes</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {formatNumber(stats.acceptedHashes)}
                  </div>
                  <div className="text-gray-400 text-sm">Accepted Hashes</div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={startMining}
                  disabled={isMining}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                    isMining 
                      ? 'bg-gray-600 cursor-not-allowed' 
                      : 'bg-green-500 hover:bg-green-600 transform hover:scale-105'
                  }`}
                >
                  {isMining ? '⛏️ Mining...' : '🚀 Start Mining'}
                </button>
                <button
                  onClick={stopMining}
                  disabled={!isMining}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                    !isMining 
                      ? 'bg-gray-600 cursor-not-allowed' 
                      : 'bg-red-500 hover:bg-red-600 transform hover:scale-105'
                  }`}
                >
                  Stop Mining
                </button>
              </div>

              {isMining && (
                <div className="mt-4">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${Math.min((stats.hashesPerSecond / 600) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                  <div className="text-center text-sm text-gray-400 mt-2">
                    Mining Intensity: {Math.min(stats.hashesPerSecond / 6, 100).toFixed(1)}%
                  </div>
                </div>
              )}
            </div>

            {/* Overall Statistics */}
            {overallStats && (
              <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
                <h2 className="text-2xl font-semibold mb-4">Overall Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      {overallStats.total_sessions}
                    </div>
                    <div className="text-gray-400 text-sm">Total Sessions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {formatNumber(overallStats.total_hashes)}
                    </div>
                    <div className="text-gray-400 text-sm">Total Hashes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {formatNumber(overallStats.accepted_hashes)}
                    </div>
                    <div className="text-gray-400 text-sm">Accepted Hashes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {formatNumber(overallStats.avg_hash_rate)}
                    </div>
                    <div className="text-gray-400 text-sm">Avg Hash Rate</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Sessions */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Recent Sessions</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sessions.slice(0, 5).map((session) => (
                <div key={session.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      session.status === 'running' 
                        ? 'bg-green-500 text-green-900' 
                        : 'bg-gray-500 text-gray-900'
                    }`}>
                      {session.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(session.start_time)}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div>Hashes: {formatNumber(session.total_hashes)}</div>
                    <div>Rate: {formatNumber(session.hashes_per_second)} H/s</div>
                  </div>
                </div>
              ))}
              {sessions.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No mining sessions yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-6 bg-gray-800 rounded-xl p-4 text-center">
          <div className={`inline-flex items-center px-4 py-2 rounded-full ${
            isMining ? 'bg-green-500 text-green-900' : 'bg-gray-500 text-gray-900'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              isMining ? 'bg-green-900 animate-pulse' : 'bg-gray-900'
            }`}></div>
            Status: {isMining ? 'Mining Active' : 'Ready to Mine'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Miner;