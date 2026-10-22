import { describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { createRequire } from 'node:module';
import { getStage } from '../data/stages';
import { CHARACTERS } from '../data/characters';
import { GameScene } from './GameScene';
import { SaloonVisit, saloonDoors } from '../data/saloon';
vi.mock('phaser', () => ({ default: { Scene: class {}, Events: { EventEmitter: class {} } } }));
vi.mock('../audio/SoundManager', () => ({ sounds: { playReload: vi.fn(), playCoin: vi.fn(), playHit: vi.fn(), playRicochet: vi.fn() } }));
vi.mock('../ui/BuildingPortalView', () => ({ BuildingPortalView: class {
  constructor(_scene, portal, label, enter) { Object.assign(this, { portal, label, enter, update: vi.fn(), destroy: vi.fn() }); }
} }));

function fixture() {
  const g = Object.create(GameScene.prototype), door = saloonDoors('canyon')[0];
  const player = { x: door.x, y: door.y, visible: true, texture: { key: 'pl_cormano_south_0' }, frame: { name: '__BASE' },
    scaleX: 0.5, scaleY: 0.5, anims: { stop: vi.fn() } };
  player.setFlipX = vi.fn(() => player); player.setTexture = vi.fn(() => player);
  Object.assign(g, { saloonVisit: new SaloonVisit([door]), saloonViews: [],
    player, character: CHARACTERS.cormano, usePixellab: true, facingDir: 'south', hp: 50, maxHp: 150, bounty: 0, currentXp: 0,
    combatElapsedMs: 1000, invulnUntil: 0, time: { now: 1000, paused: false }, tweens: { paused: false }, gameTimeSeconds: 30,
    worldMap: { buildingPath: vi.fn((a, b) => [{ x: a.x, y: a.y }, { x: b.x, y: b.y }]) },
    activeWeapons: new Map([['shotgun', 3]]), weaponTimers: new Map([['shotgun', 300]]),
    enemies: [{ hp: 100, chargeRemaining: 500 }], projectiles: [{ life: 100 }], fireZones: [{ life: 500 }], drops: [{ val: 10 }],
    updateHpBar: vi.fn(), bountyText: { setText: vi.fn() },
    cameras: { main: { scrollX: 2700, scrollY: 3100, zoom: 1.25 } },
    scene: { launch: vi.fn(), pause: vi.fn(), resume: vi.fn(), stop: vi.fn() } });
  return g;
}
const data = (g, key) => g.scene.launch.mock.calls.findLast(c => c[0] === key)[1];
function enterInterior(g) {
  g.openSaloon(); const motion = data(g, 'BuildingTransitionScene'); motion.onComplete(); return data(g, 'SaloonScene').onLeave;
}
const frozenState = g => JSON.stringify({ weapons: [...g.activeWeapons], timers: [...g.weaponTimers], enemies: g.enemies,
  shots: g.projectiles, fire: g.fireZones, drops: g.drops });

describe('animated saloon integration without browser gameplay', () => {
  it('freezes approach/interior/return, pays once at the end, preserves combat state and returns at the door', () => {
    const g = fixture(), before = frozenState(g);
    g.openSaloon();
    expect(g.scene.pause).toHaveBeenCalledWith('GameScene');
    expect(g.time.paused).toBe(true); expect(g.tweens.paused).toBe(true); expect(g.player.visible).toBe(false);
    const entry = data(g, 'BuildingTransitionScene');
    expect(entry.mode).toBe('enter'); expect(entry.camera).toEqual({ scrollX: 2700, scrollY: 3100, zoom: 1.25 });
    expect(g.scene.launch.mock.calls.some(c => c[0] === 'SaloonScene')).toBe(false);
    g.time.now += 300000;
    const assertFrozen = () => {
      g.update(g.time.now, 1000); g.onSecondTick(); g.spawnWave();
      expect(g.gameTimeSeconds).toBe(30); expect(g.combatElapsedMs).toBe(1000); expect(frozenState(g)).toBe(before);
    };
    assertFrozen(); entry.onComplete(); entry.onComplete(); assertFrozen();
    expect(g.scene.launch.mock.calls.filter(c => c[0] === 'SaloonScene')).toHaveLength(1);
    const leave = data(g, 'SaloonScene').onLeave; leave(true); leave(true); assertFrozen();
    expect(g.hp).toBe(50); expect(g.bounty).toBe(0);
    const exit = data(g, 'BuildingTransitionScene'); expect(exit.mode).toBe('exit');
    exit.onComplete(); exit.onComplete();
    expect(g.hp).toBe(80); expect(g.bounty).toBe(15); expect(g.currentXp).toBe(0);
    expect(g.player.visible).toBe(true); expect(g.time.paused).toBe(false); expect(g.tweens.paused).toBe(false);
    expect(g.player.x).toBe(3580); expect(g.player.y).toBe(3668); expect(g.invulnUntil).toBe(1600);
    expect(g.scene.resume).toHaveBeenCalledExactlyOnceWith('GameScene');
    g.openSaloon(); expect(g.scene.launch).toHaveBeenCalledTimes(3);
  });
  it.each(['isGameOver', 'bossSpawned', 'bossDefeated', 'choosingUpgrade', 'saloonOpen'])('blocks entry during %s', flag => {
    const g = fixture(); g[flag] = true; g.openSaloon(); expect(g.scene.launch).not.toHaveBeenCalled(); expect(g.saloonVisit.used).toBe(false);
  });
  it('requires proximity and a collision-free route before consuming the visit or freezing', () => {
    const g = fixture(); g.onboarding = { visible: true }; g.openSaloon(); expect(g.scene.launch).not.toHaveBeenCalled();
    g.onboarding.visible = false; g.player.x += 161; g.openSaloon(); expect(g.scene.launch).not.toHaveBeenCalled();
    g.player.x -= 161; g.worldMap.buildingPath.mockReturnValue(undefined); g.openSaloon();
    expect(g.saloonVisit.used).toBe(false); expect(g.time.paused).toBe(false); expect(g.player.visible).toBe(true);
  });
  it('caps healing, permits declining, cancels safely and ignores callbacks from an older attempt', () => {
    const g = fixture(); g.hp = 149; const leave = enterInterior(g); leave(true);
    data(g, 'BuildingTransitionScene').onComplete(); expect(g.hp).toBe(150);
    const decline = fixture(); enterInterior(decline)(false); data(decline, 'BuildingTransitionScene').onComplete();
    expect(decline.bounty).toBe(0); expect(decline.hp).toBe(50);
    const cancel = fixture(); cancel.openSaloon(); data(cancel, 'BuildingTransitionScene').onCancel();
    expect(cancel.player.visible).toBe(true); expect(cancel.time.paused).toBe(false); expect(cancel.saloonVisit.used).toBe(true);
    expect(cancel.bounty).toBe(0);
    const stale = fixture(); const oldLeave = enterInterior(stale); stale.saloonVisit = new SaloonVisit([]); oldLeave(true);
    expect(stale.bounty).toBe(0); expect(stale.scene.resume).not.toHaveBeenCalled();
  });
  it('orients the physical player to the path while preserving sprite proportions', () => {
    const g = fixture(); g.openSaloon(); data(g, 'BuildingTransitionScene').onPosition({ x: 3580, y: 3640 }, 1, -1);
    expect(g.player.setTexture).toHaveBeenLastCalledWith('pl_cormano_north_0');
    expect(g.player.scaleX).toBe(0.5); expect(g.player.scaleY).toBe(0.5);
  });
  it('preserves post-visit invulnerability against a large wall-clock jump', () => {
    const g = fixture(); const leave = enterInterior(g); g.time.now += 60000; leave(true);
    data(g, 'BuildingTransitionScene').onComplete(); g.damagePlayer(100); expect(g.hp).toBe(80);
  });
});

it.each(['keyboard', 'facade'])('registers explicit %s entry and disposes the portal on shutdown', mode => {
  const g = fixture(); g.stageConfig = getStage(1); g.input = { keyboard: new EventEmitter() }; g.events = new EventEmitter();
  g.createSaloonInteraction(); const view = g.saloonViews[0].view;
  if (mode === 'keyboard') g.input.keyboard.emit('keydown-E'); else view.enter();
  expect(g.scene.launch).toHaveBeenCalledOnce(); const old = data(g, 'BuildingTransitionScene');
  g.events.emit('shutdown'); expect(g.input.keyboard.listenerCount('keydown-E')).toBe(0); expect(view.destroy).toHaveBeenCalledOnce();
  expect(g.player.visible).toBe(true); expect(g.time.paused).toBe(false);
  old.onComplete(); old.onCancel(); expect(g.scene.resume).not.toHaveBeenCalled();
});

it('conserves a real Phaser timer through all transition phases even after minutes of wall time', () => {
  const Clock = createRequire(import.meta.url)('phaser/src/time/Clock.js');
  const clock = new Clock({ sys: { events: new EventEmitter() } }), fire = vi.fn();
  const timer = clock.addEvent({ delay: 1000, callback: fire }); clock.preUpdate(); clock.update(100, 100);
  const g = fixture(); g.time = clock; const leave = enterInterior(g); clock.update(300100, 300000);
  expect(timer.elapsed).toBe(100); leave(true); clock.update(400100, 100000); expect(timer.elapsed).toBe(100);
  data(g, 'BuildingTransitionScene').onComplete(); clock.update(400200, 100); expect(timer.elapsed).toBe(200);
  clock.update(401000, 800); expect(fire).toHaveBeenCalledOnce();
});

it('preloads the interior before a doorway transition so entry does not wait on art loading', () => {
  const g = fixture(); g.stage = 1; g.stageConfig = getStage(1);
  g.textures = { exists: () => false }; g.load = { image: vi.fn() }; g.preload();
  const keys = new Set(g.load.image.mock.calls.map(c => c[0]));
  for (const key of ['saloon_bkg', 'intro_bkg', 'ui_pulp_paper', 'ui_pulp_wood', 'decor_lantern', 'decor_spark', 'saloon_cancan']) expect(keys.has(key)).toBe(true);
});
