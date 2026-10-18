import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { CharacterData } from '../data/characters';
import { PASSIVES } from '../data/passives';
import { WEAPONS } from '../data/weapons';

export interface UpgradeChoice {
  type: 'weapon' | 'passive';
  id: string;
  name: string;
  icon: string;
  currentLevel: number;
  nextLevel: number;
  description: string;
}

export interface LevelUpData {
  choices: UpgradeChoice[];
  character?: CharacterData;
  level?: number;
  hp?: number;
  maxHp?: number;
  gold?: number;
  kills?: number;
  onSelect: (choice: UpgradeChoice) => void;
}

// Lore Catchphrases for Western Pulp '98 theme
const ITEM_LORE: Record<string, { tagline: string; typeLabel: string }> = {
  revolver: { tagline: 'Two guns.\nOne legend.', typeLabel: 'Rapid Duel' },
  peacemaker: { tagline: 'Two guns.\nOne legend.', typeLabel: 'Nearest Target' },
  shotgun: { tagline: 'Boomstick.\nSaloon cleaner.', typeLabel: 'Wide Spread' },
  rifle: { tagline: 'One bullet.\nOne vulture.', typeLabel: 'Directional Piercing' },
  dynamite: { tagline: 'Short fuse.\nBig crater.', typeLabel: 'AOE Explosion' },
  molotov: { tagline: 'Hot spirits.\nBlazing ground.', typeLabel: 'Fire Barrier' },
  lasso: { tagline: 'No outlaw\nescapes rope.', typeLabel: 'Whirling Orbit' },
  badge: { tagline: 'The law\nalways collects.', typeLabel: 'XP Bounty Buff' },
  spurs: { tagline: 'Faster than\ndesert wind.', typeLabel: 'Speed Agility' },
  whiskey: { tagline: 'Liquid grit.\nIron health.', typeLabel: 'Regeneration' },
  bandolier: { tagline: 'Lead rain\nwithout end.', typeLabel: 'Rate of Fire' },
  magnet: { tagline: 'Every nugget\nflies to you.', typeLabel: 'Gold Magnet' },
};

export class LevelUpScene extends Phaser.Scene {
  private choices: UpgradeChoice[] = [];
  private onSelectCallback!: (choice: UpgradeChoice) => void;
  private character?: CharacterData;
  private playerLevel: number = 1;
  private hp: number = 100;
  private maxHp: number = 100;
  private gold: number = 0;
  private kills: number = 0;

  private selectedIdx: number = 0;
  private hasSelected: boolean = false;

  // Root scaled container (1536 x 1024)
  private rootContainer!: Phaser.GameObjects.Container;
  private cardContainers: Phaser.GameObjects.Container[] = [];
  private cardGlows: (Phaser.GameObjects.Image | Phaser.GameObjects.Graphics)[] = [];
  private cardButtons: Phaser.GameObjects.Image[] = [];
  private buttonTexts: Phaser.GameObjects.Text[] = [];

  // Bottom Detail Panel components
  private detailTitleText!: Phaser.GameObjects.Text;
  private detailStatsText!: Phaser.GameObjects.Text;
  private detailTaglineText!: Phaser.GameObjects.Text;
  private heroSprite!: Phaser.GameObjects.Sprite;

  constructor() {
    super('LevelUpScene');
  }

  init(data: LevelUpData) {
    this.choices = data.choices || [];
    this.onSelectCallback = data.onSelect;
    this.character = data.character;
    this.playerLevel = data.level || 1;
    this.hp = data.hp || 100;
    this.maxHp = data.maxHp || 100;
    this.gold = data.gold || 0;
    this.kills = data.kills || 0;

    this.selectedIdx = 0;
    this.hasSelected = false;
    this.cardContainers = [];
    this.cardGlows = [];
    this.cardButtons = [];
    this.buttonTexts = [];
  }

  create() {
    const { width, height } = this.scale;
    sounds.playLevelUp();

    // 1. Dark Screen Dim Overlay
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x000000, 0.88);
    backdrop.fillRect(0, 0, width, height);

