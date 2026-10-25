import { FrontierCompass } from '../ui/hud/FrontierCompass';
import { SaloonVisit } from '../data/saloon';
import { MenuScene } from './MenuScene';
import { AudioScene } from './AudioScene';
import { RankingScene } from './RankingScene';
import { TitleScene } from './TitleScene';
import { rankings } from '../data/RankingManager';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { Node } = vi.hoisted(() => {
  class Node {
    visible = true; fontSize = 0;
    active = true; x = 0; y = 0; width = 100; height = 100; scaleX = 1; scaleY = 1;
    text = ''; list: any[] = []; scene: any; parentContainer?: Node;
    listeners = new Map<string, { fn: (...args: any[]) => void; context?: any; once: boolean }[]>();
    constructor(scene?: any, x = 0, y = 0) { this.scene = scene; this.x = x; this.y = y; }
    on(event: string, fn: (...args: any[]) => void, context?: any) { this.listeners.set(event, [...this.listeners.get(event) ?? [], { fn, context, once: false }]); return this; }
    once(event: string, fn: (...args: any[]) => void) { this.on(event, fn); this.listeners.get(event)!.at(-1)!.once = true; return this; }
    off(event: string, fn: (...args: any[]) => void) { this.listeners.set(event, (this.listeners.get(event) ?? []).filter(item => item.fn !== fn)); return this; }
    emit(event: string, ...args: any[]) { for (const item of [...this.listeners.get(event) ?? []]) { if (item.once) this.off(event, item.fn); item.fn.apply(item.context, args); } return this; }
    add(node: any) { for (const item of Array.isArray(node) ? node : [node]) { this.list.push(item); item.parentContainer = this; } return this; }
    removeAll(destroy = false) { if (destroy) this.list.forEach(node => node.destroy()); this.list = []; return this; }
    destroy() { this.active = false; this.removeAll(true); this.listeners.clear(); }
    setPosition(x: number, y: number) { this.x = x; this.y = y; return this; }
    setScale(x: number, y = x) { this.scaleX = x; this.scaleY = y; return this; }
    setSize(width: number, height: number) { this.width = width; this.height = height; return this; }
    setText(text: string) { this.text = text; return this; }
    setResolution() { return this; } setScrollFactor() { return this; } setFontFamily() { return this; }
    setFontSize(size: number) { this.fontSize = size; return this; }
    setX(x: number) { this.x = x; return this; }
    setDisplaySize(width: number, height: number) { this.width = width; this.height = height; return this; }
    setTexture(key: string) { (this as any).key = key; return this; }
    play(key: string) { (this as any).animation = key; return this; }
    bringToTop(node: Node) { this.list = this.list.filter(n => n !== node); this.list.push(node); return this; }
    setY(y: number) { this.y = y; return this; }
    setVisible(visible: boolean) { this.visible = visible; return this; }
    setOrigin() { return this; } setAlpha(alpha: number) { (this as any).alpha = alpha; return this; } setBlendMode() { return this; }
    setDepth() { return this; } setStroke() { return this; } setColor() { return this; }
    setTint() { return this; } setInteractive() { return this; }
  }
  return { Node };
});
vi.mock('phaser', () => ({ default: { Scene: class {}, BlendModes: { ADD: 1 }, GameObjects: { Container: Node } } }));
vi.mock('../audio/SoundManager', () => ({ sounds: { getMusicVolume: vi.fn(() => .7), getSfxVolume: vi.fn(() => .4), setMusicVolume: vi.fn(), setSfxVolume: vi.fn(), getIsMuted: vi.fn(() => false), toggleMute: vi.fn(), playHospitalityGreeting: vi.fn(), playDealerGreeting: vi.fn(), stopFaroAudio: vi.fn(), playRevolver: vi.fn(), playIntroMusic: vi.fn(), stopBGM: vi.fn(), playHit: vi.fn(), playGunReload: vi.fn(), playGameplayMusic: vi.fn(), playLevelUp: vi.fn(), playHeroVoice: vi.fn(), playRicochet: vi.fn() } }));
vi.mock('../data/GameStatsManager', () => ({ statsManager: { recordRun: vi.fn(), calculateRank: () => 'A', getStats: () => ({ totalScore: 100, totalKills: 20, goldCollected: 500, deaths: 2, bestStreak: 3, playTimeSeconds: 120, stagesCleared: 1, unlockedBosses: [1] }) } }));
import { sounds } from '../audio/SoundManager';
import { difficultySettings } from '../data/difficulty';
import { CharacterSelectScene } from './CharacterSelectScene';
import { CombatHUD } from '../ui/hud/CombatHUD';
import { CHARACTERS } from '../data/characters';
import { StoryScene } from './StoryScene';
import { LevelUpScene } from './LevelUpScene';
import { StatsScene } from './StatsScene';
import { DifficultyScene } from './DifficultyScene';
import { PauseScene } from './PauseScene';
import { SaloonScene } from './SaloonScene';
import { GameOverScene } from './GameOverScene';
import { GameCompleteScene } from './GameCompleteScene';
import { StageClearScene } from './StageClearScene';
import { ControlsScene } from './ControlsScene';
import { UnlockablesScene } from './UnlockablesScene';
import { WesternButton } from '../ui/components/WesternButton';
import { FirstRunTutorial } from '../systems/FirstRunTutorial';
import { FirstRunTutorialView } from '../ui/hud/FirstRunTutorialView';
import { bindPulpMenu } from '../ui/layout/pulpSceneKit';

