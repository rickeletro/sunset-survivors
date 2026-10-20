import { describe, expect, it, vi } from 'vitest';
import { GameDirector, MAX_ALIVE } from './GameDirector';
import type { GameEvents } from './GameEvents';
import { ENEMY_DEFS } from '../data/enemies';
import { STAGES } from '../data/stages';
const bus = () => ({ emitSpecialWave: vi.fn(), emitEliteSpawned: vi.fn() } as unknown as GameEvents);

describe('stage-aware horde director', () => {
  it('simulates every second of all eight stages without invalid enemies or overflowing the cap', () => {
    for (const stage of STAGES) {
      const director = new GameDirector(bus(), stage, () => 0.5);
      let alive = 0;
      for (let t = 0; t <= stage.duration + 90; t++) {
        alive = Math.max(0, alive - 2); // steady player kills, not a browser playtest
        for (const order of [...director.waveOrders(t, alive), ...director.tick(t, alive)]) {
          expect(ENEMY_DEFS[order.kind]).toBeDefined();
          expect(order.count).toBeGreaterThan(0);
          // Each call has its own capacity; scene admission is also capped.
          alive = Math.min(MAX_ALIVE, alive + order.count);
        }
        expect(director.targetCount(t)).toBeLessThanOrEqual(MAX_ALIVE);
      }
    }
  });
  it('honors unlock times, stage rosters, recovery and a nearly full arena', () => {
    const stage = STAGES[1]; const d = new GameDirector(bus(), stage, () => 0.99);
    expect(d.waveOrders(0, 0).every(o => ENEMY_DEFS[o.kind].unlockAt <= 0)).toBe(true);
    expect(d.waveOrders(100, 0).every(o => (stage.enemies[o.kind] ?? 0) > 0)).toBe(true);
    expect(d.targetCount(150)).toBeLessThan(d.targetCount(120));
    expect(d.waveOrders(600, MAX_ALIVE)).toEqual([]);
    expect(d.tick(200, MAX_ALIVE - 1).reduce((sum, o) => sum + o.count, 0)).toBeLessThanOrEqual(1);
  });
  it('resets event scheduling and does not duplicate special waves in one second', () => {
    const b = bus(); const d = new GameDirector(b);
    expect(d.tick(30, 0).length).toBe(1);
    expect(d.tick(30, 0)).toEqual([]);
    d.reset();
    expect(d.tick(29, 0)).toEqual([]);
    expect(d.tick(30, 0).length).toBe(1);
  });
});
