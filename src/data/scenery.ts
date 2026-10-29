import type { StageTheme } from './stages';
import { BAKED_VISIBLE_HEIGHTS, classifyAsset, normalizedScale } from './worldScale';

/** Native pixels are retained; integer scales keep scenery crisp. Footprints describe ground contact. */
export const SCENERY = {
  'gallery-saloon': { width: 256, height: 256, dx: 0, dy: 43, halfWidth: 111, halfHeight: 26, light: true },
  'rail-station': { width: 256, height: 192, dx: -7, dy: 36, halfWidth: 82, halfHeight: 19, light: true },
  'mine-entrance': { width: 192, height: 192, dx: 0, dy: 29, halfWidth: 80, halfHeight: 20, light: false },
  well: { width: 96, height: 96, dx: 0, dy: 21, halfWidth: 24, halfHeight: 10, light: false },
  'hitching-post': { width: 128, height: 64, dx: -3, dy: 12, halfWidth: 47, halfHeight: 7, light: false },
  locomotive: { width: 256, height: 128, dx: 32, dy: 33, halfWidth: 86, halfHeight: 9, light: false },
  'cargo-wagon': { width: 256, height: 128, dx: 0, dy: 29, halfWidth: 126, halfHeight: 11, light: false },
  'passenger-wagon': { width: 256, height: 128, dx: 1, dy: 35, halfWidth: 116, halfHeight: 9, light: true },
  saloon: { width: 256, height: 256, dx: 0, dy: 43, halfWidth: 111, halfHeight: 26, light: true },
  house: { width: 192, height: 192, dx: -7, dy: 44, halfWidth: 72, halfHeight: 16, light: true },
  sheriff: { width: 192, height: 192, dx: 0, dy: 40, halfWidth: 65, halfHeight: 17, light: true },
  'general-store': { width: 256, height: 192, dx: -18, dy: 45, halfWidth: 78, halfHeight: 17, light: true },
  'water-tower': { width: 128, height: 192, dx: -1, dy: 32, halfWidth: 43, halfHeight: 19, light: false },
  barn: { width: 256, height: 192, dx: -5, dy: 25, halfWidth: 94, halfHeight: 21, light: false },
  'barn-se': { width: 256, height: 192, dx: 5, dy: 25, halfWidth: 94, halfHeight: 21, light: false },
  hacienda: { width: 256, height: 256, dx: 8, dy: 73, halfWidth: 106, halfHeight: 19, light: true },
  manor: { width: 256, height: 256, dx: -3, dy: 60, halfWidth: 105, halfHeight: 24, light: true },
  'manor-se': { width: 256, height: 256, dx: 3, dy: 60, halfWidth: 105, halfHeight: 24, light: true },
  'supply-cart': { width: 128, height: 128, dx: -2, dy: 28, halfWidth: 39, halfHeight: 11, light: false },
  // Replaces one canyon barn visually, preserving that barn's exact ground footprint.
  'frontier-saloon': { width: 256, height: 256, dx: -5, dy: 25, halfWidth: 94, halfHeight: 21, light: true },
  'general-store-se': { width: 256, height: 192, dx: 18, dy: 45, halfWidth: 78, halfHeight: 17, light: true },
  'rail-station-se': { width: 256, height: 192, dx: 7, dy: 36, halfWidth: 82, halfHeight: 19, light: true },
} as const;
export type SceneryKind = keyof typeof SCENERY;
/** Uniform render scale is independent of source resolution and ground collision. */
export const sceneryScale = (kind: SceneryKind): number => kind === 'house' ? 1.45 : 1;
/** Hero-relative render scale (see worldScale.ts); equals the legacy scale when already in range. */
export const sceneryRenderScale = (kind: SceneryKind): number => {
  const key = sceneryKey(kind), height = BAKED_VISIBLE_HEIGHTS[key];
  return height ? normalizedScale(classifyAsset(key), height, sceneryScale(kind)) : sceneryScale(kind);
};
/** How much bigger a building is drawn than its legacy art scale; collisions and door offsets grow with it. */
export const sceneryGrowth = (kind: SceneryKind): number => {
  if (kind === 'frontier-saloon') return sceneryGrowth('barn');
  return sceneryRenderScale(kind) / sceneryScale(kind);
};
export interface Landmark { kind: SceneryKind; x: number; y: number; }
export interface Footprint { x: number; y: number; halfWidth: number; halfHeight: number; }
// Reserve 10–15 for y-sorted world actors and tall scenery, below effects and HUD.
export const worldDepth = (y: number): number => 10 + Math.max(0, Math.min(8000, y)) / 8000 * 5;
export const sceneryKey = (kind: SceneryKind): string => `scenery_${kind}`;

const VILLAGE_KITS: Record<Exclude<StageTheme, 'railroad' | 'caboose'>, { sw: readonly SceneryKind[]; se: readonly SceneryKind[] }> = {
  canyon: {
    sw: ['barn', 'supply-cart', 'house'],
    se: ['barn-se', 'general-store-se', 'barn-se'],
  },
  'burning-town': {
    sw: ['house', 'saloon', 'general-store'],
    se: ['general-store-se', 'barn-se', 'general-store-se'],
  },
  saloon: {
    sw: ['saloon', 'supply-cart', 'sheriff'],
    se: ['general-store-se', 'manor-se', 'barn-se'],
  },
  mountain: {
    sw: ['mine-entrance', 'house', 'supply-cart'],
    se: ['general-store-se', 'barn-se', 'general-store-se'],
  },
  hacienda: {
    sw: ['hacienda', 'supply-cart', 'house'],
    se: ['barn-se', 'manor-se', 'barn-se'],
  },
  manor: {
    sw: ['manor', 'supply-cart', 'sheriff'],
    se: ['manor-se', 'general-store-se', 'barn-se'],
  },
};

