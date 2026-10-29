import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { statsManager } from '../data/GameStatsManager';
import { CONSUMABLE_ITEMS, CONSUMABLE_ORDER, type ConsumableId } from '../data/consumables';
import { createMenuRoot } from '../ui/layout/menuLayout';
import { bindPulpKeys, preloadPulp, pulpBackdrop, pulpButton, pulpHeading, pulpPaper, pulpText, pulpWood } from '../ui/layout/pulpSceneKit';
import { preloadImages } from '../assets/registry';

export class StoreScene extends Phaser.Scene {
  private fromScene = 'MenuScene';
  private rootContainer!: Phaser.GameObjects.Container;
  private balanceText!: Phaser.GameObjects.Text;
  private speechText!: Phaser.GameObjects.Text;
  private shopkeeperSprite!: Phaser.GameObjects.Image;
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
      'faro_dealer',
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
    pulpBackdrop(this, this.rootContainer, true);

    // Saloon greeting
    sounds.playDealerGreeting();

    // 1. Header Banner
    pulpHeading(this, this.rootContainer, "BARNABY'S GENERAL STORE", -420, 1340, 68, true);
    pulpText(this, this.rootContainer, 0, -360, '★ PROVISIONS, CONTRABAND & ONE-USE POWER-UPS ★', 22, '#ffc52a');

    // 2. Shopkeeper & Counter Section (Left / Center)
    this.createShopkeeperSection();

    // 3. Merchandise Display Grid (Right / Center Shelves)
    this.createMerchandiseGrid();

    // 4. Bottom Controls & Return Button
    pulpButton(this, this.rootContainer, 0, 450, 'RETURN TO THE TRAIL', () => this.leaveStore(), 480);
    pulpText(this, this.rootContainer, 0, 498, '[CLICK ITEM TO BUY]   •   [ESC] RETURN', 18, '#f2d49a');

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

