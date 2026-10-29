import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { statsManager } from '../data/GameStatsManager';
import { CONSUMABLE_ITEMS, CONSUMABLE_ORDER, type ConsumableId } from '../data/consumables';
import { createMenuRoot } from '../ui/layout/menuLayout';
import { bindPulpKeys, preloadPulp, pulpBackdrop, pulpButton, pulpText } from '../ui/layout/pulpSceneKit';
import { preloadImages } from '../assets/registry';
import { THEME } from '../ui/theme/tokens';

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
      'shopkeeper',
      'card_magnet',
      'card_spurs',
      'card_whiskey',
      'card_dynamite',
      'card_desperado_fury',
      'card_golden_repeater',
      'hud_upgrade_magnet',
      'hud_upgrade_spurs',
      'hud_upgrade_whiskey',
      'hud_upgrade_dynamite',
      'hud_upgrade_desperado_fury',
      'hud_upgrade_golden_repeater',
      'wm_barrel',
      'wm_crate',
      'wm_lantern',
    ]);
  }

  create() {
    this.rootContainer = createMenuRoot(this);

    // 1. Existing Authentic Western Saloon Backdrop
    pulpBackdrop(this, this.rootContainer, true);

    // Saloon greeting
    sounds.playDealerGreeting();

    // 2. Ambient Lantern Lighting (ADD Blend Mode)
    this.createLanternAura(-620, -300);
    this.createLanternAura(600, -300);

    // 3. Top Header: Ornate Wooden Plaque + Red Ribbon Banner
    this.createHeaderBanner();

    // 4. Shopkeeper & Counter Section (Left Column)
    this.createShopkeeperSection();

    // 5. Merchandise Display Grid (Right Area: 2 rows x 3 columns)
    this.createMerchandiseGrid();

    // 6. Bottom Controls & Return Button
    pulpButton(this, this.rootContainer, 0, 405, '★ RETURN TO THE TRAIL ★', () => this.leaveStore(), 460);
    pulpText(this, this.rootContainer, 0, 455, '✥ [ESC] RETURN ✥', 15, '#ffc52a');

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

  private createHeaderBanner(): void {
    const headerContainer = this.add.container(0, -420);
    this.rootContainer.add(headerContainer);

    // Header Plaque Graphics
    const plaqueGfx = this.add.graphics();
    const w = 1020;
    const h = 76;
    const hw = w / 2;
    const hh = h / 2;

    // Drop shadow
    plaqueGfx.fillStyle(0x000000, 0.55);
    plaqueGfx.fillRoundedRect(-hw + 4, -hh + 5, w, h, 8);

    // Outer Dark Wood
    plaqueGfx.fillStyle(0x321b10, 1);
    plaqueGfx.fillRoundedRect(-hw, -hh, w, h, 8);

    // Gold Outer Rim
    plaqueGfx.lineStyle(3, 0xffc52a, 0.95);
    plaqueGfx.strokeRoundedRect(-hw + 3, -hh + 3, w - 6, h - 6, 7);

    // Inner Dark Wood Inset
    plaqueGfx.fillStyle(0x1a0d06, 1);
    plaqueGfx.fillRoundedRect(-hw + 6, -hh + 6, w - 12, h - 12, 5);

    // Inner Gold Accent Line
    plaqueGfx.lineStyle(1, 0xa51e16, 0.85);
    plaqueGfx.strokeRoundedRect(-hw + 8, -hh + 8, w - 16, h - 16, 4);

    // Brass corner studs
    plaqueGfx.fillStyle(0xffc52a, 1);
    [-hw + 14, hw - 14].forEach((cx) => {
      [-hh + 14, hh - 14].forEach((cy) => {
        plaqueGfx.fillCircle(cx, cy, 4);
      });
    });
    headerContainer.add(plaqueGfx);

    // Main Store Title Text
    const titleText = this.add.text(0, -2, "★  BARNABY'S GENERAL STORE  ★", {
      fontFamily: 'Rye, "Roboto Slab", serif',
      fontSize: '34px',
      color: '#ffc52a',
      stroke: '#120b08',
      strokeThickness: 5,
    }).setOrigin(0.5, 0.5);
    headerContainer.add(titleText);

    // Red Ribbon Banner directly below the plaque
    const ribbonGfx = this.add.graphics();
    const rw = 720;
    const rh = 34;
    const rhw = rw / 2;
    const ry = 48;

    // Ribbon drop shadow
    ribbonGfx.fillStyle(0x000000, 0.45);
    ribbonGfx.fillRect(-rhw + 3, ry - rh / 2 + 3, rw, rh);

    // Red Ribbon Fill
    ribbonGfx.fillStyle(0xa51e16, 1);
    ribbonGfx.fillRect(-rhw, ry - rh / 2, rw, rh);

    // Ribbon Gold Border
    ribbonGfx.lineStyle(2, 0xffc52a, 0.9);
    ribbonGfx.strokeRect(-rhw, ry - rh / 2, rw, rh);

    // Decorative notched ends / side accents
    ribbonGfx.fillStyle(0x75120c, 1);
    ribbonGfx.fillRect(-rhw - 14, ry - rh / 2 + 4, 14, rh - 8);
    ribbonGfx.fillRect(rhw, ry - rh / 2 + 4, 14, rh - 8);
    headerContainer.add(ribbonGfx);

    const subText = this.add.text(0, ry, 'PROVISIONS, CONTRABAND & ONE-USE POWER-UPS', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '13px',
      color: '#f2d49a',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    headerContainer.add(subText);
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
    // Left column centered at x = -485, positioned so the wallet aligns with the bottom of item cards
    const section = this.add.container(-485, 0);
    this.rootContainer.add(section);

    // Ambient counter backdrop glow
    const ambientGlow = this.add.graphics();
    ambientGlow.fillStyle(0xffa32a, 0.07).fillCircle(0, -25, 125);
    ambientGlow.setBlendMode(Phaser.BlendModes.ADD);
    section.add(ambientGlow);

    // Shopkeeper Sprite (Enlarged size: 2.4x)
    if (this.textures.exists('shopkeeper')) {
      this.shopkeeperSprite = this.add.image(0, -25, 'shopkeeper').setOrigin(0.5, 0.5);
      this.shopkeeperSprite.setScale(2.4);
      section.add(this.shopkeeperSprite);

      // Interactive Click: Barnaby speaks
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
        y: -20,
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Wooden Counter below the Shopkeeper
    const counterGfx = this.add.graphics();
    counterGfx.fillStyle(0x321b10, 1);
    counterGfx.fillRoundedRect(-185, 78, 370, 28, 4);
    counterGfx.lineStyle(2, 0xffc52a, 0.85);
    counterGfx.strokeRoundedRect(-185, 78, 370, 28, 4);

    // Brass rivets on counter
    counterGfx.fillStyle(0xffc52a, 1);
    for (let bx = -165; bx <= 165; bx += 33) {
      counterGfx.fillCircle(bx, 92, 3);
    }
    section.add(counterGfx);

    // Decorative barrel and crate flanking the counter
    if (this.textures.exists('wm_barrel')) {
      const barrel = this.add.image(-155, 105, 'wm_barrel').setScale(0.9);
      section.add(barrel);
    }
    if (this.textures.exists('wm_crate')) {
      const crate = this.add.image(155, 105, 'wm_crate').setScale(0.85);
      section.add(crate);
    }

    // Dialogue Plaque
    const dialoguePlaque = this.add.graphics();
    this.drawWesternPlaque(dialoguePlaque, 0, 162, 350, 94, false);
    section.add(dialoguePlaque);

    this.speechText = this.add.text(0, 162, 'Cash on the barrelhead!\nFinest supplies in the entire\nterritory.', {
      fontFamily: THEME.typography.narrativeFont,
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#f2d49a',
      align: 'center',
      lineSpacing: 4,
    }).setOrigin(0.5, 0.5);
    section.add(this.speechText);

    // Wallet Plaque - Bottom aligns with the bottom of the last row of item cards (Y = +272)
    const walletPlaque = this.add.graphics();
    this.drawWesternPlaque(walletPlaque, 0, 246, 350, 52, false);
    section.add(walletPlaque);

    this.balanceText = this.add.text(0, 246, '★ WALLET: $0 ★', {
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

    // Icon Texture: uses approved hudTexture or cardTexture from catalog
    const iconTexture = this.textures.exists(def.hudTexture) ? def.hudTexture : def.cardTexture;
    if (this.textures.exists(iconTexture)) {
      const icon = this.add.image(-90, -68, iconTexture);
      icon.setScale(Math.min(54 / icon.width, 54 / icon.height));
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
    const desc = this.add.text(42, -42, def.description, {
      fontFamily: THEME.typography.narrativeFont,
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#120b08',
      align: 'left',
      wordWrap: { width: 178 },
      lineSpacing: 3,
    }).setOrigin(0.5, 0.5);
    card.add(desc);

    // 5. IN BAG count (centered)
    const countText = this.add.text(0, 36, 'IN BAG: 0', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#120b08',
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
