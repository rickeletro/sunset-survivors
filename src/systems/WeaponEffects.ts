import type Phaser from 'phaser';
import type { Enemy, FireZone, Projectile } from '../game/entities';
import { bulletAppearance, distanceToRope, whipPoints, lobPose, type ExplosionKind } from '../data/weaponPresentation';
import { ENEMY_DEFS } from '../data/enemies';
interface Strike {
  age: number; side: number; row: number; range: number; damage: number; rank: number; evolved: boolean;
  graphic: Phaser.GameObjects.Graphics; hits: Set<Enemy>;
}
interface WeaponEffectHooks {
  position: () => { x: number; y: number };
  nearby: (x: number, y: number, radius: number) => Enemy[];
  damage: (enemy: Enemy, damage: number) => void;
}
interface BlastVisual { x: number; y: number; radius: number; kind: ExplosionKind; age: number; }
export interface ThrowMarker { x: number; y: number; startX: number; startY: number; radius: number; progress: number; done: boolean; }
/** Bounded, scene-clock effects. No delayed hit callbacks and no tween allocation for bullets or flames. */
export class WeaponEffects {
  private trails: Phaser.GameObjects.Graphics;
  private strikes: Strike[] = [];
  private blasts: BlastVisual[] = [];
  private markers: ThrowMarker[] = [];
  private blastLayer?: Phaser.GameObjects.Graphics;
  private markerLayer?: Phaser.GameObjects.Graphics;
  constructor(private scene: Phaser.Scene, private hooks: WeaponEffectHooks) {
    this.trails = scene.add.graphics().setDepth(8);
    scene.events.once('shutdown', () => this.destroy());
  }
  dressBullet(sprite: Phaser.GameObjects.Sprite, weapon: string, level: number) {
    const look = bulletAppearance(weapon, level), key = `vfx_bullet_${weapon}_${look.tier}`;
    if (!this.scene.textures.exists(key)) {
      const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0x120b08).fillRect(0, 0, look.length + 4, look.thickness + 4);
      g.fillStyle(look.color).fillRect(2, 2, look.length, look.thickness);
      g.fillStyle(look.core).fillRect(look.length - 4, 2, 6, Math.max(1, look.thickness - 1));
      g.generateTexture(key, look.length + 4, look.thickness + 4); g.destroy();
    }
    sprite.setTexture(key);
    return look;
  }
  bottleTexture(): string {
    const key = 'vfx_molotov';
    if (!this.scene.textures.exists(key)) {
      const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0x120b08).fillRect(8, 8, 14, 22).fillRect(12, 2, 6, 10);
      g.fillStyle(0x426837).fillRect(10, 10, 10, 18);
      g.fillStyle(0xf2d49a).fillRect(10, 16, 10, 7).fillRect(14, 3, 3, 8);
      g.fillStyle(0xff791c).fillRect(17, 0, 5, 8); g.fillStyle(0xffc52a).fillRect(18, 1, 2, 4);
      g.generateTexture(key, 32, 32); g.destroy();
    }
    return key;
  }
  whip(side: number, count: number, range: number, damage: number, rank: number, evolved: boolean): void {
    for (let i = 0; i < Math.min(count, 8) && this.strikes.length < 12; i++) {
      this.strikes.push({ age: -i * 35, side: side * (i % 2 ? -1 : 1), row: -Math.floor(i / 2) * 34,
        range, damage, rank, evolved, graphic: this.scene.add.graphics().setDepth(16), hits: new Set() });
    }
  }
  throwMarker(startX: number, startY: number, x: number, y: number, radius: number): ThrowMarker {
    this.markerLayer ??= this.scene.add.graphics().setDepth(3);
    const marker = { startX, startY, x, y, radius, progress: 0, done: false };
    if (this.markers.length >= 16) this.markers.shift(); // Visual budget only: never cancel gameplay damage.
    this.markers.push(marker); return marker;
  }
  explosion(x: number, y: number, radius: number, kind: ExplosionKind): void {
    this.blastLayer ??= this.scene.add.graphics().setDepth(20);
    if (this.blasts.length >= 16) this.blasts.shift();
    this.blasts.push({ x, y, radius, kind, age: 0 });
  }
  private updateExplosions(delta: number): void {
    this.markerLayer?.clear();
    for (let i = this.markers.length - 1; i >= 0; i--) {
      const m = this.markers[i];
      if (m.done) { this.markers.splice(i, 1); continue; }
      const g = this.markerLayer!, p = Math.max(0, Math.min(1, m.progress));
      // Thin dotted boundary and moving shadow identify the impact plane and exact radius.
      g.lineStyle(1, 0xffc52a, .32);
      for (let j = 0; j < 20; j++) {
        const a = j * Math.PI / 10, b = a + .12;
        g.lineBetween(m.x + Math.cos(a) * m.radius, m.y + Math.sin(a) * m.radius,
          m.x + Math.cos(b) * m.radius, m.y + Math.sin(b) * m.radius);
      }
      const pose = lobPose(m.startX, m.startY, m.x, m.y, p);
      g.fillStyle(0x120b08, .35).fillEllipse(pose.x, m.startY + (m.y - m.startY) * p + 4, 14, 6);
      g.fillStyle(0xffc52a, .85).fillRect(Math.round(pose.x + 7), Math.round(pose.y - 5), 3, 3);
      g.fillStyle(0xff791c, .6).fillRect(Math.round(pose.x + 10 - p * 8), Math.round(pose.y - 9), 2, 2);
    }
    this.blastLayer?.clear();
    for (let i = this.blasts.length - 1; i >= 0; i--) {
      const blast = this.blasts[i]; blast.age += delta;
      const duration = blast.kind === 'magnet' ? 900 : blast.kind === 'residue' ? 380 : 720;
      if (blast.age >= duration) { this.blasts.splice(i, 1); continue; }
      const g = this.blastLayer!, p = blast.age / duration, fade = (1 - p) ** 2;
      const { x, y, radius } = blast, flame = blast.kind === 'hellfire' ? 0xe52b20 : 0xff791c;
      if (blast.kind === 'magnet') {
        g.lineStyle(3,0xffc52a,fade).strokeCircle(x,y,radius*(1-p));
        g.lineStyle(1,0x8bdde7,fade*.5).strokeCircle(x,y,radius*(1-p)*.75);
        for (let j=0;j<12;j++) {
          const a=j*Math.PI/6+p*.5, r=radius*(1-p);
          g.fillStyle(j%2?0xffc52a:0xf2d49a,fade).fillRect(Math.round(x+Math.cos(a)*r)-2,Math.round(y+Math.sin(a)*r)-2,4,4);
        }
        continue;
      }
      // Fixed outer radius; expansion stops at the true damage boundary.
      g.lineStyle(2, 0xffc52a, .7 * fade).strokeCircle(x, y, radius);
      g.lineStyle(3, flame, .8 * fade).strokeCircle(x, y, radius * Math.min(1, .15 + p * 4));
      g.fillStyle(0xa51e16, .18 * fade).fillCircle(x, y, radius * .72);
      for (let j = 0; j < 10; j++) {
        const angle = j * 2.399, travel = radius * (.18 + Math.min(.7, p * 1.7));
        const px = Math.round(x + Math.cos(angle) * travel), py = Math.round(y + Math.sin(angle) * travel);
        const size = Math.max(2, Math.round(8 * (1 - p)));
        g.fillStyle(flame, fade).fillRect(px - size / 2, py - size / 2, size, size);
        g.fillStyle(0xffc52a, fade).fillRect(px, py, 2, 2);
      }
      for (let j = 0; j < 7; j++) {
        const angle = j * 2.399, distance = radius * .36;
        const sx = Math.round(x + Math.cos(angle) * distance), sy = Math.round(y + Math.sin(angle) * distance - p * 22);
        const size = Math.round(10 + p * 16);
        g.fillStyle(0x572449, .3 * fade).fillRect(sx - size / 2, sy - size / 2, size, size);
        g.fillStyle(0x603719, .2 * fade).fillRect(sx - size / 2, sy - size / 2, size - 3, size - 3);
      }
    }
  }
  update(delta: number, projectiles: readonly Projectile[]): void {
    this.updateExplosions(delta);
    this.trails.clear();
    for (const p of projectiles) {
      if (!p.appearance) continue;
      const speed = Math.hypot(p.vx, p.vy) || 1, look = p.appearance;
      const dx = p.vx / speed, dy = p.vy / speed;
      this.trails.lineStyle(Math.max(1, look.thickness - 1), look.color, 0.4);
      this.trails.lineBetween(p.sprite.x - dx * look.trail, p.sprite.y - dy * look.trail, p.sprite.x, p.sprite.y);
    }
    const origin = this.hooks.position();
    for (let i = this.strikes.length - 1; i >= 0; i--) {
      const strike = this.strikes[i]; strike.age += delta;
      if (strike.age < 0) continue;
      const progress = Math.min(0.95, strike.age / 320);
      const points = whipPoints(origin.x, origin.y, strike.side, progress, strike.range, strike.row);
      const g = strike.graphic, alpha = Math.min(1, (1 - progress) * 3);
      g.clear().lineStyle(10, 0x120b08, alpha).strokePoints(points, false);
      g.lineStyle(strike.evolved ? 6 : 4, strike.evolved ? 0xffc52a : 0xa76b32, alpha).strokePoints(points, false);
      g.lineStyle(2, strike.rank >= 3 ? 0xffedb0 : 0xf2d49a, alpha).strokePoints(points, false);
      const tip = points[points.length - 1];
      g.fillStyle(0xffc52a, alpha).fillRect(tip.x - 3, tip.y - 3, strike.rank + 4, strike.rank + 4);
      for (const enemy of this.hooks.nearby(origin.x, origin.y, strike.range + 60)) {
        const radius = enemy.type === 'boss' ? 22 : ENEMY_DEFS[enemy.type].radius;
        if (enemy.dead || strike.hits.has(enemy) || distanceToRope(enemy.sprite.x, enemy.sprite.y, points) > radius + 8) continue;
        strike.hits.add(enemy); this.hooks.damage(enemy, strike.damage);
      }
      if (strike.age >= 320) { g.destroy(); this.strikes.splice(i, 1); }
    }
  }
  drawFire(zone: FireZone, time: number): void {
    const g = zone.graphics, rank = zone.rank ?? 3;
    const fade = Math.max(0, Math.min(1, zone.life / 650));
    g.clear().fillStyle(0x120b08, 0.55 * fade).fillEllipse(zone.x, zone.y + 4, zone.radius * 2, zone.radius * 1.2);
    g.fillStyle(0xa51e16, 0.45 * fade).fillEllipse(zone.x, zone.y, zone.radius * 1.85, zone.radius);
    for (let i = 0; i < 14; i++) {
      const angle = i * 2.399, distance = zone.radius * Math.sqrt((i + 0.5) / 14) * 0.85;
      const x = Math.round(zone.x + Math.cos(angle) * distance), y = Math.round(zone.y + Math.sin(angle) * distance * 0.65);
      const frame = (Math.floor(time / 85) + i * 3) % 6, height = 16 + rank * 3 + (frame < 3 ? frame : 6 - frame) * 4;
      g.fillStyle(0xe52b20, fade).fillRect(x - 7, y - height + 6, 14, height - 3);
      g.fillStyle(0xff791c, fade).fillTriangle(x - 8, y, x + 7, y, x + (frame % 3 - 1) * 4, y - height);
      g.fillStyle(0xffc52a, fade).fillRect(x - 3, y - height * 0.45, 6, height * 0.45);
      g.fillStyle(0xf2d49a, fade).fillRect(x - 1, y - 5, 3, 4);
      if (frame % 2) g.fillStyle(0xffc52a, fade * 0.6).fillRect(x + 3, y - height - 7, 2, 3);
    }
  }
  clearTransient(): void {
    for (const strike of this.strikes) strike.graphic.destroy();
    this.strikes = []; this.trails.clear();
  }
  destroy(): void {
    this.clearTransient(); this.trails.destroy();
    this.blastLayer?.destroy(); this.markerLayer?.destroy(); this.blasts = []; this.markers = [];
  }
}
