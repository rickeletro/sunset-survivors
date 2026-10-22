import { describe, expect, it } from 'vitest';
import { canRegenerate, HEAL_DROP_CHANCE, HEAL_DROP_HP, PLAYER_HIT_GRACE_MS } from './sustain';
import { PASSIVES } from './passives';
import { simulateSustain } from '../../scripts/sustain-model';

describe('recovery and threat budget', () => {
  it('cuts incidental healing by 90% while preserving the ordinary hit grace and defensive ranks', () => {
    expect(100 * HEAL_DROP_CHANCE * HEAL_DROP_HP).toBe(24);
    expect(100 * 0.08 * 30).toBe(240);
    expect(PLAYER_HIT_GRACE_MS).toBe(600);
    expect(PASSIVES.whiskey.levels.map(l => l.effect.hpRegen)).toEqual([0.15, 0.3, 0.5, 0.75, 1]);
    expect(PASSIVES.whiskey.levels.at(-1)?.effect.maxHpBonus).toBe(60);
    expect(canRegenerate(3999, 0)).toBe(false); expect(canRegenerate(4000, 0)).toBe(true);
    expect(canRegenerate(1000)).toBe(true);
  });
  it('makes avoiding hits valuable without requiring healing for a careful uninvested build', () => {
    const runs = Array.from({ length: 64 }, (_, i) => ({
      old: simulateSustain(1000 + i, 20, false), now: simulateSustain(1000 + i, 20, true),
      oldSaloon: simulateSustain(1000 + i, 20, false, false, true), saloon: simulateSustain(1000 + i, 20, true, false, true),
    }));
    const mean = (key: keyof typeof runs[number], metric: 'hp' | 'hp90') => runs.reduce((s, r) => s + r[key][metric], 0) / runs.length;
    expect(runs.every(r => !r.now.deadAt)).toBe(true);
    expect(mean('old', 'hp')).toBeGreaterThan(130); expect(mean('now', 'hp')).toBeLessThan(110);
    expect(mean('saloon', 'hp90') - mean('now', 'hp90')).toBeGreaterThan(20);
    expect(mean('oldSaloon', 'hp90') - mean('old', 'hp90')).toBeLessThan(10);
  });
  it('preserves defensive investment but does not let max regeneration erase sustained repeated errors', () => {
    const seeds = Array.from({ length: 32 }, (_, i) => 1000 + i);
    expect(seeds.every(s => !simulateSustain(s, 10, false).deadAt)).toBe(true);
    expect(seeds.filter(s => !simulateSustain(s, 10, true).deadAt).length).toBeLessThan(4);
    expect(seeds.every(s => !simulateSustain(s, 10, true, true).deadAt)).toBe(true);
    expect(seeds.every(s => !!simulateSustain(s, 5, true, true).deadAt)).toBe(true);
  });
});
