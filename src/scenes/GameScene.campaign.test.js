import { describe, expect, it, vi } from 'vitest';
import { GameScene } from './GameScene';
import { getStage } from '../data/stages';
import { getBossCombat } from '../data/bossCombat';

vi.mock('phaser', () => ({ default: {
  Scene: class {}, Events: { EventEmitter: class {} },
  Math: { Clamp: (v, min, max) => Math.max(min, Math.min(max, v)) },
} }));
vi.mock('../audio/SoundManager', () => ({ sounds: {
  playBossWarning: vi.fn(), playBossDefeatedScream: vi.fn(), playRevolver: vi.fn(), playRifle: vi.fn(),
} }));

function sprite(x = 0, y = 0) {
  const s = { x, y, active: true, anims: {}, destroy: vi.fn(), play: vi.fn() };
  for (const method of ['setScale', 'setDepth', 'setTint', 'clearTint', 'setFlipX', 'setRotation', 'setOrigin', 'setScrollFactor']) s[method] = () => s;
  return s;
}
function bossHarness(stage) {
  const game = Object.create(GameScene.prototype);
  Object.assign(game, {
    stage, stageConfig: getStage(stage), bossMembers: [], enemies: [], player: sprite(4000, 4000),
    worldMap: { spawnPointAround: () => ({ x: 4500, y: 4000 }), resolve: (x, y) => ({ x, y }) },
    scale: { width: 1280, height: 720 }, cameras: { main: { shake: vi.fn() } },
    add: { text: () => sprite(), sprite }, textures: { exists: () => false },
    anims: { exists: () => true }, tweens: { add: vi.fn() }, bossBarContainer: { setVisible: vi.fn() },
    updateBossBar: vi.fn(), drops: [], kills: 0, killsText: { setText: vi.fn() },
    addBounty: vi.fn(), gameEvents: { emitEnemyKilled: vi.fn() }, victory: vi.fn(),
  });
  return game;
}

describe('campaign scene integration without rendering', () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8])('spawns the correct boss sprites and stats for stage %i', stage => {
    const game = bossHarness(stage);
    game.spawnStageBoss();
    const profile = getBossCombat(stage);
    expect(game.bossSpawned).toBe(true);
    expect(game.bossMembers.length).toBe(profile.slugs.length);
    expect(game.bossMembers.map(e => e.bossSlug ?? 'greedwell')).toEqual(profile.slugs);
    expect(game.bossMembers.every(e => e.hp === profile.hp)).toBe(true);
  });
  it('does not clear the saloon when just one Smith brother dies', () => {
    const game = bossHarness(4);
    game.spawnStageBoss();
    game.killEnemy(game.bossMembers[0]);
    expect(game.victory).not.toHaveBeenCalled();
    expect(game.bossMembers.filter(enemy => !enemy.dead)).toEqual([game.bossMembers[1]]);
    game.killEnemy(game.bossMembers[1]);
    expect(game.victory).toHaveBeenCalledTimes(1);
    game.killEnemy(game.bossMembers[1]);
    expect(game.victory).toHaveBeenCalledTimes(1);
  });
  it.each([1, 8])('never lets a kill count skip the timer in stage %i', stage => {
    const game = bossHarness(stage);
    Object.assign(game, {
      isGameOver: false, bossDefeated: false, bossSpawned: false, kills: 50000, gameTimeSeconds: 88,
      hpRegen: 0, timeText: { setText: vi.fn() }, encounters: { tick: vi.fn() },
      director: { tick: () => [] }, runSpawnOrders: vi.fn(), updateStageStatus: vi.fn(), spawnStageBoss: vi.fn(),
    });
    game.onSecondTick(); expect(game.spawnStageBoss).not.toHaveBeenCalled();
    game.gameTimeSeconds = getStage(stage).duration - 1;
    game.onSecondTick(); expect(game.spawnStageBoss).toHaveBeenCalledTimes(1);
  });
  it('uses different attack families instead of replaying Simon for every boss', () => {
    for (let stage = 2; stage <= 8; stage++) {
      const game = bossHarness(stage);
      Object.assign(game, {
        fireHostileBullet: vi.fn(), startCharge: vi.fn(), enemyThrowDynamite: vi.fn(), bossRevolverBarrage: vi.fn(),
        encounters: { warn: vi.fn() }, showBanner: vi.fn(), runSpawnOrders: vi.fn(),
        time: { now: 10000, delayedCall: (_delay, callback) => callback() },
      });
      const enemy = { sprite: sprite(3900, 4000), hp: 100, maxHp: 1000, attackCount: 4 };
      game.stageBossAttack(enemy);
      expect(game.bossRevolverBarrage).not.toHaveBeenCalled();
      if (stage === 3) expect(game.startCharge).toHaveBeenCalled();
      if (stage === 4) expect(game.enemyThrowDynamite).toHaveBeenCalledTimes(3);
      if (stage === 5) expect(enemy.vulnerableUntil).toBe(11300);
      if (stage === 7) expect(game.fireHostileBullet).toHaveBeenCalledTimes(10);
      if (stage === 8) expect(game.runSpawnOrders).toHaveBeenCalled();
    }
  });
  it('telegraphs a bull charge and keeps its direction locked when the player changes course', () => {
    const game = bossHarness(1);
    const line = { setDepth: () => line, lineStyle: () => line, lineBetween: () => line, destroy: vi.fn() };
    game.add.graphics = () => line;
    game.time = { delayedCall: vi.fn() };
    const bull = { type: 'longhorn', sprite: sprite(), chargeCooldown: 0, dirX: 1, dirY: 0 };
    game.updateEnemyTactics(bull, 300, 0, 300, 16);
    expect(bull.chargeWindup).toBeGreaterThan(0);
    expect(bull.chargeRemaining).toBeUndefined();
    game.updateEnemyTactics(bull, 0, 300, 300, 600);
    game.updateEnemyTactics(bull, 0, 300, 300, 500);
    expect(bull.chargeRemaining).toBeGreaterThan(0);
    expect(bull.dirX).toBe(1); expect(bull.dirY).toBe(0);
  });

  it('keeps Simon original firing cooldown even at low health', () => {
    const game = bossHarness(1);
    const enemy = { sprite: sprite(3500, 4000), type: 'boss', hp: 1, maxHp: 2000, speed: 105, throwCooldown: 0 };
    game.enemies = [enemy];
    game.enemyHash = { rebuild: vi.fn() };
    game.bossRevolverBarrage = vi.fn();
    game.updateEnemies(16);
    expect(enemy.throwCooldown).toBe(1800);
    expect(game.bossRevolverBarrage).toHaveBeenCalledTimes(1);
  });

});

it('pays the final boss cash once before victory and removes it from the unreachable drop', () => {
  const game = bossHarness(1); game.spawnStageBoss();
  const boss = game.bossMembers[0];
  game.killEnemy(boss); game.killEnemy(boss);
  expect(game.addBounty).toHaveBeenCalledExactlyOnceWith(250);
  expect(game.drops[0]).toMatchObject({ type: 'badge', val: 300, bounty: 0 });
  expect(game.victory).toHaveBeenCalledTimes(1);
});
