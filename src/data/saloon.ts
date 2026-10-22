import { stageLandmarks } from './scenery';
import type { StageTheme } from './stages';

export const SALOON_REWARD = { healthFraction: 0.2, bounty: 15 } as const;
export const SALOON_ENTRY_RADIUS = 100;
export interface SaloonDoor { x: number; y: number; }
export function saloonDoors(theme: StageTheme): SaloonDoor[] {
  return stageLandmarks(theme).filter(p => p.kind === 'saloon' || p.kind === 'frontier-saloon')
    .map(p => ({ x: p.x, y: p.y + 58 }));
}

/** One optional visit per stage attempt, across every door; consume on entry, not on exit. */
export class SaloonVisit {
  used = false;
  open = false;
  constructor(readonly doors: readonly SaloonDoor[]) {}
  nearby(x: number, y: number, blocked: boolean): SaloonDoor | undefined {
    if (blocked || this.used) return undefined;
    return this.doors.find(d => Math.hypot(d.x - x, d.y - y) <= SALOON_ENTRY_RADIUS);
  }
  enter(x: number, y: number, blocked: boolean): boolean {
    if (!this.nearby(x, y, blocked)) return false;
    this.used = true;
    this.open = true;
    return true;
  }
  leave(accept: boolean): typeof SALOON_REWARD | undefined {
    if (!this.open) return undefined;
    this.open = false;
    return accept ? SALOON_REWARD : undefined;
  }
}
