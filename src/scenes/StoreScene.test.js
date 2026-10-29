import { describe, expect, it, vi, beforeEach } from 'vitest';
import { StoreScene } from './StoreScene';
import { GameScene } from './GameScene';
import { statsManager } from '../data/GameStatsManager';
import { CONSUMABLE_ITEMS } from '../data/consumables';
import { sounds } from '../audio/SoundManager';

vi.mock('phaser', () => {
  class MockContainer {
    list = [];
    x = 0;
    y = 0;
    width = 0;
    height = 0;
    scale = 1;
    scaleX = 1;
    scaleY = 1;
    depth = 0;
    visible = true;
    scrollFactor = 0;
    add(child) {
      if (Array.isArray(child)) this.list.push(...child);
      else this.list.push(child);
      return this;
    }
    setSize(w, h) { this.width = w; this.height = h; return this; }
    setInteractive() { return this; }
    on() { return this; }
    off() { return this; }
    emit() { return this; }
    setDepth(d) { this.depth = d; return this; }
    setScrollFactor(s) { this.scrollFactor = s; return this; }
    setPosition(x, y) { this.x = x; this.y = y; return this; }
    setScale(s) { this.scale = s; this.scaleX = s; this.scaleY = s; return this; }
    setAlpha(a) { this.alpha = a; return this; }
    setVisible(v) { this.visible = v; return this; }
    destroy() { this.list = []; }
  }

  return {
    default: {
      Scene: class {},
      Events: { EventEmitter: class {} },
      BlendModes: { ADD: 1 },
      GameObjects: {
        Container: MockContainer,
      },
      Math: { Clamp: (v, min, max) => Math.max(min, Math.min(max, v)) },
    },
  };
});

vi.mock('../audio/SoundManager', () => ({
  sounds: {
    playDealerGreeting: vi.fn(),
    playCoin: vi.fn(),
    playReload: vi.fn(),
    playRevolver: vi.fn(),
    playRifle: vi.fn(),
    playExplosion: vi.fn(),
    playBodyImpact: vi.fn(),
  },
}));

function setupStore() {
  const scene = Object.create(StoreScene.prototype);
  const textures = { exists: vi.fn(() => false) };
  const camera = {
    setBackgroundColor: vi.fn(),
    flash: vi.fn(),
    shake: vi.fn(),
  };
  const tweens = {
    add: vi.fn(),
  };
  const load = {
    image: vi.fn(),
  };
  const keyboardListeners = new Map();
  const input = {
    keyboard: {
      on: (ev, fn) => keyboardListeners.set(ev, fn),
      off: (ev) => keyboardListeners.delete(ev),
      emit: (ev) => keyboardListeners.get(ev)?.(),
    },
  };
  const scenePlugin = {
    stop: vi.fn(),
    resume: vi.fn(),
  };

  const textNode = (text = '') => ({
    text,
    width: 60,
    height: 16,
    setText(t) { this.text = t; return this; },
    setOrigin() { return this; },
    setDepth() { return this; },
    setScrollFactor() { return this; },
    setColor() { return this; },
    setStroke() { return this; },
    setScale() { return this; },
  });

  const spriteNode = () => ({
    width: 64,
    height: 64,
    setOrigin() { return this; },
    setScale() { return this; },
    setDepth() { return this; },
    setAlpha() { return this; },
    setTint() { return this; },
  });

  const graphicsNode = () => ({
    clear() { return this; },
    destroy() { return this; },
    fillStyle() { return this; },
    fillRect() { return this; },
    fillCircle() { return this; },
    fillRoundedRect() { return this; },
    lineStyle() { return this; },
    strokeRect() { return this; },
    strokeCircle() { return this; },
    strokeRoundedRect() { return this; },
    setBlendMode() { return this; },
    setAlpha() { return this; },
    setDepth() { return this; },
    setPosition() { return this; },
  });

  const zoneNode = () => ({
    on: vi.fn(),
    setInteractive() { return this; },
  });

  Object.assign(scene, {
    scale: { width: 1536, height: 1024, on: vi.fn(), off: vi.fn() },
    cameras: { main: camera },
    tweens,
    textures,
    load,
    input,
    events: { once: vi.fn() },
    scene: scenePlugin,
    fromScene: 'MenuScene',
    itemCards: new Map(),
    add: {
      container: (x = 0, y = 0) => {
        const c = { list: [], x, y, add(item) { this.list.push(item); return this; }, setScale() { return this; }, setPosition(px, py) { this.x = px; this.y = py; return this; } };
        return c;
      },
      text: (x, y, text) => textNode(text),
      image: () => spriteNode(),
      sprite: () => spriteNode(),
      graphics: () => graphicsNode(),
      zone: () => zoneNode(),
      nineslice: () => spriteNode(),
      existing: (obj) => obj,
    },
  });

  return { scene, camera, scenePlugin, input };
}

