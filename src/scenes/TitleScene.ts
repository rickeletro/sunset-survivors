import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { THEME } from '../ui/theme/tokens';
import { SpriteGenerator } from '../utils/SpriteGenerator';
import { WesternButton } from '../ui/components/WesternButton';
import { preloadPixellabHeroes } from '../systems/PixellabHeroes';
import { preloadGreedwell } from '../systems/GreedwellSprites';

export class TitleScene extends Phaser.Scene {
  private rootContainer!: Phaser.GameObjects.Container;
  private isAdvancing: boolean = false;
  private introTimeline?: Phaser.Time.TimerEvent;

  // Visual layers & objects
  private bkgImage!: Phaser.GameObjects.Image;
  private logoImage!: Phaser.GameObjects.Image;
  private playersGroupImage!: Phaser.GameObjects.Image;
  private playersShadowGraphics!: Phaser.GameObjects.Graphics;
  private startBtnContainer!: Phaser.GameObjects.Container;
  private startBtnBorderGlow!: Phaser.GameObjects.Graphics;
  private lanternGlows: Phaser.GameObjects.Image[] = [];
  private sunGlowGraphics!: Phaser.GameObjects.Graphics;
  private dustEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private optionsModalContainer?: Phaser.GameObjects.Container;

  constructor() {
    super('TitleScene');
  }

