import { BankHUD } from '../ui/hud/BankHUD';
import { developerEnabled } from '../dev/access';
import { bindPulpKeys } from '../ui/layout/pulpSceneKit';
import { CATALOG, preloadHeroSheets, preloadImages } from '../assets/registry';
import { createMenuRoot, menuBackdropScale } from '../ui/layout/menuLayout';
import Phaser from 'phaser';
import { difficultySettings } from '../data/difficulty';
import { sounds } from '../audio/SoundManager';
import { THEME } from '../ui/theme/tokens';
import { SpriteGenerator } from '../utils/SpriteGenerator';
import { WesternButton } from '../ui/components/WesternButton';
import { preloadPixellabHeroes } from '../systems/PixellabHeroes';
import { preloadGreedwell } from '../systems/GreedwellSprites';
import { preloadSurfaces, pulpSurface } from '../ui/components/PulpSurface';
import { getLocale, toggleLocale, t } from '../i18n';

export class TitleScene extends Phaser.Scene {
  private rootContainer!: Phaser.GameObjects.Container;
  private isAdvancing: boolean = false;

  // Visual layers & objects
  private bkgImage!: Phaser.GameObjects.Image;
  private logoImage!: Phaser.GameObjects.Image;
  private playersGroupImage!: Phaser.GameObjects.Image;
  private playersShadowGraphics!: Phaser.GameObjects.Graphics;
  private startBtnContainer!: Phaser.GameObjects.Container;
  private startBtnBorderGlow!: Phaser.GameObjects.Graphics;
  private lanternGlows: Phaser.GameObjects.Image[] = [];
  private sunGlowGraphics!: Phaser.GameObjects.Graphics;
  public langButton?: any;
  private menuButton?: WesternButton;
  private storeButton?: WesternButton;
  private startBtnText?: Phaser.GameObjects.Text;
  private startBtnSubText?: Phaser.GameObjects.Text;
  private copyrightText?: Phaser.GameObjects.Text;

  constructor() {
    super('TitleScene');
  }

  preload() {
    preloadSurfaces(this);
    preloadImages(this, CATALOG.titleImages);
    preloadHeroSheets(this);
    preloadPixellabHeroes(this);
    preloadGreedwell(this);
  }

  create() {
    this.isAdvancing = false;
    this.lanternGlows = [];

    // Generate procedural pixel textures for game
    SpriteGenerator.generateAll(this);

    // Register 32-bit hero animations
    ['steve', 'billy', 'bob', 'cormano'].forEach((hero) => {
      if (this.textures.exists(`hero_${hero}`) && !this.anims.exists(`${hero}_run`)) {
        this.anims.create({
          key: `${hero}_run`,
          frames: this.anims.generateFrameNumbers(`hero_${hero}`, { start: 0, end: -1 }),
          frameRate: 7,
          repeat: -1,
        });
      }
    });

    const { width, height } = this.scale;

    // 1. Dark Screen Background
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0503, 1);
    bg.fillRect(0, 0, width, height);

    // 2. Reference Resolution Root Container (1536 x 1024)

    this.rootContainer = createMenuRoot(this);

    // 3. Assemble the Layers of WESTERN PULP '98 Intro
    this.createBackgroundAndAtmosphere();
    this.createPlayersGroup();
    this.createLogotype();
    this.createStartButton();
    this.createAuxiliaryMenu();
    this.createLanguageSelector();
    this.createArcadeHUD();
    this.createAmbientEffects();

    // 4. Start Intro Music immediately as game opens
    sounds.playIntroMusic();
    const unlockAudio = () => {
      sounds.playIntroMusic();
    };
    this.input.once('pointerdown', unlockAudio);
    this.input.keyboard?.once('keydown', unlockAudio);

    // 5. Input & Sound Controls
    this.setupInputs();

    // 6. Run the 3-Second Opening Sequence
    this.playCinematicOpening();

