import { describe, expect, it } from 'vitest';
import { legacyXpForLevel, simulateProgression } from '../../scripts/balance-model';
import { xpForLevel } from './economy';
import { getEligibleEvolution } from './evolutions';

describe('deterministic progression throughput audit', () => {
  it('slows the opening in basic pickups and increases every subsequent incremental cost', () => {
    expect([1, 2, 3].map(rank => Math.ceil(xpForLevel(rank) / 10))).toEqual([5, 8, 16]);
    for (let rank = 3; rank < 100; rank++) {
      expect(xpForLevel(rank)).toBeGreaterThan(legacyXpForLevel(rank) * 1.9);
      expect(xpForLevel(rank + 1) - xpForLevel(rank)).toBeGreaterThan(legacyXpForLevel(rank + 1) - legacyXpForLevel(rank));
    }
  });
  it('retains build/evolution headroom while reducing upgrade interruptions across all eight stages', () => {
    for (let stage = 1; stage <= 8; stage++) for (const profile of ['cautious', 'steady', 'fast'] as const) {
      const before = simulateProgression(stage, profile, legacyXpForLevel), after = simulateProgression(stage, profile);
      expect(after.totalXp).toBe(before.totalXp); expect(after.bounty).toBe(before.bounty);
      expect(after.level).toBeGreaterThanOrEqual(11); expect(after.level).toBeLessThanOrEqual(23);
      expect(after.level).toBeLessThan(before.level);
      expect(after.upgrades[2].second).toBeGreaterThan(before.upgrades[2].second * 1.4);
      // A focused evolution costs four weapon upgrades + one passive + evolution choice.
      expect(after.level - 1).toBeGreaterThanOrEqual(6);
    }
    expect(getEligibleEvolution(new Map([['rifle', 5]]), new Map([['badge', 1]]), 239)).toBeNull();
    expect(getEligibleEvolution(new Map([['rifle', 5]]), new Map([['badge', 1]]), 240)?.evolvedWeaponId).toBe('golden_repeater');
  });
  it('keeps the strongest badge scenario bounded rather than removing its reward', () => {
    const normal = simulateProgression(1, 'fast'), boosted = simulateProgression(1, 'fast', undefined, 2.2);
    expect(normal.level).toBe(19); expect(boosted.level).toBe(23);
    expect(boosted.level).toBeGreaterThan(normal.level);
  });
});
