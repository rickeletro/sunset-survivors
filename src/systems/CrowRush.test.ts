import { describe, expect, it, vi } from 'vitest';
import { CROW_RUSH_DIRECTIONS, CrowRush, crowRushDirection, crowRushFrame, preloadCrowRush } from './CrowRush';

function scene() {
  const graphics = { setDepth: vi.fn().mockReturnThis(), clear: vi.fn().mockReturnThis(), fillStyle: vi.fn().mockReturnThis(), fillTriangle: vi.fn().mockReturnThis(), fillRect: vi.fn().mockReturnThis(), destroy: vi.fn() };
  return { add: { graphics: vi.fn(() => graphics) }, events: { once: vi.fn() }, graphics };
}

describe('CrowRush', () => {
  it('uses one bounded drawing surface and pulls only inside the flying flock corridor', () => {
    const s = scene(), banner = vi.fn(), rush = new CrowRush(s as never, banner, () => 0.9);
    expect(rush.update(0, 184999, { x: 100, y: 100 }, false)).toBeUndefined();
    expect(rush.update(0, 185000, { x: 100, y: 100 }, false)).toBeUndefined();
    expect(rush.update(1500, 186500, { x: 100, y: 212 }, false)).toEqual({ x: 172.5, y: 0 });
    expect(banner).toHaveBeenCalledWith('CROW RUSH — BREAK FREE FROM THE FLOCK!');
    expect(s.add.graphics).toHaveBeenCalledOnce();
    expect(rush.update(100, 186600, { x: 100, y: 500 }, false)).toBeUndefined();
  });
  it('does not start or pull while combat is blocked', () => {
    const rush = new CrowRush(scene() as never, vi.fn(), () => 0);
    expect(rush.update(100, 200000, { x: 0, y: 0 }, true)).toBeUndefined();
  });
  it('preloads 16 directional crow frames and animates the 28-bird sprite pool across all 4 directions', () => {
    const loaded = new Map<string, string>();
    const sprites: { key: string; visible: boolean }[] = [];
    const graphics = { setDepth: vi.fn().mockReturnThis(), clear: vi.fn().mockReturnThis(), fillStyle: vi.fn().mockReturnThis(), fillTriangle: vi.fn().mockReturnThis(), fillRect: vi.fn().mockReturnThis(), destroy: vi.fn() };
    const s = {
      textures: { exists: (key: string) => loaded.has(key) },
      load: { image: (key: string, path: string) => loaded.set(key, path) },
      add: {
        graphics: vi.fn(() => graphics),
        image: vi.fn((_x: number, _y: number, key: string) => {
          const item = {
            key,
            visible: true,
            setDepth: vi.fn().mockReturnThis(),
            setScale: vi.fn().mockReturnThis(),
            setTexture: vi.fn((next: string) => { item.key = next; return item; }),
            setPosition: vi.fn().mockReturnThis(),
            setVisible: vi.fn((v: boolean) => { item.visible = v; return item; }),
            destroy: vi.fn(),
          };
          sprites.push(item);
          return item;
        }),
      },
      events: { once: vi.fn() },
    };
    preloadCrowRush(s as never);
    expect(loaded.size).toBe(16);
    for (const dir of CROW_RUSH_DIRECTIONS) {
      for (let i = 0; i < 4; i++) {
        const key = `crow_rush_${dir}_${i}`;
        expect(loaded.get(key)).toBe(`assets/enemies/pixellab/crow_rush/Idle/animations/walking-4-frames/${dir}/frame_00${i}.png`);
      }
    }
    expect(crowRushDirection(1, 0)).toBe('east');
    expect(crowRushDirection(-1, 0)).toBe('west');
    expect(crowRushDirection(0, 1)).toBe('south');
    expect(crowRushDirection(0, -1)).toBe('north');
    expect(crowRushFrame(1, 0, 180, 1)).toBe('crow_rush_east_3');

    const rush = new CrowRush(s as never, vi.fn(), () => 0.9);
    rush.update(0, 185000, { x: 100, y: 100 }, false);
    expect(sprites).toHaveLength(28);
    expect(sprites[0].key).toBe('crow_rush_east_0');
    rush.update(3000, 188000, { x: 100, y: 100 }, false);
    expect(sprites.every(sp => !sp.visible)).toBe(true);
  });
});
