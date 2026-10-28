import { describe, expect, it } from 'vitest';
import {
  BAKED_VISIBLE_HEIGHTS, classifyAsset, HERO_VISIBLE_WORLD_HEIGHT, normalizedScale, SCALE_RANGES, visibleBounds,
} from './worldScale';
import { sceneryScale, SCENERY } from './scenery';

describe('world scale normalization', () => {
  it('measures visible alpha bounds, ignoring transparent margins and faint alpha', () => {
    const w = 10, h = 10, rgba = new Uint8Array(w * h * 4);
    const paint = (x: number, y: number, a: number) => { rgba[(y * w + x) * 4 + 3] = a; };
    for (let y = 2; y < 7; y++) for (let x = 3; x < 6; x++) paint(x, y, 255);
    paint(0, 0, 3);
    expect(visibleBounds(rgba, w, h)).toEqual({ x: 3, y: 2, width: 3, height: 5 });
    expect(visibleBounds(new Uint8Array(16), 2, 2)).toBeNull();
  });

  it('classifies known scenery and refuses to guess unknown keys', () => {
    expect(classifyAsset('scenery_saloon')).toBe('building');
    expect(classifyAsset('wm_barrel')).toBe('small-container');
    expect(classifyAsset('hero_steve')).toBeNull();
    expect(classifyAsset('decor_skull')).toBeNull();
  });

  it('corrects only out-of-range objects with a uniform scale and leaves the rest untouched', () => {
    const hero = HERO_VISIBLE_WORLD_HEIGHT;
    expect(normalizedScale('small-container', 40, 1)).toBe(1); // 0.58x hero: fine
    const giant = normalizedScale('small-container', 40, 3); // 1.75x hero: too big
    expect(40 * giant / hero).toBeCloseTo(SCALE_RANGES['small-container'].max);
    const tiny = normalizedScale('building', 141, 0.3);
    expect(141 * tiny / hero).toBeCloseTo(SCALE_RANGES.building.min);
    expect(normalizedScale(null, 40, 7)).toBe(7);
    expect(normalizedScale('building', 0, 7)).toBe(7);
  });

  it('keeps every shipped scenery asset inside its range at its current render scale (no-op on approved art)', () => {
    for (const [key, height] of Object.entries(BAKED_VISIBLE_HEIGHTS)) {
      const category = classifyAsset(key)!;
      expect(category, key).not.toBeNull();
      const kind = key.replace('scenery_', '') as keyof typeof SCENERY;
      const base = key.startsWith('scenery_') ? sceneryScale(kind) : key === 'iso_barrel_lantern' || key === 'iso_crate_wheel' ? 0.65 : key === 'iso_wanted_wall' ? 0.85 : key === 'wm_lantern' ? 1 : 1;
      expect(normalizedScale(category, height, base), key).toBe(base);
    }
  });
});
