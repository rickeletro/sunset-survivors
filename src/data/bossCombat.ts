export type BossAttack = 'shotgun' | 'quickdraw' | 'charge' | 'dynamite' | 'whip' | 'axes' | 'gatling' | 'rifle';
export interface BossCombat {
  stage: number; slugs: string[]; hp: number; speed: number; damage: number; cooldown: number; attack: BossAttack;
}
const PREVIOUS_BOSS_BASE: BossCombat[] = [
  { stage: 1, slugs: ['greedwell'], hp: 22000, speed: 105, damage: 28, cooldown: 1800, attack: 'shotgun' },
  { stage: 2, slugs: ['hawkeye-hank-hatfield'], hp: 32000, speed: 115, damage: 28, cooldown: 1550, attack: 'quickdraw' },
  { stage: 3, slugs: ['dark-horse'], hp: 44000, speed: 110, damage: 34, cooldown: 2800, attack: 'charge' },
  { stage: 4, slugs: ['smith-brother-red', 'smith-brother-gray'], hp: 28000, speed: 85, damage: 28, cooldown: 2300, attack: 'dynamite' },
  { stage: 5, slugs: ['el-greco'], hp: 65000, speed: 100, damage: 32, cooldown: 2500, attack: 'whip' },
  { stage: 6, slugs: ['chief-wigwam'], hp: 80000, speed: 125, damage: 34, cooldown: 2000, attack: 'axes' },
  { stage: 7, slugs: ['paco-loco'], hp: 100000, speed: 70, damage: 36, cooldown: 3200, attack: 'gatling' },
  { stage: 8, slugs: ['sir-richard-rose'], hp: 135000, speed: 105, damage: 38, cooldown: 1800, attack: 'rifle' },
];
/** User-requested new Normal baseline, computed once for every boss/member. */
export const BOSS_REBALANCE_FACTOR = 2;
export const BOSS_COMBAT: BossCombat[] = PREVIOUS_BOSS_BASE.map(b => ({ ...b,
  hp: b.hp * BOSS_REBALANCE_FACTOR, damage: b.damage * BOSS_REBALANCE_FACTOR }));
/** Projectile/area damage was independent of contact stats; apply its base change once at source. */
export function bossAttackDamage(previousDamage: number): number { return previousDamage * BOSS_REBALANCE_FACTOR; }
export function getBossCombat(stage: number): BossCombat { return BOSS_COMBAT.find(b => b.stage === stage) ?? BOSS_COMBAT[0]; }
export function bossRageMultiplier(hp: number, maxHp: number): number { return hp <= maxHp * 0.4 ? 0.72 : 1; }
export function remainingBossHp(bosses: { hp: number; maxHp: number; dead?: boolean }[]): { hp: number; maxHp: number } {
  return bosses.reduce((sum, b) => ({ hp: sum.hp + (b.dead ? 0 : Math.max(0, b.hp)), maxHp: sum.maxHp + b.maxHp }), { hp: 0, maxHp: 0 });
}
