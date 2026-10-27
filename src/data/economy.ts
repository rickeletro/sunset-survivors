/** Ten-minute stages: 5/8 basic pickups to start; a steeper quadratic from level 3.
 * Late cubic tail calibrated against reported high-throughput runs; opening stays unchanged.
 */
export const BUILD_LIMITS = { weapons: 6, passives: 6 } as const;
/** One persistent wallet buys services and characters. cashFraction only migrates legacy result cash. */
export const ECONOMY = {
  bank: { cashFraction: .3, perMinute: 10, victory: 50, difficulty: { easy: .85, normal: 1, hardcore: 1.15 } },
  characters: { bob: 2400, cormano: 6000 },
  services: {
    saloon_rest: { name: 'SALOON TONIC', base: 60, perStage: 5, health: .2, xp: 0, duration: 0 },
    hospitality_rest: { name: 'ROOM & REST', base: 45, perStage: 5, health: .12, xp: 20, duration: 0 },
    special_rounds: { name: 'SPECIAL ROUNDS', base: 90, perStage: 10, health: 0, xp: 0, duration: 30000 },
    gun_oil: { name: 'GUN OIL', base: 75, perStage: 8, health: 0, xp: 0, duration: 30000 },
    gallery: { name: 'TARGET PRACTICE', base: 35, perStage: 5, health: 0, xp: 0, duration: 0 },
  },
  specialDamage: 1.2, oilFireRate: 1.15,
  loot: { magnetChance: .02, moneyBagChance: .015, moneyBagValue: 15, badgeChance: .2, pullSpeed: 700, maxPullSpeed: 1800, collectionBudget: 64 },
  faro: { stakes: [2, 10, 40] as const, minStake: 2, itemStake: 40, maxStake: 100, stakeFraction: .2, lossFraction: .4, maxBets: 3 },
  gallery: { perHit: 3, xpPerHit: 5, perfectBase: 20, perfectPerStage: 5 },
  sources: { supplyBase: 300, supplyPerStage: 75, bossBase: 200, bossPerStage: 50, captainBase: 25, captainPerWave: 10, purse: 25 },
} as const;
export type RunServiceId = keyof typeof ECONOMY.services;
export function servicePrice(id: RunServiceId, stage: number): number {
  const service = ECONOMY.services[id];
  return service.base + service.perStage * (Math.max(1, Math.min(8, Math.floor(stage))) - 1);
}
export function bankReward(cash: number, seconds: number, victory: boolean, mode: 'easy' | 'normal' | 'hardcore' = 'normal'): number {
  const safe = (value: number) => Number.isFinite(value) ? Math.max(0, value) : 0;
  return Math.floor((safe(cash) * ECONOMY.bank.cashFraction + Math.floor(Math.min(600, safe(seconds)) / 60) * ECONOMY.bank.perMinute +
    (victory ? ECONOMY.bank.victory : 0)) * ECONOMY.bank.difficulty[mode]);
}
export const EVOLUTION_UNLOCK_SECONDS = 240;
export function xpForLevel(level: number): number {
  const rank = Math.max(1, Math.floor(level));
  if (rank <= 2) return rank === 1 ? 50 : 80;
  const steps = rank - 3;
  const late = Math.max(0, rank - 8);
  return 160 + 55 * steps + 6 * steps * steps + 3 * late * late * late;
}
export function stageClearBonus(stage: number): number { return 100 + Math.max(1, Math.min(8, Math.floor(stage))) * 50; }
export function cooldownMultiplier(base: number, reduction: number): number {
  return base / (1 - Math.max(0, Math.min(0.6, reduction)));
}
