import type { DifficultyId } from './difficulty';
export interface GameRunStats {
  runId?: string;
  difficulty?: DifficultyId;
  score: number;
  kills: number;
  gold: number;
  timeSurvivedSeconds: number;
  stage: number;
  stagesCleared: number;
  level: number;
  characterId: string;
  rank: 'S' | 'A' | 'B' | 'C' | 'D';
}

export interface CumulativeGameStats {
  recordedRunIds?: string[];
  totalScore: number;
  totalKills: number;
  goldCollected: number;
  playTimeSeconds: number;
  stagesCleared: number;
  deaths: number;
  bestStreak: number;
  unlockedBosses: number[];
  unlockedCharacters: string[];
}

const STORAGE_KEY = 'sunset_survivors_stats_v1';

export class GameStatsManager {
  private stats: CumulativeGameStats;

  constructor() {
    this.stats = this.loadStats();
  }

  private loadStats(): CumulativeGameStats {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // Fallback
    }

    return {
      totalScore: 0,
      totalKills: 0,
      goldCollected: 0,
      playTimeSeconds: 0,
      stagesCleared: 0,
      deaths: 0,
      bestStreak: 0,
      unlockedBosses: [1],
      unlockedCharacters: ['steve', 'billy', 'bob', 'cormano'],
    };
  }

  public saveStats(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.stats));
    } catch {
      // Ignore
    }
  }

  public getStats(): CumulativeGameStats {
    return { ...this.stats };
  }

  public recordRun(run: GameRunStats, isVictory: boolean): void {
    if (run.runId && this.stats.recordedRunIds?.includes(run.runId)) return;
    if (run.runId) this.stats.recordedRunIds = [...this.stats.recordedRunIds ?? [], run.runId].slice(-128);
    this.stats.totalScore += run.score;
    this.stats.totalKills += run.kills;
    this.stats.goldCollected += run.gold;
    this.stats.playTimeSeconds += run.timeSurvivedSeconds;

    if (isVictory) {
      this.stats.stagesCleared = Math.max(this.stats.stagesCleared, run.stage);
      if (!this.stats.unlockedBosses.includes(run.stage)) {
        this.stats.unlockedBosses.push(run.stage);
      }
      this.stats.bestStreak = Math.max(this.stats.bestStreak, run.kills);
    } else {
      this.stats.deaths += 1;
    }

    this.saveStats();
  }

  public calculateRank(kills: number, timeSec: number, hpPct: number): 'S' | 'A' | 'B' | 'C' {
    const killsPerMinute = kills * 60 / Math.max(60, timeSec);
    if (killsPerMinute >= 90 && hpPct >= 0.75) return 'S';
    if (killsPerMinute >= 60 && hpPct >= 0.5) return 'A';
    if (killsPerMinute >= 35) return 'B';
    return 'C';
  }
}

export const statsManager = new GameStatsManager();
