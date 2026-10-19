import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { statsManager } from '../data/GameStatsManager';
import { THEME } from '../ui/theme/tokens';
import { WesternButton } from '../ui/components/WesternButton';
import { WesternTitle } from '../ui/components/WesternTitle';
import { WesternPanel } from '../ui/components/WesternPanel';
import { ArcadeStatDisplay } from '../ui/components/ArcadeStatDisplay';

export interface StatsSceneData {
  fromScene?: string;
  prevData?: unknown;
}

export class StatsScene extends Phaser.Scene {
  private fromScene: string = 'TitleScene';
  private prevData?: unknown;
  private rootContainer!: Phaser.GameObjects.Container;
  private currentTab: 'overview' | 'weapons' | 'enemies' | 'stages' = 'overview';
  private contentPanel!: Phaser.GameObjects.Container;

  constructor() {
    super('StatsScene');
  }

  init(data?: StatsSceneData) {
    if (data?.fromScene) {
      this.fromScene = data.fromScene;
      this.prevData = data.prevData;
    }
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

    // Saloon Wood Wall Backdrop
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
      title: '★ STATS ★',
      subtitle: 'CAREER BOUNTY RECORD & RECORDED ACCOMPLISHMENTS',
      width: 800,
      fontSize: '32px',
    });
    this.rootContainer.add(title);

    // Tab Navigation Bar
    this.createTabs();

    // Content container
    this.contentPanel = this.add.container(0, 40);
    this.rootContainer.add(this.contentPanel);
    this.renderCurrentTab();

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
    const tabs: Array<{ id: 'overview' | 'weapons' | 'enemies' | 'stages'; label: string }> = [
      { id: 'overview', label: 'OVERVIEW' },
      { id: 'weapons', label: 'WEAPONS' },
      { id: 'enemies', label: 'ENEMIES' },
      { id: 'stages', label: 'STAGES' },
    ];

    tabs.forEach((tab, i) => {
      const posX = -360 + i * 240;
      const isActive = this.currentTab === tab.id;

      const tabBtn = new WesternButton(this, {
        x: posX,
        y: 0,
        width: 210,
        height: 44,
        text: tab.label,
        variant: isActive ? 'danger' : 'wood',
        fontSize: '11px',
        onClick: () => {
          this.currentTab = tab.id;
          this.createTabs();
          this.renderCurrentTab();
        },
      });
      tabsContainer.add(tabBtn);
    });

    this.rootContainer.add(tabsContainer);
  }

  private renderCurrentTab() {
    this.contentPanel.removeAll(true);
    const s = statsManager.getStats();

    if (this.currentTab === 'overview') {
      // Left Parchment with Stats
      const parchment = new WesternPanel(this, {
        x: -180,
        y: 0,
        width: 680,
        height: 420,
        variant: 'parchment',
      });
      this.contentPanel.add(parchment);

      const mins = Math.floor(s.playTimeSeconds / 60);
      const secs = s.playTimeSeconds % 60;
      const playTimeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

      const items = [
        { label: 'TOTAL SCORE:', value: s.totalScore, valueColor: '#ffc52a' },
        { label: 'TOTAL KILLS:', value: s.totalKills, valueColor: '#ef4444' },
        { label: 'GOLD COLLECTED:', value: `$${s.goldCollected.toLocaleString()}`, valueColor: '#22c55e' },
        { label: 'PLAY TIME:', value: playTimeStr, valueColor: '#f5c518' },
        { label: 'STAGES CLEARED:', value: `${s.stagesCleared} / 8`, valueColor: '#38bdf8' },
        { label: 'DEATHS:', value: s.deaths, valueColor: '#e52b20' },
        { label: 'BEST STREAK:', value: s.bestStreak, valueColor: '#ffc52a' },
      ];

      const statsDisplay = new ArcadeStatDisplay(this, -480, -145, items, 600, 42);
      this.contentPanel.add(statsDisplay);

      // Right Gunslinger Showcase
      const rightFrame = new WesternPanel(this, {
        x: 360,
        y: 0,
        width: 320,
        height: 420,
        variant: 'wood',
      });
      this.contentPanel.add(rightFrame);

      if (this.textures.exists('hero_billy')) {
        const sprite = this.add.sprite(360, 0, 'hero_billy', 0).setScale(3.2);
        this.contentPanel.add(sprite);
      }

      const showcaseLabel = this.add.text(360, 160, '★ BILLY ★', {
        fontFamily: THEME.typography.pixelFont,
        fontSize: '12px',
        color: '#ffc52a',
      }).setOrigin(0.5);
      this.contentPanel.add(showcaseLabel);
    } else {
      // Weapons / Enemies / Stages Sub-view
      const parchment = new WesternPanel(this, {
        x: 0,
        y: 0,
        width: 1040,
        height: 420,
        variant: 'parchment',
      });
      this.contentPanel.add(parchment);

      let text = '';
      if (this.currentTab === 'weapons') {
        text = 'PRIMARY WEAPONS ARSENAL\n\n' +
               '• DUAL COLT .45 REVOLVERS: 250 RPM • High Agility\n' +
               '• TWIN PEACEMAKERS: Balanced Power • Fast Reload\n' +
               '• WINCHESTER REPEATER: Long Range • Armor Piercing\n' +
               '• SAWED-OFF SHOTGUN: 5-Pellet Spread • Heavy Knockback';
      } else if (this.currentTab === 'enemies') {
        text = 'OUTLAW FORCES RECORDED\n\n' +
               '• CANYON BANDITS: Basic foot soldiers with revolvers\n' +
               '• RATTLESNAKES: Fast crawling venomous ambushers\n' +
               '• DYNAMITERS: Explosive throwers with area denial\n' +
               '• HEAVY GATLING GUNNERS: Fortified armored suppressors';
      } else {
        text = 'CAMPAIGN STAGES\n\n' +
               'STAGES 1-8: Outlaw Canyon • Steam Train Ambush • Burning Town\n' +
               'Saloon Inferno • Caboose Showdown • Sacred Mountain Trail\n' +
               'Fortified Hacienda • The Final Manor Showdown\n\n' +
               `STATUS: ${s.stagesCleared} / 8 Stages Cleared!`;
      }

      const infoText = this.add.text(0, 0, text, {
        fontFamily: THEME.typography.pixelFont,
        fontSize: '12px',
        color: '#2b1d0c',
        align: 'center',
        lineSpacing: 10,
      }).setOrigin(0.5);
      this.contentPanel.add(infoText);
    }
  }

  private goBack() {
    sounds.playRevolver();
    this.scale.off('resize', this.handleResize, this);
    if (this.fromScene === 'StageClearScene' && this.prevData) {
      this.scene.start('StageClearScene', this.prevData);
    } else {
      this.scene.start('TitleScene');
    }
  }

  private handleResize() {
    if (!this.rootContainer || !this.scene.isActive()) return;
    const { width, height } = this.scale;
    const scale = Math.min(width / 1536, height / 1024);
    this.rootContainer.setPosition(width / 2, height / 2);
    this.rootContainer.setScale(scale);
  }
}
