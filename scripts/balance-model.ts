import { HORDE_CAP, MAIN_BOSS_AT, wavePool } from '../src/data/waves';
import { ENEMY_DEFS, type EnemyKind } from '../src/data/enemies';
import { ECONOMY, xpForLevel } from '../src/data/economy';
import { getStage, stagePhase } from '../src/data/stages';
import { GameDirector, type SpawnOrder } from '../src/systems/GameDirector';

/** Frozen pre-audit baseline, for repeatable before/after comparisons only. */
export function legacyXpForLevel(rank: number): number {
  if (rank <= 2) return rank === 1 ? 25 : 40;
  const n = rank - 3;
  return 70 + 25 * n + 3 * n * n;
}
export const PROFILES = {
  cautious: { startKills: 0.4, finalKills: 1.5, collection: 0.65 },
  steady: { startKills: 0.7, finalKills: 3, collection: 0.8 },
  fast: { startKills: 1, finalKills: 5, collection: 0.95 },
} as const;

/** Loot-throughput envelope, NOT a combat/playability simulator. Identical kill/collection
 * streams isolate the cost change. Real 850ms director, unlocks, 240 cap and rewards;
 * assumed rising kill rate and deterministic pickup fraction, four-second pickup delay.
 */
export function simulateProgression(stageId: number, profile: keyof typeof PROFILES, cost = xpForLevel, xpBonus = 1, options: { seconds?: number; rareCash?: boolean; objectiveFraction?: number } = {}) {
  const stage = getStage(stageId), p = PROFILES[profile];
  let seed = 1234567;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const events = { emitSpecialWave() {}, emitEliteSpawned() {} };
  const director = new GameDirector(events as never, stage, random);
  const alive: EnemyKind[] = [];
  const spawn = (orders: SpawnOrder[]) => {
    for (const order of orders) for (let i = 0; i < order.count && alive.length < HORDE_CAP; i++) alive.push(order.kind);
  };
  let nextWave = 850, killBudget = 0, collectionBudget = 0, nextHazard = 55, nextSupply = 90;
  let level = 1, xp = 0, totalXp = 0, bounty = 0, kills = 0, pickups = 0;
  const pending: { at: number; xp: number; bounty: number }[] = [];
  const upgrades: { level: number; second: number }[] = [];
  const award = (value: number, second: number) => {
    const amount = Math.round(value * xpBonus); xp += amount; totalXp += amount;
    while (xp >= cost(level)) { xp -= cost(level++); upgrades.push({ level, second }); }
  };
  for (let ms = 100; ms <= Math.min(stage.duration, options.seconds ?? stage.duration) * 1000; ms += 100) {
    const second = Math.floor(ms / 1000);
    if(second===420 && ms%1000===0) {nextHazard=420+stage.hazardEvery;if(stage.hazard==='stampede')spawn([{kind:'longhorn',count:5,pattern:'ring'}]);}
    if (ms % 1000 === 0) {
      spawn(director.tick(second, alive.length));
      if (second >= 240 && second >= nextHazard && stagePhase(stage, second) !== 'respite') {
        nextHazard = second + stage.hazardEvery;
        if (stage.hazard === 'stampede') spawn([{ kind: 'longhorn', count: 5, pattern: 'ring' }]);
      }
      if (second >= nextSupply && second < MAIN_BOSS_AT - 45) {
        nextSupply = second + 150;
        const guard = wavePool(second,stage.enemies).some(e=>e.kind===stage.signature)?stage.signature:'bandit';
        spawn([{ kind:guard,count:5,pattern:'ring' }]);
        pending.push({ at: ms + 8000, xp: (80 + stageId * 30) * (options.objectiveFraction ?? 1), bounty: (ECONOMY.sources.supplyBase + stageId * ECONOMY.sources.supplyPerStage) * (options.objectiveFraction ?? 1) });
      }
    }
    if (ms >= nextWave) { spawn(director.waveOrders(second, alive.length)); nextWave += 850; }
    killBudget += (p.startKills + (p.finalKills - p.startKills) * ms / (stage.duration * 1000)) * 0.1;
    while (killBudget >= 1 && alive.length) {
      killBudget--; kills++; const kind = alive.shift()!;
      collectionBudget += p.collection;
      if (collectionBudget >= 1) { collectionBudget--; pickups++; pending.push({ at: ms + 4000, xp: ENEMY_DEFS[kind].xp, bounty: ENEMY_DEFS[kind].bounty + (options.rareCash && kind !== 'elite' ? ECONOMY.loot.moneyBagChance * ECONOMY.loot.moneyBagValue : 0) }); }
    }
    // No banking hypothetical kills when the arena is empty.
    if (!alive.length) killBudget = Math.min(killBudget, 1);
    for (let i = pending.length - 1; i >= 0; i--) if (pending[i].at <= ms) {
      award(pending[i].xp, ms / 1000); bounty += pending[i].bounty; pending.splice(i, 1);
    }
  }
  return { stage: stageId, profile, level, totalXp, bounty, kills, pickups, upgrades };
}
