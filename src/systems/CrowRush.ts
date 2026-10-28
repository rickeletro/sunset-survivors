import type Phaser from 'phaser';
import { CATALOG, framePath } from '../assets/registry';

export interface CrowRushPull { x: number; y: number; }

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

/** One Graphics object + bounded 28-bird sprite pool renders the complete flock.
 * It avoids adding bird bodies to the enemy cap while preserving a readable, dodgeable crossing event. */
export class CrowRush {
  private view: Phaser.GameObjects.Graphics;
  private sprites: Phaser.GameObjects.Image[] = [];
  private nextAt = 185000;
  private age = -1;
  private duration = 3000;
  private origin = { x: 0, y: 0 };
  private direction = { x: 1, y: 0 };

  constructor(private scene: Phaser.Scene, private banner: (text: string) => void, private random = Math.random) {
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
    this.draw(progress);
    if (progress >= 1) {
      this.view.clear();
      for (const sprite of this.sprites) sprite.setVisible(false);
      this.age = -1;
      this.nextAt = now + 90000 + this.random() * 30000;
      return undefined;
    }
    const cx = this.origin.x + this.direction.x * (-620 + progress * 1240);
    const cy = this.origin.y + this.direction.y * (-620 + progress * 1240);
    const sideX = -this.direction.y, sideY = this.direction.x;
    const ahead = (player.x - cx) * this.direction.x + (player.y - cy) * this.direction.y;
    const side = Math.abs((player.x - cx) * sideX + (player.y - cy) * sideY);
    if (Math.abs(ahead) < 130 && side < 150) return { x: this.direction.x * delta * .115, y: this.direction.y * delta * .115 };
    return undefined;
  }

  private begin(now: number, player: { x: number; y: number }): void {
    const vertical = this.random() < .5;
    const sign = this.random() < .5 ? -1 : 1;
    this.direction = vertical ? { x: 0, y: sign } : { x: sign, y: 0 };
    this.origin = { x: player.x, y: player.y + (vertical ? 0 : (this.random() - .5) * 280) };
    if (vertical) this.origin.x += (this.random() - .5) * 280;
    this.age = 0; this.nextAt = now;
    this.banner('CROW RUSH — BREAK FREE FROM THE FLOCK!');
  }

  private draw(progress: number): void {
    this.view.clear();
    const cx = this.origin.x + this.direction.x * (-620 + progress * 1240);
    const cy = this.origin.y + this.direction.y * (-620 + progress * 1240);
    const sideX = -this.direction.y, sideY = this.direction.x;
    for (let i = 0; i < 28; i++) {
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
  }
}
