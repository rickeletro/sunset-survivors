import { preloadImages } from '../assets/registry';
import { preloadPulp, pulpBackdrop, pulpHeading, pulpText, pulpButton, pulpWood, pulpStats, bindPulpMenu, bindPulpKeys } from '../ui/layout/pulpSceneKit';
import { createMenuRoot } from '../ui/layout/menuLayout';
import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { CharacterData, CHARACTERS } from '../data/characters';
import { statsManager } from '../data/GameStatsManager';

export interface GameOverStats {
  runId?: string;
  victory?: boolean;
  character: CharacterData;
  timeSurvivedSeconds: number;
  kills: number;
  bounty: number;
  level: number;
  stage?: number;
}

export class GameOverScene extends Phaser.Scene {
  private stats!: GameOverStats;
  private rootContainer!: Phaser.GameObjects.Container;

  constructor() {
    super('GameOverScene');
  }

  init(data?: Partial<GameOverStats>) {
    this.stats = {
      runId: data?.runId,
      character: data?.character || CHARACTERS.billy,
      stage: data?.stage || 1,
      timeSurvivedSeconds: data?.timeSurvivedSeconds || 145,
      kills: data?.kills || 92,
      bounty: data?.bounty || 450,
      level: data?.level || 3,
    };

    statsManager.recordRun(
      {
        runId: this.stats.runId,
        score: this.stats.bounty * 10 + this.stats.kills * 50,
        kills: this.stats.kills,
        gold: this.stats.bounty,
        timeSurvivedSeconds: this.stats.timeSurvivedSeconds,
        stage: this.stats.stage || 1,
        stagesCleared: 0,
        level: this.stats.level,
        characterId: this.stats.character.id,
        rank: 'D',
      },
      false
    );
  }

  preload() { preloadPulp(this); preloadImages(this, ['menu_grave']); }

  create() {
    sounds.stopBGM();
    sounds.playHit();
    this.rootContainer = createMenuRoot(this);
    pulpBackdrop(this, this.rootContainer, false);
    pulpHeading(this, this.rootContainer, 'YOU DIED!', -340, 1260, 150);
    const art = this.add.image(-405, 95, 'menu_grave');
    art.setScale(Math.min(650 / art.width, 640 / art.height));
    this.rootContainer.add(art);
    const report = pulpWood(this, this.rootContainer, 310, 5, 650, 320);
    const minutes = Math.floor(this.stats.timeSurvivedSeconds / 60);
    const seconds = Math.floor(this.stats.timeSurvivedSeconds % 60);
    pulpStats(this, report, [
      { label: 'GUNSLINGER', value: this.stats.character.name },
      { label: 'STAGE / LEVEL', value: `${this.stats.stage} / ${this.stats.level}` },
      { label: 'SURVIVED', value: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` },
      { label: 'KILLS / GOLD', value: `${this.stats.kills} / $${this.stats.bounty.toLocaleString()}` },
    ], 550, -108, false, 64);
    const buttons = [
      pulpButton(this, this.rootContainer, 310, 245, 'RETRY', () => this.retry(), 650, true),
      pulpButton(this, this.rootContainer, 310, 345, 'BACK TO TITLE', () => this.returnToTitle(), 650),
    ];
    bindPulpMenu(this, buttons);
    bindPulpKeys(this, { R: () => this.retry(), ESC: () => this.returnToTitle() });
    pulpText(this, this.rootContainer, 0, 460, '"ANOTHER GUNSLINGER FALLS TO THE DUST…"', 25);
  }

  private retry() {
    sounds.playGunReload();
    sounds.playGameplayMusic(this.stats.stage || 1);

    this.scene.start('WantedScene', {
      character: this.stats.character,
      stage: this.stats.stage || 1,
    });
  }

  private returnToTitle() {
    sounds.playRevolver();
    sounds.playIntroMusic();

    this.scene.start('TitleScene');
  }

}
