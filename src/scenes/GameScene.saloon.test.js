import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { createRequire } from 'node:module';
import { getStage } from '../data/stages';
import { CHARACTERS } from '../data/characters';
import { GameScene } from './GameScene';
import { SaloonVisit, saloonDoors } from '../data/saloon';
import { setLocale } from '../i18n';
vi.mock('phaser', () => ({ default: { Scene: class {}, Events: { EventEmitter: class {} } } }));
vi.mock('../audio/SoundManager', () => ({ sounds: { playReload: vi.fn(), playCoin: vi.fn(), playHit: vi.fn(), playRicochet: vi.fn() } }));
vi.mock('../ui/BuildingPortalView', () => ({ BuildingPortalView: class {
  constructor(_scene, portal, label, enter) { Object.assign(this, { portal, label, enter, update: vi.fn(), destroy: vi.fn() }); }
} }));

beforeEach(() => {
  setLocale('en');
});

function fixture() {
  const g = Object.create(GameScene.prototype), door = saloonDoors('canyon')[0];
  const player = { x: door.x, y: door.y, visible: true, texture: { key: 'pl_cormano_south_0' }, frame: { name: '__BASE' },
    scaleX: 0.5, scaleY: 0.5, anims: { stop: vi.fn() } };
  player.setFlipX = vi.fn(() => player); player.setTexture = vi.fn(() => player);
  Object.assign(g, { stageConfig: getStage(1), saloonVisit: new SaloonVisit([door]), saloonViews: [],
    player, character: CHARACTERS.cormano, usePixellab: true, facingDir: 'south', hp: 50, maxHp: 150, bounty: 0, currentXp: 0,
    combatElapsedMs: 1000, invulnUntil: 0, time: { now: 1000, paused: false }, tweens: { paused: false }, gameTimeSeconds: 30,
    worldMap: { buildingPath: vi.fn((a, b) => [{ x: a.x, y: a.y }, { x: b.x, y: b.y }]) },
    activeWeapons: new Map([['shotgun', 3]]), weaponTimers: new Map([['shotgun', 300]]),
    enemies: [{ hp: 100, chargeRemaining: 500 }], projectiles: [{ life: 100 }], fireZones: [{ life: 500 }], drops: [{ val: 10 }],
    generateUpgradeChoices: vi.fn(() => [{ type: 'weapon', id: 'shotgun', name: 'Shotgun', icon: 'shotgun', currentLevel: 3, nextLevel: 4, description: 'Upgrade shotgun' }]),
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
  it('enables and enters a facade from its side, outside the former door circle', () => {
    const g = fixture(), door = g.saloonVisit.doors[0], f = door.portal.facade;
    g.player.x = f.x + f.width / 2 + 120; g.player.y = f.y + 40;
    expect(Math.hypot(g.player.x - door.x, g.player.y - door.y)).toBeGreaterThan(160);
    const view = { update: vi.fn() }; g.saloonViews = [{ door, view }];
    g.updateSaloonPrompt();
    expect(view.update).toHaveBeenCalledWith(120, true, false, 1000, false);
    g.openSaloon(door);
    expect(g.scene.launch).toHaveBeenCalledWith('BuildingTransitionScene', expect.objectContaining({ mode: 'enter' }));
    expect(g.worldMap.buildingPath).toHaveBeenCalledWith(g.player, door.portal.threshold);
  });
  it('freezes approach/interior/return, pays once at the end, preserves combat state and returns at the door', () => {
    const g = fixture(), before = frozenState(g); g.bounty=100;
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
    expect(g.hp).toBe(80); expect(g.bounty).toBe(40);
    const exit = data(g, 'BuildingTransitionScene'); expect(exit.mode).toBe('exit');
    exit.onComplete(); exit.onComplete();
    expect(g.hp).toBe(80); expect(g.bounty).toBe(40); expect(g.currentXp).toBe(0);
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
    g.onboarding.visible = false; g.player.x += 1000; g.openSaloon(); expect(g.scene.launch).not.toHaveBeenCalled();
    g.player.x -= 1000; g.worldMap.buildingPath.mockReturnValue(undefined); g.openSaloon();
    expect(g.saloonVisit.used).toBe(false); expect(g.time.paused).toBe(false); expect(g.player.visible).toBe(true);
  });
  it('caps healing, permits declining, cancels safely and ignores callbacks from an older attempt', () => {
    const g = fixture(); g.hp = 149; g.bounty=60; const leave = enterInterior(g); leave(true);
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
    const g = fixture(); g.bounty=60; const leave = enterInterior(g); g.time.now += 60000; leave(true);
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

it('restores the camera and grants railroad XP once after returning to the street', () => {
  const g = fixture(), doors = saloonDoors('railroad');
  g.bounty = 100; g.stageConfig = getStage(2); g.player.x = doors[0].x; g.player.y = doors[0].y;
  g.saloonVisit = new SaloonVisit(doors, { healthFraction: 0.2, bounty: 35, xp: 40 }, true);
  g.awardXp = vi.fn();
  g.openSaloon(); const entry = data(g, 'BuildingTransitionScene');
  entry.onZoom(1.28); expect(g.cameras.main.zoom).toBe(1.28);
  entry.onComplete(); expect(g.awardXp).not.toHaveBeenCalled();
  expect(data(g, 'SaloonScene').faro).toBe(true);
  data(g, 'SaloonScene').onLeave(true); const exit = data(g, 'BuildingTransitionScene');
  exit.onComplete(); exit.onComplete();
  expect(g.cameras.main.zoom).toBe(1.25);
  expect(g.awardXp).not.toHaveBeenCalled();
  expect(g.bounty).toBe(100);
  expect(g.saloonVisit.wasUsed(doors[0])).toBe(true);
  expect(g.saloonVisit.wasUsed(doors[1])).toBe(false);
});

function faroFixture() {
  const g = fixture(), doors = saloonDoors('railroad');
  g.bounty = 100; g.stageConfig = getStage(2); g.player.x = doors[0].x; g.player.y = doors[0].y;
  g.saloonVisit = new SaloonVisit(doors, { healthFraction: 0.2, bounty: 0 }, true, true);
  return g;
}
it('grants the actual arsenal item and Faro winnings once only after returning outside', () => {
  const g = faroFixture(); g.bounty = 200;
  const leave = enterInterior(g), interior = data(g, 'SaloonScene');
  interior.table.cards = [{ rank: 2, suit: 0 }, { rank: 7, suit: 1 }];
  expect(interior.prize.id).toBe('shotgun');
  interior.table.placeBet(7, 'player', 40); interior.table.deal();
  expect(g.bounty).toBe(200); expect(g.activeWeapons.get('shotgun')).toBe(3);
  leave(true); leave(true);
  const exit = data(g, 'BuildingTransitionScene'); exit.onComplete(); exit.onComplete();
  expect(g.bounty).toBe(240); expect(g.activeWeapons.get('shotgun')).toBe(5);
  expect(g.weaponTimers.get('shotgun')).toBe(300);
  expect(g.saloonVisit.wasUsed(g.saloonVisit.doors[0])).toBe(true);
});
it('settles a paid loss even if leaving without the complimentary heal', () => {
  const g = faroFixture(); g.bounty = 100;
  const leave = enterInterior(g), table = data(g, 'SaloonScene').table;
  table.cards = [{ rank: 7, suit: 0 }, { rank: 2, suit: 1 }];
  table.placeBet(7, 'player', 20); table.deal();
  leave(false); expect(g.bounty).toBe(100);
  data(g, 'BuildingTransitionScene').onComplete();
  expect(g.bounty).toBe(80); expect(g.hp).toBe(50); expect(g.activeWeapons.get('shotgun')).toBe(3);
});

it('configures railroad visits for playable Faro instead of the old fixed cash/XP courtesy', () => {
  const g = fixture(); g.stageConfig = getStage(2);
  g.input = { keyboard: new EventEmitter() }; g.events = new EventEmitter();
  g.createSaloonInteraction();
  const visit = g.saloonVisit, door = visit.doors[0];
  expect(visit.enter(door.x, door.y, false, door)).toBe(true);
  expect(visit.leave(true)).toBeUndefined();
});

it('does not consume a Faro visit before the player can afford the smallest coin', () => {
  const g = faroFixture(); g.bounty = 1; g.showBanner = vi.fn(); g.openSaloon();
  expect(g.scene.launch).not.toHaveBeenCalled(); expect(g.saloonVisit.used).toBe(false);
  expect(g.showBanner).toHaveBeenCalledWith('FARO: COLLECT AT LEAST $2 IN BOUNTY TO PLAY', '#ffc52a');
});

it('allows returning to Faro after a paid loss and locks only after the displayed capped prize is won', () => {
  const g = faroFixture(); g.bounty=300;
  const lose = enterInterior(g); let table = data(g, 'SaloonScene').table;
  expect(data(g, 'SaloonScene').prize.nextLevel).toBe(5);
  table.cards = [{ rank: 7, suit: 0 }, { rank: 2, suit: 0 }]; table.placeBet(7, 'player', 10); table.deal();
  lose(true); data(g, 'BuildingTransitionScene').onComplete();
  expect(g.bounty).toBe(290); expect(g.hp).toBe(50); expect(g.saloonVisit.wasUsed(g.saloonVisit.doors[0])).toBe(false);
  const win = enterInterior(g); table = data(g, 'SaloonScene').table;
  table.cards = [{ rank: 2, suit: 0 }, { rank: 7, suit: 0 }]; table.placeBet(7, 'player', 40); table.deal();
  win(true); data(g, 'BuildingTransitionScene').onComplete();
  expect(g.bounty).toBe(330); expect(g.hp).toBe(50); expect(g.activeWeapons.get('shotgun')).toBe(5);
  expect(g.saloonVisit.wasUsed(g.saloonVisit.doors[0])).toBe(true);
});

it('applies all passive upgrade steps through the existing effects and respects level five', () => {
  const g = faroFixture(); g.bounty=200; g.activePassives = new Map([['badge', 1]]);
  g.generateUpgradeChoices.mockReturnValue([{ type: 'passive', id: 'badge', name: 'Sheriff Star', icon: 'badge', currentLevel: 1, nextLevel: 2, description: '' }]);
  const leave = enterInterior(g), table = data(g, 'SaloonScene').table;
  table.cards = [{ rank: 2, suit: 0 }, { rank: 7, suit: 0 }]; table.placeBet(7, 'player', 40); table.deal();
  leave(true); const exit = data(g, 'BuildingTransitionScene'); exit.onComplete(); exit.onComplete();
  expect(g.activePassives.get('badge')).toBe(5); expect(g.xpBonus).toBe(2.2); expect(g.bounty).toBe(240);
});
it('does not offer cash as a substitute when no weapon or upgrade can improve', () => {
  const g = faroFixture(); g.showBanner = vi.fn();
  g.generateUpgradeChoices.mockReturnValue([{ type: 'reward', id: 'gold_purse', name: 'Cash', currentLevel: 0, nextLevel: 1, description: '' }]);
  g.openSaloon(); expect(g.scene.launch).not.toHaveBeenCalled(); expect(g.saloonVisit.used).toBe(false);
});

it('offers a separate gallery in stage three and pays its result once after returning, preserving Faro', () => {
  const g = fixture(), doors = saloonDoors('burning-town'), door = doors.find(d => d.activity === 'gallery');
  g.stageConfig = getStage(3); g.bounty=100; g.player.x = door.x; g.player.y = door.y;
  g.saloonVisit = new SaloonVisit(doors, undefined, true); g.awardXp = vi.fn();
  enterInterior(g); const interior = data(g, 'SaloonScene');
  expect(interior.onBuy('gallery')).toBe(true);
  expect(interior.onBuy('gallery')).toBe(false);
  expect(interior.gallery).toBe(true); expect(interior.faro).toBe(false);
  interior.onGalleryLeave({ bounty: 12, xp: 20 }); interior.onGalleryLeave({ bounty: 12, xp: 20 });
  expect(g.bounty).toBe(55); const exit = data(g, 'BuildingTransitionScene'); exit.onComplete(); exit.onComplete();
  expect(g.bounty).toBe(67); expect(g.awardXp).toHaveBeenCalledExactlyOnceWith(20); expect(g.hp).toBe(50);
  expect(saloonDoors('railroad').filter(d => d.activity === 'gallery')).toHaveLength(1);
});

it.each([1, 2, 3, 4, 5, 6, 7, 8])('passes the actual stage %s into its dedicated gallery and blocks repeated free rounds', stage => {
  const g = fixture(), config = getStage(stage), doors = saloonDoors(config.theme), door = doors.find(d => d.activity === 'gallery');
  g.stageConfig = config; g.stage = stage; g.player.x = door.x; g.player.y = door.y; g.bounty = 0;
  g.saloonVisit = new SaloonVisit(doors, stage === 2 ? { healthFraction: .2, bounty: 0 } : undefined, true, stage === 2);
  const leave = enterInterior(g), interior = data(g, 'SaloonScene');
  expect(interior.onBuy('gallery')).toBe(false);
  expect(interior.onBuy('gallery')).toBe(false);
  expect(interior.gallery).toBe(true); expect(interior.galleryStage).toBe(stage); expect(interior.faro).toBe(false);
  expect(interior.table).toBeUndefined(); expect(g.generateUpgradeChoices).not.toHaveBeenCalled();
  interior.onGalleryLeave({ bounty: 0, xp: 0 }); data(g, 'BuildingTransitionScene').onComplete();
  expect(g.saloonVisit.wasUsed(door)).toBe(true); expect(g.hp).toBe(50); expect(g.bounty).toBe(0);
  expect(typeof leave).toBe('function');
  const calls = g.scene.launch.mock.calls.length; g.openSaloon(door); expect(g.scene.launch.mock.calls.length).toBe(calls);
});

it('updates compass activity availability without a footer direction label', () => {
  const g=fixture(); g.frontierCompass={update:vi.fn()}; g.updateSaloonPrompt();
  expect(g.frontierCompass.update).toHaveBeenCalledWith(g.saloonVisit,g.player.x,g.player.y,g.combatNow,false,undefined);
  g.saloonOpen=true; g.updateSaloonPrompt(); expect(g.frontierCompass.update.mock.calls.at(-1)[4]).toBe(true);
});

it('charges each paid field service once, freezes its active-time duration indoors and never stacks it', () => {
  const g=fixture();g.bounty=225;g.damageMultiplier=1.2;g.fireRateMultiplier=1;
  const leave=enterInterior(g),shop=data(g,'SaloonScene');
  expect(shop.onBuy('special_rounds')).toBe(true);expect(g.bounty).toBe(135);
  expect(shop.onBuy('special_rounds')).toBe(false);expect(g.bounty).toBe(135);
  expect(g.attackDamageMultiplier).toBeCloseTo(1.44);
  expect(shop.onBuy('gun_oil')).toBe(true);expect(g.bounty).toBe(60);
  g.activeWeapons=new Map([['revolver',1]]);g.weaponTimers=new Map([['revolver',0]]);g.fireWeapon=vi.fn();
  g.handleWeaponsAutoFire(600);expect(g.fireWeapon).toHaveBeenCalledOnce();
  g.time.now+=120000;expect(g.attackDamageMultiplier).toBeCloseTo(1.44);
  expect(shop.onBuy('saloon_rest')).toBe(true);expect(g.hp).toBe(80);expect(g.bounty).toBe(0);
  expect(shop.onBuy('saloon_rest')).toBe(false);
  leave(false);data(g,'BuildingTransitionScene').onComplete();
  expect(shop.onBuy('gun_oil')).toBe(false);
  g.combatElapsedMs+=30000;expect(g.attackDamageMultiplier).toBe(1.2);
  g.weaponTimers.set('revolver',0);g.fireWeapon.mockClear();g.handleWeaponsAutoFire(600);expect(g.fireWeapon).not.toHaveBeenCalled();
});
it('pays hospitality XP only on safe return, without duplicate charges or lost level-up choices',()=>{
  const g=fixture(),doors=saloonDoors('canyon'),door=doors.find(d=>d.activity==='hospitality');
  g.saloonVisit=new SaloonVisit(doors,undefined,true);g.player.x=door.x;g.player.y=door.y;g.bounty=100;g.awardXp=vi.fn();
  const leave=enterInterior(g),shop=data(g,'SaloonScene');
  expect(shop.onBuy('hospitality_rest')).toBe(true);expect(g.bounty).toBe(55);expect(g.hp).toBe(68);
  expect(shop.onBuy('hospitality_rest')).toBe(false);expect(g.awardXp).not.toHaveBeenCalled();
  leave(false);const exit=data(g,'BuildingTransitionScene');exit.onComplete();exit.onCancel();exit.onComplete();
  expect(g.awardXp).toHaveBeenCalledExactlyOnceWith(20);expect(g.bounty).toBe(55);
});
it('refuses unaffordable, irrelevant and no-benefit purchases without changing run cash or health',()=>{
  const g=fixture();g.bounty=59;const leave=enterInterior(g),shop=data(g,'SaloonScene');
  expect(shop.canBuy('saloon_rest')).toBe(false);expect(shop.onBuy('saloon_rest')).toBe(false);
  expect(shop.onBuy('gallery')).toBe(false);expect(shop.onBuy('__proto__')).toBe(false);
  expect(g.hp).toBe(50);expect(g.bounty).toBe(59);
  g.bounty=100;g.hp=g.maxHp;expect(shop.onBuy('saloon_rest')).toBe(false);expect(g.bounty).toBe(100);
  leave(false);data(g,'BuildingTransitionScene').onComplete();expect(g.bounty).toBe(100);
});
it('never pays target-practice rewards unless its admission was purchased',()=>{
  const g=fixture(),doors=saloonDoors('canyon'),door=doors.find(d=>d.activity==='gallery');
  g.saloonVisit=new SaloonVisit(doors,undefined,true);g.player.x=door.x;g.player.y=door.y;g.awardXp=vi.fn();
  enterInterior(g);const shop=data(g,'SaloonScene');expect(shop.onBuy('gallery')).toBe(false);
  shop.onGalleryLeave({bounty:9999,xp:9999});data(g,'BuildingTransitionScene').onComplete();
  expect(g.bounty).toBe(0);expect(g.awardXp).not.toHaveBeenCalled();
});
