import { describe, expect, it, vi } from 'vitest';
import { WorldMap, WORLD_PROPS } from './WorldMap';
import { getStage } from '../data/stages';
import { worldDecorations } from '../data/worldDecorations';
vi.mock('phaser', () => ({ default: { BlendModes: { ADD: 1 }, Math: { Clamp: (x, min, max) => Math.max(min, Math.min(max, x)) } } }));

function fixture() {
  return Object.assign(Object.create(WorldMap.prototype), { chunks: new Map(), decorationChunks: new Map(),
    safeX: 4000, safeY: 4000, safeRadius: 260, stage: getStage(1),
    landmarks: { reserved: () => false, resolve: (x, y) => ({ x, y }) } });
}

describe('sparse canyon decoration', () => {
  it('preserves the original obstacle radii across all eight stage rosters', () => {
    const radii = { wagon: 34, barrel: 14, crate: 17, ruin: 29, table: 25, pine: 12, tent: 27, barricade: 28, palm: 12, statue: 20, lantern: 6, rock: 14, cactus: 9, deadtree: 10 };
    expect(Object.fromEntries(Object.entries(WORLD_PROPS).map(([kind, spec]) => [kind, spec.r]))).toEqual(radii);
    for (let stage = 1; stage <= 8; stage++) {
      const world = fixture(); world.stage = getStage(stage);
      const seen = new Set();
      for (let y = 1; y <= 6; y++) for (let x = 1; x <= 6; x++) {
        for (const obstacle of world.getChunk(x, y)) {
          seen.add(obstacle.kind);
          expect(obstacle.r).toBe(radii[obstacle.kind]);
          expect([...getStage(stage).props, 'lantern']).toContain(obstacle.kind);
        }
      }
      for (const kind of getStage(stage).props) expect(seen.has(kind)).toBe(true);
      expect(seen.has('lantern')).toBe(false);
    }
  });
  it('is deterministic, sparse and never changes obstacle generation or collision results', () => {
    const a = fixture(), b = fixture();
    let count = 0;
    for (let cy = 1; cy <= 10; cy++) for (let cx = 1; cx <= 10; cx++) {
      const items = worldDecorations('canyon', cx, cy);
      expect(items).toEqual(worldDecorations('canyon', cx, cy));
      expect(items.length).toBeLessThanOrEqual(1);
      count += items.length;
      const decoration = a.getDecorationChunk(cx, cy);
      expect(a.getChunk(cx, cy)).toEqual(b.getChunk(cx, cy));
      for (const d of decoration) {
        expect(Math.hypot(d.x - 4000, d.y - 4000)).toBeGreaterThanOrEqual(260);
        for (const o of a.getChunk(cx, cy)) expect(Math.hypot(d.x - o.x, d.y - o.y)).toBeGreaterThan(o.r + 30);
        // Decoration is visual only, even when a character stands exactly on it.
        expect(a.resolve(d.x, d.y, 10)).toEqual(b.resolve(d.x, d.y, 10));
      }
    }
    expect(count).toBeGreaterThan(10); expect(count).toBeLessThan(45);
    expect(worldDecorations('railroad', 6, 6)).toEqual([]);
  });

  it('retains each existing wagon collision radius at 34 pixels', () => {
    const world = fixture();
    let wagons = 0;
    for (let y = 1; y <= 6; y++) for (let x = 1; x <= 6; x++) {
      for (const prop of world.getChunk(x, y)) if (prop.kind === 'wagon') {
        wagons++;
        expect(prop.r).toBe(34);
        const isolated = fixture(); isolated.getChunk = () => [prop];
        expect(isolated.resolve(prop.x, prop.y, 10).x).toBeCloseTo(prop.x + 44);
      }
    }
    expect(wagons).toBeGreaterThan(0);
  });
});

it('creates decoration once per active chunk and destroys it on chunk exit', () => {
  const world = fixture(), images = [];
  world.active = new Set();
  world.landmarks.update = vi.fn();
  world.scene = { time: { now: 0 }, add: { image(x, y, key) {
    const image = { x, y, key, destroy: vi.fn() };
    for (const method of ['setOrigin', 'setDepth', 'setBlendMode', 'setAlpha']) image[method] = () => image;
    images.push(image); return image;
  } } };
  world.update(4000, 4000);
  const first = images.filter(i => i.key.startsWith('decor_'));
  expect(first.length).toBeGreaterThan(0);
  world.update(4000, 4000);
  expect(images.filter(i => i.key.startsWith('decor_'))).toHaveLength(first.length);
  world.update(80, 80);
  expect(first.every(i => i.destroy.mock.calls.length === 1)).toBe(true);
});
