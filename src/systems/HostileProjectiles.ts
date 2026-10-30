import type Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';

interface ProjectileHooks {
  position: () => { x: number; y: number };
  active: () => boolean;
  damage: (amount: number) => void;
}
interface ShotOptions { range?: number; axe?: boolean; arrow?: boolean; duration?: number; hitRadius?: number; tint?: number; }

/** Owns enemy bullet visuals and safe tween disposal; scene supplies combat callbacks. */
export class HostileProjectiles {
  constructor(private scene: Phaser.Scene, private hooks: ProjectileHooks) {}
  fire(x: number, y: number, angle: number, damage: number, options: ShotOptions = {}): void {
    if (!this.hooks.active()) return;
    const { range = 680, axe = false, arrow = false, duration = Math.round(range / 0.22), hitRadius = arrow ? 16 : 22, tint } = options;
    const bulletTexture = axe ? 'stage_axe' : arrow ? 'proj_rifle' : (this.scene.textures?.exists?.('proj_enemy_bullet') ? 'proj_enemy_bullet' : 'proj_bullet');
    const bullet = this.scene.add.sprite(x, y, bulletTexture).setDepth(8).setRotation(angle);
    const finalTint = tint ?? (axe || arrow ? 0xf2d49a : undefined);
    if (finalTint !== undefined && bullet.setTint) {
      bullet.setTint(finalTint);
    }
    if (arrow && bullet.setScale) bullet.setScale(.58);
    this.scene.tweens.add({
      targets: bullet, x: x + Math.cos(angle) * range, y: y + Math.sin(angle) * range,
      rotation: axe ? angle + Math.PI * 5 : angle, duration,
      onUpdate: (tween: Phaser.Tweens.Tween) => {
        if (!bullet.active || !this.hooks.active()) return;
        const player = this.hooks.position();
        if (Math.hypot(player.x - bullet.x, player.y - bullet.y) < hitRadius) {
          this.hooks.damage(damage);
          // Phaser still updates remaining tween properties after this callback.
          // stop() schedules disposal safely; destroy()/killTweensOf() here crashes.
          tween.stop();
          bullet.destroy();
        }
      },
      onComplete: () => bullet.destroy(),
    });
  }
  simonBarrage(x: number, y: number, damage = 18): void {
    if (!this.hooks.active()) return;
    sounds.playRevolver();
    for (let i = 0; i < 8; i++) this.fire(x, y, i * Math.PI / 4, damage, { range: 450, duration: 1800, hitRadius: 22 });
  }
}
