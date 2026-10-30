import type Phaser from 'phaser';
import { THEME } from '../ui/theme/tokens';

export interface PerformanceStats {
  fps: number;
  frameTime: number;
  gameObjects: number;
  enemies: number;
  projectiles: number;
  particles: number;
  memoryMb?: number;
  webglStatus: string;
  loadTimeMs?: number;
}

export class PerformanceMonitor {
  private container?: Phaser.GameObjects.Container;
  private background?: Phaser.GameObjects.Graphics;
  private text?: Phaser.GameObjects.Text;
  private visible = false;
  private frameCount = 0;
  private fpsAccumulator = 0;
  private currentFps = 60;
  private currentFrameTime = 16.6;

  constructor(private scene: Phaser.Scene) {
    this.createOverlay();
    this.bindKeys();
  }

  private createOverlay(): void {
    if (!this.scene.add) return;
    const { width } = this.scene.scale;
    this.container = this.scene.add.container(width - 240, 48).setDepth(200).setScrollFactor(0);
    this.background = this.scene.add.graphics();
    this.background.fillStyle(0x120b08, 0.85);
    this.background.fillRoundedRect(0, 0, 230, 116, 6);
    this.background.lineStyle(1.5, 0xffc52a, 0.9);
    this.background.strokeRoundedRect(0, 0, 230, 116, 6);
    this.container.add(this.background);

    this.text = this.scene.add.text(10, 8, '', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '10px',
      color: '#ffc52a',
      lineSpacing: 4,
    });
    this.container.add(this.text);
    this.container.setVisible(this.visible);
  }

  private bindKeys(): void {
    if (!this.scene.input?.keyboard) return;
    const toggle = () => this.toggle();
    this.scene.input.keyboard.on('keydown-F3', toggle);
    this.scene.events.once('shutdown', () => {
      this.scene.input?.keyboard?.off('keydown-F3', toggle);
      this.destroy();
    });
  }

  public toggle(): boolean {
    this.visible = !this.visible;
    this.container?.setVisible(this.visible);
    return this.visible;
  }

  public setVisible(show: boolean): void {
    this.visible = show;
    this.container?.setVisible(show);
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public update(
    delta: number,
    stats: {
      enemies: number;
      projectiles: number;
      particles: number;
      loadTimeMs?: number;
    }
  ): void {
    this.frameCount++;
    this.fpsAccumulator += delta;

    if (this.fpsAccumulator >= 500) {
      this.currentFps = Math.round((this.frameCount * 1000) / this.fpsAccumulator);
      this.currentFrameTime = Math.round((this.fpsAccumulator / this.frameCount) * 10) / 10;
      this.frameCount = 0;
      this.fpsAccumulator = 0;
    }

    if (!this.visible || !this.text) return;

    const game = this.scene.game;
    const webglLost = (game.renderer as any)?.isContextLost ?? false;
    const webglStatus = webglLost ? 'CONTEXT LOST' : 'WEBGL OK';

    let memText = '';
    const perf = typeof window !== 'undefined' ? (window as any).performance : (globalThis as any).performance;
    if (perf?.memory?.usedJSHeapSize) {
      const mb = Math.round(perf.memory.usedJSHeapSize / (1024 * 1024));
      memText = `MEM: ${mb}MB | `;
    }

    const totalObjects = this.scene.children?.length ?? (stats.enemies + stats.projectiles);
    const loadStr = stats.loadTimeMs !== undefined ? ` | LOAD: ${Math.round(stats.loadTimeMs)}ms` : '';

    this.text.setText([
      `PERF: ${this.currentFps} FPS (${this.currentFrameTime}ms)`,
      `RENDER: ${webglStatus}`,
      `${memText}OBJS: ${totalObjects}`,
      `ENEMIES: ${stats.enemies} | PROJ: ${stats.projectiles}`,
      `VFX: ${stats.particles}${loadStr}`,
    ]);
  }

  public destroy(): void {
    this.container?.destroy();
  }
}
