import Phaser from 'phaser';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { GameOverScene } from './scenes/GameOverScene';
import { GameScene } from './scenes/GameScene';
import { LevelUpScene } from './scenes/LevelUpScene';
import { StoryScene } from './scenes/StoryScene';
import { TitleScene } from './scenes/TitleScene';
import { WantedScene } from './scenes/WantedScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 960,
  height: 600,
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
  scene: [
    TitleScene,
    StoryScene,
    CharacterSelectScene,
    WantedScene,
    GameScene,
    LevelUpScene,
    GameOverScene,
  ],
};

window.addEventListener('DOMContentLoaded', () => {
  new Phaser.Game(config);
});
