import { framePath } from '../assets/registry';
import Phaser from 'phaser';

/**
 * Simon Greedwell (boss) com sprites do Pixellab:
 * corrida (6 quadros, leste/oeste), tiro para baixo (9 quadros) e morte (7 quadros).
 * Arquivos: public/assets/bosses/pixellab/greedwell/Idle/animations/<anim>/frame_<000..008>.png
 */
const ANIMS = {
  run_east: { frames: 6, frameRate: 10, repeat: -1 },
  run_west: { frames: 6, frameRate: 10, repeat: -1 },
  shoot: { frames: 9, frameRate: 14, repeat: 0 },
  death: { frames: 7, frameRate: 9, repeat: 0 },
} as const;

export type GreedwellAnim = keyof typeof ANIMS;
export const GREEDWELL_SCALE = 0.55;
/** Quadro do tiro (0-based) em que as balas saem. */
export const GREEDWELL_SHOOT_FIRE_FRAME = 5;

const texKey = (anim: GreedwellAnim, i: number) => `pl_greedwell_${anim}_${i}`;
export const greedwellAnimKey = (anim: GreedwellAnim) => `pl_greedwell_${anim}`;

export function preloadGreedwell(scene: Phaser.Scene): void {
  (Object.keys(ANIMS) as GreedwellAnim[]).forEach((anim) => {
    for (let i = 0; i < ANIMS[anim].frames; i++) {
      scene.load.image(texKey(anim, i), framePath(`greedwell:${anim}`, '', i));
    }
  });
}

export function hasGreedwellSprites(scene: Phaser.Scene): boolean {
  return scene.textures.exists(texKey('run_east', 0));
}

export function greedwellFirstFrame(anim: GreedwellAnim): string {
  return texKey(anim, 0);
}

export function createGreedwellAnims(scene: Phaser.Scene): void {
  (Object.keys(ANIMS) as GreedwellAnim[]).forEach((anim) => {
    const key = greedwellAnimKey(anim);
    if (scene.anims.exists(key)) return;
    const cfg = ANIMS[anim];
    scene.anims.create({
      key,
      frames: Array.from({ length: cfg.frames }, (_, i) => ({ key: texKey(anim, i) })),
      frameRate: cfg.frameRate,
      repeat: cfg.repeat,
    });
  });
}
