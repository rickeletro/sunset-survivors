import type Phaser from 'phaser';

export interface CrowRushPull { x: number; y: number; }

/** One Graphics object renders the complete flock.  It avoids adding bird bodies
 * to the enemy cap while preserving a readable, dodgeable crossing event. */
export class CrowRush {
  private view: Phaser.GameObjects.Graphics;
  private nextAt = 185000;
  private age = -1;
  private duration = 3000;
  private origin = { x: 0, y: 0 };
  private direction = { x: 1, y: 0 };

  constructor(scene: Phaser.Scene, private banner: (text: string) => void, private random = Math.random) {
    this.view = scene.add.graphics().setDepth(22);
    scene.events.once('shutdown', () => this.view.destroy());
  }

  update(delta: number, now: number, player: { x: number; y: number }, blocked: boolean): CrowRushPull | undefined {
    if (blocked) return undefined;
    if (this.age < 0 && now >= this.nextAt) this.begin(now, player);
    if (this.age < 0) return undefined;
    this.age += Math.max(0, delta);
    const progress = Math.min(1, this.age / this.duration);
    this.draw(progress);
    if (progress >= 1) { this.view.clear(); this.age = -1; this.nextAt = now + 90000 + this.random() * 30000; return undefined; }
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
      this.view.fillStyle(i % 5 === 0 ? 0x572449 : 0x120b08, .82)
        .fillTriangle(x - 7, y + flap, x, y - 4 - flap, x + 7, y + flap)
        .fillRect(x - 2, y + 1, 4, 5);
    }
  }
}
