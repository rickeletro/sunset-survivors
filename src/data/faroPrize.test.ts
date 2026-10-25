import { expect, it } from 'vitest';
import { faroPrize } from './faroPrize';
import { WEAPONS } from './weapons';
import { PASSIVES } from './passives';
import type { UpgradeChoice } from '../scenes/LevelUpScene';
const weapon = (level: number): UpgradeChoice => ({ type: 'weapon', id: 'shotgun', name: 'Shotgun', icon: 'shotgun', currentLevel: level, nextLevel: level + 1, description: 'Old description' });
it('grants five steps for a new weapon and respects the existing cap for owned weapons', () => {
  expect(faroPrize([weapon(0)])?.nextLevel).toBe(5);
  const prize = faroPrize([weapon(3)]);
  expect(prize).toMatchObject({ currentLevel: 3, nextLevel: 5, description: WEAPONS.shotgun.levels[4].description });
  expect(faroPrize([weapon(5)])).toBeUndefined();
});
it('uses final passive attributes and never substitutes cash or medicine for a prize', () => {
  const passive: UpgradeChoice = { type: 'passive', id: 'badge', name: 'Badge', icon: 'badge', currentLevel: 1, nextLevel: 2, description: '' };
  const cash: UpgradeChoice = { type: 'reward', id: 'gold_purse', name: 'Cash', icon: 'badge', currentLevel: 0, nextLevel: 1, description: '' };
  expect(faroPrize([cash, passive])).toMatchObject({ type: 'passive', nextLevel: 5, description: PASSIVES.badge.levels[4].description });
  expect(faroPrize([cash])).toBeUndefined();
});
