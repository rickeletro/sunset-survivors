import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { CharacterData, CHARACTERS } from '../data/characters';
import { BossData, getBossForStage } from '../data/bosses';
import { THEME } from '../ui/theme/tokens';
import { WesternPanel } from '../ui/components/WesternPanel';
import { WesternTitle } from '../ui/components/WesternTitle';

export class StageIntroScene extends Phaser.Scene {
  private character!: CharacterData;
  private stage: number = 1;
  private bossData!: BossData;
  private rootContainer!: Phaser.GameObjects.Container;
  private isAdvancing: boolean = false;

  constructor() {
    super('StageIntroScene');
  }

  init(data: { character?: CharacterData; stage?: number }) {
    this.character = data?.character || CHARACTERS.billy;
    const urlParams = new URLSearchParams(window.location.search);
    const stageQuery = urlParams.get('stage');
    this.stage = data?.stage || (stageQuery ? parseInt(stageQuery, 10) : 1);
    this.bossData = getBossForStage(this.stage);
  }

  preload() {
    if (!this.textures.exists('title_sky')) {
      this.load.image('title_sky', 'assets/intro/title_sky.png');
    }
    if (!this.textures.exists('title_landscape')) {
      this.load.image('title_landscape', 'assets/intro/title_landscape.png');
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
    const REF_W = 1536;
    const REF_H = 1024;
    const scale = Math.min(width / REF_W, height / REF_H);

    this.rootContainer = this.add.container(width / 2, height / 2);
    this.rootContainer.setScale(scale);

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

    this.scale.on('resize', this.handleResize, this);
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

    // Masked Landscape Window
    const maskGfx = this.add.graphics();
    maskGfx.fillStyle(0xffffff, 1);
    maskGfx.fillRoundedRect(-410, -200, 820, 400, 6);
    frameContainer.add(maskGfx);

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

    // Mesa and silhouettes overlay
    const silhouettes = this.add.graphics();
    silhouettes.fillStyle(0x1a0a05, 0.85);
    // Draw mesas in the distance
    silhouettes.beginPath();
    silhouettes.moveTo(-410, 160);
    silhouettes.lineTo(-280, 80);
    silhouettes.lineTo(-120, 80);
    silhouettes.lineTo(-50, 140);
    silhouettes.lineTo(100, 60);
    silhouettes.lineTo(260, 60);
    silhouettes.lineTo(320, 130);
    silhouettes.lineTo(410, 110);
    silhouettes.lineTo(410, 200);
    silhouettes.lineTo(-410, 200);
    silhouettes.closePath();
    silhouettes.fillPath();

    // Cactus & Rider silhouettes
    silhouettes.fillStyle(0x0e0502, 1);
    silhouettes.fillRect(-410, 170, 820, 30);
    frameContainer.add(silhouettes);

    // Sun disc
    const sun = this.add.graphics();
    sun.fillStyle(0xffd54f, 0.9);
    sun.fillCircle(140, 10, 50);
    frameContainer.addAt(sun, 1);

    this.rootContainer.add(frameContainer);
  }

  private createLoreParchment() {
    const parchmentContainer = this.add.container(0, 230);

    const parchment = new WesternPanel(this, {
      x: 0,
      y: 0,
      width: 860,
      height: 140,
      variant: 'parchment',
    });
    parchmentContainer.add(parchment);

    // Lore Text
    const loreText = this.add.text(0, -6, this.bossData.lore, {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '13px',
      color: '#2b1d0c',
      align: 'center',
      wordWrap: { width: 780 },
      lineSpacing: 8,
    }).setOrigin(0.5);
    parchmentContainer.add(loreText);

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
      this.scale.off('resize', this.handleResize, this);
      this.scene.start('WantedScene', {
        character: this.character,
        stage: this.stage,
      });
    });
  }

  private handleResize() {
    if (!this.rootContainer || !this.scene.isActive()) return;
    const { width, height } = this.scale;
    const scale = Math.min(width / 1536, height / 1024);
    this.rootContainer.setPosition(width / 2, height / 2);
    this.rootContainer.setScale(scale);
  }
}