function setup(Scene: any, data: any = {}) {
  const scene: any = new Scene(), objects: any[] = [];
  const node = (x = 0, y = 0) => { const n = new Node(scene, x, y); objects.push(n); return n; };
  const graphics = () => new Proxy(node(), { get: (target, key: string, receiver) => key in target ? (target as any)[key] : () => receiver });
  Object.assign(scene, {
    add: {
      container: node, graphics, zone: (x: number, y: number, width: number, height: number) => Object.assign(node(x, y), { width, height }),
      existing: (n: any) => objects.push(n),
      image: (x: number, y: number, key: string) => Object.assign(node(x, y), { key, width: key.startsWith('poster_') ? 330 : 1536, height: key.startsWith('poster_') ? 512 : 1024 }),
      sprite: (x: number, y: number) => Object.assign(node(x, y), { width: 128, height: 144 }),
      nineslice: (x: number, y: number, key: string, _frame: any, width: number, height: number) => Object.assign(node(x, y), { key, width, height }),
      text: (x: number, y: number, text: string, style: any) => Object.assign(node(x, y), { text, style, width: Math.max(...text.split('\n').map((s: string) => s.length)) * parseFloat(style.fontSize) * 0.55, height: parseFloat(style.fontSize) }),
    },
    cameras: { main: { setBackgroundColor: vi.fn(), flash: vi.fn(), fade: vi.fn(), fadeIn: vi.fn(), setRoundPixels: vi.fn() } },
    textures: { exists: () => false }, load: { image: vi.fn(), spritesheet: vi.fn() },
    scale: Object.assign(new Node(), { width: 1536, height: 1024 }), events: new Node(), input: { keyboard: new Node() },
    time: { addEvent: () => ({ remove: vi.fn() }), delayedCall: (_delay: number, callback: () => void) => callback() },
    anims: { exists: () => false },
    tweens: { killTweensOf: vi.fn(), add: (config: any) => config.onComplete?.() },
    scene: { start: vi.fn(), stop: vi.fn(), resume: vi.fn(), pause: vi.fn(), launch: vi.fn() },
  });
  scene.init?.(data);
  return { scene, objects, buttons: () => objects.filter(o => o instanceof WesternButton && o.active), labels: () => objects.filter(o => o.active && o.text).map(o => o.text) };
}

