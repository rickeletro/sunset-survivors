/** Recovery budget, independent of XP/currency, hitboxes and enemy HP. */
export const HEAL_DROP_CHANCE = 0.02;
export const HEAL_DROP_HP = 12;
export const REGEN_DELAY_MS = 4000;
export const PLAYER_HIT_GRACE_MS = 600;
export function canRegenerate(now: number, lastDamageAt = -Infinity): boolean {
  return now - lastDamageAt >= REGEN_DELAY_MS;
}
