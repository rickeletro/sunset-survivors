export interface PortalPoint { x: number; y: number; }
export type SegmentClear = (a: PortalPoint, b: PortalPoint) => boolean;

/** Local visibility-checked A*: routes only the short approach, never changes world colliders. */
export function buildingPath(from: PortalPoint, to: PortalPoint, clear: SegmentClear): PortalPoint[] | undefined {
  if (clear(from, to)) return Math.hypot(to.x - from.x, to.y - from.y) <= 640 ? [{ ...from }, { ...to }] : undefined;
  const step = 20, margin = 200;
  const minX = Math.min(from.x, to.x) - margin, maxX = Math.max(from.x, to.x) + margin;
  const minY = Math.min(from.y, to.y) - margin, maxY = Math.max(from.y, to.y) + margin;
  const nodes = new Map<string, { p: PortalPoint; g: number; f: number; parent?: string }>();
  const open = new Set(['0,0']), closed = new Set<string>();
  nodes.set('0,0', { p: { ...from }, g: 0, f: Math.hypot(to.x - from.x, to.y - from.y) });
  for (let count = 0; open.size && count < 4096; count++) {
    let key = [...open][0];
    for (const candidate of open) if (nodes.get(candidate)!.f < nodes.get(key)!.f) key = candidate;
    open.delete(key); closed.add(key);
    const node = nodes.get(key)!;
    if (clear(node.p, to)) {
      const path = [{ ...to }, node.p];
      let parent = node.parent;
      while (parent) { const prev = nodes.get(parent)!; path.push(prev.p); parent = prev.parent; }
      path.reverse();
      // Remove staircase turns only when the entire replacement segment is clear.
      const smooth = [path[0]];
      for (let i = 0; i < path.length - 1;) {
        let next = path.length - 1;
        while (next > i + 1 && !clear(path[i], path[next])) next--;
        smooth.push(path[next]); i = next;
      }
      return pathLength(smooth) <= 640 ? smooth : undefined;
    }
    const [gx, gy] = key.split(',').map(Number);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nextKey = `${gx + dx},${gy + dy}`;
      if (closed.has(nextKey)) continue;
      const p = { x: from.x + (gx + dx) * step, y: from.y + (gy + dy) * step };
      if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY || !clear(node.p, p)) continue;
      const g = node.g + Math.hypot(dx, dy) * step;
      if (g >= (nodes.get(nextKey)?.g ?? Infinity)) continue;
      nodes.set(nextKey, { p, g, f: g + Math.hypot(to.x - p.x, to.y - p.y), parent: key });
      open.add(nextKey);
    }
  }
  return undefined;
}
export function pathLength(path: readonly PortalPoint[]): number {
  return path.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - path[i].x, p.y - path[i].y), 0);
}
export function samplePath(path: readonly PortalPoint[], distance: number) {
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i], length = Math.hypot(b.x - a.x, b.y - a.y);
    if (distance <= length && length > 0) return { x: a.x + (b.x - a.x) * distance / length,
      y: a.y + (b.y - a.y) * distance / length, dx: b.x - a.x, dy: b.y - a.y };
    distance -= length;
  }
  const p = path.at(-1)!, prev = path.at(-2) ?? p;
  return { ...p, dx: p.x - prev.x, dy: p.y - prev.y };
}
