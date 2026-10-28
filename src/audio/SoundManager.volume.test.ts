import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

function audioGraph() {
  const destination = {};
  const nodes: ReturnType<typeof node>[] = [];
  const param = () => ({ setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() });
  function node() {
    return { connect: vi.fn(), start: vi.fn(), stop: vi.fn(), gain: param(), frequency: param(), buffer: null, type: '' };
  }
  const make = () => { const n = node(); nodes.push(n); return n; };
  vi.stubGlobal('window', { AudioContext: class {
    destination = destination; currentTime = 10; sampleRate = 100; state = 'running';
    createGain = make; createOscillator = make; createBufferSource = make; createBiquadFilter = make;
    createBuffer(_channels: number, size: number) { return { getChannelData: () => new Float32Array(size) }; }
  } });
  return { nodes, destination };
}

it('all synthesized effects, including weapon fallbacks and coins, use the live SFX master', async () => {
  vi.resetModules();
  const { nodes, destination } = audioGraph();
  const { sounds } = await import('./SoundManager');
  sounds.setSfxVolume(0);
  sounds.playRevolver(); sounds.playShotgun(); sounds.playRifle(); sounds.playRicochet();
  sounds.playWhip(); sounds.playExplosion(); sounds.playCoin(); sounds.playLevelUp();
  sounds.playHit(); sounds.playBossWarning(); sounds.playReload(); sounds.playMagnet();
  const master = nodes[0];
  expect(master.gain.setValueAtTime).toHaveBeenLastCalledWith(0, 10);
  expect(master.connect).toHaveBeenCalledWith(destination);
  for (const n of nodes.slice(1)) expect(n.connect).not.toHaveBeenCalledWith(destination);
  // Every terminal effect gain must flow to the shared master, including multi-part gun sounds.
  for (const n of nodes.slice(1).filter(n => n.gain.setValueAtTime.mock.calls.length)) {
    expect(n.connect).toHaveBeenCalledWith(master);
  }
  sounds.setSfxVolume(.2);
  expect(master.gain.setValueAtTime).toHaveBeenLastCalledWith(.2, 10);
  sounds.toggleMute(); expect(master.gain.setValueAtTime).toHaveBeenLastCalledWith(0, 10);
  sounds.setSfxVolume(.6); expect(master.gain.setValueAtTime).toHaveBeenLastCalledWith(0, 10);
  sounds.toggleMute(); expect(master.gain.setValueAtTime).toHaveBeenLastCalledWith(.6, 10);
});

it('updates every playing recorded effect and voice immediately without changing music volume', async () => {
  vi.resetModules();
  const clips: { volume: number; muted: boolean; src: string }[] = [];
  vi.stubGlobal('Audio', class {
    volume=1; muted=false; currentTime=0; paused=false;
    play=vi.fn(() => Promise.resolve()); pause=vi.fn(); addEventListener=vi.fn();
    constructor(public src: string) { clips.push(this); }
  });
  const { sounds } = await import('./SoundManager');
  sounds.playPlayerGunshot(); sounds.playPistolShot(); sounds.playGunReload();
  sounds.playBossDefeatedScream(); sounds.playHeroVoice('steve'); sounds.playHeroVoice('billy');
  sounds.playCards(); sounds.playShuffle(); sounds.playDealerGreeting(); sounds.playHospitalityGreeting();
  sounds.playIntroMusic();
  const music=clips.at(-1)!;
  const effects=clips.slice(0,-1);
  expect(effects).toHaveLength(15);
  sounds.setSfxVolume(0);
  expect(effects.every(c => c.volume === 0)).toBe(true);
  expect(music.volume).toBe(.75);
  sounds.toggleMute(); expect(clips.every(c => c.muted)).toBe(true);
  sounds.setSfxVolume(.3); expect(effects.every(c => c.volume === .3 && c.muted)).toBe(true);
  sounds.toggleMute(); expect(clips.every(c => !c.muted)).toBe(true);
  expect(music.volume).toBe(.75);
  sounds.playPlayerGunshot(); expect(effects.every(c => c.volume === .3)).toBe(true);
});

it('a failed recorded shot stays silent through its synthesized fallback at zero SFX volume', async () => {
  vi.resetModules();
  const { nodes, destination }=audioGraph();
  vi.stubGlobal('Audio', class { volume=1; currentTime=0; play=() => Promise.reject(new Error('unavailable clip')); });
  const { sounds }=await import('./SoundManager');
  sounds.setSfxVolume(0); sounds.playPlayerGunshot();
  await Promise.resolve();
  expect(nodes[0].gain.setValueAtTime).toHaveBeenLastCalledWith(0,10);
  expect(nodes.slice(1).every(n => !n.connect.mock.calls.some(([target]) => target === destination))).toBe(true);
});
