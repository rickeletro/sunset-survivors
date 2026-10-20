import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { GameScene } from './GameScene';
import { FirstRunTutorial } from '../systems/FirstRunTutorial';
import { getStage } from '../data/stages';
vi.mock('phaser', () => ({ default: { Scene: class {}, Events: { EventEmitter: class {} } } }));
vi.mock('../audio/SoundManager', () => ({ sounds: { playLevelUp: vi.fn() } }));

function fixture() {
  const game = Object.create(GameScene.prototype);
  const training = { type: 'bandit', training: true, pooled: true, sprite: {} };
  Object.assign(game, {
    onboarding: new FirstRunTutorial(false, 'keyboard', vi.fn()), practiceActive: true,
    player: { x: 4000, y: 4000, setDepth: vi.fn() }, time: { now: 0 },
    isGameOver: false, bossDefeated: false, hp: 100, maxHp: 100, hpRegen: 0, kills: 0, bounty: 0,
    gameTimeSeconds: 0, stage: 1, stageConfig: getStage(1), enemies: [], projectiles: [], fireZones: [], drops: [],
    enemyPool: { release: vi.fn() }, enemyHash: { rebuild: vi.fn() }, weaponTimers: new Map([['revolver', 300]]),
    timeText: { setText: vi.fn() }, director: { tick: vi.fn(() => []), waveOrders: vi.fn(() => []) },
    encounters: { tick: vi.fn(), update: vi.fn() }, worldMap: { update: vi.fn() },
    onboardingView: { update: vi.fn() }, updateStageStatus: vi.fn(), runSpawnOrders: vi.fn(),
    handlePlayerMovement: vi.fn(), handleWeaponsAutoFire: vi.fn(() => game.onboarding.fired()), updateProjectiles: vi.fn(),
    updateEnemies: vi.fn(), updateDrops: vi.fn(), updateFireZones: vi.fn(), showBanner: vi.fn(),
    spawnPracticeBandit: vi.fn(() => game.enemies.push(training)),
  });
  return { game, training };
}

describe('practice integrated with the campaign', () => {
  it('freezes campaign seconds, wave orders and damage until practice finishes', () => {
    const { game } = fixture();
    for (let i = 0; i < 30; i++) { game.onSecondTick(); game.spawnWave(); game.damagePlayer(50); }
    expect(game.gameTimeSeconds).toBe(0); expect(game.hp).toBe(100);
    expect(game.director.tick).not.toHaveBeenCalled(); expect(game.director.waveOrders).not.toHaveBeenCalled();
    game.onboarding.skip(); game.finishPractice(); game.onSecondTick(); game.spawnWave();
    expect(game.gameTimeSeconds).toBe(1); expect(game.director.tick).toHaveBeenCalledTimes(1);
    expect(game.director.waveOrders).toHaveBeenCalledTimes(1);
  });
  it('spawns exactly one practice target after movement, updates its collision hash and cleans up before combat', () => {
    const { game, training } = fixture();
    game.update(0, 16);
    expect(game.handleWeaponsAutoFire).not.toHaveBeenCalled(); expect(game.enemies).toHaveLength(0);
    game.handlePlayerMovement.mockImplementationOnce(() => { game.player.x += 56; });
    game.update(16, 16);
    expect(game.spawnPracticeBandit).toHaveBeenCalledTimes(1);
    expect(game.enemyHash.rebuild).toHaveBeenCalledWith([training]);
    expect(game.updateProjectiles).toHaveBeenCalled(); expect(game.updateEnemies).not.toHaveBeenCalled();
    const bullet = { sprite: { destroy: vi.fn() } }; game.projectiles.push(bullet);
    game.update(2216, 2200);
    expect(game.practiceActive).toBe(false); expect(game.enemies).toHaveLength(0);
    expect(game.enemyPool.release).toHaveBeenCalledWith(training.sprite); expect(bullet.sprite.destroy).toHaveBeenCalledTimes(1);
    expect(game.updateEnemies).toHaveBeenCalledTimes(1); expect(game.spawnPracticeBandit).toHaveBeenCalledTimes(1);
  });
  it('does not award kills, gold, drops or director events for practice targets', () => {
    const { game, training } = fixture(); game.enemies.push(training);
    game.killsText = { setText: vi.fn() }; game.addBounty = vi.fn(); game.gameEvents = { emitEnemyKilled: vi.fn() };
    game.killEnemy(training); game.killEnemy(training);
    expect(game.kills).toBe(0); expect(game.addBounty).not.toHaveBeenCalled();
    expect(game.gameEvents.emitEnemyKilled).not.toHaveBeenCalled(); expect(game.drops).toHaveLength(0);
    expect(game.enemyPool.release).toHaveBeenCalledTimes(1);
  });
});

describe('unambiguous keyboard and touch controls', () => {
  function touchFixture() {
    const game = Object.create(GameScene.prototype);
    Object.assign(game, {
      input: new EventEmitter(), events: new EventEmitter(), game: { events: new EventEmitter() }, scale: { width: 800 },
      touchPointerId: null, touchOrigin: null, touchVector: { x: 0, y: 0 }, touchJoystickGfx: { clear: vi.fn() },
      onboarding: new FirstRunTutorial(false, 'keyboard', vi.fn()), renderJoystick: vi.fn(),
    });
    game.setupTouchControls(); return game;
  }
  it('ignores mouse clicks and UI touches and gives joystick ownership to one finger', () => {
    const game = touchFixture(), first = { id: 1, x: 100, y: 400, wasTouch: true };
    game.input.emit('pointerdown', { ...first, wasTouch: false }); expect(game.touchOrigin).toBeNull();
    game.input.emit('pointerdown', first, [{}]); expect(game.touchOrigin).toBeNull();
    game.input.emit('pointerdown', first); expect(game.onboarding.mode).toBe('touch');
    game.input.emit('pointermove', { ...first, x: 200 }); expect(game.touchVector).toEqual({ x: 1, y: 0 });
    game.input.emit('pointerdown', { ...first, id: 2 }); game.input.emit('pointerup', { ...first, id: 2 });
    expect(game.touchPointerId).toBe(1);
    game.input.emit('pointerupoutside', first); expect(game.touchVector).toEqual({ x: 0, y: 0 });
  });
  it('releases the joystick on pause and blur and disposes the global blur listener', () => {
    const game = touchFixture(), finger = { id: 1, x: 100, y: 400, wasTouch: true };
    game.input.emit('pointerdown', finger); game.events.emit('pause'); expect(game.touchOrigin).toBeNull();
    game.input.emit('pointerdown', finger); game.game.events.emit('blur'); expect(game.touchOrigin).toBeNull();
    game.events.emit('shutdown'); expect(game.game.events.listenerCount('blur')).toBe(0);
    expect(game.events.listenerCount('pause')).toBe(0);
  });
});
