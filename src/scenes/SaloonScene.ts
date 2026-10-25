import { GALLERY_BOSS_KEYS } from '../data/shootingGallery';
import { ShootingGalleryView } from '../ui/ShootingGalleryView';
import { FaroTableView } from '../ui/FaroTableView';
import type { FaroTable } from '../data/faro';
import type { UpgradeChoice } from './LevelUpScene';
import Phaser from 'phaser';
import { CATALOG, preloadImages } from '../assets/registry';
import { createMenuRoot } from '../ui/layout/menuLayout';
import { bindPulpKeys, bindPulpMenu, preloadPulp, pulpBackdrop, pulpButton, pulpHeading, pulpPaper, pulpText, pulpWood } from '../ui/layout/pulpSceneKit';
import { SALOON_REWARD } from '../data/saloon';
import { sounds } from '../audio/SoundManager';

export interface SaloonSceneData { gallery?: boolean; galleryStage?: number; onGalleryLeave?: (reward: { bounty: number; xp: number }) => void; faro?: boolean; hospitality?: boolean; table?: FaroTable; prize?: UpgradeChoice; onLeave: (accept: boolean) => void; }

/** Separate interior, illustration, footlights and interactive UI; gameplay scene stays paused. */
export class SaloonScene extends Phaser.Scene {
  private onLeave!: SaloonSceneData['onLeave'];
  private finished = false;
  private faro = false;
  private gallery?: SaloonSceneData['onGalleryLeave'];
  private galleryStage = 1;
  private table?: FaroTable;
  private prize?: UpgradeChoice;
  private hospitality = false;
  constructor() { super('SaloonScene'); }
  init(data: SaloonSceneData) { this.galleryStage = data.galleryStage ?? 1; this.gallery = data.gallery ? data.onGalleryLeave : undefined; this.table = data.table; this.prize = data.prize; this.hospitality = !!data.hospitality; this.faro = !!data.faro && !this.hospitality; this.onLeave = data.onLeave; this.finished = false; }
  preload() { preloadPulp(this); preloadImages(this, ['saloon_cancan', 'faro_dealer']);
    if (this.gallery) preloadImages(this, GALLERY_BOSS_KEYS);
    const key = this.prize?.type === 'reward' ? 'card_badge' : `card_${this.prize?.id}`;
    if (key in CATALOG.images) preloadImages(this, [key]); }
  create() {
    const root = createMenuRoot(this);
    pulpBackdrop(this, root, true);
    if (this.hospitality) sounds.playHospitalityGreeting();
    else if (!this.gallery) sounds.playDealerGreeting();
    this.events.once('shutdown', () => sounds.stopFaroAudio());
    if (this.gallery) { new ShootingGalleryView(this, root, this.gallery, this.galleryStage); return; }
    if (this.faro && this.table && this.prize) {
      new FaroTableView(this, root, this.table, this.prize, () => this.finish(true));
      return;
    }
    pulpHeading(this, root, this.hospitality ? 'HOSPITALITY HOUSE' : 'FRONTIER SALOON', -390, 1260, 76, true);
    if (!this.hospitality) pulpText(this, root, 0, -280, 'A BREATHER BETWEEN GUNFIGHTS', 26);
    pulpWood(this, root, 0, 194, 1160, 64);
    const dancers = this.add.image(0, 180, 'saloon_cancan').setOrigin(0.5, 1);
    dancers.setScale(Math.min(1040 / dancers.width, 420 / dancers.height));
    root.add(dancers);
    // The still illustration is independent of the softly moving stage lighting.
    for (const x of [-420, 0, 420]) {
      const light = this.add.graphics().setPosition(x, 182).setBlendMode(Phaser.BlendModes.ADD);
      for (let r = 64; r > 4; r -= 8) light.fillStyle(0xffc52a, 0.018).fillCircle(0, 0, r);
      root.add(light);
      this.tweens.add({ targets: light, alpha: 0.45, duration: 1100, yoyo: true, repeat: -1 });
    }
    pulpPaper(this, root, 0, 280, 1120, 96);
    pulpText(this, root, 0, this.hospitality ? 280 : 264, this.hospitality ? 'WELCOME: +20 XP • RESTORE 12% HEALTH' : `ON THE HOUSE: RESTORE ${SALOON_REWARD.healthFraction * 100}% HEALTH  +$${SALOON_REWARD.bounty}`, 30, '#a51e16');
    if (!this.hospitality) pulpText(this, root, 0, 302, 'ONE VISIT PER DOOR • OPTIONAL • COMBAT PAUSED', 21, '#120b08');
    bindPulpMenu(this, [
      pulpButton(this, root, -270, 390, this.hospitality ? 'REST & RETURN' : 'ACCEPT & RETURN', () => this.finish(true), 510, true),
      pulpButton(this, root, 270, 390, 'LEAVE WITHOUT BONUS', () => this.finish(false), 510),
    ], true);
    pulpText(this, root, 0, 465, '[← →] SELECT   [ENTER] CONFIRM   [ESC] LEAVE', 22);
    bindPulpKeys(this, { ESC: () => this.finish(false) });
    // Existing game music continues; this scene never starts or switches a track.
  }
  private finish(accept: boolean): void {
    if (this.finished) return;
    this.finished = true;
    sounds.playRevolver();
    this.onLeave(accept);
  }
}
