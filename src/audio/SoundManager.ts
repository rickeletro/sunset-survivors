import { MUSIC_MANIFEST, stageMusicSource } from './stageMusic';
/**
 * Web Audio API Synthesizer for Sunset Survivors
 * Synthesized arcade effects and cached, volume-controlled recorded clips.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private musicVolume: number = 0.75;
  private sfxVolume: number = 0.45;
  private sfxGainNode: GainNode | null = null;

  constructor() {
    this.loadVolumeSettings();
  }

  private loadVolumeSettings() {
    try {
      if (typeof localStorage !== 'undefined') {
        const savedMusic = localStorage.getItem('sunset_survivors_music_volume');
        if (savedMusic !== null) {
          const val = parseFloat(savedMusic);
          if (!isNaN(val)) this.musicVolume = Math.max(0, Math.min(1, val));
        }
        const savedSfx = localStorage.getItem('sunset_survivors_sfx_volume');
        if (savedSfx !== null) {
          const val = parseFloat(savedSfx);
          if (!isNaN(val)) this.sfxVolume = Math.max(0, Math.min(1, val));
        }
      }
    } catch {}
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.sfxGainNode = this.ctx.createGain();
      this.sfxGainNode.gain.setValueAtTime(this.isMuted ? 0 : this.sfxVolume, this.ctx.currentTime);
      this.sfxGainNode.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('sunset_survivors_music_volume', this.musicVolume.toString());
      }
    } catch {}
    if (this.currentBgm) {
      this.currentBgm.volume = this.isMuted ? 0 : this.musicVolume;
    }
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    for (const clip of this.faroAudio.values()) clip.volume = this.sfxVolume;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('sunset_survivors_sfx_volume', this.sfxVolume.toString());
      }
    } catch {}
    if (this.ctx && this.sfxGainNode) {
      this.sfxGainNode.gain.setValueAtTime(this.isMuted ? 0 : this.sfxVolume, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    for (const clip of this.faroAudio.values()) clip.muted = this.isMuted;
    if (this.currentBgm) {
      this.currentBgm.muted = this.isMuted;
      this.currentBgm.volume = this.isMuted ? 0 : this.musicVolume;
    }
    if (this.ctx && this.sfxGainNode) {
      this.sfxGainNode.gain.setValueAtTime(this.isMuted ? 0 : this.sfxVolume, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // 1. Revolver Quickdraw Shot
  public playRevolver() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Noise buffer for the gun powder explosion
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.02));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.12);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    // Initial sharp transient
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.08);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    noise.start(t);
    osc.stop(t + 0.08);
    noise.stop(t + 0.12);
  }

  // 2. Shotgun Blast (Heavy rumble & pellet spread)
  public playShotgun() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Heavy low punch
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.25);

    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    // White noise explosion blast
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.07));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, t);
    filter.frequency.exponentialRampToValueAtTime(150, t + 0.35);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(1.0, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    osc.start(t);
    noise.start(t);
    osc.stop(t + 0.28);
    noise.stop(t + 0.35);
  }

  // 3. Winchester Rifle (Piercing high crack)
  public playRifle() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.15);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);

    // Ricochet ping
    this.playRicochet(0.06);
  }

  // 4. Bullet Ricochet Ping ("PEEE-OOOWW")
  public playRicochet(delay: number = 0) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2800, t);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.2);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  public playWhip() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGainNode) return;
    const t = this.ctx.currentTime;
    const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.16), this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource(), filter = this.ctx.createBiquadFilter(), gain = this.ctx.createGain();
    noise.buffer = buffer; filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, t); filter.frequency.exponentialRampToValueAtTime(4200, t + 0.11);
    gain.gain.setValueAtTime(0.01, t); gain.gain.linearRampToValueAtTime(0.7, t + 0.10); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    noise.connect(filter); filter.connect(gain); gain.connect(this.sfxGainNode);
    noise.start(t); noise.stop(t + 0.16);
  }

  // 5. Dynamite / TNT Explosion
  public playExplosion() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.6;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.12));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + 0.6);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t);
    noise.stop(t + 0.6);
  }

  // 6. Gold / Coin Pickup Chime
  public playCoin() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, t); // B5
    osc.frequency.setValueAtTime(1318.51, t + 0.07); // E6

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  // 7. Level Up Fanfare (Western Brass Trumpet Arpeggio)
  public playMagnet(): void { this.playLevelUp(); this.playCoin(); }

  public playLevelUp() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  // 8. Enemy Hit / Bandit Grunt
  public playHit() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.09);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  // 9. Boss Warning Horn / Stamp
  public playBossWarning() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.setValueAtTime(82, t + 0.3);
    osc.frequency.setValueAtTime(110, t + 0.6);

    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 1.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 1.2);
  }

  // 11. Western Revolver / Gun Reload (Cylinder latch, spinning ratchet, and solid snap lock)
  public playReload() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Phase 1: Latch pop (open cylinder)
    const popOsc = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    popOsc.type = 'triangle';
    popOsc.frequency.setValueAtTime(1400, t);
    popOsc.frequency.exponentialRampToValueAtTime(320, t + 0.04);
    popGain.gain.setValueAtTime(0.5, t);
    popGain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);
    popOsc.connect(popGain);
    popGain.connect(this.ctx.destination);
    popOsc.start(t);
    popOsc.stop(t + 0.04);

    // Phase 2: Rapid spinning cylinder clicks (ratchet clicks)
    const clickTimes = [0.06, 0.11, 0.16, 0.20, 0.24];
    clickTimes.forEach((dt, i) => {
      if (!this.ctx) return;
      const ct = t + dt;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1800 + i * 120, ct);
      osc.frequency.exponentialRampToValueAtTime(500, ct + 0.02);
      gain.gain.setValueAtTime(0.35, ct);
      gain.gain.exponentialRampToValueAtTime(0.001, ct + 0.025);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(ct);
      osc.stop(ct + 0.025);
    });

    // Phase 3: Heavy cylinder snap shut & hammer lock (CLACK!)
    const snapTime = t + 0.30;
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'sawtooth';
    snapOsc.frequency.setValueAtTime(480, snapTime);
    snapOsc.frequency.exponentialRampToValueAtTime(80, snapTime + 0.09);
    snapGain.gain.setValueAtTime(0.8, snapTime);
    snapGain.gain.exponentialRampToValueAtTime(0.001, snapTime + 0.10);
    snapOsc.connect(snapGain);
    snapGain.connect(this.ctx.destination);
    snapOsc.start(snapTime);
    snapOsc.stop(snapTime + 0.10);

    // Mechanical metallic ring after snap
    const ringOsc = this.ctx.createOscillator();
    const ringGain = this.ctx.createGain();
    ringOsc.type = 'sine';
    ringOsc.frequency.setValueAtTime(2600, snapTime);
    ringOsc.frequency.exponentialRampToValueAtTime(1100, snapTime + 0.14);
    ringGain.gain.setValueAtTime(0.28, snapTime);
    ringGain.gain.exponentialRampToValueAtTime(0.001, snapTime + 0.16);
    ringOsc.connect(ringGain);
    ringGain.connect(this.ctx.destination);
    ringOsc.start(snapTime);
    ringOsc.stop(snapTime + 0.16);
  }

  // 12. Western Soundtracks (HTML5 Audio Streaming)
  private currentBgm: HTMLAudioElement | null = null;
  private currentTrack: string | null = null;
  private musicCache = new Map<string, HTMLAudioElement>();
  private pistolAudio: HTMLAudioElement | null = null;
  private reloadAudio: HTMLAudioElement | null = null;
  private sfxPistolPool: HTMLAudioElement[] = [];
  private sfxPistolPoolIndex: number = 0;
  private sfxScreamAudio: HTMLAudioElement | null = null;
  private heroVoiceAudios: Map<string, HTMLAudioElement> = new Map();

  // Disparo da arma do jogador (usa public/assets/audio/sfx/pistol-shot.mp3 com pool de polifonia)
  public playPlayerGunshot() {
    if (this.isMuted) return;
    try {
      if (this.sfxPistolPool.length === 0) {
        for (let i = 0; i < 6; i++) {
          const a = new Audio('assets/audio/sfx/pistol-shot.mp3');
          a.volume = this.sfxVolume;
          this.sfxPistolPool.push(a);
        }
      }
      const audio = this.sfxPistolPool[this.sfxPistolPoolIndex];
      this.sfxPistolPoolIndex = (this.sfxPistolPoolIndex + 1) % this.sfxPistolPool.length;
      audio.currentTime = 0;
      audio.volume = this.sfxVolume;
      audio.play().catch(() => {
        this.playRevolver();
      });
    } catch {
      this.playRevolver();
    }
  }

  // Som de tiro ao selecionar jogador na tela de escolha (public/assets/audio/pistol-shot.mp3)
  public playPistolShot() {
    if (this.isMuted) return;
    try {
      if (!this.pistolAudio) {
        this.pistolAudio = new Audio('assets/audio/pistol-shot.mp3');
      }
      this.pistolAudio.currentTime = 0;
      this.pistolAudio.volume = this.sfxVolume;
      this.pistolAudio.play().catch(() => {
        this.playRevolver();
      });
    } catch {
      this.playRevolver();
    }
  }

  // Efeito de carregando arma ao entrar na tela de escolha (public/assets/audio/gun-reload.mp3)
  public playGunReload() {
    if (this.isMuted) return;
    try {
      if (!this.reloadAudio) {
        this.reloadAudio = new Audio('assets/audio/gun-reload.mp3');
      }
      this.reloadAudio.currentTime = 0;
      this.reloadAudio.volume = this.sfxVolume;
      this.reloadAudio.play().catch(() => {
        this.playReload();
      });
    } catch {
      this.playReload();
    }
  }

  // Som ao derrotar o boss (public/assets/audio/sfx/man-screaming.mp3)
  public playBossDefeatedScream() {
    if (this.isMuted) return;
    try {
      if (!this.sfxScreamAudio) {
        this.sfxScreamAudio = new Audio('assets/audio/sfx/man-screaming.mp3');
      }
      this.sfxScreamAudio.currentTime = 0;
      this.sfxScreamAudio.volume = this.sfxVolume;
      this.sfxScreamAudio.play().catch(() => {});
    } catch {}
  }

  private faroAudio = new Map<string, HTMLAudioElement>();
  private playFaroClip(key: 'cards' | 'shuffle' | 'dealer' | 'hospitality'): void {
    if (this.isMuted) return;
    const paths = {
      hospitality: 'assets/audio/voices/hospitality_vices.mp3',
      cards: 'assets/audio/sfx/cards.mp3', shuffle: 'assets/audio/sfx/shuffling-deck-of-cards.mp3', dealer: 'assets/audio/voices/dealer.mp3',
    };
    try {
      let clip = this.faroAudio.get(key);
      if (!clip) { clip = new Audio(paths[key]); clip.preload = 'auto'; this.faroAudio.set(key, clip); }
      clip.currentTime = 0; clip.volume = this.sfxVolume; clip.muted = false;
      void clip.play().catch(() => {});
    } catch { /* Optional SFX must never interrupt a wager or navigation. */ }
  }
  public playCards(): void { this.playFaroClip('cards'); }
  public playShuffle(): void { this.playFaroClip('shuffle'); }
  public playDealerGreeting(): void { this.playFaroClip('dealer'); }
  public playHospitalityGreeting(): void { this.playFaroClip('hospitality'); }
  public stopFaroAudio(): void {
    for (const clip of this.faroAudio.values()) { clip.pause(); clip.currentTime = 0; }
  }

  private currentHeroVoice: HTMLAudioElement | null = null;

  // Interrompe imediatamente qualquer voz de herói tocando
  public stopHeroVoice() {
    if (this.currentHeroVoice) {
      try {
        this.currentHeroVoice.pause();
        this.currentHeroVoice.currentTime = 0;
      } catch {}
      this.currentHeroVoice = null;
    }
  }

  // Voz do herói ao selecioná-lo (public/assets/audio/voices/{characterId}.mp3)
  // Interrompe imediatamente qualquer voz tocando anteriormente
  public playHeroVoice(characterId: string) {
    if (this.isMuted) return;
    try {
      this.stopHeroVoice();

      const id = characterId.toLowerCase();
      let voice = this.heroVoiceAudios.get(id);
      if (!voice) {
        voice = new Audio(`assets/audio/voices/${id}.mp3`);
        this.heroVoiceAudios.set(id, voice);
      }
      voice.currentTime = 0;
      voice.volume = this.sfxVolume;
      this.currentHeroVoice = voice;
      voice.play().catch(() => {});
    } catch {}
  }

  public playIntroMusic() {
    this.playTrack('intro');
  }

  public playGameplayMusic(stage = 1) {
    this.playTrack(stage);
  }

  public startBGM(stage = 1) {
    this.playGameplayMusic(stage);
  }

  public stopBGM() {
    if (this.currentBgm) {
      this.currentBgm.pause();
      this.currentBgm.currentTime = 0;
      this.currentBgm = null;
      this.currentTrack = null;
    }
  }

  private playTrack(track: 'intro' | number) {
    const src = track === 'intro' ? 'assets/audio/departing_into_the_horizon.mp3' : stageMusicSource(track);
    if (this.currentTrack === src && this.currentBgm && !this.currentBgm.paused) return;
    if (this.currentBgm) { this.currentBgm.pause(); this.currentBgm.currentTime = 0; }
    let audio = this.musicCache.get(src);
    if (!audio) {
      audio = new Audio(src); audio.loop = true;
      this.musicCache.set(src, audio);
      if (track !== 'intro' && src !== MUSIC_MANIFEST.fallback) {
        const candidate = audio;
        audio.addEventListener('error', () => {
          if (this.currentBgm === candidate) this.playTrack(0);
        });
      }
    }
    audio.volume = this.isMuted ? 0 : this.musicVolume; audio.muted = this.isMuted;
    this.currentBgm = audio; this.currentTrack = src;
    audio.play()?.catch(() => { /* Playback can resume on the next user gesture. */ });
  }

}

export const sounds = new SoundManager();