  preload() {
    // 1. Core Title & Intro Layer Assets (WESTERN PULP '98)
    this.load.image('intro_bkg', 'assets/background/sunsetsurvivors_bkg.png');
    this.load.image('intro_logo_new', 'assets/intro/Logo_Western_Sunset_Survivors.png');
    this.load.image('intro_players_group', 'assets/intro/players.png');
    this.load.image('intro_sky', 'assets/intro/title_sky.png');
    this.load.image('intro_landscape', 'assets/intro/title_landscape.png');
    this.load.image('intro_frame', 'assets/intro/title_frame.png');
    this.load.image('intro_logo', 'assets/intro/title_logo.png');
    this.load.image('intro_btn_dark', 'assets/intro/btn_start_dark.png');
    this.load.image('intro_btn_glow', 'assets/intro/btn_start_glow.png');

    // 2. Fallbacks & Legacy Assets
    this.load.image('title_bg', 'assets/title_screen.jpg');
    this.load.image('wanted_greedwell', 'assets/wanted_greedwell.jpg');
    this.load.image('characters_select', 'assets/characters_select.jpg');
    this.load.image('desert_ground', 'assets/desert_ground.jpg');

    // 3. 32-bit Neo Geo Arcade Hero Spritesheets (for gameplay & selection)
    this.load.spritesheet('hero_steve', 'assets/sprites/heroes/steve_sheet.png', { frameWidth: 128, frameHeight: 144 });
    this.load.spritesheet('hero_billy', 'assets/sprites/heroes/billy_sheet.png', { frameWidth: 128, frameHeight: 144 });
    this.load.spritesheet('hero_bob', 'assets/sprites/heroes/bob_sheet.png', { frameWidth: 128, frameHeight: 144 });
    this.load.spritesheet('hero_cormano', 'assets/sprites/heroes/cormano_sheet.png', { frameWidth: 128, frameHeight: 144 });

    // 3b. Pixellab heroes: walk cycles in 6 directions (gameplay)
    preloadPixellabHeroes(this);
    preloadGreedwell(this);

    // 4. Character Select Assets (WESTERN PULP '98)
    this.load.image('select_saloon_backdrop', 'assets/select_characters/select_saloon_backdrop.png');
    this.load.image('bottom_panel_clean', 'assets/select_characters/bottom_panel_clean.png');
    this.load.image('poster_steve', 'assets/select_characters/poster_steve.png');
    this.load.image('poster_billy', 'assets/select_characters/poster_billy.png');
    this.load.image('poster_bob', 'assets/select_characters/poster_bob.png');
    this.load.image('poster_cormano', 'assets/select_characters/poster_cormano.png');
    this.load.image('ui_card_selected_frame', 'assets/ui/selected_card_frame.png');

    // 5. Western Powerup & Bounty Cards
    this.load.image('card_revolver', 'assets/powerup/dual_revolvers.png');
    this.load.image('card_peacemaker', 'assets/powerup/twin_peacemakers.png');
    this.load.image('card_shotgun', 'assets/powerup/sawed_off_shotgun.png');
    this.load.image('card_rifle', 'assets/powerup/winchester_repeater.png');
    this.load.image('card_dynamite', 'assets/powerup/tnt_dynamite.png');
    this.load.image('card_molotov', 'assets/powerup/whiskey_molotov.png');
    this.load.image('card_lasso', 'assets/powerup/spinning_lasso.png');
    this.load.image('card_badge', 'assets/powerup/sheriffs_star.png');
    this.load.image('card_spurs', 'assets/powerup/silver_spurs.png');
    this.load.image('card_whiskey', 'assets/powerup/frontier_whiskey.png');
    this.load.image('card_bandolier', 'assets/powerup/ammo_bandolier.png');
    this.load.image('card_magnet', 'assets/powerup/horseshoe_magnet.png');

    // 6. Saloon & Level Up Decor Assets
    this.load.image('saloon_bkg', 'assets/background/Saloon_bkg.png');
    this.load.image('hud_avatar_steve', 'assets/ui/hud_avatar_steve.png');
    this.load.image('hud_avatar_billy', 'assets/ui/hud_avatar_billy.png');
    this.load.image('hud_avatar_bob', 'assets/ui/hud_avatar_bob.png');
    this.load.image('hud_avatar_cormano', 'assets/ui/hud_avatar_cormano.png');
    this.load.image('hud_coin_icon', 'assets/ui/hud_coin_icon.png');
    this.load.image('hud_skull_icon', 'assets/ui/hud_skull_icon.png');
    this.load.image('ref_lore_note', 'assets/ui/ref_lore_note_clean.png');
    this.load.image('decor_backdrop', 'assets/decor/desert_saloon_backdrop.png');
    this.load.image('decor_vignette', 'assets/decor/cinematic_vignette.png');
    this.load.image('decor_side_beam', 'assets/decor/wooden_side_beam.png');
    this.load.image('decor_lantern', 'assets/decor/hanging_lantern.png');
    this.load.image('decor_chain', 'assets/decor/hanging_chain.png');
    this.load.image('decor_title_parchment', 'assets/decor/hanging_title_parchment.png');
    this.load.image('decor_subtitle_board', 'assets/decor/subtitle_wood_board.png');
    this.load.image('decor_star', 'assets/decor/western_star.png');
    this.load.image('decor_barrel', 'assets/decor/barrel.png');
    this.load.image('decor_crate', 'assets/decor/wood_crate.png');
    this.load.image('decor_rope', 'assets/decor/rope.png');
    this.load.image('decor_casing', 'assets/decor/bullet_casing.png');
    this.load.image('decor_spark', 'assets/decor/gold_spark.png');
    this.load.image('decor_details_board', 'assets/decor/details_wood_board.png');
    this.load.image('decor_parchment_note', 'assets/decor/small_parchment_note.png');

    // 7. UI Elements
    this.load.image('ui_wood_title', 'assets/ui/wood_title_board.png');
    this.load.image('ui_btn_idle', 'assets/ui/button_idle.png');
    this.load.image('ui_btn_selected', 'assets/ui/button_selected.png');
    this.load.image('ui_ribbon_new', 'assets/ui/ribbon_new.png');
    this.load.image('ui_ribbon_upgrade', 'assets/ui/ribbon_upgrade.png');
    this.load.image('ui_ribbon_max', 'assets/ui/ribbon_max.png');
    this.load.image('ui_dim_vignette', 'assets/ui/background_dim_vignette.png');
    this.load.image('ui_wanted_poster', 'assets/ui/blank_wanted_poster.png');
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
    const REF_W = 1536;
    const REF_H = 1024;
    const scale = Math.min(width / REF_W, height / REF_H);

    this.rootContainer = this.add.container(width / 2, height / 2);
    this.rootContainer.setScale(scale);

    // 3. Assemble the Layers of WESTERN PULP '98 Intro
    this.createBackgroundAndAtmosphere();
    this.createPlayersGroup();
    this.createLogotype();
    this.createStartButton();
    this.createAuxiliaryMenu();
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
    this.scale.on('resize', this.handleResize, this);
  }

