import { stageLandmarks, type Landmark } from './scenery';
import type { StageTheme } from './stages';
export type FrontierEventKind = 'ambush' | 'thief' | 'cargo' | 'powder';
export interface FrontierEvent { kind: FrontierEventKind; x: number; y: number; phase: 'idle' | 'warning' | 'active' | 'done'; age: number; hp: number; }
export function frontierEvents(theme: StageTheme): FrontierEvent[] {
  const buildings = stageLandmarks(theme).filter(p => ['saloon', 'frontier-saloon', 'general-store', 'rail-station', 'barn', 'hacienda', 'manor', 'mine-entrance', 'general-store-se', 'rail-station-se', 'barn-se', 'manor-se'].includes(p.kind));
  const hubs: Landmark[] = [];
  for (const p of buildings) if (!hubs.some(h => Math.hypot(h.x - p.x, h.y - p.y) < 900)) hubs.push(p);
  return hubs.slice(0, 5).flatMap(p => [
    { kind: 'ambush' as const, x: p.x, y: p.y - 65 },
    { kind: 'thief' as const, x: p.x + 210, y: p.y + 95 },
    { kind: 'cargo' as const, x: p.x - 190, y: p.y + 90 },
    { kind: 'powder' as const, x: p.x + 300, y: p.y + 125 },
    { kind: 'powder' as const, x: p.x + 405, y: p.y + 125 },
  ].map(e => ({ ...e, phase: 'idle' as const, age: 0, hp: 40 })));
}
export function segmentNear(ax: number, ay: number, bx: number, by: number, x: number, y: number, radius: number): boolean {
  const dx = bx - ax, dy = by - ay, length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / length)) : 0;
  return Math.hypot(x - ax - dx * t, y - ay - dy * t) <= radius;
}
export function advanceFrontierEvent(e: FrontierEvent, delta: number, distance: number, blocked: boolean): boolean {
  if (e.phase === 'idle' && !blocked && distance < (e.kind === 'ambush' ? 310 : 370) && (e.kind === 'ambush' || e.kind === 'thief')) { e.phase = 'warning'; e.age = 0; }
  if (e.phase !== 'warning' || blocked) return false;
  e.age += Math.max(0, delta);
  if (e.age < 1800 || distance > 650) return false;
  e.phase = 'active'; e.age = 0; return true;
}
export function hitFrontierProp(e: FrontierEvent, ax: number, ay: number, bx: number, by: number, damage: number): boolean {
  if (e.phase !== 'idle' || !Number.isFinite(damage) || damage <= 0 || !['cargo', 'powder'].includes(e.kind)) return false;
  if (!segmentNear(ax, ay, bx, by, e.x, e.y - (e.kind === 'cargo' ? 105 : 20), e.kind === 'cargo' ? 34 : 22)) return false;
  e.hp -= damage;
  if (e.hp > 0 && e.kind !== 'cargo') return false;
  e.phase = 'active'; e.age = 0; return true;
}
