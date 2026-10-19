import Phaser from 'phaser';
import { sounds } from '../../audio/SoundManager';
import { WesternPanel } from './WesternPanel';
import { WesternTitle } from './WesternTitle';

export interface WesternModalConfig {
  width?: number;
  height?: number;
  title: string;
  subtitle?: string;
  onClose?: () => void;
}

export class WesternModal extends Phaser.GameObjects.Container {
  public contentContainer: Phaser.GameObjects.Container;
  private modalWidth: number;
  private modalHeight: number;
  private closeCallback?: () => void;

  constructor(scene: Phaser.Scene, config: WesternModalConfig) {
    const { width, height } = scene.scale;
    super(scene, width / 2, height / 2);

    this.modalWidth = config.width || 700;
    this.modalHeight = config.height || 500;
    this.closeCallback = config.onClose;

    // 1. Dim background mask
    const dim = scene.add.graphics();
    dim.fillStyle(0x000000, 0.75);
    dim.fillRect(-width / 2, -height / 2, width, height);
    dim.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains);
    this.add(dim);

    // 2. Base wooden panel
    const panel = new WesternPanel(scene, {
      x: 0,
      y: 0,
      width: this.modalWidth,
      height: this.modalHeight,
      variant: 'dark-saloon',
    });
    this.add(panel);

    // 3. Header title
    const title = new WesternTitle(scene, {
      x: 0,
      y: -this.modalHeight / 2 + 10,
      title: config.title,
      subtitle: config.subtitle,
      width: this.modalWidth - 60,
    });
    this.add(title);

    // 4. Content container
    this.contentContainer = scene.add.container(0, 20);
    this.add(this.contentContainer);

    // Modal entrance tween
    this.setScale(0.85);
    this.setAlpha(0);
    scene.tweens.add({
      targets: this,
      scaleX: 1.0,
      scaleY: 1.0,
      alpha: 1.0,
      duration: 220,
      ease: 'Back.easeOut',
    });

    // Close on ESC
    scene.input.keyboard?.once('keydown-ESC', () => this.close());

    scene.add.existing(this);
  }

  public close() {
    sounds.playRevolver();
    this.scene.tweens.add({
      targets: this,
      scaleX: 0.85,
      scaleY: 0.85,
      alpha: 0,
      duration: 160,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (this.closeCallback) {
          this.closeCallback();
        }
        this.destroy();
      },
    });
  }
}
