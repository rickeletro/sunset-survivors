import { developerEnabled } from '../dev/access';
import { normalizeDifficulty, difficultySettings, difficultyProfile, type DifficultyId } from '../data/difficulty';
import { preloadImages } from '../assets/registry';
import { preloadPulp, pulpBackdrop, pulpHeading, pulpText, pulpButton, bindPulpMenu, bindPulpKeys } from '../ui/layout/pulpSceneKit';
import { createMenuRoot } from '../ui/layout/menuLayout';
import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { CharacterData, CHARACTERS } from '../data/characters';

export interface PauseSceneData {
  developer?: boolean;
  character: CharacterData;
  stage: number;
  difficulty?: DifficultyId;
  audit?: { seconds: number; kills: number; level: number; rawXp: number; earnedXp: number; badge: number; damageTaken: number; bossSeconds?: number };
}

export class PauseScene extends Phaser.Scene {
  private audit?: PauseSceneData['audit'];
  private character!: CharacterData;
  private stage: number = 1;
  private developer = false;
  private difficulty: DifficultyId = 'hardcore';
  private difficultyLabel?: Phaser.GameObjects.Text;
  private rootContainer!: Phaser.GameObjects.Container;

  constructor() {
    super('PauseScene');
  }

  init(data?: Partial<PauseSceneData>) {
    this.developer = !!data?.developer && developerEnabled();
    this.character = data?.character || CHARACTERS.billy;
    this.stage = data?.stage || 1;
    this.difficulty = normalizeDifficulty(data?.difficulty ?? difficultySettings.get());
    this.audit = data?.audit;
  }

  preload() { preloadPulp(this); preloadImages(this, ['menu_desk']); }

  create() {
    this.rootContainer = createMenuRoot(this);
    pulpBackdrop(this, this.rootContainer, true);
    const art = this.add.image(-400, 110, 'menu_desk');
    art.setScale(Math.min(740 / art.width, 680 / art.height));
    this.rootContainer.add(art);
    pulpHeading(this, this.rootContainer, 'PAUSED', -365, 1180, 86, true);
    this.difficultyLabel = pulpText(this, this.rootContainer, 0, -265, `STAGE ${this.stage}  /  ${this.character.name}  /  ${difficultyProfile(this.difficulty).label}`, 23);
    const buttons = [
      pulpButton(this, this.rootContainer, 330, -135, 'CONTINUE', () => this.resumeGame(), 580, true),
      pulpButton(this, this.rootContainer, 330, -25, 'MENU', () => this.openMenu(), 580),
      pulpButton(this, this.rootContainer, 330, 85, 'RESTART STAGE', () => this.restartStage(), 580),
      pulpButton(this, this.rootContainer, 330, 195, this.developer ? 'TEST PANEL' : 'RETURN TO TITLE', () => this.returnToTitle(), 580),
    ];
    bindPulpMenu(this, buttons);
    if (this.audit) pulpText(this, this.rootContainer, 0, 320,
      `KILLS ${this.audit.kills} • XP BASE ${this.audit.rawXp} • XP EARNED ${this.audit.earnedXp}\nBADGE ${this.audit.badge}/5 • DAMAGE TAKEN ${Math.round(this.audit.damageTaken)} • BOSS ${this.audit.bossSeconds ?? 0}s`, 19);
    pulpText(this, this.rootContainer, 180, 405, '[↑ ↓] SELECT     [ENTER] CONFIRM     [ESC] RESUME', 22);
    bindPulpKeys(this, { ESC: () => this.resumeGame() });
  }

  public setRunDifficulty(mode: DifficultyId) {
    this.difficulty = normalizeDifficulty(mode);
    this.difficultyLabel?.setText(`STAGE ${this.stage}  /  ${this.character.name}  /  ${difficultyProfile(this.difficulty).label}`);
  }

  private resumeGame() {
    sounds.playRevolver();

    this.scene.stop('PauseScene');
    this.scene.resume('GameScene');
  }

  private openMenu() {
    this.scene.pause('PauseScene');
    this.scene.launch('MenuScene', { fromScene: 'PauseScene' });
  }

  private restartStage() {
    sounds.playRevolver();

    this.scene.stop('PauseScene');
    this.scene.stop('GameScene');
    this.scene.start(this.developer ? 'GameScene' : 'WantedScene', {
      developer: this.developer,
      character: this.character,
      stage: this.stage,
      difficulty: this.difficulty,
    });
  }

  private returnToTitle() {
    sounds.playRevolver();
    sounds.playIntroMusic();

    this.scene.stop('PauseScene');
    this.scene.stop('GameScene');
    this.scene.start(this.developer ? 'DeveloperScene' : 'TitleScene', {
      stage: this.stage, hero: this.character.id, difficulty: this.difficulty,
    });
  }

}