  // -------------------------------------------------------------
  // LAYER 1: CINEMATIC WESTERN SUNSET BACKGROUND & LANTERNS
  // -------------------------------------------------------------
  private createBackgroundAndAtmosphere() {
    // 1. Background image (sunsetsurvivors_bkg.png)
    const bkgKey = this.textures.exists('intro_bkg') ? 'intro_bkg' : 'intro_landscape';
    this.bkgImage = this.add.image(0, 0, bkgKey).setDisplaySize(1536, 1024);
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
    const playersKey = this.textures.exists('intro_players_group') ? 'intro_players_group' : 'characters_select';
    
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

    // Dark base plaque
    const darkBtn = this.add.image(0, 0, 'intro_btn_dark').setDisplaySize(btnW, btnH);
    this.startBtnContainer.add(darkBtn);

    // Borda brilhante arcade pulsante (sem trocar de imagem ou piscar brusco)
    this.startBtnBorderGlow = this.add.graphics();
    const borderRadius = 16;
    // Borda dourada brilhante
    this.startBtnBorderGlow.lineStyle(4, 0xffc52a, 0.95);
    this.startBtnBorderGlow.strokeRoundedRect(-btnW / 2 + 4, -btnH / 2 + 4, btnW - 8, btnH - 8, borderRadius);
    // Borda interna âmbar de acabamento
    this.startBtnBorderGlow.lineStyle(2, 0xff791c, 0.7);
    this.startBtnBorderGlow.strokeRoundedRect(-btnW / 2 + 8, -btnH / 2 + 8, btnW - 16, btnH - 16, borderRadius - 4);
    this.startBtnBorderGlow.setAlpha(0.3);
    this.startBtnContainer.add(this.startBtnBorderGlow);

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

    // Center: HIGH SCORE
    const hi = this.add.text(0, -480, 'HIGH   $036,250', {
      ...hudStyle,
      color: '#ff4433',
    }).setOrigin(0.5, 0);
    this.rootContainer.add(hi);

    // Right: CREDIT
    const cr = this.add.text(680, -480, 'CREDIT   04', hudStyle).setOrigin(1, 0);
    this.rootContainer.add(cr);

    // Bottom Copyright / Project info
    const copyright = this.add.text(0, 484, 'TM © 2026 SUNSET SURVIVORS. A FAN GAME INSPIRED BY SUNSET RIDERS.', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '10px',
      color: '#f2d49a',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.rootContainer.add(copyright);
  }

  // -------------------------------------------------------------
  // MODAL DE OPÇÕES DE ÁUDIO (SLIDERS DESLIZANTES PARA BGM & SFX)
  // -------------------------------------------------------------
  private openOptionsMenuModal() {
    if (this.optionsModalContainer) return;
    sounds.playRevolver();

    const modalContainer = this.add.container(0, 0);
    this.optionsModalContainer = modalContainer;

    // Dark backdrop overlay bloqueando cliques atrás
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(-768, -512, 1536, 1024);
    overlay.setInteractive(new Phaser.Geom.Rectangle(-768, -512, 1536, 1024), Phaser.Geom.Rectangle.Contains);
    modalContainer.add(overlay);

    // Saloon Wood Modal Box
    const boxW = 620;
    const boxH = 430;
    const box = this.add.graphics();
    // Drop shadow
    box.fillStyle(0x000000, 0.6);
    box.fillRoundedRect(-boxW / 2 + 8, -boxH / 2 + 10, boxW, boxH, 12);
    // Outer wood border
    box.fillStyle(0x321b10, 1);
    box.fillRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, 12);
    // Parchment inner fill
    box.fillStyle(0xecd8b5, 1);
    box.fillRoundedRect(-boxW / 2 + 6, -boxH / 2 + 6, boxW - 12, boxH - 12, 8);
    // Inner xilogravura frame
    box.lineStyle(2, 0x78350f, 0.85);
    box.strokeRect(-boxW / 2 + 16, -boxH / 2 + 16, boxW - 32, boxH - 32);
    modalContainer.add(box);

    // Title Header Plaque
    const titlePlaque = this.add.graphics();
    titlePlaque.fillStyle(0xa51e16, 1);
    titlePlaque.fillRoundedRect(-180, -boxH / 2 + 26, 360, 44, 6);
    titlePlaque.lineStyle(2, 0xffc52a, 1);
    titlePlaque.strokeRoundedRect(-180, -boxH / 2 + 26, 360, 44, 6);
    modalContainer.add(titlePlaque);

    const titleText = this.add.text(0, -boxH / 2 + 48, '★ AUDIO OPTIONS ★', {
      fontFamily: '"Rye", serif',
      fontSize: '20px',
      color: '#fff7ed',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    modalContainer.add(titleText);

    // -------------------------------------------------------------
    // SLIDER CREATION HELPER
    // -------------------------------------------------------------
    const createSlider = (
      yPos: number,
      labelStr: string,
      initialVal: number,
      onChange: (val: number) => void
    ) => {
      const sliderTrackW = 340;
      const sliderTrackH = 16;
      const trackX = -30;

      // Label (left)
      const label = this.add.text(-220, yPos, labelStr, {
        fontFamily: THEME.typography.pixelFont,
        fontSize: '11px',
        color: '#2b1408',
      }).setOrigin(0, 0.5);
      modalContainer.add(label);

      // Percentage text (right)
      const pctText = this.add.text(210, yPos, `${Math.round(initialVal * 100)}%`, {
        fontFamily: THEME.typography.pixelFont,
        fontSize: '11px',
        color: '#78350f',
      }).setOrigin(0, 0.5);
      modalContainer.add(pctText);

      // Track graphics
      const trackGfx = this.add.graphics();
      const fillGfx = this.add.graphics();
      modalContainer.add([trackGfx, fillGfx]);

      const drawTrack = (val: number) => {
        // Track background
        trackGfx.clear();
        trackGfx.fillStyle(0x321b10, 1);
        trackGfx.fillRoundedRect(trackX - sliderTrackW / 2, yPos - sliderTrackH / 2, sliderTrackW, sliderTrackH, 8);
        trackGfx.lineStyle(1, 0x78350f, 1);
        trackGfx.strokeRoundedRect(trackX - sliderTrackW / 2, yPos - sliderTrackH / 2, sliderTrackW, sliderTrackH, 8);

        // Active fill
        fillGfx.clear();
        fillGfx.fillStyle(0xd97706, 1);
        const fillW = Math.max(8, sliderTrackW * val);
        fillGfx.fillRoundedRect(trackX - sliderTrackW / 2 + 2, yPos - sliderTrackH / 2 + 2, fillW - 4, sliderTrackH - 4, 6);
      };

      drawTrack(initialVal);

      // Knob (Thumb)
      const knob = this.add.graphics();
      const knobRadius = 14;
      const drawKnob = (kx: number) => {
        knob.clear();
        knob.fillStyle(0x1a0d00, 0.3);
        knob.fillCircle(kx, yPos + 3, knobRadius);
        knob.fillStyle(0xffc52a, 1);
        knob.fillCircle(kx, yPos, knobRadius);
        knob.lineStyle(2, 0x603719, 1);
        knob.strokeCircle(kx, yPos, knobRadius);
        knob.fillStyle(0xa51e16, 1);
        knob.fillCircle(kx, yPos, 4);
      };

      const startKx = trackX - sliderTrackW / 2 + sliderTrackW * initialVal;
      drawKnob(startKx);
      modalContainer.add(knob);

      // Interactive hit zone for dragging
      const hitZone = this.add.zone(trackX, yPos, sliderTrackW + 36, 40)
        .setInteractive({ useHandCursor: true });
      modalContainer.add(hitZone);

      let isDragging = false;
      const updateFromPointer = (pointerX: number) => {
        // Posição local no rootContainer escalado
        const localX = (pointerX - this.cameras.main.width / 2) / this.rootContainer.scaleX;
        const clampedX = Phaser.Math.Clamp(localX, trackX - sliderTrackW / 2, trackX + sliderTrackW / 2);
        const ratio = (clampedX - (trackX - sliderTrackW / 2)) / sliderTrackW;
        drawTrack(ratio);
        drawKnob(clampedX);
        pctText.setText(`${Math.round(ratio * 100)}%`);
        onChange(ratio);
      };

      hitZone.on('pointerdown', (p: Phaser.Input.Pointer) => {
        isDragging = true;
        updateFromPointer(p.x);
      });

      this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
        if (isDragging) {
          updateFromPointer(p.x);
        }
      });

      this.input.on('pointerup', () => {
        isDragging = false;
      });
    };

    // 1. Music Slider (inicia a 75%)
    createSlider(-55, '🎵 MUSIC', sounds.getMusicVolume(), (val) => {
      sounds.setMusicVolume(val);
    });

    // 2. SFX Slider (inicia a 45%)
    createSlider(35, '💥 SFX', sounds.getSfxVolume(), (val) => {
      sounds.setSfxVolume(val);
      sounds.playPistolShot();
    });

    // 3. Mute Toggle Button
    const isMuted = sounds.getIsMuted();
    const muteBtn = this.add.text(0, 115, isMuted ? '🔇 AUDIO: MUTED' : '🔊 AUDIO: ACTIVE', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '11px',
      color: isMuted ? '#ef4444' : '#166534',
      backgroundColor: '#d6c09a',
      padding: { left: 16, right: 16, top: 8, bottom: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    muteBtn.on('pointerdown', () => {
      const nowMuted = sounds.toggleMute();
      muteBtn.setText(nowMuted ? '🔇 AUDIO: MUTED' : '🔊 AUDIO: ACTIVE');
      muteBtn.setColor(nowMuted ? '#ef4444' : '#166534');
    });
    modalContainer.add(muteBtn);

    // 4. Close [ CONFIRMAR / VOLTAR ] Button
    const closeBtn = this.add.text(0, 175, '✔ SALVAR E VOLTAR', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#8b0e0e',
      padding: { left: 24, right: 24, top: 10, bottom: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      sounds.playRevolver();
      this.closeOptionsMenuModal();
    });
    modalContainer.add(closeBtn);

    // Entrance Animation (Escala elástica)
    modalContainer.setScale(0.85);
    modalContainer.setAlpha(0);
    this.tweens.add({
      targets: modalContainer,
      scaleX: 1.0,
      scaleY: 1.0,
      alpha: 1.0,
      duration: 180,
      ease: 'Back.easeOut',
    });

    this.rootContainer.add(modalContainer);
  }

  private closeOptionsMenuModal() {
    if (!this.optionsModalContainer) return;
    this.tweens.add({
      targets: this.optionsModalContainer,
      scaleX: 0.85,
      scaleY: 0.85,
      alpha: 0,
      duration: 140,
      ease: 'Power2',
      onComplete: () => {
        this.optionsModalContainer?.destroy();
        this.optionsModalContainer = undefined;
      },
    });
  }

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
    // Posicionado com folga confortável abaixo do botão PRESS START (base do start btn em y=360, aux em y=420)
    const auxContainer = this.add.container(0, 420);

    const items = [
      { text: '⚙ MENU [M]', onClick: () => this.openOptionsMenuModal() },
      { text: '📖 CONTROLS [H]', onClick: () => this.openControls() },
      { text: '📊 STATS [S]', onClick: () => this.openStats() },
      { text: '🏆 UNLOCKS [U]', onClick: () => this.openUnlockables() },
    ];

    // 4 botões distribuídos simetricamente: -360, -120, 120, 360
    const positionsX = [-360, -120, 120, 360];

    items.forEach((item, idx) => {
      const btn = new WesternButton(this, {
        x: positionsX[idx],
        y: 0,
        width: 220,
        height: 44,
        text: item.text,
        variant: 'wood',
        fontSize: '10px',
        onClick: item.onClick,
      });
      auxContainer.add(btn);
    });

    this.rootContainer.add(auxContainer);
  }

  private openControls() {
    if (this.isAdvancing) return;
    sounds.playRevolver();
    this.scale.off('resize', this.handleResize, this);
    this.scene.start('ControlsScene', { fromScene: 'TitleScene' });
  }

  private openStats() {
    if (this.isAdvancing) return;
    sounds.playRevolver();
    this.scale.off('resize', this.handleResize, this);
    this.scene.start('StatsScene', { fromScene: 'TitleScene' });
  }

  private openUnlockables() {
    if (this.isAdvancing) return;
    sounds.playRevolver();
    this.scale.off('resize', this.handleResize, this);
    this.scene.start('UnlockablesScene');
  }

  // -------------------------------------------------------------
  // INPUT HANDLING & INSTANT SKIP
  // -------------------------------------------------------------
  private setupInputs() {
    // Enter or Space key
    this.input.keyboard?.on('keydown-SPACE', () => this.advanceToGame());
    this.input.keyboard?.on('keydown-ENTER', () => this.advanceToGame());

    // Auxiliary screen shortcuts
    this.input.keyboard?.on('keydown-M', () => this.openOptionsMenuModal());
    this.input.keyboard?.on('keydown-H', () => this.openControls());
    this.input.keyboard?.on('keydown-S', () => this.openStats());
    this.input.keyboard?.on('keydown-U', () => this.openUnlockables());
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
      this.scale.off('resize', this.handleResize, this);
      this.scene.start('CharacterSelectScene');
    });
  }

  // -------------------------------------------------------------
  // RESPONSIVE SCALING HANDLER
  // -------------------------------------------------------------
  private handleResize() {
    if (!this.rootContainer || !this.scene.isActive()) return;
    const { width, height } = this.scale;
    const REF_W = 1536;
    const REF_H = 1024;
    const scale = Math.min(width / REF_W, height / REF_H);

    this.rootContainer.setPosition(width / 2, height / 2);
    this.rootContainer.setScale(scale);
  }
}
