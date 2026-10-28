import type Phaser from 'phaser';
import { THEME } from '../theme/tokens';

export function menuTransform(width: number, height: number, reference = { width: THEME.layout.referenceWidth, height: THEME.layout.referenceHeight }) {
  return {
    x: width / 2, y: height / 2,
    scale: Math.min(Math.max(1, width) / reference.width, Math.max(1, height) / reference.height),
  };
}

/** One subscription per scene run, disposed even when a menu exits unexpectedly. */
export function createMenuRoot(scene: Phaser.Scene, reference?: { width: number; height: number }): Phaser.GameObjects.Container {
  const root = scene.add.container(0, 0);
  const resize = () => {
    const fit = menuTransform(scene.scale.width, scene.scale.height, reference);
    root.setPosition(fit.x, fit.y).setScale(fit.scale);
  };
  resize();
  scene.scale.on('resize', resize);
  scene.events.once('shutdown', () => scene.scale.off('resize', resize));
  return root;
}

/** Preserve artwork proportions while covering the entire canvas behind the menu root. */
export function menuBackdropScale(viewWidth: number, viewHeight: number, imageWidth: number, imageHeight: number): number {
  const fit = menuTransform(viewWidth, viewHeight).scale;
  return Math.max(viewWidth / fit / Math.max(1, imageWidth), viewHeight / fit / Math.max(1, imageHeight));
}
