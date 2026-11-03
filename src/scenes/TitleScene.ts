import { developerEnabled } from '../dev/access';
import { bindPulpKeys } from '../ui/layout/pulpSceneKit';
import { CATALOG, preloadImages } from '../assets/registry';
import { coverArtScale, createMenuRoot, menuBackdropScale } from '../ui/layout/menuLayout';
import Phaser from 'phaser';
import { difficultySettings } from '../data/difficulty';
import { sounds } from '../audio/SoundManager';
import { THEME } from '../ui/theme/tokens';
import { SpriteGenerator } from '../utils/SpriteGenerator';
import { WesternButton } from '../ui/components/WesternButton';
import { preloadSurfaces, pulpSurface } from '../ui/components/PulpSurface';
import { getLocale, toggleLocale, t } from '../i18n';

/** Key-art focal points, measured in pixels of the 1024x576 cover (title_cover.jpg). */
export const COVER_ART = {
  width: 1024, height: 576,
  lantern: { x: 88, y: 108 },
  sun: { x: 612, y: 352 },
  windows: [{ x: 42, y: 398 }, { x: 912, y: 412 }, { x: 968, y: 416 }],
  horizon: { x: 612, y: 440 },
} as const;

export class TitleScene extends Phaser.Scene {
  private rootContainer!: Phaser.GameObjects.Container;
  private isAdvancing: boolean = false;

  // Visual layers & objects: the cover is the only artwork; everything else is light, particles and controls.
  private artLayer!: Phaser.GameObjects.Container;
  private artScale = 1;
  private startBtnContainer!: Phaser.GameObjects.Container;
  private startBtnBorderGlow!: Phaser.GameObjects.Graphics;
  private lightGlows: Phaser.GameObjects.Image[] = [];
  public langButton?: any;
  private menuButton?: WesternButton;
  private storeButton?: WesternButton;
  private startBtnText?: Phaser.GameObjects.Text;
  private startBtnSubText?: Phaser.GameObjects.Text;

  constructor() {
    super('TitleScene');
  }

  preload() {
    preloadSurfaces(this);
    preloadImages(this, CATALOG.titleImages);
  }

  create() {
    this.isAdvancing = false;
    this.lightGlows = [];

    // Generate procedural pixel textures for game
    SpriteGenerator.generateAll(this);

    const { width, height } = this.scale;

    // 1. Dark Screen Background
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0503, 1);
    bg.fillRect(0, 0, width, height);

    // 2. Reference Resolution Root Container (1536 x 1024)
    this.rootContainer = createMenuRoot(this);

    // 3. Cover key art, its lighting, particles and the controls
    this.createCoverArt();
    this.createLightingAndParticles();
    this.createVignette();
    this.createStartButton();
    this.createAuxiliaryMenu();
    this.createLanguageSelector();

    // 4. Start Intro Music immediately as game opens
    sounds.playIntroMusic();
    const unlockAudio = () => {
      sounds.playIntroMusic();
    };
    this.input.once('pointerdown', unlockAudio);
    this.input.keyboard?.once('keydown', unlockAudio);

    // 5. Input & Sound Controls
    this.setupInputs();

