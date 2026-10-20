import { createMenuRoot } from '../ui/layout/menuLayout';
import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { CharacterData, CHARACTERS } from '../data/characters';
import { statsManager } from '../data/GameStatsManager';
import { THEME } from '../ui/theme/tokens';
import { WesternButton } from '../ui/components/WesternButton';
import { WesternTitle } from '../ui/components/WesternTitle';
import { WesternPanel } from '../ui/components/WesternPanel';
import { ArcadeStatDisplay } from '../ui/components/ArcadeStatDisplay';

export interface GameOverStats {
  victory?: boolean;
  character: CharacterData;
  timeSurvivedSeconds: number;
  kills: number;
  bounty: number;
  level: number;
  stage?: number;
}

export class GameOverScene extends Phaser.Scene {
  private stats!: GameOverStats;
  private rootContainer!: Phaser.GameObjects.Container;

  constructor() {
    super('GameOverScene');
  }

  init(data?: Partial<GameOverStats>) {
    this.stats = {
      character: data?.character || CHARACTERS.billy,
      stage: data?.stage || 1,
      timeSurvivedSeconds: data?.timeSurvivedSeconds || 145,
      kills: data?.kills || 92,
      bounty: data?.bounty || 450,
      level: data?.level || 3,
    };

    statsManager.recordRun(
      {
        score: this.stats.bounty * 10 + this.stats.kills * 50,
        kills: this.stats.kills,
        gold: this.stats.bounty,
        timeSurvivedSeconds: this.stats.timeSurvivedSeconds,
        stage: this.stats.stage || 1,
        stagesCleared: 0,
        level: this.stats.level,
        characterId: this.stats.character.id,
        rank: 'D',
      },
      false
    );
  }

  create() {
    const { width, height } = this.scale;
    sounds.stopBGM();
    sounds.playHit();

    // Dark screen background
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0503, 1);
    bg.fillRect(0, 0, width, height);

    // Root Container (1536 x 1024)
    this.rootContainer = createMenuRoot(this);

    // 1. Ominous Crimson Sunset & Cemetery Silhouettes
    this.createCemeteryBackdrop();

    // 2. YOU DIED! Title Header
    const title = new WesternTitle(this, {
      x: 0,
      y: -390,
      title: '☠ YOU DIED! ☠',
      subtitle: `${this.stats.character.name} FELL BEFORE THE OUTLAW HORDE`,
      width: 780,
      fontSize: '40px',
      titleColor: '#e52b20',
    });
    this.rootContainer.add(title);

    // 3. Fallen Hat & Vulture Silhouette (Left Side)
    this.createGraveAndHat();

    // 4. Parchment Stats Card (Right Side)
    this.createStatsCard();

    // 5. Action Buttons (RETRY & BACK TO TITLE)
    this.createActionButtons();