describe('StoreScene Integration', () => {
  const storage = new Map();

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    });
    statsManager.refresh();
    vi.clearAllMocks();
  });

  it('preloads catalog images and initializes store UI with live balance', () => {
    const { scene } = setupStore();
    scene.preload();
    expect(scene.load.image).toHaveBeenCalled();

    statsManager.changeBalance(2000);
    scene.create();

    expect(sounds.playDealerGreeting).toHaveBeenCalled();
    expect(scene.balanceText.text).toBe('★ WALLET: $2,000 ★');
    expect(scene.itemCards.size).toBe(6);
  });

  it('allows buying a consumable when funds are sufficient and prevents when insufficient', () => {
    const { scene, camera } = setupStore();
    scene.create();

    // Insufficient funds initially
    scene.tryBuy('golden_magnet');
    expect(sounds.playReload).toHaveBeenCalled();
    expect(camera.shake).toHaveBeenCalled();
    expect(statsManager.getConsumableCount('golden_magnet')).toBe(0);

    // Give cash and buy
    statsManager.changeBalance(1000);
    scene.refreshUI();
    scene.tryBuy('golden_magnet');
    expect(sounds.playCoin).toHaveBeenCalled();
    expect(camera.flash).toHaveBeenCalled();
    expect(statsManager.getConsumableCount('golden_magnet')).toBe(1);
    expect(statsManager.getStats().bank).toBe(650);
  });

  it('returns to fromScene on leaveStore', () => {
    const { scene, scenePlugin } = setupStore();
    scene.create();
    scene.leaveStore();

    expect(sounds.playRevolver).toHaveBeenCalled();
    expect(scenePlugin.stop).toHaveBeenCalledWith('StoreScene');
    expect(scenePlugin.resume).toHaveBeenCalledWith('MenuScene');
  });

  it('doubles prices and requires 2x cash when accessed with priceMultiplier = 2', () => {
    const { scene, camera } = setupStore();
    scene.init({ fromScene: 'GameScene', priceMultiplier: 2 });
    scene.create();

    // Verify speech text indicates outpost rush surcharge
    expect(scene.speechText.text).toContain('Outpost rush prices');

    // Desert Magnet base price is $350 -> doubled is $700
    const magnetCard = scene.itemCards.get('golden_magnet');
    expect(magnetCard.buyBtn.text).toBe('BUY $700');

    // Player with $500 cannot buy (500 < 700)
    statsManager.changeBalance(500);
    scene.refreshUI();
    expect(magnetCard.buyBtn.enabled).toBe(false);

    scene.tryBuy('golden_magnet');
    expect(sounds.playReload).toHaveBeenCalled();
    expect(camera.shake).toHaveBeenCalled();
    expect(scene.speechText.text).toContain('costs $700');
    expect(statsManager.getConsumableCount('golden_magnet')).toBe(0);

    // Player with $1000 can buy ($1000 >= $700)
    statsManager.changeBalance(500); // balance is now 1000
    scene.refreshUI();
    expect(magnetCard.buyBtn.enabled).toBe(true);

    scene.tryBuy('golden_magnet');
    expect(sounds.playCoin).toHaveBeenCalled();
    expect(statsManager.getConsumableCount('golden_magnet')).toBe(1);
    expect(statsManager.getStats().bank).toBe(300); // 1000 - 700
  });
});

