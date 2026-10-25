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
  // Low-contrast, irregular material clusters avoid the old diagonal confetti grid.
  const noise = (n: number) => {
    let v = n ^ Math.imul(stage.id, 73856093);
    v = Math.imul(v ^ v >>> 16, 0x7feb352d);
    v = Math.imul(v ^ v >>> 15, 0x846ca68b);
    return ((v ^ v >>> 16) >>> 0) / 4294967296;
  };
  texture(`stage_ground_${stage.id}`, 256, 256, () => {
    rect(stage.ground, 0, 0, 256, 256);
    if (['saloon', 'caboose'].includes(stage.theme)) {
      for (let row = 0; row < 16; row++) {
        const y = row * 16, seam = Math.floor(noise(row + 1) * 110);
        rect(DARK, 0, y, 256, 1);
        g.fillStyle(0xc49a55, 0.14).fillRect(0, y + 1, 256, 1);
        for (let x = seam; x < 256; x += 128) { rect(DARK, x, y, 1, 16); rect(OUT, x + 3, y + 4, 1, 1); }
        for (let i = 0; i < 4; i++) g.fillStyle(0x120b08, 0.12).fillRect(Math.floor(noise(row * 7 + i + 30) * 240), y + 4 + i * 2, 12 + Math.floor(noise(i + row + 50) * 30), 1);
      }
    } else if (stage.theme === 'manor') {
      for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
        const x = col * 32, y = row * 32;
        g.fillStyle(noise(row * 8 + col) > 0.5 ? 0x120b08 : 0xf2d49a, 0.05).fillRect(x + 1, y + 1, 30, 30);
        g.fillStyle(0x120b08, 0.36).fillRect(x, y, 32, 1).fillRect(x, y, 1, 32);
        g.fillStyle(0xf2d49a, 0.12).fillRect(x + 1, y + 1, 30, 1);
      }
    } else {
      for (let i = 0; i < 180; i++) {
        const x = Math.floor(noise(i * 5 + 100) * 256), y = Math.floor(noise(i * 5 + 101) * 256);
        const w = 2 + Math.floor(noise(i * 5 + 102) * 11), h = 1 + Math.floor(noise(i * 5 + 103) * 3);
        g.fillStyle(i % 3 ? 0x321b10 : 0xf2d49a, i % 3 ? 0.07 : 0.10).fillRect(x, y, w, h);
      }
      for (let i = 0; i < 24; i++) {
        const x = Math.floor(noise(i + 2000) * 254), y = Math.floor(noise(i + 3000) * 254);
        g.fillStyle(0x120b08, 0.16).fillRect(x, y, 2, 1);
      }
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
  texture('stage_roast', 24, 20, () => {
    rect(OUT, 3, 7, 18, 11); rect(0xa95121, 4, 8, 15, 8);
    rect(0xffb557, 6, 8, 9, 3); rect(0x603719, 5, 14, 13, 2);
    rect(0xf2d49a, 17, 3, 3, 8); rect(0xf2d49a, 16, 2, 6, 3);
  });
  texture('stage_activity', 128, 64, () => {
    g.fillStyle(GOLD, 0.10).fillEllipse(64, 32, 120, 54);
    g.lineStyle(2, GOLD, 0.85).strokeEllipse(64, 32, 116, 50);
    g.lineStyle(1, GOLD, 0.35).strokeEllipse(64, 32, 104, 42);
    rect(GOLD, 60, 4, 8, 3); rect(GOLD, 60, 57, 8, 3);
  });
  texture('stage_dust', 6, 4, () => { rect(0xf2d49a, 0, 1, 5, 2); rect(0xffc52a, 1, 0, 2, 1); });
  texture('stage_ember', 4, 6, () => { rect(0xff791c, 1, 1, 2, 4); rect(0xffc52a, 1, 1, 2, 2); });
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
