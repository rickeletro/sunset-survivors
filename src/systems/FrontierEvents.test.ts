import { expect, it, vi } from 'vitest';
import { FrontierEvents } from './FrontierEvents';
import { frontierEvents } from '../data/frontierEvents';
vi.mock('../audio/SoundManager', () => ({ sounds: { playRicochet: vi.fn(), playBossWarning: vi.fn(), playExplosion: vi.fn() } }));
function fixture() {
  const nodes: any[] = [], tweens: any[] = [];
  const node = () => {
    const n: any = { list: [], active: true, x: 0, y: 0, add(v: any) { this.list.push(v); return this; }, getAt(i: number) { return this.list[i]; }, destroy() { this.active = false; }, setPosition(x: number, y: number) { this.x = x; this.y = y; return this; } };
    for (const method of ['fillStyle', 'fillEllipse', 'fillCircle', 'fillRect', 'lineStyle', 'lineBetween', 'strokeCircle', 'strokeRect', 'setDepth', 'setAlpha', 'setScale', 'setAngle', 'setY', 'setOrigin', 'setVisible']) n[method] = () => n;
    nodes.push(n); return n;
  };
  const scene: any = { add: { container: node, graphics: node, image: node }, events: new class { listeners = new Map<string, (() => void)[]>(); once(name: string, fn: () => void) { this.listeners.set(name, [...this.listeners.get(name) ?? [], fn]); } emit(name: string) { this.listeners.get(name)?.forEach(fn => fn()); } }(), tweens: { add: (t: any) => tweens.push(t) } };
  const enemies: any[] = [];
  const hooks = { spawn: vi.fn(() => { const e = { sprite: node() }; enemies.push(e); return e as any; }), explode: vi.fn(), banner: vi.fn() };
  const system = new FrontierEvents(scene, 'canyon', hooks);
  return { system, hooks, nodes, tweens, enemies, scene };
}
it('opens shutters before spawning the two guards and attaches a bounded fleeing bounty actor', () => {
  const { system, hooks, tweens, enemies } = fixture(), e = frontierEvents('canyon')[0];
  system.update(100, e.x, e.y, false); expect(hooks.spawn).not.toHaveBeenCalled();
  expect(tweens.some(t => t.duration === 650 && Math.abs(t.x) === 48)).toBe(true);
  system.update(1700, e.x, e.y, false);
  expect(hooks.spawn.mock.calls.filter((c: any[]) => c[0] === 'rifle_guard')).toHaveLength(2);
  const thief = enemies.find(e => e.fleeGoal); expect(thief.bountyVal).toBe(35);
  system.update(100, e.x, e.y, true); expect(thief.escapeAt).toBe(-1);
});
it('drops a cargo only once and staggers the neighboring powder chain across frames', () => {
  const { system, hooks, scene, nodes } = fixture(), events = frontierEvents('canyon');
  const cargo = events.find(e => e.kind === 'cargo')!;
  system.hit(cargo.x - 40, cargo.y - 105, cargo.x + 40, cargo.y - 105, 10);
  system.update(520, cargo.x, cargo.y, false); system.update(520, cargo.x, cargo.y, false);
  expect(hooks.explode).toHaveBeenCalledTimes(1);
  const powder = events.find(e => e.kind === 'powder')!;
  system.hit(powder.x, powder.y - 20, powder.x, powder.y - 20, 50);
  system.update(240, powder.x, powder.y, false); expect(hooks.explode).toHaveBeenCalledTimes(2);
  system.update(240, powder.x, powder.y, false); expect(hooks.explode).toHaveBeenCalledTimes(3);
  scene.events.emit('shutdown');
  expect(nodes.filter(n => n.list.length && n.active)).toHaveLength(0);
});
