/** Seven-minute runs: the first two upgrades arrive quickly, then a quadratic curve spaces out later choices. */
export const BUILD_LIMITS = { weapons: 6, passives: 6 } as const;
export const EVOLUTION_UNLOCK_SECONDS = 240;
export function xpForLevel(level: number): number {
  const rank = Math.max(1, Math.floor(level));
  if (rank <= 2) return rank === 1 ? 25 : 40;
  const steps = rank - 3;
  return 70 + 25 * steps + 3 * steps * steps;
}
export function stageClearBonus(stage: number): number { return 100 + Math.max(1, Math.min(8, Math.floor(stage))) * 50; }
export function cooldownMultiplier(base: number, reduction: number): number {
  return base / (1 - Math.max(0, Math.min(0.6, reduction)));
}
