import Phaser from 'phaser';
import { THEME } from '../ui/theme/tokens';
import { createMenuRoot } from '../ui/layout/menuLayout';
import { preloadPulp, pulpBackdrop, pulpHeading, pulpWood, pulpText, pulpButton, bindPulpMenu, bindPulpKeys } from '../ui/layout/pulpSceneKit';
import { DIFFICULTIES, DIFFICULTY_IDS, difficultySettings, type DifficultyId } from '../data/difficulty';

export class DifficultyScene extends Phaser.Scene {
  private leaving = false;
  constructor() { super('DifficultyScene'); }
  preload() { preloadPulp(this); }
  create() {
    this.leaving = false;
    const root = createMenuRoot(this);
    pulpBackdrop(this, root, true);
    pulpHeading(this, root, 'CHOOSE YOUR CHALLENGE', -380, 1320, 80, true);
    pulpText(this, root, 0, -265, 'NORMAL IS THE STANDARD • SAME CAMPAIGN IN ALL THREE MODES', 24);
    const buttons = DIFFICULTY_IDS.map((mode, i) => {
      const p = DIFFICULTIES[mode], x = (i - 1) * 470;
      pulpWood(this, root, x, -20, 430, 430);
      pulpText(this, root, x, -175, p.label, mode === 'hardcore' ? 42 : 52, '#ffc52a');
      const description = mode === 'easy' ? 'More room to\nlearn and explore.' : mode === 'normal'
        ? 'Dodge, build\nand choose wisely.' : 'Mistakes cost more.\nYour progress stays safe.';
      pulpText(this, root, x, -85, description, 25).setFontFamily(THEME.typography.narrativeFont);
      pulpText(this, root, x, 15, `ENEMY HP: ${Math.round(p.enemyHp * 100)}%\nBOSS HP: ${Math.round(p.bossHp * 100)}%\nDAMAGE TAKEN: ${Math.round(p.incomingDamage * 100)}%`, 22);
      return pulpButton(this, root, x, 170, `PLAY ${p.label}`, () => this.choose(mode), 420, mode === difficultySettings.get());
    });
    bindPulpMenu(this, buttons, true, DIFFICULTY_IDS.indexOf(difficultySettings.get()));
    pulpText(this, root, 0, 285, 'SAME XP, LOOT, HEALING, SPEED AND HITBOXES IN EVERY MODE', 23);
    pulpText(this, root, 0, 335, 'Percentages relative to Normal. Base bosses have doubled HP and damage.', 24);
    pulpText(this, root, 0, 430, '[← →] SELECT   [ENTER] SAVE   [ESC] BACK', 24);
    bindPulpKeys(this, { ESC: () => this.choose() });
  }
  private choose(mode?: DifficultyId) {
    if (this.leaving) return;
    this.leaving = true;
    if (mode) difficultySettings.set(mode);
    this.scene.start('TitleScene');
  }
}
