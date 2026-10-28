import { WesternButton } from '../ui/components/WesternButton';
import { heroPortrait } from '../ui/components/HeroPortrait';
import { CATALOG, preloadImages, preloadHeroSheets } from '../assets/registry';
import { preloadPulp, pulpText } from '../ui/layout/pulpSceneKit';
import { pulpSurface } from '../ui/components/PulpSurface';
import { THEME } from '../ui/theme/tokens';
import { createMenuRoot, menuBackdropScale } from '../ui/layout/menuLayout';
import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { CharacterData } from '../data/characters';
import { WEAPONS } from '../data/weapons';

export interface UpgradeChoice {
  type: 'weapon' | 'passive' | 'evolution' | 'reward';
  id: string;
  name: string;
  icon: string;
  currentLevel: number;
  nextLevel: number;
  description: string;
}

export interface LevelUpData {
  title?:string;
  choices: UpgradeChoice[];
  character?: CharacterData;
  level?: number;
  hp?: number;
  maxHp?: number;
  gold?: number;
  kills?: number;
  rerollsRemaining?:number;
  onReroll?:()=>{choices:UpgradeChoice[];remaining:number}|undefined;
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
  lasso: { tagline: 'Crack the whip.\nClear both flanks.', typeLabel: 'Piercing Lash' },
  badge: { tagline: 'The law\nalways collects.', typeLabel: 'XP Bounty Buff' },
  spurs: { tagline: 'Faster than\ndesert wind.', typeLabel: 'Speed Agility' },
  whiskey: { tagline: 'Liquid grit.\nIron health.', typeLabel: 'Regeneration' },
  bandolier: { tagline: 'Lead rain\nwithout end.', typeLabel: 'Rate of Fire' },
  magnet: { tagline: 'Every nugget\nflies to you.', typeLabel: 'Gold Magnet' },
  // Evolutions
  desperado_fury: { tagline: 'MAX POWER.\nNo survivors.', typeLabel: '★ EVOLUTION ★' },
  blunderbuss_doom: { tagline: 'Hell unleashed.\nPure wreckage.', typeLabel: '★ EVOLUTION ★' },
  golden_repeater: { tagline: 'Infinite ricochet.\nGolden justice.', typeLabel: '★ EVOLUTION ★' },
  hellfire_keg: { tagline: 'Scorched earth.\nAshes only.', typeLabel: '★ EVOLUTION ★' },
  cyclone_whip: { tagline: 'Divine storm.\nVacuum vortex.', typeLabel: '★ EVOLUTION ★' },
};

export class LevelUpScene extends Phaser.Scene {
  private choices: UpgradeChoice[] = [];
  private draftData!:LevelUpData;
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
    this.draftData=data;
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

  preload() {
    preloadPulp(this); preloadHeroSheets(this);
    preloadImages(this, ['hud_avatar_steve', 'hud_avatar_billy', 'hud_avatar_bob', 'hud_avatar_cormano', 'hud_coin_icon', 'hud_skull_icon', 'decor_chain', 'ui_btn_idle', 'ui_btn_selected', 'ui_card_selected_frame', 'ui_ribbon_new', 'ui_ribbon_upgrade']);
    preloadImages(this, this.choices.map(choice => choice.type === 'reward' ? choice.id === 'gold_purse' ? 'card_badge' : 'card_whiskey' : `card_${choice.id}`).filter(key => key in CATALOG.images));
  }

  create() {
    const { width, height } = this.scale;
    sounds.playLevelUp();

    // 1. Dark Screen Dim Overlay
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x000000, 0.88);
    backdrop.fillRect(0, 0, width, height);

    // 2. Reference Resolution Root Container (1536 x 1024)

    this.rootContainer = createMenuRoot(this);

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
    if(this.draftData.onReroll){
      const reroll=new WesternButton(this,{x:560,y:-350,width:310,height:64,text:`SECOND CHANCE [R]\n${this.draftData.rerollsRemaining??0} LEFT`,fontSize:'18px',presentation:'pulp',onClick:()=>this.rerollDraft()});
      reroll.setEnabled((this.draftData.rerollsRemaining??0)>0);this.rootContainer.add(reroll);
    }

