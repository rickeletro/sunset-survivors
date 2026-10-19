import Phaser from 'phaser';

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
  private panelBg: Phaser.GameObjects.Graphics;
  private pWidth: number;
  private pHeight: number;

  constructor(scene: Phaser.Scene, config: WesternPanelConfig) {
    super(scene, config.x, config.y);

    this.pWidth = config.width;
    this.pHeight = config.height;
    this.panelBg = scene.add.graphics();
    this.add(this.panelBg);

    this.drawPanel(config);
    scene.add.existing(this);
  }

  private drawPanel(config: WesternPanelConfig) {
    const w = this.pWidth;
    const h = this.pHeight;
    const halfW = w / 2;
    const halfH = h / 2;
    const radius = config.cornerRadius ?? 8;
    const variant = config.variant || 'wood';
    const hasStuds = config.hasStuds ?? true;
    const bWidth = config.borderWidth ?? 3;

    this.panelBg.clear();

    // 1. Drop shadow
    this.panelBg.fillStyle(0x000000, 0.55);
    this.panelBg.fillRoundedRect(-halfW + 6, -halfH + 8, w, h, radius);

    // 2. Fill & Borders according to variant
    if (variant === 'parchment') {
      // Outer border frame
      this.panelBg.fillStyle(0x452b14, 1);
      this.panelBg.fillRoundedRect(-halfW, -halfH, w, h, radius);

      // Aged parchment background
      this.panelBg.fillStyle(0xe8c48a, 1);
      this.panelBg.fillRoundedRect(-halfW + 4, -halfH + 4, w - 8, h - 8, radius - 2);

      // Inner decorative border
      this.panelBg.lineStyle(2, 0x8b5a2b, 0.7);
      this.panelBg.strokeRect(-halfW + 14, -halfH + 14, w - 28, h - 28);
    } else if (variant === 'dark-saloon') {
      // Dark Saloon wood
      this.panelBg.fillStyle(0x1a0f0a, 0.95);
      this.panelBg.fillRoundedRect(-halfW, -halfH, w, h, radius);

      this.panelBg.lineStyle(bWidth, 0x8b5a2b, 0.85);
      this.panelBg.strokeRoundedRect(-halfW, -halfH, w, h, radius);
    } else {
      // Standard carved wood
      this.panelBg.fillStyle(0x321b10, 0.95);
      this.panelBg.fillRoundedRect(-halfW, -halfH, w, h, radius);

      this.panelBg.lineStyle(bWidth, 0xffc52a, 0.9);
      this.panelBg.strokeRoundedRect(-halfW, -halfH, w, h, radius);

      // Inner faint grain line
      this.panelBg.lineStyle(1, 0x603719, 0.5);
      this.panelBg.strokeRoundedRect(-halfW + 6, -halfH + 6, w - 12, h - 12, radius - 2);
    }

    // 3. Brass corner studs
    if (hasStuds) {
      this.panelBg.fillStyle(0xffc52a, 0.9);
      const pad = 12;
      this.panelBg.fillCircle(-halfW + pad, -halfH + pad, 3.5);
      this.panelBg.fillCircle(halfW - pad, -halfH + pad, 3.5);
      this.panelBg.fillCircle(-halfW + pad, halfH - pad, 3.5);
      this.panelBg.fillCircle(halfW - pad, halfH - pad, 3.5);
    }
  }
}
