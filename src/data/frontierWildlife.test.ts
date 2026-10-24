import { describe, expect, it } from 'vitest';
import { stageChickens, segmentHitsChicken, collectChicken } from './frontierWildlife';

describe('finite frontier flocks', () => {
  it('has three flocks of three outside, independent attempt state and no indoor wildlife', () => {
    const birds = stageChickens('canyon');
    expect(birds).toHaveLength(9);
    birds[0].cooked = true;
    expect(stageChickens('canyon')[0].cooked).toBe(false);
    for (const theme of ['saloon', 'caboose', 'manor'] as const) expect(stageChickens(theme)).toEqual([]);
  });
  it('detects a fast bullet crossing a bird and rejects misses and already cooked birds', () => {
    const c = stageChickens('canyon')[0];
    expect(segmentHitsChicken(c, c.x - 200, c.y, c.x + 200, c.y)).toBe(true);
    expect(segmentHitsChicken(c, c.x - 200, c.y + 20, c.x + 200, c.y + 20)).toBe(false);
    c.cooked = true;
    expect(segmentHitsChicken(c, c.x, c.y, c.x, c.y)).toBe(false);
  });
  it('only heals nearby cooked food, caps HP, pays once, and retains food at full HP', () => {
    const c = stageChickens('canyon')[0];
    expect(collectChicken(c, c.x, c.y, 50, 100)).toBe(0);
    c.cooked = true;
    expect(collectChicken(c, c.x + 100, c.y, 50, 100)).toBe(0);
    expect(collectChicken(c, c.x, c.y, 100, 100)).toBe(0);
    expect(c.collected).toBe(false);
    expect(collectChicken(c, c.x, c.y, 95, 100)).toBe(5);
    expect(collectChicken(c, c.x, c.y, 50, 100)).toBe(0);
    const other = stageChickens('canyon')[1]; other.cooked = true;
    expect(collectChicken(other, other.x, other.y, 50, 100)).toBe(12);
  });
});
