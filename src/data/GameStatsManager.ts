import { ECONOMY, bankReward } from './economy';
import type { DifficultyId } from './difficulty';
export interface GameRunStats {
  runId?: string;
  /** Cash was already committed during gameplay; results must not deposit it again. */
  walletSynced?: boolean;
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
  economyVersion: number;
  bank: number;
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
  consumables?: Record<string, number>;
}

const STORAGE_KEY = 'sunset_survivors_stats_v1';

export class GameStatsManager {
  private stats: CumulativeGameStats;

  constructor() {
    this.stats = this.loadStats();
    this.saveStats();
  }

  private loadStats(serialized?: string): CumulativeGameStats {
    const fresh: CumulativeGameStats = {
      economyVersion: 1, bank: 0, totalScore: 0, totalKills: 0, goldCollected: 0, playTimeSeconds: 0,
      stagesCleared: 0, deaths: 0, bestStreak: 0, unlockedBosses: [1], unlockedCharacters: ['steve', 'billy'],
    };
    try {
      const raw = serialized ?? localStorage.getItem(STORAGE_KEY);
      if (!raw) return fresh;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return fresh;
      const migrated = { ...fresh, ...parsed } as CumulativeGameStats;
      for (const key of ['bank','totalScore','totalKills','goldCollected','playTimeSeconds','stagesCleared','deaths','bestStreak'] as const) {
        const value = migrated[key]; migrated[key] = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
      }
      migrated.unlockedBosses = Array.isArray(parsed.unlockedBosses) ? parsed.unlockedBosses.filter((id: unknown) => Number.isInteger(id) && Number(id) >= 1 && Number(id) <= 8) : [1];
      migrated.recordedRunIds = Array.isArray(parsed.recordedRunIds) ? parsed.recordedRunIds.filter((id: unknown) => typeof id === 'string') : [];
      const rawConsumables = parsed.consumables && typeof parsed.consumables === 'object' ? parsed.consumables : {};
      const validConsumables: Record<string, number> = {};
      for (const [key, qty] of Object.entries(rawConsumables)) {
        if (typeof qty === 'number' && Number.isFinite(qty) && qty > 0) {
          validConsumables[key] = Math.floor(qty);
        }
      }
      migrated.consumables = validConsumables;
      if (parsed.economyVersion !== 1) {
        // Former builds auto-granted all heroes. No hero purchases existed; credit past earned cash once instead.
        migrated.bank = Math.floor(migrated.goldCollected * ECONOMY.bank.cashFraction);
        migrated.unlockedCharacters = ['steve', 'billy']; migrated.economyVersion = 1;
      } else migrated.unlockedCharacters = [...new Set(['steve', 'billy', ...(Array.isArray(parsed.unlockedCharacters) ? parsed.unlockedCharacters.filter((id: string) => id === 'bob' || id === 'cormano') : [])])];
      return migrated;
    } catch { return fresh; }
  }

  public saveStats(): boolean {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.stats)); return true; } catch { return false; }
  }
  /** Read committed state before transactions, including changes made in another tab. */
  public refresh(): void { this.stats = this.loadStats(); }
  public exportProgress(): string {
    this.refresh();
    return JSON.stringify({ game: 'sunset-survivors', version: 1, savedAt: new Date().toISOString(), stats: this.getStats() }, null, 2);
  }
  public importProgress(serialized: string): 'saved' | 'invalid' | 'save-failed' {
    try {
      if (serialized.length > 5_000_000) return 'invalid';
      const backup = JSON.parse(serialized);
      const data = backup?.stats;
      if (backup?.game !== 'sunset-survivors' || backup.version !== 1 || !data || data.economyVersion !== 1 ||
        !Number.isSafeInteger(data.bank) || data.bank < 0 || !Array.isArray(data.unlockedCharacters) ||
        data.unlockedCharacters.some((id: unknown) => !['steve','billy','bob','cormano'].includes(String(id))) ||
        !Array.isArray(data.recordedRunIds)) return 'invalid';
      this.refresh(); const previous = this.getStats();
      this.stats = this.loadStats(JSON.stringify(data));
      if (!this.saveStats()) { this.stats = previous; return 'save-failed'; }
      return 'saved';
    } catch { return 'invalid'; }
  }
  public getStats(): CumulativeGameStats {
    return {
      ...this.stats,
      unlockedCharacters: [...this.stats.unlockedCharacters],
      unlockedBosses: [...this.stats.unlockedBosses],
      recordedRunIds: [...(this.stats.recordedRunIds ?? [])],
      consumables: { ...(this.stats.consumables ?? {}) },
    };
  }

  public getConsumables(): Record<string, number> {
    this.refresh();
    return { ...(this.stats.consumables ?? {}) };
  }

  public getConsumableCount(id: string): number {
    this.refresh();
    return this.stats.consumables?.[id] ?? 0;
  }

  public buyConsumable(id: string, price: number): 'bought' | 'insufficient' | 'save-failed' {
    this.refresh();
    if (this.stats.bank < price) return 'insufficient';
    const previous = this.getStats();
    this.stats.bank -= price;
    this.stats.consumables ??= {};
    this.stats.consumables[id] = (this.stats.consumables[id] ?? 0) + 1;
    if (!this.saveStats()) {
      this.stats = previous;
      return 'save-failed';
    }
    return 'bought';
  }

  public useConsumable(id: string): boolean {
    this.refresh();
    const count = this.stats.consumables?.[id] ?? 0;
    if (count <= 0) return false;
    const previous = this.getStats();
    this.stats.consumables ??= {};
    if (count <= 1) {
      delete this.stats.consumables[id];
    } else {
      this.stats.consumables[id] = count - 1;
    }
    if (!this.saveStats()) {
      this.stats = previous;
      return false;
    }
    return true;
  }
  public isCharacterUnlocked(id: string): boolean { this.refresh(); return this.stats.unlockedCharacters.includes(id); }
  public buyCharacter(id: string): 'bought' | 'owned' | 'insufficient' | 'save-failed' | 'invalid' {
    this.refresh();
    if (this.stats.unlockedCharacters.includes(id)) return 'owned';
    if (id !== 'bob' && id !== 'cormano') return 'invalid';
    const price = ECONOMY.characters[id];
    if (this.stats.bank < price) return 'insufficient';
    const previous = this.getStats();
    this.stats.bank -= price; this.stats.unlockedCharacters.push(id);
    if (!this.saveStats()) { this.stats = previous; return 'save-failed'; }
    return 'bought';
  }

  /** One shared wallet for stage cash, services and permanent unlocks. */
  public changeBalance(amount: number): number | undefined {
    if (!Number.isSafeInteger(amount)) return undefined;
    this.refresh();
    const previous=this.getStats(), next=this.stats.bank+amount;
    if (!Number.isSafeInteger(next) || next<0) return undefined;
    this.stats.bank=next;
    if (!this.saveStats()) {this.stats=previous;return undefined;}
    return next;
  }

  public recordRun(run: GameRunStats, isVictory: boolean): number {
    this.refresh();
    const previous = this.getStats();
    if (run.runId && this.stats.recordedRunIds?.includes(run.runId)) return 0;
    if (run.runId) this.stats.recordedRunIds = [...this.stats.recordedRunIds ?? [], run.runId];
    const deposited = run.runId ? bankReward(run.walletSynced ? 0 : run.gold, run.timeSurvivedSeconds, isVictory, run.difficulty) : 0;
    this.stats.bank += deposited;
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

    if (!this.saveStats()) { this.stats = previous; return 0; }
    return deposited;
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
