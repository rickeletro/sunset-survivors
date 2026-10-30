export interface BulletAppearance { color: number; core: number; length: number; thickness: number; trail: number; tier: number; }
export type ExplosionKind = 'tnt' | 'hellfire' | 'residue' | 'magnet';
/** Shared footprint: visuals never enlarge or move the damage region. Existing weapon radii are preserved. */
export function dynamiteRadius(area: number, isKeg = false): number { return (isKeg ? 150 : 90) * area; }
export function insideBlast(x: number, y: number, centerX: number, centerY: number, radius: number): boolean {
  return (x - centerX) ** 2 + (y - centerY) ** 2 <= radius ** 2 + 1e-7;
}
export function lobPose(startX: number, startY: number, endX: number, endY: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  return { x: startX + (endX - startX) * p, y: startY + (endY - startY) * p - Math.sin(p * Math.PI) * 70, rotation: -.35 + p * 1.2 };
}
export function bulletAppearance(weapon: string, level: number): BulletAppearance {
  const evolved = ['desperado_fury', 'blunderbuss_doom', 'golden_repeater'].includes(weapon);
  const tier = evolved ? 6 : Math.max(1, Math.min(5, Math.floor(level)));
  const rifle = weapon === 'rifle' || weapon === 'golden_repeater';
  const pellet = weapon === 'shotgun' || weapon === 'blunderbuss_doom';
  const colors = rifle ? [0x87c9d2, 0x57b9da, 0x38bdf8, 0x0284c7, 0xffc52a, 0xffe066]
    : pellet ? [0xcf9b60, 0xe8b66b, 0xffa54b, 0xff791c, 0xffc52a, 0xff481f]
    : [0xf2d49a, 0xffc52a, 0xffa32a, 0xff791c, 0xffe5a0, 0xffe066];
  return {
    tier,
    color: colors[tier - 1],
    core: 0xffffff,
    length: (pellet ? 8 : rifle ? 18 : 12) + tier * (pellet ? 2 : 4),
    thickness: 4 + Math.floor(tier / 2),
    trail: 6 + tier * 4,
  };
}
export function molotovFootprint(level: number, area: number) {
  const tier = Math.max(1, Math.min(5, level));
  return { radius: (48 + tier * 8) * area, life: 3000 + tier * 600, rank: tier };
}
export interface RopePoint { x: number; y: number; }
export function whipPoints(x: number, y: number, side: number, progress: number, range: number, row = 0): RopePoint[] {
  const p = Math.max(0, Math.min(1, progress));
  const reach = Math.sin(Math.min(1, p * 2) * Math.PI / 2);
  return Array.from({ length: 13 }, (_, i) => {
    const t = i / 12;
    return { x: x + side * range * t * reach, y: y + row + Math.sin(t * Math.PI * 2 - p * Math.PI * 3) * 20 * (1 - t) * Math.sin(p * Math.PI) };
  });
}
export function distanceToRope(x: number, y: number, points: readonly RopePoint[]): number {
  let nearest = Infinity;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], dx = b.x - a.x, dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)));
    nearest = Math.min(nearest, Math.hypot(x - a.x - t * dx, y - a.y - t * dy));
  }
  return nearest;
}
