import type Phaser from 'phaser';
import { CONSUMABLE_ITEMS, CONSUMABLE_ORDER, type ConsumableId } from '../../data/consumables';
import { statsManager } from '../../data/GameStatsManager';
import { THEME } from '../theme/tokens';
import { sounds } from '../../audio/SoundManager';

interface SlotView {
  root: Phaser.GameObjects.Container;
  qtyText: Phaser.GameObjects.Text;
  hotkeyText: Phaser.GameObjects.Text;
  borderGfx: Phaser.GameObjects.Graphics;
  glowTween: Phaser.Tweens.Tween;
  id: ConsumableId;
}

export class ConsumableRack {
  readonly root: Phaser.GameObjects.Container;
  private slots = new Map<ConsumableId, SlotView>();

  constructor(
    private scene: Phaser.Scene,
    private onActivate: (id: ConsumableId) => void
  ) {
    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(60);

    const resize = () => this.layout();
    scene.scale.on('resize', resize);
    scene.events.once('shutdown', () => {
      scene.scale.off('resize', resize);
      this.root.destroy();
      this.slots.clear();
    });

    this.setupKeyBindings();
    this.refresh();
  }

  public refresh(): void {
    const owned = (typeof statsManager.getConsumables === 'function' ? statsManager.getConsumables() : statsManager.getStats?.()?.consumables) ?? {};
    const activeIds = CONSUMABLE_ORDER.filter(id => (owned[id] ?? 0) > 0);

    // Remove slots that are no longer owned
    for (const [id, slot] of this.slots.entries()) {
      if (!activeIds.includes(id)) {
        slot.glowTween?.stop();
        slot.root.destroy();
        this.slots.delete(id);
      }
    }

    // Create or update slots
    let shortcutIndex = 1;
    for (const id of activeIds) {
      const count = owned[id] ?? 0;
      let slot = this.slots.get(id);
      if (!slot) {
        slot = this.createSlot(id, String(shortcutIndex));
        this.slots.set(id, slot);
      }
      slot.qtyText.setText(`x${count}`);
      slot.hotkeyText.setText(`[${shortcutIndex}]`);
      shortcutIndex++;
    }

    this.layout();
  }

  private createSlot(id: ConsumableId, hotkey: string): SlotView {
    const def = CONSUMABLE_ITEMS[id];
    const root = this.scene.add.container(0, 0);

    // Outer container plate with RED BORDER as requested
    const plate = this.scene.add.graphics();
    plate.fillStyle(0x120b08, 0.95).fillRect(-26, -26, 52, 52);
    plate.fillStyle(0x321b10, 0.9).fillRect(-24, -24, 48, 48);
    // Dark burned red inner trim
    plate.lineStyle(1, 0xa51e16, 0.8).strokeRect(-24, -24, 48, 48);
    root.add(plate);

    // Dynamic glowing RED BORDER for arcade punch
    const borderGfx = this.scene.add.graphics();
    borderGfx.lineStyle(2, 0xe52b20, 1.0).strokeRect(-26, -26, 52, 52);
    // Brass rivet corners
    for (const cx of [-24, 24]) {
      for (const cy of [-24, 24]) {
        borderGfx.fillStyle(0xffc52a, 1.0).fillRect(cx - 1, cy - 1, 2, 2);
      }
    }
    root.add(borderGfx);

    const glowTween = this.scene.tweens.add({
      targets: borderGfx,
      alpha: { from: 1.0, to: 0.55 },
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Icon
    if (this.scene.textures.exists(def.hudTexture)) {
      const icon = this.scene.add.image(0, 0, def.hudTexture).setScale(36 / 64);
      root.add(icon);
    } else if (this.scene.textures.exists(def.cardTexture)) {
      const icon = this.scene.add.image(0, 0, def.cardTexture).setScale(36 / 64);
      root.add(icon);
    }

    // Hotkey badge top-left
    const hotkeyText = this.scene.add.text(-22, -24, `[${hotkey}]`, {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '8px',
      color: '#ffc52a',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0, 0);

    // Quantity badge bottom-right
    const qtyBg = this.scene.add.graphics();
    qtyBg.fillStyle(0x120b08, 0.9).fillRect(4, 10, 20, 12);
    root.add(qtyBg);

    const qtyText = this.scene.add.text(14, 16, 'x1', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '9px',
      color: '#ffffff',
      stroke: '#e52b20',
      strokeThickness: 2,
    }).setOrigin(0.5, 0.5);

    root.add([hotkeyText, qtyText]);

    // Interactive Click / Tap zone
    const hitZone = this.scene.add.zone(0, 0, 52, 52).setInteractive({ useHandCursor: true });
    hitZone.on('pointerover', () => {
      root.setScale(1.12);
      borderGfx.setAlpha(1.0);
    });
    hitZone.on('pointerout', () => {
      root.setScale(1.0);
    });
    hitZone.on('pointerdown', () => {
      this.trigger(id, root);
    });
    root.add(hitZone);

    this.root.add(root);
    return { root, qtyText, hotkeyText, borderGfx, glowTween, id };
  }

  private trigger(id: ConsumableId, rootContainer?: Phaser.GameObjects.Container): void {
    sounds.playReload?.();
    if (rootContainer) {
      // Elastic pop on activation
      this.scene.tweens.add({
        targets: rootContainer,
        scaleX: 1.25,
        scaleY: 1.25,
        duration: 90,
        yoyo: true,
      });
    }
    this.onActivate(id);
    this.refresh();
  }

  private setupKeyBindings(): void {
    if (!this.scene.input?.keyboard) return;
    const keys = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX'];
    keys.forEach((keyName, idx) => {
      const handler = () => {
        const activeIds = CONSUMABLE_ORDER.filter(id => statsManager.getConsumableCount(id) > 0);
        const targetId = activeIds[idx];
        if (targetId) {
          const slot = this.slots.get(targetId);
          this.trigger(targetId, slot?.root);
        }
      };
      this.scene.input.keyboard?.on(`keydown-${keyName}`, handler);
      this.scene.events.once('shutdown', () => {
        this.scene.input.keyboard?.off(`keydown-${keyName}`, handler);
      });
    });
  }

  private layout(): void {
    const { width, height } = this.scene.scale;
    const count = this.slots.size;
    if (count === 0) {
      this.root.setVisible(false);
      return;
    }
    this.root.setVisible(true);

    // Place consumable rack on the bottom-right or centered near upgrade rack
    // Slot width = 58px. Stack them neatly horizontally on bottom-right!
    const slotSpacing = 58;
    const totalW = count * slotSpacing;
    const startX = width - totalW / 2 - 24;
    const startY = height - 42;

    this.root.setPosition(startX, startY);

    let index = 0;
    for (const slot of this.slots.values()) {
      const posX = (index - (count - 1) / 2) * slotSpacing;
      slot.root.setPosition(posX, 0);
      index++;
    }
  }
}
