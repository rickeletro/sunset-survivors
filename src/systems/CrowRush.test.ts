import { describe, expect, it, vi } from 'vitest';
import { CROW_RUSH_DIRECTIONS, CrowRush, crowRushDirection, crowRushFrame, preloadCrowRush } from './CrowRush';

function scene() {
  const graphics = { setDepth: vi.fn().mockReturnThis(), clear: vi.fn().mockReturnThis(), fillStyle: vi.fn().mockReturnThis(), fillTriangle: vi.fn().mockReturnThis(), fillRect: vi.fn().mockReturnThis(), destroy: vi.fn() };
  return { add: { graphics: vi.fn(() => graphics) }, events: { once: vi.fn() }, graphics };
}

describe('CrowRush', () => {
  it('uses one bounded drawing surface and pulls only inside the flying flock corridor', () => {
    const s = scene(), banner = vi.fn(), rush = new CrowRush(s as never, banner, () => 0.9, 185000);
    expect(rush.update(0, 184999, { x: 100, y: 100 }, false)).toBeUndefined();
    expect(rush.update(0, 185000, { x: 100, y: 100 }, false)).toBeUndefined();
    expect(rush.update(1500, 186500, { x: 100, y: 212 }, false)).toEqual({ x: 172.5, y: 0 });
    expect(banner).toHaveBeenCalledWith('CROW RUSH — BREAK FREE FROM THE FLOCK!');
    expect(s.add.graphics).toHaveBeenCalledOnce();
    expect(rush.update(100, 186600, { x: 100, y: 500 }, false)).toBeUndefined();
  });
  it('does not start or pull while combat is blocked', () => {
    const rush = new CrowRush(scene() as never, vi.fn(), () => 0, 185000);
    expect(rush.update(100, 200000, { x: 0, y: 0 }, true)).toBeUndefined();
  });
  it('spawns early at 25s with increased appearance rate and recurs rapidly', () => {
    const s = scene(), banner = vi.fn();
    const rush = new CrowRush(s as never, banner, () => 0);
    expect(rush.update(0, 24999, { x: 100, y: 100 }, false)).toBeUndefined();
    expect(rush.update(0, 25000, { x: 100, y: 100 }, false)).toBeUndefined();
    expect(banner).toHaveBeenCalledWith('CROW RUSH — BREAK FREE FROM THE FLOCK!');
    expect(rush.isActive()).toBe(true);
    // After flock ends, next flock is ready in 35s
    rush.update(3000, 28000, { x: 100, y: 100 }, false);
    expect(rush.isActive()).toBe(false);
    expect(rush.update(0, 62999, { x: 100, y: 100 }, false)).toBeUndefined();
    expect(rush.update(0, 63000, { x: 100, y: 100 }, false)).toBeUndefined();
    expect(rush.isActive()).toBe(true);
  });
  it('allows eliminating crows one by one with projectiles and explosions and deals contact damage', () => {
    const s = scene(), killed = vi.fn();
    const rush = new CrowRush(s as never, vi.fn(), () => 0.9, 1000);
    rush.onCrowKilled = killed;
    rush.update(0, 1000, { x: 100, y: 100 }, false);
    rush.update(500, 1500, { x: 100, y: 100 }, false);

    const birds = rush.getAliveBirds();
    expect(birds).toHaveLength(28);

    // Hit the first bird with a projectile
    const targetBird = birds[0];
    const hit = rush.hit(targetBird.x - 5, targetBird.y, targetBird.x + 5, targetBird.y, 25);
    expect(hit).toBe(true);
    expect(targetBird.alive).toBe(false);
    expect(killed).toHaveBeenCalledWith(targetBird.x, targetBird.y);
    expect(rush.getAliveBirds()).toHaveLength(27);

    // Blast a cluster of birds with an explosion
    const nextBird = rush.getAliveBirds()[0];
    const blastKills = rush.blast(nextBird.x, nextBird.y, 40, 50);
    expect(blastKills).toBeGreaterThanOrEqual(1);
    expect(rush.getAliveBirds().length).toBeLessThan(27);

    // When the player collides with an alive crow, contact damage is inflicted
    const aliveOne = rush.getAliveBirds()[0];
    const pull = rush.update(16, 1600, { x: aliveOne.x, y: aliveOne.y }, false);
    expect(pull?.damage).toBe(8);

    // Eliminating all remaining crows disperses the flock early
    rush.blast(aliveOne.x, aliveOne.y, 2000, 100);
    expect(rush.getAliveBirds()).toHaveLength(0);
    expect(rush.isActive()).toBe(false);
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
