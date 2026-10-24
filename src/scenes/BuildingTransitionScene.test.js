import { createRequire } from 'node:module';
import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { BuildingTransitionScene } from './BuildingTransitionScene';
import { saloonDoors } from '../data/saloon';
vi.mock('phaser', () => ({ default: { Scene: class {}, BlendModes: { ADD: 1 } } }));
vi.mock('../audio/SoundManager', () => ({ sounds: { playReload: vi.fn() } }));
function fixture(mode = 'enter', sourceTexture) {
  const scene = new BuildingTransitionScene(), objects = [];
  const node = (x = 0, y = 0) => {
    const n = { x, y, alpha: 1, scaleX: 1, scaleY: 1 };
    for (const method of ['setOrigin', 'setDepth', 'setBlendMode', 'fillStyle', 'fillRect', 'setFlipX', 'play']) n[method] = vi.fn(() => n);
    n.setPosition = vi.fn((x, y) => { n.x = x; n.y = y; return n; });
    n.setAlpha = vi.fn(a => { n.alpha = a; return n; });
    n.setScale = vi.fn((x, y = x) => { n.scaleX = x; n.scaleY = y; return n; }); objects.push(n); return n;
  };
  const camera = {};
  for (const method of ['setScroll', 'setZoom', 'fadeIn', 'fadeOut']) camera[method] = vi.fn(() => camera);
  const texture = sourceTexture ?? { has: () => false, add: vi.fn() };
  Object.assign(scene, { textures: { get: () => texture }, add: { image: node, sprite: node, graphics: () => node() }, cameras: { main: camera },
    scene: { stop: vi.fn() }, events: new EventEmitter() });
  const portal = saloonDoors('canyon')[0].portal;
  const path = mode === 'enter' ? [{ x: 3700, y: 3690 }, portal.threshold] : [portal.threshold, { x: 3580, y: 3668 }];
  const data = { mode, path, portal, camera: { scrollX: 2650, scrollY: 3120, zoom: 1.4 },
    actor: { hero: 'cormano', pixellab: true, texture: 'pl_cormano_south_0', frame: 0, scaleX: 0.5, scaleY: 0.5 },
    onZoom: vi.fn(), onPosition: vi.fn(), onComplete: vi.fn(), onCancel: vi.fn() };
  scene.init(data); scene.create(); return { scene, data, camera, objects, texture };
}
describe('layered building transition without browser gameplay', () => {
  it.each(['enter', 'exit'])('copies the world camera, preserves proportions and completes %s exactly once', mode => {
    const { scene, data, camera } = fixture(mode);
    expect(camera.setScroll).toHaveBeenCalledWith(2650, 3120); expect(camera.setZoom).toHaveBeenCalledWith(1.4);
    for (let t = 0; t < 4000; t += 16) scene.update(t, 16);
    expect(data.onComplete).toHaveBeenCalledOnce(); expect(data.onCancel).not.toHaveBeenCalled();
    expect(scene.scene.stop).toHaveBeenCalledExactlyOnceWith('BuildingTransitionScene');
    expect(scene.actor.scaleX).toBeCloseTo(scene.actor.scaleY);
    expect(scene.actor.play).toHaveBeenCalledWith(mode === 'enter' ? 'pl_cormano_north_walk' : 'pl_cormano_south_walk', true);
    scene.events.emit('shutdown'); expect(data.onCancel).not.toHaveBeenCalled();
    if (mode === 'enter') expect(camera.fadeOut).toHaveBeenCalledOnce(); else expect(camera.fadeIn).toHaveBeenCalledOnce();
  });
  it('cancels a partial presentation once without invoking a successful completion', () => {
    const { scene, data } = fixture(); scene.update(0, 100); scene.events.emit('shutdown'); scene.events.emit('shutdown'); scene.update(0, 4000);
    expect(data.onCancel).toHaveBeenCalledOnce(); expect(data.onComplete).not.toHaveBeenCalled();
  });
});

it('extracts the animated door leaves from the approved facade pixels', () => {
  const { texture, scene } = fixture();
  expect(texture.add).toHaveBeenCalledTimes(2);
  expect(texture.add).toHaveBeenCalledWith(expect.any(String), 0, 132, 177, 14, 34);
  expect(texture.add).toHaveBeenCalledWith(expect.any(String), 0, 146, 173, 14, 34);
  expect(scene.leaves).toHaveLength(2);
});

it('breathes the camera only during the frozen transition and restores its lens on cancel', () => {
  const { scene, data, camera } = fixture();
  scene.update(0, 200);
  const zoom = data.onZoom.mock.calls.at(-1)[0];
  expect(zoom).toBeGreaterThan(1.4);
  expect(zoom).toBeLessThanOrEqual(1.4 * 1.10);
  expect(camera.setZoom).toHaveBeenLastCalledWith(zoom);
  scene.events.emit('shutdown');
  expect(data.onZoom).toHaveBeenLastCalledWith(1.4);
});

it('preserves the full 256px facade after door extraction using the real Phaser texture implementation', () => {
  const require = createRequire(import.meta.url), Texture = require('phaser/src/textures/Texture.js');
  const texture = Object.assign(Object.create(Texture.prototype), {
    source: [{ width: 256, height: 256, resolution: 1 }], frames: {}, firstFrame: '__BASE', frameTotal: 0,
  });
  texture.add('__BASE', 0, 0, 0, 256, 256);
  fixture('enter', texture);
  expect(texture.firstFrame).toBe('__BASE');
  expect(texture.get().width).toBe(256); expect(texture.get().height).toBe(256);
  expect(texture.get('portal-leaf-0-132-177-14-34').width).toBe(14);
  fixture('exit', texture);
  expect(texture.get().width).toBe(256);
});
