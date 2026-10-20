import { preloadHeroSheets } from '../assets/registry';
import { preloadPulp, pulpBackdrop, pulpHeading, pulpText, pulpButton, pulpWood, pulpStats, bindPulpMenu } from '../ui/layout/pulpSceneKit';
import { createMenuRoot } from '../ui/layout/menuLayout';
import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { CharacterData, CHARACTERS } from '../data/characters';
import { statsManager } from '../data/GameStatsManager';

export interface StageClearData {
  character: CharacterData;
  stage: number;
  timeSurvivedSeconds: number;
  kills: number;
  bounty: number;
  level: number;
}

export class StageClearScene extends Phaser.Scene {
  private dataReceived!: StageClearData;
  private rootContainer!: Phaser.GameObjects.Container;
  private rank: 'S' | 'A' | 'B' | 'C' = 'A';

  constructor() {
    super('StageClearScene');
  }

  init(data?: Partial<StageClearData>) {
    this.dataReceived = {
      character: data?.character || CHARACTERS.billy,
      stage: data?.stage || 1,
      timeSurvivedSeconds: data?.timeSurvivedSeconds || 222,
      kills: data?.kills || 284,
      bounty: data?.bounty || 1350,
      level: data?.level || 5,
    };

    this.rank = statsManager.calculateRank(
      this.dataReceived.kills,
      this.dataReceived.timeSurvivedSeconds,
      1.0
    );

    // Save run progress
    statsManager.recordRun(
      {
        score: this.dataReceived.bounty * 10 + this.dataReceived.kills * 50,
        kills: this.dataReceived.kills,
        gold: this.dataReceived.bounty,
        timeSurvivedSeconds: this.dataReceived.timeSurvivedSeconds,
        stage: this.dataReceived.stage,
        stagesCleared: this.dataReceived.stage,
        level: this.dataReceived.level,
        characterId: this.dataReceived.character.id,
        rank: this.rank,
      },
      true
    );
  }

  preload() { preloadPulp(this); preloadHeroSheets(this); }

  create() {
    sounds.playLevelUp();
    this.rootContainer = createMenuRoot(this);
    pulpBackdrop(this, this.rootContainer, false);
    pulpHeading(this, this.rootContainer, '★ STAGE CLEAR! ★', -350, 1360, 112);
    pulpText(this, this.rootContainer, 0, -242, `STAGE ${this.dataReceived.stage} LIBERATED • OUTLAW DEFEATED`, 25);
    const hero = this.add.sprite(-480, 120, `hero_${this.dataReceived.character.id}`, 0).setScale(2.7).setTint(0x120b08);
    this.rootContainer.add(hero);
    const report = pulpWood(this, this.rootContainer, 215, 55, 940, 420);
    const minutes = Math.floor(this.dataReceived.timeSurvivedSeconds / 60);
    const seconds = Math.floor(this.dataReceived.timeSurvivedSeconds % 60);
    const stats = this.add.container(-130, 0); report.add(stats);
    pulpStats(this, stats, [
      { label: 'SCORE', value: this.dataReceived.bounty * 10 + this.dataReceived.kills * 50 },
      { label: 'TIME', value: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` },
      { label: 'KILLS', value: this.dataReceived.kills },
      { label: 'GOLD', value: this.dataReceived.bounty },
      { label: 'BONUS', value: '$2,500' },
    ], 520, -140, false, 65);
    const rank = pulpText(this, report, 305, 10, this.rank, 220, '#ffc52a');
    rank.setStroke('#a51e16', 12);
    this.tweens.add({ targets: rank, scale: 1.04, duration: 900, yoyo: true, repeat: -1 });
    const buttons = [
      pulpButton(this, this.rootContainer, -110, 375, this.dataReceived.stage >= 8 ? 'VICTORY CELEBRATION' : 'NEXT STAGE', () => this.proceedNext(), 530, true),
      pulpButton(this, this.rootContainer, 445, 375, 'STATS', () => this.openStats(), 480),
    ];
    bindPulpMenu(this, buttons, true);
    pulpText(this, this.rootContainer, 0, 465, '[← →] SELECT    [ENTER] CONTINUE', 22);
  }

  private proceedNext() {
    sounds.playRevolver();


    if (this.dataReceived.stage >= 8) {
      // Completed final stage 8!
      this.scene.start('GameCompleteScene', {
        character: this.dataReceived.character,
        stage: this.dataReceived.stage,
        kills: this.dataReceived.kills,
        bounty: this.dataReceived.bounty,
        timeSurvivedSeconds: this.dataReceived.timeSurvivedSeconds,
      });
    } else {
      // Advance to next stage!
      this.scene.start('WantedScene', {
        character: this.dataReceived.character,
        stage: this.dataReceived.stage + 1,
      });
    }
  }

  private openStats() {
    sounds.playRevolver();
    this.scene.start('StatsScene', { fromScene: 'StageClearScene', prevData: this.dataReceived });
  }

}
