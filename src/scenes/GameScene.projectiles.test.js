import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';
import { GameScene } from './GameScene';

vi.mock('phaser', () => ({ default: { Scene: class {}, Events: { EventEmitter: class {} } } }));
vi.mock('../audio/SoundManager', () => ({ sounds: { playRevolver: vi.fn() } }));

// Use Phaser's installed tween engine itself: a callback-only mock misses the crash.
const require = createRequire(import.meta.url);
const TweenBuilder = require('phaser/src/tweens/builders/TweenBuilder.js');

function fixture() {
  const tweens = [];
  const bullets = [];
  const manager = {
    timeScale: 1,
    emit: vi.fn(),
    add(config) {
      const tween = TweenBuilder(manager, config);
      tween.reset();
      tweens.push(tween);
      return tween;
    },
    killTweensOf(target) {
      for (const tween of tweens) if (tween.targets?.includes(target)) tween.destroy();
    },
  };
  const scene = Object.create(GameScene.prototype);
  Object.assign(scene, {
    isGameOver: false, bossDefeated: false, player: { x: 4000, y: 4000 },
    damagePlayer: vi.fn(), tweens: manager,
    add: { sprite(x, y) {
      const bullet = { x, y, rotation: 0, active: true };
      bullet.destroy = vi.fn(() => { bullet.active = false; });
      for (const method of ['setDepth', 'setTint', 'setRotation']) bullet[method] = () => bullet;
      bullets.push(bullet);
      return bullet;
    } },
  });
  const step = () => {
    for (const tween of [...tweens]) {
      if (tween.isDestroyed()) continue;
      // The real manager destroys pending tweens AFTER update returns.
      if (tween.update(16)) tween.destroy();
    }
  };
  return { scene, bullets, tweens, step };
}

describe('enemy projectile tween lifecycle', () => {
  it.each([false, true])('survives a hit while updating multiple properties (axe=%s)', axe => {
    const { scene, bullets, step } = fixture();
    scene.fireHostileBullet(4000, 4000, 0, 14, 380, axe);
    expect(() => { for (let i = 0; i < 6; i++) step(); }).not.toThrow();
    expect(scene.damagePlayer).toHaveBeenCalledTimes(1);
    expect(scene.damagePlayer).toHaveBeenCalledWith(14);
    expect(bullets[0].destroy).toHaveBeenCalledTimes(1);
  });
  it('survives simultaneous hits from Simon radial barrage', () => {
    const { scene, bullets, step } = fixture();
    scene.bossRevolverBarrage(4000, 4000);
    expect(() => { for (let i = 0; i < 6; i++) step(); }).not.toThrow();
    expect(scene.damagePlayer).toHaveBeenCalledTimes(8);
    expect(bullets.every(b => b.destroy.mock.calls.length === 1)).toBe(true);
  });
  it('keeps unrelated scene tweens running after a projectile hit', () => {
    const { scene, step } = fixture();
    scene.fireHostileBullet(4000, 4000, 0, 14, 380);
    const unrelated = { x: 0 };
    scene.tweens.add({ targets: unrelated, x: 100, duration: 500 });
    expect(() => { for (let i = 0; i < 10; i++) step(); }).not.toThrow();
    expect(unrelated.x).toBeGreaterThan(0);
  });
  it('allows missed bullets to complete and disappear normally', () => {
    const { scene, bullets, step } = fixture();
    scene.player = { x: 100, y: 100 };
    scene.fireHostileBullet(4000, 4000, 0, 14, 380);
    for (let i = 0; i < 150; i++) step();
    expect(scene.damagePlayer).not.toHaveBeenCalled();
    expect(bullets[0].destroy).toHaveBeenCalledTimes(1);
  });
});