const KITS: Record<StageTheme, readonly SceneryKind[]> = {
  canyon: ['barn', 'house', 'supply-cart', 'water-tower'],
  railroad: ['locomotive', 'cargo-wagon', 'passenger-wagon', 'water-tower', 'rail-station'],
  'burning-town': ['house', 'saloon', 'sheriff', 'general-store'],
  saloon: ['saloon', 'general-store', 'house', 'sheriff'],
  caboose: ['cargo-wagon', 'passenger-wagon', 'locomotive', 'water-tower'],
  mountain: ['mine-entrance', 'house', 'supply-cart', 'well'],
  hacienda: ['hacienda', 'supply-cart', 'house', 'barn'],
  manor: ['manor', 'house', 'sheriff', 'supply-cart'],
};
export const sceneryForStage = (theme: StageTheme): readonly SceneryKind[] => [...new Set(stageLandmarks(theme).map(p => p.kind))];

/** Small open settlements: three broad streets per hub, no enclosing wall around the player. */
export function stageLandmarks(theme: StageTheme): Landmark[] {
  const kit = KITS[theme];
  const landmarks: Landmark[] = [];
  const rail = theme === 'railroad' || theme === 'caboose';
  for (const [cx, cy] of [[4000, 4000], [2400, 2400], [5600, 5600], [2400, 5600], [5600, 2400]]) {
    if (rail) {
      // Parked rolling stock occupies sidings, never the active train hazard corridor.
      const y = 4000 + Math.round((cy - 4000) / 640) * 640 + 320;
      const car_xs = (cx === 4000 && cy === 4000) ? [cx - 680, cx - 280, cx + 280] : [cx - 500, cx, cx + 500];
      for (let i = 0; i < 3; i++) landmarks.push({ kind: kit[i], x: car_xs[i], y });
      landmarks.push({ kind: 'water-tower', x: cx + 760, y: y + 180 });
      if (theme === 'railroad') {
        landmarks.push({ kind: 'rail-station', x: cx - 740, y: y + 180 });
        landmarks.push({ kind: 'rail-station-se', x: cx - 1140, y: y + 180 });
        landmarks.push({ kind: 'frontier-saloon', x: cx + 290, y: y + 180 });
        landmarks.push({ kind: 'house', x: cx - 240, y: y + 180 });
      }
    } else {
      landmarks.push({ kind: 'hitching-post', x: cx - 800, y: cy + 180 });
      landmarks.push({ kind: 'well', x: cx + 800, y: cy + 180 });
      const village = VILLAGE_KITS[theme as keyof typeof VILLAGE_KITS];
      for (let col = -1; col <= 1; col++) {
        const posX = cx + col * 420;
        // North side of street: aligned SW buildings facing down-left into the street
        const swKind = theme === 'canyon' && col === -1
          ? (cx === 4000 && cy === 4000 ? 'frontier-saloon' : 'barn')
          : village.sw[col + 1];
        landmarks.push({ kind: swKind, x: posX, y: cy - 390 });
        // South side of street: aligned SE buildings facing down-right into the street
        landmarks.push({ kind: village.se[col + 1], x: posX, y: cy + 450 });
      }
    }
  }
  // A dedicated central-hub range never replaces Faro or an existing courtesy door.
  landmarks.push({ kind: 'gallery-saloon', x: rail ? 5060 : 4840, y: rail ? 4500 : 3960 });
  return landmarks;
}
export function footprint(landmark: Landmark): Footprint {
  const prop = SCENERY[landmark.kind];
  const scale = landmark.kind === 'frontier-saloon' ? sceneryRenderScale('barn') : sceneryRenderScale(landmark.kind);
  const halfWidth = prop.halfWidth * scale, halfHeight = prop.halfHeight * scale;
  return {
    x: landmark.x + prop.dx * scale,
    y: landmark.y - prop.dy * scale,
    halfWidth,
    halfHeight,
  };
}
export function overlapsFootprint(box: Footprint, x: number, y: number, radius: number): boolean {
  const dx = Math.max(Math.abs(x - box.x) - box.halfWidth, 0);
  const dy = Math.max(Math.abs(y - box.y) - box.halfHeight, 0);
  return dx * dx + dy * dy < radius * radius;
}
export function resolveFootprint(box: Footprint, x: number, y: number, radius: number): { x: number; y: number } {
  const nx = Math.max(box.x - box.halfWidth, Math.min(box.x + box.halfWidth, x));
  const ny = Math.max(box.y - box.halfHeight, Math.min(box.y + box.halfHeight, y));
  const dx = x - nx, dy = y - ny;
  const distance = Math.hypot(dx, dy);
  if (distance >= radius) return { x, y };
  if (distance > 0) return { x: nx + dx / distance * radius, y: ny + dy / distance * radius };
  // At or inside a footprint: exit by the nearest edge, including exact-center spawns.
  const sides = [
    { gap: x - (box.x - box.halfWidth), x: box.x - box.halfWidth - radius, y },
    { gap: box.x + box.halfWidth - x, x: box.x + box.halfWidth + radius, y },
    { gap: y - (box.y - box.halfHeight), x, y: box.y - box.halfHeight - radius },
    { gap: box.y + box.halfHeight - y, x, y: box.y + box.halfHeight + radius },
  ];
  const side = sides.reduce((best, candidate) => candidate.gap < best.gap ? candidate : best);
  return { x: side.x, y: side.y };
}
