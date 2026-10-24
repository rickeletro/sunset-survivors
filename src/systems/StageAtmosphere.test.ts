import { expect, it, vi } from 'vitest';
import { StageAtmosphere } from './StageAtmosphere';
vi.mock('phaser', () => ({ default: {} }));
vi.mock('./GroundShadow', () => ({ GroundShadow: class { update() {} destroy() {} } }));
it('uses follow-compatible emit zones, seeds visible effects immediately, and cleans up', () => {
  const emitters: any[] = [];
  let shutdown = () => {};
  const actor: any = { x: 4000, y: 4000 };
  const scene: any = { textures: { exists: () => true }, events: { once: (_: string, callback: () => void) => { shutdown = callback; } },
    add: { particles: (_x: number, _y: number, texture: string, config: any) => {
      const emitter: any = { texture, config, startFollow: vi.fn(), emitParticle: vi.fn(), destroy: vi.fn() };
      emitter.setDepth = () => emitter; emitters.push(emitter); return emitter;
    } } };
  new StageAtmosphere(scene, 'canyon', actor);
  expect(emitters).toHaveLength(2);
  expect(emitters[0].config.emitZone.source.getRandomPoint).toBeTypeOf('function');
  expect(emitters[1].config.emitZone.source.getRandomPoint).toBeTypeOf('function');
  expect(emitters[0].emitParticle).toHaveBeenCalledWith(16);
  expect(emitters[1].emitParticle).toHaveBeenCalledWith(1);
  expect(emitters[0].startFollow).toHaveBeenCalledWith(actor);
  expect(emitters[0].config.maxParticles).toBe(36);
  expect(emitters[1].config.maxParticles).toBe(3);
  shutdown(); expect(emitters.every(e => e.destroy.mock.calls.length === 1)).toBe(true);
});
