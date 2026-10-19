import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { BOSSES } from '../data/bosses';
import { statsManager } from '../data/GameStatsManager';
import { THEME } from '../ui/theme/tokens';
import { WesternButton } from '../ui/components/WesternButton';
import { WesternTitle } from '../ui/components/WesternTitle';
import { WesternPanel } from '../ui/components/WesternPanel';

export class UnlockablesScene extends Phaser.Scene {
  private rootContainer!: Phaser.GameObjects.Container;
  private currentTab: 'characters' | 'artwork' | 'extras' = 'characters';
  private gridContainer!: Phaser.GameObjects.Container;

  constructor() {
    super('UnlockablesScene');
  }

  create() {
    const { width, height } = this.scale;

    // Dark Background
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0503, 1);
    bg.fillRect(0, 0, width, height);

    // Root Container
    const scale = Math.min(width / 1536, height / 1024);
    this.rootContainer = this.add.container(width / 2, height / 2);
    this.rootContainer.setScale(scale);

    // Saloon Wood Wall
    const wall = new WesternPanel(this, {
      x: 0,
      y: 0,
      width: 1200,
      height: 720,
      variant: 'dark-saloon',
    });
    this.rootContainer.add(wall);

    // Title Header
    const title = new WesternTitle(this, {
      x: 0,
      y: -310,
      title: '★ UNLOCKABLES ★',
      subtitle: 'DISCOVER SECRET BOUNTIES, GUNSLINGERS & GALLERY ARTWORK',
      width: 820,
      fontSize: '32px',
    });
    this.rootContainer.add(title);

    // Tabs
    this.createTabs();

    // Grid Container
    this.gridContainer = this.add.container(0, 40);
    this.rootContainer.add(this.gridContainer);
    this.renderGrid();

    // Footer Back Button
    const backBtn = new WesternButton(this, {
      x: 0,
      y: 310,
      width: 240,
      height: 52,
      text: '◀ BACK (ESC)',
      variant: 'gold',
      onClick: () => this.goBack(),
    });
    this.rootContainer.add(backBtn);

    this.input.keyboard?.once('keydown-ESC', () => this.goBack());

    this.scale.on('resize', this.handleResize, this);
  }

  private createTabs() {
    const tabsContainer = this.add.container(0, -220);
    const tabs: Array<{ id: 'characters' | 'artwork' | 'extras'; label: string }> = [
      { id: 'characters', label: 'CHARACTERS' },
      { id: 'artwork', label: 'ARTWORK' },
      { id: 'extras', label: 'EXTRAS' },
    ];

    tabs.forEach((tab, i) => {
      const posX = -260 + i * 260;
      const isActive = this.currentTab === tab.id;

      const tabBtn = new WesternButton(this, {
        x: posX,
        y: 0,
        width: 230,
        height: 44,
        text: tab.label,
        variant: isActive ? 'danger' : 'wood',
        fontSize: '11px',
        onClick: () => {
          this.currentTab = tab.id;
          this.createTabs();
          this.renderGrid();
        },
      });
      tabsContainer.add(tabBtn);
    });

    this.rootContainer.add(tabsContainer);
  }

  private renderGrid() {
    this.gridContainer.removeAll(true);
    const stats = statsManager.getStats();

    if (this.currentTab === 'characters') {
      const heroes = [
        { id: 'steve', name: 'STEVE', unlocked: true },
        { id: 'billy', name: 'BILLY', unlocked: true },
        { id: 'bob', name: 'BOB', unlocked: true },
        { id: 'cormano', name: 'CORMANO', unlocked: true },
        { id: 'secret1', name: 'SECRET', unlocked: stats.stagesCleared >= 4 },
        { id: 'secret2', name: 'SECRET', unlocked: stats.stagesCleared >= 8 },
      ];

      heroes.forEach((h, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const cardX = -320 + col * 320;
        const cardY = -90 + row * 190;

        const card = new WesternPanel(this, {
          x: cardX,
          y: cardY,
          width: 280,
          height: 160,
          variant: h.unlocked ? 'parchment' : 'dark-saloon',
        });
        this.gridContainer.add(card);

        if (h.unlocked) {
          const spriteKey = `hero_${h.id}`;
          if (this.textures.exists(spriteKey)) {
            const spr = this.add.sprite(cardX - 60, cardY, spriteKey, 0).setScale(1.8);
            this.gridContainer.add(spr);
          }
          const label = this.add.text(cardX + 40, cardY, h.name, {
            fontFamily: THEME.typography.pixelFont,
            fontSize: '14px',
            color: '#2b1d0c',
          }).setOrigin(0.5);
          this.gridContainer.add(label);
        } else {
          const lockText = this.add.text(cardX, cardY - 10, '?', {
            fontFamily: THEME.typography.westernFont,
            fontSize: '44px',
            color: '#8b5a2b',
          }).setOrigin(0.5);
          this.gridContainer.add(lockText);

          const hint = this.add.text(cardX, cardY + 35, 'LOCKED', {
            fontFamily: THEME.typography.pixelFont,
            fontSize: '10px',
            color: '#ff791c',
          }).setOrigin(0.5);
          this.gridContainer.add(hint);
        }
      });
    } else {
      // Artwork / Bosses Gallery
      BOSSES.forEach((boss, idx) => {
        const col = idx % 4;
        const row = Math.floor(idx / 4);
        const cardX = -390 + col * 260;
        const cardY = -80 + row * 180;

        const isUnlocked = stats.unlockedBosses.includes(boss.stage) || boss.stage === 1;

        const card = new WesternPanel(this, {
          x: cardX,
          y: cardY,
          width: 230,
          height: 150,
          variant: isUnlocked ? 'parchment' : 'dark-saloon',
        });
        this.gridContainer.add(card);

        if (isUnlocked && this.textures.exists(boss.posterKey)) {
          const poster = this.add.image(cardX, cardY, boss.posterKey);
          poster.setDisplaySize(120, 140);
          this.gridContainer.add(poster);
        } else {
          const lock = this.add.text(cardX, cardY, `STAGE ${boss.stage}\n?`, {
            fontFamily: THEME.typography.pixelFont,
            fontSize: '11px',
            color: '#603719',
            align: 'center',
          }).setOrigin(0.5);
          this.gridContainer.add(lock);
        }
      });
    }
  }

  private goBack() {
    sounds.playRevolver();
    this.scale.off('resize', this.handleResize, this);
    this.scene.start('TitleScene');
  }

  private handleResize() {
    if (!this.rootContainer || !this.scene.isActive()) return;
    const { width, height } = this.scale;
    const scale = Math.min(width / 1536, height / 1024);
    this.rootContainer.setPosition(width / 2, height / 2);
    this.rootContainer.setScale(scale);
  }
}
