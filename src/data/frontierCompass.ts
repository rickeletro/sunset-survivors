import { SALOON_ENTRY_RADIUS, type SaloonDoor, type SaloonVisit } from './saloon';
export const COMPASS_RANGE = 2000;
export const COMPASS_RADIUS = 76;
export interface CompassMarker { door: SaloonDoor; x: number; y: number; distance: number; edge: boolean; used: boolean; nearby: boolean; }
/** North stays up; distant activities point toward their nearest available doorway. */
export function compassMarkers(visit: SaloonVisit, px: number, py: number): CompassMarker[] {
  const all = visit.doors.map(door => {
    const dx = door.x-px, dy = door.y-py, distance = Math.hypot(dx,dy);
    const factor = COMPASS_RADIUS / Math.max(COMPASS_RANGE,distance);
    return { door, x: dx*factor, y:dy*factor, distance, edge:distance>COMPASS_RANGE, used:visit.wasUsed(door), nearby:distance<=SALOON_ENTRY_RADIUS };
  });
  return all.filter(m => !m.edge || !m.used && !all.some(other => !other.used && (other.door.activity ?? 'saloon') === (m.door.activity ?? 'saloon') && (other.distance<m.distance || other.distance===m.distance && visit.doors.indexOf(other.door)<visit.doors.indexOf(m.door))));
}
export function compassLayout(width: number, height: number) {
  const scale = Math.min(1, Math.max(.1,(width-24)/224), Math.max(.1,(height-138)/286));
  return { x:width-12-112*scale, y:130+110*scale, scale };
}
