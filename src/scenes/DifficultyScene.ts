import Phaser from 'phaser';
import { THEME } from '../ui/theme/tokens';
import { createMenuRoot } from '../ui/layout/menuLayout';
import { preloadPulp, pulpBackdrop, pulpHeading, pulpWood, pulpText, pulpButton, bindPulpMenu, bindPulpKeys } from '../ui/layout/pulpSceneKit';
import { DIFFICULTIES, DIFFICULTY_IDS, difficultySettings, type DifficultyId } from '../data/difficulty';
import { t } from '../i18n';

export class DifficultyScene extends Phaser.Scene {
  private leaving = false;
  private fromScene = 'TitleScene';
  private duringRun = false;
  init(data?: { fromScene?: string; duringRun?: boolean }) { this.fromScene = data?.fromScene ?? 'TitleScene'; this.duringRun = !!data?.duringRun; }
  constructor() { super('DifficultyScene'); }
  preload() { preloadPulp(this); }
  create() {
    this.leaving = false;
    const root = createMenuRoot(this);
    pulpBackdrop(this, root, true);
    pulpHeading(this, root, t('difficulty.title'), -380, 1320, 80, true);
    pulpText(this, root, 0, -265, t('difficulty.subtitle'), 24);
    const buttons = DIFFICULTY_IDS.map((mode, i) => {
      const p = DIFFICULTIES[mode], x = (i - 1) * 470;
      pulpWood(this, root, x, -20, 430, 430);
      const label = t(`difficulty.${mode}Label` as any);
      pulpText(this, root, x, -175, label, mode === 'hardcore' ? 42 : 52, '#ffc52a');
      const description = t(`difficulty.${mode}Desc` as any);
      pulpText(this, root, x, -85, description, 25).setFontFamily(THEME.typography.narrativeFont);
      pulpText(this, root, x, 15, `${t('difficulty.statsEnemyHp')}: ${Math.round(p.enemyHp * 100)}%\n${t('difficulty.statsBossHp')}: ${Math.round(p.bossHp * 100)}%\n${t('difficulty.statsDamageTaken')}: ${Math.round(p.incomingDamage * 100)}%`, 22);
      return pulpButton(this, root, x, 170, t('difficulty.selectDifficulty', { label }), () => this.choose(mode), 420, mode === difficultySettings.get());
    });
    bindPulpMenu(this, buttons, true, DIFFICULTY_IDS.indexOf(difficultySettings.get()));
    pulpText(this, root, 0, 285, t('difficulty.footerNotes1'), 23);
    pulpText(this, root, 0, 335, t('difficulty.footerNotes2'), 24);
    pulpText(this, root, 0, 430, t('difficulty.navHint'), 24);
    bindPulpKeys(this, { ESC: () => this.choose() });
  }
  private choose(mode?: DifficultyId) {
    if (this.leaving) return;
    this.leaving = true;
    if (mode) {
      difficultySettings.set(mode);
      if (this.duringRun) {
        const game = this.scene.get('GameScene') as Phaser.Scene & { setRunDifficulty(mode: DifficultyId): void };
        game.setRunDifficulty(mode);
        const pause = this.scene.get('PauseScene') as Phaser.Scene & { setRunDifficulty(mode: DifficultyId): void };
        pause.setRunDifficulty(mode);
      }
    }
    if (this.fromScene === 'MenuScene') { this.scene.stop('DifficultyScene'); this.scene.resume('MenuScene'); }
    else this.scene.start('TitleScene');
  }
}
