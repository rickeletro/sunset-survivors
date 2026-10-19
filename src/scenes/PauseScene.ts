import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { CharacterData, CHARACTERS } from '../data/characters';
import { THEME } from '../ui/theme/tokens';
import { WesternButton } from '../ui/components/WesternButton';
import { WesternTitle } from '../ui/components/WesternTitle';
import { WesternPanel } from '../ui/components/WesternPanel';

export interface PauseSceneData {
  character: CharacterData;
  stage: number;
}

export class PauseScene extends Phaser.Scene {
  private character!: CharacterData;
  private stage: number = 1;
  private rootContainer!: Phaser.GameObjects.Container;

  constructor() {
    super('PauseScene');
  }

  init(data?: Partial<PauseSceneData>) {
    this.character = data?.character || CHARACTERS.billy;
    this.stage = data?.stage || 1;
  }

  create() {
    const { width, height } = this.scale;

    // Dimmed Dark Overlay
    const dim = this.add.graphics();
    dim.fillStyle(0x000000, 0.78);
    dim.fillRect(0, 0, width, height);

    // Root Container
    const scale = Math.min(width / 1536, height / 1024);
    this.rootContainer = this.add.container(width / 2, height / 2);
    this.rootContainer.setScale(scale);

    // Saloon desk background board
    const board = new WesternPanel(this, {
      x: 0,
      y: 0,
      width: 720,
      height: 600,
      variant: 'dark-saloon',
    });
    this.rootContainer.add(board);

    // PAUSED Title Plate
    const title = new WesternTitle(this, {
      x: 0,
      y: -230,
      title: '★ PAUSED ★',
      subtitle: `STAGE ${this.stage} • ${this.character.name}`,
      width: 540,
      fontSize: '32px',
    });
    this.rootContainer.add(title);

    // Menu Buttons
    const buttonsConfig = [
      {
        text: 'CONTINUE',
        variant: 'gold' as const,
        onClick: () => this.resumeGame(),
      },
      {
        text: 'HOW TO PLAY',
        variant: 'wood' as const,
        onClick: () => this.openControls(),
      },
      {
        text: 'RESTART STAGE',
        variant: 'wood' as const,
        onClick: () => this.restartStage(),
      },
      {
        text: 'RETURN TO TITLE',
        variant: 'danger' as const,
        onClick: () => this.returnToTitle(),
      },
    ];

    buttonsConfig.forEach((cfg, idx) => {
      const btn = new WesternButton(this, {
        x: 0,
        y: -90 + idx * 75,
        width: 380,
        height: 56,
        text: cfg.text,
        variant: cfg.variant,
        fontSize: '13px',
        onClick: cfg.onClick,
      });
      this.rootContainer.add(btn);
    });

    // Footer arcade hint
    const hint = this.add.text(0, 245, '★ [ENTER] SELECT   •   [ESC] RESUME ★', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '11px',
      color: '#f2d49a',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.rootContainer.add(hint);

    // Keyboard ESC to resume
    this.input.keyboard?.once('keydown-ESC', () => this.resumeGame());

    this.scale.on('resize', this.handleResize, this);
  }

  private resumeGame() {
    sounds.playRevolver();
    this.scale.off('resize', this.handleResize, this);
    this.scene.stop('PauseScene');
    this.scene.resume('GameScene');
  }

  private openControls() {
    this.scene.pause('PauseScene');
    this.scene.launch('ControlsScene', { fromScene: 'PauseScene' });
  }

  private restartStage() {
    sounds.playRevolver();
    this.scale.off('resize', this.handleResize, this);
    this.scene.stop('PauseScene');
    this.scene.stop('GameScene');
    this.scene.start('StageIntroScene', {
      character: this.character,
      stage: this.stage,
    });
  }

  private returnToTitle() {
    sounds.playRevolver();
    sounds.playIntroMusic();
    this.scale.off('resize', this.handleResize, this);
    this.scene.stop('PauseScene');
    this.scene.stop('GameScene');
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
