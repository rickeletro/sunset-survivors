import { stageLandmarks, SCENERY, sceneryKey } from './scenery';
import type { BuildingPortal } from './buildingPortal';
import type { StageTheme } from './stages';

export const SALOON_REWARD = { healthFraction: 0.2, bounty: 15 } as const;
export const SALOON_ENTRY_RADIUS = 160;
export interface SaloonDoor { x: number; y: number; portal?: BuildingPortal; }
export function saloonDoors(theme: StageTheme): SaloonDoor[] {
  return stageLandmarks(theme).filter(p => p.kind === 'saloon' || p.kind === 'frontier-saloon')
    .map(p => ({ x: p.x, y: p.y + 58, portal: {
      id: `${p.kind}:${p.x}:${p.y}`,
      facade: { x: p.x, y: p.y, width: SCENERY[p.kind].width, height: SCENERY[p.kind].height, texture: sceneryKey(p.kind) },
      threshold: { x: p.x + 20, y: p.y + 12 }, aperture: { x: p.x + 20, y: p.y - 62 },
      leaves: [{ x: 132, y: 177, width: 14, height: 34 }, { x: 146, y: 173, width: 14, height: 34 }],
    } }));
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
  enter(x: number, y: number, blocked: boolean, requested?: SaloonDoor): boolean {
    const door = requested ?? this.nearby(x, y, blocked);
    if (blocked || this.used || !door || !this.doors.includes(door) || Math.hypot(door.x - x, door.y - y) > SALOON_ENTRY_RADIUS) return false;
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
