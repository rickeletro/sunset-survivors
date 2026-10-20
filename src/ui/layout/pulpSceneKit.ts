import type Phaser from 'phaser';
import { preloadImages } from '../../assets/registry';
import { THEME } from '../theme/tokens';
import { WesternButton } from '../components/WesternButton';

export const PULP_ASSETS = ['saloon_bkg', 'intro_bkg', 'decor_title_parchment', 'decor_lantern', 'decor_spark'] as const;
export function preloadPulp(scene: Phaser.Scene): void { preloadImages(scene, PULP_ASSETS); }

export function pulpBackdrop(scene: Phaser.Scene, root: Phaser.GameObjects.Container, interior: boolean): void {
  scene.cameras.main.setBackgroundColor('#120b08');
  const bg = scene.add.image(0, 0, interior ? 'saloon_bkg' : 'intro_bkg');
  bg.setScale(Math.max(1536 / bg.width, 1024 / bg.height));
  root.add(bg);
  const shade = scene.add.graphics().fillStyle(0x120b08, interior ? 0.50 : 0.18).fillRect(-1000, -512, 2000, 1024);
  root.add(shade);
  // Separate animated lighting, independent of the painted atmosphere.
  for (const x of [-660, 660]) {
    const halo = scene.add.graphics();
    for (let r = 110; r > 5; r -= 8) halo.fillStyle(0xffa32a, 0.013).fillCircle(0, 0, r);
    halo.setPosition(x, -310).setBlendMode(1);
    root.add(halo);
    scene.tweens.add({ targets: halo, alpha: 0.45, duration: 1100 + (x > 0 ? 260 : 0), yoyo: true, repeat: -1 });
  }
  for (let i = 0; i < 12; i++) {
    const dust = scene.add.image(-650 + i * 113, 280 + (i * 43 % 150), 'decor_spark').setScale(0.06).setAlpha(0.25);
    root.add(dust);
    scene.tweens.add({ targets: dust, x: dust.x + 45, y: dust.y - 140, alpha: 0, duration: 3500 + i * 180, delay: i * 200, repeat: -1 });
  }
}
export function pulpPaper(scene: Phaser.Scene, root: Phaser.GameObjects.Container, x: number, y: number, width: number, height: number): Phaser.GameObjects.Container {
  const panel = scene.add.container(x, y);
  panel.add(scene.add.nineslice(0, 0, 'decor_title_parchment', undefined, width, height, 36, 36, 36, 36));
  root.add(panel);
  return panel;
}
export function pulpWood(scene: Phaser.Scene, root: Phaser.GameObjects.Container, x: number, y: number, width: number, height: number): Phaser.GameObjects.Container {
  const panel = scene.add.container(x, y), g = scene.add.graphics();
  g.fillStyle(0x120b08, 0.85).fillRect(-width / 2 + 8, -height / 2 + 10, width, height);
  g.fillStyle(0x321b10).fillRect(-width / 2, -height / 2, width, height);
  for (let row = 0; row < height; row += 42) {
    g.fillStyle(0x603719, 0.6).fillRect(-width / 2 + 4, -height / 2 + row + 2, width - 8, 3);
    g.fillStyle(0x120b08, 0.8).fillRect(-width / 2 + 4, -height / 2 + row + 38, width - 8, 3);
    for (let i = 0; i < 7; i++) g.fillStyle(0xa46b32, 0.24).fillRect(-width / 2 + 15 + (i * 139 + row * 3) % Math.max(20, width - 100), -height / 2 + row + 10 + i % 3 * 7, 42 + i * 9, 2);
  }
  g.lineStyle(5, 0x8b5a2b).strokeRect(-width / 2, -height / 2, width, height);
  for (const dx of [-1, 1]) for (const dy of [-1, 1]) {
    g.fillStyle(0x120b08).fillCircle(dx * (width / 2 - 14), dy * (height / 2 - 14), 6);
    g.fillStyle(0xc69500).fillCircle(dx * (width / 2 - 14) - 1, dy * (height / 2 - 14) - 1, 3);
  }
  panel.add(g); root.add(panel); return panel;
}
export function pulpText(scene: Phaser.Scene, root: Phaser.GameObjects.Container, x: number, y: number, text: string, size = 26, color = '#f2d49a', align: 'left' | 'center' | 'right' = 'center'): Phaser.GameObjects.Text {
  const label = scene.add.text(x, y, text, { fontFamily: THEME.typography.westernFont, fontSize: `${size}px`, color, stroke: color === '#120b08' ? '#f2d49a' : '#120b08', strokeThickness: color === '#120b08' ? 0 : 3, align });
  label.setOrigin(align === 'left' ? 0 : align === 'right' ? 1 : 0.5, 0.5);
  root.add(label); return label;
}
export function pulpHeading(scene: Phaser.Scene, root: Phaser.GameObjects.Container, text: string, y: number, width: number, size: number, parchment = false): void {
  if (parchment) {
    pulpPaper(scene, root, 0, y, width, 132);
    pulpText(scene, root, 0, y, text, size, '#a51e16');
  } else {
    const shadow = pulpText(scene, root, 8, y + 12, text, size, '#120b08');
    shadow.setStroke('#120b08', 22);
    const title = pulpText(scene, root, 0, y, text, size, '#e52b20');
    title.setStroke('#ffc52a', 8);
    for (const label of [shadow, title]) if (label.width > width) label.setScale(width / label.width);
  }
}
export function pulpButton(scene: Phaser.Scene, root: Phaser.GameObjects.Container, x: number, y: number, text: string, action: () => void, width = 420, primary = false): WesternButton {
  const button = new WesternButton(scene, { x, y, width, height: 76, text, variant: primary ? 'danger' : 'wood', presentation: 'pulp', fontSize: '26px', onClick: action });
  root.add(button); return button;
}
export function bindPulpKeys(scene: Phaser.Scene, bindings: Record<string, () => void>): void {
  const keyboard = scene.input.keyboard;
  if (!keyboard) return;
  for (const [key, callback] of Object.entries(bindings)) keyboard.on(`keydown-${key}`, callback);
  scene.events.once('shutdown', () => { for (const [key, callback] of Object.entries(bindings)) keyboard.off(`keydown-${key}`, callback); });
}
export function bindPulpMenu(scene: Phaser.Scene, buttons: readonly WesternButton[], horizontal = false): void {
  let selected = 0;
  const focus = (next: number) => {
    selected = (next + buttons.length) % buttons.length;
    buttons.forEach((button, i) => button.setFocused(i === selected));
  };
  if (!buttons.length) return;
  buttons.forEach((button, i) => button.on('pointerover', () => focus(i)));
  focus(0);
  bindPulpKeys(scene, {
    [horizontal ? 'LEFT' : 'UP']: () => focus(selected - 1),
    [horizontal ? 'RIGHT' : 'DOWN']: () => focus(selected + 1),
    TAB: () => focus(selected + 1), ENTER: () => buttons[selected].activate(), SPACE: () => buttons[selected].activate(),
  });
}
export function pulpStats(scene: Phaser.Scene, root: Phaser.GameObjects.Container, rows: readonly { label: string; value: string | number }[], width: number, y = -110, darkInk = false, gap = 64): void {
  rows.forEach((row, index) => {
    const rowY = y + index * gap;
    const line = scene.add.graphics().fillStyle(darkInk ? 0x603719 : 0xa51e16, 0.4).fillRect(-width / 2, rowY + gap / 2 - 5, width, 2);
    root.add(line);
    pulpText(scene, root, -width / 2, rowY, row.label, 25, darkInk ? '#120b08' : '#f2d49a', 'left');
    pulpText(scene, root, width / 2, rowY, typeof row.value === 'number' ? row.value.toLocaleString() : row.value, 29, darkInk ? '#120b08' : '#ffc52a', 'right');
  });
}
