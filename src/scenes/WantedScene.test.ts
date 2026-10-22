import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WantedScene } from './WantedScene';
import { sounds } from '../audio/SoundManager';
vi.mock('phaser', () => ({ default: { Scene: class {}, GameObjects: { Container: class {} } } }));
vi.mock('../audio/SoundManager', () => ({ sounds: { playPlayerGunshot: vi.fn() } }));

function harness(mode: 'briefing' | 'captured') {
  const scene: any = Object.create(WantedScene.prototype);
  const timers: { at: number; cb: () => void }[] = [];
  let now = 0;
  Object.assign(scene, {
    mode, cancelled: false, ready: false, isAdvancing: false,
    character: { id: 'billy' }, stage: 8, difficulty: 'hard',
    result: { stage: 8, runId: 'capture-test', kills: 0, bounty: 1200 },
    posterWidth: 580, posterHeight: 800, createBulletHole: vi.fn(),
    time: { delayedCall: (delay: number, cb: () => void) => timers.push({ at: now + delay, cb }) },
    cameras: { main: { shake: vi.fn(), flash: vi.fn(), fade: vi.fn() } },
    scene: { start: vi.fn() },
  });
  const tick = (until: number) => {
    while (true) {
      timers.sort((a, b) => a.at - b.at);
      if (!timers.length || timers[0].at > until) break;
      const timer = timers.shift()!; now = timer.at; timer.cb();
    }
    now = until;
  };
  return { scene, tick };
}
beforeEach(() => vi.clearAllMocks());
describe('Wanted poster cinematic flow', () => {
  it('enters gameplay silently from the briefing and advances only once', () => {
    const { scene, tick } = harness('briefing');
    scene.advance(); scene.advance(); tick(320);
    expect(sounds.playPlayerGunshot).not.toHaveBeenCalled();
    expect(scene.scene.start).toHaveBeenCalledExactlyOnceWith('GameScene', {
      character: scene.character, stage: 8, difficulty: 'hard',
    });
  });
  it('finishes four sampled gunshots before showing the stage result', () => {
    const { scene, tick } = harness('captured');
    scene.playCapture(); tick(1299);
    expect(sounds.playPlayerGunshot).toHaveBeenCalledTimes(3);
    expect(scene.ready).toBe(false);
    expect(scene.scene.start).not.toHaveBeenCalled();
    tick(1300);
    expect(sounds.playPlayerGunshot).toHaveBeenCalledTimes(4);
    expect(scene.createBulletHole).toHaveBeenCalledTimes(4);
    expect(scene.ready).toBe(true);
    tick(2519); expect(scene.scene.start).not.toHaveBeenCalled();
    tick(2520);
    expect(scene.scene.start).toHaveBeenCalledExactlyOnceWith('StageClearScene', scene.result);
  });
  it('does not replay or duplicate the result after manual advance following the last shot', () => {
    const { scene, tick } = harness('captured');
    scene.playCapture(); tick(1300); scene.advance(); tick(4000);
    expect(sounds.playPlayerGunshot).toHaveBeenCalledTimes(4);
    expect(scene.scene.start).toHaveBeenCalledTimes(1);
  });
  it('cancels outstanding shots and transitions when the scene shuts down', () => {
    const { scene, tick } = harness('captured');
    scene.playCapture(); tick(280); scene.cancelled = true; tick(5000);
    expect(sounds.playPlayerGunshot).toHaveBeenCalledTimes(1);
    expect(scene.scene.start).not.toHaveBeenCalled();
  });
});
