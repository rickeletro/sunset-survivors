import Phaser from 'phaser';
import { sounds } from '../../audio/SoundManager';
import { BUTTON_STYLES, ButtonVariant } from '../theme/buttons';
import { THEME } from '../theme/tokens';

export interface WesternButtonConfig {
  x: number;
  y: number;
  width?: number;
  height?: number;
  text: string;
  variant?: ButtonVariant;
  fontSize?: string;
  onClick: () => void;
}

export class WesternButton extends Phaser.GameObjects.Container {
  private btnBg: Phaser.GameObjects.Graphics;
  private btnText: Phaser.GameObjects.Text;
  private btnWidth: number;
  private btnHeight: number;
  private variant: ButtonVariant;
  private isHovered: boolean = false;
  private isPressed: boolean = false;
  private clickHandler: () => void;

  constructor(scene: Phaser.Scene, config: WesternButtonConfig) {
    super(scene, config.x, config.y);

    this.btnWidth = config.width || 240;
    this.btnHeight = config.height || 54;
    this.variant = config.variant || 'wood';
    this.clickHandler = config.onClick;

    // Background graphics
    this.btnBg = scene.add.graphics();
    this.add(this.btnBg);

    // Label text
    this.btnText = scene.add.text(0, 0, config.text, {
      fontFamily: THEME.typography.pixelFont,
      fontSize: config.fontSize || '12px',
      color: '#ffffff',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.add(this.btnText);

    this.drawButton();

    // Make interactive
    this.setSize(this.btnWidth, this.btnHeight);
    this.setInteractive({ useHandCursor: true });

    this.on('pointerover', this.onPointerOver, this);
    this.on('pointerout', this.onPointerOut, this);
    this.on('pointerdown', this.onPointerDown, this);
    this.on('pointerup', this.onPointerUp, this);

    scene.add.existing(this);
  }

  public setText(text: string) {
    this.btnText.setText(text);
  }

  private onPointerOver() {
    this.isHovered = true;
    this.drawButton();
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: THEME.motion.hover,
      ease: 'Quad.easeOut',
    });
  }

  private onPointerOut() {
    this.isHovered = false;
    this.isPressed = false;
    this.drawButton();
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.0,
      scaleY: 1.0,
      duration: THEME.motion.hover,
      ease: 'Quad.easeOut',
    });
  }

  private onPointerDown() {
    this.isPressed = true;
    this.drawButton();
    sounds.playRevolver();
    this.scene.tweens.add({
      targets: this,
      scaleX: 0.95,
      scaleY: 0.95,
      duration: THEME.motion.press,
      ease: 'Quad.easeInOut',
    });
  }

  private onPointerUp() {
    if (this.isPressed) {
      this.isPressed = false;
      this.drawButton();
      this.scene.tweens.add({
        targets: this,
        scaleX: 1.04,
        scaleY: 1.04,
        duration: THEME.motion.release,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.clickHandler();
        },
      });
    }
  }

  private drawButton() {
    this.btnBg.clear();
    const w = this.btnWidth;
    const h = this.btnHeight;
    const halfW = w / 2;
    const halfH = h / 2;

    // Drop shadow
    this.btnBg.fillStyle(0x000000, 0.45);
    this.btnBg.fillRoundedRect(-halfW + 4, -halfH + 4, w, h, 6);

    const style = BUTTON_STYLES[this.variant][this.isHovered ? 'hover' : 'idle'];
    const { background: bgColor, border: strokeColor, text: textColor } = style;

    // Main button face
    this.btnBg.fillStyle(bgColor, 1);
    this.btnBg.fillRoundedRect(-halfW, -halfH, w, h, 6);

    // Border
    const borderWidth = this.isHovered ? 3 : 2;
    this.btnBg.lineStyle(borderWidth, strokeColor, 1);
    this.btnBg.strokeRoundedRect(-halfW, -halfH, w, h, 6);

    // Brass studs on corners
    this.btnBg.fillStyle(0xffc52a, 0.85);
    const pad = 8;
    this.btnBg.fillCircle(-halfW + pad, -halfH + pad, 2.5);
    this.btnBg.fillCircle(halfW - pad, -halfH + pad, 2.5);
    this.btnBg.fillCircle(-halfW + pad, halfH - pad, 2.5);
    this.btnBg.fillCircle(halfW - pad, halfH - pad, 2.5);

    this.btnText.setColor(textColor);
  }
}
