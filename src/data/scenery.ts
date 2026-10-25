import type { StageTheme } from './stages';

/** Native pixels are retained; integer scales keep scenery crisp. Footprints describe ground contact. */
export const SCENERY = {
  'gallery-saloon': { width: 256, height: 256, halfWidth: 106, halfHeight: 40, light: true },
  'rail-station': { width: 256, height: 192, halfWidth: 106, halfHeight: 32, light: true },
  'mine-entrance': { width: 192, height: 192, halfWidth: 76, halfHeight: 32, light: false },
  well: { width: 96, height: 96, halfWidth: 30, halfHeight: 16, light: false },
  'hitching-post': { width: 128, height: 64, halfWidth: 52, halfHeight: 9, light: false },
  locomotive: { width: 256, height: 128, halfWidth: 108, halfHeight: 27, light: false },
  'cargo-wagon': { width: 256, height: 128, halfWidth: 108, halfHeight: 27, light: false },
  'passenger-wagon': { width: 256, height: 128, halfWidth: 108, halfHeight: 27, light: true },
  saloon: { width: 256, height: 256, halfWidth: 106, halfHeight: 40, light: true },
  house: { width: 192, height: 192, halfWidth: 76, halfHeight: 32, light: true },
  sheriff: { width: 192, height: 192, halfWidth: 76, halfHeight: 32, light: true },
  'general-store': { width: 256, height: 192, halfWidth: 106, halfHeight: 32, light: true },
  'water-tower': { width: 128, height: 192, halfWidth: 40, halfHeight: 27, light: false },
  barn: { width: 256, height: 192, halfWidth: 106, halfHeight: 35, light: false },
  hacienda: { width: 256, height: 256, halfWidth: 106, halfHeight: 40, light: true },
  manor: { width: 256, height: 256, halfWidth: 106, halfHeight: 40, light: true },
  'supply-cart': { width: 128, height: 128, halfWidth: 40, halfHeight: 24, light: false },
  // Replaces one canyon barn visually, preserving that barn's exact ground footprint.
  'frontier-saloon': { width: 256, height: 256, halfWidth: 106, halfHeight: 35, light: true },
} as const;
export type SceneryKind = keyof typeof SCENERY;
/** Uniform render scale is independent of source resolution and ground collision. */
export const sceneryScale = (kind: SceneryKind): number => kind === 'house' ? 1.45 : 1;
export interface Landmark { kind: SceneryKind; x: number; y: number; }
export interface Footprint { x: number; y: number; halfWidth: number; halfHeight: number; }
// Reserve 10–15 for y-sorted world actors and tall scenery, below effects and HUD.
export const worldDepth = (y: number): number => 10 + Math.max(0, Math.min(8000, y)) / 8000 * 5;
export const sceneryKey = (kind: SceneryKind): string => `scenery_${kind}`;

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
      for (let i = 0; i < 3; i++) landmarks.push({ kind: kit[i], x: cx - 300 + i * 300, y });
      landmarks.push({ kind: 'water-tower', x: cx + 580, y: y + 180 });
      if (theme === 'railroad') {
        landmarks.push({ kind: 'rail-station', x: cx - 530, y: y + 180 });
        landmarks.push({ kind: 'frontier-saloon', x: cx + 180, y: y + 180 });
        landmarks.push({ kind: 'house', x: cx - 180, y: y + 180 });
      }
    } else {
      landmarks.push({ kind: 'hitching-post', x: cx - 650, y: cy + 180 });
      landmarks.push({ kind: 'well', x: cx + 650, y: cy + 180 });
      for (let i = 0; i < 6; i++) {
        const kind = theme === 'canyon' && cx === 4000 && cy === 4000 && i === 0 ? 'frontier-saloon' : kit[i % kit.length];
        landmarks.push({ kind, x: cx + (i % 3 - 1) * 420, y: cy + (i < 3 ? -390 : 450) });
      }
    }
  }
  // A dedicated central-hub range never replaces Faro or an existing courtesy door.
  landmarks.push({ kind: 'gallery-saloon', x: 4840, y: rail ? 4500 : 3960 });
  return landmarks;
}
export function footprint(landmark: Landmark): Footprint {
  const prop = SCENERY[landmark.kind];
  return { x: landmark.x, y: landmark.y - prop.halfHeight, halfWidth: prop.halfWidth, halfHeight: prop.halfHeight };
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
