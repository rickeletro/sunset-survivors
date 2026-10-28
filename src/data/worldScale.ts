/**
 * World scale rules: every scenery object is compared with the hero's VISIBLE height
 * (alpha bounds x render scale), never with the PNG canvas size.
 * Ranges are ratios (object visible world height / hero visible world height) and are
 * calibrated on the approved art baseline (.agents/skills/western-pulp-arcade/references/scale-baseline.json).
 */

/** Steve visible alpha height (137 px) x PIXELLAB_HERO_SCALE (0.5). Matches the lantern-pole reference in StageLandmarks. */
export const HERO_VISIBLE_WORLD_HEIGHT = 68.5;

export type ScaleCategory =
  | 'building' | 'rolling-stock' | 'wagon' | 'tower' | 'small-container' | 'furniture' | 'fence' | 'well'
  | 'cactus' | 'tree' | 'dead-tree' | 'rock' | 'statue' | 'lamp-post' | 'tent' | 'ruin'
  | 'iso-lantern-barrel' | 'iso-crate-wheel' | 'iso-wanted-wall';

export interface ScaleRange { min: number; max: number; }

export const SCALE_RANGES: Record<ScaleCategory, ScaleRange> = {
  building: { min: 1.8, max: 3.6 },
  'rolling-stock': { min: 1.0, max: 2.5 },
  wagon: { min: 0.9, max: 2.5 },
  tower: { min: 1.8, max: 3.2 },
  'small-container': { min: 0.3, max: 0.8 },
  furniture: { min: 0.5, max: 0.95 },
  fence: { min: 0.6, max: 1.2 },
  well: { min: 0.9, max: 1.5 },
  cactus: { min: 1.4, max: 2.2 },
  tree: { min: 1.8, max: 3.0 },
  'dead-tree': { min: 1.2, max: 2.2 },
  rock: { min: 0.3, max: 0.9 },
  statue: { min: 1.3, max: 2.2 },
  'lamp-post': { min: 2.0, max: 3.2 },
  tent: { min: 0.9, max: 1.5 },
  ruin: { min: 1.0, max: 1.8 },
  'iso-lantern-barrel': { min: 0.5, max: 0.9 },
  'iso-crate-wheel': { min: 0.5, max: 1.1 },
  'iso-wanted-wall': { min: 1.0, max: 1.7 },
};

const RULES: [RegExp, ScaleCategory][] = [
  [/^iso_barrel_lantern$/, 'iso-lantern-barrel'],
  [/^iso_crate_wheel$/, 'iso-crate-wheel'],
  [/^iso_wanted_wall$/, 'iso-wanted-wall'],
  [/^scenery_(locomotive|cargo-wagon|passenger-wagon)$/, 'rolling-stock'],
  [/^scenery_water-tower$/, 'tower'],
  [/^scenery_(saloon|frontier-saloon|gallery-saloon|house|sheriff|general-store|barn|hacienda|manor|rail-station|mine-entrance)$/, 'building'],
  [/^scenery_supply-cart$|^wm_wagon$/, 'wagon'],
  [/^scenery_well$/, 'well'],
  [/^scenery_hitching-post$|^wm_barricade$/, 'fence'],
  [/^wm_(barrel|crate)$/, 'small-container'],
  [/^wm_table$/, 'furniture'],
  [/^wm_cactus$/, 'cactus'],
  [/^wm_(palm|pine)$/, 'tree'],
  [/^wm_deadtree$/, 'dead-tree'],
  [/^wm_rock$/, 'rock'],
  [/^wm_statue$/, 'statue'],
  [/^wm_lantern$/, 'lamp-post'],
  [/^wm_tent$/, 'tent'],
  [/^wm_ruin$/, 'ruin'],
];

/** Returns null when the key cannot be identified with confidence: such objects are never touched. */
export function classifyAsset(key: string): ScaleCategory | null {
  for (const [pattern, category] of RULES) if (pattern.test(key)) return category;
  return null;
}

/** Visible (alpha >= threshold) bounds of an RGBA buffer. Returns null for a fully transparent image. */
export function visibleBounds(rgba: ArrayLike<number>, width: number, height: number, threshold = 16): { x: number; y: number; width: number; height: number } | null {
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (rgba[(y * width + x) * 4 + 3] < threshold) continue;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  return maxX < 0 ? null : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/**
 * Uniform scale that keeps the object inside its category range.
 * Objects already in range, unknown categories and invalid measurements keep `currentScale`.
 */
export function normalizedScale(
  category: ScaleCategory | null, visibleHeight: number, currentScale: number,
  heroHeight = HERO_VISIBLE_WORLD_HEIGHT,
): number {
  if (!category || !(visibleHeight > 0) || !(currentScale > 0) || !(heroHeight > 0)) return currentScale;
  const ratio = visibleHeight * currentScale / heroHeight;
  const { min, max } = SCALE_RANGES[category];
  if (ratio < min) return min * heroHeight / visibleHeight;
  if (ratio > max) return max * heroHeight / visibleHeight;
  return currentScale;
}

/** Native visible heights measured from the shipped PNGs; used when canvas pixel access is unavailable. */
export const BAKED_VISIBLE_HEIGHTS: Record<string, number> = {
  scenery_barn: 183, 'scenery_cargo-wagon': 91, 'scenery_general-store': 152, scenery_hacienda: 170,
  'scenery_hitching-post': 54, scenery_house: 141, scenery_locomotive: 71, scenery_manor: 212,
  'scenery_mine-entrance': 171, 'scenery_passenger-wagon': 73, 'scenery_rail-station': 165, scenery_saloon: 228,
  'scenery_frontier-saloon': 228, 'scenery_gallery-saloon': 228, scenery_sheriff: 149, 'scenery_supply-cart': 93,
  'scenery_water-tower': 166, scenery_well: 80, iso_barrel_lantern: 79, iso_crate_wheel: 100, iso_wanted_wall: 122,
  wm_barrel: 40, wm_barricade: 44, wm_cactus: 128, wm_wagon: 79, wm_crate: 38, wm_deadtree: 99, wm_lantern: 188,
  wm_palm: 164, wm_pine: 152, wm_rock: 24, wm_ruin: 93, wm_statue: 116, wm_table: 48, wm_tent: 80,
};
