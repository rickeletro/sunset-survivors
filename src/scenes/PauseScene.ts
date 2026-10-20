import { preloadImages } from '../assets/registry';
import { preloadPulp, pulpBackdrop, pulpHeading, pulpText, pulpButton, bindPulpMenu, bindPulpKeys } from '../ui/layout/pulpSceneKit';
import { createMenuRoot } from '../ui/layout/menuLayout';
import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { CharacterData, CHARACTERS } from '../data/characters';

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

  preload() { preloadPulp(this); preloadImages(this, ['menu_desk']); }

  create() {
    this.rootContainer = createMenuRoot(this);
    pulpBackdrop(this, this.rootContainer, true);
    const art = this.add.image(-400, 110, 'menu_desk');
    art.setScale(Math.min(740 / art.width, 680 / art.height));
    this.rootContainer.add(art);
    pulpHeading(this, this.rootContainer, 'PAUSED', -365, 1180, 86, true);
    pulpText(this, this.rootContainer, 0, -265, `STAGE ${this.stage}  /  ${this.character.name}`, 23);
    const buttons = [
      pulpButton(this, this.rootContainer, 330, -135, 'CONTINUE', () => this.resumeGame(), 580, true),
      pulpButton(this, this.rootContainer, 330, -25, 'HOW TO PLAY', () => this.openControls(), 580),
      pulpButton(this, this.rootContainer, 330, 85, 'RESTART STAGE', () => this.restartStage(), 580),
      pulpButton(this, this.rootContainer, 330, 195, 'RETURN TO TITLE', () => this.returnToTitle(), 580),
    ];
    bindPulpMenu(this, buttons);
    pulpText(this, this.rootContainer, 180, 405, '[↑ ↓] SELECT     [ENTER] CONFIRM     [ESC] RESUME', 22);
    bindPulpKeys(this, { ESC: () => this.resumeGame() });
  }

  private resumeGame() {
    sounds.playRevolver();

    this.scene.stop('PauseScene');
    this.scene.resume('GameScene');
  }

  private openControls() {
    this.scene.pause('PauseScene');
    this.scene.launch('ControlsScene', { fromScene: 'PauseScene' });
  }

  private restartStage() {
    sounds.playRevolver();

    this.scene.stop('PauseScene');
    this.scene.stop('GameScene');
    this.scene.start('WantedScene', {
      character: this.character,
      stage: this.stage,
    });
  }

  private returnToTitle() {
    sounds.playRevolver();
    sounds.playIntroMusic();

    this.scene.stop('PauseScene');
    this.scene.stop('GameScene');
    this.scene.start('TitleScene');
  }

}
