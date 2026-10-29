import Phaser from 'phaser';
import { framePath } from '../assets/registry';
import { sounds } from '../audio/SoundManager';
import { worldDepth } from '../data/scenery';

export const SUPPLY_CART_MAX_HP = 100;
export const SUPPLY_CART_HIT_RADIUS = 42;
export const SUPPLY_CART_FRAMES = 9;
export const SUPPLY_CART_ANIM_KEY = 'anim_supply_cart_break';

export const supplyCartFrameKey = (i: number) => `scenery_supply-cart-break_${i}`;

export interface SupplyCartDrop {
  x: number;
  y: number;
  type: 'gold' | 'moneybag' | 'whiskey' | 'badge';
  val: number;
  bounty: number;
}

export interface SupplyCartInstance {
  index: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  broken: boolean;
  animating: boolean;
  sprite?: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;
}

export function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function preloadSupplyCart(scene: Phaser.Scene): void {
  for (let i = 0; i < SUPPLY_CART_FRAMES; i++) {
    const key = supplyCartFrameKey(i);
    if (!scene.textures?.exists?.(key)) {
      scene.load?.image?.(key, framePath('scenery:supply-cart-break', '', i));
    }
  }
}

export function createSupplyCartAnim(scene: Phaser.Scene): void {
  if (scene.anims?.exists?.(SUPPLY_CART_ANIM_KEY)) return;
  const frames = Array.from({ length: SUPPLY_CART_FRAMES }, (_, i) => ({
    key: supplyCartFrameKey(i),
  }));
  scene.anims?.create?.({
    key: SUPPLY_CART_ANIM_KEY,
    frames,
    frameRate: 12,
    repeat: 0,
  });
}

export class SupplyCartSystem {
  private carts = new Map<number, SupplyCartInstance>();

  constructor(private scene: Phaser.Scene) {
    createSupplyCartAnim(scene);
  }

  register(index: number, x: number, y: number): SupplyCartInstance {
    let cart = this.carts.get(index);
    if (!cart) {
      cart = {
        index,
        x,
        y,
        hp: SUPPLY_CART_MAX_HP,
        maxHp: SUPPLY_CART_MAX_HP,
        broken: false,
        animating: false,
      };
      this.carts.set(index, cart);
    }
    return cart;
  }

  linkSprite(index: number, sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image): void {
    const cart = this.carts.get(index);
    if (!cart) return;
    cart.sprite = sprite;
    if (cart.broken) {
      if (typeof (sprite as any).setTexture === 'function') {
        (sprite as any).setTexture(supplyCartFrameKey(SUPPLY_CART_FRAMES - 1));
      }
    }
  }

  unlinkSprite(index: number): void {
    const cart = this.carts.get(index);
    if (cart) cart.sprite = undefined;
  }

  isBroken(index: number): boolean {
    return this.carts.get(index)?.broken ?? false;
  }

  getCart(index: number): SupplyCartInstance | undefined {
    return this.carts.get(index);
  }

  /**
   * Applies damage and triggers juice when hit by linear projectiles.
   */
  hit(
    ax: number,
    ay: number,
    bx: number,
    by: number,
    damage: number,
    onDrop?: (loot: SupplyCartDrop) => void,
  ): boolean {
    let hitAny = false;
    for (const cart of this.carts.values()) {
      if (cart.broken) continue;
      // Supply cart center is around y - 28
      const d = distToSegment(cart.x, cart.y - 28, ax, ay, bx, by);
      if (d <= SUPPLY_CART_HIT_RADIUS) {
        this.applyDamage(cart, damage, onDrop);
        hitAny = true;
      }
    }
    return hitAny;
  }

  /**
   * Applies damage from area-of-effect explosions (dynamite, etc.).
   */
  blast(
    x: number,
    y: number,
    radius: number,
    damage: number,
    onDrop?: (loot: SupplyCartDrop) => void,
  ): boolean {
    let hitAny = false;
    for (const cart of this.carts.values()) {
      if (cart.broken) continue;
      const d = Math.hypot(cart.x - x, cart.y - 28 - y);
      if (d <= radius + SUPPLY_CART_HIT_RADIUS) {
        this.applyDamage(cart, damage, onDrop);
        hitAny = true;
      }
    }
    return hitAny;
  }

