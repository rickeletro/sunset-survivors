import { preloadPulp, pulpBackdrop, bindPulpKeys } from '../ui/layout/pulpSceneKit';
import { normalizeDifficulty, difficultySettings, type DifficultyId } from '../data/difficulty';
import { preloadImages } from '../assets/registry';
import { createMenuRoot } from '../ui/layout/menuLayout';
import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { type CharacterData, CHARACTERS } from '../data/characters';
import { type BossData, getBossForStage } from '../data/bosses';
import type { StageClearData } from './StageClearScene';

export interface WantedSceneData extends Partial<StageClearData> {
  mode?: 'briefing' | 'captured';
}

/** One clean poster: announce the target before play; confirm capture only after the boss falls. */
export class WantedScene extends Phaser.Scene {
  private character!: CharacterData;
  private stage = 1;
  private difficulty: DifficultyId = 'normal';
  private mode: 'briefing' | 'captured' = 'briefing';
  private result?: StageClearData;
  private bossData!: BossData;
  private rootContainer!: Phaser.GameObjects.Container;
  private posterContainer!: Phaser.GameObjects.Container;
  private posterWidth = 580;
  private posterHeight = 800;
  private isAdvancing = false;
  private cancelled = false;
  private ready = false;

  constructor() { super('WantedScene'); }

  init(data?: WantedSceneData) {
    this.character = data?.character ?? CHARACTERS.billy;
    this.difficulty = normalizeDifficulty(data?.difficulty ?? difficultySettings.get());
    const queryStage = Number(new URLSearchParams(window.location.search).get('stage'));
    this.stage = data?.stage || queryStage || 1;
    this.bossData = getBossForStage(this.stage);
    this.mode = data?.mode === 'captured' ? 'captured' : 'briefing';
    this.result = this.mode === 'captured' ? {
      runId: data?.runId, walletSynced: data?.walletSynced, earnedBounty: data?.earnedBounty, bonus: data?.bonus, hpPct: data?.hpPct,
      character: this.character, stage: this.stage, difficulty: this.difficulty,
      timeSurvivedSeconds: data?.timeSurvivedSeconds ?? 0,
      kills: data?.kills ?? 0, bounty: data?.bounty ?? 0, level: data?.level ?? 1,
    } : undefined;
  }

  preload() {
    preloadPulp(this);
    preloadImages(this, [this.bossData.posterKey]);
  }

  create() {
    this.isAdvancing = false;
    this.cancelled = false;
    this.ready = false;
    this.rootContainer = createMenuRoot(this);
    // Exactly the same independent, clean landscape used by character selection.
    pulpBackdrop(this, this.rootContainer, false);
    this.posterContainer = this.add.container(0, 14).setAlpha(0).setScale(0.96);
    const poster = this.add.image(0, 0, this.bossData.posterKey);
    const scale = Math.min(580 / poster.width, 800 / poster.height);
    poster.setScale(scale);
    this.posterWidth = poster.width * scale;
    this.posterHeight = poster.height * scale;
    this.posterContainer.add(poster);
    this.rootContainer.add(this.posterContainer);

    this.events.once('shutdown', () => { this.cancelled = true; this.ready = false; });
    this.tweens.add({
      targets: this.posterContainer, y: 0, alpha: 1, scaleX: 1, scaleY: 1,
      duration: 480, ease: 'Sine.easeOut',
      onComplete: () => {
        if (this.cancelled || this.isAdvancing) return;
        if (this.mode === 'captured') this.playCapture();
        else this.ready = true;
      },
    });

    const advance = () => { if (this.ready) this.advance(); };
    bindPulpKeys(this, { ENTER: advance, SPACE: advance });
    this.input.on('pointerdown', advance);
    this.events.once('shutdown', () => this.input.off('pointerdown', advance));
    if (this.mode === 'briefing') this.after(4200, () => this.advance());
  }

  private after(delay: number, callback: () => void): void {
    this.time.delayedCall(delay, () => { if (!this.cancelled) callback(); });
  }

  private playCapture(): void {
    const hits = [
      { x: -0.16, y: -0.15 }, { x: 0.17, y: -0.08 },
      { x: -0.09, y: 0.10 }, { x: 0.19, y: 0.18 },
    ];
    hits.forEach((hit, index) => this.after(280 + index * 340, () => {
      if (this.isAdvancing) return;
      // The same sampled gunshot as player guns, honoring the central mute/SFX volume.
      sounds.playPlayerGunshot();
      this.cameras.main.shake(65, 0.0035);
      this.cameras.main.flash(45, 255, 230, 170, false);
      this.createBulletHole(hit.x * this.posterWidth, hit.y * this.posterHeight);
      if (index === hits.length - 1) {
        this.ready = true;
        this.after(900, () => this.advance());
      }
    }));
  }

  private createBulletHole(x: number, y: number): void {
    const hole = this.add.graphics();
    // Stepped torn-paper edges and a charred center, separate from the original artwork.
    hole.fillStyle(0x603719).fillRect(x - 9, y - 5, 18, 10).fillRect(x - 5, y - 9, 10, 18);
    hole.fillStyle(0xf2d49a).fillRect(x - 12, y - 2, 4, 3).fillRect(x + 7, y - 8, 3, 4).fillRect(x - 3, y + 8, 4, 3);
    hole.fillStyle(0x120b08).fillRect(x - 5, y - 6, 10, 12).fillRect(x - 7, y - 3, 14, 6);
    this.posterContainer.add(hole);
    for (let i = 0; i < 7; i++) {
      const fleck = this.add.graphics().fillStyle(i % 2 ? 0xf2d49a : 0x603719).fillRect(-2, -1, 4, 2);
      fleck.setPosition(x, y); this.posterContainer.add(fleck);
      const angle = i * 2.399;
      this.tweens.add({ targets: fleck, x: x + Math.cos(angle) * 38, y: y + Math.sin(angle) * 38 + 18,
        alpha: 0, duration: 320, onComplete: () => fleck.destroy() });
    }
  }

  private advance(): void {
    if (this.isAdvancing || this.cancelled) return;
    this.isAdvancing = true;
    this.cameras.main.fade(300, 0, 0, 0);
    this.after(320, () => {
      if (this.mode === 'captured') this.scene.start('StageClearScene', this.result);
      else this.scene.start('GameScene', { character: this.character, stage: this.stage, difficulty: this.difficulty });
    });
  }
}
