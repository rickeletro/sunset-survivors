import type { StageTheme } from './stages';
export interface Chicken { x: number; y: number; homeX: number; homeY: number; phase: number; cooked: boolean; collected: boolean; }
export const CHICKEN_HEAL = 12;
/** Finite flocks per attempt: neither food farming nor offscreen respawn. */
export function stageChickens(theme: StageTheme): Chicken[] {
  if (['saloon', 'caboose', 'manor'].includes(theme)) return [];
  return [[3790, 3790], [4250, 4370], [2470, 2650]].flatMap(([x, y], flock) =>
    Array.from({ length: 3 }, (_, i) => ({ x: x + i * 25, y: y + i * 18,
      homeX: x + i * 25, homeY: y + i * 18, phase: flock * 3 + i, cooked: false, collected: false })));
}
export function segmentHitsChicken(c: Chicken, ax: number, ay: number, bx: number, by: number): boolean {
  if (c.cooked || c.collected) return false;
  const vx = bx - ax, vy = by - ay, length = vx * vx + vy * vy;
  const t = length ? Math.max(0, Math.min(1, ((c.x - ax) * vx + (c.y - ay) * vy) / length)) : 0;
  return Math.hypot(c.x - ax - vx * t, c.y - ay - vy * t) <= 13;
}
export function collectChicken(c: Chicken, x: number, y: number, hp: number, maxHp: number): number {
  if (!c.cooked || c.collected || hp >= maxHp || Math.hypot(c.x - x, c.y - y) > 30) return 0;
  c.collected = true;
  return Math.min(CHICKEN_HEAL, maxHp - hp);
}
