import { stageLandmarks, SCENERY, sceneryScale, sceneryKey } from './scenery';
import type { BuildingPortal } from './buildingPortal';
import type { StageTheme } from './stages';

export interface SaloonReward { healthFraction: number; bounty: number; xp?: number; }
export const SALOON_REWARD = { healthFraction: 0.2, bounty: 15 } as const;
export const SALOON_ENTRY_RADIUS = 160;
export interface SaloonDoor { activity?: 'saloon' | 'hospitality'; x: number; y: number; portal?: BuildingPortal; }
export function saloonDoors(theme: StageTheme): SaloonDoor[] {
  return stageLandmarks(theme).filter(p => p.kind === 'saloon' || p.kind === 'frontier-saloon' || p.kind === 'house')
    .map(p => ({ activity: p.kind === 'house' ? 'hospitality' : 'saloon', x: p.x + (p.kind === 'house' ? -52.2 : 0), y: p.y + 58, portal: {
      id: `${p.kind}:${p.x}:${p.y}`,
      facade: { x: p.x, y: p.y, width: SCENERY[p.kind].width * sceneryScale(p.kind), height: SCENERY[p.kind].height * sceneryScale(p.kind), texture: sceneryKey(p.kind), scale: sceneryScale(p.kind) },
      threshold: { x: p.x + (p.kind === 'house' ? -52.2 : 20), y: p.y + 12 },
      aperture: { x: p.x + (p.kind === 'house' ? -52.2 : 20), y: p.y - (p.kind === 'house' ? 90 : 62) },
      leaves: p.kind === 'house' ? [] : [{ x: 132, y: 177, width: 14, height: 34 }, { x: 146, y: 173, width: 14, height: 34 }],
    } }));
}

/** Ordinary doors consume on entry; Faro doors remain available until their prize is won. */
export class SaloonVisit {
  used = false;
  open = false;
  private visited = new Set<SaloonDoor>();
  private activeDoor?: SaloonDoor;
  private courtesies = new Set<SaloonDoor>();
  constructor(readonly doors: readonly SaloonDoor[], private reward: SaloonReward = SALOON_REWARD, private perDoor = false, private repeatFaro = false) {}
  wasUsed(door: SaloonDoor): boolean { return this.perDoor ? this.visited.has(door) : this.used; }
  nearby(x: number, y: number, blocked: boolean): SaloonDoor | undefined {
    if (blocked || this.used) return undefined;
    return this.doors.find(d => !this.wasUsed(d) && Math.hypot(d.x - x, d.y - y) <= SALOON_ENTRY_RADIUS);
  }
  enter(x: number, y: number, blocked: boolean, requested?: SaloonDoor): boolean {
    const door = requested ?? this.nearby(x, y, blocked);
    if (blocked || this.open || this.used || !door || !this.doors.includes(door) || this.wasUsed(door) || Math.hypot(door.x - x, door.y - y) > SALOON_ENTRY_RADIUS) return false;
    if (!this.repeatFaro || door.activity === 'hospitality') this.visited.add(door);
    this.activeDoor = door;
    this.used = this.perDoor ? this.visited.size === this.doors.length : !this.repeatFaro;
    this.open = true;
    return true;
  }
  leave(accept: boolean, prizeWon = false): SaloonReward | undefined {
    if (!this.open) return undefined;
    this.open = false;
    const door = this.activeDoor!;
    if (this.repeatFaro && prizeWon && door.activity !== 'hospitality') {
      this.visited.add(door);
      this.used = this.perDoor ? this.visited.size === this.doors.length : true;
    }
    if (this.repeatFaro && door.activity !== 'hospitality') {
      if (!accept || this.courtesies.has(door)) return undefined;
      this.courtesies.add(door);
    }
    return accept ? this.activeDoor?.activity === 'hospitality' ? { healthFraction: 0.12, bounty: 0, xp: 20 } : this.reward : undefined;
  }
}

/** Keep optional activities discoverable without requiring aimless exploration. */
export function buildingDirections(visit: SaloonVisit, x: number, y: number, stage: number): string {
  return (['saloon', 'hospitality'] as const).flatMap(activity => {
    const door = visit.doors.filter(d => (d.activity ?? 'saloon') === activity && !visit.wasUsed(d))
      .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
    if (!door) return [];
    const dx = door.x - x, dy = door.y - y, distance = Math.hypot(dx, dy);
    const vertical = Math.abs(dy) > 60 ? dy < 0 ? 'NORTH' : 'SOUTH' : '';
    const horizontal = Math.abs(dx) > 60 ? dx < 0 ? 'WEST' : 'EAST' : '';
    const direction = [vertical, horizontal].filter(Boolean).join(' / ');
    const name = activity === 'hospitality' ? 'HOSPITALITY' : stage === 2 ? 'SALOON • FARO' : 'SALOON';
    return [`${name}: ${distance <= SALOON_ENTRY_RADIUS ? '[E] ENTER' : `${direction} • ${Math.ceil(distance / 10)} PACES`}`];
  }).join('     |     ');
}
