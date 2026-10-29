import { describe, expect, it, vi } from 'vitest';
vi.stubGlobal('document', { createElement: () => ({ getContext: () => ({ canvas: {}, drawImage: vi.fn(), getImageData: () => ({ data: new Uint8ClampedArray(16 * 16 * 4).fill(255) }) }) }) });
vi.mock('phaser', () => ({
  default: {
    BlendModes: { ADD: 1 },
    Math: {
      Clamp: (v: number, min: number, max: number) => Math.min(Math.max(v, min), max),
      Between: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,
    },
  },
}));
import { SupplyCartSystem, SUPPLY_CART_MAX_HP, SUPPLY_CART_ANIM_KEY, supplyCartFrameKey } from './SupplyCart';
import { StageLandmarks } from './StageLandmarks';
import { sounds } from '../audio/SoundManager';

vi.mock('../audio/SoundManager', () => ({
  sounds: {
    playBodyImpact: vi.fn(),
    playExplosion: vi.fn(),
    playCoin: vi.fn(),
    playHit: vi.fn(),
  },
}));

function mockScene() {
  const objects: any[] = [];
  const image = (x = 0, y = 0, key = '') => {
    const obj: any = {
      x,
      y,
      key,
      originX: 0.5,
      originY: 1,
      scaleX: 1,
      scaleY: 1,
      texture: { key },
      setOrigin: vi.fn(() => obj),
      setScale: vi.fn((s: number) => { obj.scaleX = obj.scaleY = s; return obj; }),
      setDepth: vi.fn(() => obj),
      setAlpha: vi.fn(() => obj),
      setTint: vi.fn(() => obj),
      clearTint: vi.fn(() => obj),
      setTexture: vi.fn((k: string) => { obj.key = k; obj.texture = { key: k }; return obj; }),
      play: vi.fn(() => obj),
      once: vi.fn((event: string, cb: () => void) => {
        if (event === 'animationcomplete') obj._onAnimComplete = cb;
        return obj;
      }),
      destroy: vi.fn(),
    };
    objects.push(obj);
    return obj;
  };
  return {
    textures: { exists: () => true },
    anims: { exists: () => false, create: vi.fn() },
    events: { once: vi.fn() },
    cameras: { main: { shake: vi.fn() } },
    tweens: { add: vi.fn() },
    time: { delayedCall: vi.fn((_ms: number, cb: () => void) => cb?.()) },
    add: {
      image,
      sprite: image,
      graphics: () => image(0, 0, 'gfx'),
      tileSprite: (x: number, y: number) => image(x, y, 'tile'),
      particles: vi.fn(() => image(0, 0, 'dust')),
    },
    objects,
  };
}

describe('SupplyCartSystem', () => {
  it('registers carts with full HP and takes damage with visual juice', () => {
    const scene = mockScene();
    const system = new SupplyCartSystem(scene as any);
    const cart = system.register(0, 1000, 1000);

    expect(cart.hp).toBe(SUPPLY_CART_MAX_HP);
    expect(cart.broken).toBe(false);

    const sprite = scene.add.sprite(1000, 1000, 'scenery_supply-cart');
    system.linkSprite(0, sprite);

    // Hit by bullet passing through (1000, 972)
    const onDrop = vi.fn();
    const hit = system.hit(950, 972, 1050, 972, 35, onDrop);

    expect(hit).toBe(true);
    expect(cart.hp).toBe(65);
    expect(cart.broken).toBe(false);
    expect(sounds.playBodyImpact).toHaveBeenCalled();
    expect(sprite.setTint).toHaveBeenCalledWith(0xffffff);
    expect(scene.tweens.add).toHaveBeenCalled();
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('triggers the 9-frame break animation, camera shake and drops when depleted', () => {
    const scene = mockScene();
    const system = new SupplyCartSystem(scene as any);
    const cart = system.register(1, 2000, 2000);
    const sprite = scene.add.sprite(2000, 2000, 'scenery_supply-cart');
    system.linkSprite(1, sprite);

    const drops: any[] = [];
    const hit = system.hit(1990, 1970, 2010, 1970, 100, drop => drops.push(drop));

    expect(hit).toBe(true);
    expect(cart.hp).toBe(0);
    expect(cart.broken).toBe(true);
    expect(sprite.play).toHaveBeenCalledWith(SUPPLY_CART_ANIM_KEY);
    expect(sounds.playExplosion).toHaveBeenCalled();
    expect(scene.cameras.main.shake).toHaveBeenCalled();

    // Spills frontier supply loot drops: moneybag, gold, and roast food
    expect(drops.some(d => d.type === 'moneybag')).toBe(true);
    expect(drops.filter(d => d.type === 'gold').length).toBe(2);
    expect(drops.some(d => d.type === 'whiskey')).toBe(true);

    // Once broken, further hits do not damage or re-drop
    const hitAgain = system.hit(1990, 1970, 2010, 1970, 50, drop => drops.push(drop));
    expect(hitAgain).toBe(false);
  });

  it('damages cart via explosion blast and remembers broken state on re-link', () => {
    const scene = mockScene();
    const system = new SupplyCartSystem(scene as any);
    const cart = system.register(2, 3000, 3000);
    const sprite = scene.add.sprite(3000, 3000, 'scenery_supply-cart');
    system.linkSprite(2, sprite);

    const hit = system.blast(3010, 2980, 80, 150);
    expect(hit).toBe(true);
    expect(cart.broken).toBe(true);

    // Unlink when leaving chunk
    system.unlinkSprite(2);
    expect(cart.sprite).toBeUndefined();

    // Re-link when entering chunk: immediately sets to last broken frame
    const newSprite = scene.add.sprite(3000, 3000, 'scenery_supply-cart');
    system.linkSprite(2, newSprite);
    expect(newSprite.setTexture).toHaveBeenCalledWith(supplyCartFrameKey(8));
  });

  it('makes cart non-blocking in StageLandmarks once broken', () => {
    const scene = mockScene();
    const landmarks = new StageLandmarks(scene as any, 'mountain');
    const cartProp = landmarks.placements.find(p => p.kind === 'supply-cart');
    expect(cartProp).toBeDefined();

    if (cartProp) {
      // Before break: solid footprint blocks player
      const resolvedBefore = landmarks.resolve(cartProp.x, cartProp.y - 28, 10);
      expect(Math.hypot(resolvedBefore.x - cartProp.x, resolvedBefore.y - (cartProp.y - 28))).toBeGreaterThan(0);

      // Destroy the cart
      landmarks.blast(cartProp.x, cartProp.y, 50, 200);

      // After break: cart becomes passable, player can walk over it to loot
      const resolvedAfter = landmarks.resolve(cartProp.x, cartProp.y - 28, 10);
      expect(resolvedAfter.x).toBe(cartProp.x);
      expect(resolvedAfter.y).toBe(cartProp.y - 28);
    }
  });
});
