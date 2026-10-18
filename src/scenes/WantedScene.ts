import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { CharacterData } from '../data/characters';
import { THEME } from '../ui/theme/tokens';

export class WantedScene extends Phaser.Scene {
  private character!: CharacterData;

  constructor() {
    super('WantedScene');
  }

  init(data: { character: CharacterData }) {
    this.character = data.character;
  }

  create() {
    const { width, height } = this.scale;

    // Wooden Saloon Wall Backdrop
    const bg = this.add.graphics();
    bg.fillStyle(0x23140a, 1);
    bg.fillRect(0, 0, width, height);

    // Horizontal wooden planks lines
    bg.lineStyle(2, 0x140a05, 0.8);
    for (let y = 0; y < height; y += 40) {
      bg.lineBetween(0, y, width, y);
    }

    // Centered Wanted Poster
    const posterW = Math.min(width * 0.55, 480);
    const posterH = Math.min(height * 0.82, 640);
    const poster = this.add.image(width / 2, height / 2, 'wanted_greedwell');
    poster.setDisplaySize(posterW, posterH);
    poster.setScale(0);

    // Stage Announcement Banner
    const stageBanner = this.add.text(width / 2, 40, '★ STAGE 1: OUTLAW CANYON PASS ★', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '16px',
      color: '#ffe066',
      stroke: '#8b0e0e',
      strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);

    // Poster Slam / Zoom In Animation
    this.tweens.add({
      targets: poster,
      scaleX: posterW / poster.width,
      scaleY: posterH / poster.height,
      duration: 600,
      ease: 'Back.easeOut',
      onComplete: () => {
        sounds.playShotgun();
        stageBanner.setAlpha(1);

        // Stamp "DEAD OR ALIVE" effect
        this.time.delayedCall(400, () => {
          sounds.playRicochet();
          this.createBulletHole(width / 2 - 120, height / 2 - 80);
        });

        this.time.delayedCall(800, () => {
          sounds.playRicochet();
          this.createBulletHole(width / 2 + 130, height / 2 + 100);
        });

        // Prompt to start fight
        const startText = this.add.text(width / 2, height - 35, 'HUNTER: ' + this.character.name + ' - PRESS TO DRAW!', {
          fontFamily: THEME.typography.pixelFont,
          fontSize: '12px',
          color: '#ffffff',
          stroke: '#000',
          strokeThickness: 3,
        }).setOrigin(0.5);

        this.tweens.add({
          targets: startText,
          alpha: 0.2,
          duration: 350,
          yoyo: true,
          repeat: -1,
        });

        const proceed = () => {
          sounds.playRevolver();
          this.time.delayedCall(160, () => {
            sounds.playReload();
          });
          this.cameras.main.fade(400, 0, 0, 0);
          this.time.delayedCall(450, () => {
            this.scene.start('GameScene', { character: this.character });
          });
        };

        this.input.once('pointerdown', proceed);
        this.input.keyboard?.once('keydown-SPACE', proceed);
        this.input.keyboard?.once('keydown-ENTER', proceed);

        // Auto proceed after 3 seconds if idle
        this.time.delayedCall(3000, proceed);
      },
    });
  }

  private createBulletHole(x: number, y: number) {
    const hole = this.add.graphics();
    hole.fillStyle(0x1a0f08, 0.95);
    hole.fillCircle(x, y, 9);
    hole.fillStyle(0x000000, 1);
    hole.fillCircle(x, y, 6);
    hole.lineStyle(2, 0x8b5a2b, 0.7);
    hole.strokeCircle(x, y, 12);
  }
}
