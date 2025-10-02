// electron/database-simple.ts
import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { MiningSession, MiningStatSnapshot, OverallStats, MiningStats } from '../src/types/mining';

interface DatabaseData {
  sessions: MiningSession[];
  stats: MiningStatSnapshot[];
}

export class SimpleMiningDatabase {
  private dbPath: string;
  private data: DatabaseData = { sessions: [], stats: [] };

  constructor() {
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'mining-data.json');

    // Add this log to see where your file is located
    console.log('Database file location:', this.dbPath);
    
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.dbPath)) {
        const fileData = fs.readFileSync(this.dbPath, 'utf-8');
        this.data = JSON.parse(fileData);
      }
    } catch (error) {
      console.log('Creating new database file');
      this.data = { sessions: [], stats: [] };
    }
  }

  private save(): void {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Failed to save database:', error);
    }
  }

  async startSession(): Promise<number> {
    const session: MiningSession = {
      id: Date.now(),
      start_time: new Date().toISOString(),
      end_time: null,
      total_hashes: 0,
      accepted_hashes: 0,
      hashes_per_second: 0,
      status: 'running'
    };
    
    this.data.sessions.push(session);
    this.save();
    return session.id;
  }

  async stopSession(sessionId: number): Promise<void> {
    const session = this.data.sessions.find((s: MiningSession) => s.id === sessionId);
    if (session) {
      session.end_time = new Date().toISOString();
      session.status = 'stopped';
      this.save();
    }
  }

  async updateSessionStats(sessionId: number, stats: MiningStats): Promise<void> {
    const session = this.data.sessions.find((s: MiningSession) => s.id === sessionId);
    if (session) {
      session.total_hashes = stats.totalHashes;
      session.accepted_hashes = stats.acceptedHashes;
      session.hashes_per_second = stats.hashesPerSecond;
      this.save();
    }
  }

  async addStatsSnapshot(sessionId: number, hashesPerSecond: number, totalHashes: number): Promise<void> {
    const stat: MiningStatSnapshot = {
      id: Date.now(),
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      hashes_per_second: hashesPerSecond,
      total_hashes: totalHashes
    };
    
    this.data.stats.push(stat);
    this.save();
  }

  async getSessions(): Promise<MiningSession[]> {
    return this.data.sessions.sort((a: MiningSession, b: MiningSession) => 
      new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    );
  }

  async getSessionStats(sessionId: number): Promise<MiningStatSnapshot[]> {
    return this.data.stats
      .filter((stat: MiningStatSnapshot) => stat.session_id === sessionId)
      .sort((a: MiningStatSnapshot, b: MiningStatSnapshot) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
  }

  async getOverallStats(): Promise<OverallStats> {
    const sessions = this.data.sessions;
    const totalHashes = sessions.reduce((sum: number, s: MiningSession) => sum + s.total_hashes, 0);
    const acceptedHashes = sessions.reduce((sum: number, s: MiningSession) => sum + s.accepted_hashes, 0);
    const avgHashRate = sessions.length > 0 ? 
      sessions.reduce((sum: number, s: MiningSession) => sum + s.hashes_per_second, 0) / sessions.length : 0;

    return {
      total_sessions: sessions.length,
      total_hashes: totalHashes,
      accepted_hashes: acceptedHashes,
      avg_hash_rate: avgHashRate
    };
  }

  async close(): Promise<void> {
    // Nothing to close for file-based storage
  }
}