import { resolveFootprint, type Footprint } from '../data/scenery';

export interface Point { x: number; y: number; }
/** Segment against the open interior: travelling along an expanded edge is allowed. */
export function entersFootprint(box: Footprint, a: Point, b: Point): boolean {
  let first = 0, last = 1;
  for (const [axis, half] of [['x', box.halfWidth], ['y', box.halfHeight]] as const) {
    const min = box[axis] - half + 0.001, max = box[axis] + half - 0.001;
    const delta = b[axis] - a[axis];
    if (Math.abs(delta) < 0.00001) {
      if (a[axis] <= min || a[axis] >= max) return false;
    } else {
      const t1 = (min - a[axis]) / delta, t2 = (max - a[axis]) / delta;
      first = Math.max(first, Math.min(t1, t2));
      last = Math.min(last, Math.max(t1, t2));
      if (first > last) return false;
    }
  }
  return first <= last && last > 0 && first < 1;
}

/** A six-node visibility graph routes a chaser around the nearest building, without a world navmesh. */
export function sceneryChaseTarget(boxes: readonly Footprint[], from: Point, target: Point, radius: number): Point {
  let obstacle: Footprint | undefined;
  let nearest = Infinity;
  for (const footprint of boxes) {
    const box = { ...footprint, halfWidth: footprint.halfWidth + radius + 6, halfHeight: footprint.halfHeight + radius + 6 };
    if (!entersFootprint(box, from, target)) continue;
    const distance = Math.hypot(Math.max(Math.abs(from.x - box.x) - box.halfWidth, 0), Math.max(Math.abs(from.y - box.y) - box.halfHeight, 0));
    if (distance < nearest) { nearest = distance; obstacle = box; }
  }
  if (!obstacle) return target;
  const box = obstacle;
  if (Math.abs(from.x - box.x) < box.halfWidth && Math.abs(from.y - box.y) < box.halfHeight) {
    return resolveFootprint(box, from.x, from.y, 1);
  }
  const nodes = [from, target,
    { x: box.x - box.halfWidth, y: box.y - box.halfHeight },
    { x: box.x + box.halfWidth, y: box.y - box.halfHeight },
    { x: box.x + box.halfWidth, y: box.y + box.halfHeight },
    { x: box.x - box.halfWidth, y: box.y + box.halfHeight },
  ];
  const costs = nodes.map(() => Infinity), previous = nodes.map(() => -1), visited = new Set<number>();
  costs[0] = 0;
  for (let step = 0; step < nodes.length; step++) {
    let current = -1;
    for (let i = 0; i < nodes.length; i++) if (!visited.has(i) && (current < 0 || costs[i] < costs[current])) current = i;
    if (current < 0 || !Number.isFinite(costs[current]) || current === 1) break;
    visited.add(current);
    for (let i = 0; i < nodes.length; i++) {
      if (visited.has(i) || entersFootprint(box, nodes[current], nodes[i])) continue;
      const cost = costs[current] + Math.hypot(nodes[current].x - nodes[i].x, nodes[current].y - nodes[i].y);
      if (cost < costs[i]) { costs[i] = cost; previous[i] = current; }
    }
  }
  if (previous[1] < 0) return target; // Collision recovery handles a spawn already inside a footprint.
  const path: Point[] = [];
  for (let index = 1; index > 0; index = previous[index]) path.unshift(nodes[index]);
  return path.find(point => Math.hypot(point.x - from.x, point.y - from.y) > 2) ?? target;
}
