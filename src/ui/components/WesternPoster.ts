import Phaser from 'phaser';
import { sounds } from '../../audio/SoundManager';

export interface WesternPosterConfig {
  x: number;
  y: number;
  width?: number;
  height?: number;
  textureKey: string;
  autoSlam?: boolean;
  onSlamComplete?: () => void;
}

export class WesternPoster extends Phaser.GameObjects.Container {
  private posterImage: Phaser.GameObjects.Image;
  private pWidth: number;
  private pHeight: number;

  constructor(scene: Phaser.Scene, config: WesternPosterConfig) {
    super(scene, config.x, config.y);

    this.pWidth = config.width || 480;
    this.pHeight = config.height || 640;

    // Soft drop shadow
    const shadow = scene.add.graphics();
    shadow.fillStyle(0x000000, 0.65);
    shadow.fillRoundedRect(-this.pWidth / 2 + 14, -this.pHeight / 2 + 18, this.pWidth, this.pHeight, 8);
    this.add(shadow);

    // Poster Image
    this.posterImage = scene.add.image(0, 0, config.textureKey);
    this.posterImage.setDisplaySize(this.pWidth, this.pHeight);
    this.add(this.posterImage);

    if (config.autoSlam !== false) {
      this.setScale(2.2);
      this.setAlpha(0);

      scene.tweens.add({
        targets: this,
        scaleX: 1.0,
        scaleY: 1.0,
        alpha: 1.0,
        duration: 480,
        ease: 'Power3.easeOut',
        onComplete: () => {
          sounds.playPistolShot();
          scene.cameras.main.shake(140, 0.012);
          this.spawnImpactParticles(0, 0);

          // 4 corner nail shots
          const corners = [
            { x: -160, y: -230, delay: 300 },
            { x: 160, y: -230, delay: 580 },
            { x: 160, y: 230, delay: 860 },
            { x: -160, y: 230, delay: 1140 },
          ];

          corners.forEach((c) => {
            scene.time.delayedCall(c.delay, () => {
              sounds.playRevolver();
              sounds.playRicochet();
              scene.cameras.main.shake(70, 0.004);
              this.createBulletHole(c.x, c.y);
              this.spawnImpactParticles(c.x, c.y);
            });
          });

          if (config.onSlamComplete) {
            config.onSlamComplete();
          }
        },
      });
    }

    scene.add.existing(this);
  }

  private createBulletHole(x: number, y: number) {
    const hole = this.scene.add.graphics();
    hole.fillStyle(0x000000, 1);
    hole.fillCircle(x, y, 7);
    hole.fillStyle(0x180b05, 0.9);
    hole.fillCircle(x, y, 10);
    hole.lineStyle(2, 0xb45309, 0.85);
    hole.strokeCircle(x, y, 14);
    this.add(hole);
  }

  private spawnImpactParticles(x: number, y: number) {
    for (let i = 0; i < 7; i++) {
      const p = this.scene.add.graphics();
      p.fillStyle(Phaser.Math.RND.pick([0xffc52a, 0xff791c, 0xf2d49a]), 1);
      p.fillCircle(0, 0, Phaser.Math.Between(2, 4));
      p.setPosition(x, y);
      this.add(p);

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(20, 65);

      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(220, 420),
        onComplete: () => p.destroy(),
      });
    }
  }
}
