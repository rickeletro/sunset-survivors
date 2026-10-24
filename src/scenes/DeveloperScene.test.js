import { expect, it, vi } from 'vitest';
import { DeveloperScene } from './DeveloperScene';
import { GameScene } from './GameScene';
import { PauseScene } from './PauseScene';
import { TitleScene } from './TitleScene';
import { CHARACTERS } from '../data/characters';
import { FirstRunTutorial } from '../systems/FirstRunTutorial';
const gate = vi.hoisted(() => ({ enabled: true }));
vi.mock('../dev/access', () => ({ developerEnabled: () => gate.enabled }));
vi.mock('phaser', () => ({ default: { Scene: class {}, GameObjects: { Container: class {} }, Events: { EventEmitter: class {} } } }));
vi.mock('../audio/SoundManager', () => ({ sounds: { playRevolver: vi.fn(), playIntroMusic: vi.fn(), stopBGM: vi.fn() } }));

function fixture(Type) {
  const scene = new Type();
  Object.assign(scene, { scene: { start: vi.fn(), stop: vi.fn() }, cameras: { main: { flash: vi.fn() } } });
  return scene;
}
it('launches the selected stage/hero/difficulty directly, once, and refuses non-local entry', () => {
  gate.enabled = true;
  const panel = fixture(DeveloperScene);
  panel.init({ stage: 2, hero: 'cormano', difficulty: 'easy' }); panel.launchTest(); panel.launchTest();
  expect(panel.scene.start).toHaveBeenCalledExactlyOnceWith('GameScene', { stage: 2, character: CHARACTERS.cormano, difficulty: 'easy', developer: true });
  gate.enabled = false;
  const denied = fixture(DeveloperScene); denied.init({ stage: 8 }); denied.create(); denied.launchTest();
  expect(denied.scene.start).toHaveBeenCalledExactlyOnceWith('TitleScene');
  gate.enabled = true;
});
it('accepts a test flag only locally and clears it for subsequent normal runs', () => {
  const game = fixture(GameScene);
  gate.enabled = true;
  game.init({ stage: 2, developer: true }); expect(game.developerTest).toBe(true);
  game.init({ stage: 2 }); expect(game.developerTest).toBe(false);
  gate.enabled = false;
  game.init({ stage: 8, developer: true }); expect(game.developerTest).toBe(false);
  gate.enabled = true;
});
it.each(['stageClear', 'gameOver'])('returns test %s to the selector without visiting statistics-saving result scenes', method => {
  const game = fixture(GameScene);
  Object.assign(game, { developerTest: true, isGameOver: false, stage: 2, character: CHARACTERS.billy, difficulty: 'hardcore', kills: 10, gameTimeSeconds: 24 });
  game[method](false); game[method](false);
  expect(game.scene.start).toHaveBeenCalledOnce();
  expect(game.scene.start).toHaveBeenCalledWith('DeveloperScene', expect.objectContaining({ stage: 2, hero: 'billy', difficulty: 'hardcore' }));
});
it('restarts a test directly and returns to the developer panel from pause', () => {
  gate.enabled = true;
  const pause = fixture(PauseScene);
  pause.init({ stage: 3, character: CHARACTERS.bob, difficulty: 'easy', developer: true });
  pause.restartStage(); expect(pause.scene.start).toHaveBeenCalledWith('GameScene', { stage: 3, character: CHARACTERS.bob, difficulty: 'easy', developer: true });
  pause.returnToTitle(); expect(pause.scene.start).toHaveBeenLastCalledWith('DeveloperScene', expect.objectContaining({ stage: 3, hero: 'bob' }));
  pause.init({ stage: 3, character: CHARACTERS.bob });
  pause.restartStage(); expect(pause.scene.start).toHaveBeenLastCalledWith('WantedScene', expect.objectContaining({ developer: false }));
});
it('opens the developer selector from the title only while local and outside other title actions', () => {
  const title = fixture(TitleScene); gate.enabled = false; title.openDeveloper(); expect(title.scene.start).not.toHaveBeenCalled();
  gate.enabled = true; title.openDeveloper(); title.openDeveloper(); expect(title.scene.start).toHaveBeenCalledExactlyOnceWith('DeveloperScene');
});
it('starts local tests without tutorial reminders or writing tutorial completion', () => {
  const remember = vi.fn(), tutorial = new FirstRunTutorial(true, 'keyboard', remember);
  tutorial.skip(); expect(tutorial.visible).toBe(false); expect(tutorial.blocking).toBe(false); expect(remember).not.toHaveBeenCalled();
});
