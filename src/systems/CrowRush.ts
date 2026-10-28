import type Phaser from 'phaser';
import { CATALOG, framePath } from '../assets/registry';

export interface CrowRushPull {
  x: number;
  y: number;
  damage?: number;
}

export interface CrowBird {
  id: number;
  alive: boolean;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  radius: number;
}

const sequence = 'enemy:crow_rush' as const;
export const CROW_RUSH_DIRECTIONS = ['south', 'east', 'north', 'west'] as const;
export type CrowRushDirection = typeof CROW_RUSH_DIRECTIONS[number];

export function crowRushDirection(dx: number, dy: number): CrowRushDirection {
  return Math.abs(dx) > Math.abs(dy) ? (dx >= 0 ? 'east' : 'west') : (dy >= 0 ? 'south' : 'north');
}

export function crowRushFrame(dx: number, dy: number, age: number, index: number): string {
  const dir = crowRushDirection(dx, dy);
  const frame = ((Math.floor(Math.max(0, age) / 90) + index) % 4 + 4) % 4;
  return `crow_rush_${dir}_${frame}`;
}

export function preloadCrowRush(scene: Phaser.Scene): void {
  for (const dir of CATALOG.sequences[sequence].directions) {
    for (let i = 0; i < CATALOG.sequences[sequence].frames; i++) {
      const key = `crow_rush_${dir}_${i}`;
      if (!scene.textures.exists(key)) scene.load.image(key, framePath(sequence, dir, i));
    }
  }
}

function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax, dy = by - ay;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - dy) * dy) / l2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** One Graphics object + bounded 28-bird sprite pool renders the complete flock.
 * Individual crows take damage and die one by one, dealing contact damage to the player. */
export class CrowRush {
  private view: Phaser.GameObjects.Graphics;
  private sprites: Phaser.GameObjects.Image[] = [];
  private birds: CrowBird[] = [];
  private feathers: { x: number; y: number; vx: number; vy: number; life: number; color: number }[] = [];
  private nextAt: number;
  private age = -1;
  private duration = 3000;
  private origin = { x: 0, y: 0 };
  private direction = { x: 1, y: 0 };
  public onCrowKilled?: (x: number, y: number) => void;

  constructor(
    private scene: Phaser.Scene,
    private banner: (text: string) => void,
    private random = Math.random,
    firstAt = 25000,
    private interval = 35000,
  ) {
    this.nextAt = firstAt;
    this.view = scene.add.graphics().setDepth(22);
    scene.events.once('shutdown', () => {
      this.view.destroy();
      for (const sprite of this.sprites) sprite.destroy();
      this.sprites.length = 0;
    });
  }

  update(delta: number, now: number, player: { x: number; y: number }, blocked: boolean): CrowRushPull | undefined {
    if (blocked) return undefined;
    if (this.age < 0 && now >= this.nextAt) this.begin(now, player);
    if (this.age < 0) return undefined;
    this.age += Math.max(0, delta);
    const progress = Math.min(1, this.age / this.duration);

    const cx = this.origin.x + this.direction.x * (-620 + progress * 1240);
    const cy = this.origin.y + this.direction.y * (-620 + progress * 1240);
    const sideX = -this.direction.y, sideY = this.direction.x;

    let contactDamage = 0;
    let aliveCount = 0;
    for (let i = 0; i < 28; i++) {
      const bird = this.birds[i];
      if (!bird || !bird.alive) continue;
      aliveCount++;
      const lane = ((i * 43) % 260) - 130;
      const lead = ((i * 71) % 210) - 105;
      const flap = Math.sin(this.age / 72 + i * 1.7) * 3;
      bird.x = cx + sideX * lane + this.direction.x * lead;
      bird.y = cy + sideY * lane + this.direction.y * lead + flap;
      if (Math.hypot(bird.x - player.x, bird.y - player.y) < 28) {
        contactDamage = 8;
      }
    }

    this.draw(progress, delta);

    if (progress >= 1 || aliveCount === 0) {
      this.view.clear();
      for (const sprite of this.sprites) sprite.setVisible(false);
      this.age = -1;
      this.nextAt = now + this.interval + this.random() * 15000;
      return undefined;
    }

    const ahead = (player.x - cx) * this.direction.x + (player.y - cy) * this.direction.y;
    const side = Math.abs((player.x - cx) * sideX + (player.y - cy) * sideY);
    const inCorridor = Math.abs(ahead) < 130 && side < 150;

    if (inCorridor) {
      const ratio = aliveCount / 28;
      const pull: CrowRushPull = {
        x: this.direction.x * delta * .115 * ratio,
        y: this.direction.y * delta * .115 * ratio,
      };
      if (contactDamage > 0) pull.damage = contactDamage;
      return pull;
    }
    if (contactDamage > 0) {
      return { x: 0, y: 0, damage: contactDamage };
    }
    return undefined;
  }

  hit(ax: number, ay: number, bx: number, by: number, damage: number): boolean {
    if (this.age < 0) return false;
    for (const bird of this.birds) {
      if (!bird.alive) continue;
      const d = distToSegment(bird.x, bird.y, ax, ay, bx, by);
      if (d <= bird.radius + 10) {
        bird.hp -= damage;
        if (bird.hp <= 0) this.killBird(bird);
        return true;
      }
    }
    return false;
  }

