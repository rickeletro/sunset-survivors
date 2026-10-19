/** Definições tipadas dos inimigos comuns. O boss continua em data/bosses. */
export type EnemyKind = 'bandit' | 'snake' | 'dynamiter' | 'heavy' | 'elite';

export interface EnemyDef {
  kind: EnemyKind;
  texture: string;
  scale: number;
  baseHp: number;
  hpPerSecond: number;
  speed: number;
  damage: number;
  xp: number;
  bounty: number;
  /** Segundos de partida a partir dos quais pode aparecer. */
  unlockAt: number;
  /** Peso no sorteio das hordas normais (0 = só por ordem do Director). */
  weight: number;
  tint?: number;
  /** Raio usado na separação entre inimigos. */
  radius: number;
}

export const ENEMY_DEFS: Record<EnemyKind, EnemyDef> = {
  bandit: { kind: 'bandit', texture: 'enemy_bandit', scale: 0.9, baseHp: 30, hpPerSecond: 0.5, speed: 90, damage: 10, xp: 10, bounty: 15, unlockAt: 0, weight: 60, radius: 8 },
  snake: { kind: 'snake', texture: 'enemy_snake', scale: 0.9, baseHp: 20, hpPerSecond: 0.15, speed: 135, damage: 8, xp: 8, bounty: 10, unlockAt: 25, weight: 25, radius: 7 },
  dynamiter: { kind: 'dynamiter', texture: 'enemy_dynamiter', scale: 0.9, baseHp: 45, hpPerSecond: 0.2, speed: 80, damage: 18, xp: 18, bounty: 35, unlockAt: 45, weight: 12, radius: 8 },
  heavy: { kind: 'heavy', texture: 'enemy_heavy', scale: 1.0, baseHp: 180, hpPerSecond: 0.6, speed: 65, damage: 22, xp: 40, bounty: 80, unlockAt: 60, weight: 8, radius: 11 },
  elite: { kind: 'elite', texture: 'enemy_heavy', scale: 1.35, baseHp: 600, hpPerSecond: 2, speed: 85, damage: 30, xp: 120, bounty: 250, unlockAt: 50, weight: 0, tint: 0xffc52a, radius: 14 },
};