beforeEach(() => { vi.clearAllMocks(); difficultySettings.set('normal'); });
describe('composed Western Pulp menus without browser gameplay or screenshots', () => {
  it.each([MenuScene, AudioScene, RankingScene, PauseScene, DifficultyScene, SaloonScene, GameOverScene, StageClearScene, GameCompleteScene, ControlsScene, UnlockablesScene, StatsScene, StoryScene].map(Scene => ({ Scene, name: Scene.name })))('$name preloads its own assets and keeps action buttons within the reference canvas', ({ Scene }) => {
    const h = setup(Scene); h.scene.preload(); h.scene.create();
    expect(h.scene.load.image.mock.calls.some((call: string[]) => call[0] === 'saloon_bkg')).toBe(true);
    expect(h.buttons().length).toBeGreaterThan(0);
    for (const button of h.buttons()) {
      expect(Math.abs(button.x) + button.width / 2).toBeLessThanOrEqual(768);
      expect(Math.abs(button.y) + button.height / 2).toBeLessThanOrEqual(512);
      expect(button.height).toBeGreaterThanOrEqual(52);
    }
    h.scene.events.emit('shutdown');
    for (const handlers of h.scene.input.keyboard.listeners.values()) expect(handlers).toHaveLength(0);
    expect(h.scene.scale.listeners.get('resize')).toHaveLength(0);
  });
  it('supports selecting pause actions with arrows and resumes the paused game', () => {
    const h = setup(PauseScene); h.scene.create();
    h.scene.input.keyboard.emit('keydown-DOWN'); h.scene.input.keyboard.emit('keydown-ENTER');
    expect(h.scene.scene.launch).toHaveBeenCalledWith('MenuScene', { fromScene: 'PauseScene' });
    h.scene.input.keyboard.emit('keydown-UP'); h.scene.input.keyboard.emit('keydown-ENTER');
    expect(h.scene.scene.resume).toHaveBeenCalledWith('GameScene');
  });
  it('preserves final-stage and statistics navigation', () => {
    const h = setup(StageClearScene, { stage: 8, kills: 321, bounty: 4567, timeSurvivedSeconds: 900 }); h.scene.create();
    expect(h.labels()).toContain('61,720');
    h.scene.input.keyboard.emit('keydown-RIGHT'); h.scene.input.keyboard.emit('keydown-ENTER');
    expect(h.scene.scene.start).toHaveBeenCalledWith('StatsScene', expect.objectContaining({ fromScene: 'StageClearScene' }));
    h.scene.input.keyboard.emit('keydown-LEFT'); h.scene.input.keyboard.emit('keydown-ENTER');
    expect(h.scene.scene.start).toHaveBeenCalledWith('GameCompleteScene', expect.objectContaining({ stage: 8, kills: 321, bounty: 4567 }));
  });
  it('retains retry character and stage and shows actual run values', () => {
    const h = setup(GameOverScene, { stage: 3, kills: 150, bounty: 210, timeSurvivedSeconds: 65 }); h.scene.create();
    expect(h.labels()).toContain('01:05');
    h.scene.input.keyboard.emit('keydown-R');
    expect(h.scene.scene.start).toHaveBeenCalledWith('WantedScene', expect.objectContaining({ stage: 3 }));
  });
  it('returns from controls to pause and resets the source on the next scene visit', () => {
    const h = setup(ControlsScene, { fromScene: 'PauseScene' }); h.scene.create();
    expect(h.labels()).toContain('AUTOMATIC'); expect(h.labels()).toContain('COLLECT XP');
    h.scene.input.keyboard.emit('keydown-ESC');
    expect(h.scene.scene.resume).toHaveBeenCalledWith('PauseScene');
    h.scene.init(); h.scene.scene.start.mockClear(); h.scene.goBack();
    expect(h.scene.scene.start).toHaveBeenCalledWith('TitleScene');
  });
  it('replaces gallery tabs instead of accumulating interactive objects', () => {
    const h = setup(UnlockablesScene); h.scene.create();
    for (let i = 0; i < 30; i++) h.scene.input.keyboard.emit('keydown-RIGHT');
    expect(h.buttons()).toHaveLength(4);
    expect(h.scene.currentTab).toBe('characters');
    expect(h.labels().filter(text => text === '?')).toHaveLength(2);
  });
  it('does not bind empty menus or keep keyboard listeners after repeated visits', () => {
    const h = setup(PauseScene);
    bindPulpMenu(h.scene, []);
    expect(h.scene.input.keyboard.listeners.size).toBe(0);
    for (let i = 0; i < 10; i++) { h.scene.create(); h.scene.events.emit('shutdown'); }
    for (const handlers of h.scene.input.keyboard.listeners.values()) expect(handlers).toHaveLength(0);
  });
});


