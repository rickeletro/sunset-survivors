import { ENEMY_DEFS, EnemyDef, EnemyKind } from '../data/enemies';
import { GameEvents } from './GameEvents';

export type SpawnPattern = 'ring' | 'cluster' | 'encircle';

export interface SpawnOrder {
  kind: EnemyKind;
  count: number;
  pattern: SpawnPattern;
}

const SPECIAL_FIRST_AT = 30;
const SPECIAL_EVERY = 45;
const ELITE_FIRST_AT = 50;
const ELITE_EVERY = 40;
const MAX_ALIVE = 320;

/**
 * Game Director: decide quanto, o quê e como spawnar ao longo da partida.
 *  - waveOrders(): hordas contínuas (chamado pelo timer de spawn)
 *  - tick():       eventos por segundo (ondas especiais, elites)
 * Não mexe em sprites; só devolve ordens que a cena executa.
 */
export class GameDirector {
  private nextSpecialAt = SPECIAL_FIRST_AT;
  private nextEliteAt = ELITE_FIRST_AT;
  private specialIndex = 0;
  private eliteCount = 0;

  constructor(private events: GameEvents) {}

  reset() {
    this.nextSpecialAt = SPECIAL_FIRST_AT;
    this.nextEliteAt = ELITE_FIRST_AT;
    this.specialIndex = 0;
    this.eliteCount = 0;
  }

  /** Quantidade alvo de inimigos vivos para o tempo atual. */
  targetCount(t: number): number {
    return Math.min(30 + Math.floor(t * 0.55), 280);
  }

  /** 0..1 aproximado de pressão, útil para HUD/música futuramente. */
  intensity(t: number): number {
    return Math.min(t / 600, 1);
  }

  waveOrders(t: number, alive: number): SpawnOrder[] {
    const deficit = this.targetCount(t) - alive;
    if (deficit <= 0) return [];
    const batch = Math.min(deficit, 4 + Math.floor(t / 30));

    const pool = (Object.values(ENEMY_DEFS) as EnemyDef[]).filter((d) => d.weight > 0 && t >= d.unlockAt);
    const total = pool.reduce((s, d) => s + d.weight, 0);
    const counts = new Map<EnemyKind, number>();
    for (let i = 0; i < batch; i++) {
      let r = Math.random() * total;
      let pick = pool[0];
      for (const d of pool) {
        r -= d.weight;
        if (r <= 0) {
          pick = d;
          break;
        }
      }
      counts.set(pick.kind, (counts.get(pick.kind) ?? 0) + 1);
    }
    return Array.from(counts, ([kind, count]) => ({ kind, count, pattern: 'ring' as const }));
  }

  tick(t: number, alive: number): SpawnOrder[] {
    const orders: SpawnOrder[] = [];
    if (alive >= MAX_ALIVE) return orders;

    if (t >= this.nextSpecialAt) {
      this.nextSpecialAt += SPECIAL_EVERY;
      const swarm = this.specialIndex++ % 2 === 0;
      if (swarm) {
        this.events.emitSpecialWave({ label: '🐍 SNAKE SWARM!' });
        orders.push({ kind: 'snake', count: 20 + Math.floor(t / 20), pattern: 'cluster' });
      } else {
        this.events.emitSpecialWave({ label: '☠ AMBUSH! SURROUNDED!' });
        orders.push({ kind: 'bandit', count: 26 + Math.floor(t / 20), pattern: 'encircle' });
      }
    }

    if (t >= this.nextEliteAt) {
      this.nextEliteAt += ELITE_EVERY;
      this.eliteCount++;
      this.events.emitEliteSpawned();
      orders.push({ kind: 'elite', count: 1 + Math.floor(this.eliteCount / 3), pattern: 'ring' });
    }
    return orders;
  }
}
