import Phaser from 'phaser';
import { preloadImages } from '../assets/registry';
import { createMenuRoot } from '../ui/layout/menuLayout';
import { bindPulpKeys, bindPulpMenu, preloadPulp, pulpBackdrop, pulpButton, pulpHeading, pulpPaper, pulpText, pulpWood } from '../ui/layout/pulpSceneKit';
import { SALOON_REWARD } from '../data/saloon';
import { sounds } from '../audio/SoundManager';

export interface SaloonSceneData { onLeave: (accept: boolean) => void; }

/** Separate interior, illustration, footlights and interactive UI; gameplay scene stays paused. */
export class SaloonScene extends Phaser.Scene {
  private onLeave!: SaloonSceneData['onLeave'];
  private finished = false;
  constructor() { super('SaloonScene'); }
  init(data: SaloonSceneData) { this.onLeave = data.onLeave; this.finished = false; }
  preload() { preloadPulp(this); preloadImages(this, ['saloon_cancan']); }
  create() {
    const root = createMenuRoot(this);
    pulpBackdrop(this, root, true);
    pulpHeading(this, root, 'FRONTIER SALOON', -390, 1260, 76, true);
    pulpText(this, root, 0, -280, 'UM RESPIRO ENTRE TIROTEIOS', 26);
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
    pulpText(this, root, 0, 264, `BRINDE: RESTAURA ${SALOON_REWARD.healthFraction * 100}% DA VIDA  +$${SALOON_REWARD.bounty}`, 30, '#a51e16');
    pulpText(this, root, 0, 302, 'UMA VISITA POR FASE • OPCIONAL • COMBATE PAUSADO', 21, '#120b08');
    bindPulpMenu(this, [
      pulpButton(this, root, -270, 390, 'BRINDE E VOLTAR', () => this.finish(true), 510, true),
      pulpButton(this, root, 270, 390, 'SAIR SEM BONUS', () => this.finish(false), 510),
    ], true);
    pulpText(this, root, 0, 465, '[← →] ESCOLHER   [ENTER] CONFIRMAR   [ESC] SAIR', 22);
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
