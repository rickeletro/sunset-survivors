import Phaser from 'phaser';
import { EnemyKind } from '../data/enemies';

/** Barramento de eventos entre sistemas (director, HUD, loot, estatísticas). */
export interface EnemyKilledEvent {
  kind: EnemyKind | 'boss';
  x: number;
  y: number;
}

export interface SpecialWaveEvent {
  label: string;
}

export const GameEventNames = {
  EnemyKilled: 'enemy:killed',
  PlayerDamaged: 'player:damaged',
  SpecialWave: 'wave:special',
  EliteSpawned: 'elite:spawned',
} as const;

export class GameEvents extends Phaser.Events.EventEmitter {
  emitEnemyKilled(e: EnemyKilledEvent) {
    this.emit(GameEventNames.EnemyKilled, e);
  }
  emitPlayerDamaged(amount: number) {
    this.emit(GameEventNames.PlayerDamaged, amount);
  }
  emitSpecialWave(e: SpecialWaveEvent) {
    this.emit(GameEventNames.SpecialWave, e);
  }
  emitEliteSpawned() {
    this.emit(GameEventNames.EliteSpawned);
  }
}
