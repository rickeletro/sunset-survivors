import { beforeEach, describe, expect, it, vi } from 'vitest';

const { Node } = vi.hoisted(() => {
  class Node {
    active = true; x = 0; y = 0; width = 100; height = 100; scaleX = 1; scaleY = 1;
    text = ''; list: any[] = []; scene: any; parentContainer?: Node;
    listeners = new Map<string, { fn: (...args: any[]) => void; context?: any; once: boolean }[]>();
    constructor(scene?: any, x = 0, y = 0) { this.scene = scene; this.x = x; this.y = y; }
    on(event: string, fn: (...args: any[]) => void, context?: any) { this.listeners.set(event, [...this.listeners.get(event) ?? [], { fn, context, once: false }]); return this; }
    once(event: string, fn: (...args: any[]) => void) { this.on(event, fn); this.listeners.get(event)!.at(-1)!.once = true; return this; }
    off(event: string, fn: (...args: any[]) => void) { this.listeners.set(event, (this.listeners.get(event) ?? []).filter(item => item.fn !== fn)); return this; }
    emit(event: string) { for (const item of [...this.listeners.get(event) ?? []]) { if (item.once) this.off(event, item.fn); item.fn.call(item.context); } return this; }
    add(node: any) { this.list.push(node); node.parentContainer = this; return this; }
    removeAll(destroy = false) { if (destroy) this.list.forEach(node => node.destroy()); this.list = []; return this; }
    destroy() { this.active = false; this.removeAll(true); this.listeners.clear(); }
    setPosition(x: number, y: number) { this.x = x; this.y = y; return this; }
    setScale(x: number, y = x) { this.scaleX = x; this.scaleY = y; return this; }
    setSize(width: number, height: number) { this.width = width; this.height = height; return this; }
    setText(text: string) { this.text = text; return this; }
    setOrigin() { return this; } setAlpha() { return this; } setBlendMode() { return this; }
    setDepth() { return this; } setStroke() { return this; } setColor() { return this; }
    setTint() { return this; } setInteractive() { return this; }
  }
  return { Node };
});
vi.mock('phaser', () => ({ default: { Scene: class {}, GameObjects: { Container: Node } } }));
vi.mock('../audio/SoundManager', () => ({ sounds: { playRevolver: vi.fn(), playIntroMusic: vi.fn(), stopBGM: vi.fn(), playHit: vi.fn(), playGunReload: vi.fn(), playGameplayMusic: vi.fn(), playLevelUp: vi.fn() } }));
vi.mock('../data/GameStatsManager', () => ({ statsManager: { recordRun: vi.fn(), calculateRank: () => 'A', getStats: () => ({ totalScore: 100, totalKills: 20, playTimeSeconds: 120, stagesCleared: 1, unlockedBosses: [1] }) } }));
import { PauseScene } from './PauseScene';
import { GameOverScene } from './GameOverScene';
import { GameCompleteScene } from './GameCompleteScene';
import { StageClearScene } from './StageClearScene';
import { ControlsScene } from './ControlsScene';
import { UnlockablesScene } from './UnlockablesScene';
import { WesternButton } from '../ui/components/WesternButton';
import { bindPulpMenu } from '../ui/layout/pulpSceneKit';

function setup(Scene: any, data: any = {}) {
  const scene: any = new Scene(), objects: any[] = [];
  const node = (x = 0, y = 0) => { const n = new Node(scene, x, y); objects.push(n); return n; };
  const graphics = () => new Proxy(node(), { get: (target, key: string, receiver) => key in target ? (target as any)[key] : () => receiver });
  Object.assign(scene, {
    add: {
      container: node, graphics,
      existing: (n: any) => objects.push(n),
      image: (x: number, y: number) => Object.assign(node(x, y), { width: 1536, height: 1024 }),
      sprite: (x: number, y: number) => Object.assign(node(x, y), { width: 128, height: 144 }),
      nineslice: (x: number, y: number, _key: string, _frame: any, width: number, height: number) => Object.assign(node(x, y), { width, height }),
      text: (x: number, y: number, text: string, style: any) => Object.assign(node(x, y), { text, width: Math.max(...text.split('\n').map((s: string) => s.length)) * parseFloat(style.fontSize) * 0.55, height: parseFloat(style.fontSize) }),
    },
    cameras: { main: { setBackgroundColor: vi.fn(), flash: vi.fn() } },
    textures: { exists: () => false }, load: { image: vi.fn(), spritesheet: vi.fn() },
    scale: Object.assign(new Node(), { width: 1536, height: 1024 }), events: new Node(), input: { keyboard: new Node() },
    tweens: { add: (config: any) => config.onComplete?.() },
    scene: { start: vi.fn(), stop: vi.fn(), resume: vi.fn(), pause: vi.fn(), launch: vi.fn() },
  });
  scene.init?.(data);
  return { scene, objects, buttons: () => objects.filter(o => o instanceof WesternButton && o.active), labels: () => objects.filter(o => o.active && o.text).map(o => o.text) };
}

beforeEach(() => vi.clearAllMocks());
describe('composed Western Pulp menus without browser gameplay or screenshots', () => {
  it.each([PauseScene, GameOverScene, StageClearScene, GameCompleteScene, ControlsScene, UnlockablesScene].map(Scene => ({ Scene, name: Scene.name })))('$name preloads its own assets and keeps action buttons within the reference canvas', ({ Scene }) => {
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
    expect(h.scene.scene.launch).toHaveBeenCalledWith('ControlsScene', { fromScene: 'PauseScene' });
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
