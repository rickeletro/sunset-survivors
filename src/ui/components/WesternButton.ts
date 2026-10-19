import Phaser from 'phaser';
import { sounds } from '../../audio/SoundManager';
import { THEME } from '../theme/tokens';

export interface WesternButtonConfig {
  x: number;
  y: number;
  width?: number;
  height?: number;
  text: string;
  variant?: 'gold' | 'wood' | 'parchment' | 'danger';
  fontSize?: string;
  onClick: () => void;
}

export class WesternButton extends Phaser.GameObjects.Container {
  private btnBg: Phaser.GameObjects.Graphics;
  private btnText: Phaser.GameObjects.Text;
  private btnWidth: number;
  private btnHeight: number;
  private variant: 'gold' | 'wood' | 'parchment' | 'danger';
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
      duration: 100,
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
      duration: 100,
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
      duration: 60,
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
        duration: 80,
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

    let bgColor = 0x321b10;
    let strokeColor = 0x8b5a2b;
    let textColor = '#ffffff';

    if (this.variant === 'gold') {
      bgColor = this.isHovered ? 0xffa01a : 0xcc7711;
      strokeColor = 0xffe066;
      textColor = '#120b08';
    } else if (this.variant === 'danger') {
      bgColor = this.isHovered ? 0xd32f2f : 0xa51e16;
      strokeColor = 0xff6659;
      textColor = '#ffffff';
    } else if (this.variant === 'parchment') {
      bgColor = this.isHovered ? 0xf5deb3 : 0xe8c48a;
      strokeColor = 0x603719;
      textColor = '#2b1d0c';
    } else {
      // Wood
      bgColor = this.isHovered ? 0x4a2a16 : 0x321b10;
      strokeColor = this.isHovered ? 0xffc52a : 0x8b5a2b;
      textColor = this.isHovered ? '#ffe066' : '#f2d49a';
    }

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
