import type Phaser from 'phaser';
import type { StageConfig } from '../data/stages';

/** Small independent pixel textures, never a flattened stage background. */
export function createStageScenery(scene: Phaser.Scene, stage: StageConfig): string {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const texture = (key: string, width: number, height: number, draw: () => void) => {
    if (scene.textures.exists(key)) return;
    g.clear(); draw(); g.generateTexture(key, width, height);
  };
  const rect = (color: number, x: number, y: number, w: number, h: number) => { g.fillStyle(color).fillRect(x, y, w, h); };
  const OUT = 0x120b08, WOOD = 0x603719, DARK = 0x321b10, GOLD = 0xffc52a;
  texture(`stage_ground_${stage.id}`, 64, 64, () => {
    rect(stage.ground, 0, 0, 64, 64);
    if (['saloon', 'caboose'].includes(stage.theme)) {
      for (let y = 0; y < 64; y += 16) { rect(DARK, 0, y, 64, 2); rect(0x8a572c, 2, y + 3, 60, 1); rect(OUT, y * 3 % 64, y, 2, 16); }
    } else if (stage.theme === 'manor') {
      for (let y = 0; y < 64; y += 16) for (let x = 0; x < 64; x += 16) { rect(0x40363f, x, y, 16, 2); rect(0x726269, x, y, 2, 16); }
    } else {
      for (let i = 0; i < 34; i++) rect(i % 3 ? DARK : 0xf2d49a, (i * 19 + stage.id * 5) % 62, (i * 37) % 62, 2, 1);
    }
  });
  // Arena props are independent preloaded pixel-art cutouts. No prototype rectangles.
  texture('wm_glow', 96, 96, () => {
    for (let r = 47; r >= 3; r -= 3) g.fillStyle(0xffa32a, 0.012).fillCircle(48, 48, r);
  });
  texture('wm_supply', 160, 160, () => {
    g.lineStyle(3, GOLD, 0.7).strokeCircle(80, 80, 77);
    rect(OUT, 57, 56, 46, 44); rect(WOOD, 60, 59, 40, 38); rect(GOLD, 62, 66, 36, 5); rect(GOLD, 76, 60, 7, 36);
  });
  texture('stage_dust', 4, 4, () => rect(0xf2d49a, 1, 1, 2, 2));
  texture('stage_axe', 24, 24, () => {
    rect(OUT, 10, 1, 6, 23); rect(WOOD, 12, 3, 2, 20);
    rect(OUT, 3, 2, 19, 11); rect(0xb8b3ae, 5, 4, 15, 7); rect(0xf2d49a, 5, 4, 3, 7);
  });
  texture('wm_rails', 64, 128, () => {
    for (let x = 0; x < 64; x += 16) rect(DARK, x, 18, 8, 90);
    rect(OUT, 0, 31, 64, 7); rect(0x999194, 0, 32, 64, 3); rect(OUT, 0, 89, 64, 7); rect(0x999194, 0, 90, 64, 3);
  });
  g.destroy();
  if (['railroad', 'caboose'].includes(stage.theme)) {
    for (let y = 160; y < 8000; y += 640) scene.add.tileSprite(0, y, 8000, 128, 'wm_rails').setOrigin(0, 0.5).setDepth(-4);
  }
  return `stage_ground_${stage.id}`;
}