    // 2. Reference Resolution Root Container (1536 x 1024)
    const REF_W = 1536;
    const REF_H = 1024;
    const scale = Math.min(width / REF_W, height / REF_H);

    this.rootContainer = this.add.container(width / 2, height / 2);
    this.rootContainer.setScale(scale);

    // 3. Saloon & Desert Background Layer
    this.createBackgroundLayer();

    // 4. Top HUD (Character Portrait, LV, HP, Gold, Kills)
    this.createTopHUD();

    // 5. Hanging Title Header ("LEVEL UP! CHOOSE YOUR BOUNTY")
    this.createHangingHeader();

    // 6. Three Power-up Cards
    this.createPowerupCards();

    // 7. Bottom Details Wood Panel
    this.createBottomDetailsPanel();

    // 8. Register Controls (Keyboard 1/2/3, Arrows, Enter, Space)
    this.setupControls();

    // 9. Initial selection focus
    this.updateCardSelection(0);

    // 10. Opening Entrance Animation
    this.playEntranceAnimation();
  }

  // -------------------------------------------------------------
  // BACKGROUND LAYER: Saloon Backdrop, Wooden Beams & Props
  // -------------------------------------------------------------
  private createBackgroundLayer() {
    // Backdrop Image
    if (this.textures.exists('decor_backdrop')) {
      const bg = this.add.image(0, 0, 'decor_backdrop').setDisplaySize(1536, 1024);
      this.rootContainer.add(bg);
    }

    // Dark tint so background doesn't compete with the cards
    const dimGfx = this.add.graphics();
    dimGfx.fillStyle(0x120b08, 0.45);
    dimGfx.fillRect(-768, -512, 1536, 1024);
    this.rootContainer.add(dimGfx);

    // Saloon Side Beams (Left & Right)
    if (this.textures.exists('decor_side_beam')) {
      const beamL = this.add.image(-708, 0, 'decor_side_beam').setDisplaySize(130, 1024);
      const beamR = this.add.image(708, 0, 'decor_side_beam').setDisplaySize(130, 1024).setFlipX(true);
      this.rootContainer.add([beamL, beamR]);
    }

    // Hanging Lanterns with Amber Light Flicker
    if (this.textures.exists('decor_lantern')) {
      const lanternL = this.add.image(-610, -250, 'decor_lantern').setScale(0.78);
      const lanternR = this.add.image(610, -250, 'decor_lantern').setScale(0.78).setFlipX(true);
      this.rootContainer.add([lanternL, lanternR]);

      this.tweens.add({
        targets: [lanternL, lanternR],
        alpha: { from: 0.82, to: 1.0 },
        duration: 380,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Saloon Props on floor
    if (this.textures.exists('decor_barrel')) {
      const barrelL = this.add.image(-630, 340, 'decor_barrel').setScale(0.72);
      const barrelR = this.add.image(630, 360, 'decor_barrel').setScale(0.65).setFlipX(true);
      this.rootContainer.add([barrelL, barrelR]);
    }

    if (this.textures.exists('decor_rope')) {
      const ropeL = this.add.image(-570, 380, 'decor_rope').setScale(0.55);
      this.rootContainer.add(ropeL);
    }

    if (this.textures.exists('decor_crate')) {
      const crateR = this.add.image(580, 330, 'decor_crate').setScale(0.65);
      this.rootContainer.add(crateR);
    }

    // Cinematic Vignette overlay
    if (this.textures.exists('decor_vignette')) {
      const vignette = this.add.image(0, 0, 'decor_vignette').setDisplaySize(1536, 1024).setAlpha(0.65);
      this.rootContainer.add(vignette);
    }
  }

  // -------------------------------------------------------------
  // TOP HUD: Portrait, Level, HP Bar, Gold, Skull Kills
  // -------------------------------------------------------------
  private createTopHUD() {
    const hudContainer = this.add.container(0, -467);

    // --- LEFT: Hero Portrait & Level & HP Bar ---
    const portBg = this.add.graphics();
    portBg.fillStyle(0x23140a, 1);
    portBg.fillRoundedRect(-665, -24, 48, 48, 5);
    portBg.lineStyle(2, 0x8b5a2b, 1);
    portBg.strokeRoundedRect(-665, -24, 48, 48, 5);
    hudContainer.add(portBg);

    const charId = this.character?.id || 'steve';
    if (this.textures.exists(`hero_${charId}`)) {
      const head = this.add.sprite(-641, -4, `hero_${charId}`, 0).setScale(0.55);
      hudContainer.add(head);
    }

    // "LV. 12"
    const lvlText = this.add.text(-605, -22, `LV. ${this.playerLevel}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '13px',
      color: '#fde047',
      stroke: '#000000',
      strokeThickness: 3,
    });
    hudContainer.add(lvlText);

    // Health Bar
    const barW = 150;
    const barH = 18;
    const barX = -605;
    const barY = -3;

    const hpGfx = this.add.graphics();
    hpGfx.fillStyle(0x180b06, 1);
    hpGfx.fillRect(barX, barY, barW, barH);
    hpGfx.lineStyle(2, 0x48240f, 1);
    hpGfx.strokeRect(barX, barY, barW, barH);

    const hpPct = Phaser.Math.Clamp(this.hp / Math.max(1, this.maxHp), 0, 1);
    hpGfx.fillStyle(0xa51e16, 1);
    hpGfx.fillRect(barX + 2, barY + 2, (barW - 4) * hpPct, barH - 4);
    hudContainer.add(hpGfx);

    const hpText = this.add.text(barX + barW / 2, barY + barH / 2, `${this.hp} / ${this.maxHp}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#ffffff',
    }).setOrigin(0.5);
    hudContainer.add(hpText);

    // --- RIGHT: Gold & Kills ---
    const goldFormatted = `$${String(this.gold).padStart(6, '0')}`;
    const goldText = this.add.text(490, -14, `🪙 ${goldFormatted}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '13px',
      color: '#fde047',
      stroke: '#000000',
      strokeThickness: 3,
    });
    hudContainer.add(goldText);

    const killsFormatted = String(this.kills).padStart(4, '0');
    const killsText = this.add.text(630, -14, `💀 ${killsFormatted}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '13px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    hudContainer.add(killsText);

    this.rootContainer.add(hudContainer);
  }

  // -------------------------------------------------------------
  // HANGING TITLE HEADER: Chains, LEVEL UP! & Choose Your Bounty
  // -------------------------------------------------------------
  private createHangingHeader() {
    const headerContainer = this.add.container(0, 0);

    // Hanging Chains
    if (this.textures.exists('decor_chain')) {
      const chainL = this.add.image(-220, -475, 'decor_chain').setScale(0.55);
      const chainR = this.add.image(220, -475, 'decor_chain').setScale(0.55);
      headerContainer.add([chainL, chainR]);
    }

    // Arched Title Parchment ("LEVEL UP!")
    if (this.textures.exists('decor_title_parchment')) {
      const titleParchment = this.add.image(0, -435, 'decor_title_parchment').setDisplaySize(630, 130);
      headerContainer.add(titleParchment);
    }

    // Red Western Stars on left/right of LEVEL UP!
    if (this.textures.exists('decor_star')) {
      const starL = this.add.image(-210, -435, 'decor_star').setScale(0.4).setTint(0xa51e16);
      const starR = this.add.image(210, -435, 'decor_star').setScale(0.4).setTint(0xa51e16);
      headerContainer.add([starL, starR]);
    }

    // "LEVEL UP!" in Rye Woodcut Font
    const titleText = this.add.text(0, -435, 'LEVEL UP!', {
      fontFamily: '"Rye", serif',
      fontSize: '44px',
      color: '#a51e16',
      stroke: '#1e0d04',
      strokeThickness: 6,
      shadow: { offsetX: 3, offsetY: 3, color: '#120b08', blur: 0, fill: true },
    }).setOrigin(0.5);
    headerContainer.add(titleText);

    // Wood Title Board: "★ CHOOSE YOUR BOUNTY ★"
    if (this.textures.exists('ui_wood_title')) {
      const woodBoard = this.add.image(0, -368, 'ui_wood_title').setDisplaySize(530, 52);
      headerContainer.add(woodBoard);
    }

    const bountyText = this.add.text(0, -369, '★ CHOOSE YOUR BOUNTY ★', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '13px',
      color: '#fff7ed',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    headerContainer.add(bountyText);

    // Subtitle Wood Board: "Select an upgrade to strengthen your gunslinger"
    if (this.textures.exists('decor_subtitle_board')) {
      const subBoard = this.add.image(0, -320, 'decor_subtitle_board').setDisplaySize(520, 36);
      headerContainer.add(subBoard);
    }

    const subText = this.add.text(0, -320, 'Select an upgrade to strengthen your gunslinger', {
      fontFamily: '"Roboto Slab", serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#fed7aa',
      stroke: '#21140d',
      strokeThickness: 2,
    }).setOrigin(0.5);
    headerContainer.add(subText);

    this.rootContainer.add(headerContainer);
  }

  // -------------------------------------------------------------
  // THREE POWER-UP CARDS: Illustrated Woodcut Poster Cards
  // -------------------------------------------------------------
  private createPowerupCards() {
    const cardPositionsX = [-375, 0, 375];
    const cardBaseY = -30;
    const cardW = 300;
    const cardH = 470;

    this.choices.forEach((choice, idx) => {
      const cx = cardPositionsX[idx] !== undefined ? cardPositionsX[idx] : (idx - 1) * 375;
      const cardContainer = this.add.container(cx, cardBaseY);
      const isNew = choice.currentLevel === 0;

      // 1. Deep Drop Shadow
      const shadow = this.add.graphics();
      shadow.fillStyle(0x000000, 0.75);
      shadow.fillRoundedRect(-cardW / 2 + 8, -cardH / 2 + 10, cardW, cardH, 8);
      cardContainer.add(shadow);

      // 2. Card Artwork Image from public/assets/cards/
      const cardKey = `card_${choice.id}`;
      if (this.textures.exists(cardKey)) {
        const cardImg = this.add.image(0, 0, cardKey).setDisplaySize(cardW, cardH);
        cardContainer.add(cardImg);

        // 3. Dynamic Aged Parchment Plate for Upgrades (Level 2+)
        if (!isNew) {
          const plateW = cardW - 28;
          const plateH = 118;
          const plateY = cardH / 2 - plateH / 2 - 16;

          const plateGfx = this.add.graphics();
          plateGfx.fillStyle(0xeec185, 1);
          plateGfx.fillRect(-plateW / 2, plateY - plateH / 2, plateW, plateH);
          plateGfx.lineStyle(2, 0x3d2314, 1);
          plateGfx.strokeRect(-plateW / 2, plateY - plateH / 2, plateW, plateH);
          plateGfx.lineStyle(1, 0x78350f, 0.8);
          plateGfx.strokeRect(-plateW / 2 + 3, plateY - plateH / 2 + 3, plateW - 6, plateH - 6);
          cardContainer.add(plateGfx);

          // Level badge: ★ LV. 2 ★
          const lvlBadge = this.add.text(0, plateY - 36, `★ LV. ${choice.nextLevel} ★`, {
            fontFamily: '"Rye", serif',
            fontSize: '15px',
            color: '#1a0d00',
            stroke: '#78350f',
            strokeThickness: 1,
            backgroundColor: '#d4a373',
            padding: { left: 10, right: 10, top: 2, bottom: 2 },
          }).setOrigin(0.5);
          cardContainer.add(lvlBadge);

          // Description Text
          const descText = this.add.text(0, plateY + 12, choice.description, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '10px',
            color: '#1f130b',
            align: 'center',
            lineSpacing: 4,
            wordWrap: { width: plateW - 16 },
          }).setOrigin(0.5);
          cardContainer.add(descText);
        }
      } else {
        // Fallback procedural card
        const fallbackBg = this.add.graphics();
        fallbackBg.fillStyle(0xe8c48a, 1);
        fallbackBg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8);
        fallbackBg.lineStyle(2, 0x48240f, 1);
        fallbackBg.strokeRoundedRect(-cardW / 2 + 6, -cardH / 2 + 6, cardW - 12, cardH - 12, 6);
        cardContainer.add(fallbackBg);

        const nameText = this.add.text(0, -60, choice.name, {
          fontFamily: '"Rye", serif',
          fontSize: '20px',
          color: '#8b0e0e',
          align: 'center',
          wordWrap: { width: cardW - 30 },
        }).setOrigin(0.5);
        cardContainer.add(nameText);
      }

      // 4. Pinned Top Ribbon (Ribbon New / Upgrade)
      const ribbonKey = isNew ? 'ui_ribbon_new' : 'ui_ribbon_upgrade';
      if (this.textures.exists(ribbonKey)) {
        const ribbonImg = this.add.image(0, -cardH / 2 - 2, ribbonKey).setScale(0.8);
        cardContainer.add(ribbonImg);
      }

      const ribbonTextStr = isNew
        ? (choice.type === 'weapon' ? '★ NEW WEAPON ★' : '★ NEW BOUNTY ★')
        : `★ UPGRADE LV. ${choice.nextLevel} ★`;

      const ribbonText = this.add.text(0, -cardH / 2 - 3, ribbonTextStr, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '10px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5);
      cardContainer.add(ribbonText);

      // 5. Selected Card Golden Glowing Frame (selected_card_frame.png)
      let glowFrame: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;
      if (this.textures.exists('ui_card_selected_frame')) {
        glowFrame = this.add.image(0, 0, 'ui_card_selected_frame').setDisplaySize(cardW + 30, cardH + 30);
      } else {
        const gfx = this.add.graphics();
        gfx.lineStyle(6, 0xffc52a, 1);
        gfx.strokeRoundedRect(-cardW / 2 - 5, -cardH / 2 - 5, cardW + 10, cardH + 10, 10);
        glowFrame = gfx;
      }
      glowFrame.setVisible(false);
      cardContainer.add(glowFrame);
      this.cardGlows.push(glowFrame);

      // 6. Bottom Selection Button ("[ 1 ] CHOOSE")
      const btnY = cardH / 2 + 32;
      const btnKey = 'ui_btn_idle';
      const btnImg = this.add.image(0, btnY, this.textures.exists(btnKey) ? btnKey : '').setScale(0.82);
      cardContainer.add(btnImg);
      this.cardButtons.push(btnImg);

      const btnText = this.add.text(0, btnY, `[ ${idx + 1} ] CHOOSE`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '10px',
        color: '#d97706',
      }).setOrigin(0.5);
      cardContainer.add(btnText);
      this.buttonTexts.push(btnText);

      // 7. Interactive Hit Zone
      const hitZone = this.add.zone(0, 0, cardW + 16, cardH + 80).setInteractive({ useHandCursor: true });
      hitZone.on('pointerover', () => {
        if (!this.hasSelected) {
          this.updateCardSelection(idx);
          sounds.playRevolver();
        }
      });
      hitZone.on('pointerdown', () => {
        this.confirmUpgrade(choice);
      });
      cardContainer.add(hitZone);

      this.cardContainers.push(cardContainer);
      this.rootContainer.add(cardContainer);
    });
  }

  // -------------------------------------------------------------
  // BOTTOM DETAILS PANEL: Hero Animation, Specs & Lore Note
  // -------------------------------------------------------------
  private createBottomDetailsPanel() {
    const panelContainer = this.add.container(0, 385);

    // Wood Board Background (details_wood_board.png)
    if (this.textures.exists('decor_details_board')) {
      const board = this.add.image(0, 0, 'decor_details_board').setDisplaySize(1360, 175);
      panelContainer.add(board);
    } else {
      const fallback = this.add.graphics();
      fallback.fillStyle(0x321b10, 0.95);
      fallback.fillRoundedRect(-680, -85, 1360, 170, 8);
      fallback.lineStyle(3, 0x8b5a2b, 1);
      fallback.strokeRoundedRect(-680, -85, 1360, 170, 8);
      panelContainer.add(fallback);
    }

    // --- LEFT: Animated Hero Sprite ---
    const charId = this.character?.id || 'steve';
    const heroKey = `hero_${charId}`;

    if (this.textures.exists(heroKey)) {
      // Ground shadow
      const shadowGfx = this.add.graphics();
      shadowGfx.fillStyle(0x000000, 0.45);
      shadowGfx.fillEllipse(-490, 48, 44, 14);
      panelContainer.add(shadowGfx);

      this.heroSprite = this.add.sprite(-490, 0, heroKey, 0).setScale(1.25);
      if (this.anims.exists(`${charId}_run`)) {
        this.heroSprite.play(`${charId}_run`);
      }
      panelContainer.add(this.heroSprite);
    }

    // --- CENTER: Item Name & Attributes Table ---
    this.detailTitleText = this.add.text(-320, -58, '', {
      fontFamily: '"Rye", serif',
      fontSize: '24px',
      color: '#fde047',
      stroke: '#120b08',
      strokeThickness: 3,
    });
    panelContainer.add(this.detailTitleText);

    this.detailStatsText = this.add.text(-320, -25, '', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#fff7ed',
      lineSpacing: 7,
    });
    panelContainer.add(this.detailStatsText);

    // --- RIGHT: Small Bounty Parchment Note (small_parchment_note.png) ---
    if (this.textures.exists('decor_parchment_note')) {
      const noteImg = this.add.image(500, 0, 'decor_parchment_note').setScale(0.8);
      panelContainer.add(noteImg);
    }

    this.detailTaglineText = this.add.text(500, -10, 'Two guns.\nOne legend.', {
      fontFamily: '"Roboto Slab", serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#21140d',
      align: 'center',
      lineSpacing: 4,
    }).setOrigin(0.5);
    panelContainer.add(this.detailTaglineText);

    // Decorative Star underneath note
    const starIcon = this.add.text(500, 32, '★ ★ ★', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      color: '#a51e16',
    }).setOrigin(0.5);
    panelContainer.add(starIcon);

    this.rootContainer.add(panelContainer);
  }

  // -------------------------------------------------------------
  // UPDATE SELECTION FOCUS & BOTTOM PANEL DATA
  // -------------------------------------------------------------
  private updateCardSelection(index: number) {
    if (index < 0 || index >= this.choices.length) return;
    this.selectedIdx = index;

    // Update each card's visual state
    this.cardContainers.forEach((container, idx) => {
      const isSelected = idx === index;
      const glow = this.cardGlows[idx];
      const btn = this.cardButtons[idx];
      const btnTxt = this.buttonTexts[idx];

      if (isSelected) {
        container.setY(-44);
        container.setScale(1.03);

        if (glow) {
          glow.setVisible(true);
          glow.setAlpha(0.9);
        }

        if (btn && this.textures.exists('ui_btn_selected')) {
          btn.setTexture('ui_btn_selected');
        }
        if (btnTxt) {
          btnTxt.setColor('#fef08a');
        }
      } else {
        container.setY(-30);
        container.setScale(1.0);

        if (glow) {
          glow.setVisible(false);
        }

        if (btn && this.textures.exists('ui_btn_idle')) {
          btn.setTexture('ui_btn_idle');
        }
        if (btnTxt) {
          btnTxt.setColor('#d97706');
        }
      }
    });

    // Update Bottom Details Panel
    const choice = this.choices[index];
    if (!choice) return;

    this.detailTitleText.setText(choice.name.toUpperCase());

    const lore = ITEM_LORE[choice.id] || { tagline: 'Frontier Power.\nPure grit.', typeLabel: 'Standard' };
    this.detailTaglineText.setText(lore.tagline);

    if (choice.type === 'weapon') {
      const def = WEAPONS[choice.id];
      const lvl = def ? def.levels[Math.min(choice.nextLevel - 1, def.levels.length - 1)] : null;
      if (lvl) {
        this.detailStatsText.setText([
          `Type        : ${lore.typeLabel}`,
          `Damage      : ${lvl.damage}`,
          `Cooldown    : ${lvl.cooldownMs} ms`,
          `Projectiles : ${lvl.projectileCount}`,
          `Pierce      : ${lvl.pierce}`,
          `Description : ${lvl.description}`,
        ].join('\n'));
      } else {
        this.detailStatsText.setText(`Description : ${choice.description}`);
      }
    } else {
      // Passive buff
      this.detailStatsText.setText([
        `Category    : Passive Bounty`,
        `Type        : ${lore.typeLabel}`,
        `Rank        : Level ${choice.nextLevel}`,
        `Description : ${choice.description}`,
      ].join('\n'));
    }
  }

  // -------------------------------------------------------------
  // CONTROLS: 1, 2, 3, Arrows, A/D, Enter, Space
  // -------------------------------------------------------------
  private setupControls() {
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (this.hasSelected) return;

      if (event.key === '1' && this.choices[0]) {
        this.updateCardSelection(0);
        this.confirmUpgrade(this.choices[0]);
      } else if (event.key === '2' && this.choices[1]) {
        this.updateCardSelection(1);
        this.confirmUpgrade(this.choices[1]);
      } else if (event.key === '3' && this.choices[2]) {
        this.updateCardSelection(2);
        this.confirmUpgrade(this.choices[2]);
      } else if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
        const next = (this.selectedIdx - 1 + this.choices.length) % this.choices.length;
        this.updateCardSelection(next);
        sounds.playRevolver();
      } else if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        const next = (this.selectedIdx + 1) % this.choices.length;
        this.updateCardSelection(next);
        sounds.playRevolver();
      } else if (event.key === 'Enter' || event.key === ' ') {
        if (this.choices[this.selectedIdx]) {
          this.confirmUpgrade(this.choices[this.selectedIdx]);
        }
      }
    });
  }

  // -------------------------------------------------------------
  // CONFIRMATION & RESUME GAMEPLAY
  // -------------------------------------------------------------
  private confirmUpgrade(choice: UpgradeChoice) {
    if (this.hasSelected) return;
    this.hasSelected = true;

    sounds.playShotgun();

    // Flash and slight scale pulse on selected card
    const targetCard = this.cardContainers[this.selectedIdx];
    if (targetCard) {
      this.tweens.add({
        targets: targetCard,
        scaleX: 1.07,
        scaleY: 1.07,
        duration: 120,
        yoyo: true,
      });
    }

    // Brief amber flash on root container
    const flashGfx = this.add.graphics();
    flashGfx.fillStyle(0xffc52a, 0.4);
    flashGfx.fillRect(0, 0, this.scale.width, this.scale.height);

    this.time.delayedCall(220, () => {
      this.input.keyboard?.removeAllListeners();
      flashGfx.destroy();
      this.onSelectCallback(choice);
      this.scene.stop();
    });
  }

  // -------------------------------------------------------------
  // OPENING ENTRANCE ANIMATION
  // -------------------------------------------------------------
  private playEntranceAnimation() {
    this.rootContainer.setAlpha(0);
    this.tweens.add({
      targets: this.rootContainer,
      alpha: 1,
      duration: 220,
      ease: 'Power2',
    });

    // Stagger cards entrance
    this.cardContainers.forEach((card, idx) => {
      card.setAlpha(0);
      card.setY(card.y + 35);
      this.tweens.add({
        targets: card,
        alpha: 1,
        y: idx === this.selectedIdx ? -44 : -30,
        duration: 260,
        delay: 70 * idx,
        ease: 'Back.easeOut',
      });
    });
  }
}
