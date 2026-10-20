import { preloadImages } from '../assets/registry';
import { preloadPulp, pulpBackdrop, pulpHeading, pulpText, pulpButton, pulpPaper, pulpStats, bindPulpMenu } from '../ui/layout/pulpSceneKit';
import { createMenuRoot } from '../ui/layout/menuLayout';
import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { CharacterData, CHARACTERS } from '../data/characters';
import { statsManager } from '../data/GameStatsManager';

export interface GameCompleteData {
  character: CharacterData;
  stage: number;
  kills: number;
  bounty: number;
  timeSurvivedSeconds: number;
}

export class GameCompleteScene extends Phaser.Scene {
  private dataReceived!: GameCompleteData;
  private rootContainer!: Phaser.GameObjects.Container;

  constructor() {
    super('GameCompleteScene');
  }

  init(data?: Partial<GameCompleteData>) {
    this.dataReceived = {
      character: data?.character || CHARACTERS.billy,
      stage: data?.stage || 8,
      kills: data?.kills || 1842,
      bounty: data?.bounty || 36250,
      timeSurvivedSeconds: data?.timeSurvivedSeconds || 2895,
    };
  }

  preload() { preloadPulp(this); preloadImages(this, ['menu_ending']); }

  create() {
    sounds.playIntroMusic();
    this.rootContainer = createMenuRoot(this);
    pulpBackdrop(this, this.rootContainer, false);
    pulpHeading(this, this.rootContainer, 'GAME COMPLETE!', -345, 1400, 124);
    const heroes = this.add.image(-340, 110, 'menu_ending');
    heroes.setScale(Math.min(790 / heroes.width, 620 / heroes.height));
    this.rootContainer.add(heroes);
    const card = pulpPaper(this, this.rootContainer, 410, 45, 620, 535);
    const allStats = statsManager.getStats();
    const finalScore = this.dataReceived.bounty * 10 + this.dataReceived.kills * 50 + allStats.totalScore;
    const minutes = Math.floor(allStats.playTimeSeconds / 60);
    const seconds = Math.floor(allStats.playTimeSeconds % 60);
    pulpStats(this, card, [
      { label: 'FINAL SCORE', value: finalScore },
      { label: 'TOTAL KILLS', value: allStats.totalKills + this.dataReceived.kills },
      { label: 'STAGES CLEARED', value: '8 / 8' },
      { label: 'PLAY TIME', value: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` },
    ], 500, -185, true, 72);
    pulpText(this, card, -245, 145, 'RANK', 32, '#120b08', 'left');
    const rank = pulpText(this, card, 160, 145, 'S', 142, '#a51e16'); rank.setStroke('#ffc52a', 6);
    const back = pulpButton(this, this.rootContainer, 410, 405, 'BACK TO TITLE', () => this.returnToTitle(), 620, true);
    bindPulpMenu(this, [back]);
    pulpText(this, this.rootContainer, -345, 423, 'CONGRATULATIONS,\nGUNSLINGER!', 30, '#ffc52a');
  }

  private returnToTitle() {
    sounds.playRevolver();

    this.scene.start('TitleScene');
  }

}