    // 6. Opening sequence
    this.playCinematicOpening();
  }

  /** Cover pixel → menu-root coordinates. */
  private artPoint(u: number, v: number): { x: number; y: number } {
    return { x: (u - COVER_ART.width / 2) * this.artScale, y: (v - COVER_ART.height / 2) * this.artScale };
  }

  // -------------------------------------------------------------
  // LAYER 1: COVER KEY ART (single image, no other scenery/characters/logo)
  // -------------------------------------------------------------
  private createCoverArt() {
    const { width, height } = this.scale;
    this.artLayer = this.add.container(0, 0);
    this.rootContainer.add(this.artLayer);

    // Painted art is soft-edged, so it is upscaled with linear filtering; sprites elsewhere stay pixel-perfect.
    this.textures.get('intro_cover').setFilter(Phaser.Textures.FilterMode.LINEAR);

    // Letterbox fill (only visible on screens that are not 16:9): the same art, darkened and cropped to cover.
    const fill = this.add.image(0, 0, 'intro_cover');
    fill.setScale(menuBackdropScale(width, height, COVER_ART.width, COVER_ART.height) * 1.06).setTint(0x4a2a22);

    this.artScale = coverArtScale(width, height, COVER_ART.width, COVER_ART.height);
    const cover = this.add.image(0, 0, 'intro_cover').setScale(this.artScale);
    this.artLayer.add([fill, cover]);

    // Slow cinematic push-in; lights live inside the same layer so they stay locked to the art.
    this.tweens.add({
      targets: this.artLayer, scaleX: 1.02, scaleY: 1.02,
      duration: 16000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  // -------------------------------------------------------------
  // LAYER 2: LIGHTING (additive halos) & AMBIENT PARTICLES
  // -------------------------------------------------------------
  private ensureGlowTexture(key: string, stops: Array<[number, string]>, size = 128) {
    if (this.textures.exists(key)) return;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    for (const [at, color] of stops) grad.addColorStop(at, color);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    this.textures.addCanvas(key, canvas);
  }

  private addGlow(u: number, v: number, scale: number, alpha: [number, number], period: number, tint = 0xffffff, key = 'lantern_radial_glow') {
    const p = this.artPoint(u, v);
    const glow = this.add.image(p.x, p.y, key).setBlendMode(Phaser.BlendModes.ADD).setTint(tint)
      .setScale(scale * this.artScale).setAlpha(alpha[0]);
    this.artLayer.add(glow);
    this.lightGlows.push(glow);
    this.tweens.add({
      targets: glow, alpha: alpha[1],
      scaleX: glow.scaleX * 1.1, scaleY: glow.scaleY * 1.1,
      duration: period, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    return glow;
  }

  private createLightingAndParticles() {
    this.ensureGlowTexture('lantern_radial_glow', [
      [0, 'rgba(255, 235, 120, 0.90)'], [0.35, 'rgba(255, 170, 30, 0.50)'],
      [0.7, 'rgba(255, 100, 10, 0.18)'], [1, 'rgba(255, 80, 0, 0)'],
    ]);
    this.ensureGlowTexture('title_spark', [
      [0, 'rgba(255, 245, 190, 1)'], [0.4, 'rgba(255, 150, 40, 0.65)'], [1, 'rgba(255, 90, 0, 0)'],
    ], 32);

    // Setting sun: wide, slow breathing bloom + a tighter hot core.
    this.addGlow(COVER_ART.sun.x, COVER_ART.sun.y, 5.2, [0.28, 0.5], 2600, 0xffa030);
    this.addGlow(COVER_ART.sun.x, COVER_ART.sun.y, 2.0, [0.18, 0.34], 1900, 0xffe28a);
    // Gas lantern on the gallows: fast, irregular flicker.
    this.addGlow(COVER_ART.lantern.x, COVER_ART.lantern.y, 1.5, [0.5, 0.95], 170);
    // Warm window light from the saloon and the left building.
    COVER_ART.windows.forEach((w, i) => this.addGlow(w.x, w.y, 0.9, [0.28, 0.55], 420 + i * 130, 0xffc060));

    // Embers rising from the horizon.
    const horizon = this.artPoint(COVER_ART.horizon.x, COVER_ART.horizon.y);
    for (let i = 0; i < 22; i++) {
      const spark = this.add.image(horizon.x + Phaser.Math.Between(-520, 520), horizon.y + Phaser.Math.Between(-20, 90), 'title_spark')
        .setBlendMode(Phaser.BlendModes.ADD).setScale(Phaser.Math.FloatBetween(0.35, 0.9)).setAlpha(0);
      this.artLayer.add(spark);
      this.tweens.add({
        targets: spark,
        y: spark.y - Phaser.Math.Between(220, 420),
        x: spark.x + Phaser.Math.Between(-60, 90),
        alpha: { from: 0.9, to: 0 },
        duration: Phaser.Math.Between(3200, 6000),
        delay: Phaser.Math.Between(0, 4000),
        repeat: -1,
        ease: 'Sine.easeOut',
      });
    }

    // Desert dust sweeping across the foreground (outside the art layer so it ignores the push-in).
    for (let i = 0; i < 22; i++) {
      const speck = this.add.graphics();
      speck.fillStyle(0xf5d6a1, Phaser.Math.FloatBetween(0.2, 0.6));
      speck.fillCircle(0, 0, Phaser.Math.Between(2, 4));
      speck.setPosition(Phaser.Math.Between(-900, 800), Phaser.Math.Between(120, 480));
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

  /** Soft cinematic edge falloff so the controls sit comfortably on the art. */
  private createVignette() {
    if (!this.textures.exists('title_vignette')) {
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      const grad = ctx.createRadialGradient(128, 128, 70, 128, 128, 182);
      grad.addColorStop(0, 'rgba(18, 11, 8, 0)');
      grad.addColorStop(1, 'rgba(18, 11, 8, 0.62)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
      this.textures.addCanvas('title_vignette', canvas);
    }
    const { width, height } = this.scale;
    const vignette = this.add.image(0, 0, 'title_vignette');
    vignette.setScale(menuBackdropScale(width, height, 256, 256));
    this.rootContainer.add(vignette);
  }

  // -------------------------------------------------------------
  // LAYER 3: PRESS START BUTTON PARCHMENT PLAQUE
  // -------------------------------------------------------------
  private static readonly START_Y = 105;

  private createStartButton() {
    const btnW = 540;
    const btnH = 108;
    const btnX = 450;

    this.startBtnContainer = this.add.container(btnX, TitleScene.START_Y);
    this.startBtnContainer.setAlpha(0);

    // Dark wood base plaque
    const darkWood = pulpSurface(this, 0, 0, btnW, btnH, 'wood');
    this.startBtnContainer.add(darkWood);

    // Inner dark carved plate
    const innerPlate = this.add.graphics();
    innerPlate.fillStyle(0x180b05, 0.92);
    innerPlate.fillRoundedRect(-btnW / 2 + 10, -btnH / 2 + 10, btnW - 20, btnH - 20, 10);
    this.startBtnContainer.add(innerPlate);

    // Pulsing arcade border
    this.startBtnBorderGlow = this.add.graphics();
    const borderRadius = 14;
    this.startBtnBorderGlow.lineStyle(4, 0xffc52a, 0.95);
    this.startBtnBorderGlow.strokeRoundedRect(-btnW / 2 + 6, -btnH / 2 + 6, btnW - 12, btnH - 12, borderRadius);
    this.startBtnBorderGlow.lineStyle(2, 0xff791c, 0.7);
    this.startBtnBorderGlow.strokeRoundedRect(-btnW / 2 + 10, -btnH / 2 + 10, btnW - 20, btnH - 20, borderRadius - 3);
    this.startBtnBorderGlow.setAlpha(0.3);
    this.startBtnContainer.add(this.startBtnBorderGlow);

    // Localized typography: PRESS START / PRESSIONE START
    this.startBtnText = this.add.text(0, -9, t('menu.pressStart'), {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '26px',
      color: '#ffe066',
      stroke: '#120b08',
      strokeThickness: 5,
    }).setOrigin(0.5);
    this.startBtnContainer.add(this.startBtnText);

    this.startBtnSubText = this.add.text(0, 26, t('menu.pressStartSub'), {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '11px',
      color: '#f2d49a',
      stroke: '#120b08',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.startBtnContainer.add(this.startBtnSubText);

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

  public createLanguageSelector() {
    SpriteGenerator.createFlagTextures(this);

    const container = this.add.container(-640, -455) as any;
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
  }


  // -------------------------------------------------------------
  // OPENING TIMELINE
  // -------------------------------------------------------------
  private playCinematicOpening() {
    this.cameras.main.fadeIn(600, 0, 0, 0);

    // The cover settles in with a slight push, lights and controls follow.
    this.artLayer.setScale(1.05);
    this.tweens.add({ targets: this.artLayer, scaleX: 1, scaleY: 1, duration: 1400, ease: 'Cubic.easeOut' });

    this.menuButton?.setAlpha(0);
    this.storeButton?.setAlpha(0);
    this.time.delayedCall(900, () => {
      if (this.isAdvancing) return;
      this.startBtnContainer.setAlpha(1);
      this.tweens.add({
        targets: this.startBtnContainer,
        y: { from: TitleScene.START_Y + 120, to: TitleScene.START_Y },
        scaleX: { from: 0.85, to: 1.0 },
        scaleY: { from: 0.85, to: 1.0 },
        duration: 600,
        ease: 'Bounce.easeOut',
      });
    });
    this.time.delayedCall(1250, () => {
      if (this.isAdvancing) return;
      this.tweens.add({ targets: [this.menuButton, this.storeButton], alpha: 1, duration: 350 });
    });
  }

  private createAuxiliaryMenu() {
    this.menuButton = new WesternButton(this, {
      x: 315, y: 225, width: 250, height: 58, presentation: 'pulp', text: t('common.menu'),
      variant: 'wood', fontSize: '24px', onClick: () => this.openMainMenu(),
    });
    this.storeButton = new WesternButton(this, {
      x: 585, y: 225, width: 250, height: 58, presentation: 'pulp', text: t('common.store'),
      variant: 'wood', fontSize: '24px', onClick: () => this.openStore(),
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

    // Snap controls in case the opening was still running
    this.startBtnContainer?.setAlpha(1).setY(TitleScene.START_Y);
    this.menuButton?.setAlpha(1);
    this.storeButton?.setAlpha(1);

    // 1. Revolver shot
    sounds.playRevolver();

    // 2. Cylinder reload
    this.time.delayedCall(160, () => {
      sounds.playReload();
    });

    // 3. Intro theme
    sounds.playIntroMusic();

    // 4. Golden arcade flash, a punch on the cover and transition to character select
    this.cameras.main.flash(200, 255, 235, 170);
    this.tweens.killTweensOf(this.artLayer);
    this.tweens.add({ targets: this.artLayer, scaleX: 1.035, scaleY: 1.035, duration: 120, yoyo: true });

    this.cameras.main.fade(550, 0, 0, 0);
    this.time.delayedCall(600, () => {
      this.scene.start('CharacterSelectScene', { difficulty: difficultySettings.get() });
    });
  }
}
