export interface GameRunStats {
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

class GameStatsManager {
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
      totalScore: 48250,
      totalKills: 284,
      goldCollected: 36250,
      playTimeSeconds: 1420,
      stagesCleared: 1,
      deaths: 2,
      bestStreak: 120,
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
    const scoreRating = kills * 50 + (hpPct > 0.8 ? 500 : 200) - Math.floor(timeSec / 2);
    if (scoreRating > 1200) return 'S';
    if (scoreRating > 800) return 'A';
    if (scoreRating > 500) return 'B';
    return 'C';
  }
}

export const statsManager = new GameStatsManager();
