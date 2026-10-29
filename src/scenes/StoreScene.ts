import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { statsManager } from '../data/GameStatsManager';
import { CONSUMABLE_ITEMS, CONSUMABLE_ORDER, type ConsumableId } from '../data/consumables';
import { createMenuRoot } from '../ui/layout/menuLayout';
import { bindPulpKeys, preloadPulp, pulpBackdrop, pulpButton, pulpHeading, pulpText } from '../ui/layout/pulpSceneKit';
import { preloadImages } from '../assets/registry';

export class StoreScene extends Phaser.Scene {
  private fromScene = 'MenuScene';
  private rootContainer!: Phaser.GameObjects.Container;
  private balanceText!: Phaser.GameObjects.Text;
  private speechText!: Phaser.GameObjects.Text;
  private shopkeeperSprite?: Phaser.GameObjects.Image;
  private itemCards: Map<ConsumableId, { countText: Phaser.GameObjects.Text; buyBtn: ReturnType<typeof pulpButton> }> = new Map();

  constructor() {
    super('StoreScene');
  }

  init(data?: { fromScene?: string }) {
    this.fromScene = data?.fromScene ?? 'MenuScene';
  }

  preload() {
    preloadPulp(this);
    preloadImages(this, [
      'store_bkg',
      'store_header_sign',
      'shopkeeper_barnaby',
      'shopkeeper',
      'consumable_magnet',
      'consumable_boots',
      'consumable_tonic',
      'consumable_dynamite',
      'consumable_highnoon',
      'consumable_bullets',
      'card_magnet',
      'card_spurs',
      'card_whiskey',
      'card_dynamite',
      'card_desperado_fury',
      'card_golden_repeater',
    ]);
  }

  create() {
    this.rootContainer = createMenuRoot(this);

    // 1. Atmospheric Store Background
    if (this.textures.exists('store_bkg')) {
      const bg = this.add.image(0, 0, 'store_bkg').setOrigin(0.5, 0.5);
      bg.setScale(1.78);
      this.rootContainer.add(bg);
    } else {
      pulpBackdrop(this, this.rootContainer, true);
    }

    // Saloon greeting
    sounds.playDealerGreeting();

    // 2. Ambient Lantern Lighting (ADD Blend Mode)
    this.createLanternAura(-620, -290);
    this.createLanternAura(570, -290);

    // 3. Top Header Sign
    if (this.textures.exists('store_header_sign')) {
      const header = this.add.image(0, -425, 'store_header_sign').setOrigin(0.5, 0.5);
      header.setScale(1.75);
      this.rootContainer.add(header);
    } else {
      pulpHeading(this, this.rootContainer, "BARNABY'S GENERAL STORE", -420, 1340, 68, true);
      pulpText(this, this.rootContainer, 0, -360, '★ PROVISIONS, CONTRABAND & ONE-USE POWER-UPS ★', 22, '#ffc52a');
    }

    // 4. Shopkeeper & Counter Section (Left Column)
    this.createShopkeeperSection();

    // 5. Merchandise Display Grid (Right Area: 2 rows x 3 columns)
    this.createMerchandiseGrid();

    // 6. Bottom Controls & Return Button
    pulpButton(this, this.rootContainer, 0, 400, '★ RETURN TO THE TRAIL ★', () => this.leaveStore(), 460);
    pulpText(this, this.rootContainer, 0, 450, '✥ [ESC] RETURN ✥', 15, '#ffc52a');

    // Setup Keyboard Bindings
    bindPulpKeys(this, {
      ESC: () => this.leaveStore(),
      '1': () => this.tryBuy('golden_magnet'),
      '2': () => this.tryBuy('seven_league_boots'),
      '3': () => this.tryBuy('miracle_elixir'),
      '4': () => this.tryBuy('mega_dynamite'),
      '5': () => this.tryBuy('omni_shot'),
      '6': () => this.tryBuy('silver_bullet'),
    });

    this.refreshUI();
  }

