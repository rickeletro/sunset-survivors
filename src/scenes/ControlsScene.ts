import { preloadImages, preloadHeroSheets } from '../assets/registry';
import { preloadPulp, pulpBackdrop, pulpHeading, pulpText, pulpButton, pulpPaper, pulpWood, bindPulpMenu, bindPulpKeys } from '../ui/layout/pulpSceneKit';
import { createMenuRoot } from '../ui/layout/menuLayout';
import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { THEME } from '../ui/theme/tokens';
import { t } from '../i18n';

export interface ControlsSceneData {
  fromScene?: string;
}

export class ControlsScene extends Phaser.Scene {
  private fromScene: string = 'TitleScene';
  private rootContainer!: Phaser.GameObjects.Container;

  constructor() {
    super('ControlsScene');
  }

  init(data?: ControlsSceneData) {
    this.fromScene = data?.fromScene ?? 'TitleScene';
  }

  preload() { preloadPulp(this); preloadHeroSheets(this); preloadImages(this, ['poster_billy']); }

  create() {
    this.rootContainer = createMenuRoot(this);
    pulpBackdrop(this, this.rootContainer, true);
    pulpHeading(this, this.rootContainer, t('controls.title'), -390, 1180, 72, true);
    const hero = this.add.image(-480, -30, 'poster_billy');
    hero.setScale(Math.min(390 / hero.width, 560 / hero.height));
    this.rootContainer.add(hero);
    pulpText(this, this.rootContainer, -480, 270, t('controls.heroSubtitle'), 23, '#ffc52a');
    const board = pulpWood(this, this.rootContainer, 220, -5, 860, 565);
    for (const y of [-135, 0, 135]) board.add(this.add.graphics().fillStyle(0x8b5a2b, 0.5).fillRect(-390, y, 780, 3));
    pulpText(this, board, -355, -205, t('controls.move'), 31, '#f2d49a', 'left');
    const keycap = (x: number, y: number, text: string, width = 64) => {
      const key = this.add.graphics().fillStyle(0x120b08, 0.95).fillRect(x - width / 2, y - 26, width, 52);
      key.lineStyle(3, 0xc49a55).strokeRect(x - width / 2, y - 26, width, 52);
      board.add(key);
      const label = this.add.text(x, y, text, { fontFamily: THEME.typography.pixelFont, fontSize: '19px', color: '#ffc52a' }).setOrigin(0.5);
      board.add(label);
    };
    keycap(-20, -235, 'W'); keycap(-90, -175, 'A'); keycap(-20, -175, 'S'); keycap(50, -175, 'D');
    keycap(250, -235, '↑'); keycap(180, -175, '←'); keycap(250, -175, '↓'); keycap(320, -175, '→');
    pulpText(this, board, 115, -205, '/', 32);
    pulpText(this, board, -355, -67, t('controls.shoot'), 31, '#f2d49a', 'left');
    keycap(130, -67, t('controls.shootAuto'), 400);
    pulpText(this, board, -355, 67, t('controls.upgrade'), 31, '#f2d49a', 'left');
    keycap(130, 67, t('controls.upgradeCollect'), 400);
    pulpText(this, board, -355, 205, t('controls.pause'), 31, '#f2d49a', 'left');
    keycap(130, 205, 'ESC', 180);
    const note = pulpPaper(this, this.rootContainer, 0, 350, 1260, 118);
    pulpText(this, note, 0, 0, t('controls.tipDodgeHotstreak'), 29, '#120b08');
    const back = pulpButton(this, this.rootContainer, 0, 458, t('common.back'), () => this.goBack(), 330);
    bindPulpMenu(this, [back]); bindPulpKeys(this, { ESC: () => this.goBack() });
  }

  private goBack() {
    sounds.playRevolver();

    if (this.fromScene === 'PauseScene' || this.fromScene === 'MenuScene') {
      this.scene.stop('ControlsScene');
      this.scene.resume(this.fromScene);
    } else {
      this.scene.start('TitleScene');
    }
  }

}
