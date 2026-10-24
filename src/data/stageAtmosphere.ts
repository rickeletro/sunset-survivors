import type { StageTheme } from './stages';

/** Hard caps keep ambience independent of map size and enemy count. */
export function atmosphereFor(theme: StageTheme) {
  const indoor = ['saloon', 'caboose', 'manor'].includes(theme);
  const embers = theme === 'burning-town';
  return {
    indoor, embers, maxParticles: indoor ? 12 : 36,
    frequency: indoor ? 360 : embers ? 100 : 150,
    tint: embers ? 0xff791c : theme === 'mountain' ? 0xc49ac5 : 0xf2d49a,
    alpha: indoor ? 0.18 : embers ? 0.48 : 0.42,
    wind: indoor ? 4 : theme === 'mountain' ? 34 : 23,
  };
}
export function windSway(time: number, x: number, y: number): number {
  return Math.sin(time * 0.0018 + x * 0.03 + y * 0.017) * 0.035;
}
export function portalPulse(time: number): { alpha: number; scale: number } {
  const pulse = (1 + Math.sin(time * 0.0035)) / 2;
  return { alpha: 0.16 + pulse * 0.16, scale: 0.92 + pulse * 0.08 };
}
