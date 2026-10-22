import Phaser from 'phaser';
import { pulpSurface } from './PulpSurface';

export interface WesternPanelConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  variant?: 'wood' | 'parchment' | 'dark-saloon';
  hasStuds?: boolean;
  cornerRadius?: number;
  borderWidth?: number;
}

export class WesternPanel extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, config: WesternPanelConfig) {
    super(scene, config.x, config.y);
    this.add(pulpSurface(scene, 0, 0, config.width, config.height, config.variant === 'parchment' ? 'paper' : 'wood'));
    scene.add.existing(this);
  }
}