    // 9. Initial selection focus
    this.updateCardSelection(0);

    // 10. Opening Entrance Animation
    this.playEntranceAnimation();
  }

  // -------------------------------------------------------------
  // BACKGROUND LAYER: Saloon_bkg.png (Western Saloon Interior)
  // -------------------------------------------------------------
  private createBackgroundLayer() {
    // 1. Saloon Interior Background (Saloon_bkg.png)
    const bkgKey = this.textures.exists('saloon_bkg') ? 'saloon_bkg' : 'decor_backdrop';
    const bg = this.add.image(0, 0, bkgKey);
    bg.setScale(menuBackdropScale(this.scale.width, this.scale.height, bg.width, bg.height));
    this.rootContainer.add(bg);

    // 2. Dark tint overlay suave para dar foco e legibilidade aos cards de upgrade
    const dimGfx = this.add.graphics();
    dimGfx.fillStyle(0x120b08, 0.35);
    dimGfx.fillRect(-1000, -512, 2000, 1024);
    this.rootContainer.add(dimGfx);

    // 3. Efeito suave de luz âmbar pulsante nas lanternas originais do Saloon
    if (!this.textures.exists('saloon_lantern_glow')) {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(255, 235, 120, 0.85)');
      grad.addColorStop(0.35, 'rgba(255, 170, 30, 0.45)');
      grad.addColorStop(0.7, 'rgba(255, 100, 10, 0.15)');
      grad.addColorStop(1, 'rgba(255, 80, 0, 0.0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
      this.textures.addCanvas('saloon_lantern_glow', canvas);
    }

    const lanterns = [
      { x: -440, y: -255, scale: 1.8 }, // Lanterna principal esquerda
      { x: 495, y: -270, scale: 1.8 },  // Lanterna principal direita
      { x: -285, y: -160, scale: 1.1 }, // Lanterna secundária porta esquerda
      { x: 265, y: -160, scale: 1.1 },  // Lanterna secundária porta direita
    ];

    lanterns.forEach((coord, i) => {
      const glow = this.add.image(coord.x, coord.y, 'saloon_lantern_glow');
      glow.setScale(coord.scale);
      glow.setBlendMode(Phaser.BlendModes.ADD);
      glow.setAlpha(0.65);
      this.rootContainer.add(glow);

      this.tweens.add({
        targets: glow,
        alpha: { from: 0.4, to: 0.85 },
        scaleX: { from: coord.scale * 0.95, to: coord.scale * 1.08 },
        scaleY: { from: coord.scale * 0.95, to: coord.scale * 1.08 },
        duration: 220 + i * 80,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });
  }

  // -------------------------------------------------------------
  // TOP HUD: Portrait, Level, HP Bar, Gold, Skull Kills (Fiel à Referência)
  // -------------------------------------------------------------
  private createTopHUD() {
    const hudContainer = this.add.container(0, -450);

    // --- LEFT: Hero Avatar Box com Moldura de Ouro e Rebites ---
    const charId = this.character?.id || 'steve';
    hudContainer.add(heroPortrait(this, -635, 0, charId));

    // "LV. 12" em amarelo arcade acima da barra
    const lvlText = this.add.text(-565, -38, `LV. ${this.playerLevel}`, {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '18px',
      color: '#ffe066',
      stroke: '#000000',
      strokeThickness: 4,
    });
    hudContainer.add(lvlText);

    // Barra de Vida com Moldura de Madeira e Borda Dourada
    const barW = 240;
    const barH = 26;
    const barX = -565;
    const barY = -12;

    const hpGfx = this.add.graphics();
    // Fundo escuro
    hpGfx.fillStyle(0x180b06, 1);
    hpGfx.fillRoundedRect(barX, barY, barW, barH, 4);
    // Moldura dourada / madeira
    hpGfx.lineStyle(3, 0xf5d6a1, 1);
    hpGfx.strokeRoundedRect(barX, barY, barW, barH, 4);

    // Preenchimento vermelho vibrante com highlight superior
    const hpPct = Phaser.Math.Clamp(this.hp / Math.max(1, this.maxHp), 0, 1);
    const fillW = Math.max(0, (barW - 6) * hpPct);
    if (fillW > 0) {
      hpGfx.fillStyle(0xd91414, 1);
      hpGfx.fillRect(barX + 3, barY + 3, fillW, barH - 6);
      // Brilho superior
      hpGfx.fillStyle(0xff6b6b, 0.6);
      hpGfx.fillRect(barX + 3, barY + 3, fillW, 4);
    }
    hudContainer.add(hpGfx);

    // Texto de HP "100 / 100" em branco com contorno preto abaixo da barra
    const hpText = this.add.text(barX + 4, barY + barH + 6, `${this.hp} / ${this.maxHp}`, {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '13px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    hudContainer.add(hpText);

    // --- RIGHT: Gold & Kills Plaque ---
    // Placa de fundo de madeira escura
    const statsBg = this.add.graphics();
    statsBg.fillStyle(0x1a0d06, 0.85);
    statsBg.fillRoundedRect(440, -44, 250, 78, 8);
    statsBg.lineStyle(2, 0x48240f, 1);
    statsBg.strokeRoundedRect(440, -44, 250, 78, 8);
    hudContainer.add(statsBg);

    // 1. Linha da Moeda / Gold
    if (this.textures.exists('hud_coin_icon')) {
      const coinImg = this.add.image(468, -24, 'hud_coin_icon').setDisplaySize(30, 30);
      hudContainer.add(coinImg);
    }
    const goldFormatted = `$${String(this.gold).padStart(6, '0')}`;
    const goldText = this.add.text(495, -31, goldFormatted, {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '16px',
      color: '#ffe066',
      stroke: '#000000',
      strokeThickness: 4,
    });
    hudContainer.add(goldText);

    // 2. Linha da Caveira / Kills
    if (this.textures.exists('hud_skull_icon')) {
      const skullImg = this.add.image(468, 12, 'hud_skull_icon').setDisplaySize(26, 28);
      hudContainer.add(skullImg);
    }
    const killsFormatted = String(this.kills).padStart(4, '0');
    const killsText = this.add.text(495, 4, killsFormatted, {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
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

    headerContainer.add(pulpSurface(this, 0, -435, 630, 130, 'paper'));
    const title = this.add.text(0, -435, this.draftData.title??'LEVEL UP!', {
      fontFamily: THEME.typography.westernFont, fontSize: '46px', color: '#a51e16',
    }).setOrigin(0.5);
    headerContainer.add(title);
    pulpText(this, headerContainer, 0, -330, 'CHOOSE YOUR BOUNTY', 26);

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
      const cardKey = choice.type === 'reward' ? choice.id === 'gold_purse' ? 'card_badge' : 'card_whiskey' : `card_${choice.id}`;
      if (this.textures.exists(cardKey)) {
        const cardImg = this.add.image(0, 0, cardKey);
        cardImg.setScale(Math.min(cardW / cardImg.width, cardH / cardImg.height));
        cardContainer.add(cardImg);
      } else {
        // Fallback procedural card
        const fallbackBg = this.add.graphics();
        fallbackBg.fillStyle(0xe8c48a, 1);
        fallbackBg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8);
        fallbackBg.lineStyle(2, 0x48240f, 1);
        fallbackBg.strokeRoundedRect(-cardW / 2 + 6, -cardH / 2 + 6, cardW - 12, cardH - 12, 6);
        cardContainer.add(fallbackBg);

        const nameText = this.add.text(0, -60, choice.name, {
          fontFamily: THEME.typography.westernFont,
          fontSize: '20px',
          color: '#8b0e0e',
          align: 'center',
          wordWrap: { width: cardW - 30 },
        }).setOrigin(0.5);
        cardContainer.add(nameText);
      }

      // 3. Dynamic Aged Parchment Plate for Bonus Description (LV. 1 / New & Upgrades)
      // Sobrepõe perfeitamente a área inferior do cartaz onde havia o 'LV. 1' original impresso no PNG
      const plateW = cardW - 24; // 276px de largura
      const plateH = 126;        // 126px cobrindo de y=95 até y=221
      const plateY = cardH / 2 - plateH / 2 - 14; // Y = 158

      const plateGfx = this.add.graphics();
      // Cor de pergaminho envelhecido idêntica à do fundo do cartaz (#efbb77)
      plateGfx.fillStyle(0xefbb77, 1);
      plateGfx.fillRect(-plateW / 2, plateY - plateH / 2, plateW, plateH);
      // Borda entalhada de madeira e linha interna de xilogravura
      plateGfx.lineStyle(2, 0x3d2314, 1);
      plateGfx.strokeRect(-plateW / 2, plateY - plateH / 2, plateW, plateH);
      plateGfx.lineStyle(1, 0x8c531d, 0.7);
      plateGfx.strokeRect(-plateW / 2 + 3, plateY - plateH / 2 + 3, plateW - 6, plateH - 6);
      cardContainer.add(plateGfx);

      // Level badge dinâmico: mostra o nível que o jogador obterá (ex: ★ LV. 1 ★ ou ★ LV. 2 ★)
      const lvlBadge = this.add.text(0, plateY - 38, `★ LV. ${choice.nextLevel} ★`, {
        fontFamily: THEME.typography.westernFont,
        fontSize: '14px',
        color: '#1a0d00',
        stroke: '#78350f',
        strokeThickness: 1,
        backgroundColor: '#db9d58',
        padding: { left: 10, right: 10, top: 2, bottom: 2 },
      }).setOrigin(0.5);
      cardContainer.add(lvlBadge);

      // Texto com a descrição do bônus oferecido (nítido, legível e com peso)
      const descText = this.add.text(0, plateY + 12, choice.description, {
        fontFamily: THEME.typography.narrativeFont,
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#21130b',
        align: 'center',
        lineSpacing: 3,
        wordWrap: { width: plateW - 24 },
      }).setOrigin(0.5);
      // Garante nitidez máxima no canvas escalado
      descText.setResolution(2);
      cardContainer.add(descText);

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
        fontFamily: THEME.typography.pixelFont,
        fontSize: '10px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5);
      cardContainer.add(ribbonText);

      // 5. Selected Card Golden Fiery Glowing Frame (Fiel à Referência da Imagem)
      // O contorno dourado brilhante e flamejante envolve o card inteiro e desce abraçando o botão [ CHOOSE ]
      const glowGraphics = this.add.graphics();
      const gw = cardW + 12;
      const gh = cardH + 12;
      const btnExtraH = 68; // Desce para envolver o botão inferior

      // Camada 1: Halo externo suave amarelo alaranjado
      glowGraphics.lineStyle(8, 0xff791c, 0.4);
      glowGraphics.strokeRoundedRect(-gw / 2 - 4, -gh / 2 - 4, gw + 8, gh + btnExtraH + 8, 12);

      // Camada 2: Contorno médio dourado vivo
      glowGraphics.lineStyle(4, 0xffc52a, 0.95);
      glowGraphics.strokeRoundedRect(-gw / 2, -gh / 2, gw, gh + btnExtraH, 10);

      // Camada 3: Linha interna de brilho amarelo claro elétrico
      glowGraphics.lineStyle(2, 0xfff3a0, 0.9);
      glowGraphics.strokeRoundedRect(-gw / 2 + 2, -gh / 2 + 2, gw - 4, gh + btnExtraH - 4, 8);

      glowGraphics.setVisible(false);
      cardContainer.add(glowGraphics);
      this.cardGlows.push(glowGraphics);

      // 6. Bottom Selection Button ("[ 1 ] CHOOSE")
      const btnY = cardH / 2 + 32;
      const btnKey = 'ui_btn_idle';
      const btnImg = this.add.image(0, btnY, this.textures.exists(btnKey) ? btnKey : '').setScale(0.82);
      cardContainer.add(btnImg);
      this.cardButtons.push(btnImg);

      const btnText = this.add.text(0, btnY, `[ ${idx + 1} ] CHOOSE`, {
        fontFamily: THEME.typography.pixelFont,
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
  // BOTTOM DETAILS PANEL: Hero Shooting, Specs Table & Lore Note (Fiel à Referência)
  // -------------------------------------------------------------
  private createBottomDetailsPanel() {
    // Painel posicionado em y=390 (centro inferior)
    const panelContainer = this.add.container(0, 390);

    panelContainer.add(pulpSurface(this, 40, 0, 1040, 180, 'wood'));

    // 2. HERÓI NA ESQUERDA: Posicionado do lado de fora/sobrepondo a borda esquerda da prancha
    const charId = this.character?.id || 'steve';
    const heroKey = `hero_${charId}`;

    if (this.textures.exists(heroKey)) {
      // Sombra sob as botas
      const shadowGfx = this.add.graphics();
      shadowGfx.fillStyle(0x000000, 0.5);
      shadowGfx.fillEllipse(-540, 56, 56, 16);
      panelContainer.add(shadowGfx);

      this.heroSprite = this.add.sprite(-540, 6, heroKey, 0).setScale(1.4);
      if (this.anims.exists(`${charId}_run`)) {
        this.heroSprite.play(`${charId}_run`);
      }
      panelContainer.add(this.heroSprite);

      // Muzzle Flash na arma do herói
      const flashGfx = this.add.graphics();
      flashGfx.fillStyle(0xffc52a, 0.9);
      flashGfx.fillTriangle(-505, -12, -485, -20, -485, -4);
      flashGfx.fillStyle(0xffffff, 0.95);
      flashGfx.fillTriangle(-505, -12, -490, -16, -490, -8);
      panelContainer.add(flashGfx);

      this.tweens.add({
        targets: flashGfx,
        alpha: { from: 0.2, to: 1.0 },
        scaleX: { from: 0.9, to: 1.15 },
        duration: 80,
        yoyo: true,
        repeat: -1,
      });
    }

    // 3. CENTRO: Nome do Item em Dourado Arcade
    this.detailTitleText = this.add.text(-440, -62, '', {
      fontFamily: THEME.typography.westernFont,
      fontSize: '26px',
      color: '#ffe066',
      stroke: '#000000',
      strokeThickness: 3,
    });
    panelContainer.add(this.detailTitleText);

    // Tabela de Atributos com alinhamento pixel perfeito
    this.detailStatsText = this.add.text(-440, -32, '', {
      fontFamily: THEME.typography.narrativeFont,
      fontSize: '18px',
      color: '#f2d49a',
      lineSpacing: 4, wordWrap: { width: 620 },
    });
    panelContainer.add(this.detailStatsText);

    panelContainer.add(pulpSurface(this, 410, 0, 275, 150, 'paper'));

    // Texto de Lore e Estrela sobre o pergaminho
    this.detailTaglineText = this.add.text(410, -20, 'Two guns.\nOne legend.', {
      fontFamily: THEME.typography.narrativeFont,
      fontSize: '22px',
      color: '#1a0d04',
      align: 'left',
      lineSpacing: 6,
    }).setOrigin(0.5);
    panelContainer.add(this.detailTaglineText);

    const starIcon = this.add.text(410, 48, '★', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '14px',
      color: '#1a0d04',
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
          `${lore.typeLabel} • DAMAGE ${lvl.damage} • COOLDOWN ${lvl.cooldownMs} ms`,
          `PROJECTILES ${lvl.projectileCount} • PIERCE ${lvl.pierce}`,
          lvl.description,
        ].join('\n'));
      } else {
        this.detailStatsText.setText(`Description : ${choice.description}`);
      }
    } else {
      // Passive buff
      this.detailStatsText.setText([
        `${lore.typeLabel} • RANK ${choice.nextLevel}`,
        choice.description,
      ].join('\n'));
    }
  }

  // -------------------------------------------------------------
  // CONTROLS: 1, 2, 3, Arrows, A/D, Enter, Space
  // -------------------------------------------------------------
  private rerollDraft(){
    if(this.hasSelected||(this.draftData.rerollsRemaining??0)<=0)return;
    const result=this.draftData.onReroll?.();if(!result)return;
    this.hasSelected=true;sounds.playShuffle();
    this.scene.restart({...this.draftData,choices:result.choices,rerollsRemaining:result.remaining});
  }

  private setupControls() {
    const handleKey = (event: KeyboardEvent) => {
      if (this.hasSelected || event.repeat) return;

      if(event.key.toLowerCase()==='r'){this.rerollDraft();return;}
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
    };
    this.input.keyboard?.on('keydown', handleKey);
    this.events.once('shutdown', () => this.input.keyboard?.off('keydown', handleKey));
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
