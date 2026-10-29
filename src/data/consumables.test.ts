import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { CONSUMABLE_ITEMS, CONSUMABLE_ORDER } from './consumables';
import { statsManager } from './GameStatsManager';

describe('General Store Consumables & Inventory Economy', () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    });
    statsManager.refresh();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defines all 6 single-use powerups with valid textures, prices and hotkeys', () => {
    expect(CONSUMABLE_ORDER).toHaveLength(6);
    for (const id of CONSUMABLE_ORDER) {
      const item = CONSUMABLE_ITEMS[id];
      expect(item).toBeDefined();
      expect(item.price).toBeGreaterThanOrEqual(350);
      expect(item.hotkey).toMatch(/^[1-6]$/);
      expect(item.name.length).toBeGreaterThan(0);
      expect(item.description.length).toBeGreaterThan(0);
      expect(item.cardTexture.length).toBeGreaterThan(0);
      expect(item.hudTexture.length).toBeGreaterThan(0);
    }
  });

  it('buys consumables with bank balance and tracks saddlebag quantity', () => {
    // Add $1500 to the shared persistent bank
    statsManager.changeBalance(1500);
    expect(statsManager.getStats().bank).toBe(1500);

    // Initial count is 0
    expect(statsManager.getConsumableCount('golden_magnet')).toBe(0);

    // Buy Desert Magnet ($350)
    const result = statsManager.buyConsumable('golden_magnet', CONSUMABLE_ITEMS.golden_magnet.price);
    expect(result).toBe('bought');
    expect(statsManager.getStats().bank).toBe(1150);
    expect(statsManager.getConsumableCount('golden_magnet')).toBe(1);

    // Buy second one
    const result2 = statsManager.buyConsumable('golden_magnet', CONSUMABLE_ITEMS.golden_magnet.price);
    expect(result2).toBe('bought');
    expect(statsManager.getStats().bank).toBe(800);
    expect(statsManager.getConsumableCount('golden_magnet')).toBe(2);

    // Use one in a run
    const used = statsManager.useConsumable('golden_magnet');
    expect(used).toBe(true);
    expect(statsManager.getConsumableCount('golden_magnet')).toBe(1);

    // Use second one
    const used2 = statsManager.useConsumable('golden_magnet');
    expect(used2).toBe(true);
    expect(statsManager.getConsumableCount('golden_magnet')).toBe(0);

    // Cannot use when 0
    expect(statsManager.useConsumable('golden_magnet')).toBe(false);
  });

  it('rejects purchase when player does not have enough bank cash', () => {
    expect(statsManager.getStats().bank).toBe(0);
    const result = statsManager.buyConsumable('silver_bullet', CONSUMABLE_ITEMS.silver_bullet.price);
    expect(result).toBe('insufficient');
    expect(statsManager.getConsumableCount('silver_bullet')).toBe(0);
  });
});
