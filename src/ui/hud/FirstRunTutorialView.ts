import type Phaser from 'phaser';
import type { FirstRunTutorial } from '../../systems/FirstRunTutorial';
import { THEME } from '../theme/tokens';

/** Live parchment, brass studs and animated keycaps; never blocks the middle of combat. */
export class FirstRunTutorialView {
  private root: Phaser.GameObjects.Container;
  private title: Phaser.GameObjects.Text;
  private body: Phaser.GameObjects.Text;
  private keys: Phaser.GameObjects.Text;
  private step: Phaser.GameObjects.Text;
  private skipButton: Phaser.GameObjects.Container;
  private skipLabel: Phaser.GameObjects.Text;
  private ring: Phaser.GameObjects.Graphics;
  private compact = false;
  private short = false;
  private signature = '';
  private resize: () => void;
  private skipKey: () => void;
  constructor(private scene: Phaser.Scene, private model: FirstRunTutorial, skip: () => void) {
    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(92);
    const paper = scene.add.nineslice(0, 0, 'decor_title_parchment', undefined, 760, 210, 36, 36, 36, 36);
    this.root.add(paper);
    const label = (y: number, size: number, color: string, pixel = false) => {
      const text = scene.add.text(0, y, '', {
        fontFamily: pixel ? THEME.typography.pixelFont : THEME.typography.westernFont,
        fontSize: `${size}px`, color, align: 'center', wordWrap: { width: 695 },
      }).setOrigin(0.5);
      this.root.add(text); return text;
    };
    this.step = label(-75, 13, '#603719', true);
    this.title = label(-34, 27, '#a51e16');
    this.body = label(12, 20, '#120b08');
    this.body.setFontFamily(THEME.typography.narrativeFont);
    const board = scene.add.graphics().fillStyle(0x321b10).fillRect(-346, 46, 692, 40);
    board.lineStyle(2, 0xc69500).strokeRect(-346, 46, 692, 40);
    this.root.add(board);
    this.keys = label(66, 18, '#ffc52a', true);
    scene.tweens.add({ targets: this.keys, alpha: 0.6, duration: 650, yoyo: true, repeat: -1 });
    this.skipButton = scene.add.container(0, 0).setScrollFactor(0).setDepth(94).setSize(164, 48).setInteractive({ useHandCursor: true });
    this.skipButton.add(scene.add.graphics().fillStyle(0x321b10, 0.96).fillRect(-82, -24, 164, 48).lineStyle(2, 0xffc52a).strokeRect(-82, -24, 164, 48));
    this.skipLabel = scene.add.text(0, 0, 'PULAR [T]', { fontFamily: THEME.typography.pixelFont, fontSize: '12px', color: '#f2d49a' }).setOrigin(0.5);
    this.skipButton.add(this.skipLabel);
    this.skipButton.on('pointerdown', (_pointer: unknown, _x: unknown, _y: unknown, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); skip(); });
    this.skipKey = skip;
    scene.input.keyboard?.on('keydown-T', this.skipKey);
    this.ring = scene.add.graphics().setDepth(19);
    this.resize = () => {
      const { width, height } = scene.scale;
      const short = height < 480 && width >= 520;
      const scale = short ? Math.min(1, (width - 212) / 760) : Math.min(1, (width - 24) / 760, Math.max(0.35, (height - 150) / 350));
      this.short = short;
      const compact = width < 600;
      this.compact = compact; this.signature = '';
      paper.setSize(760, short ? 72 / scale : compact ? 280 : 210);
      this.title.setVisible(!short); this.step.setVisible(!short); this.keys.setVisible(!short); board.setVisible(!short);
      this.title.setFontSize(compact ? Math.max(38, Math.ceil(18 / scale)) : 27).setY(compact ? -72 : -34);
      this.body.setFontSize(short ? Math.ceil(14 / scale) : compact ? Math.max(30, Math.ceil(14 / scale)) : 20).setY(short || compact ? 0 : 12);
      this.step.setFontSize(compact ? 20 : 13).setY(compact ? -120 : -75);
      this.keys.setFontSize(compact ? Math.max(24, Math.ceil(11 / scale)) : 18);
      this.root.setScale(scale).setPosition(short ? 12 + 380 * scale : width / 2, short ? height - 44 : height - 68 - (compact ? 140 : 105) * scale);
      this.skipButton.setPosition(width - 94, height - 30);
    };
    this.resize(); scene.scale.on('resize', this.resize);
    scene.events.once('shutdown', () => this.destroy());
  }
  update(playerX: number, playerY: number, time: number): void {
    this.root.setVisible(this.model.visible);
    this.skipButton.setVisible(this.model.blocking);
    const copy = this.model.copy;
    const signature = `${this.model.phase}:${this.model.mode}:${this.model.hasFired}`;
    if (signature !== this.signature) {
      this.signature = signature;
      this.skipLabel.setText(this.model.mode === 'touch' ? 'PULAR' : 'PULAR [T]');
      const compactTitles = { move: 'ANDE. TIROS AUTOMÁTICOS!', shoot: this.model.hasFired ? 'VIU SÓ? SEM CLICAR!' : 'A ARMA ATIRA SOZINHA!', ready: 'AGORA É COM VOCÊ!', reminder: 'TIROS AUTOMÁTICOS', loot: 'SAQUE DÁ MELHORIAS!', idle: '' };
      this.title.setText(this.compact ? compactTitles[this.model.phase] : copy.title); this.body.setText(this.short && this.model.phase !== 'loot'
        ? `${this.model.mode === 'touch' ? 'Arraste para andar.' : 'WASD / setas para andar.'}\nMira e tiros automáticos.`
        : copy.body); this.keys.setText(copy.keys); this.step.setText(copy.step);
    }
    this.ring.clear();
    if (this.model.phase === 'move') {
      const pulse = 0.5 + Math.sin(time * 0.005) * 0.2;
      this.ring.lineStyle(3, 0xffc52a, pulse).strokeCircle(playerX, playerY + 20, 44);
      for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        this.ring.lineBetween(playerX + dx * 55, playerY + 20 + dy * 55, playerX + dx * 70, playerY + 20 + dy * 70);
      }
    }
  }
  destroy(): void {
    this.scene.scale.off('resize', this.resize);
    this.scene.input.keyboard?.off('keydown-T', this.skipKey);
    this.root.destroy(); this.skipButton.destroy(); this.ring.destroy();
  }
}
