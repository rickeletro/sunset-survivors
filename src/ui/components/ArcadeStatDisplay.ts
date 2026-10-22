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
        fontFamily: THEME.typography.narrativeFont,
        fontSize: '23px',
        color: item.color || '#321b10',
        stroke: '#000000',
        strokeThickness: 0,
      }).setOrigin(0, 0.5);
      this.add(labelText);

      // Value (right)
      const valStr = typeof item.value === 'number' ? item.value.toLocaleString() : item.value;
      const valText = scene.add.text(width, rowY, valStr, {
        fontFamily: THEME.typography.narrativeFont,
        fontSize: '24px',
        color: '#a51e16',
        stroke: '#000000',
        strokeThickness: 0,
      }).setOrigin(1, 0.5);
      this.add(valText);
    });

    scene.add.existing(this);
  }
}
