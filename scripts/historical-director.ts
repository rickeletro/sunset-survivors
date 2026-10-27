/** Frozen seven-minute director used only to reproduce historical player reports. */
export function historicalPhase(stage: {duration:number}, elapsed:number) {
  if(elapsed>=stage.duration)return 'boss';if(elapsed>=stage.duration-60)return 'last-stand';if(elapsed<12)return 'arrival';
  const cycle=elapsed%180;return cycle>=145?'respite':cycle>=105?'surge':'pressure';
}
const stagePhase=historicalPhase;
const pressureMultiplier=(phase:ReturnType<typeof historicalPhase>)=>({arrival:1,pressure:1,surge:1.3,respite:.7,'last-stand':1.45,boss:.5})[phase];
import { ENEMY_DEFS, EnemyDef, EnemyKind } from '../src/data/enemies';
import { getStage, type StageConfig } from '../src/data/stages';
import type { GameEvents } from '../src/systems/GameEvents';

export type SpawnPattern = 'ring' | 'cluster' | 'encircle';
export interface SpawnOrder { kind: EnemyKind; count: number; pattern: SpawnPattern; }
export const MAX_ALIVE = 240;

/** Pure spawn decisions; stage pacing alternates pressure, surges and recovery. */
export class HistoricalDirector {
  private nextSpecialAt = 30;
  private nextEliteAt = 55;
  private specialIndex = 0;
  private eliteCount = 0;
  constructor(private events: GameEvents, private stage: StageConfig = getStage(1), private random = Math.random) {}
  reset() { this.nextSpecialAt = 30; this.nextEliteAt = 55; this.specialIndex = 0; this.eliteCount = 0; }
  targetCount(t: number): number {
    const base = 42 + this.stage.id * 4 + Math.floor(Math.min(t, this.stage.duration) * 0.25);
    return Math.min(MAX_ALIVE, Math.round(base * pressureMultiplier(stagePhase(this.stage, t))));
  }
  intensity(t: number): number { return Math.min(t / this.stage.duration, 1); }
  waveOrders(t: number, alive: number): SpawnOrder[] {
    const deficit = Math.min(MAX_ALIVE - alive, this.targetCount(t) - alive);
    if (deficit <= 0) return [];
    const batch = Math.min(deficit, 8 + Math.floor(t / 45));
    const pool = (Object.values(ENEMY_DEFS) as EnemyDef[]).filter(d => (this.stage.enemies[d.kind] ?? 0) > 0 && t >= d.unlockAt);
    if (!pool.length) return [];
    const total = pool.reduce((sum, d) => sum + (this.stage.enemies[d.kind] ?? 0), 0);
    const counts = new Map<EnemyKind, number>();
    for (let i = 0; i < batch; i++) {
      let r = this.random() * total;
      let pick = pool[pool.length - 1];
      for (const def of pool) { r -= this.stage.enemies[def.kind] ?? 0; if (r <= 0) { pick = def; break; } }
      counts.set(pick.kind, (counts.get(pick.kind) ?? 0) + 1);
    }
    return Array.from(counts, ([kind, count]) => ({ kind, count, pattern: 'ring' }));
  }
  tick(t: number, alive: number): SpawnOrder[] {
    const orders: SpawnOrder[] = [];
    let room = MAX_ALIVE - alive;
    const add = (kind: EnemyKind, count: number, pattern: SpawnPattern) => {
      const accepted = Math.min(Math.max(room, 0), count);
      if (accepted) { orders.push({ kind, count: accepted, pattern }); room -= accepted; }
    };
    if (t >= this.nextSpecialAt) {
      this.nextSpecialAt = t + (stagePhase(this.stage, t) === 'respite' ? 70 : 50);
      const ambush = this.specialIndex++ % 2 === 1;
      this.events.emitSpecialWave({ label: ambush ? 'AMBUSH! FIND A GAP!' : `FRONTIER WAVE — ${this.stage.title}` });
      add(ambush ? 'knife_bandit' : this.stage.signature, 16 + Math.floor(t / 35), ambush ? 'encircle' : 'cluster');
    }
    if (t >= this.nextEliteAt && t < this.stage.duration) {
      this.nextEliteAt = t + 80;
      this.eliteCount++;
      if (room > 0) this.events.emitEliteSpawned();
      add('elite', Math.min(3, 1 + Math.floor(this.eliteCount / 4)), 'ring');
    }
    return orders;
  }
}
