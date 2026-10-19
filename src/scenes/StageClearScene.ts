import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { CharacterData, CHARACTERS } from '../data/characters';
import { statsManager } from '../data/GameStatsManager';
import { THEME } from '../ui/theme/tokens';
import { WesternButton } from '../ui/components/WesternButton';
import { WesternTitle } from '../ui/components/WesternTitle';
import { WesternPanel } from '../ui/components/WesternPanel';
import { ArcadeStatDisplay } from '../ui/components/ArcadeStatDisplay';

export interface StageClearData {
  character: CharacterData;
  stage: number;
  timeSurvivedSeconds: number;
  kills: number;
  bounty: number;
  level: number;
}

export class StageClearScene extends Phaser.Scene {
  private dataReceived!: StageClearData;
  private rootContainer!: Phaser.GameObjects.Container;
  private rank: 'S' | 'A' | 'B' | 'C' = 'A';

  constructor() {
    super('StageClearScene');
  }

  init(data?: Partial<StageClearData>) {
    this.dataReceived = {
      character: data?.character || CHARACTERS.billy,
      stage: data?.stage || 1,
      timeSurvivedSeconds: data?.timeSurvivedSeconds || 222,
      kills: data?.kills || 284,
      bounty: data?.bounty || 1350,
      level: data?.level || 5,
    };

    this.rank = statsManager.calculateRank(
      this.dataReceived.kills,
      this.dataReceived.timeSurvivedSeconds,
      1.0
    );

    // Save run progress
    statsManager.recordRun(
      {
        score: this.dataReceived.bounty * 10 + this.dataReceived.kills * 50,
        kills: this.dataReceived.kills,
        gold: this.dataReceived.bounty,
        timeSurvivedSeconds: this.dataReceived.timeSurvivedSeconds,
        stage: this.dataReceived.stage,
        stagesCleared: this.dataReceived.stage,
        level: this.dataReceived.level,
        characterId: this.dataReceived.character.id,
        rank: this.rank,
      },
      true
    );
  }

  create() {
    const { width, height } = this.scale;
    sounds.playLevelUp();

    // Dark Background
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0503, 1);
    bg.fillRect(0, 0, width, height);

    // Root Container
    const scale = Math.min(width / 1536, height / 1024);
    this.rootContainer = this.add.container(width / 2, height / 2);
    this.rootContainer.setScale(scale);

    // 1. Fiery Sunset Red Backdrop
    this.createSunsetBackdrop();

    // 2. Stage Clear Title Banner
    const title = new WesternTitle(this, {
      x: 0,
      y: -390,
      title: '★ STAGE CLEAR! ★',
      subtitle: `STAGE ${this.dataReceived.stage} LIBERATED • OUTLAW DEFEATED`,
      width: 780,
      fontSize: '34px',
      titleColor: '#ffc52a',
    });
    this.rootContainer.add(title);

    // 3. Heroic Gunslinger Silhouette (Left)
    this.createGunslingerSilhouette();

    // 4. Parchment Stats Card & Big Rank Badge (Right)
    this.createStatsCard();

    // 5. Action Buttons (NEXT STAGE & STATS)
    this.createActionButtons();

