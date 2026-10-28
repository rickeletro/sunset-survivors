import type Phaser from 'phaser';
import { BAKED_VISIBLE_HEIGHTS, classifyAsset, normalizedScale, visibleBounds } from '../data/worldScale';

const measured = new Map<string, number | null>();

/** Visible native height of a texture, measured once per key (cached). Falls back to the baked table. */
export function visibleHeightOf(scene: Phaser.Scene, key: string): number | null {
  if (measured.has(key)) return measured.get(key) ?? null;
  let height: number | null = null;
  try {
    const source = scene.textures?.get?.(key)?.getSourceImage?.() as CanvasImageSource & { width: number; height: number } | undefined;
    if (source && typeof document !== 'undefined' && source.width > 0) {
      const canvas = document.createElement('canvas');
      canvas.width = source.width; canvas.height = source.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(source, 0, 0);
        height = visibleBounds(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height)?.height ?? null;
      }
    }
  } catch { height = null; }
  height ??= BAKED_VISIBLE_HEIGHTS[key] ?? null;
  measured.set(key, height);
  return height;
}

/**
 * Scale for a scenery sprite relative to the hero. Computed from the texture once; objects already
 * in range (or unidentified) return `baseScale` untouched. Colliders, origins and depth are not modified.
 */
export function worldScaleFor(scene: Phaser.Scene, key: string, baseScale = 1): number {
  const category = classifyAsset(key);
  if (!category) return baseScale;
  const height = visibleHeightOf(scene, key);
  return height ? normalizedScale(category, height, baseScale) : baseScale;
}

/** Applies the normalized scale once per image (guarded by a data flag). */
export function normalizeSceneryScale<T extends Phaser.GameObjects.Image>(scene: Phaser.Scene, image: T, key: string): T {
  if (image.getData?.('worldScaled')) return image;
  const base = image.scaleX || 1;
  const next = worldScaleFor(scene, key, base);
  if (next !== base) image.setScale(next);
  image.setData?.('worldScaled', true);
  return image;
}
