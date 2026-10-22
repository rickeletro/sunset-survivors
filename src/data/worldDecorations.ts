import type { StageTheme } from './stages';

export type WorldDecorationKind = 'skull' | 'sagebrush';
export interface WorldDecoration {
  kind: WorldDecorationKind;
  x: number;
  y: number;
}
export const WORLD_DECORATION_KEYS = ['decor_skull', 'decor_sagebrush'] as const;

/** Independent of obstacle RNG: at most one small, nonblocking detail per 640px chunk. */
export function worldDecorations(theme: StageTheme, cx: number, cy: number): WorldDecoration[] {
  if (theme !== 'canyon') return [];
  const hash = (Math.imul(cx + 1000, 374761393) ^ Math.imul(cy + 1000, 668265263)) >>> 0;
  if (hash % 4 !== 0) return [];
  return [{ kind: hash & 16 ? 'skull' : 'sagebrush',
    x: cx * 640 + 72 + (hash >>> 8) % 496,
    y: cy * 640 + 72 + (hash >>> 17) % 496 }];
}
