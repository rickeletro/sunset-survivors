import { afterEach, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { stageMusicSource, MUSIC_MANIFEST } from './stageMusic';
import { sounds } from './SoundManager';
afterEach(() => { sounds.stopBGM(); vi.unstubAllGlobals(); });
describe('stage soundtrack routing', () => {
  it('resolves available files and uses a valid fallback for pending tracks', () => {
    for (let stage = 1; stage <= 8; stage++) expect(existsSync(`public/${stageMusicSource(stage)}`)).toBe(true);
    expect(stageMusicSource(2)).toContain('Frontier Pulse'); expect(stageMusicSource(6)).toContain('Dusty Frontier');
    expect(stageMusicSource(8)).toBe(MUSIC_MANIFEST.fallback);
    expect(MUSIC_MANIFEST.stages.every(track => track.prompt.includes('No vocals'))).toBe(true);
  });
  it('loops and caches tracks, preserves volume, and recovers from a missing stage track', () => {
    const created = [];
    class AudioStub {
      paused = true; handlers = {}; currentTime = 0;
      constructor(src) { this.src = src; created.push(this); }
      play() { this.paused = false; return Promise.resolve(); }
      pause() { this.paused = true; }
      addEventListener(event, cb) { this.handlers[event] = cb; }
    }
    vi.stubGlobal('Audio', AudioStub);
    sounds.playGameplayMusic(2);
    const stage2 = created[0]; expect(stage2.loop).toBe(true); expect(stage2.volume).toBe(sounds.getMusicVolume());
    sounds.playGameplayMusic(2); expect(created).toHaveLength(1);
    sounds.playGameplayMusic(6); expect(stage2.paused).toBe(true); expect(created).toHaveLength(2);
    sounds.playGameplayMusic(2); expect(created).toHaveLength(2);
    stage2.handlers.error(); expect(created.at(-1).src).toBe(MUSIC_MANIFEST.fallback);
    expect(created.at(-1).paused).toBe(false);
  });
});
