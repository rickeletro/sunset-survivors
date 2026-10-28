import { describe, expect, it, vi } from 'vitest';
import { StageLandmarks } from './StageLandmarks';
import { SCENERY, footprint, overlapsFootprint, sceneryKey, worldDepth } from '../data/scenery';
vi.stubGlobal('document', { createElement: () => ({ getContext: () => ({ canvas: {}, drawImage: vi.fn(), getImageData: () => ({ data: new Uint8ClampedArray(16 * 16 * 4).fill(255) }) }) }) });
vi.mock('phaser', () => ({ default: { BlendModes: { ADD: 1 } } }));

function harness() {
  const objects: any[] = [];
  let shutdown: () => void = () => {};
  const image = (x: number, y: number, key: string, requestedFrame?: string) => {
    const obj: any = { x, y, key, requestedFrame, texture: { key }, originX: 0.5, originY: 1, scaleX: 1, scaleY: 1, flipX: false,
      frame: { realWidth: 16, realHeight: 16, cutWidth: 16, cutHeight: 16, cutX: 0, cutY: 0, x: 0, y: 0, source: { image: {} } }, destroyed: false, alpha: 1, depth: 0 };
    for (const method of ['setOrigin', 'setBlendMode', 'setPosition', 'setVisible', 'clear', 'fillStyle', 'fillEllipse', 'fillPoints']) obj[method] = () => obj;
    obj.setScale = (scale: number) => { obj.scale = scale; obj.scaleX = obj.scaleY = scale; return obj; };
    obj.setDepth = (depth: number) => { obj.depth = depth; return obj; };
    obj.setAlpha = (alpha: number) => { obj.alpha = alpha; return obj; };
    obj.destroy = vi.fn(() => { obj.destroyed = true; });
    objects.push(obj); return obj;
  };
  const scene: any = {
    textures: { exists: () => true }, events: { once: (_event: string, fn: () => void) => { shutdown = fn; } },
    add: { image, graphics: () => image(0, 0, 'shadow-graphic'), tileSprite: (x: number, y: number, _w: number, _h: number, key: string) => image(x, y, key), particles: image },
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
    expect(facade.requestedFrame).toBe('__BASE');
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
  it.each(['canyon', 'railroad', 'burning-town', 'saloon', 'caboose', 'mountain', 'hacienda', 'manor'] as const)('%s attaches hero-height poles only to building facades', theme => {
    const h = harness(), scenery = new StageLandmarks(h.scene, theme);
    scenery.update(4000, 4000, 0);
    const poles = h.objects.filter(o => o.key === 'wm_lantern');
    if (theme === 'caboose') expect(poles).toHaveLength(1);
    else expect(poles.length).toBeGreaterThan(0);
    for (const pole of poles) {
      const facade = scenery.placements.find(p => {
        const body = h.objects.find(o => o.key === sceneryKey(p.kind) && o.x === p.x && o.y === p.y);
        return !!body && pole.x === p.x + SCENERY[p.kind].width * body.scaleX / 2 + 28 && pole.y === p.y - 20;
      })!;
      expect(facade).toBeTruthy();
      expect(['house', 'saloon', 'sheriff', 'general-store', 'frontier-saloon', 'gallery-saloon', 'hacienda', 'manor', 'rail-station']).toContain(facade.kind);
      expect(188 * pole.scale).toBeCloseTo(68.5);
      expect(pole.depth).toBe(worldDepth(pole.y));
    }
    scenery.update(80, 80, 1000);
    expect(poles.every(o => o.destroyed)).toBe(true);
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
    expect(Object.keys(SCENERY)).toHaveLength(18);
  });
});
