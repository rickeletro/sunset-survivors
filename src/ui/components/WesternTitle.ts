import Phaser from 'phaser';
import { pulpSurface } from './PulpSurface';
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
    const h = config.height || (config.subtitle ? 104 : 76);
    this.add(pulpSurface(scene, 0, 0, w, h, 'wood'));

    // Main title
    const fontFam = config.useRye !== false ? THEME.typography.westernFont : THEME.typography.pixelFont;
    const titleText = scene.add.text(0, config.subtitle ? -18 : 0, config.title, {
      fontFamily: fontFam,
      fontSize: config.fontSize || (config.useRye !== false ? '26px' : '18px'),
      color: config.titleColor || '#ffc52a',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    if (titleText.width > w - 64) titleText.setScale((w - 64) / titleText.width);
    this.add(titleText);

    // Subtitle if provided
    if (config.subtitle) {
      const subText = scene.add.text(0, 25, config.subtitle, {
        fontFamily: THEME.typography.pixelFont,
        fontSize: '12px',
        color: '#f2d49a',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5);
      if (subText.width > w - 64) subText.setScale((w - 64) / subText.width);
      this.add(subText);
    }

    scene.add.existing(this);
  }
}
