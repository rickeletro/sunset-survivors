import { describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { createRequire } from 'node:module';
import { getStage } from '../data/stages';
import { GameScene } from './GameScene';
import { SaloonVisit } from '../data/saloon';
vi.mock('phaser', () => ({ default: { Scene: class {}, Events: { EventEmitter: class {} } } }));
vi.mock('../audio/SoundManager', () => ({ sounds: { playReload: vi.fn(), playCoin: vi.fn(), playHit: vi.fn() } }));

function fixture() {
  const g = Object.create(GameScene.prototype);
  Object.assign(g, { saloonVisit: new SaloonVisit([{ x: 3580, y: 3668 }, { x: 1000, y: 1000 }]),
    player: { x: 3580, y: 3668 }, hp: 50, maxHp: 150, bounty: 0, currentXp: 0,
    combatElapsedMs: 1000, invulnUntil: 0, time: { now: 1000, paused: false }, tweens: { paused: false }, gameTimeSeconds: 30,
    activeWeapons: new Map([['shotgun', 3]]), weaponTimers: new Map([['shotgun', 300]]),
    enemies: [{ hp: 100, chargeRemaining: 500 }], projectiles: [{ life: 100 }], fireZones: [{ life: 500 }],
    saloonPrompt: { setVisible: vi.fn() }, updateHpBar: vi.fn(), bountyText: { setText: vi.fn() },
    cameras: { main: { flash: vi.fn() } }, scene: { launch: vi.fn(), pause: vi.fn(), resume: vi.fn(), stop: vi.fn() } });
  return g;
}

describe('saloon integration without browser gameplay', () => {
  it('explicitly pauses the scene, freezes combat/state, grants a bounded reward once and resumes in place', () => {
    const g = fixture();
    g.openSaloon();
    expect(g.scene.pause).toHaveBeenCalledWith('GameScene');
    expect(g.time.paused).toBe(true); expect(g.tweens.paused).toBe(true);
    expect(g.scene.launch).toHaveBeenCalledWith('SaloonScene', expect.any(Object));
    const leave = g.scene.launch.mock.calls[0][1].onLeave;
    const before = JSON.stringify({ player: g.player, weapons: [...g.activeWeapons], timers: [...g.weaponTimers], enemies: g.enemies, shots: g.projectiles, fire: g.fireZones });
    g.time.now += 300000;
    for (let i = 0; i < 5; i++) { g.update(g.time.now, 1000); g.onSecondTick(); g.spawnWave(); }
    expect(g.gameTimeSeconds).toBe(30); expect(g.combatElapsedMs).toBe(1000);
    leave(true); leave(true);
    expect(g.time.paused).toBe(false); expect(g.tweens.paused).toBe(false);
    expect(g.hp).toBe(80); expect(g.bounty).toBe(15); expect(g.currentXp).toBe(0);
    expect(g.invulnUntil).toBe(1600);
    expect(JSON.stringify({ player: g.player, weapons: [...g.activeWeapons], timers: [...g.weaponTimers], enemies: g.enemies, shots: g.projectiles, fire: g.fireZones })).toBe(before);
    expect(g.scene.resume).toHaveBeenCalledExactlyOnceWith('GameScene');
    g.openSaloon(); expect(g.scene.launch).toHaveBeenCalledTimes(1);
  });
  it.each(['isGameOver', 'bossSpawned', 'bossDefeated', 'choosingUpgrade', 'saloonOpen'])('blocks entry during %s', flag => {
    const g = fixture(); g[flag] = true; g.openSaloon();
    expect(g.scene.pause).not.toHaveBeenCalled(); expect(g.saloonVisit.used).toBe(false);
  });
  it('does not interrupt onboarding or enter from outside the door radius', () => {
    const g = fixture(); g.onboarding = { visible: true }; g.openSaloon();
    expect(g.scene.launch).not.toHaveBeenCalled(); g.onboarding.visible = false;
    g.player.x += 101; g.openSaloon(); expect(g.scene.launch).not.toHaveBeenCalled();
  });
  it('caps healing, allows reward-free exit and ignores a stale callback from a previous attempt', () => {
    const g = fixture(); g.hp = 149; g.openSaloon();
    const leave = g.scene.launch.mock.calls[0][1].onLeave; leave(true); expect(g.hp).toBe(150);
    const decline = fixture(); decline.openSaloon(); decline.scene.launch.mock.calls[0][1].onLeave(false);
    expect(decline.bounty).toBe(0); expect(decline.hp).toBe(50); expect(decline.saloonVisit.used).toBe(true);
    const stale = fixture(); stale.openSaloon(); const old = stale.scene.launch.mock.calls[0][1].onLeave;
    stale.saloonVisit = new SaloonVisit([]); old(true);
    expect(stale.bounty).toBe(0); expect(stale.scene.resume).not.toHaveBeenCalled();
  });
  it('does not let wall-clock time consume post-visit invulnerability', () => {
    const g = fixture(); g.openSaloon(); g.time.now += 60000;
    g.scene.launch.mock.calls[0][1].onLeave(true);
    g.damagePlayer(100); expect(g.hp).toBe(80);
  });
});

it.each(['keyboard', 'touch'])('registers explicit %s entry and disposes listeners on shutdown', mode => {
  const g = fixture(), texts = [];
  g.stageConfig = getStage(1);
  g.input = { keyboard: new EventEmitter() }; g.events = new EventEmitter();
  g.scale = Object.assign(new EventEmitter(), { width: 1920, height: 1080 });
  g.add = { text(x, y, label) {
    const obj = Object.assign(new EventEmitter(), { x, y, label });
    for (const method of ['setOrigin', 'setDepth', 'setScrollFactor', 'setVisible', 'setInteractive', 'setPosition']) obj[method] = () => obj;
    texts.push(obj); return obj;
  } };
  g.createSaloonInteraction();
  if (mode === 'keyboard') g.input.keyboard.emit('keydown-E');
  else {
    const event = { stopPropagation: vi.fn() };
    texts.find(t => t.label.startsWith('[E]')).emit('pointerdown', {}, 0, 0, event);
    expect(event.stopPropagation).toHaveBeenCalledOnce();
  }
  expect(g.scene.launch).toHaveBeenCalledOnce();
  g.events.emit('shutdown');
  expect(g.input.keyboard.listenerCount('keydown-E')).toBe(0);
  expect(g.scale.listenerCount('resize')).toBe(0);
});

it('freezes and restores a real Phaser timer even when wall-clock time advances for minutes', () => {
  const Clock = createRequire(import.meta.url)('phaser/src/time/Clock.js');
  const clock = new Clock({ sys: { events: new EventEmitter() } });
  const fire = vi.fn();
  const timer = clock.addEvent({ delay: 1000, callback: fire }); clock.preUpdate();
  clock.update(100, 100); expect(timer.elapsed).toBe(100);
  const g = fixture(); g.time = clock; g.openSaloon();
  clock.update(300100, 300000);
  expect(clock.now).toBe(300100); expect(timer.elapsed).toBe(100); expect(fire).not.toHaveBeenCalled();
  g.scene.launch.mock.calls[0][1].onLeave(true);
  clock.update(300200, 100); expect(timer.elapsed).toBe(200); expect(fire).not.toHaveBeenCalled();
  clock.update(301000, 800); expect(fire).toHaveBeenCalledOnce();
});
