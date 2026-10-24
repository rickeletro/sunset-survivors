import { DeveloperScene } from './scenes/DeveloperScene';
import { developerEnabled } from './dev/access';
import Phaser from 'phaser';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { ControlsScene } from './scenes/ControlsScene';
import { GameCompleteScene } from './scenes/GameCompleteScene';
import { GameOverScene } from './scenes/GameOverScene';
import { GameScene } from './scenes/GameScene';
import { LevelUpScene } from './scenes/LevelUpScene';
import { PauseScene } from './scenes/PauseScene';
import { SaloonScene } from './scenes/SaloonScene';
import { BuildingTransitionScene } from './scenes/BuildingTransitionScene';
import { StageClearScene } from './scenes/StageClearScene';
import { StageIntroScene } from './scenes/StageIntroScene';
import { StatsScene } from './scenes/StatsScene';
import { StoryScene } from './scenes/StoryScene';
import { DifficultyScene } from './scenes/DifficultyScene';
import { TitleScene } from './scenes/TitleScene';
import { UnlockablesScene } from './scenes/UnlockablesScene';
import { WantedScene } from './scenes/WantedScene';

const allScenes: (typeof Phaser.Scene)[] = [
  TitleScene,
  ...(developerEnabled() ? [DeveloperScene] : []),
  DifficultyScene,
  StoryScene,
  CharacterSelectScene,
  StageIntroScene,
  WantedScene,
  GameScene,
  LevelUpScene,
  PauseScene,
  SaloonScene,
  BuildingTransitionScene,
  StageClearScene,
  GameOverScene,
  GameCompleteScene,
  StatsScene,
  UnlockablesScene,
  ControlsScene,
];

// URL parameter quick switcher for standalone scene validation & playtesting
const urlParams = new URLSearchParams(window.location.search);
const sceneParam = urlParams.get('scene');

const sceneMap: Record<string, typeof Phaser.Scene> = {
  difficulty: DifficultyScene,
  stageintro: StageIntroScene,
  wanted: WantedScene,
  select: CharacterSelectScene,
  game: GameScene,
  pause: PauseScene,
  clear: StageClearScene,
  gameover: GameOverScene,
  complete: GameCompleteScene,
  stats: StatsScene,
  unlocks: UnlockablesScene,
  controls: ControlsScene,
};

if (developerEnabled()) sceneMap.developer = DeveloperScene;

if (sceneParam && sceneMap[sceneParam]) {
  const target = sceneMap[sceneParam];
  allScenes.splice(allScenes.indexOf(target), 1);
  allScenes.unshift(target);
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1920,
  height: 1080,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#0a0503',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: allScenes,
};

window.addEventListener('DOMContentLoaded', async () => {
  // Canvas labels must be created after local fonts load.
  await Promise.allSettled([document.fonts.load('24px Rye'), document.fonts.load('16px "Press Start 2P"'), document.fonts.load('700 24px "Roboto Slab"')]);
  new Phaser.Game(config);
});
