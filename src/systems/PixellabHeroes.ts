import { CATALOG, framePath, SequenceKey } from '../assets/registry';
import Phaser from 'phaser';

/**
 * Heróis do Pixellab com direções disponíveis declaradas no catálogo de assets.
 * Direções ausentes usam os fallbacks legados; Billy possui as oito vistas reais.
 * Se uma direção não existir para um herói, há fallback (SE→E, N→S).
 *
 * Arquivos: public/assets/characters/pixellab/<hero>/Idle/animations/walking-4-frames/<dir>/frame_<000..003>.png
 * Ao baixar novas direções, registre-as em assets/catalog.json.
 */
export type PixelDir = 'north' | 'south' | 'east' | 'west' | 'south-east' | 'south-west' | 'north-east' | 'north-west';

const AVAILABLE_DIRS = Object.fromEntries(Object.entries(CATALOG.sequences)
  .filter(([key]) => key.startsWith('hero:'))
  .map(([key, config]) => [key.slice(5), config.directions])) as Record<string, PixelDir[]>;

const FRAMES = 4;
const FRAME_RATE = 8;
export const PIXELLAB_HERO_SCALE = 0.5;

const texKey = (hero: string, dir: PixelDir, i: number) => `pl_${hero}_${dir}_${i}`;
const animKey = (hero: string, dir: PixelDir) => `pl_${hero}_${dir}_walk`;

export function hasPixellabHero(hero: string): boolean {
  return hero in AVAILABLE_DIRS;
}

export function preloadPixellabHeroes(scene: Phaser.Scene): void {
  for (const [hero, dirs] of Object.entries(AVAILABLE_DIRS)) {
    for (const dir of dirs) {
      for (let i = 0; i < FRAMES; i++) {
        scene.load.image(texKey(hero, dir, i), framePath(`hero:${hero}` as SequenceKey, dir, i));
      }
    }
  }
}

export function createPixellabAnims(scene: Phaser.Scene, hero: string): void {
  for (const dir of AVAILABLE_DIRS[hero] ?? []) {
    const key = animKey(hero, dir);
    if (scene.anims.exists(key)) continue;
    scene.anims.create({
      key,
      frames: Array.from({ length: FRAMES }, (_, i) => ({ key: texKey(hero, dir, i) })),
      frameRate: FRAME_RATE,
      repeat: -1,
    });
  }
}

export interface DirChoice {
  dir: PixelDir;
  flipX: boolean;
}

/** Converte o vetor de movimento (tela, y para baixo) em uma das 6 direções. */
export function pickDirection(hero: string, dx: number, dy: number): DirChoice {
  const has = (d: PixelDir) => (AVAILABLE_DIRS[hero] ?? []).includes(d);
  const right = dx >= 0;
  const theta = (Math.atan2(Math.abs(dy), Math.abs(dx)) * 180) / Math.PI; // 0 = lateral, 90 = vertical

  const side = (): DirChoice => {
    if (right) return has('east') ? { dir: 'east', flipX: false } : { dir: 'west', flipX: true };
    return has('west') ? { dir: 'west', flipX: false } : { dir: 'east', flipX: true };
  };
  const south = (): DirChoice => ({ dir: 'south', flipX: false });
  const north = (): DirChoice => (has('north') ? { dir: 'north', flipX: false } : south());

  if (theta < 25) return side();
  if (theta > 65) return dy < 0 ? north() : south();
  if (dy < 0) {
    const diagonal = right ? 'north-east' : 'north-west';
    return has(diagonal) ? { dir: diagonal, flipX: false } : north();
  }
  if (!right && has('south-west')) return { dir: 'south-west', flipX: false };
  return has('south-east') ? { dir: 'south-east', flipX: !right } : side(); // SE / SW
}

export function pixellabAnimKey(hero: string, dir: PixelDir): string {
  return animKey(hero, dir);
}

export function pixellabIdleFrame(hero: string, dir: PixelDir): string {
  return texKey(hero, dir, 0);
}
