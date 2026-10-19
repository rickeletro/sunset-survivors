import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { CharacterData, CHARACTERS } from '../data/characters';
import { BOSSES, BossData, getBossForStage } from '../data/bosses';
import { THEME } from '../ui/theme/tokens';

export class WantedScene extends Phaser.Scene {
  private character!: CharacterData;
  private stage: number = 1;
  private bossData!: BossData;
  private rootContainer!: Phaser.GameObjects.Container;
  private isAdvancing: boolean = false;

  constructor() {
    super('WantedScene');
  }

  init(data: { character?: CharacterData; stage?: number }) {
    this.character = data?.character || CHARACTERS.billy;
    const urlParams = new URLSearchParams(window.location.search);
    const stageQuery = urlParams.get('stage');
    this.stage = data?.stage || (stageQuery ? parseInt(stageQuery, 10) : 1);
    this.bossData = getBossForStage(this.stage);
  }

  preload() {
    // Preload all 8 boss posters
    BOSSES.forEach((boss) => {
      this.load.image(boss.posterKey, boss.posterPath);
    });

    // Ensure decor assets are available
    if (!this.textures.exists('decor_spark')) {
      this.load.image('decor_spark', 'assets/decor/gold_spark.png');
    }
    if (!this.textures.exists('decor_lantern')) {
      this.load.image('decor_lantern', 'assets/decor/hanging_lantern.png');
    }
  }

  create() {
    this.isAdvancing = false;
    const { width, height } = this.scale;

    // 1. Dark Screen Background
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0503, 1);
    bg.fillRect(0, 0, width, height);

    // 2. Reference Resolution Container (1536 x 1024)
    const REF_W = 1536;
    const REF_H = 1024;
    const scale = Math.min(width / REF_W, height / REF_H);

    this.rootContainer = this.add.container(width / 2, height / 2);
    this.rootContainer.setScale(scale);

    // 3. Assemble Visual Layers
    this.createSaloonBackdrop();
    this.createAtmosphericLighting();
    this.createStageHeader();
    this.createBossPosterPresentation();
    this.createHunterPrompt();

    // 4. Input & Auto-advance Handling
    this.setupInputs();