describe('live in-world tutorial presentation', () => {
  it.each([[320, 720], [390, 844], [1280, 720], [640, 360]])('keeps the card within a %i × %i viewport, readable and skippable', (width, height) => {
    const h = setup(PauseScene);
    h.scene.scale.width = width; h.scene.scale.height = height;
    const model = new FirstRunTutorial(false, width < 600 ? 'touch' : 'keyboard', vi.fn());
    const skip = vi.fn();
    const view: any = new FirstRunTutorialView(h.scene, model, skip);
    view.update(4000, 4000, 0);
    if (height >= 480) expect(view.root.x).toBe(width / 2);
    else {
      expect(view.root.y - 36).toBeGreaterThan(height / 2 + 30);
      expect(view.root.x + view.root.scaleX * 380).toBeLessThan(view.skipButton.x - 82);
    }
    expect(view.root.scaleX * 760).toBeLessThanOrEqual(width - 24);
    expect(view.body.fontSize * view.root.scaleX).toBeGreaterThanOrEqual(14);
    expect(view.skipButton.width).toBeGreaterThanOrEqual(44);
    expect(view.skipButton.height).toBeGreaterThanOrEqual(44);
    expect(view.skipButton.visible).toBe(true);
    expect(view.skipLabel.text).toBe(width < 600 ? 'SKIP' : 'SKIP [T]');
    h.scene.input.keyboard.emit('keydown-T'); expect(skip).toHaveBeenCalledTimes(1);
    model.skip(); view.update(4000, 4000, 0); expect(view.skipButton.visible).toBe(false);
    model.tick(3000); view.update(4000, 4000, 0); expect(view.root.visible).toBe(false);
    h.scene.events.emit('shutdown');
    expect(view.root.active).toBe(false);
    expect(h.scene.input.keyboard.listeners.get('keydown-T')).toHaveLength(0);
    expect(h.scene.scale.listeners.get('resize')).toHaveLength(0);
  });
});

describe('optional saloon interior controls', () => {
  it('accepts once with keyboard, supports declining with Escape, and never changes music', () => {
    const leave = vi.fn();
    const h = setup(SaloonScene, { onLeave: leave }); h.scene.create();
    h.scene.input.keyboard.emit('keydown-ENTER');
    h.scene.input.keyboard.emit('keydown-ENTER'); h.scene.input.keyboard.emit('keydown-ESC');
    expect(leave).toHaveBeenCalledExactlyOnceWith(true);
    expect(sounds.playIntroMusic).not.toHaveBeenCalled();
    expect(sounds.playGameplayMusic).not.toHaveBeenCalled();
    expect(sounds.stopBGM).not.toHaveBeenCalled();
    const exit = vi.fn(); h.scene.init({ onLeave: exit });
    h.scene.input.keyboard.emit('keydown-ESC'); expect(exit).toHaveBeenCalledExactlyOnceWith(false);
    h.scene.events.emit('shutdown');
    for (const handlers of h.scene.input.keyboard.listeners.values()) expect(handlers).toHaveLength(0);
  });
});

describe('difficulty choice and campaign continuity', () => {
  it('starts focus on Normal, persists the chosen mode and keeps Escape non-destructive', () => {
    const h = setup(DifficultyScene); h.scene.create();
    h.scene.input.keyboard.emit('keydown-RIGHT'); h.scene.input.keyboard.emit('keydown-ENTER');
    expect(difficultySettings.get()).toBe('hardcore'); expect(h.scene.scene.start).toHaveBeenCalledWith('TitleScene');
    const e = setup(DifficultyScene); e.scene.create(); e.scene.input.keyboard.emit('keydown-ESC');
    expect(difficultySettings.get()).toBe('hardcore');
  });
  it('keeps the active run mode through next stage, pause restart and death retry despite changed menu preference', () => {
    const clear = setup(StageClearScene, { stage: 1, difficulty: 'hardcore', level: 36 }); clear.scene.create();
    difficultySettings.set('easy'); clear.scene.input.keyboard.emit('keydown-ENTER');
    const next = clear.scene.scene.start.mock.calls.at(-1);
    expect(next[0]).toBe('WantedScene'); expect(next[1]).toMatchObject({ stage: 2, difficulty: 'hardcore' });
    expect(Object.keys(next[1]).sort()).toEqual(['character', 'difficulty', 'stage']);
    const pause = setup(PauseScene, { stage: 2, difficulty: 'hardcore' }); pause.scene.restartStage();
    expect(pause.scene.scene.start).toHaveBeenCalledWith('WantedScene', expect.objectContaining({ difficulty: 'hardcore', stage: 2 }));
    const dead = setup(GameOverScene, { stage: 2, difficulty: 'hardcore' }); dead.scene.retry();
    expect(dead.scene.scene.start).toHaveBeenCalledWith('WantedScene', expect.objectContaining({ difficulty: 'hardcore', stage: 2 }));
  });
});


