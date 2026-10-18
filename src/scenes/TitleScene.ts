import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { THEME } from '../ui/theme/tokens';
import { SpriteGenerator } from '../utils/SpriteGenerator';

export class TitleScene extends Phaser.Scene {
  private flashText!: Phaser.GameObjects.Text;
  private soundStarted: boolean = false;

  constructor() {
    super('TitleScene');
  }

  preload() {
    this.load.image('title_bg', 'assets/title_screen.jpg');
    this.load.image('wanted_greedwell', 'assets/wanted_greedwell.jpg');
    this.load.image('characters_select', 'assets/characters_select.jpg');
    this.load.image('desert_ground', 'assets/desert_ground.jpg');

    // 32-bit Neo Geo Arcade Hero Spritesheets
    this.load.spritesheet('hero_steve', 'assets/sprites/heroes/steve_sheet.png', { frameWidth: 128, frameHeight: 144 });
    this.load.spritesheet('hero_billy', 'assets/sprites/heroes/billy_sheet.png', { frameWidth: 128, frameHeight: 144 });
    this.load.spritesheet('hero_bob', 'assets/sprites/heroes/bob_sheet.png', { frameWidth: 128, frameHeight: 144 });
    this.load.spritesheet('hero_cormano', 'assets/sprites/heroes/cormano_sheet.png', { frameWidth: 128, frameHeight: 144 });

    // Character Select Assets (WESTERN PULP '98)
    this.load.image('select_saloon_backdrop', 'assets/select_characters/select_saloon_backdrop.png');
    this.load.image('bottom_panel_clean', 'assets/select_characters/bottom_panel_clean.png');
    this.load.image('poster_steve', 'assets/select_characters/poster_steve.png');
    this.load.image('poster_billy', 'assets/select_characters/poster_billy.png');
    this.load.image('poster_bob', 'assets/select_characters/poster_bob.png');
    this.load.image('poster_cormano', 'assets/select_characters/poster_cormano.png');

    // Western Powerup & Bounty Cards (Illustrated Woodcut Vintage Posters)
    this.load.image('card_revolver', 'assets/cards/dual_revolvers.png');
    this.load.image('card_peacemaker', 'assets/cards/twin_peacemakers.png');
    this.load.image('card_shotgun', 'assets/cards/sawed_off_shotgun.png');
    this.load.image('card_rifle', 'assets/cards/winchester_repeater.png');
    this.load.image('card_dynamite', 'assets/cards/tnt_dynamite.png');
    this.load.image('card_molotov', 'assets/cards/whiskey_molotov.png');
    this.load.image('card_lasso', 'assets/cards/spinning_lasso.png');

    this.load.image('card_badge', 'assets/cards/sheriffs_star.png');
    this.load.image('card_spurs', 'assets/cards/silver_spurs.png');
    this.load.image('card_whiskey', 'assets/cards/frontier_whiskey.png');
    this.load.image('card_bandolier', 'assets/cards/ammo_bandolier.png');
    this.load.image('card_magnet', 'assets/cards/horseshoe_magnet.png');

    // Saloon & Level Up Decor Assets
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

    // UI Elements
    this.load.image('ui_wood_title', 'assets/ui/wood_title_board.png');
    this.load.image('ui_card_selected_frame', 'assets/ui/selected_card_frame.png');
    this.load.image('ui_btn_idle', 'assets/ui/button_idle.png');
    this.load.image('ui_btn_selected', 'assets/ui/button_selected.png');
    this.load.image('ui_ribbon_new', 'assets/ui/ribbon_new.png');
    this.load.image('ui_ribbon_upgrade', 'assets/ui/ribbon_upgrade.png');
    this.load.image('ui_ribbon_max', 'assets/ui/ribbon_max.png');
    this.load.image('ui_dim_vignette', 'assets/ui/background_dim_vignette.png');
    this.load.image('ui_wanted_poster', 'assets/ui/blank_wanted_poster.png');
  }

  create() {
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

    // Background Art
    if (this.textures.exists('title_bg')) {
      const bg = this.add.image(width / 2, height / 2, 'title_bg');
      // Scale to fit screen preserving aspect ratio
      const scaleX = width / bg.width;
      const scaleY = height / bg.height;
      const scale = Math.max(scaleX, scaleY);
      bg.setScale(scale);
    } else {
      this.cameras.main.setBackgroundColor('#2b1007');
    }

    // Vignette Overlay
    const vignette = this.add.graphics();
    vignette.fillStyle(0x000000, 0.35);
    vignette.fillRect(0, 0, width, height);

    // Top Arcade Header ($0 1UP -- HIGH SCORE $36,250)
    const headerStyle = {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '14px',
      color: THEME.colors.gold.base,
      stroke: '#000000',
      strokeThickness: 3,
    };

    this.add.text(40, 24, '1UP  $00000', headerStyle);
    this.add.text(width / 2 - 100, 24, 'HIGH  $36,250', {
      ...headerStyle,
      color: THEME.colors.reward.light,
    });
    this.add.text(width - 160, 24, 'CREDIT  04', headerStyle);

    // Flashing "PRESS START" text
    this.flashText = this.add.text(width / 2, height - 70, '★ PRESS START / CLICK TO PLAY ★', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '18px',
      color: '#ffe066',
      stroke: '#8b0e0e',
      strokeThickness: 5,
      shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 4, fill: true },
    }).setOrigin(0.5);

    // Subtle flashing tween
    this.tweens.add({
      targets: this.flashText,
      alpha: 0.15,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Stepped',
    });

    // Subtitle instructions
    this.add.text(width / 2, height - 32, 'PRESS ENTER, SPACE OR TAP SCREEN', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '10px',
      color: '#cbd5e1',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Audio & Mute button in top right corner
    const muteBtn = this.add.text(width - 40, height - 32, '🔊 SFX', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '11px',
      color: '#fbbf24',
      backgroundColor: '#1b120c',
      padding: { x: 8, y: 4 },
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    muteBtn.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      const muted = sounds.toggleMute();
      muteBtn.setText(muted ? '🔇 MUTED' : '🔊 SFX');
      muteBtn.setColor(muted ? '#ef4444' : '#fbbf24');
    });

    // Input to advance to Story scene
    let isAdvancing = false;
    const advance = () => {
      if (isAdvancing) return;
      isAdvancing = true;

      // Disparo de tiro e som de recarga
      sounds.playRevolver();
      this.time.delayedCall(160, () => {
        sounds.playReload();
      });

      // Trilha da introdução (Departing into the Horizon)
      sounds.playIntroMusic();

      // Flash arcade e transição suave
      this.cameras.main.flash(180, 255, 235, 170);
      this.cameras.main.fade(550, 0, 0, 0);
      this.time.delayedCall(600, () => {
        this.scene.start('StoryScene');
      });
    };

    // User gesture starts intro BGM if touched before advancing
    this.input.once('pointerdown', () => {
      sounds.playIntroMusic();
    });

    this.input.on('pointerdown', advance);
    this.input.keyboard?.on('keydown-SPACE', advance);
    this.input.keyboard?.on('keydown-ENTER', advance);
  }
}