    this.scale.on('resize', this.handleResize, this);
  }

  private createSunsetBackdrop() {
    const backdrop = this.add.graphics();
    backdrop.fillGradientStyle(0xe52b20, 0xff791c, 0x572449, 0x120b08, 1);
    backdrop.fillRect(-700, -320, 1400, 640);

    // Distant mountain ridge
    backdrop.fillStyle(0x32140a, 0.9);
    backdrop.beginPath();
    backdrop.moveTo(-700, 200);
    backdrop.lineTo(-500, 60);
    backdrop.lineTo(-300, 140);
    backdrop.lineTo(-50, 40);
    backdrop.lineTo(150, 120);
    backdrop.lineTo(400, 20);
    backdrop.lineTo(700, 150);
    backdrop.lineTo(700, 320);
    backdrop.lineTo(-700, 320);
    backdrop.closePath();
    backdrop.fillPath();

    this.rootContainer.add(backdrop);
  }

  private createGunslingerSilhouette() {
    const silhouetteContainer = this.add.container(-380, 40);

    const charKey = `hero_${this.dataReceived.character.id}`;
    if (this.textures.exists(charKey)) {
      const hero = this.add.sprite(0, 0, charKey, 0);
      hero.setScale(3.5);
      hero.setTint(0x120804);
      silhouetteContainer.add(hero);
    } else {
      // Silhouette placeholder shape
      const sGfx = this.add.graphics();
      sGfx.fillStyle(0x120804, 1);
      sGfx.fillCircle(0, -90, 35); // Hat/Head
      sGfx.fillRect(-45, -55, 90, 130); // Torso
      sGfx.fillRect(-40, 75, 35, 90); // Left Leg
      sGfx.fillRect(5, 75, 35, 90); // Right Leg
      silhouetteContainer.add(sGfx);
    }

    this.rootContainer.add(silhouetteContainer);
  }

  private createStatsCard() {
    const cardContainer = this.add.container(180, 20);

    // Weathered Parchment Card
    const parchment = new WesternPanel(this, {
      x: 0,
      y: 0,
      width: 660,
      height: 380,
      variant: 'parchment',
    });
    cardContainer.add(parchment);

    // Format stats
    const mins = Math.floor(this.dataReceived.timeSurvivedSeconds / 60);
    const secs = this.dataReceived.timeSurvivedSeconds % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    const scoreVal = this.dataReceived.bounty * 10 + this.dataReceived.kills * 50;

    const statItems = [
      { label: 'STAGE SCORE:', value: scoreVal, valueColor: '#ffc52a' },
      { label: 'SURVIVAL TIME:', value: timeStr, valueColor: '#f5c518' },
      { label: 'BANDITS SLAIN:', value: this.dataReceived.kills, valueColor: '#ef4444' },
      { label: 'BOUNTY CLAIMED:', value: `$${this.dataReceived.bounty.toLocaleString()}`, valueColor: '#22c55e' },
      { label: 'VICTORY BONUS:', value: '$2,500', valueColor: '#38bdf8' },
    ];

    const statsDisplay = new ArcadeStatDisplay(this, -290, -110, statItems, 360, 42);
    cardContainer.add(statsDisplay);

    // Big Rank Badge (Right Side)
    const rankContainer = this.add.container(210, 0);

    const rankShield = this.add.graphics();
    rankShield.fillStyle(0x321b10, 0.95);
    rankShield.lineStyle(3, 0xffc52a, 1);
    rankShield.fillCircle(0, 0, 68);
    rankShield.strokeCircle(0, 0, 68);
    rankContainer.add(rankShield);

    const rankLabel = this.add.text(0, -38, 'RANK', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '11px',
      color: '#f2d49a',
    }).setOrigin(0.5);
    rankContainer.add(rankLabel);

    const rankColor = this.rank === 'S' ? '#ffc52a' : this.rank === 'A' ? '#22c55e' : '#38bdf8';
    const rankText = this.add.text(0, 8, this.rank, {
      fontFamily: THEME.typography.westernFont,
      fontSize: '68px',
      color: rankColor,
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5);
    rankContainer.add(rankText);

    // Rank pulse tween
    this.tweens.add({
      targets: rankContainer,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    cardContainer.add(rankContainer);
    this.rootContainer.add(cardContainer);
  }

  private createActionButtons() {
    const btnContainer = this.add.container(0, 360);

    const isCampaignComplete = this.dataReceived.stage >= 8;

    const nextBtnText = isCampaignComplete ? '★ VICTORY CELEBRATION ★' : '▶ NEXT STAGE (ENTER)';
    const nextBtn = new WesternButton(this, {
      x: -160,
      y: 0,
      width: 340,
      height: 56,
      text: nextBtnText,
      variant: 'gold',
      onClick: () => this.proceedNext(),
    });
    btnContainer.add(nextBtn);

    const statsBtn = new WesternButton(this, {
      x: 200,
      y: 0,
      width: 240,
      height: 56,
      text: '📊 STATS',
      variant: 'wood',
      onClick: () => this.openStats(),
    });
    btnContainer.add(statsBtn);

    this.rootContainer.add(btnContainer);

    this.input.keyboard?.once('keydown-ENTER', () => this.proceedNext());
    this.input.keyboard?.once('keydown-SPACE', () => this.proceedNext());
  }

  private proceedNext() {
    sounds.playRevolver();
    this.scale.off('resize', this.handleResize, this);

    if (this.dataReceived.stage >= 8) {
      // Completed final stage 8!
      this.scene.start('GameCompleteScene', {
        character: this.dataReceived.character,
        stage: this.dataReceived.stage,
        kills: this.dataReceived.kills,
        bounty: this.dataReceived.bounty,
        timeSurvivedSeconds: this.dataReceived.timeSurvivedSeconds,
      });
    } else {
      // Advance to next stage!
      this.scene.start('StageIntroScene', {
        character: this.dataReceived.character,
        stage: this.dataReceived.stage + 1,
      });
    }
  }

  private openStats() {
    sounds.playRevolver();
    this.scene.start('StatsScene', { fromScene: 'StageClearScene', prevData: this.dataReceived });
  }

  private handleResize() {
    if (!this.rootContainer || !this.scene.isActive()) return;
    const { width, height } = this.scale;
    const scale = Math.min(width / 1536, height / 1024);
    this.rootContainer.setPosition(width / 2, height / 2);
    this.rootContainer.setScale(scale);
  }
}
