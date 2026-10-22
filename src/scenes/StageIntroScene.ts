import { preloadPulp, pulpBackdrop } from '../ui/layout/pulpSceneKit';
import { normalizeDifficulty, difficultySettings, type DifficultyId } from '../data/difficulty';
import { preloadImages } from '../assets/registry';
import { createMenuRoot } from '../ui/layout/menuLayout';
import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { CharacterData, CHARACTERS } from '../data/characters';
import { BossData, getBossForStage } from '../data/bosses';
import { getStage } from '../data/stages';
import { THEME } from '../ui/theme/tokens';
import { WesternPanel } from '../ui/components/WesternPanel';
import { WesternTitle } from '../ui/components/WesternTitle';

export class StageIntroScene extends Phaser.Scene {
  private character!: CharacterData;
  private stage: number = 1;
  private difficulty: DifficultyId = 'normal';
  private bossData!: BossData;
  private rootContainer!: Phaser.GameObjects.Container;
  private isAdvancing: boolean = false;

  constructor() {
    super('StageIntroScene');
  }

  init(data: { character?: CharacterData; stage?: number; difficulty?: DifficultyId }) {
    this.character = data?.character || CHARACTERS.billy;
    this.difficulty = normalizeDifficulty(data?.difficulty ?? difficultySettings.get());
    const urlParams = new URLSearchParams(window.location.search);
    const stageQuery = urlParams.get('stage');
    this.stage = data?.stage || (stageQuery ? parseInt(stageQuery, 10) : 1);
    this.bossData = getBossForStage(this.stage);
  }

  preload() {
    preloadPulp(this);
    if (!this.textures.exists('title_sky')) {
      preloadImages(this, ['title_sky']);
    }
    if (!this.textures.exists('title_landscape')) {
      preloadImages(this, ['title_landscape']);
    }
  }

  create() {
    this.isAdvancing = false;
    const { width, height } = this.scale;

    // Dark Background
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0503, 1);
    bg.fillRect(0, 0, width, height);

    // Reference Resolution Container (1536 x 1024)

    this.rootContainer = createMenuRoot(this);

    pulpBackdrop(this, this.rootContainer, false);

    // 1. Layer: Sunset Canyon Landscape
    this.createLandscapeView();

    // 2. Layer: Stage Header Title
    const title = new WesternTitle(this, {
      x: 0,
      y: -380,
      title: `★ STAGE ${this.stage} ★`,
      subtitle: this.bossData.stageTitle,
      width: 680,
      fontSize: '28px',
    });
    this.rootContainer.add(title);

    // 3. Layer: Lore Parchment Box
    this.createLoreParchment();

    // 4. Layer: Bottom Prompt
    this.createBottomPrompt();

    // 5. Input & Auto-transition
    this.setupInputs();

  }

  private createLandscapeView() {
    const frameContainer = this.add.container(0, -90);

    // Outer wooden frame for landscape
    const outerFrame = new WesternPanel(this, {
      x: 0,
      y: 0,
      width: 860,
      height: 440,
      variant: 'dark-saloon',
    });
    frameContainer.add(outerFrame);

    // Landscape image if available, else procedural gradient
    const landscapeKey = this.textures.exists('intro_landscape')
      ? 'intro_landscape'
      : this.textures.exists('title_landscape')
      ? 'title_landscape'
      : null;

    if (landscapeKey) {
      const landscape = this.add.image(0, 0, landscapeKey);
      landscape.setDisplaySize(820, 400);
      frameContainer.add(landscape);
    } else {
      const canyonGfx = this.add.graphics();
      canyonGfx.fillGradientStyle(0xff791c, 0xff791c, 0x572449, 0x120b08, 1);
      canyonGfx.fillRect(-410, -200, 820, 400);
      frameContainer.add(canyonGfx);
    }

    this.rootContainer.add(frameContainer);
  }

  private createLoreParchment() {
    const parchmentContainer = this.add.container(0, 230);

    const parchment = new WesternPanel(this, {
      x: 0,
      y: 0,
      width: 860,
      height: 200,
      variant: 'parchment',
    });
    parchmentContainer.add(parchment);

    // Lore Text
    const loreText = this.add.text(0, -32, this.bossData.lore, {
      fontFamily: THEME.typography.narrativeFont,
      fontSize: '20px',
      color: '#2b1d0c',
      align: 'center',
      wordWrap: { width: 780 },
      lineSpacing: 8,
    }).setOrigin(0.5);
    parchmentContainer.add(loreText);
    const stage = getStage(this.stage);
    parchmentContainer.add(this.add.text(0, 48,
      `SOBREVIVA ${Math.floor(stage.duration / 60)}:${String(stage.duration % 60).padStart(2, '0')} + BOSS
${stage.hazardLabel}
PROVISOES OPCIONAIS: LIMPE A AREA E SEGURE POR 8s`, {
        fontFamily: THEME.typography.pixelFont, fontSize: '10px', color: '#a51e16',
        align: 'center', lineSpacing: 8, wordWrap: { width: 800 },
      }).setOrigin(0.5));

    this.rootContainer.add(parchmentContainer);
  }

  private createBottomPrompt() {
    const promptContainer = this.add.container(0, 385);

    const bar = this.add.graphics();
    bar.fillStyle(0x1b120c, 0.95);
    bar.lineStyle(2, 0x8b5a2b, 1);
    bar.fillRoundedRect(-440, -28, 880, 56, 6);
    bar.strokeRoundedRect(-440, -28, 880, 56, 6);
    promptContainer.add(bar);

    const promptText = this.add.text(0, 0, '★ PRESS ENTER, SPACE OR CLICK TO DRAW BOUNTY ★', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '12px',
      color: '#ef4444',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    promptContainer.add(promptText);

    this.tweens.add({
      targets: promptText,
      alpha: 0.25,
      duration: 380,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.rootContainer.add(promptContainer);
  }

  private setupInputs() {
    const advance = () => this.advanceToBossWanted();

    // Auto proceed after 8 seconds if idle
    const timer = this.time.delayedCall(8000, advance);

    // 1000ms cooldown to prevent accidental skips from previous clicks
    this.time.delayedCall(1000, () => {
      if (this.isAdvancing) return;

      this.input.once('pointerdown', () => {
        timer.remove();
        advance();
      });
      this.input.keyboard?.once('keydown-SPACE', () => {
        timer.remove();
        advance();
      });
      this.input.keyboard?.once('keydown-ENTER', () => {
        timer.remove();
        advance();
      });
    });
  }

  private advanceToBossWanted() {
    if (this.isAdvancing) return;
    this.isAdvancing = true;

    // Shotgun / pistol sound as poster falls
    sounds.playPistolShot();
    this.cameras.main.flash(180, 255, 235, 170);
    this.cameras.main.fade(350, 0, 0, 0);

    this.time.delayedCall(380, () => {

      this.scene.start('WantedScene', {
        character: this.character,
        stage: this.stage,
        difficulty: this.difficulty,
      });
    });
  }

}
