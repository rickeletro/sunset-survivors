import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { CharacterData } from '../data/characters';
import { THEME } from '../ui/theme/tokens';

export interface GameOverStats {
  victory: boolean;
  character: CharacterData;
  timeSurvivedSeconds: number;
  kills: number;
  bounty: number;
  level: number;
}

export class GameOverScene extends Phaser.Scene {
  private stats!: GameOverStats;

  constructor() {
    super('GameOverScene');
  }

  init(data: GameOverStats) {
    this.stats = data;
  }

  create() {
    const { width, height } = this.scale;
    sounds.stopBGM();

    if (this.stats.victory) {
      sounds.playLevelUp();
    } else {
      sounds.playHit();
    }

    // Dark Saloon Backdrop
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0503, 1);
    bg.fillRect(0, 0, width, height);

    // Weathered Parchment Card
    const cardW = 600;
    const cardH = 460;
    const cardX = (width - cardW) / 2;
    const cardY = (height - cardH) / 2;

    const parchment = this.add.graphics();
    parchment.fillStyle(0x000000, 0.7);
    parchment.fillRoundedRect(cardX + 6, cardY + 6, cardW, cardH, 8);
    parchment.fillStyle(0x452b14, 1);
    parchment.fillRoundedRect(cardX, cardY, cardW, cardH, 8);
    parchment.fillStyle(0xe8c48a, 1);
    parchment.fillRoundedRect(cardX + 4, cardY + 4, cardW - 8, cardH - 8, 6);
    parchment.lineStyle(2, 0x8b5a2b, 0.8);
    parchment.strokeRect(cardX + 16, cardY + 16, cardW - 32, cardH - 32);

    // Header Title
    const title = this.stats.victory ? '★ BOUNTY CLAIMED! ★' : '☠ AMBUSHED IN THE CANYON ☠';
    const titleColor = this.stats.victory ? '#16a34a' : '#c81d1d';

    this.add.text(width / 2, cardY + 50, title, {
      fontFamily: THEME.typography.westernFont,
      fontSize: '32px',
      color: titleColor,
      stroke: '#452b14',
      strokeThickness: 3,
    }).setOrigin(0.5);

    const sub = this.stats.victory
      ? 'SIMON GREEDWELL BROUGHT TO JUSTICE!'
      : `${this.stats.character.name} FELL BEFORE THE BANDIT HORDE`;

    this.add.text(width / 2, cardY + 95, sub, {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '11px',
      color: '#78350f',
    }).setOrigin(0.5);

    // Stats Grid
    const mins = Math.floor(this.stats.timeSurvivedSeconds / 60);
    const secs = this.stats.timeSurvivedSeconds % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    const statRows = [
      { label: 'GUNSLINGER:', val: this.stats.character.name, color: this.stats.character.primaryColor },
      { label: 'TIME SURVIVED:', val: timeStr, color: '#f5c518' },
      { label: 'BANDITS SLAIN:', val: `${this.stats.kills}`, color: '#ef4444' },
      { label: 'LEVEL REACHED:', val: `LV. ${this.stats.level}`, color: '#38bdf8' },
      { label: 'BOUNTY EARNED:', val: `$${this.stats.bounty.toLocaleString()}`, color: '#22c55e' },
    ];

    statRows.forEach((row, i) => {
      const rowY = cardY + 145 + i * 36;
      this.add.text(cardX + 60, rowY, row.label, {
        fontFamily: THEME.typography.pixelFont,
        fontSize: '13px',
        color: '#2b1d0c',
      });
      this.add.text(cardX + cardW - 60, rowY, row.val, {
        fontFamily: THEME.typography.pixelFont,
        fontSize: '13px',
        color: row.color,
        stroke: '#000',
        strokeThickness: 2,
      }).setOrigin(1, 0);
    });

    // Action Buttons
    const btnY = cardY + cardH - 55;

    // Retry Button
    const retryBtn = this.add.text(cardX + 160, btnY, '▶ RETRY (R)', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#15803d',
      padding: { x: 16, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    retryBtn.on('pointerdown', () => this.retry());

    // Select New Hunter Button
    const selectBtn = this.add.text(cardX + cardW - 160, btnY, '★ NEW HUNTER (C)', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#b45309',
      padding: { x: 16, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    selectBtn.on('pointerdown', () => this.changeHunter());

    this.input.keyboard?.on('keydown-R', () => this.retry());
    this.input.keyboard?.on('keydown-C', () => this.changeHunter());
    this.input.keyboard?.on('keydown-SPACE', () => this.retry());
    this.input.keyboard?.on('keydown-ENTER', () => this.retry());
  }

  private retry() {
    sounds.playRevolver();
    sounds.startBGM();
    this.scene.start('GameScene', { character: this.stats.character });
  }

  private changeHunter() {
    sounds.playRevolver();
    sounds.playIntroMusic();
    this.scene.start('CharacterSelectScene');
  }
}
