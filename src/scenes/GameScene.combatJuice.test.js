import { describe, expect, it, vi } from 'vitest';
import { GameScene } from './GameScene';
import { sounds } from '../audio/SoundManager';

vi.mock('phaser', () => ({
  default: {
    Scene: class {},
    Events: { EventEmitter: class {} },
    Math: { Clamp: (v, min, max) => Math.max(min, Math.min(max, v)) },
  },
}));

vi.mock('../audio/SoundManager', () => ({
  sounds: {
    playBodyImpact: vi.fn(),
    playHit: vi.fn(),
    playCoin: vi.fn(),
  },
}));

function fixture() {
  const g = Object.create(GameScene.prototype);
  const player = { x: 100, y: 100, anims: {}, setPosition: vi.fn() };
  const mockGraphics = {
    clear: vi.fn().mockReturnThis(),
    fillStyle: vi.fn().mockReturnThis(),
    fillRect: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };
  const shakeFn = vi.fn();

  Object.assign(g, {
    player,
    enemies: [],
    drops: [],
    kills: 0,
    killsText: { setText: vi.fn() },
    critChance: 0,
    critMultiplier: 2,
    bloodGraphics: mockGraphics,
    bloodParticles: [],
    worldMap: {
      resolve: vi.fn((x, y) => ({ x, y })),
    },
    cameras: {
      main: { shake: shakeFn },
    },
    time: { delayedCall: vi.fn() },
    showDamageText: vi.fn(),
    gameEvents: { emitEnemyKilled: vi.fn() },
    add: {
      graphics: () => mockGraphics,
      sprite: () => ({ setScale: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis() }),
      text: () => ({ setOrigin: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis() }),
    },
    enemyPool: { release: vi.fn() },
  });

  return { g, player, mockGraphics, shakeFn };
}

describe('Game Juice & Combat Feel', () => {
  it('plays body impact sound and spawns red blood particles on enemy damage', () => {
    const { g } = fixture();
    const enemy = {
      type: 'bandit',
      hp: 100,
      maxHp: 100,
      dead: false,
      sprite: {
        x: 200,
        y: 100,
        setTintFill: vi.fn(),
        clearTint: vi.fn(),
        setPosition: vi.fn(),
      },
    };

    g.damageEnemy(enemy, 25, { x: 100, y: 100 });

    // SFX
    expect(sounds.playBodyImpact).toHaveBeenCalled();

    // Damage applied
    expect(enemy.hp).toBe(75);

    // Blood particles spawned with upward velocity
    expect(g.bloodParticles.length).toBeGreaterThan(0);
    expect(g.bloodParticles.every(p => p.vy < 0)).toBe(true); // Upward velocity
    expect(g.bloodParticles.every(p => [0xe52b20, 0xa51e16, 0x572449].includes(p.color))).toBe(true);
  });

  it('applies directional knockback to non-boss enemies based on impact origin', () => {
    const { g } = fixture();
    const enemy = {
      type: 'bandit',
      hp: 100,
      maxHp: 100,
      dead: false,
      sprite: {
        x: 150,
        y: 100,
        setTintFill: vi.fn(),
        setPosition: vi.fn(),
      },
    };

    // Hit from left (x: 100, y: 100) -> pushes right (enemy.x should increase)
    g.damageEnemy(enemy, 20, { x: 100, y: 100 });
    expect(enemy.sprite.setPosition).toHaveBeenCalledWith(154, 100);
  });

  it('triggers camera shake and extra sparks on critical hits', () => {
    const { g, shakeFn } = fixture();
    g.critChance = 1.0; // 100% crit

    const enemy = {
      type: 'bandit',
      hp: 200,
      maxHp: 200,
      dead: false,
      sprite: {
        x: 150,
        y: 100,
        setTintFill: vi.fn(),
        setPosition: vi.fn(),
      },
    };

    g.damageEnemy(enemy, 30, { x: 100, y: 100 });

    expect(shakeFn).toHaveBeenCalled();
    expect(enemy.hp).toBe(140); // 30 * 2.0 crit
    expect(enemy.sprite.setPosition).toHaveBeenCalledWith(158, 100); // 8px push on crit
  });

  it('spawns death splatter when enemy is killed', () => {
    const { g } = fixture();
    const enemy = {
      type: 'bandit',
      hp: 20,
      maxHp: 100,
      bountyVal: 5,
      xpVal: 10,
      dead: false,
      sprite: {
        x: 200,
        y: 100,
        setTintFill: vi.fn(),
        setPosition: vi.fn(),
        destroy: vi.fn(),
      },
    };
    g.enemies = [enemy];

    g.damageEnemy(enemy, 50, { x: 100, y: 100 });

    expect(enemy.dead).toBe(true);
    expect(g.kills).toBe(1);
    expect(g.bloodParticles.length).toBeGreaterThanOrEqual(10);
  });
});
