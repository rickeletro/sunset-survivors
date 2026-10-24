import type { EnemyDef } from './enemies';
export type DifficultyId = 'easy' | 'normal' | 'hardcore';
export const DIFFICULTIES = {
  easy: { label: 'EASY', enemyHp: 0.85, bossHp: 0.75, incomingDamage: 0.65, description: 'More room to learn and explore.' },
  normal: { label: 'NORMAL', enemyHp: 1, bossHp: 1, incomingDamage: 1, description: 'The frontier standard: dodge, build and choose.' },
  hardcore: { label: 'HARDCORE', enemyHp: 1.15, bossHp: 1.15, incomingDamage: 1.15, description: 'Mistakes cost more. Your progress stays safe.' },
} as const;
export const DIFFICULTY_IDS = ['easy', 'normal', 'hardcore'] as const;
export function normalizeDifficulty(value: unknown): DifficultyId {
  return value === 'easy' || value === 'hardcore' ? value : 'normal';
}
export function difficultyProfile(value: unknown) { return DIFFICULTIES[normalizeDifficulty(value)]; }
/** Smooth, explicit active-time curve. Frozen at seven minutes, including long boss fights. */
export function threatFactor(seconds: number): number {
  return 1 + Math.max(0, Math.min(420, Number.isFinite(seconds) ? seconds : 0)) / 60 * 0.12;
}
export function enemyHealth(def: Pick<EnemyDef, 'baseHp' | 'hpPerSecond'>, seconds: number, mode?: DifficultyId): number {
  const active = Math.max(0, Math.min(420, Number.isFinite(seconds) ? seconds : 0));
  return Math.max(1, Math.round((def.baseHp + active * def.hpPerSecond) * threatFactor(active) * difficultyProfile(mode).enemyHp));
}
export function bossHealth(normalBase: number, mode?: DifficultyId): number {
  return Math.max(1, Math.round(normalBase * difficultyProfile(mode).bossHp));
}
export function incomingDamage(base: number, armor: number, mode?: DifficultyId): number {
  return Math.max(1, Math.round(base * difficultyProfile(mode).incomingDamage) - armor);
}
interface Storage { getItem(key: string): string | null; setItem(key: string, value: string): void; }
export class DifficultySettings {
  private selected: DifficultyId = 'normal';
  constructor(private storage: () => Storage = () => globalThis.localStorage) {
    try { this.selected = normalizeDifficulty(this.storage().getItem('sunset_difficulty_v1')); } catch { /* Session fallback. */ }
  }
  get(): DifficultyId { return this.selected; }
  set(value: unknown): void {
    this.selected = normalizeDifficulty(value);
    try { this.storage().setItem('sunset_difficulty_v1', this.selected); } catch { /* Session fallback. */ }
  }
}
export const difficultySettings = new DifficultySettings();
