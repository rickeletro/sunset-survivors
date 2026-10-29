import { describe, it, expect } from 'vitest';
import { sounds } from './SoundManager';

describe('SoundManager - Western Pulp 98 Audio', () => {
  it('possui os métodos de reprodução de áudio requisitados', () => {
    expect(typeof sounds.playGunReload).toBe('function');
    expect(typeof sounds.playPistolShot).toBe('function');
    expect(typeof sounds.playPlayerGunshot).toBe('function');
    expect(typeof sounds.playBossDefeatedScream).toBe('function');
    expect(typeof sounds.playHeroVoice).toBe('function');
    expect(typeof sounds.stopHeroVoice).toBe('function');
    expect(typeof sounds.playBodyImpact).toBe('function');
  });

  it('permite alternar mute sem quebrar as chamadas de som', () => {
    const isMuted = sounds.toggleMute();
    expect(typeof isMuted).toBe('boolean');

    // Nenhuma chamada deve disparar exceção mesmo se silenciado
    expect(() => sounds.playGunReload()).not.toThrow();
    expect(() => sounds.playPistolShot()).not.toThrow();
    expect(() => sounds.playPlayerGunshot()).not.toThrow();
    expect(() => sounds.playBossDefeatedScream()).not.toThrow();
    expect(() => sounds.playBodyImpact()).not.toThrow();
    expect(() => sounds.playHeroVoice('steve')).not.toThrow();
    expect(() => sounds.playHeroVoice('billy')).not.toThrow();
    expect(() => sounds.playHeroVoice('bob')).not.toThrow();
    expect(() => sounds.playHeroVoice('cormano')).not.toThrow();

    // Restaura estado
    sounds.toggleMute();
  });

  it('inicia música com volume a 75% e SFX a 45%', () => {
    // Valida valores padrão
    expect(sounds.getMusicVolume()).toBeCloseTo(0.75, 2);
    expect(sounds.getSfxVolume()).toBeCloseTo(0.45, 2);

    // Testa alteração de volume e clamping entre 0 e 1
    sounds.setMusicVolume(0.5);
    expect(sounds.getMusicVolume()).toBeCloseTo(0.5, 2);

    sounds.setMusicVolume(1.5);
    expect(sounds.getMusicVolume()).toBe(1.0);

    sounds.setMusicVolume(-0.2);
    expect(sounds.getMusicVolume()).toBe(0.0);

    // Restaura para 75%
    sounds.setMusicVolume(0.75);

    sounds.setSfxVolume(0.45);
    expect(sounds.getSfxVolume()).toBeCloseTo(0.45, 2);
  });
});

it('routes recorded Faro audio through shared volume/mute, reuses clips and stops on exit', async () => {
  const { vi } = await import('vitest');
  const clips: { src: string; volume: number; muted: boolean; currentTime: number; play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn> }[] = [];
  vi.stubGlobal('Audio', class {
    volume = 1; muted = false; currentTime = 0;
    play = vi.fn(() => Promise.resolve()); pause = vi.fn();
    constructor(public src: string) { clips.push(this); }
  });
  try {
    sounds.playDealerGreeting(); sounds.playCards(); sounds.playShuffle(); sounds.playCards();
    expect(clips.map(c => c.src)).toEqual(['assets/audio/voices/dealer.mp3', 'assets/audio/sfx/cards.mp3', 'assets/audio/sfx/shuffling-deck-of-cards.mp3']);
    expect(clips[1].play).toHaveBeenCalledTimes(2);
    sounds.setSfxVolume(.3); expect(clips.every(c => c.volume === .3)).toBe(true);
    sounds.toggleMute(); expect(clips.every(c => c.muted)).toBe(true);
    sounds.playCards(); expect(clips[1].play).toHaveBeenCalledTimes(2);
    sounds.toggleMute(); sounds.stopFaroAudio();
    expect(clips.every(c => c.pause.mock.calls.length === 1 && c.currentTime === 0)).toBe(true);
  } finally { sounds.setSfxVolume(.45); vi.unstubAllGlobals(); }
});

it('replays the hospitality greeting on entry, respects volume/mute and stops it on exit', async () => {
  const { vi } = await import('vitest');
  const play=vi.fn(() => Promise.resolve()), pause=vi.fn();
  const clip={src:'',volume:1,muted:false,currentTime:0,play,pause};
  vi.stubGlobal('Audio',class { constructor(src:string) { clip.src=src; return clip; } });
  try {
    sounds.playHospitalityGreeting();
    expect(clip.src).toBe('assets/audio/voices/hospitality_vices.mp3');
    sounds.setSfxVolume(.25); expect(clip.volume).toBe(.25);
    clip.currentTime=10; sounds.playHospitalityGreeting(); expect(clip.currentTime).toBe(0); expect(play).toHaveBeenCalledTimes(2);
    sounds.toggleMute(); sounds.playHospitalityGreeting(); expect(play).toHaveBeenCalledTimes(2); expect(clip.muted).toBe(true);
    sounds.toggleMute(); sounds.stopFaroAudio(); expect(pause).toHaveBeenCalledOnce();
  } finally { sounds.setSfxVolume(.45); vi.unstubAllGlobals(); }
});
