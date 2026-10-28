import Phaser from 'phaser';
import {
  isometricStageProfile,
  stageBoardwalkPatches,
  stageIsometricClusters,
  type IsometricPlazaPatch,
  type IsometricPropPlacement,
} from '../data/isometricWorld';
import { worldDepth } from '../data/scenery';
import type { StageTheme } from '../data/stages';

interface ActiveIsoClusterProp {
  spec: IsometricPropPlacement;
  sprite: Phaser.GameObjects.Image;
  halo?: Phaser.GameObjects.Image;
  floorLight?: Phaser.GameObjects.Image;
}

interface ActiveIsoPlaza {
  spec: IsometricPlazaPatch;
  tile: Phaser.GameObjects.TileSprite;
  border: Phaser.GameObjects.Graphics;
}

/**
 * Streams 2.5D isometric boardwalk plazas, corner prop clusters (barrel+lantern, crate+wheel, wanted wall),
 * warm floor light pools, and atmospheric edge vignette across all 8 stages.
 */
export class IsometricStageView {
  private readonly clusters: readonly IsometricPropPlacement[];
  private readonly plazas: readonly IsometricPlazaPatch[];
  private readonly activeProps = new Map<number, ActiveIsoClusterProp>();
  private readonly activePlazas = new Map<number, ActiveIsoPlaza>();
  private readonly vignetteGfx?: Phaser.GameObjects.Graphics;
  public readonly uiCamera?: Phaser.Cameras.Scene2D.Camera;
  private readonly resizeHandler: () => void;
  private readonly preRenderHandler: () => void;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly theme: StageTheme,
  ) {
    this.clusters = stageIsometricClusters(theme);
    this.plazas = stageBoardwalkPatches(theme);

    if (scene.cameras?.add) {
      const w = scene.scale?.width || 1920;
      const h = scene.scale?.height || 1080;
      this.uiCamera = scene.cameras.add(0, 0, w, h, false, 'uiCamera');
      this.uiCamera.setZoom?.(1);
      this.uiCamera.setScroll?.(0, 0);
    }

    if (scene.add?.graphics) {
      this.vignetteGfx = scene.add.graphics().setScrollFactor?.(0).setDepth?.(19);
      this.drawVignette();
    }

    this.resizeHandler = () => {
      if (this.uiCamera && this.scene.scale) {
        this.uiCamera.setSize?.(this.scene.scale.width, this.scene.scale.height);
      }
      this.drawVignette();
    };
    this.preRenderHandler = () => this.syncCameraLayers();
    scene.scale?.on?.('resize', this.resizeHandler);
    scene.events?.on?.('prerender', this.preRenderHandler);
    scene.events?.once?.('shutdown', () => this.destroy());
  }

  /**
   * Routes fixed HUD/overlay elements (scrollFactor === 0) exclusively to `uiCamera` (zoom 1.0)
   * and world elements (scrollFactor !== 0) exclusively to `cameras.main` (zoom 1.42).
   */
  public syncCameraLayers(): void {
    const mainCam = this.scene.cameras?.main;
    const uiCam = this.uiCamera;
    const list = (this.scene.children as { list?: any[] } | undefined)?.list;
    if (!mainCam?.ignore || !uiCam?.ignore || !Array.isArray(list)) return;

    for (let i = 0; i < list.length; i++) {
      const child = list[i];
      if (!child) continue;
      const isHud = child.scrollFactorX === 0 && child.scrollFactorY === 0;
      if (isHud) {
        mainCam.ignore(child);
      } else {
        uiCam.ignore(child);
      }
    }
  }

  private drawVignette(): void {
    if (!this.vignetteGfx) return;
    const w = this.scene.scale?.width || 1536;
    const h = this.scene.scale?.height || 1024;
    const profile = isometricStageProfile(this.theme);
    const alpha = profile.vignetteAlpha;

    this.vignetteGfx.clear();
    const bands = 6;
    for (let i = 0; i < bands; i++) {
      const ratio = (bands - i) / bands;
      const bandAlpha = alpha * ratio * 0.28;
      const insetX = Math.round(i * (w * 0.028));
      const insetY = Math.round(i * (h * 0.028));
      const thicknessX = Math.round(w * 0.032);
      const thicknessY = Math.round(h * 0.032);

      this.vignetteGfx.fillStyle(0x120b08, bandAlpha);
      // Top and bottom warm vignette bands
      this.vignetteGfx.fillRect(0, insetY, w, thicknessY);
      this.vignetteGfx.fillRect(0, h - insetY - thicknessY, w, thicknessY);
      // Left and right warm vignette bands
      this.vignetteGfx.fillRect(insetX, 0, thicknessX, h);
      this.vignetteGfx.fillRect(w - insetX - thicknessX, 0, thicknessX, h);
    }
  }

  public update(px: number, py: number, time: number): void {
    const profile = isometricStageProfile(this.theme);

    // 1. Stream isometric wooden boardwalk plazas near hubs
    this.plazas.forEach((plaza, idx) => {
      const near = Math.abs(plaza.x - px) < 1700 && Math.abs(plaza.y - py) < 1500;
      const existing = this.activePlazas.get(idx);
      if (!near) {
        if (existing) {
          existing.tile.destroy?.();
          existing.border.destroy?.();
          this.activePlazas.delete(idx);
        }
        return;
      }
      if (!existing && this.scene.textures?.exists?.(plaza.texture) && this.scene.add?.tileSprite) {
        const tile = this.scene.add
          .tileSprite(plaza.x, plaza.y, plaza.width, plaza.height, plaza.texture)
          .setOrigin?.(0.5, 0.5)
          .setDepth?.(-8);
        tile?.setTint?.(profile.plazaTint);

        const border = this.scene.add.graphics().setDepth?.(-7);
        border.lineStyle(6, 0x321b10, 0.85);
        border.strokeRoundedRect(
          plaza.x - plaza.width / 2,
          plaza.y - plaza.height / 2,
          plaza.width,
          plaza.height,
          12,
        );
        border.lineStyle(2, 0x120b08, 0.9);
        border.strokeRoundedRect(
          plaza.x - plaza.width / 2 - 2,
          plaza.y - plaza.height / 2 - 2,
          plaza.width + 4,
          plaza.height + 4,
          14,
        );

        this.activePlazas.set(idx, { spec: plaza, tile, border });
      }
    });

    // 2. Stream isometric set-piece props (wanted wall, crate+wheel, barrel+lantern)
    this.clusters.forEach((spec, idx) => {
      const near = Math.abs(spec.x - px) < 1500 && Math.abs(spec.y - py) < 1500;
      let entry = this.activeProps.get(idx);
      if (!near) {
        if (entry) {
          entry.sprite.destroy?.();
          entry.halo?.destroy?.();
          entry.floorLight?.destroy?.();
          this.activeProps.delete(idx);
        }
        return;
      }
      if (!entry) {
        if (!this.scene.textures?.exists?.(spec.key)) return;
        const sprite = this.scene.add
          .image(spec.x, spec.y, spec.key)
          .setOrigin?.(0.5, 0.92)
          .setScale?.(spec.scale)
          .setFlipX?.(!!spec.flipX)
          .setDepth?.(worldDepth(spec.y));

        let halo: Phaser.GameObjects.Image | undefined;
        let floorLight: Phaser.GameObjects.Image | undefined;
        if (spec.lit && this.scene.textures?.exists?.('wm_glow')) {
          halo = this.scene.add
            .image(spec.x, spec.y - 44 * spec.scale, 'wm_glow')
            .setScale?.(1.15)
            .setTint?.(profile.lanternColor)
            .setBlendMode?.(Phaser.BlendModes.ADD)
            .setDepth?.(17);

          floorLight = this.scene.add
            .image(spec.x, spec.y + 4, 'wm_glow')
            .setScale?.(1.85, 1.05)
            .setTint?.(profile.lanternColor)
            .setBlendMode?.(Phaser.BlendModes.ADD)
            .setDepth?.(-2);
        }

        entry = { spec, sprite, halo, floorLight };
        this.activeProps.set(idx, entry);
      }

      const obscures = Math.abs(px - spec.x) < 42 && py < spec.y && py > spec.y - 96;
      entry.sprite.setAlpha?.(obscures ? 0.55 : 1);

      if (entry.halo || entry.floorLight) {
        const flicker = 0.34 + Math.sin(time * 0.005 + idx * 1.9) * 0.07;
        entry.halo?.setAlpha?.(flicker);
        entry.floorLight?.setAlpha?.(flicker * 0.65);
      }
    });

    this.syncCameraLayers();
  }

  public destroy(): void {
    this.scene.scale?.off?.('resize', this.resizeHandler);
    this.scene.events?.off?.('prerender', this.preRenderHandler);
    if (this.uiCamera && this.scene.cameras?.remove) {
      this.scene.cameras.remove(this.uiCamera, true);
    }
    this.vignetteGfx?.destroy?.();
    for (const plaza of this.activePlazas.values()) {
      plaza.tile.destroy?.();
      plaza.border.destroy?.();
    }
    this.activePlazas.clear();
    for (const prop of this.activeProps.values()) {
      prop.sprite.destroy?.();
      prop.halo?.destroy?.();
      prop.floorLight?.destroy?.();
    }
    this.activeProps.clear();
  }
}

