import Phaser from 'phaser';
import { THEME } from '../theme/tokens';

export interface StatItemConfig {
  label: string;
  value: string | number;
  color?: string;
  valueColor?: string;
}

export class ArcadeStatDisplay extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    stats: StatItemConfig[],
    width: number = 440,
    rowHeight: number = 38
  ) {
    super(scene, x, y);

    stats.forEach((item, index) => {
      const rowY = index * rowHeight;

      // Label (left)
      const labelText = scene.add.text(0, rowY, item.label, {
        fontFamily: THEME.typography.pixelFont,
        fontSize: '12px',
        color: item.color || '#f2d49a',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0, 0.5);
      this.add(labelText);

      // Value (right)
      const valStr = typeof item.value === 'number' ? item.value.toLocaleString() : item.value;
      const valText = scene.add.text(width, rowY, valStr, {
        fontFamily: THEME.typography.pixelFont,
        fontSize: '13px',
        color: item.valueColor || '#ffc52a',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(1, 0.5);
      this.add(valText);
    });

    scene.add.existing(this);
  }
}
