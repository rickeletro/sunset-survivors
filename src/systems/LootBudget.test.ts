import { describe, expect, it } from 'vitest';
import { BudgetedDrop, DROP_SPRITE_BUDGET, mergeLoot, takeLootPacket } from './LootBudget';

describe('long-run loot budget', () => {
  it('keeps thousands of kills within the sprite budget without losing XP or bounty', () => {
    const drops: BudgetedDrop[] = [];
    for (let i = 0; i < 5000; i++) {
      const incoming = { type: 'gold', val: 10, bounty: 15, x: i % 100, y: 0 };
      if (!mergeLoot(drops, incoming)) drops.push({ ...incoming, sprite: { x: incoming.x, y: incoming.y } });
    }
    expect(drops).toHaveLength(DROP_SPRITE_BUDGET);
    let xp = 0, bounty = 0, pickups = 0;
    for (const drop of drops) {
      let exhausted = false;
      while (!exhausted) {
        const result = takeLootPacket(drop); exhausted = result.exhausted;
        xp += result.packet.val; bounty += result.packet.bounty; pickups++;
      }
    }
    expect(xp).toBe(50000); expect(bounty).toBe(75000); expect(pickups).toBe(5000);
  });
  it('never merges healing pickups into gold', () => {
    const drops = Array.from({ length: DROP_SPRITE_BUDGET }, () => ({ type: 'gold', val: 10, bounty: 15, sprite: { x: 0, y: 0 } }));
    expect(mergeLoot(drops, { type: 'whiskey', val: 10, bounty: 15, x: 0, y: 0 })).toBe(false);
  });
});