describe('character selection readability and consistent HUD portraits', () => {
  it('uses selection-only firing poses without Billy or Bob back-facing frames', () => {
    const h = setup(CharacterSelectScene), animations = new Map();
    h.scene.textures.exists = () => true;
    h.scene.anims = { exists: (key: string) => animations.has(key), create: (config: any) => animations.set(config.key, config) };
    h.scene.create();
    for (const [i, hero] of Object.keys(CHARACTERS).entries()) {
      h.scene.selectIndex(i, false);
      expect(h.scene.heroPreviewSprite.animation).toBe(`select_preview_${hero}`);
      const frames = animations.get(`select_preview_${hero}`).frames.map((frame: any) => frame.frame);
      const backFrames = hero === 'billy' ? [1, 4, 6, 8] : hero === 'bob' ? [0, 1] : [];
      expect(frames.some((frame: number) => backFrames.includes(frame))).toBe(false);
      expect(frames.length).toBeGreaterThan(1);
    }
  });
  it('keeps details as live text on clean parchment for all four heroes and releases keyboard bindings', () => {
    const h = setup(CharacterSelectScene); h.scene.create();
    for (const [i, character] of Object.values(CHARACTERS).entries()) {
      h.scene.selectIndex(i, false);
      expect(h.scene.infoNameTitle.text).toBe(character.name);
      expect(h.scene.infoSubtitle.text).toBe(`— ${character.title}`);
      expect(h.scene.infoWeaponVal.text).toBe(character.subtitle);
      expect(h.scene.infoTraitVal.text).toBe(character.specialBonus);
      expect(h.scene.infoQuote.text).toBe(character.quote);
      expect(h.scene.infoTraitVal.style.wordWrap.width).toBeLessThanOrEqual(550);
      for (const text of [h.scene.infoWeaponVal, h.scene.infoTraitVal, h.scene.infoQuote]) {
        expect(parseFloat(text.style.fontSize)).toBeGreaterThanOrEqual(21);
        expect(text.style.strokeThickness ?? 0).toBe(0);
      }
      expect(h.scene.infoSubtitle.x).toBeGreaterThan(h.scene.infoNameTitle.x + h.scene.infoNameTitle.width);
      expect(h.scene.infoTraitVal.x + 550).toBeLessThan(h.scene.heroPreviewSprite.x - 100);
    }
    expect(h.objects.some(o => o.key === 'bottom_panel_clean')).toBe(false);
    h.scene.events.emit('shutdown');
    for (const handlers of h.scene.input.keyboard.listeners.values()) expect(handlers).toHaveLength(0);
  });
  it.each(Object.keys(CHARACTERS))('%s uses the same undistorted portrait size and location', characterId => {
    const h = setup(PauseScene); h.scene.textures.exists = () => true;
    const hud = new CombatHUD(h.scene, { characterId, hp: 100, maxHp: 150, currentXp: 20, xpToNextLevel: 50, level: 3, bounty: 100, kills: 50 }, 'Simon');
    const avatar = h.objects.find(o => o.key === `hud_avatar_${characterId}`)!;
    expect([avatar.parentContainer.x, avatar.parentContainer.y, avatar.width, avatar.height]).toEqual([68, 70, 84, 84]);
    hud.setHealth(47, 150);
    expect(h.labels()).toContain('47 / 150');
    expect(parseFloat((hud.stageStatus as any).style.fontSize)).toBeGreaterThanOrEqual(12);
  });
});


