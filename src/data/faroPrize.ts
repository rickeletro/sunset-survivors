import { WEAPONS } from './weapons';
import { PASSIVES } from './passives';
import type { UpgradeChoice } from '../scenes/LevelUpScene';

/** Faro grants five ordinary upgrade steps, respecting the existing item cap. */
export function faroPrize(choices: readonly UpgradeChoice[]): UpgradeChoice | undefined {
  for (const choice of choices) {
    if (choice.type !== 'weapon' && choice.type !== 'passive') continue;
    const def = choice.type === 'weapon' ? WEAPONS[choice.id] : PASSIVES[choice.id];
    if (!def || choice.currentLevel >= def.levels.length) continue;
    const nextLevel = Math.min(choice.currentLevel + 5, def.levels.length);
    const final = def.levels[nextLevel - 1];
    return { ...choice, nextLevel, description: final.description };
  }
  return undefined;
}