  private createLanternAura(x: number, y: number): void {
    const glow = this.add.graphics();
    for (let r = 90; r > 10; r -= 10) {
      glow.fillStyle(0xffaa2a, 0.025).fillCircle(x, y, r);
    }
    glow.setBlendMode(Phaser.BlendModes.ADD);
    this.rootContainer.add(glow);

    this.tweens.add({
      targets: glow,
      alpha: 0.65,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 850 + Math.random() * 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createShopkeeperSection(): void {
    const section = this.add.container(-485, -120);
    this.rootContainer.add(section);

    // Barnaby Character Sprite
    const shopTexture = this.textures.exists('shopkeeper_barnaby') ? 'shopkeeper_barnaby' : 'shopkeeper';
    if (this.textures.exists(shopTexture)) {
      this.shopkeeperSprite = this.add.image(0, -35, shopTexture).setOrigin(0.5, 0.5);
      this.shopkeeperSprite.setScale(1.85);
      section.add(this.shopkeeperSprite);

      // Interactive Click: Barnaby gives tips
      this.shopkeeperSprite.setInteractive({ useHandCursor: true });
      this.shopkeeperSprite.on('pointerdown', () => {
        sounds.playHospitalityGreeting();
        const tips = [
          'Cash on the barrelhead!\nFinest supplies in the entire\nterritory.',
          'Nothing like Nitro Dynamite\nto clear out a bad bunch of bandits!',
          'Every bullet counts, partner,\nbut silver ones hit four times harder!',
          'Run fast enough with them boots\nand even lead cannot catch ya!',
        ];
        this.speechText.setText(tips[Math.floor(Math.random() * tips.length)]);
        this.cameras.main.flash(40, 255, 197, 42, false);
      });

      // Subtle breathing motion
      this.tweens.add({
        targets: this.shopkeeperSprite,
        y: -31,
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Dialogue Plaque
    const dialoguePlaque = this.add.graphics();
    this.drawWesternPlaque(dialoguePlaque, 0, 115, 340, 96, false);
    section.add(dialoguePlaque);

    this.speechText = this.add.text(0, 115, 'Cash on the barrelhead!\nFinest supplies in the entire\nterritory.', {
      fontFamily: 'serif',
      fontSize: '15px',
      color: '#f2d49a',
      align: 'center',
      lineSpacing: 4,
    }).setOrigin(0.5, 0.5);
    section.add(this.speechText);

    // Wallet Plaque
    const walletPlaque = this.add.graphics();
    this.drawWesternPlaque(walletPlaque, 0, 195, 340, 50, false);
    section.add(walletPlaque);

    this.balanceText = this.add.text(0, 195, '★ WALLET: $0 ★', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '16px',
      color: '#ffc52a',
    }).setOrigin(0.5, 0.5);
    section.add(this.balanceText);
  }

  private createMerchandiseGrid(): void {
    const colXs = [-120, +200, +520];
    const rowYs = [-145, +145];
    const cardW = 295;
    const cardH = 255;

    CONSUMABLE_ORDER.forEach((id, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = colXs[col];
      const y = rowYs[row];

      this.createItemCard(id, x, y, cardW, cardH);
    });
  }

  private createItemCard(id: ConsumableId, x: number, y: number, cardW: number, cardH: number): void {
    const def = CONSUMABLE_ITEMS[id];
    const card = this.add.container(x, y);
    this.rootContainer.add(card);

    // 1. Ornate Western Card Parchment Plaque
    const plaqueGfx = this.add.graphics();
    this.drawWesternPlaque(plaqueGfx, 0, 0, cardW, cardH, true);
    card.add(plaqueGfx);

    // 2. Icon Box (top-left)
    const iconGfx = this.add.graphics();
    iconGfx.fillStyle(0x000000, 0.4);
    iconGfx.fillRect(-122, -100, 68, 68);
    iconGfx.fillStyle(0x120b08, 1);
    iconGfx.fillRect(-124, -102, 68, 68);
    iconGfx.lineStyle(2, 0xffc52a, 0.9);
    iconGfx.strokeRect(-124, -102, 68, 68);
    iconGfx.lineStyle(1, 0xa51e16, 0.8);
    iconGfx.strokeRect(-121, -99, 62, 62);
    card.add(iconGfx);

    // Icon Texture
    const iconTexture = this.textures.exists(def.cardTexture) ? def.cardTexture : def.hudTexture;
    if (this.textures.exists(iconTexture)) {
      const icon = this.add.image(-90, -68, iconTexture);
      icon.setScale(Math.min(56 / icon.width, 56 / icon.height));
      card.add(icon);
    }

    // 3. Red Ribbon Title Banner (top-right)
    const ribbonGfx = this.add.graphics();
    this.drawRedRibbon(ribbonGfx, 42, -88, 175, 26);
    card.add(ribbonGfx);

    const titleText = this.add.text(42, -88, def.name, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5);
    card.add(titleText);

    // 4. Description Text (below ribbon)
    const desc = this.add.text(42, -45, def.description, {
      fontFamily: 'serif',
      fontSize: '13px',
      color: '#26130b',
      align: 'left',
      wordWrap: { width: 172 },
      lineSpacing: 2,
    }).setOrigin(0.5, 0.5);
    card.add(desc);

    // 5. IN BAG count (centered)
    const countText = this.add.text(0, 36, 'IN BAG: 0', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#26130b',
    }).setOrigin(0.5, 0.5);
    card.add(countText);

    // 6. BUY Button (bottom)
    const buyBtn = pulpButton(
      this,
      card,
      0,
      82,
      `BUY $${def.price}`,
      () => this.tryBuy(id),
      210
    );

    this.itemCards.set(id, { countText, buyBtn });
  }

  private drawWesternPlaque(graphics: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, isParchment = false): void {
    const hw = w / 2;
    const hh = h / 2;

    // Drop shadow
    graphics.fillStyle(0x000000, 0.45);
    graphics.fillRoundedRect(x - hw + 3, y - hh + 4, w, h, 6);

    // Outer dark wood frame
    graphics.fillStyle(0x321b10, 1);
    graphics.fillRoundedRect(x - hw, y - hh, w, h, 6);

    // Gold beveled border line
    graphics.lineStyle(2, 0xffc52a, 0.85);
    graphics.strokeRoundedRect(x - hw + 2, y - hh + 2, w - 4, h - 4, 5);

    // Inner surface fill
    graphics.fillStyle(isParchment ? 0xf4dcac : 0x160c07, 1);
    graphics.fillRoundedRect(x - hw + 5, y - hh + 5, w - 10, h - 10, 4);

    // Inner contour border
    graphics.lineStyle(1, isParchment ? 0x8c5e31 : 0x603719, 0.7);
    graphics.strokeRoundedRect(x - hw + 7, y - hh + 7, w - 14, h - 14, 3);

    // Brass corner studs
    graphics.fillStyle(0xffc52a, 0.95);
    graphics.fillCircle(x - hw + 9, y - hh + 9, 3);
    graphics.fillCircle(x + hw - 9, y - hh + 9, 3);
    graphics.fillCircle(x - hw + 9, y + hh - 9, 3);
    graphics.fillCircle(x + hw - 9, y + hh - 9, 3);
  }

  private drawRedRibbon(graphics: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number): void {
    const hw = w / 2;
    const hh = h / 2;

    // Ribbon drop shadow
    graphics.fillStyle(0x000000, 0.35);
    graphics.fillRect(x - hw + 2, y - hh + 2, w, h);

    // Vibrant Red Banner
    graphics.fillStyle(0xa51e16, 1);
    graphics.fillRect(x - hw, y - hh, w, h);

    // Golden accent border
    graphics.lineStyle(1.5, 0xffc52a, 0.8);
    graphics.strokeRect(x - hw, y - hh, w, h);
  }

  private tryBuy(id: ConsumableId): void {
    const item = CONSUMABLE_ITEMS[id];
    if (!item) return;

    const result = statsManager.buyConsumable(id, item.price);
    if (result === 'bought') {
      sounds.playCoin();
      this.cameras.main.flash(70, 255, 197, 42, false);
      const quotes = [
        `Pleasure doing business!\nThat ${item.name} is worth every penny.`,
        'Pack it in your saddlebag!\nReady for when bullets fly.',
        'Finest quality in the territory!\nUse it wisely out on the trail.',
      ];
      this.speechText.setText(quotes[Math.floor(Math.random() * quotes.length)]);
      this.refreshUI();
    } else if (result === 'insufficient') {
      sounds.playReload();
      this.cameras.main.shake(120, 0.005);
      this.speechText.setText(`Not enough cash for that, partner!\nIt costs $${item.price}.`);
    }
  }

  private refreshUI(): void {
    const stats = statsManager.getStats();
    this.balanceText.setText(`★ WALLET: $${stats.bank.toLocaleString()} ★`);

    for (const [id, ui] of this.itemCards.entries()) {
      const def = CONSUMABLE_ITEMS[id];
      const count = statsManager.getConsumableCount(id);
      ui.countText.setText(`IN BAG: ${count}`);
      ui.buyBtn.setEnabled(stats.bank >= def.price);
    }
  }

  private leaveStore(): void {
    sounds.playRevolver();
    if (this.fromScene === 'MenuScene') {
      this.scene.stop('StoreScene');
      this.scene.resume('MenuScene');
    } else {
      this.scene.stop('StoreScene');
      this.scene.resume(this.fromScene);
    }
  }
}