describe('production UI composition regressions', () => {
  it('does not recreate stacked interactive tabs in career statistics', () => {
    const h = setup(StatsScene); h.scene.create();
    for (let i = 0; i < 30; i++) { h.scene.currentTab = i % 2 ? 'weapons' : 'overview'; h.scene.createTabs(); h.scene.renderCurrentTab(); }
    expect(h.buttons()).toHaveLength(5);
    h.scene.events.emit('shutdown');
    for (const handlers of h.scene.input.keyboard.listeners.values()) expect(handlers).toHaveLength(0);
    h.scene.init({ fromScene: 'StageClearScene', prevData: { stage: 3 } });
    h.scene.init(); expect(h.scene.fromScene).toBe('TitleScene'); expect(h.scene.prevData).toBeUndefined();
  });
  it('builds selection from a clean landscape and separate material panels', () => {
    const h = setup(CharacterSelectScene); h.scene.create();
    expect(h.objects.some(o => o.key === 'intro_bkg')).toBe(true);
    expect(h.objects.filter(o => o.key === 'ui_pulp_paper').length).toBe(2);
    expect(h.objects.some(o => o.key === 'select_saloon_backdrop' || o.key === 'bottom_panel_clean')).toBe(false);
    expect(h.labels()).toContain('SELECT YOUR PLAYER');
  });
});


describe('story and upgrade UI lifecycle', () => {
  it('completes text before advancing, prevents duplicate skips and releases story controls', () => {
    const h = setup(StoryScene); h.scene.create();
    h.scene.input.keyboard.emit('keydown-ENTER');
    expect(h.scene.bodyText.text).toBe(h.scene.fullText); expect(h.scene.currentSlide).toBe(0);
    h.scene.input.keyboard.emit('keydown-ENTER'); expect(h.scene.currentSlide).toBe(1);
    h.scene.input.keyboard.emit('keydown-ESC'); h.scene.input.keyboard.emit('keydown-ESC');
    expect(h.scene.scene.start).toHaveBeenCalledExactlyOnceWith('CharacterSelectScene');
    h.scene.events.emit('shutdown');
    expect(h.scene.input.keyboard.listeners.get('keydown-ENTER')).toHaveLength(0);
  });
  it('does not accumulate upgrade keyboard handlers after reopening the modal', () => {
    const h = setup(LevelUpScene, { choices: [], onSelect: vi.fn() });
    for (let i = 0; i < 20; i++) { h.scene.setupControls(); expect(h.scene.input.keyboard.listeners.get('keydown')).toHaveLength(1); h.scene.events.emit('shutdown'); }
    expect(h.scene.input.keyboard.listeners.get('keydown')).toHaveLength(0);
  });
});


it.each([false, true])('always renders level and description, whether poster art is loaded: %s', loaded => {
  const choice = { type: 'evolution', id: 'desperado_fury', name: 'Desperado Fury', icon: 'revolver', currentLevel: 0, nextLevel: 1, description: 'Six piercing shots explode at the end of their flight.' };
  const h = setup(LevelUpScene, { choices: [choice], onSelect: vi.fn() });
  h.scene.rootContainer = h.scene.add.container(0, 0);
  h.scene.textures.exists = () => loaded;
  h.scene.createPowerupCards();
  expect(h.labels()).toContain(choice.description); expect(h.labels()).toContain('★ LV. 1 ★');
  if (!loaded) expect(h.labels()).toContain(choice.name);
  else {
    const poster = h.objects.find(o => o.key === 'card_desperado_fury');
    expect(poster.scaleX).toBe(poster.scaleY);
  }
});

it('preloads all eight boss posters for the pop-up shooting booth', () => {
  const h = setup(SaloonScene, { gallery: true, onGalleryLeave: vi.fn(), onLeave: vi.fn() }); h.scene.preload();
  const keys = new Set(h.scene.load.image.mock.calls.map((c: any[]) => c[0]));
  for (let boss = 1; boss <= 8; boss++) expect(keys.has(`boss_poster_${boss}`)).toBe(true);
});


