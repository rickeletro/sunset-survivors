import { RankingNameField } from '../ui/components/RankingNameField';
import { rankings, rankingName, runScore } from '../data/RankingManager';
import { normalizeDifficulty, difficultySettings, difficultyProfile, type DifficultyId } from '../data/difficulty';
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
  difficulty?: DifficultyId;
}

export class GameOverScene extends Phaser.Scene {
  private nameField?: RankingNameField;
  private rankingId = '';
  private submitted = false;
  private openingRanking = false;
  private namePrompt?: Phaser.GameObjects.Text;
  private stats!: GameOverStats;
  private rootContainer!: Phaser.GameObjects.Container;

  constructor() {
    super('GameOverScene');
  }

  init(data?: Partial<GameOverStats>) {
    this.rankingId = data?.runId ?? (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
    this.submitted = false;
    this.openingRanking = false;
    this.stats = {
      runId: data?.runId,
      character: data?.character || CHARACTERS.billy,
      stage: data?.stage || 1,
      difficulty: normalizeDifficulty(data?.difficulty ?? difficultySettings.get()),
      timeSurvivedSeconds: data?.timeSurvivedSeconds ?? 0,
      kills: data?.kills ?? 0,
      bounty: data?.bounty ?? 0,
      level: data?.level ?? 1,
    };

    statsManager.recordRun(
      {
        runId: this.stats.runId,
        score: runScore(this.stats.bounty, this.stats.kills),
        kills: this.stats.kills,
        gold: this.stats.bounty,
        timeSurvivedSeconds: this.stats.timeSurvivedSeconds,
        stage: this.stats.stage || 1,
      difficulty: this.stats.difficulty,
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
    pulpHeading(this, this.rootContainer, 'YOU DIED!', -385, 1260, 120);
    const art = this.add.image(-430, -90, 'menu_grave');
    art.setScale(Math.min(450 / art.width, 380 / art.height));
    this.rootContainer.add(art);
    const report = pulpWood(this, this.rootContainer, 260, -105, 760, 320);
    const minutes = Math.floor(this.stats.timeSurvivedSeconds / 60);
    const seconds = Math.floor(this.stats.timeSurvivedSeconds % 60);
    pulpStats(this, report, [
      { label: 'GUNSLINGER', value: this.stats.character.name },
      { label: 'STAGE / LEVEL', value: `${this.stats.stage} / ${this.stats.level} • ${difficultyProfile(this.stats.difficulty).label}` },
      { label: 'SURVIVED', value: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` },
      { label: 'KILLS / GOLD', value: `${this.stats.kills} / $${this.stats.bounty.toLocaleString()}` },
    ], 650, -108, false, 64);
    this.namePrompt = pulpText(this, this.rootContainer, 0, 105, 'ENTER YOUR NAME • CLAIM YOUR PLACE IN THE RANKING', 25, '#ffc52a');
    const field = this.add.graphics().fillStyle(0x120b08, .95).fillRect(-570,145,1140,100);
    field.lineStyle(3,0xffc52a).strokeRect(-570,145,1140,100); this.rootContainer.add(field);
    this.nameField = new RankingNameField(this, this.rootContainer, 195, () => this.openRanking());
    const buttons = [
      pulpButton(this, this.rootContainer, 0, 305, 'SAVE NAME & VIEW RANKING', () => this.openRanking(), 1120, true),
      pulpButton(this, this.rootContainer, -300, 410, 'RETRY', () => this.retry(), 540),
      pulpButton(this, this.rootContainer, 300, 410, 'BACK TO TITLE', () => this.returnToTitle(), 540),
    ];
    bindPulpMenu(this, buttons);
    bindPulpKeys(this, { R: () => this.retry(), ESC: () => this.returnToTitle() });
  }

  private saveRanking(): boolean {
    if (this.submitted) return true;
    const name = rankingName(this.nameField?.value() ?? '');
    if (!name) return false;
    this.submitted = rankings.submit({ runId: this.rankingId, name,
      score: runScore(this.stats.bounty,this.stats.kills), kills: this.stats.kills,
      bounty: this.stats.bounty, seconds: this.stats.timeSurvivedSeconds, stage: this.stats.stage ?? 1,
      level: this.stats.level, character: this.stats.character.id, difficulty: this.stats.difficulty ?? 'hardcore',
    }) || rankings.list().some(e => e.runId === this.rankingId);
    if (this.submitted) this.namePrompt?.setText('YOUR NAME IS IN THE BOOKS, GUNSLINGER.');
    return this.submitted;
  }

  private openRanking() {
    if (this.openingRanking) return;
    if (!this.saveRanking()) { this.namePrompt?.setText('ENTER A NAME TO SAVE YOUR SCORE'); }
    this.openingRanking = true;
    this.scene.start('RankingScene', { fromScene: 'TitleScene' });
  }

  private retry() {
    this.saveRanking();
    sounds.playGunReload();
    sounds.playGameplayMusic(this.stats.stage || 1);

    this.scene.start('WantedScene', {
      character: this.stats.character,
      stage: this.stats.stage || 1,
      difficulty: this.stats.difficulty,
    });
  }

  private returnToTitle() {
    this.saveRanking();
    sounds.playRevolver();
    sounds.playIntroMusic();

    this.scene.start('TitleScene');
  }

}
