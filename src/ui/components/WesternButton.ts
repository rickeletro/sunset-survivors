import Phaser from 'phaser';
import { pulpSurface } from './PulpSurface';
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
  private materialFace?: Phaser.GameObjects.NineSlice;
  private btnBg: Phaser.GameObjects.Graphics;
  private btnText: Phaser.GameObjects.Text;
  private btnWidth: number;
  private btnHeight: number;
  private variant: ButtonVariant;
  private presentation: 'arcade' | 'pulp';
  private focused = false;
  private focusManaged = false;
  private activating = false;
  private enabled = true;
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
    this.materialFace = scene.textures.exists('ui_pulp_wood') ? pulpSurface(scene, 0, 0, this.btnWidth, this.btnHeight, 'wood') : undefined;
    if (this.materialFace) this.add(this.materialFace);
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
    this.btnText.setScale(Math.min(1, (this.btnWidth - 28) / Math.max(1, this.btnText.width)));
    this.drawButton();
  }
  public getText(): string {
    return this.btnText?.text ?? '';
  }
  public get text(): string {
    return this.btnText?.text ?? '';
  }
  public set text(value: string) {
    if (this.btnText) {
      this.setText(value);
    }
  }
  public setEnabled(enabled: boolean): this {
    this.enabled = enabled; this.setAlpha(enabled ? 1 : .42); return this;
  }

  private onPointerOver() {
    if (!this.enabled) return;
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
    if (!this.enabled) return;
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
    if (this.activating || !this.active || !this.enabled) return;
    this.activating = true;
    sounds.playRevolver();
    this.scene.cameras.main.flash(70, 255, 197, 42, false);
    this.scene.tweens.add({
      targets: this, scaleX: 0.96, scaleY: 0.96, duration: THEME.motion.press,
      yoyo: true, ease: 'Back.easeOut',
      onComplete: () => { this.activating = false; if (this.enabled && this.active) this.clickHandler(); },
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

    const focused = this.isHovered || this.focused;
    const variant = this.presentation === 'pulp'
      ? focused ? 'danger' : this.focusManaged ? 'wood' : this.variant
      : this.variant;
    const style = BUTTON_STYLES[variant][focused ? 'hover' : 'idle'];
    const { background: bgColor, border: strokeColor, text: textColor } = style;

    if (this.materialFace) {
      this.materialFace.setTint(this.isPressed ? 0xc49a55 : 0xffffff);
      if (focused || this.variant === 'danger' && !this.focusManaged) {
        this.btnBg.lineStyle(3, 0xffc52a).strokeRect(-halfW + 4, -halfH + 4, w - 8, h - 8);
      }
    } else {
      this.btnBg.fillStyle(bgColor).fillRect(-halfW, -halfH, w, h);
      this.btnBg.lineStyle(2, strokeColor).strokeRect(-halfW, -halfH, w, h);
    }
    this.btnText.setColor(this.materialFace ? focused ? '#ffc52a' : '#f2d49a' : textColor);
    this.btnText.setScale(1);
    if (this.btnText.width > w - 52) this.btnText.setScale((w - 52) / this.btnText.width);
  }
}