    // 6. Atmospheric dust & floating red embers
    this.createAmbientEmbers();

  }

  private createCemeteryBackdrop() {
    const backdrop = this.add.graphics();
    // Blood red dusk gradient
    backdrop.fillGradientStyle(0x7f1d1d, 0x450a0a, 0x1f0606, 0x0a0303, 1);
    backdrop.fillRect(-700, -320, 1400, 640);

    // Dark graveyard hills
    backdrop.fillStyle(0x0f0505, 0.95);
    backdrop.beginPath();
    backdrop.moveTo(-700, 180);
    backdrop.lineTo(-500, 120);
    backdrop.lineTo(-320, 160);
    backdrop.lineTo(-100, 90);
    backdrop.lineTo(150, 150);
    backdrop.lineTo(400, 110);
    backdrop.lineTo(700, 190);
    backdrop.lineTo(700, 320);
    backdrop.lineTo(-700, 320);
    backdrop.closePath();
    backdrop.fillPath();

    this.rootContainer.add(backdrop);
  }

  private createGraveAndHat() {
    const graveContainer = this.add.container(-380, 40);

    const gGfx = this.add.graphics();
    gGfx.fillStyle(0x0a0302, 1);

    // Wooden cross grave
    gGfx.fillRect(-8, -120, 16, 180); // vertical post
    gGfx.fillRect(-45, -80, 90, 16);  // cross bar

    // Vulture perched on cross
    gGfx.fillCircle(12, -145, 12); // head
    gGfx.fillRect(-6, -135, 24, 25); // body

    // Fallen cowboy hat on ground
    gGfx.fillStyle(0x5c2b14, 1);
    gGfx.fillEllipse(-20, 80, 90, 24); // brim
    gGfx.fillRoundedRect(-45, 52, 50, 28, 6); // crown

    graveContainer.add(gGfx);
    this.rootContainer.add(graveContainer);
  }

  private createStatsCard() {
    const cardContainer = this.add.container(180, 20);

    const parchment = new WesternPanel(this, {
      x: 0,
      y: 0,
      width: 660,
      height: 380,
      variant: 'parchment',
    });
    cardContainer.add(parchment);

    // Format stats
    const mins = Math.floor(this.stats.timeSurvivedSeconds / 60);
    const secs = this.stats.timeSurvivedSeconds % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    const statItems = [
      { label: 'GUNSLINGER:', value: this.stats.character.name, valueColor: this.stats.character.primaryColor },
      { label: 'STAGE REACHED:', value: `STAGE ${this.stats.stage || 1}`, valueColor: '#ffc52a' },
      { label: 'TIME SURVIVED:', value: timeStr, valueColor: '#f5c518' },
      { label: 'BANDITS SLAIN:', value: this.stats.kills, valueColor: '#ef4444' },
      { label: 'LEVEL REACHED:', value: `LV. ${this.stats.level}`, valueColor: '#38bdf8' },
      { label: 'BOUNTY LOST:', value: `$${this.stats.bounty.toLocaleString()}`, valueColor: '#ef4444' },
    ];

    const statsDisplay = new ArcadeStatDisplay(this, -290, -115, statItems, 580, 38);
    cardContainer.add(statsDisplay);

    this.rootContainer.add(cardContainer);
  }

  private createActionButtons() {
    const btnContainer = this.add.container(0, 360);

    const retryBtn = new WesternButton(this, {
      x: -160,
      y: 0,
      width: 280,
      height: 56,
      text: '▶ RETRY (R)',
      variant: 'danger',
      onClick: () => this.retry(),
    });
    btnContainer.add(retryBtn);

    const titleBtn = new WesternButton(this, {
      x: 160,
      y: 0,
      width: 280,
      height: 56,
      text: '⌂ BACK TO TITLE',
      variant: 'wood',
      onClick: () => this.returnToTitle(),
    });
    btnContainer.add(titleBtn);

    // Flavour text
    const quote = this.add.text(0, 58, '"ANOTHER GUNSLINGER FALLS TO THE PRAIRIE DUST..."', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '11px',
      color: '#e52b20',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    btnContainer.add(quote);

    this.rootContainer.add(btnContainer);

    this.input.keyboard?.on('keydown-R', () => this.retry());
    this.input.keyboard?.on('keydown-SPACE', () => this.retry());
    this.input.keyboard?.on('keydown-ENTER', () => this.retry());
  }

  private createAmbientEmbers() {
    for (let i = 0; i < 16; i++) {
      const ember = this.add.graphics();
      ember.fillStyle(Phaser.Math.RND.pick([0xef4444, 0xf97316, 0xffc52a]), 0.8);
      ember.fillCircle(0, 0, Phaser.Math.Between(2, 4));
      ember.setPosition(Phaser.Math.Between(-600, 600), Phaser.Math.Between(100, 400));
      this.rootContainer.add(ember);

      this.tweens.add({
        targets: ember,
        y: ember.y - Phaser.Math.Between(180, 350),
        x: ember.x + Phaser.Math.Between(-60, 60),
        alpha: 0,
        duration: Phaser.Math.Between(2200, 4000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
      });
    }
  }

  private retry() {
    sounds.playGunReload();
    sounds.playGameplayMusic();

    this.scene.start('WantedScene', {
      character: this.stats.character,
      stage: this.stats.stage || 1,
    });
  }

  private returnToTitle() {
    sounds.playRevolver();
    sounds.playIntroMusic();

    this.scene.start('TitleScene');
  }

}
