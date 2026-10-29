import Phaser from 'phaser';
import { developerEnabled } from '../dev/access';
import { sounds } from '../audio/SoundManager';
import { createMenuRoot } from '../ui/layout/menuLayout';
import { preloadPulp, pulpPaper, pulpText, pulpButton, bindPulpMenu, bindPulpKeys } from '../ui/layout/pulpSceneKit';
export class MenuScene extends Phaser.Scene {
  private fromScene = 'TitleScene';
  constructor() { super('MenuScene'); }
  init(data?: { fromScene?: string }) { this.fromScene = data?.fromScene ?? 'TitleScene'; }
  preload() { preloadPulp(this); }
  create() {
    const root = createMenuRoot(this);
    root.add(this.add.graphics().fillStyle(0x120b08, .88).fillRect(-2000,-1200,4000,2400));
    pulpPaper(this, root, 0, 0, 780, 930);
    pulpText(this, root, 0, -390, 'FRONTIER MENU', 54, '#a51e16');
    const entries: [string,string][] = [
      ['AUDIO','AudioScene'],
      ['DIFFICULTY','DifficultyScene'],
      ['HOW TO PLAY','ControlsScene'],
      ['RANKING','RankingScene'],
      ['STATS','StatsScene'],
      ['UNLOCKABLES','UnlockablesScene'],
      ['SAVE PROGRESS','ProgressScene'],
      ['GENERAL STORE','StoreScene'],
    ];
    if (developerEnabled() && this.fromScene === 'TitleScene') entries.push(['DEVELOPER [F2]','DeveloperScene']);
    const step = entries.length > 8 ? 62 : 68;
    const startY = entries.length > 8 ? -300 : -285;
    const buttons = entries.map(([label,key],i) => pulpButton(this, root, 0, startY + i * step, label, () => {
      if (key === 'DeveloperScene') { this.scene.stop(this.fromScene); this.scene.start(key); return; }
      this.scene.pause('MenuScene'); this.scene.launch(key, { fromScene: 'MenuScene', duringRun: this.fromScene === 'PauseScene' });
      this.scene.bringToTop(key);
    }, 620));
    buttons.push(pulpButton(this, root, 0, 370, 'CLOSE', () => this.close(), 620, true));
    bindPulpMenu(this, buttons); bindPulpKeys(this, { ESC: () => this.close() });
  }
  private close() { sounds.playRevolver(); this.scene.stop('MenuScene'); this.scene.resume(this.fromScene); }
}
