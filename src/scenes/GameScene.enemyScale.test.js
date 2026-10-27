import { describe, expect, it, vi } from 'vitest';
import { GameScene } from './GameScene';
import { waveEnemyStats } from '../data/waves';
import { ENEMY_DEFS } from '../data/enemies';
import { SpritePool } from '../systems/SpritePool';
import { playEnemyMovement } from '../systems/PixellabCombat';

vi.mock('phaser', () => ({ default: { Scene: class {}, Events: { EventEmitter: class {} }, GameObjects: { Sprite: class {} } } }));

function fixture(animated) {
  const sprite = { anims: { stop: vi.fn() }, play: vi.fn() };
  for (const method of ['setActive', 'setVisible', 'setOrigin', 'setTexture', 'setPosition', 'setScale', 'setAlpha', 'setRotation', 'setFlipX', 'clearTint', 'setDepth', 'setTint']) {
    sprite[method] = vi.fn().mockReturnValue(sprite);
  }
  const scene = {
    add: { group: () => ({ get: () => sprite, killAndHide: vi.fn() }) },
    textures: { exists: () => animated, get: () => ({ getSourceImage: () => ({ width: 128 }) }) },
    anims: { exists: () => true },
  };
  sprite.scene = scene;
  const game = Object.assign(Object.create(GameScene.prototype), scene, {
    enemies: [], gameTimeSeconds: 10,
    enemyPool: new SpritePool(scene, 5),
    worldMap: { resolve: vi.fn((x, y) => ({ x, y })) },
  });
  return { game, sprite };
}

describe('enemy visual size experiment', () => {
  it.each([false, true])('enlarges every non-boss kind by 40%% with animated assets = %s', animated => {
    const { game, sprite } = fixture(animated);
    for (const [kind, def] of Object.entries(ENEMY_DEFS)) {
      const enemy = game.spawnEnemy(kind, 100, 200);
      expect(sprite.setScale).toHaveBeenLastCalledWith(def.scale * (animated ? 0.5 : 1) * 1.4);
      expect(game.worldMap.resolve).toHaveBeenLastCalledWith(100, 200, def.radius);
      expect(enemy).toMatchObject({ type: kind, hp: waveEnemyStats(def, 10).hp,
        speed: waveEnemyStats(def, 10).speed, damage: waveEnemyStats(def, 10).damage, xpVal: def.xp, bountyVal: def.bounty });
      if (animated) {
        const calls = sprite.setScale.mock.calls.length;
        playEnemyMovement(sprite, kind, 1, 0);
        expect(sprite.setScale).toHaveBeenCalledTimes(calls);
      }
      game.enemyPool.release(sprite);
    }
    // Acquiring the same pooled sprite again must reset, never compound, its scale.
    game.spawnEnemy('bandit', 100, 200);
    expect(sprite.setScale).toHaveBeenLastCalledWith(ENEMY_DEFS.bandit.scale * (animated ? 0.5 : 1) * 1.4);
  });
});

describe('movement and collisions after detailed sprite migration', () => {
  it.each(Object.keys(ENEMY_DEFS))('preserves %s speed, steering radius and movement length', kind => {
    const { game, sprite } = fixture(true);
    game.player = { x: 1000, y: 0 };
    game.enemyHash = { rebuild: vi.fn(), query: () => [] };
    game.damagePlayer = vi.fn();
    sprite.x = 0; sprite.y = 0;
    const enemy = game.spawnEnemy(kind, 0, 0);
    enemy.aiTimer = 0;
    game.worldMap.chaseTarget = vi.fn(() => game.player);
    game.updateEnemies(100);
    expect(Math.hypot(sprite.x, sprite.y)).toBeCloseTo(waveEnemyStats(ENEMY_DEFS[kind], 10).speed * 0.1);
    expect(game.worldMap.chaseTarget).toHaveBeenCalledWith(0, 0, 1000, 0, ENEMY_DEFS[kind].radius);
    expect(game.worldMap.resolve).toHaveBeenLastCalledWith(sprite.x, sprite.y, ENEMY_DEFS[kind].radius);
    expect(game.damagePlayer).not.toHaveBeenCalled();
  });

  it.each([19, 21])('retains the 20-pixel contact threshold at distance %s', distance => {
    const { game, sprite } = fixture(true);
    game.player = { x: distance, y: 0 };
    game.enemyHash = { rebuild: vi.fn(), query: () => [] };
    game.damagePlayer = vi.fn(); sprite.x = 0; sprite.y = 0;
    game.spawnEnemy('bandit', 0, 0);
    game.updateEnemies(0);
    expect(game.damagePlayer).toHaveBeenCalledTimes(distance < 20 ? 1 : 0);
  });

  it.each([25, 27])('retains the 26-pixel projectile hit threshold at distance %s', distance => {
    const { game, sprite } = fixture(true);
    sprite.x = 0; sprite.y = 0;
    const enemy = game.spawnEnemy('bandit', 0, 0);
    game.enemyHash = { query: vi.fn(() => [enemy]) };
    game.damageEnemy = vi.fn();
    game.projectiles = [{ sprite: { x: distance, y: 0, destroy: vi.fn() }, vx: 0, vy: 0,
      life: 1000, damage: 10, hits: new Set(), pierce: 1 }];
    game.updateProjectiles(0);
    expect(game.enemyHash.query).toHaveBeenCalledWith(distance, 0, 26);
    expect(game.damageEnemy).toHaveBeenCalledTimes(distance < 26 ? 1 : 0);
  });
});

it('keeps a winding-up longhorn facing its locked charge direction without advancing', () => {
  const { game, sprite } = fixture(true);
  sprite.x = 0; sprite.y = 0;
  game.player = { x: -500, y: 0 };
  game.enemyHash = { rebuild: vi.fn(), query: () => [] };
  const enemy = game.spawnEnemy('longhorn', 0, 0);
  Object.assign(enemy, { chargeWindup: 500, chargeX: 1, chargeY: 0 });
  game.updateEnemies(100);
  expect(sprite.play).toHaveBeenLastCalledWith('enemy_pl_longhorn_east', true);
  expect(sprite.x).toBe(0); expect(sprite.y).toBe(0);
});
