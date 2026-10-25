import type Phaser from 'phaser';
import { CATALOG, framePath } from '../assets/registry';
import type { StageTheme } from '../data/stages';

const sequence = 'wildlife:chicken-walk' as const;
export const CHICKEN_DIRECTIONS = ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'] as const;
export function chickenFrame(dx: number, dy: number, elapsed: number, phase: number): string {
  const angle = Math.atan2(dy, dx);
  const direction = CHICKEN_DIRECTIONS[(Math.round(angle / (Math.PI / 4)) + 8) % 8];
  const frame = ((Math.floor(elapsed / 125) + phase * 2) % 9 + 9) % 9;
  return `chicken_walk_${direction}_${frame}`;
}
export function preloadChickens(scene: Phaser.Scene, theme: StageTheme): void {
  if (['saloon', 'caboose', 'manor'].includes(theme)) return;
  for (const direction of CATALOG.sequences[sequence].directions) for (let i = 0; i < CATALOG.sequences[sequence].frames; i++) {
    const key = `chicken_walk_${direction}_${i}`;
    if (!scene.textures.exists(key)) scene.load.image(key, framePath(sequence, direction, i));
  }
}
