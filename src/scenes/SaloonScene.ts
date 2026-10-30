import { GALLERY_BOSS_KEYS } from '../data/shootingGallery';
import { ShootingGalleryView } from '../ui/ShootingGalleryView';
import { FaroTableView } from '../ui/FaroTableView';
import type { FaroTable } from '../data/faro';
import type { UpgradeChoice } from './LevelUpScene';
import Phaser from 'phaser';
import { CATALOG, preloadImages } from '../assets/registry';
import { createMenuRoot } from '../ui/layout/menuLayout';
import { bindPulpKeys, bindPulpMenu, preloadPulp, pulpBackdrop, pulpButton, pulpHeading, pulpPaper, pulpText, pulpWood } from '../ui/layout/pulpSceneKit';
import { ECONOMY, servicePrice, type RunServiceId } from '../data/economy';
import { sounds } from '../audio/SoundManager';
import { t, getServiceName } from '../i18n';

export interface SaloonSceneData { gallery?: boolean; galleryStage?: number; onGalleryLeave?: (reward: { bounty: number; xp: number }) => void; faro?: boolean; hospitality?: boolean; table?: FaroTable; prize?: UpgradeChoice; getBalance?: () => number; canBuy?: (id: RunServiceId) => boolean; onBuy?: (id: RunServiceId) => boolean; onLeave: (accept: boolean) => void; }

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
  private shop?: Pick<SaloonSceneData, 'getBalance' | 'canBuy' | 'onBuy'>;
  constructor() { super('SaloonScene'); }
  init(data: SaloonSceneData) { this.shop = data; this.galleryStage = data.galleryStage ?? 1; this.gallery = data.gallery ? data.onGalleryLeave : undefined; this.table = data.table; this.prize = data.prize; this.hospitality = !!data.hospitality; this.faro = !!data.faro && !this.hospitality; this.onLeave = data.onLeave; this.finished = false; }
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
    if (this.gallery) { new ShootingGalleryView(this, root, this.gallery, this.galleryStage, { price:servicePrice('gallery',this.galleryStage), balance:()=>this.shop?.getBalance?.() ?? 0, pay:()=>this.shop?.onBuy?.('gallery') ?? false }); return; }
    if (this.faro && this.table && this.prize) {
      new FaroTableView(this, root, this.table, this.prize, () => this.finish(true));
      return;
    }
    pulpHeading(this, root, this.hospitality ? t('saloon.hospitalityTitle') : t('saloon.title'), -390, 1260, 76, true);
    if (!this.hospitality) pulpText(this, root, 0, -280, t('saloon.breather'), 26);
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
    pulpPaper(this, root, 0, 258, 1260, 76);
    const balance = pulpText(this, root, 0, 258, '', 26, '#a51e16');
    const ids: RunServiceId[] = [this.hospitality ? 'hospitality_rest' : 'saloon_rest', 'special_rounds', 'gun_oil'];
    const buttons: ReturnType<typeof pulpButton>[] = [];
    const descriptions = [this.hospitality ? t('saloon.restoreHealth12Xp') : t('saloon.restoreHealth20'), t('saloon.specialRounds'), t('saloon.gunOil')];
    const refresh = () => {
      balance.setText(t('saloon.walletBalance', { bounty: `$${this.shop?.getBalance?.() ?? 0}` }));
      ids.forEach((id,i) => buttons[i].setEnabled(this.shop?.canBuy?.(id) ?? false));
    };
    ids.forEach((id,i) => {
      const x=(i-1)*426, price=servicePrice(id,this.galleryStage);
      buttons.push(pulpButton(this,root,x,350,`${getServiceName(id, ECONOMY.services[id].name)} $${price}`,()=>{
        if (this.shop?.onBuy?.(id)) { sounds.playCoin(); refresh(); }
      },410,i===0));
      pulpText(this,root,x,406,descriptions[i],20);
    });
    buttons.push(pulpButton(this,root,0,470,t('saloon.returnToFrontier'),()=>this.finish(false),620));
    refresh(); bindPulpMenu(this,buttons);
    bindPulpKeys(this,{ ESC:()=>this.finish(false) });
    // Existing game music continues; this scene never starts or switches a track.
  }
  private finish(accept: boolean): void {
    if (this.finished) return;
    this.finished = true;
    sounds.playRevolver();
    this.onLeave(accept);
  }
}
