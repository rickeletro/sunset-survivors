import { describe, expect, it, vi } from 'vitest';
import { StageLandmarks } from './StageLandmarks';
import { SCENERY, footprint, overlapsFootprint, sceneryKey, worldDepth } from '../data/scenery';
vi.mock('phaser', () => ({ default: { BlendModes: { ADD: 1 } } }));

function harness() {
  const objects: any[] = [];
  let shutdown: () => void = () => {};
  const image = (x: number, y: number, key: string) => {
    const obj: any = { x, y, key, destroyed: false, alpha: 1, depth: 0 };
    for (const method of ['setOrigin', 'setBlendMode']) obj[method] = () => obj;
    obj.setDepth = (depth: number) => { obj.depth = depth; return obj; };
    obj.setAlpha = (alpha: number) => { obj.alpha = alpha; return obj; };
    obj.destroy = vi.fn(() => { obj.destroyed = true; });
    objects.push(obj); return obj;
  };
  const scene: any = {
    textures: { exists: () => true }, events: { once: (_event: string, fn: () => void) => { shutdown = fn; } },
    add: { image, tileSprite: (x: number, y: number, _w: number, _h: number, key: string) => image(x, y, key), particles: image },
  };
  return { scene, objects, shutdown: () => shutdown() };
}

describe('streamed PixelLab scenery', () => {
  it('creates visible props only once, fades occluding facades, and sorts actors and buildings together', () => {
    const h = harness();
    const scenery = new StageLandmarks(h.scene, 'saloon');
    const prop = scenery.placements.find(p => p.kind === 'saloon')!;
    scenery.update(prop.x, prop.y - 100, 0);
    const count = h.objects.length;
    scenery.update(prop.x, prop.y - 100, 1000);
    expect(h.objects).toHaveLength(count);
    const facade = h.objects.find(o => o.key === sceneryKey(prop.kind) && o.x === prop.x && o.y === prop.y);
    expect(facade.alpha).toBe(0.55);
    expect(facade.depth).toBeGreaterThan(worldDepth(prop.y - 100));
    expect(facade.depth).toBeLessThan(worldDepth(prop.y + 100));
    scenery.update(prop.x, prop.y + 100, 2000);
    expect(facade.alpha).toBe(1);
    expect(h.objects.filter(o => !o.destroyed && o.key === 'wm_glow').every(o => o.alpha >= 0.24 && o.alpha <= 0.36)).toBe(true);
  });
  it('destroys tracks, smoke and glows when leaving chunks and after scene shutdown', () => {
    const h = harness();
    const scenery = new StageLandmarks(h.scene, 'railroad');
    for (let cycle = 0; cycle < 10; cycle++) {
      scenery.update(4000, 4000, cycle * 1000);
      const live = h.objects.filter(o => !o.destroyed);
      expect(live.some(o => o.key === 'stage_dust')).toBe(true);
      expect(live.some(o => o.key === 'wm_rails')).toBe(true);
      expect(live.length).toBeLessThan(75);
      scenery.update(80, 80, cycle * 1000);
      expect(h.objects.every(o => o.destroyed)).toBe(true);
    }
    scenery.update(4000, 4000, 11000);
    h.shutdown();
    scenery.destroy(); // Repeated teardown is safe.
    expect(h.objects.every(o => o.destroyed)).toBe(true);
    expect(h.objects.every(o => o.destroy.mock.calls.length === 1)).toBe(true);
  });
  it('reserves ground footprints and safely resolves objective and actor spawns', () => {
    const h = harness();
    const scenery = new StageLandmarks(h.scene, 'saloon');
    for (const prop of scenery.placements) {
      const box = footprint(prop);
      expect(scenery.reserved(box.x, box.y, 20)).toBe(true);
      for (const radius of [10, 25, 82]) {
        const safe = scenery.resolve(box.x, box.y, radius);
        expect(scenery.placements.some(p => overlapsFootprint(footprint(p), safe.x, safe.y, radius - 0.001))).toBe(false);
      }
    }
    expect(scenery.reserved(4000, 4000, 20)).toBe(false);
  });
  it('uses finite, bounded scenery depths below effects and the HUD', () => {
    expect(worldDepth(-100)).toBe(10);
    expect(worldDepth(9000)).toBe(15);
    expect(Object.keys(SCENERY)).toHaveLength(17);
  });
});
