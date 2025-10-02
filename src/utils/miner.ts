// src/utils/miner.ts
import { MiningStats } from '../types/mining';

export class SimpleMiner {
  private isRunning: boolean = false;
  private stats: MiningStats = {
    hashesPerSecond: 0,
    totalHashes: 0,
    acceptedHashes: 0
  };
  private miningInterval: NodeJS.Timeout | null = null;

  async startMining(): Promise<void> {
    this.isRunning = true;
    this.stats = { hashesPerSecond: 0, totalHashes: 0, acceptedHashes: 0 };
    this.simulateMining();
  }

  stopMining(): void {
    this.isRunning = false;
    if (this.miningInterval) {
      clearInterval(this.miningInterval);
      this.miningInterval = null;
    }
  }

  private simulateMining(): void {
    this.miningInterval = setInterval(() => {
      if (!this.isRunning) {
        return;
      }
      
      // Simulate realistic mining stats
      const newHashes = Math.random() * 500 + 100; // 100-600 H/s
      this.stats.hashesPerSecond = newHashes;
      this.stats.totalHashes += newHashes;
      this.stats.acceptedHashes = Math.floor(this.stats.totalHashes * 0.92); // 92% acceptance rate
      
      // Update UI through callback
      if (this.onUpdate) {
        this.onUpdate({ ...this.stats });
      }
    }, 1000);
  }

  getCurrentStats(): MiningStats {
    return { ...this.stats };
  }

  onUpdate?: (stats: MiningStats) => void;
}