import { createRequire } from 'node:module';
import { expect, it } from 'vitest';
import { ambientSpawn, brushSpawn } from '../data/atmosphereEmission';
const require = createRequire(import.meta.url);
const Particle = require('phaser/src/gameobjects/particles/Particle.js');

// Run the installed Phaser spawn implementation: forced follow coordinates bypass ops.x/y.
function spawn(source, x = 4000, y = 4000) {
  const op = { steps: 0, active: false, onEmit: () => 1 };
  const ops = new Proxy({}, { get: () => op });
  const emitter = { ops, getAnim: () => null, getFrame: () => ({ texture: {} }),
    getEmitZone: p => source(p), worldMatrix: { transformPoint() {} }, getDeathZone: () => false };
  const particle = { emitter, x: 0, y: 0, worldPosition: {} };
  Particle.prototype.fire.call(particle, x, y);
  return particle;
}
it('spreads dust across the viewport even when following a player', () => {
  const left = spawn(p => ambientSpawn(p, 1500, 860, () => 0));
  const right = spawn(p => ambientSpawn(p, 1500, 860, () => 1));
  expect(left.x).toBe(3250); expect(left.y).toBe(3570);
  expect(right.x).toBe(4750); expect(right.y).toBe(4430);
});
it('spawns rolling brush upstream, rather than directly on the hero', () => {
  const brush = spawn(p => brushSpawn(p, () => 0.5));
  expect(brush.x).toBe(3420); expect(brush.y).toBe(4000);
});
