import { ENEMY_DEFS, type EnemyKind } from '../src/data/enemies';
import { GameDirector, type SpawnOrder } from '../src/systems/GameDirector';
import { getStage, stagePhase } from '../src/data/stages';
/** Curve used during the player's reported level 27/36 runs. */
export function reportedRunCost(level: number): number {
  if (level <= 2) return level === 1 ? 50 : 80;
  const n = level - 3; return 160 + 55 * n + 6 * n * n;
}
export function cumulativeCost(level: number, cost = reportedRunCost): number {
  let xp = 0; for (let rank = 1; rank < level; rank++) xp += cost(rank); return xp;
}

/** Inverse throughput scenario, NOT a combat simulation: identical real director,
 * rewards and seeded roster, but assumed rising kill capacity. Badge consumes
 * choices at levels 3/5/7/9/11; there is no free max badge at the start.
 */
export function reproduceRun(stageId: number, seconds: number, finalKillsPerSecond: number, cost = reportedRunCost, badge = true) {
  let seed = 9437; const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
  const stage = getStage(stageId), director = new GameDirector({ emitSpecialWave() {}, emitEliteSpawned() {} } as never, stage, random);
  const alive: EnemyKind[] = [], loot: { at: number; kind: EnemyKind }[] = [];
  let nextWave = 850, nextHazard = 55, nextSupply = 90, kills = 0, budget = 0, xp = 0, raw = 0, earned = 0, level = 1, badgeRank = 0, pendingSupply = 0;
  const choices: { level: number; at: number; badgeRank: number }[] = [];
  const award = (value: number, at: number) => {
    raw += value; const amount = Math.round(value * (1 + [0, 0.2, 0.4, 0.65, 0.9, 1.2][badgeRank])); earned += amount; xp += amount;
    while (xp >= cost(level)) {
      xp -= cost(level++);
      if (badge && [3, 5, 7, 9, 11].includes(level)) badgeRank++;
      choices.push({ level, at, badgeRank });
    }
  };
  const spawn = (orders: SpawnOrder[]) => { for (const o of orders) for (let i = 0; i < o.count && alive.length < 240; i++) alive.push(o.kind); };
  for (let ms = 100; ms <= seconds * 1000; ms += 100) {
    const t = Math.floor(ms / 1000);
    if (ms % 1000 === 0) {
      spawn(director.tick(t, alive.length));
      if (t >= nextHazard && stagePhase(stage, t) !== 'respite') { nextHazard = t + stage.hazardEvery; if (stage.hazard === 'stampede') spawn([{ kind: 'longhorn', count: 5, pattern: 'ring' }]); }
      if (t >= nextSupply && t < stage.duration - 45) { nextSupply = t + 150; pendingSupply = ms + 8000; spawn([{ kind: stage.signature, count: 5, pattern: 'ring' }]); }
    }
    if (ms >= nextWave) { spawn(director.waveOrders(t, alive.length)); nextWave += 850; }
    if (pendingSupply && ms >= pendingSupply) { award(80 + stageId * 30, ms / 1000); pendingSupply = 0; }
    budget += (0.8 + (finalKillsPerSecond - 0.8) * ms / (seconds * 1000)) * 0.1;
    while (budget >= 1 && alive.length) { budget--; kills++; loot.push({ at: ms + 4000, kind: alive.shift()! }); }
    if (!alive.length) budget = Math.min(budget, 1);
    for (let i = loot.length - 1; i >= 0; i--) if (loot[i].at <= ms) { award(ENEMY_DEFS[loot[i].kind].xp, ms / 1000); loot.splice(i, 1); }
  }
  return { stage: stageId, seconds, finalKillsPerSecond, level, kills, rawXp: raw, earnedXp: earned, badgeRank, choices };
}
export function fitReportedRun(stage: number, seconds: number, targetLevel: number) {
  let low = 0.8, high = 30;
  for (let i = 0; i < 22; i++) { const mid = (low + high) / 2; if (reproduceRun(stage, seconds, mid).level >= targetLevel) high = mid; else low = mid; }
  return reproduceRun(stage, seconds, high);
}