  blast(x: number, y: number, radius: number, damage: number): number {
    if (this.age < 0) return 0;
    let kills = 0;
    for (const bird of this.birds) {
      if (!bird.alive) continue;
      if (Math.hypot(bird.x - x, bird.y - y) <= radius + bird.radius) {
        bird.hp -= damage;
        if (bird.hp <= 0) {
          this.killBird(bird);
          kills++;
        }
      }
    }
    return kills;
  }

  activeTargets(): { sprite: { x: number; y: number }; hp: number; maxHp: number; dead: boolean; type: 'crow' }[] {
    if (this.age < 0) return [];
    return this.birds.filter(b => b.alive).map(b => ({
      sprite: { x: b.x, y: b.y },
      hp: b.hp,
      maxHp: b.maxHp,
      dead: false,
      type: 'crow',
    }));
  }

  getAliveBirds(): readonly CrowBird[] {
    return this.birds.filter(b => b.alive);
  }

  isActive(): boolean {
    return this.age >= 0;
  }

  private killBird(bird: CrowBird): void {
    bird.alive = false;
    bird.hp = 0;
    this.sprites[bird.id]?.setVisible(false);
    for (let f = 0; f < 5; f++) {
      const angle = (f / 5) * Math.PI * 2 + (this.random() - 0.5);
      const spd = 20 + this.random() * 30;
      this.feathers.push({
        x: bird.x,
        y: bird.y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 250,
        color: f % 2 === 0 ? 0x572449 : 0x120b08,
      });
    }
    this.onCrowKilled?.(bird.x, bird.y);
    if (this.birds.length > 0 && this.birds.every(b => !b.alive)) {
      this.age = -1;
      this.view.clear();
      for (const sprite of this.sprites) sprite.setVisible(false);
    }
  }

  private begin(now: number, player: { x: number; y: number }): void {
    const vertical = this.random() < .5;
    const sign = this.random() < .5 ? -1 : 1;
    this.direction = vertical ? { x: 0, y: sign } : { x: sign, y: 0 };
    this.origin = { x: player.x, y: player.y + (vertical ? 0 : (this.random() - .5) * 280) };
    if (vertical) this.origin.x += (this.random() - .5) * 280;
    this.age = 0;
    this.nextAt = now;
    this.birds = [];
    for (let i = 0; i < 28; i++) {
      this.birds.push({
        id: i,
        alive: true,
        hp: 12,
        maxHp: 12,
        x: this.origin.x,
        y: this.origin.y,
        radius: 14,
      });
    }
    this.banner('CROW RUSH — BREAK FREE FROM THE FLOCK!');
  }

  private draw(progress: number, delta = 16): void {
    this.view.clear();
    const cx = this.origin.x + this.direction.x * (-620 + progress * 1240);
    const cy = this.origin.y + this.direction.y * (-620 + progress * 1240);
    const sideX = -this.direction.y, sideY = this.direction.x;
    for (let i = 0; i < 28; i++) {
      const bird = this.birds[i];
      if (!bird || !bird.alive) {
        this.sprites[i]?.setVisible(false);
        continue;
      }
      const lane = ((i * 43) % 260) - 130;
      const lead = ((i * 71) % 210) - 105;
      const flap = Math.sin(this.age / 72 + i * 1.7) * 3;
      const x = cx + sideX * lane + this.direction.x * lead;
      const y = cy + sideY * lane + this.direction.y * lead;
      const frame = crowRushFrame(this.direction.x, this.direction.y, this.age, i);
      const hasSprite = Boolean(this.scene.textures?.exists(frame) && this.scene.add.image);
      this.view.fillStyle(i % 5 === 0 ? 0x572449 : 0x120b08, hasSprite ? .34 : .82)
        .fillTriangle(x - 7, y + flap + (hasSprite ? 10 : 0), x, y - 4 - flap + (hasSprite ? 10 : 0), x + 7, y + flap + (hasSprite ? 10 : 0))
        .fillRect(x - 2, y + 1 + (hasSprite ? 10 : 0), 4, 5);
      if (hasSprite) {
        let sprite = this.sprites[i];
        if (!sprite) {
          sprite = this.scene.add.image(x, y + flap, frame).setDepth(22.1).setScale(0.75);
          this.sprites[i] = sprite;
        }
        sprite.setTexture(frame).setPosition(x, y + flap).setVisible(true);
      }
    }
    // Update and draw feather particles
    for (let f = this.feathers.length - 1; f >= 0; f--) {
      const p = this.feathers[f];
      p.x += p.vx * (delta / 1000);
      p.y += p.vy * (delta / 1000);
      p.life -= delta;
      if (p.life <= 0) {
        this.feathers.splice(f, 1);
        continue;
      }
      this.view.fillStyle(p.color, Math.max(0, p.life / 250)).fillRect(p.x - 1, p.y - 1, 3, 3);
    }
  }
}
