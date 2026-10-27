import type Phaser from 'phaser';
import { EMBLEM_COLORS, upgradeEmblems, upgradeRackLayout, type UpgradeEmblem } from '../../data/upgradeHud';
import { THEME } from '../theme/tokens';

interface EmblemView { root: Phaser.GameObjects.Container; level: Phaser.GameObjects.Text; rim: Phaser.GameObjects.Graphics; rank: number; }

/** A compact row of brass/copper equipment badges; only inventory changes allocate objects. */
export class UpgradeRack {
  readonly root: Phaser.GameObjects.Container;
  private entries = new Map<string, EmblemView>();
  constructor(private scene: Phaser.Scene) {
    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(58);
    const resize = () => this.layout();
    scene.scale.on('resize', resize);
    scene.events.once('shutdown', () => { scene.scale.off('resize', resize); this.root.destroy(); this.entries.clear(); });
  }
  sync(weapons: ReadonlyMap<string, number>, passives: ReadonlyMap<string, number>, changedId?: string): void {
    const inventory = upgradeEmblems(weapons, passives), owned = new Set(inventory.map(e => e.id));
    for (const [id, view] of this.entries) if (!owned.has(id)) {
      this.scene.tweens.killTweensOf(view.rim); view.root.destroy(); this.entries.delete(id);
    }
    for (const item of inventory) {
      let view = this.entries.get(item.id);
      if (!view) { view = this.create(item); this.entries.set(item.id, view); }
      const changed = view.rank !== item.level;
      view.rank = item.level;
      view.level.setText(`LV.${item.level}`);
      if (changedId === item.id && changed) {
        this.scene.tweens.killTweensOf(view.rim);
        view.rim.setAlpha(1);
        this.scene.tweens.add({ targets: view.rim, alpha: .22, duration: 240, yoyo: true, repeat: 1,
          onComplete: () => view!.rim.setAlpha(.65) });
      }
    }
    // Keep weapons/evolutions before passives, regardless of acquisition order.
    this.entries = new Map(inventory.map(item => [item.id, this.entries.get(item.id)!]));
    this.layout();
  }
  private create(item: UpgradeEmblem): EmblemView {
    const root = this.scene.add.container(0, 0), color = EMBLEM_COLORS[item.category];
    const plate = this.scene.add.graphics();
    plate.fillStyle(0x120b08, .9).fillRect(-25, -27, 50, 56);
    plate.fillStyle(0x603719, .95).fillRect(-23, -25, 46, 52);
    plate.lineStyle(1, color, .7).strokeRect(-22, -24, 44, 50);
    plate.fillStyle(0x321b10).fillRect(-21, 13, 42, 12);
    root.add(plate);
    if (this.scene.textures.exists(item.texture)) {
      root.add(this.scene.add.image(0, -5, item.texture).setScale(36 / 64));
    }
    const style = { fontFamily: THEME.typography.pixelFont, fontSize: '9px', color: '#f2d49a', stroke: '#120b08', strokeThickness: 2 };
    const level = this.scene.add.text(0, 19, `LV.${item.level}`, style).setOrigin(.5);
    const mark = this.scene.add.text(19, -20, item.category === 'evolution' ? '★' : item.category === 'passive' ? 'P' : 'W',
      { ...style, fontSize: '8px', color: `#${color.toString(16).padStart(6, '0')}` }).setOrigin(.5);
    const rim = this.scene.add.graphics().setAlpha(.65);
    rim.lineStyle(2, color).strokeRect(-24, -26, 48, 54);
    for (const x of [-21, 21]) rim.fillStyle(0xffc52a).fillRect(x - 1, -24, 2, 2);
    root.add([level, mark, rim]); this.root.add(root);
    return { root, level, rim, rank: 0 };
  }
  private layout(): void {
    const fit = upgradeRackLayout(this.scene.scale.width, this.scene.scale.height, this.entries.size);
    this.root.setPosition(fit.x, fit.y);
    let index = 0;
    for (const view of this.entries.values()) {
      view.root.setPosition(index % fit.columns * 54, Math.floor(index / fit.columns) * 60); index++;
    }
  }
}
