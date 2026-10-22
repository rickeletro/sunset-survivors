import type { BulletAppearance } from '../data/weaponPresentation';
import type Phaser from 'phaser';
import type { EnemyKind } from '../data/enemies';
import type { LootPacket } from '../systems/LootBudget';

export interface Projectile {
  sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Arc;
  vx: number;
  vy: number;
  damage: number;
  pierce: number;
  hits: Set<Enemy>;
  life: number;
  appearance?: BulletAppearance;
  isBouncingSniper?: boolean;
  bouncesLeft?: number;
  isExplosiveBullet?: boolean;
}

export interface Enemy {
  sprite: Phaser.GameObjects.Sprite;
  type: EnemyKind | 'boss';
  training?: boolean;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  xpVal: number;
  bountyVal: number;
  throwCooldown?: number;
  usesPixellab?: boolean;
  animLock?: number;
  pooled?: boolean;
  dead?: boolean;
  tint?: number;
  aiTimer?: number;
  dirX?: number;
  dirY?: number;
  bossSlug?: string;
  combatSprite?: boolean;
  chargeCooldown?: number;
  chargeWindup?: number;
  chargeRemaining?: number;
  chargeX?: number;
  chargeY?: number;
  vulnerableUntil?: number;
  attackCount?: number;
}

export interface Drop {
  packets?: LootPacket[];
  sprite: Phaser.GameObjects.Sprite;
  type: 'gold' | 'badge' | 'whiskey';
  val: number;
  bounty: number;
}

export interface FireZone {
  rank?: number;
  x: number;
  y: number;
  radius: number;
  damage: number;
  life: number;
  tickTimer: number;
  graphics: Phaser.GameObjects.Graphics;
}