  private createShopkeeperSection(): void {
    const section = this.add.container(-470, -110);
    this.rootContainer.add(section);

    // Ambient lantern glow behind the counter
    const lanternGlow = this.add.graphics();
    for (let r = 90; r > 10; r -= 10) {
      lanternGlow.fillStyle(0xffa32a, 0.018).fillCircle(0, -60, r);
    }
    lanternGlow.setBlendMode(Phaser.BlendModes.ADD);
    section.add(lanternGlow);
    this.tweens.add({ targets: lanternGlow, alpha: 0.6, duration: 900, yoyo: true, repeat: -1 });

    // Shopkeeper Portrait / Sprite
    if (this.textures.exists('shopkeeper')) {
      this.shopkeeperSprite = this.add.image(0, -60, 'shopkeeper').setOrigin(0.5, 0.5);
      this.shopkeeperSprite.setScale(2.1);
      section.add(this.shopkeeperSprite);

      // Subtle breathing motion
      this.tweens.add({
        targets: this.shopkeeperSprite,
        y: -56,
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Wooden Counter
    pulpWood(this, section, 0, 80, 440, 52);
    // Brass nails & detail on counter
    const brassTrim = this.add.graphics();
    brassTrim.fillStyle(0xffc52a, 0.9);
    for (let x = -190; x <= 190; x += 38) brassTrim.fillCircle(x, 80, 3.5);
    section.add(brassTrim);

    // Decorative barrel and crate next to counter
    if (this.textures.exists('wm_barrel')) {
      const barrel = this.add.image(-160, 115, 'wm_barrel').setScale(0.95);
      section.add(barrel);
    }
    if (this.textures.exists('wm_crate')) {
      const crate = this.add.image(160, 115, 'wm_crate').setScale(0.9);
      section.add(crate);
    }

    // Speech Plaque
    pulpPaper(this, section, 0, 185, 450, 78);
    this.speechText = pulpText(
      this,
      section,
      0,
      185,
      '"CASH ON THE BARRELHEAD, STRANGER!\nFINEST SUPPLIES IN THE ENTIRE WEST!"',
      16,
      '#120b08'
    );

    // Live Wallet Display
    pulpWood(this, section, 0, 260, 440, 48);
    this.balanceText = pulpText(this, section, 0, 260, 'WALLET: $0', 23, '#ffc52a');
  }

  private createMerchandiseGrid(): void {
    const gridX = 140;
    const gridY = -120;
    const colWidth = 360;
    const rowHeight = 270;

    CONSUMABLE_ORDER.forEach((id, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = gridX + (col - 1) * colWidth;
      const y = gridY + row * rowHeight;

      this.createItemCard(id, x, y);
    });
  }

  private createItemCard(id: ConsumableId, x: number, y: number): void {
    const def = CONSUMABLE_ITEMS[id];
    const card = this.add.container(x, y);
    this.rootContainer.add(card);

    // Paper card background
    pulpPaper(this, card, 0, 0, 340, 250);

    // Red Western Frame for Single-Use Power-Up
    const redBorder = this.add.graphics();
    redBorder.lineStyle(3, 0xe52b20, 0.85);
    redBorder.strokeRect(-166, -121, 332, 242);
    redBorder.lineStyle(1, 0xffc52a, 0.6);
    redBorder.strokeRect(-162, -117, 324, 234);
    card.add(redBorder);

    // Item Icon Container
    const iconBox = this.add.container(-105, -55);
    card.add(iconBox);

    const iconBg = this.add.graphics();
    iconBg.fillStyle(0x120b08, 0.95);
    iconBg.fillRect(-36, -36, 72, 72);
    iconBg.lineStyle(2, 0xe52b20, 1);
    iconBg.strokeRect(-36, -36, 72, 72);
    iconBox.add(iconBg);

    if (this.textures.exists(def.hudTexture)) {
      const icon = this.add.image(0, 0, def.hudTexture);
      icon.setScale(Math.min(56 / icon.width, 56 / icon.height));
      iconBox.add(icon);
    } else if (this.textures.exists(def.cardTexture)) {
      const icon = this.add.image(0, 0, def.cardTexture);
      icon.setScale(Math.min(56 / icon.width, 56 / icon.height));
      iconBox.add(icon);
    }

    // Title & Rarity
    pulpText(this, card, 25, -78, def.name, 19, '#a51e16');
    pulpText(this, card, 25, -54, def.subtitle, 13, '#603719');

    // Description text (wrapped)
    const desc = this.add.text(0, 5, def.description, {
      fontFamily: 'serif',
      fontSize: '14px',
      color: '#321b10',
      align: 'center',
      wordWrap: { width: 310 },
      lineSpacing: 3,
    }).setOrigin(0.5, 0.5);
    card.add(desc);

    // Saddlebag owned count
    const countText = pulpText(this, card, -70, 78, 'OWNED: 0', 16, '#603719');

    // Buy Button
    const buyBtn = pulpButton(
      this,
      card,
      80,
      78,
      `BUY $${def.price}`,
      () => this.tryBuy(id),
      150
    );

    this.itemCards.set(id, { countText, buyBtn });
  }

  private tryBuy(id: ConsumableId): void {
    const item = CONSUMABLE_ITEMS[id];
    if (!item) return;

    const result = statsManager.buyConsumable(id, item.price);
    if (result === 'bought') {
      sounds.playCoin();
      this.cameras.main.flash(70, 255, 197, 42, false);
      const quotes = [
        `"MIGHTY FINE! THAT ${item.name} IS WORTH EVERY PENNY!"`,
        `"PACK IT IN YOUR SADDLEBAG! READY FOR WHEN BULLETS FLY!"`,
        `"PLEASURE DOING BUSINESS! USE IT WISELY OUT ON THE TRAIL!"`,
      ];
      this.speechText.setText(quotes[Math.floor(Math.random() * quotes.length)]);
      this.refreshUI();
    } else if (result === 'insufficient') {
      sounds.playReload();
      this.cameras.main.shake(120, 0.005);
      this.speechText.setText(`"NOT ENOUGH CASH FOR THAT, PARTNER!\nIT COSTS $${item.price}!"`);
    }
  }

  private refreshUI(): void {
    const stats = statsManager.getStats();
    this.balanceText.setText(`WALLET: $${stats.bank.toLocaleString()}`);

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
