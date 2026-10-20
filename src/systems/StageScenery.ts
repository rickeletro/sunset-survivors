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
  texture('wm_crate', 44, 42, () => {
    rect(OUT, 1, 6, 42, 35); rect(WOOD, 3, 8, 38, 31);
    for (let x = 6; x < 40; x += 9) rect(DARK, x, 9, 2, 28);
    rect(0xa36b31, 4, 9, 36, 4); rect(0xa36b31, 4, 32, 36, 4);
    for (let i = 0; i < 5; i++) rect(GOLD, 5 + i * 7, 12 + i * 4, 3, 3);
  });
  texture('wm_barrel', 36, 44, () => {
    rect(OUT, 4, 2, 28, 40); rect(WOOD, 6, 4, 24, 36); rect(0xa36b31, 10, 4, 5, 35);
    rect(0x88817a, 4, 10, 28, 5); rect(0x88817a, 4, 29, 28, 5); rect(OUT, 7, 3, 22, 3);
  });
  texture('wm_wagon', 100, 72, () => {
    for (const x of [6, 72]) { rect(OUT, x, 45, 22, 25); rect(WOOD, x + 3, 48, 16, 19); rect(GOLD, x + 9, 48, 3, 19); }
    rect(OUT, 4, 13, 91, 44); rect(WOOD, 7, 16, 85, 37); rect(0xf2d49a, 10, 3, 76, 23); rect(0xceb074, 10, 21, 76, 8);
    for (let x = 14; x < 86; x += 18) rect(DARK, x, 33, 3, 17);
  });
  texture('wm_ruin', 76, 70, () => {
    rect(OUT, 3, 11, 70, 54); rect(0x46261b, 6, 14, 64, 48);
    for (let x = 8; x < 70; x += 14) rect(DARK, x, 16, 4, 45);
    rect(OUT, 28, 30, 22, 35); rect(0xff791c, 7, 10, 8, 12); rect(0xe52b20, 50, 4, 9, 16);
  });
  texture('wm_table', 66, 52, () => {
    rect(OUT, 8, 15, 51, 35); rect(DARK, 12, 25, 7, 26); rect(DARK, 48, 25, 7, 26); rect(WOOD, 3, 10, 60, 24); rect(0xa36b31, 5, 12, 56, 3);
    rect(0xf2d49a, 19, 14, 8, 10); rect(GOLD, 36, 19, 7, 4);
  });
  texture('wm_pine', 50, 78, () => {
    rect(DARK, 22, 36, 9, 40);
    for (let i = 0; i < 4; i++) { const w = 14 + i * 10; rect(OUT, 25 - w / 2, 4 + i * 14, w, 19); rect(0x344c38, 27 - w / 2, 6 + i * 14, w - 4, 14); }
  });
  texture('wm_tent', 76, 56, () => {
    g.fillStyle(OUT).fillTriangle(0, 54, 37, 0, 76, 54);
    g.fillStyle(0xc29b5e).fillTriangle(4, 51, 37, 5, 72, 51);
    g.fillStyle(DARK).fillTriangle(27, 51, 37, 19, 48, 51); rect(0xa51e16, 18, 32, 11, 4);
  });
  texture('wm_barricade', 82, 48, () => {
    rect(OUT, 0, 13, 82, 24); rect(WOOD, 2, 15, 78, 20); rect(DARK, 9, 3, 9, 44); rect(DARK, 64, 3, 9, 44); rect(GOLD, 11, 19, 4, 4); rect(GOLD, 66, 19, 4, 4);
  });
  texture('wm_palm', 72, 84, () => {
    rect(OUT, 32, 19, 12, 64); rect(WOOD, 35, 22, 6, 59);
    for (let i = 0; i < 5; i++) { g.lineStyle(7, 0x304a27); g.lineBetween(38, 21, 5 + i * 15, 6 + Math.abs(i - 2) * 11); }
  });
  texture('wm_statue', 54, 80, () => {
    rect(OUT, 2, 63, 50, 16); rect(0x827d80, 5, 65, 44, 12); rect(0x605a63, 14, 36, 27, 28); rect(0x999194, 18, 15, 19, 30); rect(0xb4a8a0, 21, 3, 13, 15); rect(GOLD, 16, 35, 24, 3);
  });
  texture('wm_lantern', 24, 64, () => {
    rect(OUT, 10, 1, 5, 62); rect(WOOD, 12, 3, 2, 59); rect(OUT, 2, 9, 18, 25); rect(GOLD, 5, 12, 12, 19); rect(0xff791c, 7, 22, 8, 7);
  });
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
