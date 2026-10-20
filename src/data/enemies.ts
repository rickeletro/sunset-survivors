/** Definições tipadas dos inimigos comuns. O boss continua em data/bosses. */
export type EnemyKind = 'bandit' | 'snake' | 'dynamiter' | 'heavy' | 'elite' | 'knife_bandit' | 'knife_scout' | 'coyote' | 'longhorn' | 'rifle_guard';

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
  bandit: { kind: 'bandit', texture: 'enemy_bandit', scale: 0.9, baseHp: 30, hpPerSecond: 0.5, speed: 108, damage: 12, xp: 10, bounty: 1, unlockAt: 0, weight: 60, radius: 8 },
  snake: { kind: 'snake', texture: 'enemy_snake', scale: 0.9, baseHp: 20, hpPerSecond: 0.15, speed: 135, damage: 8, xp: 8, bounty: 1, unlockAt: 25, weight: 25, radius: 7 },
  dynamiter: { kind: 'dynamiter', texture: 'enemy_dynamiter', scale: 0.9, baseHp: 45, hpPerSecond: 0.2, speed: 80, damage: 18, xp: 18, bounty: 3, unlockAt: 45, weight: 12, radius: 8 },
  heavy: { kind: 'heavy', texture: 'enemy_heavy', scale: 1.0, baseHp: 180, hpPerSecond: 0.6, speed: 65, damage: 22, xp: 40, bounty: 6, unlockAt: 60, weight: 8, radius: 11 },
  elite: { kind: 'elite', texture: 'enemy_heavy', scale: 1.35, baseHp: 600, hpPerSecond: 2, speed: 85, damage: 30, xp: 120, bounty: 25, unlockAt: 50, weight: 0, tint: 0xffc52a, radius: 14 },
  knife_bandit: { kind: 'knife_bandit', texture: 'enemy_bandit', scale: 1, baseHp: 42, hpPerSecond: 0.3, speed: 112, damage: 13, xp: 14, bounty: 2, unlockAt: 8, weight: 0, radius: 9 },
  knife_scout: { kind: 'knife_scout', texture: 'enemy_bandit', scale: 1, baseHp: 55, hpPerSecond: 0.35, speed: 122, damage: 15, xp: 18, bounty: 2, unlockAt: 0, weight: 0, radius: 9 },
  coyote: { kind: 'coyote', texture: 'enemy_snake', scale: 1, baseHp: 24, hpPerSecond: 0.2, speed: 145, damage: 11, xp: 10, bounty: 1, unlockAt: 10, weight: 0, radius: 8 },
  longhorn: { kind: 'longhorn', texture: 'enemy_heavy', scale: 1.3, baseHp: 260, hpPerSecond: 0.5, speed: 85, damage: 32, xp: 50, bounty: 8, unlockAt: 0, weight: 0, radius: 18 },
  rifle_guard: { kind: 'rifle_guard', texture: 'enemy_bandit', scale: 1, baseHp: 65, hpPerSecond: 0.35, speed: 75, damage: 16, xp: 22, bounty: 3, unlockAt: 35, weight: 0, radius: 10 },

};
