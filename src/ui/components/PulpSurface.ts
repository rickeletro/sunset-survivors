import type Phaser from 'phaser';
import { preloadImages } from '../../assets/registry';

/** Editable material art only: labels, portraits and interaction always remain separate. */
export const PULP_SURFACES = ['ui_pulp_paper', 'ui_pulp_wood'] as const;
export type PulpMaterial = 'paper' | 'wood';
export function preloadSurfaces(scene: Phaser.Scene): void { preloadImages(scene, PULP_SURFACES); }
export function pulpSurface(scene: Phaser.Scene, x: number, y: number, width: number, height: number, material: PulpMaterial): Phaser.GameObjects.NineSlice {
  return scene.add.nineslice(x, y, `ui_pulp_${material}`, undefined, width, height, 32, 32, 32, 32);
}
