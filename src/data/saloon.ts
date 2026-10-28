import { ECONOMY } from './economy';
import { galleryProfile } from './shootingGallery';
import { stageLandmarks, SCENERY, sceneryRenderScale, sceneryGrowth, sceneryKey } from './scenery';
import type { BuildingPortal } from './buildingPortal';
import type { StageTheme } from './stages';

export interface SaloonReward { healthFraction: number; bounty: number; xp?: number; }
export const SALOON_REWARD = { healthFraction: ECONOMY.services.saloon_rest.health, bounty: 0 } as const;
export const SALOON_ENTRY_RADIUS = 160;
export interface SaloonDoor { activity?: 'saloon' | 'hospitality' | 'gallery'; x: number; y: number; portal?: BuildingPortal; }
/** Distance to the building's ground frontage, rather than a tiny door marker. */
export function buildingDistance(door: SaloonDoor, x: number, y: number): number {
  const f = door.portal?.facade;
  if (!f) return Math.hypot(door.x - x, door.y - y);
  const d = Math.hypot(Math.max(0, Math.abs(x - f.x) - f.width / 2),
    Math.max(0, Math.abs(y - f.y) - 48));
  return Math.round(d * 1e6) / 1e6;
}
export function saloonDoors(theme: StageTheme): SaloonDoor[] {
  return stageLandmarks(theme).filter(p => p.kind === 'saloon' || p.kind === 'frontier-saloon' || p.kind === 'house' || p.kind === 'gallery-saloon')
    .map(p => {
      // Offsets were authored on the legacy art; they grow with the building around its base anchor.
      const g = sceneryGrowth(p.kind), scale = sceneryRenderScale(p.kind), dx = p.kind === 'house' ? -52.2 * g : 0;
      return { activity: p.kind === 'house' ? 'hospitality' : p.kind === 'gallery-saloon' ? 'gallery' : 'saloon', x: p.x + (p.kind === 'house' ? -52.2 : 0), y: p.y + 58, portal: {
        id: `${p.kind}:${p.x}:${p.y}`,
        facade: { x: p.x, y: p.y, width: SCENERY[p.kind].width * scale, height: SCENERY[p.kind].height * scale, texture: sceneryKey(p.kind), scale },
        threshold: { x: p.x + (p.kind === 'house' ? dx : 20 * g), y: p.y + 12 * g },
        aperture: { x: p.x + (p.kind === 'house' ? dx : 20 * g), y: p.y - (p.kind === 'house' ? 90 : 62) * g },
        leaves: p.kind === 'house' ? [] : [{ x: 132, y: 177, width: 14, height: 34 }, { x: 146, y: 173, width: 14, height: 34 }],
      } } as SaloonDoor;
    });
}

/** Ordinary doors consume on entry; Faro doors remain available until their prize is won. */
export class SaloonVisit {
  used = false;
  open = false;
  private visited = new Set<SaloonDoor>();
  private activeDoor?: SaloonDoor;
  constructor(readonly doors: readonly SaloonDoor[], _reward: SaloonReward = SALOON_REWARD, private perDoor = false, private repeatFaro = false) {}
  wasUsed(door: SaloonDoor): boolean { return this.perDoor ? this.visited.has(door) : this.used; }
  nearby(x: number, y: number, blocked: boolean): SaloonDoor | undefined {
    if (blocked || this.used) return undefined;
    return this.doors.find(d => !this.wasUsed(d) && buildingDistance(d, x, y) <= SALOON_ENTRY_RADIUS);
  }
  enter(x: number, y: number, blocked: boolean, requested?: SaloonDoor): boolean {
    const door = requested ?? this.nearby(x, y, blocked);
    if (blocked || this.open || this.used || !door || !this.doors.includes(door) || this.wasUsed(door) || buildingDistance(door, x, y) > SALOON_ENTRY_RADIUS) return false;
    const repeatable = this.repeatFaro && (door.activity ?? 'saloon') === 'saloon';
    if (!repeatable) this.visited.add(door);
    this.activeDoor = door;
    this.used = this.perDoor ? this.visited.size === this.doors.length : !repeatable;
    this.open = true;
    return true;
  }
  leave(_accept: boolean, prizeWon = false): SaloonReward | undefined {
    if (!this.open) return undefined;
    this.open = false;
    const door = this.activeDoor!;
    if (this.repeatFaro && prizeWon && (door.activity ?? 'saloon') === 'saloon') {
      this.visited.add(door);
      this.used = this.perDoor ? this.visited.size === this.doors.length : true;
    }
    // Access control never grants free benefits; paid services settle through the gameplay wallet.
    return undefined;
  }
}

/** Keep optional activities discoverable without requiring aimless exploration. */
export function buildingDirections(visit: SaloonVisit, x: number, y: number, stage: number): string {
  return (['saloon', 'hospitality', 'gallery'] as const).flatMap(activity => {
    const door = visit.doors.filter(d => (d.activity ?? 'saloon') === activity && !visit.wasUsed(d))
      .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
    if (!door) return [];
    const dx = door.x - x, dy = door.y - y, distance = Math.hypot(dx, dy);
    const vertical = Math.abs(dy) > 60 ? dy < 0 ? 'NORTH' : 'SOUTH' : '';
    const horizontal = Math.abs(dx) > 60 ? dx < 0 ? 'WEST' : 'EAST' : '';
    const direction = [vertical, horizontal].filter(Boolean).join(' / ');
    const name = activity === 'gallery' ? `${galleryProfile(stage).name.toUpperCase()} • TARGETS` : activity === 'hospitality' ? 'HOSPITALITY' : stage === 2 ? 'SALOON • FARO' : 'SALOON';
    return [`${name}: ${buildingDistance(door, x, y) <= SALOON_ENTRY_RADIUS ? '[E] ENTER' : `${direction} • ${Math.ceil(distance / 10)} PACES`}`];
  }).join('\n');
}