    // 7. Handle Window Resizing

  }

  // -------------------------------------------------------------
  // LAYER 1: CINEMATIC WESTERN SUNSET BACKGROUND & LANTERNS
  // -------------------------------------------------------------
  private createBackgroundAndAtmosphere() {
    // 1. Background image (sunsetsurvivors_bkg.png)
    const bkgKey = this.textures.exists('intro_bkg') ? 'intro_bkg' : 'intro_landscape';
    this.bkgImage = this.add.image(0, 0, bkgKey);
    this.bkgImage.setScale(menuBackdropScale(this.scale.width, this.scale.height, this.bkgImage.width, this.bkgImage.height));
    this.rootContainer.add(this.bkgImage);

    // 2. Sun Pulsating Radial Glow (Central Sunset Horizon x=0, y=10)
    this.sunGlowGraphics = this.add.graphics();
    this.sunGlowGraphics.fillStyle(0xffc52a, 0.22);
    this.sunGlowGraphics.fillCircle(0, 8, 180);
    this.sunGlowGraphics.fillStyle(0xff791c, 0.12);
    this.sunGlowGraphics.fillCircle(0, 8, 260);
    this.rootContainer.add(this.sunGlowGraphics);

    this.tweens.add({
      targets: this.sunGlowGraphics,
      alpha: 0.45,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 3. Smooth amber radial gradient texture for gas lanterns
    if (!this.textures.exists('lantern_radial_glow')) {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(255, 235, 120, 0.90)');
      grad.addColorStop(0.35, 'rgba(255, 170, 30, 0.50)');
      grad.addColorStop(0.7, 'rgba(255, 100, 10, 0.18)');
      grad.addColorStop(1, 'rgba(255, 80, 0, 0.0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
      this.textures.addCanvas('lantern_radial_glow', canvas);
    }

    // Warm amber flickering halos on the saloon lanterns
    // Em sunsetsurvivors_bkg (1536x1024):
    // Lanterna esquerda: x = -685, y = -285
    // Lanterna direita:  x = 680, y = -295
    const lanternCoords = [
      { x: -685, y: -285, scale: 2.1 },
      { x: 680, y: -295, scale: 2.1 },
    ];

    lanternCoords.forEach((coord, i) => {
      const glow = this.add.image(coord.x, coord.y, 'lantern_radial_glow');
      glow.setScale(coord.scale);
      glow.setBlendMode(Phaser.BlendModes.ADD);
      glow.setAlpha(0.7);
      this.rootContainer.add(glow);
      this.lanternGlows.push(glow);

      this.tweens.add({
        targets: glow,
        alpha: { from: 0.45, to: 0.95 },
        scaleX: { from: coord.scale * 0.95, to: coord.scale * 1.08 },
        scaleY: { from: coord.scale * 0.95, to: coord.scale * 1.08 },
        duration: 180 + i * 80,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });
  }

  // -------------------------------------------------------------
  // LAYER 2: THE FOUR PROTAGONISTS GROUP (players.png)
  // Steve (Rosa/Colts), Billy (Azul/Colts), Bob (Verde/Winchester), Cormano (Poncho/Shotgun)
  // -------------------------------------------------------------
  private createPlayersGroup() {
    const playersKey = 'intro_players_group';
    
    // Dimensões originais de players.png: 2172 x 724
    // Redução de 50% => escala base de 0.5 (largura efetiva 1086px x 362px)
    const baseScale = 0.5;
    const targetY = 120;
    const pH = 724 * baseScale; // 362px

    // Sombra suave sob as botas no solo do deserto
    this.playersShadowGraphics = this.add.graphics();
    this.playersShadowGraphics.fillStyle(0x000000, 0.55);
    this.playersShadowGraphics.fillEllipse(-330, targetY + pH / 2 - 12, 180, 26);
    this.playersShadowGraphics.fillEllipse(-115, targetY + pH / 2 - 12, 190, 26);
    this.playersShadowGraphics.fillEllipse(115, targetY + pH / 2 - 12, 190, 26);
    this.playersShadowGraphics.fillEllipse(335, targetY + pH / 2 - 12, 190, 26);
    this.playersShadowGraphics.setAlpha(0);
    this.rootContainer.add(this.playersShadowGraphics);

    this.playersGroupImage = this.add.image(0, targetY, playersKey);
    this.playersGroupImage.setScale(baseScale);
    this.playersGroupImage.setAlpha(0);
    this.rootContainer.add(this.playersGroupImage);

    // Idle breathing / ready sway suave dos pistoleiros mantendo a escala
    this.tweens.add({
      targets: this.playersGroupImage,
      y: targetY - 3,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // -------------------------------------------------------------
  // LAYER 3: SUNSET SURVIVORS MAIN LOGO WITH STEER SKULL
  // -------------------------------------------------------------
  private createLogotype() {
    const logoKey = this.textures.exists('intro_logo_new') ? 'intro_logo_new' : 'intro_logo';
    // Dimensões reduzidas em 30% a pedido do usuário (largura 952px, altura 317px)
    // Proporção 3:1 de Logo_Western_Sunset_Survivors.png
    const logoW = 952;
    const logoH = 317;

    this.logoImage = this.add.image(0, -600, logoKey);
    this.logoImage.setDisplaySize(logoW, logoH);
    this.logoImage.setAlpha(0);
    this.rootContainer.add(this.logoImage);
  }

  // -------------------------------------------------------------
  // LAYER 6: PRESS START BUTTON PARCHMENT PLAQUE
  // -------------------------------------------------------------
  private createStartButton() {
    const btnW = 660;
    const btnH = 150;
    const btnY = 285;

    this.startBtnContainer = this.add.container(0, btnY);
    this.startBtnContainer.setAlpha(0);

    // Dark wood base plaque
    const darkWood = pulpSurface(this, 0, 0, btnW, btnH, 'wood');
    this.startBtnContainer.add(darkWood);

    // Inner dark carved plate
    const innerPlate = this.add.graphics();
    innerPlate.fillStyle(0x180b05, 0.92);
    innerPlate.fillRoundedRect(-btnW / 2 + 10, -btnH / 2 + 10, btnW - 20, btnH - 20, 10);
    this.startBtnContainer.add(innerPlate);

    // Borda brilhante arcade pulsante
    this.startBtnBorderGlow = this.add.graphics();
    const borderRadius = 14;
    // Borda dourada brilhante
    this.startBtnBorderGlow.lineStyle(4, 0xffc52a, 0.95);
    this.startBtnBorderGlow.strokeRoundedRect(-btnW / 2 + 6, -btnH / 2 + 6, btnW - 12, btnH - 12, borderRadius);
    // Borda interna âmbar de acabamento
    this.startBtnBorderGlow.lineStyle(2, 0xff791c, 0.7);
    this.startBtnBorderGlow.strokeRoundedRect(-btnW / 2 + 10, -btnH / 2 + 10, btnW - 20, btnH - 20, borderRadius - 3);
    this.startBtnBorderGlow.setAlpha(0.3);
    this.startBtnContainer.add(this.startBtnBorderGlow);

    // Localized typography: PRESS START / PRESSIONE START
    this.startBtnText = this.add.text(0, -10, t('menu.pressStart'), {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '28px',
      color: '#ffe066',
      stroke: '#120b08',
      strokeThickness: 5,
    }).setOrigin(0.5);
    this.startBtnContainer.add(this.startBtnText);

    this.startBtnSubText = this.add.text(0, 32, t('menu.pressStartSub'), {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '12px',
      color: '#f2d49a',
      stroke: '#120b08',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.startBtnContainer.add(this.startBtnSubText);

    // Pulso suave e elegante da borda brilhante
    this.tweens.add({
      targets: this.startBtnBorderGlow,
      alpha: 1.0,
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Interactive Hit Zone
    const hitZone = this.add.zone(0, 0, btnW, btnH).setInteractive({ useHandCursor: true });
    hitZone.on('pointerover', () => {
      this.startBtnContainer.setScale(1.03);
      this.startBtnBorderGlow.setAlpha(1.0);
    });
    hitZone.on('pointerout', () => {
      this.startBtnContainer.setScale(1.0);
      this.startBtnBorderGlow.setAlpha(0.4);
    });
    hitZone.on('pointerdown', () => {
      this.advanceToGame();
    });
    this.startBtnContainer.add(hitZone);

    this.rootContainer.add(this.startBtnContainer);
  }

  // -------------------------------------------------------------
  // LAYER 7: ARCADE TOP HUD & COPYRIGHT CREDITS
  // -------------------------------------------------------------
  private createArcadeHUD() {
    const hudStyle = {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '15px',
      color: '#ffe066',
      stroke: '#000000',
      strokeThickness: 4,
    };

    // Left: 1UP Score
    const p1 = this.add.text(-680, -480, '1UP    $000000', hudStyle);
    this.rootContainer.add(p1);

    // Persistent bank shows the remaining balance every time the player returns.
    new BankHUD(this, this.rootContainer);

    // Right: CREDIT
    const cr = this.add.text(680, -480, 'CREDIT   04', hudStyle).setOrigin(1, 0);
    this.rootContainer.add(cr);

    // Bottom Copyright / Project info
    this.copyrightText = this.add.text(0, 484, t('common.copyright'), {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '10px',
      color: '#f2d49a',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.rootContainer.add(this.copyrightText);
  }

  public createLanguageSelector() {
    SpriteGenerator.createFlagTextures(this);

    const container = this.add.container(565, -430) as any;
    const w = 216;
    const h = 54;

    // Plaque Background
    const plaque = this.add.graphics();
    plaque.fillStyle(0x000000, 0.45);
    plaque.fillRoundedRect(-w / 2 + 2, -h / 2 + 3, w, h, 8);
    plaque.fillStyle(0x23140a, 1);
    plaque.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    plaque.lineStyle(2, 0x8a5d10, 0.85);
    plaque.strokeRoundedRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 7);
    plaque.lineStyle(1.5, 0xffc52a, 0.95);
    plaque.strokeRoundedRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 5);

    // Corner brass rivets
    const rivets = [
      { x: -w / 2 + 9, y: -h / 2 + 9 },
      { x: w / 2 - 9, y: -h / 2 + 9 },
      { x: -w / 2 + 9, y: h / 2 - 9 },
      { x: w / 2 - 9, y: h / 2 - 9 },
    ];
    rivets.forEach(r => {
      plaque.fillStyle(0xffc52a, 1);
      plaque.fillCircle(r.x, r.y, 2.5);
      plaque.fillStyle(0x120b08, 1);
      plaque.fillCircle(r.x, r.y, 1);
    });

    // Center divider
    plaque.lineStyle(1.5, 0x5a341a, 0.9);
    plaque.lineBetween(0, -18, 0, 18);
    plaque.lineStyle(1, 0xffc52a, 0.4);
    plaque.lineBetween(1, -18, 1, 18);
    container.add(plaque);

    // 1. Brazil Flag Item (Left)
    const brGroup = this.add.container(-52, 0);
    const brGlow = this.add.graphics();
    brGroup.add(brGlow);

    let brFlag: Phaser.GameObjects.GameObject;
    if (this.textures.exists('flag_br')) {
      brFlag = this.add.image(0, -3, 'flag_br').setDisplaySize(42, 28);
    } else {
      const g = this.add.graphics();
      this.drawVectorFlagBR(g, 0, -3, 42, 28);
      brFlag = g;
    }
    brGroup.add(brFlag);

    const brLabel = this.add.text(0, 16, 'PT-BR', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '9px',
      color: '#ffc52a',
      stroke: '#120b08',
      strokeThickness: 2,
    }).setOrigin(0.5);
    brGroup.add(brLabel);

    const brHit = this.add.zone(0, 0, 96, 48).setInteractive({ useHandCursor: true });
    brHit.on('pointerdown', (_p: unknown, _x: unknown, _y: unknown, event: any) => {
      event?.stopPropagation?.();
      if (getLocale() !== 'pt') this.toggleLanguage();
    });
    brGroup.add(brHit);
    container.add(brGroup);

    // 2. USA Flag Item (Right)
    const usGroup = this.add.container(52, 0);
    const usGlow = this.add.graphics();
    usGroup.add(usGlow);

    let usFlag: Phaser.GameObjects.GameObject;
    if (this.textures.exists('flag_us')) {
      usFlag = this.add.image(0, -3, 'flag_us').setDisplaySize(42, 28);
    } else {
      const g = this.add.graphics();
      this.drawVectorFlagUS(g, 0, -3, 42, 28);
      usFlag = g;
    }
    usGroup.add(usFlag);

    const usLabel = this.add.text(0, 16, 'EN', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '9px',
      color: '#f2d49a',
      stroke: '#120b08',
      strokeThickness: 2,
    }).setOrigin(0.5);
    usGroup.add(usLabel);

    const usHit = this.add.zone(0, 0, 96, 48).setInteractive({ useHandCursor: true });
    usHit.on('pointerdown', (_p: unknown, _x: unknown, _y: unknown, event: any) => {
      event?.stopPropagation?.();
      if (getLocale() !== 'en') this.toggleLanguage();
    });
    usGroup.add(usHit);
    container.add(usGroup);

    const refreshFlags = () => {
      const isPT = getLocale() === 'pt';

      // Brazil highlight
      brGlow.clear();
      if (isPT) {
        brGlow.lineStyle(3, 0xffc52a, 1);
        brGlow.strokeRoundedRect(-24, -19, 48, 32, 4);
        brGlow.lineStyle(1.5, 0xff791c, 0.8);
        brGlow.strokeRoundedRect(-26, -21, 52, 36, 6);
        brGroup.setScale(1.05);
        brGroup.setAlpha(1.0);
        brLabel.setColor('#ffe066');
      } else {
        brGroup.setScale(0.96);
        brGroup.setAlpha(0.48);
        brLabel.setColor('#a89078');
      }

      // USA highlight
      usGlow.clear();
      if (!isPT) {
        usGlow.lineStyle(3, 0xffc52a, 1);
        usGlow.strokeRoundedRect(-24, -19, 48, 32, 4);
        usGlow.lineStyle(1.5, 0xff791c, 0.8);
        usGlow.strokeRoundedRect(-26, -21, 52, 36, 6);
        usGroup.setScale(1.05);
        usGroup.setAlpha(1.0);
        usLabel.setColor('#ffe066');
      } else {
        usGroup.setScale(0.96);
        usGroup.setAlpha(0.48);
        usLabel.setColor('#a89078');
      }
    };

    container.getText = () => (getLocale() === 'pt' ? 'IDIOMA: PT-BR' : 'LANG: EN');
    container.setText = (_text: string) => refreshFlags();
    container.refresh = () => refreshFlags();

    refreshFlags();

    this.langButton = container;
    this.rootContainer.add(container);
  }

  private drawVectorFlagBR(g: Phaser.GameObjects.Graphics, cx: number, cy: number, w: number, h: number): void {
    g.clear();
    g.fillStyle(0x00843d, 1);
    g.fillRect(cx - w / 2, cy - h / 2, w, h);
    g.fillStyle(0xffcc00, 1);
    g.beginPath();
    g.moveTo(cx, cy - h / 2 + 3);
    g.lineTo(cx + w / 2 - 3, cy);
    g.lineTo(cx, cy + h / 2 - 3);
    g.lineTo(cx - w / 2 + 3, cy);
    g.closePath();
    g.fill();
    g.fillStyle(0x002776, 1);
    g.fillCircle(cx, cy, 6);
    g.lineStyle(1.5, 0xffffff, 1);
    g.strokeCircle(cx, cy + 2, 6);
  }

  private drawVectorFlagUS(g: Phaser.GameObjects.Graphics, cx: number, cy: number, w: number, h: number): void {
    g.clear();
    const sh = h / 7;
    for (let i = 0; i < 7; i++) {
      g.fillStyle(i % 2 === 0 ? 0xb22234 : 0xffffff, 1);
      g.fillRect(cx - w / 2, cy - h / 2 + i * sh, w, sh);
    }
    g.fillStyle(0x3c3b6e, 1);
    g.fillRect(cx - w / 2, cy - h / 2, w * 0.48, h * 0.58);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - w / 2 + 5, cy - h / 2 + 4, 1.2);
    g.fillCircle(cx - w / 2 + 11, cy - h / 2 + 4, 1.2);
    g.fillCircle(cx - w / 2 + 8, cy - h / 2 + 8, 1.2);
    g.fillCircle(cx - w / 2 + 14, cy - h / 2 + 8, 1.2);
    g.fillCircle(cx - w / 2 + 5, cy - h / 2 + 12, 1.2);
    g.fillCircle(cx - w / 2 + 11, cy - h / 2 + 12, 1.2);
  }

  public toggleLanguage() {
    const next = toggleLocale();
    sounds.playCoin();
    this.cameras.main.flash(70, 255, 197, 42, false);
    if (this.langButton?.refresh) {
      this.langButton.refresh();
    } else if (this.langButton?.setText) {
      this.langButton.setText(next === 'pt' ? 'IDIOMA: PT-BR' : 'LANG: EN');
    }
    if (this.menuButton) {
      this.menuButton.setText(t('common.menu'));
    }
    if (this.storeButton) {
      this.storeButton.setText(t('common.store'));
    }
    if (this.startBtnText) {
      this.startBtnText.setText(t('menu.pressStart'));
    }
    if (this.startBtnSubText) {
      this.startBtnSubText.setText(t('menu.pressStartSub'));
    }
    if (this.copyrightText) {
      this.copyrightText.setText(t('common.copyright'));
    }
  }

  // -------------------------------------------------------------
  // MODAL DE OPÇÕES DE ÁUDIO (SLIDERS DESLIZANTES PARA BGM & SFX)
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // LAYER 8: AMBIENT PARTICLES (Dust Specks & Saloon Smoke)
  // -------------------------------------------------------------
  private createAmbientEffects() {
    // Chimney smoke particles from the saloon on the right (x=530, y=-40)
    for (let i = 0; i < 4; i++) {
      const puff = this.add.graphics();
      puff.fillStyle(0x704030, 0.25);
      puff.fillCircle(0, 0, 8 + i * 3);
      puff.setPosition(525 + i * 2, -45);
      this.rootContainer.add(puff);

      this.tweens.add({
        targets: puff,
        y: puff.y - 65,
        x: puff.x + 25,
        alpha: 0,
        scaleX: 2.2,
        scaleY: 2.2,
        duration: 2200 + i * 400,
        repeat: -1,
        delay: i * 450,
      });
    }

    // Drifting desert dust particles across the screen
    for (let i = 0; i < 18; i++) {
      const speck = this.add.graphics();
      speck.fillStyle(0xf5d6a1, Phaser.Math.FloatBetween(0.2, 0.6));
      speck.fillCircle(0, 0, Phaser.Math.Between(2, 4));
      speck.setPosition(Phaser.Math.Between(-700, 700), Phaser.Math.Between(200, 450));
      this.rootContainer.add(speck);

      this.tweens.add({
        targets: speck,
        x: speck.x + Phaser.Math.Between(250, 450),
        y: speck.y - Phaser.Math.Between(10, 40),
        alpha: 0,
        duration: Phaser.Math.Between(3000, 5500),
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000),
      });
    }
  }

  // -------------------------------------------------------------
  // 3-SECOND CINEMATIC OPENING TIMELINE
  // -------------------------------------------------------------
  private playCinematicOpening() {
    // 0.0 - 0.5s: Scene fades in from black
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // 0.5 - 1.2s: Huge SUNSET SURVIVORS logo swoops down with scale and impact
    this.time.delayedCall(500, () => {
      if (this.isAdvancing) return;
      this.logoImage.setAlpha(1);
      this.tweens.add({
        targets: this.logoImage,
        y: -290,
        duration: 650,
        ease: 'Back.easeOut',
        onComplete: () => {
          // Screen impact shake on landing
          this.cameras.main.shake(120, 0.007);
        },
      });
    });

    // 1.2 - 1.9s: The four heroes band steps forward into the sunset
    this.time.delayedCall(1200, () => {
      if (this.isAdvancing) return;
      this.playersShadowGraphics.setAlpha(0.55);
      this.tweens.add({
        targets: this.playersGroupImage,
        alpha: 1,
        scaleX: { from: 0.54, to: 0.5 },
        scaleY: { from: 0.54, to: 0.5 },
        duration: 450,
        ease: 'Power2.easeOut',
      });
    });

    // 2.0 - 2.8s: PRESS START button bounces into view
    this.time.delayedCall(2000, () => {
      if (this.isAdvancing) return;
      this.startBtnContainer.setAlpha(1);
      this.tweens.add({
        targets: this.startBtnContainer,
        y: { from: 480, to: 285 },
        scaleX: { from: 0.8, to: 1.0 },
        scaleY: { from: 0.8, to: 1.0 },
        duration: 600,
        ease: 'Bounce.easeOut',
      });
    });
  }

  private createAuxiliaryMenu() {
    this.menuButton = new WesternButton(this, {
      x: -190, y: 420, width: 340, height: 62, presentation: 'pulp', text: t('common.menu'),
      variant: 'wood', fontSize: '27px', onClick: () => this.openMainMenu(),
    });
    this.storeButton = new WesternButton(this, {
      x: 190, y: 420, width: 340, height: 62, presentation: 'pulp', text: t('common.store'),
      variant: 'wood', fontSize: '27px', onClick: () => this.openStore(),
    });
    this.rootContainer.add([this.menuButton, this.storeButton]);
  }

  private openMainMenu() {
    if (this.isAdvancing) return;
    sounds.playRevolver();
    this.scene.pause('TitleScene'); this.scene.launch('MenuScene', { fromScene: 'TitleScene' });
  }

  private openStore() {
    if (this.isAdvancing) return;
    sounds.playRevolver();
    this.scene.pause('TitleScene');
    this.scene.launch('StoreScene', { fromScene: 'TitleScene', priceMultiplier: 1 });
  }

  private openDeveloper(): void {
    if (!developerEnabled() || this.isAdvancing) return;
    this.isAdvancing = true; sounds.playRevolver(); this.cameras.main.flash(70, 255, 197, 42, false);
    this.scene.start('DeveloperScene');
  }

  // -------------------------------------------------------------
  // INPUT HANDLING & INSTANT SKIP
  // -------------------------------------------------------------
  private setupInputs() {
    bindPulpKeys(this, {
      SPACE: () => this.advanceToGame(),
      ENTER: () => this.advanceToGame(),
      ESC: () => this.openMainMenu(),
      F2: () => this.openDeveloper(),
      M: () => this.openMainMenu(),
      S: () => this.openStore(),
      L: () => this.toggleLanguage(),
    });
  }

  private advanceToGame() {
    if (this.isAdvancing) return;
    this.isAdvancing = true;

    // Immediately snap visual elements in case intro sequence was running
    if (this.logoImage) {
      this.logoImage.setAlpha(1).setY(-290);
    }
    if (this.playersGroupImage) {
      this.playersGroupImage.setAlpha(1);
    }
    if (this.playersShadowGraphics) {
      this.playersShadowGraphics.setAlpha(0.55);
    }
    if (this.startBtnContainer) {
      this.startBtnContainer.setAlpha(1).setY(285);
    }

    // 1. Disparo de revólver
    sounds.playRevolver();

    // 2. Som mecânico de recarga do tambor
    this.time.delayedCall(160, () => {
      sounds.playReload();
    });

    // 3. Trilha da introdução (Departing into the Horizon)
    sounds.playIntroMusic();

    // 4. Clarão arcade dourado & transição para a história / seleção
    this.cameras.main.flash(200, 255, 235, 170);

    // Muzzle flash on players group
    if (this.playersGroupImage) {
      this.tweens.add({
        targets: this.playersGroupImage,
        scaleX: 0.515,
        scaleY: 0.515,
        duration: 90,
        yoyo: true,
      });
    }

    this.cameras.main.fade(550, 0, 0, 0);
    this.time.delayedCall(600, () => {

      this.scene.start('CharacterSelectScene', { difficulty: difficultySettings.get() });
    });
  }

  // -------------------------------------------------------------
  // RESPONSIVE SCALING HANDLER
  // -------------------------------------------------------------
}
