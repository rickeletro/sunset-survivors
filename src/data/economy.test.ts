import { describe, expect, it } from 'vitest';
import { BUILD_LIMITS, cooldownMultiplier, stageClearBonus, xpForLevel } from './economy';
import { WEAPONS } from './weapons';
import { WEAPON_EVOLUTIONS } from './evolutions';
import { BOSS_COMBAT } from './bossCombat';

describe('seven-minute progression budget', () => {
  it('keeps the first two upgrades fast and increasingly spaces out later levels', () => {
    expect([1, 2, 3, 4, 5, 10, 20].map(xpForLevel)).toEqual([25, 40, 70, 98, 132, 392, 1362]);
    for (let rank = 3; rank <= 100; rank++) {
      expect(xpForLevel(rank)).toBeGreaterThan(xpForLevel(rank - 1));
      if (rank >= 4) expect(xpForLevel(rank + 1) - xpForLevel(rank)).toBeGreaterThan(xpForLevel(rank) - xpForLevel(rank - 1));
    }
    expect(BUILD_LIMITS).toEqual({ weapons: 6, passives: 6 });
  });
  it('requires the full growing cost for every upgrade while preserving leftover XP', () => {
    function levelAfter(xp: number) { let level = 1; while (xp >= xpForLevel(level)) xp -= xpForLevel(level++); return { level, xp }; }
    expect(levelAfter(24)).toEqual({ level: 1, xp: 24 });
    expect(levelAfter(25)).toEqual({ level: 2, xp: 0 });
    expect(levelAfter(65)).toEqual({ level: 3, xp: 0 });
    expect(levelAfter(134)).toEqual({ level: 3, xp: 69 });
    expect(levelAfter(135)).toEqual({ level: 4, xp: 0 });
    expect(levelAfter(1000).level).toBeLessThan(10);
    expect(levelAfter(5000).level).toBeLessThan(20);
  });
  it('uses exact cooldown reduction and caps extreme values away from zero', () => {
    expect(650 / cooldownMultiplier(1, 0.48)).toBeCloseTo(650 * 0.52);
    expect(650 / cooldownMultiplier(1.25, 0.48)).toBeCloseTo(650 * 0.52 / 1.25);
    expect(Number.isFinite(cooldownMultiplier(1, 1))).toBe(true);
  });
  it('gives evolutions a controlled direct damage increase while their special effects add value', () => {
    for (const recipe of WEAPON_EVOLUTIONS) {
      const base = WEAPONS[recipe.baseWeaponId].levels.at(-1)!;
      const evolved = WEAPONS[recipe.evolvedWeaponId].levels[0];
      const dps = (level: typeof base) => level.damage * level.projectileCount * 1000 / level.cooldownMs;
      const multiplier = dps(evolved) / dps(base);
      expect(multiplier, recipe.evolvedWeaponId).toBeGreaterThan(1.1);
      expect(multiplier, recipe.evolvedWeaponId).toBeLessThan(2.2);
    }
  });
  it('raises every boss substantially and preserves a rising total encounter health budget', () => {
    const previous = [2000, 4500, 6000, 4000, 8500, 9500, 11500, 15000];
    for (let i = 0; i < BOSS_COMBAT.length; i++) {
      const boss = BOSS_COMBAT[i]; expect(boss.hp).toBeGreaterThan(previous[i] * 5);
      if (i) expect(boss.hp * boss.slugs.length).toBeGreaterThan(BOSS_COMBAT[i - 1].hp * BOSS_COMBAT[i - 1].slugs.length);
    }
    expect(stageClearBonus(1)).toBe(150); expect(stageClearBonus(8)).toBe(500);
  });
});
