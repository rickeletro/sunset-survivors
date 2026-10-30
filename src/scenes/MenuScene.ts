import Phaser from 'phaser';
import { developerEnabled } from '../dev/access';
import { sounds } from '../audio/SoundManager';
import { createMenuRoot } from '../ui/layout/menuLayout';
import { preloadPulp, pulpPaper, pulpText, pulpButton, bindPulpMenu, bindPulpKeys } from '../ui/layout/pulpSceneKit';
import { t } from '../i18n';
export class MenuScene extends Phaser.Scene {
  private fromScene = 'TitleScene';
  constructor() { super('MenuScene'); }
  init(data?: { fromScene?: string }) { this.fromScene = data?.fromScene ?? 'TitleScene'; }
  preload() { preloadPulp(this); }
  create() {
    const root = createMenuRoot(this);
    root.add(this.add.graphics().fillStyle(0x120b08, .88).fillRect(-2000,-1200,4000,2400));
    pulpPaper(this, root, 0, 0, 780, 930);
    pulpText(this, root, 0, -390, t('menu.frontierMenu'), 54, '#a51e16');
    const entries: [string,string][] = [
      [t('menu.audio'),'AudioScene'],
      [t('menu.difficulty'),'DifficultyScene'],
      [t('menu.controls'),'ControlsScene'],
      [t('menu.ranking'),'RankingScene'],
      [t('menu.stats'),'StatsScene'],
      [t('menu.unlocks'),'UnlockablesScene'],
      [t('menu.saveProgress'),'ProgressScene'],
      [t('menu.generalStore'),'StoreScene'],
    ];
    if (developerEnabled() && this.fromScene === 'TitleScene') entries.push([t('menu.developer'),'DeveloperScene']);
    const step = entries.length > 8 ? 62 : 68;
    const startY = entries.length > 8 ? -300 : -285;
    const buttons = entries.map(([label,key],i) => pulpButton(this, root, 0, startY + i * step, label, () => {
      if (key === 'DeveloperScene') { this.scene.stop(this.fromScene); this.scene.start(key); return; }
      this.scene.pause('MenuScene'); this.scene.launch(key, { fromScene: 'MenuScene', duringRun: this.fromScene === 'PauseScene' });
      this.scene.bringToTop(key);
    }, 620));
    buttons.push(pulpButton(this, root, 0, 370, t('common.close'), () => this.close(), 620, true));
    bindPulpMenu(this, buttons); bindPulpKeys(this, { ESC: () => this.close() });
  }
  private close() { sounds.playRevolver(); this.scene.stop('MenuScene'); this.scene.resume(this.fromScene); }
}
