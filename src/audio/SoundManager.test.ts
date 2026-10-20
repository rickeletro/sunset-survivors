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
  });

  it('permite alternar mute sem quebrar as chamadas de som', () => {
    const isMuted = sounds.toggleMute();
    expect(typeof isMuted).toBe('boolean');

    // Nenhuma chamada deve disparar exceção mesmo se silenciado
    expect(() => sounds.playGunReload()).not.toThrow();
    expect(() => sounds.playPistolShot()).not.toThrow();
    expect(() => sounds.playPlayerGunshot()).not.toThrow();
    expect(() => sounds.playBossDefeatedScream()).not.toThrow();
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