  private applyDamage(
    cart: SupplyCartInstance,
    damage: number,
    onDrop?: (loot: SupplyCartDrop) => void,
  ): void {
    cart.hp = Math.max(0, cart.hp - damage);

    // Hit Game Juice
    this.playHitJuice(cart);

    // Break when HP depleted
    if (cart.hp <= 0 && !cart.broken) {
      this.breakCart(cart, onDrop);
    }
  }

  private playHitJuice(cart: SupplyCartInstance): void {
    sounds.playBodyImpact();

    const sprite = cart.sprite;
    if (sprite) {
      // 1. White hit flash
      if (typeof (sprite as any).setTint === 'function') {
        (sprite as any).setTint(0xffffff);
        this.scene.time?.delayedCall?.(70, () => {
          if (typeof (sprite as any).clearTint === 'function') (sprite as any).clearTint();
        });
      }

      // 2. Elastic wobble
      if (this.scene.tweens?.add) {
        this.scene.tweens.add({
          targets: sprite,
          x: cart.x + (Math.random() < 0.5 ? -3 : 3),
          duration: 35,
          yoyo: true,
          repeat: 1,
          onComplete: () => {
            sprite.x = cart.x;
          },
        });
      }
    }

    // 3. Wood / sawdust particles
    if (this.scene.add?.particles) {
      try {
        const emitter = this.scene.add.particles(cart.x, cart.y - 30, 'stage_dust', {
          lifespan: { min: 250, max: 450 },
          speed: { min: 40, max: 120 },
          angle: { min: 220, max: 320 },
          gravityY: 180,
          scale: { start: 1.2, end: 0.2 },
          tint: [0xf2d49a, 0x603719, 0xffc52a],
          quantity: 4,
          stopAfter: 4,
        });
        emitter.setDepth(worldDepth(cart.y) + 1);
        this.scene.time?.delayedCall?.(500, () => emitter.destroy());
      } catch {
        // Safe fallback in test harnesses
      }
    }
  }

  private breakCart(
    cart: SupplyCartInstance,
    onDrop?: (loot: SupplyCartDrop) => void,
  ): void {
    cart.broken = true;
    cart.animating = true;

    // Heavy crash SFX
    sounds.playExplosion();
    sounds.playBodyImpact();

    // Camera shake
    this.scene.cameras?.main?.shake?.(180, 0.005);

    // Massive straw and wood debris burst
    if (this.scene.add?.particles) {
      try {
        const burst = this.scene.add.particles(cart.x, cart.y - 24, 'stage_dust', {
          lifespan: { min: 400, max: 700 },
          speed: { min: 60, max: 200 },
          angle: { min: 180, max: 360 },
          gravityY: 260,
          scale: { start: 1.8, end: 0.3 },
          tint: [0xf2d49a, 0xffc52a, 0x603719, 0xa51e16],
          quantity: 16,
          stopAfter: 16,
        });
        burst.setDepth(worldDepth(cart.y) + 2);
        this.scene.time?.delayedCall?.(800, () => burst.destroy());
      } catch {
        // Safe fallback in test harnesses
      }
    }

    // Play 9-frame break animation!
    const sprite = cart.sprite;
    if (sprite) {
      if (typeof (sprite as any).play === 'function') {
        (sprite as any).play(SUPPLY_CART_ANIM_KEY);
        (sprite as any).once?.('animationcomplete', () => {
          cart.animating = false;
          if (typeof (sprite as any).setTexture === 'function') {
            (sprite as any).setTexture(supplyCartFrameKey(SUPPLY_CART_FRAMES - 1));
          }
        });
      } else if (typeof (sprite as any).setTexture === 'function') {
        (sprite as any).setTexture(supplyCartFrameKey(SUPPLY_CART_FRAMES - 1));
      }
    }

    // Spills frontier supply loot drops:
    if (onDrop) {
      // 1x Moneybag
      onDrop({ x: cart.x, y: cart.y - 10, type: 'moneybag', val: 0, bounty: 40 });
      // 2x Gold
      onDrop({ x: cart.x - 22, y: cart.y + 12, type: 'gold', val: 15, bounty: 15 });
      onDrop({ x: cart.x + 22, y: cart.y + 12, type: 'gold', val: 15, bounty: 15 });
      // 1x Restorative Frontier Whiskey
      onDrop({ x: cart.x, y: cart.y + 22, type: 'whiskey', val: 0, bounty: 0 });
    }
    sounds.playCoin();
  }
}
