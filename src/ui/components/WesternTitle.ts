import Phaser from 'phaser';
import { THEME } from '../theme/tokens';

export interface WesternTitleConfig {
  x: number;
  y: number;
  title: string;
  subtitle?: string;
  width?: number;
  height?: number;
  titleColor?: string;
  fontSize?: string;
  useRye?: boolean;
}

export class WesternTitle extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, config: WesternTitleConfig) {
    super(scene, config.x, config.y);

    const w = config.width || 620;
    const h = config.height || (config.subtitle ? 74 : 58);
    const halfW = w / 2;
    const halfH = h / 2;

    // Background plate
    const plate = scene.add.graphics();
    // Drop shadow
    plate.fillStyle(0x000000, 0.6);
    plate.fillRoundedRect(-halfW + 4, -halfH + 4, w, h, 8);

    // Carved wood backing
    plate.fillStyle(0x321b10, 0.95);
    plate.fillRoundedRect(-halfW, -halfH, w, h, 8);
    plate.lineStyle(3, 0xffc52a, 1);
    plate.strokeRoundedRect(-halfW, -halfH, w, h, 8);

    // Brass corner studs
    plate.fillStyle(0xffc52a, 1);
    [-halfW + 14, halfW - 14].forEach((x) => {
      plate.fillCircle(x, -halfH + 14, 3.5);
      plate.fillCircle(x, halfH - 14, 3.5);
    });
    this.add(plate);

    // Main title
    const fontFam = config.useRye !== false ? THEME.typography.westernFont : THEME.typography.pixelFont;
    const titleText = scene.add.text(0, config.subtitle ? -10 : 0, config.title, {
      fontFamily: fontFam,
      fontSize: config.fontSize || (config.useRye !== false ? '26px' : '18px'),
      color: config.titleColor || '#ffc52a',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    this.add(titleText);

    // Subtitle if provided
    if (config.subtitle) {
      const subText = scene.add.text(0, 18, config.subtitle, {
        fontFamily: THEME.typography.pixelFont,
        fontSize: '10px',
        color: '#f2d49a',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5);
      this.add(subText);
    }

    scene.add.existing(this);
  }
}
