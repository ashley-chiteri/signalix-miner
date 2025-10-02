// src/types/mining.ts
export interface MiningStats {
  hashesPerSecond: number;
  totalHashes: number;
  acceptedHashes: number;
}

export interface MiningSession {
  id: number;
  start_time: string;
  end_time: string | null;
  total_hashes: number;
  accepted_hashes: number;
  hashes_per_second: number;
  status: 'running' | 'stopped';
}

export interface MiningStatSnapshot {
  id: number;
  session_id: number;
  timestamp: string;
  hashes_per_second: number;
  total_hashes: number;
}

export interface OverallStats {
  total_sessions: number;
  total_hashes: number;
  accepted_hashes: number;
  avg_hash_rate: number;
}