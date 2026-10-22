/** Seven-minute stages: 5/8 basic pickups to start; a steeper quadratic from level 3.
 * Calibrated against the real director/reward streams in scripts/balance-model.ts.
 */
export const BUILD_LIMITS = { weapons: 6, passives: 6 } as const;
export const EVOLUTION_UNLOCK_SECONDS = 240;
export function xpForLevel(level: number): number {
  const rank = Math.max(1, Math.floor(level));
  if (rank <= 2) return rank === 1 ? 50 : 80;
  const steps = rank - 3;
  return 160 + 55 * steps + 6 * steps * steps;
}
export function stageClearBonus(stage: number): number { return 100 + Math.max(1, Math.min(8, Math.floor(stage))) * 50; }
export function cooldownMultiplier(base: number, reduction: number): number {
  return base / (1 - Math.max(0, Math.min(0.6, reduction)));
}
