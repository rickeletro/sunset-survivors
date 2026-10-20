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
  presentation?: 'arcade' | 'pulp';
  onClick: () => void;
}

export class WesternButton extends Phaser.GameObjects.Container {
  private btnBg: Phaser.GameObjects.Graphics;
  private btnText: Phaser.GameObjects.Text;
  private btnWidth: number;
  private btnHeight: number;
  private variant: ButtonVariant;
  private presentation: 'arcade' | 'pulp';
  private focused = false;
  private focusManaged = false;
  private activating = false;
  private isHovered: boolean = false;
  private isPressed: boolean = false;
  private clickHandler: () => void;

  constructor(scene: Phaser.Scene, config: WesternButtonConfig) {
    super(scene, config.x, config.y);

    this.presentation = config.presentation ?? 'arcade';
    this.btnWidth = config.width || 240;
    this.btnHeight = config.height || 54;
    this.variant = config.variant || 'wood';
    this.clickHandler = config.onClick;

    // Background graphics
    this.btnBg = scene.add.graphics();
    this.add(this.btnBg);

    // Label text
    this.btnText = scene.add.text(0, 0, config.text, {
      fontFamily: this.presentation === 'pulp' ? THEME.typography.westernFont : THEME.typography.pixelFont,
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
    this.scene.tweens.add({
      targets: this,
      scaleX: 0.95,
      scaleY: 0.95,
      duration: THEME.motion.press,
      ease: 'Quad.easeInOut',
    });
  }

  public setFocused(focused: boolean): void {
    this.focusManaged = true;
    this.focused = focused;
    this.drawButton();
  }

  public activate(): void {
    if (this.activating || !this.active) return;
    this.activating = true;
    sounds.playRevolver();
    this.scene.cameras.main.flash(70, 255, 197, 42, false);
    this.scene.tweens.add({
      targets: this, scaleX: 0.96, scaleY: 0.96, duration: THEME.motion.press,
      yoyo: true, ease: 'Back.easeOut',
      onComplete: () => { this.activating = false; this.clickHandler(); },
    });
  }

  private onPointerUp() {
    if (!this.isPressed) return;
    this.isPressed = false;
    this.drawButton();
    this.activate();
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

    const focused = this.isHovered || this.focused;
    const variant = this.presentation === 'pulp'
      ? focused ? 'danger' : this.focusManaged ? 'wood' : this.variant
      : this.variant;
    const style = BUTTON_STYLES[variant][focused ? 'hover' : 'idle'];
    const { background: bgColor, border: strokeColor, text: textColor } = style;

    // Main button face
    this.btnBg.fillStyle(bgColor, 1);
    this.btnBg.fillRoundedRect(-halfW, -halfH, w, h, 6);

    if (this.presentation === 'pulp') {
      for (let i = 0; i < 14; i++) {
        this.btnBg.fillStyle(variant === 'wood' ? 0xb27939 : 0xff791c, 0.24);
        this.btnBg.fillRect(-halfW + 18 + (i * 83) % (w - 100), -halfH + 9 + i * 11 % (h - 20), 35 + i % 4 * 14, 2);
      }
      this.btnBg.lineStyle(3, 0x120b08).strokeRect(-halfW + 6, -halfH + 6, w - 12, h - 12);
    }

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
    if (this.btnText.width > w - 52) this.btnText.setScale((w - 52) / this.btnText.width);
  }
}
