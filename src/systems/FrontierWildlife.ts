import { chickenFrame } from './ChickenSprites';
import type Phaser from 'phaser';
import { stageChickens, segmentHitsChicken, collectChicken } from '../data/frontierWildlife';
import type { StageTheme } from '../data/stages';
import { worldDepth } from '../data/scenery';

/** Nine actors at most; distant birds keep state without display objects. */
export class FrontierWildlife {
  private birds;
  private views = new Map<number, Phaser.GameObjects.Image>();
  private elapsed = 0;
  constructor(private scene: Phaser.Scene, theme: StageTheme) {
    this.birds = stageChickens(theme);
    scene.events.once('shutdown', () => { for (const image of this.views.values()) image.destroy(); this.views.clear(); });
  }
  hit(ax: number, ay: number, bx: number, by: number): void {
    for (const bird of this.birds) if (segmentHitsChicken(bird, ax, ay, bx, by)) bird.cooked = true;
  }
  update(delta: number, x: number, y: number, hp: number, maxHp: number, clear: (x: number, y: number) => { x: number; y: number }): number {
    this.elapsed += Math.min(delta, 100);
    let healed = 0;
    this.birds.forEach((bird, index) => {
      const near = Math.abs(bird.homeX - x) < 950 && Math.abs(bird.homeY - y) < 750;
      if (!near || bird.collected) { this.views.get(index)?.destroy(); this.views.delete(index); return; }
      if (!bird.cooked) {
        const t = this.elapsed * 0.0007 + bird.phase;
        const point = clear(bird.homeX + Math.sin(t) * 55, bird.homeY + Math.sin(t * 0.7) * 32);
        bird.x = point.x; bird.y = point.y;
      }
      healed += collectChicken(bird, x, y, hp + healed, maxHp);
      if (bird.collected) { this.views.get(index)?.destroy(); this.views.delete(index); return; }
      let image = this.views.get(index);
      const t = this.elapsed * 0.0007 + bird.phase;
      const frame = chickenFrame(Math.cos(t) * 55, Math.cos(t * 0.7) * 22.4, this.elapsed, bird.phase);
      if (!image) { image = this.scene.add.image(bird.x, bird.y, bird.cooked ? 'stage_roast' : frame).setOrigin(0.5, 1); this.views.set(index, image); }
      image.setTexture(bird.cooked ? 'stage_roast' : frame).setPosition(bird.x, bird.y)
        .setDepth(worldDepth(bird.y)).setFlipX(false);
      image.setAngle(0);
    });
    return healed;
  }
}
