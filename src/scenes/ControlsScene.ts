import { createMenuRoot } from '../ui/layout/menuLayout';
import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { THEME } from '../ui/theme/tokens';
import { WesternButton } from '../ui/components/WesternButton';
import { WesternTitle } from '../ui/components/WesternTitle';
import { WesternPanel } from '../ui/components/WesternPanel';

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
    if (data?.fromScene) {
      this.fromScene = data.fromScene;
    }
  }

  create() {
    const { width, height } = this.scale;

    // Dark Background
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0503, 1);
    bg.fillRect(0, 0, width, height);

    // Root Container
    this.rootContainer = createMenuRoot(this);

    // Saloon Wood Wall
    const wall = new WesternPanel(this, {
      x: 0,
      y: 0,
      width: 1100,
      height: 700,
      variant: 'dark-saloon',
    });
    this.rootContainer.add(wall);

    // Title
    const title = new WesternTitle(this, {
      x: 0,
      y: -290,
      title: '★ HOW TO PLAY ★',
      subtitle: 'SURVIVE • SHOOT • COLLECT BOUNTIES • DEFEAT OUTLAW BOSSES',
      width: 820,
      fontSize: '32px',
    });
    this.rootContainer.add(title);

    // Left Gunslinger Artwork / Sprite
    this.createGunslingerIllustration();

    // Right Controls Layout Board
    this.createControlsGrid();

    // Bottom Guidance Note
    this.createGuidanceNote();

    // Back Button
    const backBtn = new WesternButton(this, {
      x: 0,
      y: 300,
      width: 240,
      height: 52,
      text: '◀ GOT IT (ESC)',
      variant: 'gold',
      onClick: () => this.goBack(),
    });
    this.rootContainer.add(backBtn);

    this.input.keyboard?.once('keydown-ESC', () => this.goBack());
    this.input.keyboard?.once('keydown-ENTER', () => this.goBack());

  }

  private createGunslingerIllustration() {
    const leftContainer = this.add.container(-320, 20);

    const frame = new WesternPanel(this, {
      x: 0,
      y: 0,
      width: 340,
      height: 380,
      variant: 'wood',
    });
    leftContainer.add(frame);

    if (this.textures.exists('hero_billy')) {
      const hero = this.add.sprite(0, -10, 'hero_billy', 0).setScale(3.6);
      leftContainer.add(hero);
    }

    const badge = this.add.text(0, 140, '★ WESTERN SURVIVOR ★', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '11px',
      color: '#ffc52a',
    }).setOrigin(0.5);
    leftContainer.add(badge);

    this.rootContainer.add(leftContainer);
  }

  private createControlsGrid() {
    const rightContainer = this.add.container(180, 20);

    const parchment = new WesternPanel(this, {
      x: 0,
      y: 0,
      width: 600,
      height: 380,
      variant: 'parchment',
    });
    rightContainer.add(parchment);

    const controls = [
      { action: 'MOVE GUNSLINGER', key: '[W][A][S][D] / [ARROWS]' },
      { action: 'AUTO-AIM & SHOOT', key: 'AUTOMATIC TO NEAREST' },
      { action: 'MANUAL AIM (OPTIONAL)', key: '[MOUSE / POINTER]' },
      { action: 'TRIGGER SPECIAL', key: '[SPACEBAR]' },
      { action: 'PAUSE GAMEPLAY', key: '[ESC]' },
    ];

    controls.forEach((c, idx) => {
      const rowY = -120 + idx * 56;

      const actText = this.add.text(-250, rowY, c.action, {
        fontFamily: THEME.typography.pixelFont,
        fontSize: '11px',
        color: '#2b1d0c',
      }).setOrigin(0, 0.5);
      rightContainer.add(actText);

      const keyBox = this.add.graphics();
      keyBox.fillStyle(0x321b10, 1);
      keyBox.fillRoundedRect(40, rowY - 18, 220, 36, 6);
      rightContainer.add(keyBox);

      const keyText = this.add.text(150, rowY, c.key, {
        fontFamily: THEME.typography.pixelFont,
        fontSize: '10px',
        color: '#ffc52a',
      }).setOrigin(0.5);
      rightContainer.add(keyText);
    });

    this.rootContainer.add(rightContainer);
  }

  private createGuidanceNote() {
    const noteContainer = this.add.container(0, 235);

    const bar = this.add.graphics();
    bar.fillStyle(0x1b120c, 0.95);
    bar.lineStyle(2, 0x8b5a2b, 1);
    bar.fillRoundedRect(-480, -20, 960, 40, 6);
    bar.strokeRoundedRect(-480, -20, 960, 40, 6);
    noteContainer.add(bar);

    const note = this.add.text(
      0,
      0,
      'Survive enemy bandit waves, collect gold & whiskey, pick upgrades, and defeat the boss of each stage!',
      {
        fontFamily: THEME.typography.pixelFont,
        fontSize: '10px',
        color: '#f2d49a',
      }
    ).setOrigin(0.5);
    noteContainer.add(note);

    this.rootContainer.add(noteContainer);
  }

  private goBack() {
    sounds.playRevolver();

    if (this.fromScene === 'PauseScene') {
      this.scene.stop('ControlsScene');
      this.scene.resume('PauseScene');
    } else {
      this.scene.start('TitleScene');
    }
  }

}