describe('unified menu and local hall of fame', () => {
  it('shows only one auxiliary MENU button on the title and opens a paused overlay', () => {
    const h = setup(TitleScene); h.scene.rootContainer = h.scene.add.container(0,0);
    h.scene.createAuxiliaryMenu();
    expect(h.buttons()).toHaveLength(1); expect(h.labels()).toContain('MENU');
    h.buttons()[0].activate();
    expect(h.scene.scene.pause).toHaveBeenCalledWith('TitleScene');
    expect(h.scene.scene.launch).toHaveBeenCalledWith('MenuScene', { fromScene: 'TitleScene' });
  });
  it('keeps the pause menu and game suspended when opening audio, then returns to its owner', () => {
    const h = setup(MenuScene, { fromScene: 'PauseScene' }); h.scene.create();
    h.scene.input.keyboard.emit('keydown-ENTER');
    expect(h.scene.scene.pause).toHaveBeenCalledWith('MenuScene');
    expect(h.scene.scene.launch).toHaveBeenCalledWith('AudioScene', { fromScene: 'MenuScene', duringRun: true });
    const audio = setup(AudioScene, { fromScene: 'MenuScene' }); audio.scene.create(); audio.scene.input.keyboard.emit('keydown-ESC');
    expect(audio.scene.scene.resume).toHaveBeenCalledWith('MenuScene');
    expect(audio.scene.scene.resume).not.toHaveBeenCalledWith('GameScene');
    h.scene.input.keyboard.emit('keydown-ESC'); expect(h.scene.scene.resume).toHaveBeenCalledWith('PauseScene');
  });
  it('applies an explicitly selected difficulty to the paused run and its restart configuration', () => {
    const h = setup(DifficultyScene, { fromScene: 'MenuScene', duringRun: true });
    const game = { setRunDifficulty: vi.fn() }, pause = setup(PauseScene, { difficulty: 'hardcore' }).scene;
    h.scene.scene.get = (key: string) => key === 'GameScene' ? game : pause;
    h.scene.choose('easy');
    expect(game.setRunDifficulty).toHaveBeenCalledWith('easy'); expect(pause.difficulty).toBe('easy');
    expect(h.scene.scene.resume).toHaveBeenCalledWith('MenuScene');
  });
  it('saves the actual death result once, including zeros, and returns from ranking directly to the title', () => {
    const h = setup(GameOverScene, { runId: 'ranking-test-death', kills: 0, bounty: 0, timeSurvivedSeconds: 0, stage: 4 }); h.scene.create();
    h.scene.nameField = { value: () => '  THE KID  ' };
    h.scene.openRanking(); h.scene.openRanking();
    const entries = rankings.list().filter(e => e.runId === 'ranking-test-death');
    expect(entries).toHaveLength(1); expect(entries[0]).toMatchObject({ name: 'THE KID', score: 0, seconds: 0, stage: 4 });
    expect(h.scene.scene.start).toHaveBeenCalledExactlyOnceWith('RankingScene', { fromScene: 'TitleScene' });
    expect(h.scene.scene.pause).not.toHaveBeenCalled();
    const r = setup(RankingScene, { fromScene: 'GameOverScene' }); r.scene.create(); r.scene.input.keyboard.emit('keydown-ESC');
    expect(r.scene.scene.start).toHaveBeenCalledWith('TitleScene'); expect(r.scene.scene.resume).not.toHaveBeenCalledWith('GameOverScene');
  });
  it.each([ControlsScene,StatsScene,UnlockablesScene])('returns nested $name pages to the same menu', Scene => {
    const h = setup(Scene, { fromScene: 'MenuScene' }); h.scene.create(); h.scene.goBack();
    expect(h.scene.scene.resume).toHaveBeenCalledWith('MenuScene'); expect(h.scene.scene.start).not.toHaveBeenCalled();
  });
  it('shows large uniformly scaled approved posters without individual wooden boxes', () => {
    for (const Scene of [ControlsScene, StatsScene, UnlockablesScene]) {
      const h = setup(Scene); h.scene.textures.exists = () => true; h.scene.create();
      const posters = h.objects.filter(o => o.key === 'poster_billy'); expect(posters.length).toBeGreaterThan(0);
      for (const art of posters) { expect(art.scaleX).toBe(art.scaleY); expect(art.height*art.scaleY).toBeGreaterThanOrEqual(242); }
      if (Scene === UnlockablesScene) for (const poster of posters) expect(poster.parentContainer.list.some((o: any) => o.key === 'ui_pulp_wood' || o.key === 'ui_pulp_paper')).toBe(false);
    }
  });
});

