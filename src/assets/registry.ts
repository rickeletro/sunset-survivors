import type Phaser from 'phaser';
import catalog from './catalog.json';

/** All served image paths live here. Tooling reads the same JSON to audit public/. */
export const CATALOG = catalog;
export type ImageKey = keyof typeof catalog.images;
export type SequenceKey = keyof typeof catalog.sequences;
export function framePath(sequence: SequenceKey, direction: string, frame: number): string {
  const entry = catalog.sequences[sequence];
  return `${entry.root}/${direction ? `${direction}/` : ''}frame_${String(frame).padStart(3, '0')}.png`;
}
export function preloadImages(scene: Phaser.Scene, keys: readonly string[]): void {
  for (const key of keys) {
    const path = catalog.images[key as ImageKey];
    if (!path) throw new Error(`Unknown asset key: ${key}`);
    if (!scene.textures.exists(key)) scene.load.image(key, path);
  }
}
export function preloadHeroSheets(scene: Phaser.Scene): void {
  for (const [key, { path, frameWidth, frameHeight }] of Object.entries(catalog.sheets)) {
    if (!scene.textures.exists(key)) scene.load.spritesheet(key, path, { frameWidth, frameHeight });
  }
}
