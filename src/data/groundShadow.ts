/** World-space sun at the upper-left horizon, matching the art's warm key light.
 * Directional lighting stays stable as the camera and player move. */
export const SUNSET_LIGHT = { x: -0.85, y: -0.55, elevation: 25 * Math.PI / 180, groundCompression: 0.5 } as const;
export interface GroundSupport { x: number; bottom: number; width: number; height: number; base?: { x: number; y: number }[]; }

/** Alpha bounds, not transparent canvas borders, determine the contact point. */
export function measureGroundSupport(width: number, height: number, alpha: (x: number, y: number) => number, band = 0.12): GroundSupport {
  let top = height, bottom = -1;
  const columnBottom = new Array<number>(width).fill(-1);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (alpha(x, y) >= 32) { top = Math.min(top, y); bottom = y; columnBottom[x] = y; }
  }
  if (bottom < 0) return { x: width / 2, bottom: height, width: 0, height: 0 };
  let left = width, right = -1;
  const start = Math.max(top, bottom - Math.max(1, Math.ceil((bottom - top + 1) * band)));
  for (let y = start; y <= bottom; y++) for (let x = 0; x < width; x++) {
    if (alpha(x, y) >= 32) { left = Math.min(left, x); right = Math.max(right, x); }
  }
  const base = columnBottom.flatMap((y, x) => y >= top + (bottom - top) * 0.60 ? [{ x: x + 0.5, y: y + 1 }] : []);
  return { x: (left + right + 1) / 2, bottom: bottom + 1, width: right - left + 1, height: bottom - top + 1, base };
}

export function groundShadowGeometry(support: GroundSupport, frameWidth: number, frameHeight: number,
  originX: number, originY: number, scaleX: number, scaleY: number, flipX = false, indoor = false) {
  const sx = Math.abs(scaleX), sy = Math.abs(scaleY);
  const width = support.width * sx;
  const height = support.height * sy;
  const sunLength = Math.hypot(SUNSET_LIGHT.x, SUNSET_LIGHT.y);
  // Cap artistic projection length to preserve the readability of combat telegraphs.
  const length = indoor ? 0 : Math.min(180, height / Math.tan(SUNSET_LIGHT.elevation) * 0.45);
  return {
    x: ((flipX ? frameWidth - support.x : support.x) - frameWidth * originX) * sx,
    // One world pixel of overlap prevents a bright gap between sole/base and contact.
    y: (support.bottom - frameHeight * originY) * sy - Math.min(1, sy),
    base: support.base?.map(p => ({ x: (flipX ? support.x - p.x : p.x - support.x) * sx, y: (p.y - support.bottom) * sy }))
      .sort((a, b) => a.x - b.x),
    width, contactHeight: Math.max(2, Math.min(12, width * 0.12)),
    dx: -SUNSET_LIGHT.x / sunLength * length,
    dy: -SUNSET_LIGHT.y / sunLength * length * SUNSET_LIGHT.groundCompression,
    visible: support.width > 0 && support.height > 0,
  };
}

/** Convex ground footprint extruded away from the sun, without gaps at diagonal foundations. */
export function projectedShadowHull(base: readonly { x: number; y: number }[], dx: number, dy: number) {
  const points = [...base, ...base.map(p => ({ x: p.x + dx, y: p.y + dy }))].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (a: typeof points[number], b: typeof a, c: typeof a) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const half = (list: typeof points) => {
    const hull: typeof points = [];
    for (const point of list) {
      while (hull.length >= 2 && cross(hull[hull.length - 2], hull[hull.length - 1], point) <= 0) hull.pop();
      hull.push(point);
    }
    return hull;
  };
  const lower = half(points), upper = half([...points].reverse());
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}