it('changes audio through the shared sound manager and keeps ranking pagination bounded', () => {
  const a = setup(AudioScene); a.scene.create();
  a.buttons()[0].activate(); expect(sounds.setMusicVolume).toHaveBeenCalledWith(expect.closeTo(.6));
  a.buttons()[3].activate(); expect(sounds.setSfxVolume).toHaveBeenCalledWith(.5);
  a.buttons()[4].activate(); expect(sounds.toggleMute).toHaveBeenCalledOnce();
  const r = setup(RankingScene); r.scene.create();
  r.scene.turn(-100); expect(r.scene.page).toBe(0); r.scene.turn(100); expect(r.scene.page).toBeLessThanOrEqual(14);
});

it('reuses compass graphics, hides during interiors and releases resize listeners', () => {
  const h=setup(PauseScene); const compass=new FrontierCompass(h.scene), count=h.objects.length;
  const visit=new SaloonVisit([{x:100,y:200,activity:'gallery'}],undefined,true);
  const clear=vi.fn(() => (compass as any).dots); (compass as any).dots.clear=clear;
  for (let t=0;t<1000;t+=16) compass.update(visit,t,0,t);
  expect(clear.mock.calls.length).toBeLessThanOrEqual(10); expect(clear.mock.calls.length).toBeGreaterThan(0);
  expect(h.objects).toHaveLength(count); expect(compass.root.visible).toBe(true);
  compass.update(visit,0,0,1000,true); expect(compass.root.visible).toBe(false);
  compass.update(visit,0,0,1001); expect(compass.root.visible).toBe(true);
  h.scene.scale.width=640; h.scene.scale.height=360; h.scene.scale.emit('resize');
  expect(compass.root.x+112*compass.root.scaleX).toBeLessThanOrEqual(628);
  h.scene.events.emit('shutdown'); expect(compass.root.active).toBe(false); expect(h.scene.scale.listeners.get('resize')).toHaveLength(0);
});

it('keeps only cardinal labels and a translucent circular compass face', () => {
  const h=setup(PauseScene); const compass=new FrontierCompass(h.scene);
  expect(h.labels()).toEqual(['N','E','S','W']);
  expect((compass.root.list[0] as any).alpha).toBe(.65);
});

it('welcomes hospitality guests with its own voice and omits both redundant captions', () => {
  const h=setup(SaloonScene,{hospitality:true,onLeave:vi.fn()}); h.scene.create();
  expect(h.labels()).not.toContain('GOOD COMPANY TO HELP YOU CATCH YOUR BREATH');
  expect(h.labels()).not.toContain('ONE VISIT PER DOOR • OPTIONAL • COMBAT PAUSED');
  expect(h.labels()).toContain('WELCOME: +20 XP • RESTORE 12% HEALTH');
  expect(sounds.playHospitalityGreeting).toHaveBeenCalledOnce(); expect(sounds.playDealerGreeting).not.toHaveBeenCalled();
  h.scene.events.emit('shutdown'); expect(sounds.stopFaroAudio).toHaveBeenCalledOnce();
});

it('returns the ranking to its menu owner and ignores late server responses after shutdown', async () => {
  const h=setup(RankingScene,{fromScene:'MenuScene'});
  let resolve!: (value: boolean) => void;
  const sync=vi.spyOn(rankings,'sync').mockImplementationOnce(()=>new Promise<boolean>(r=>{resolve=r;}));
  h.scene.create(); h.scene.events.emit('shutdown'); resolve(true); await Promise.resolve(); await Promise.resolve();
  expect(h.scene.status.text).toBe('CONNECTING TO THE FRONTIER…');
  h.scene.back(); expect(h.scene.scene.resume).toHaveBeenCalledWith('MenuScene');
  sync.mockRestore();
});