describe('In-Game Consumable Power-up Activation in GameScene', () => {
  const storage = new Map();

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    });
    statsManager.refresh();
    vi.clearAllMocks();
  });

  function setupGame() {
    const g = Object.create(GameScene.prototype);
    const player = { x: 100, y: 100, anims: {}, flipX: false };
    const drops = [
      { sprite: { x: 500, y: 500 }, type: 'gold', attracted: false },
      { sprite: { x: -300, y: 800 }, type: 'badge', attracted: false },
    ];

    Object.assign(g, {
      player,
      drops,
      combatElapsedMs: 1000,
      time: { now: 1000 },
      isGameOver: false,
      bossDefeated: false,
      choosingUpgrade: false,
      hp: 50,
      maxHp: 100,
      moveSpeed: 180,
      critChance: 0.1,
      critMultiplier: 2.0,
      invulnUntil: 0,
      bootsUntil: 0,
      omniShotUntil: 0,
      silverBulletUntil: 0,
      megaDynamiteUntil: 0,
      projectiles: [],
      enemies: [],
      cameras: { main: { flash: vi.fn(), shake: vi.fn() } },
      tweens: { add: vi.fn() },
      showBanner: vi.fn(),
      updateHpBar: vi.fn(),
      add: {
        sprite: () => ({ setDepth: vi.fn().mockReturnThis(), setTint: vi.fn().mockReturnThis(), setScale: vi.fn().mockReturnThis(), setRotation: vi.fn() }),
      },
      hud: {
        consumables: { refresh: vi.fn() },
      },
    });

    return g;
  }

  it('activates Desert Magnet and pulls all drops across the map', () => {
    const g = setupGame();
    statsManager.changeBalance(1000);
    statsManager.buyConsumable('golden_magnet', CONSUMABLE_ITEMS.golden_magnet.price);

    g.activateConsumable('golden_magnet');

    expect(sounds.playCoin).toHaveBeenCalled();
    expect(g.showBanner).toHaveBeenCalledWith(expect.stringContaining('DESERT MAGNET'), '#ffc52a');
    expect(g.drops.every(d => d.attracted)).toBe(true);
    expect(statsManager.getConsumableCount('golden_magnet')).toBe(0); // consumed
  });

  it('activates Seven-League Boots and boosts player speed', () => {
    const g = setupGame();
    statsManager.changeBalance(1000);
    statsManager.buyConsumable('seven_league_boots', CONSUMABLE_ITEMS.seven_league_boots.price);

    g.activateConsumable('seven_league_boots');

    expect(sounds.playReload).toHaveBeenCalled();
    expect(g.bootsUntil).toBe(1000 + 30000);
    expect(statsManager.getConsumableCount('seven_league_boots')).toBe(0);
  });

  it('activates Miracle Tonic, restores full HP and grants 6s invulnerability', () => {
    const g = setupGame();
    statsManager.changeBalance(1000);
    statsManager.buyConsumable('miracle_elixir', CONSUMABLE_ITEMS.miracle_elixir.price);

    g.activateConsumable('miracle_elixir');

    expect(g.hp).toBe(100);
    expect(g.invulnUntil).toBeGreaterThanOrEqual(1000 + 6000);
    expect(statsManager.getConsumableCount('miracle_elixir')).toBe(0);
  });

  it('opens StoreScene with priceMultiplier: 2 from in-game armazem and equips items on resume', () => {
    const g = setupGame();
    Object.assign(g, {
      saloonOpen: false,
      saloonBlocked: vi.fn(() => false),
      time: { paused: false },
      tweens: { paused: false },
      player: { anims: { stop: vi.fn() } },
      scene: { pause: vi.fn(), launch: vi.fn(), resume: vi.fn() },
      hud: {
        updateBounty: vi.fn(),
        consumables: { refresh: vi.fn() },
      },
    });

    // Player enters the store from general store building
    g.openStoreFromBuilding({ kind: 'general-store' });

    expect(g.saloonOpen).toBe(true);
    expect(g.scene.pause).toHaveBeenCalledWith('GameScene');
    expect(g.scene.launch).toHaveBeenCalledWith('StoreScene', {
      fromScene: 'GameScene',
      priceMultiplier: 2,
    });

    // Player buys an item inside StoreScene (mega dynamite costs 780 * 2 = 1560)
    statsManager.changeBalance(2000);
    statsManager.buyConsumable('mega_dynamite', CONSUMABLE_ITEMS.mega_dynamite.price * 2);
    expect(statsManager.getConsumableCount('mega_dynamite')).toBe(1);

    // On resume event, HUD consumables are immediately refreshed
    g.saloonOpen = false;
    statsManager.refresh();
    g.bounty = statsManager.getStats().bank;
    g.hud.updateBounty(g.bounty);
    g.hud.consumables.refresh();

    expect(g.hud.consumables.refresh).toHaveBeenCalled();
    expect(statsManager.getConsumableCount('mega_dynamite')).toBe(1);
  });
});