    // 5. Handle Window Resizing
    this.scale.on('resize', this.handleResize, this);
  }

  // -------------------------------------------------------------
  // LAYER 1: SALOON WOODEN WALL BACKDROP
  // -------------------------------------------------------------
  private createSaloonBackdrop() {
    const wallGfx = this.add.graphics();

    // Deep rich wood planks
    wallGfx.fillStyle(0x23140a, 1);
    wallGfx.fillRect(-768, -512, 1536, 1024);

    // Planks lines & grain textures
    wallGfx.lineStyle(3, 0x140a05, 0.9);
    for (let y = -512; y <= 512; y += 48) {
      wallGfx.lineBetween(-768, y, 768, y);
    }

    // Vertical seam offsets
    wallGfx.lineStyle(2, 0x120804, 0.6);
    for (let y = -512; y < 512; y += 96) {
      for (let x = -700; x <= 700; x += 320) {
        const jitterX = x + ((y / 96) % 2 === 0 ? 0 : 160);
        wallGfx.lineBetween(jitterX, y, jitterX, y + 48);
      }
    }

    // Heavy dark vignette edges
    const vignette = this.add.graphics();
    vignette.fillStyle(0x000000, 0.45);
    vignette.fillRect(-768, -512, 180, 1024);
    vignette.fillRect(588, -512, 180, 1024);
    vignette.fillRect(-768, -512, 1536, 120);
    vignette.fillRect(-768, 392, 1536, 120);

    this.rootContainer.add(wallGfx);
    this.rootContainer.add(vignette);
  }

  // -------------------------------------------------------------
  // LAYER 2: LANTERNS & AMBIENT GLOW
  // -------------------------------------------------------------
  private createAtmosphericLighting() {
    // Generate radial glow texture if not existing
    if (!this.textures.exists('wanted_lantern_glow')) {
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
      this.textures.addCanvas('wanted_lantern_glow', canvas);
    }

    const lanterns = [
      { x: -580, y: -260 },
      { x: 580, y: -260 },
    ];

    lanterns.forEach((coord, i) => {
      // Glow
      const glow = this.add.image(coord.x, coord.y, 'wanted_lantern_glow');
      glow.setScale(2.2);
      glow.setBlendMode(Phaser.BlendModes.ADD);
      glow.setAlpha(0.65);
      this.rootContainer.add(glow);

      this.tweens.add({
        targets: glow,
        alpha: { from: 0.45, to: 0.85 },
        scale: { from: 2.1, to: 2.35 },
        duration: 200 + i * 80,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    // Ambient floating dust particles
    for (let i = 0; i < 15; i++) {
      const speck = this.add.graphics();
      speck.fillStyle(0xf5d6a1, Phaser.Math.FloatBetween(0.2, 0.5));
      speck.fillCircle(0, 0, Phaser.Math.Between(2, 4));
      speck.setPosition(Phaser.Math.Between(-650, 650), Phaser.Math.Between(-400, 400));
      this.rootContainer.add(speck);

      this.tweens.add({
        targets: speck,
        x: speck.x + Phaser.Math.Between(150, 300),
        y: speck.y - Phaser.Math.Between(20, 60),
        alpha: 0,
        duration: Phaser.Math.Between(3000, 6000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000),
      });
    }
  }

  // -------------------------------------------------------------
  // LAYER 3: STAGE & BOSS HEADER BANNER
  // -------------------------------------------------------------
  private createStageHeader() {
    const bannerContainer = this.add.container(0, -425);

    // Carved wood backing plate
    const plate = this.add.graphics();
    plate.fillStyle(0x321b10, 0.95);
    plate.lineStyle(3, 0xffc52a, 1);
    plate.fillRoundedRect(-420, -32, 840, 64, 8);
    plate.strokeRoundedRect(-420, -32, 840, 64, 8);

    // Brass corner studs
    plate.fillStyle(0xffc52a, 1);
    [-405, 405].forEach((x) => {
      plate.fillCircle(x, -17, 4);
      plate.fillCircle(x, 17, 4);
    });
    bannerContainer.add(plate);

    // Stage Title
    const stageTitle = this.add.text(0, 0, `★ ${this.bossData.stageName} ★`, {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '18px',
      color: '#ffc52a',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    bannerContainer.add(stageTitle);

    this.rootContainer.add(bannerContainer);
  }

  // -------------------------------------------------------------
  // LAYER 4: BOSS WANTED POSTER SLAM & BULLET HOLES
  // -------------------------------------------------------------
  private createBossPosterPresentation() {
    const posterW = 480;
    const posterH = 640;
    const targetY = -35;

    // Poster Container
    const posterContainer = this.add.container(0, targetY);

    // Soft drop shadow on wooden wall
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.65);
    shadow.fillRoundedRect(-posterW / 2 + 14, -posterH / 2 + 18, posterW, posterH, 8);
    posterContainer.add(shadow);

    // Boss Poster Image
    const poster = this.add.image(0, 0, this.bossData.posterKey);
    poster.setDisplaySize(posterW, posterH);
    posterContainer.add(poster);

    // Initial state for dramatic slam
    posterContainer.setScale(2.2);
    posterContainer.setAlpha(0);
    this.rootContainer.add(posterContainer);

    // Slam Animation: Flies down and impacts with camera shake & shotgun roar
    this.tweens.add({
      targets: posterContainer,
      scaleX: 1.0,
      scaleY: 1.0,
      alpha: 1.0,
      duration: 500,
      ease: 'Power3.easeOut',
      onComplete: () => {
        // 1. Pistol Shot Sound on Slam & Camera Shake
        sounds.playPistolShot();
        this.cameras.main.shake(140, 0.012);

        // 2. Flying wood dust & spark particles
        this.spawnImpactParticles(0, targetY);

        // 3. Bullet Hole Shots Sequence on Poster (Pinning 4 corners)
        const bulletHolesData = [
          { x: -170, y: -240, delay: 320 }, // Top left nail shot
          { x: 170, y: -240, delay: 640 },  // Top right nail shot
          { x: 170, y: 240, delay: 960 },   // Bottom right ricochet
          { x: -170, y: 240, delay: 1280 }, // Bottom left nail shot
        ];

        bulletHolesData.forEach((hole) => {
          this.time.delayedCall(hole.delay, () => {
            if (this.isAdvancing) return;
            sounds.playRevolver();
            this.time.delayedCall(40, () => sounds.playRicochet());
            this.cameras.main.shake(80, 0.005);
            this.createBulletHole(hole.x, hole.y + targetY);
            this.spawnImpactParticles(hole.x, hole.y + targetY);
          });
        });
      },
    });
  }

  // -------------------------------------------------------------
  // LAYER 5: HUNTER PROMPT & CONTROLS
  // -------------------------------------------------------------
  private createHunterPrompt() {
    const bottomContainer = this.add.container(0, 395);

    // Plaque background
    const bar = this.add.graphics();
    bar.fillStyle(0x1b120c, 0.95);
    bar.lineStyle(2, 0x8b5a2b, 1);
    bar.fillRoundedRect(-460, -32, 920, 64, 6);
    bar.strokeRoundedRect(-460, -32, 920, 64, 6);
    bottomContainer.add(bar);

    // Hunter & Draw instruction
    const hunterText = this.add.text(0, -8, `BOUNTY HUNTER: ${this.character.name.toUpperCase()}`, {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '13px',
      color: '#ffe066',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    bottomContainer.add(hunterText);

    const promptText = this.add.text(0, 14, 'PRESS ENTER, SPACE OR CLICK TO DRAW!', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '11px',
      color: '#ef4444',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    bottomContainer.add(promptText);

    // Pulsing arcade blink
    this.tweens.add({
      targets: promptText,
      alpha: 0.25,
      duration: 380,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.rootContainer.add(bottomContainer);
  }

  // -------------------------------------------------------------
  // BULLET HOLES & IMPACT PARTICLES
  // -------------------------------------------------------------
  private createBulletHole(x: number, y: number) {
    const hole = this.add.graphics();
    // Dark charred center
    hole.fillStyle(0x000000, 1);
    hole.fillCircle(x, y, 7);
    // Burnt wood rim
    hole.fillStyle(0x180b05, 0.9);
    hole.fillCircle(x, y, 10);
    // Splintered wood edge
    hole.lineStyle(2, 0xb45309, 0.85);
    hole.strokeCircle(x, y, 14);
    this.rootContainer.add(hole);
  }

  private spawnImpactParticles(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      const p = this.add.graphics();
      p.fillStyle(Phaser.Math.RND.pick([0xffc52a, 0xff791c, 0xf2d49a]), 1);
      p.fillCircle(0, 0, Phaser.Math.Between(2, 4));
      p.setPosition(x, y);
      this.rootContainer.add(p);

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(25, 75);

      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(250, 450),
        onComplete: () => p.destroy(),
      });
    }
  }

  // -------------------------------------------------------------
  // INPUT HANDLING & ADVANCE TO GAME
  // -------------------------------------------------------------
  private setupInputs() {
    // Only allow drawing/advancing after the poster slams down (600ms)
    this.time.delayedCall(600, () => {
      if (this.isAdvancing) return;
      const advance = () => this.advanceToGame();

      this.input.once('pointerdown', advance);
      this.input.keyboard?.once('keydown-SPACE', advance);
      this.input.keyboard?.once('keydown-ENTER', advance);
    });

    // Auto proceed after 10 seconds if player remains idle
    this.time.delayedCall(10000, () => this.advanceToGame());
  }

  private advanceToGame() {
    if (this.isAdvancing) return;
    this.isAdvancing = true;

    // Gun Reload SFX
    sounds.playGunReload();

    // Start fast western galloping gameplay music
    sounds.playGameplayMusic();

    // Golden Arcade Screen Flash
    this.cameras.main.flash(200, 255, 235, 170);
    this.cameras.main.fade(450, 0, 0, 0);

    this.time.delayedCall(500, () => {
      this.scale.off('resize', this.handleResize, this);
      this.scene.start('GameScene', {
        character: this.character,
        stage: this.stage,
      });
    });
  }

  // -------------------------------------------------------------
  // RESPONSIVE SCALING HANDLER
  // -------------------------------------------------------------
  private handleResize() {
    if (!this.rootContainer || !this.scene.isActive()) return;
    const { width, height } = this.scale;
    const scale = Math.min(width / 1536, height / 1024);
    this.rootContainer.setPosition(width / 2, height / 2);
    this.rootContainer.setScale(scale);
  }
}
