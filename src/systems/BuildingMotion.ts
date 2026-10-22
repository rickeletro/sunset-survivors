import { pathLength, samplePath, type PortalPoint } from './BuildingPath';
export const BUILDING_WALK_SPEED = 220;
export const BUILDING_DOOR_MS = 320;
export const BUILDING_FADE_MS = 180;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** Deterministic presentation timeline. The physical actor never enters the collider;
 * only a disposable visual double crosses the illustrated doorway while shrinking.
 */
export function buildingMotion(path: readonly PortalPoint[], aperture: PortalPoint, mode: 'enter' | 'exit', elapsed: number) {
  const walkMs = pathLength(path) / BUILDING_WALK_SPEED * 1000;
  const totalMs = walkMs + BUILDING_DOOR_MS + (mode === 'enter' ? BUILDING_FADE_MS : 120);
  const entering = mode === 'enter';
  const doorElapsed = entering ? elapsed - walkMs : elapsed;
  const doorP = clamp(doorElapsed / BUILDING_DOOR_MS);
  const doorPhase = entering ? elapsed >= walkMs : elapsed <= BUILDING_DOOR_MS;
  const physical = samplePath(path, Math.max(0, entering ? Math.min(elapsed, walkMs) : elapsed - BUILDING_DOOR_MS) / 1000 * BUILDING_WALK_SPEED);
  const threshold = entering ? path.at(-1)! : path[0];
  const p = entering ? doorP * doorP : 1 - (1 - doorP) * (1 - doorP);
  const visual = doorPhase ? {
    x: entering ? lerp(threshold.x, aperture.x, p) : lerp(aperture.x, threshold.x, p),
    y: entering ? lerp(threshold.y, aperture.y, p) : lerp(aperture.y, threshold.y, p),
    dx: entering ? aperture.x - threshold.x : threshold.x - aperture.x,
    dy: entering ? aperture.y - threshold.y : threshold.y - aperture.y,
  } : physical;
  return { physical, visual, totalMs, walkMs,
    scale: doorPhase ? entering ? lerp(1, 0.22, p) : lerp(0.22, 1, p) : 1,
    alpha: doorPhase ? entering ? 1 - p : p : 1,
    doorOpen: entering ? elapsed < walkMs ? clamp((elapsed - walkMs + 180) / 180) : 1 - clamp((doorP - 0.6) / 0.4)
      : elapsed < BUILDING_DOOR_MS ? clamp(doorP * 4) : 1 - clamp((elapsed - BUILDING_DOOR_MS) / 180),
    fading: entering && elapsed >= walkMs + BUILDING_DOOR_MS,
    done: elapsed >= totalMs };
}
