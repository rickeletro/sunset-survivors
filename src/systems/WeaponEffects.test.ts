import { describe, expect, it, vi } from 'vitest';
import { WeaponEffects } from './WeaponEffects';
import type Phaser from 'phaser';
import type { Enemy, FireZone } from '../game/entities';
function fixture() {
  const textures = new Set<string>();
  const graphics: ReturnType<typeof graphic>[] = [];
  function graphic() {
    const g = { setDepth: vi.fn(), clear: vi.fn(), fillStyle: vi.fn(), fillRect: vi.fn(), fillEllipse: vi.fn(),
      fillTriangle: vi.fn(), lineStyle: vi.fn(), lineBetween: vi.fn(), strokePoints: vi.fn(),
      generateTexture: vi.fn((key: string) => textures.add(key)), destroy: vi.fn() };
    for (const key of ['setDepth', 'clear', 'fillStyle', 'fillRect', 'fillEllipse', 'fillTriangle', 'lineStyle', 'lineBetween', 'strokePoints'] as const) g[key].mockReturnValue(g);
    return g;
  }
  const make = () => { const g = graphic(); graphics.push(g); return g; };
  const enemies: Enemy[] = [];
  const damage = vi.fn();
  const scene = { add: { graphics: make }, make: { graphics: make }, textures: { exists: (key: string) => textures.has(key) }, events: { once: vi.fn(), emit: (_event: string) => { for (const [, callback] of scene.events.once.mock.calls) callback(); } } };
  const effects = new WeaponEffects(scene as unknown as Phaser.Scene, { position: () => ({ x: 0, y: 0 }), nearby: () => enemies, damage });
  return { effects, graphics, textures, enemies, damage, scene, make };
}
describe('scene-owned weapon effects', () => {
  it('caches each bullet tier and bottle texture instead of allocating textures per shot', () => {
    const f = fixture(), sprite = { setTexture: vi.fn() } as unknown as Phaser.GameObjects.Sprite;
    f.effects.dressBullet(sprite, 'rifle', 1); f.effects.dressBullet(sprite, 'rifle', 1);
    expect(f.textures.size).toBe(1);
    f.effects.dressBullet(sprite, 'rifle', 2); expect(f.textures.size).toBe(2);
    expect(f.effects.bottleTexture()).toBe(f.effects.bottleTexture()); expect(f.textures.size).toBe(3);
    expect(f.graphics.slice(1).every(g => g.destroy.mock.calls.length === 1)).toBe(true);
  });
  it('hits along the lash once per strike, alternates sides, and releases graphics on expiry', () => {
    const f = fixture();
    f.enemies.push(...[80, -80].map(x => ({ type: 'bandit', dead: false, sprite: { x, y: 0 } }) as Enemy));
    f.effects.whip(1, 2, 150, 40, 3, false);
    f.effects.update(160, []); f.effects.update(16, []);
    expect(f.damage).toHaveBeenCalledTimes(2);
    expect(f.damage).toHaveBeenCalledWith(f.enemies[0], 40); expect(f.damage).toHaveBeenCalledWith(f.enemies[1], 40);
    f.effects.update(400, []); expect(f.damage).toHaveBeenCalledTimes(2);
    expect(f.graphics.slice(1).every(g => g.destroy.mock.calls.length === 1)).toBe(true);
    f.effects.whip(1, 1, 150, 40, 3, false); f.effects.update(160, []);
    expect(f.damage).toHaveBeenCalledTimes(3);
    f.scene.events.emit('shutdown'); expect(f.graphics.every(g => g.destroy.mock.calls.length === 1)).toBe(true);
  });
  it('bounds active lashes and animates fire with no per-frame resource allocation', () => {
    const f = fixture(); for (let i = 0; i < 100; i++) f.effects.whip(1, 8, 150, 40, 5, true);
    expect(f.graphics).toHaveLength(13);
    const g = f.make(), count = f.graphics.length;
    const zone = { graphics: g, x: 0, y: 0, radius: 60, rank: 3, life: 1000 } as unknown as FireZone;
    f.effects.drawFire(zone, 0); const first = g.fillTriangle.mock.calls[0];
    g.fillTriangle.mockClear(); f.effects.drawFire(zone, 85);
    expect(g.fillTriangle.mock.calls[0]).not.toEqual(first); expect(f.graphics).toHaveLength(count);
    zone.life = -20; f.effects.drawFire(zone, 170);
    expect(g.fillStyle.mock.calls.every(call => call[1] === undefined || Number(call[1]) >= 0)).toBe(true);
  });
});
