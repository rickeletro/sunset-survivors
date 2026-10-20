import type Phaser from 'phaser';
import { THEME } from '../theme/tokens';

export function menuTransform(width: number, height: number) {
  return {
    x: width / 2, y: height / 2,
    scale: Math.min(Math.max(1, width) / THEME.layout.referenceWidth, Math.max(1, height) / THEME.layout.referenceHeight),
  };
}

/** One subscription per scene run, disposed even when a menu exits unexpectedly. */
export function createMenuRoot(scene: Phaser.Scene): Phaser.GameObjects.Container {
  const root = scene.add.container(0, 0);
  const resize = () => {
    const fit = menuTransform(scene.scale.width, scene.scale.height);
    root.setPosition(fit.x, fit.y).setScale(fit.scale);
  };
  resize();
  scene.scale.on('resize', resize);
  scene.events.once('shutdown', () => scene.scale.off('resize', resize));
  return root;
}
