import { preloadImages } from '../assets/registry';
import { preloadPulp, pulpBackdrop, pulpHeading, pulpText, pulpButton, bindPulpKeys } from '../ui/layout/pulpSceneKit';
import { createMenuRoot } from '../ui/layout/menuLayout';
import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { BOSSES } from '../data/bosses';
import { statsManager } from '../data/GameStatsManager';
import { WesternButton } from '../ui/components/WesternButton';

export class UnlockablesScene extends Phaser.Scene {
  private fromScene = 'TitleScene';
  init(data?: { fromScene?: string }) { this.fromScene = data?.fromScene ?? 'TitleScene'; }
  private rootContainer!: Phaser.GameObjects.Container;
  private currentTab: 'characters' | 'artwork' | 'extras' = 'characters';
  private tabButtons: WesternButton[] = [];
  private gridContainer!: Phaser.GameObjects.Container;

  constructor() {
    super('UnlockablesScene');
  }

  preload() {
    preloadPulp(this);
    preloadImages(this, [...BOSSES.map(boss => boss.posterKey), 'poster_steve', 'poster_billy', 'poster_bob', 'poster_cormano']);
  }

  create() {
    this.rootContainer = createMenuRoot(this);
    pulpBackdrop(this, this.rootContainer, true);
    pulpHeading(this, this.rootContainer, 'UNLOCKABLES', -400, 1120, 70, true);
    this.gridContainer = this.add.container(0, 20); this.rootContainer.add(this.gridContainer);
    this.tabButtons = [];
    this.createTabs(); this.renderGrid();
    const back = pulpButton(this, this.rootContainer, 0, 440, 'BACK', () => this.goBack(), 430);
    bindPulpKeys(this, {
      ESC: () => this.goBack(), ENTER: () => back.activate(),
      LEFT: () => this.selectTab(-1), RIGHT: () => this.selectTab(1),
    });
  }

  private selectTab(offset: number) {
    const tabs = ['characters', 'artwork', 'extras'] as const;
    this.currentTab = tabs[(tabs.indexOf(this.currentTab) + offset + tabs.length) % tabs.length];
    this.createTabs(); this.renderGrid();
  }

  private createTabs() {
    for (const tab of this.tabButtons) tab.destroy();
    this.tabButtons = [];
    const tabs = ['characters', 'artwork', 'extras'] as const;
    tabs.forEach((id, i) => {
      const button = pulpButton(this, this.rootContainer, (i - 1) * 440, -266, id.toUpperCase(), () => {
        this.currentTab = id; this.createTabs(); this.renderGrid();
      }, 420, this.currentTab === id);
      this.tabButtons.push(button);
    });
  }

  private renderGrid() {
    this.gridContainer.removeAll(true);
    const stats = statsManager.getStats();
    const entries: { name: string; texture?: string; unlocked: boolean }[] = this.currentTab === 'characters' ? [
      ...['steve', 'billy', 'bob', 'cormano'].map(id => ({ name: id.toUpperCase(), texture: `poster_${id}`, unlocked: true })),
      { name: 'SECRET', unlocked: stats.stagesCleared >= 4 },
      { name: 'SECRET', unlocked: stats.stagesCleared >= 8 },
    ] : BOSSES.map(boss => ({ name: `STAGE ${boss.stage}`, texture: boss.posterKey, unlocked: stats.unlockedBosses.includes(boss.stage) || boss.stage === 1 }));
    const columns = this.currentTab === 'characters' ? 3 : 5;
    const count = this.currentTab === 'characters' ? entries.length : 10;
    for (let i = 0; i < count; i++) {
      const entry = entries[i];
      const x = (i % columns - (columns - 1) / 2) * (columns === 3 ? 360 : 260);
      const y = -85 + Math.floor(i / columns) * 290;
      const card = this.add.container(x, y); this.gridContainer.add(card);
      if (entry?.unlocked && entry.texture && this.textures.exists(entry.texture)) {
        const art = this.add.image(0, -12, entry.texture);
        art.setScale(Math.min((columns === 3 ? 300 : 230) / art.width, 260 / art.height)); card.add(art);
        pulpText(this, card, 0, 134, entry.name, 21, '#ffc52a');
      } else if (entry?.unlocked) {
        pulpText(this, card, 0, -15, '★', 66, '#a51e16');
        pulpText(this, card, 0, 90, entry.name, 21, '#120b08');
      } else {
        pulpText(this, card, 0, -12, '?', 100, '#f2d49a');
        pulpText(this, card, 0, 90, entry?.name ?? 'LOCKED', 21, '#f2d49a');
      }
    }
    pulpText(this, this.gridContainer, 0, 365, '[← →] CHANGE CATEGORY    [ESC] BACK', 20);
  }

  private goBack() {
    sounds.playRevolver();

    if (this.fromScene === 'MenuScene') { this.scene.stop('UnlockablesScene'); this.scene.resume('MenuScene'); }
    else this.scene.start('TitleScene');
  }

}
