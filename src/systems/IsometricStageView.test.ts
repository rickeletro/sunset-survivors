import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import {
  compassRoseStarPoints,
  ISOMETRIC_PLANE,
  isometricEllipse,
  isometricStageProfile,
  stageBoardwalkPatches,
  stageIsometricClusters,
  supplyCampDiorama,
} from '../data/isometricWorld';
import { footprint, overlapsFootprint, stageLandmarks } from '../data/scenery';
import { STAGES } from '../data/stages';
import { IsometricStageView } from './IsometricStageView';

vi.mock('phaser', () => ({
  default: {
    BlendModes: { ADD: 1 },
  },
}));

function createHarness() {
  const created: any[] = [];
  let onShutdown: () => void = () => {};

  const makeObj = (x: number, y: number, key: string) => {
    const obj: any = {
      x,
      y,
      key,
      alpha: 1,
      depth: 0,
      scale: 1,
      destroyed: false,
      setOrigin: vi.fn(() => obj),
      setScale: vi.fn((s: number) => {
        obj.scale = s;
        return obj;
      }),
      setFlipX: vi.fn(() => obj),
      setDepth: vi.fn((d: number) => {
        obj.depth = d;
        return obj;
      }),
      setTint: vi.fn(() => obj),
      setBlendMode: vi.fn(() => obj),
      setAlpha: vi.fn((a: number) => {
        obj.alpha = a;
        return obj;
      }),
      scrollFactorX: 1,
      scrollFactorY: 1,
      setScrollFactor: vi.fn((fx: number, fy = fx) => {
        obj.scrollFactorX = fx;
        obj.scrollFactorY = fy;
        return obj;
      }),
      clear: vi.fn(() => obj),
      fillStyle: vi.fn(() => obj),
      fillRect: vi.fn(() => obj),
      lineStyle: vi.fn(() => obj),
      strokeRoundedRect: vi.fn(() => obj),
      destroy: vi.fn(() => {
        obj.destroyed = true;
      }),
    };
    created.push(obj);
    return obj;
  };

  const scene = {
    scale: {
      width: 1920,
      height: 1080,
      on: vi.fn(),
      off: vi.fn(),
    },
    textures: {
      exists: vi.fn(() => true),
    },
    cameras: {
      main: {
        ignore: vi.fn(),
        postFX: {
          addVignette: vi.fn(() => ({ type: 'vignette' })),
          addTiltShift: vi.fn(() => ({ type: 'tiltShift' })),
          remove: vi.fn(),
        },
      },
      add: vi.fn(() => ({
        setZoom: vi.fn(),
        setScroll: vi.fn(),
        setSize: vi.fn(),
        ignore: vi.fn(),
      })),
      remove: vi.fn(),
    },
    children: {
      list: created,
    },
    events: {
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn((_ev: string, fn: () => void) => {
        onShutdown = fn;
      }),
    },
    add: {
      image: vi.fn((x: number, y: number, key: string) => makeObj(x, y, key)),
      tileSprite: vi.fn((x: number, y: number, _w: number, _h: number, key: string) => makeObj(x, y, key)),
      graphics: vi.fn(() => makeObj(0, 0, 'graphics')),
    },
  };

  return {
    scene: scene as unknown as Phaser.Scene,
    created,
    shutdown: () => onShutdown(),
  };
}

describe('Isometric 2.5D / 3/4 Oblique World & Stage View', () => {
  it.each(STAGES)('configures isometric ground, boardwalk plazas and non-blocking clusters for stage $id ($theme)', stage => {
    const profile = isometricStageProfile(stage.theme);
    expect(['ground_iso_wood', 'ground_iso_canyon', 'ground_iso_stone']).toContain(profile.groundTexture);
    expect(profile.vignetteAlpha).toBeGreaterThan(0.35);
    expect(stageBoardwalkPatches(stage.theme)).toHaveLength(5);

    const clusters = stageIsometricClusters(stage.theme);
    expect(clusters.length).toBeGreaterThanOrEqual(30);
    // Ensure cluster props never block the central spawn point (4000, 4000) or overlap building footprints
    const landmarks = stageLandmarks(stage.theme);
    for (const prop of clusters) {
      expect(Math.hypot(prop.x - 4000, prop.y - 4000)).toBeGreaterThan(180);
      expect(landmarks.some(l => overlapsFootprint(footprint(l), prop.x, prop.y, 12))).toBe(false);
    }
  });

  it('projects ground circles into 2.5D ellipses, builds the 8-point Compass Rose and frames supply chests safely', () => {
    expect(ISOMETRIC_PLANE.cameraZoom).toBeCloseTo(1.42);
    const ell = isometricEllipse(80);
    expect(ell).toEqual({ width: 160, height: 93 });

    const rose = compassRoseStarPoints(4000, 4000, 46, 17);
    expect(rose).toHaveLength(16);

    const diorama = supplyCampDiorama(4000, 4000);
    expect(diorama).toHaveLength(4);
    for (const item of diorama) {
      // Every diorama prop stands outside the 80px chest activation circle
      expect(Math.hypot(item.x - 4000, item.y - 4000)).toBeGreaterThan(105);
    }
  });

  it('streams boardwalks, isometric props and lantern halos near hubs and disposes them on exit or shutdown', () => {
    const h = createHarness();
    const view = new IsometricStageView(h.scene, 'saloon');

    view.update(4000, 4000, 500);
    const activeNear = h.created.filter(o => !o.destroyed);
    expect(activeNear.some(o => o.key === 'ground_iso_wood')).toBe(true);
    expect(activeNear.some(o => o.key === 'iso_barrel_lantern')).toBe(true);
    expect(activeNear.some(o => o.key === 'iso_crate_wheel')).toBe(true);
    expect(activeNear.some(o => o.key === 'iso_wanted_wall')).toBe(true);
    expect(activeNear.some(o => o.key === 'wm_glow')).toBe(true);

    // Move far away from all hubs: streamed plazas and props should be disposed
    view.update(100, 100, 1000);
    const remainingWorldObjects = h.created.filter(o => !o.destroyed && o.key !== 'graphics');
    expect(remainingWorldObjects).toHaveLength(0);

    // Re-enter hub with a HUD element and then trigger scene shutdown
    const hud = h.scene.add.graphics().setScrollFactor(0);
    view.update(4000, 4000, 1500);
    expect(view.uiCamera).toBeDefined();
    expect(view.vignetteFx).toBeDefined();
    expect(view.tiltShiftFx).toBeDefined();
    expect((h.scene.cameras.main.ignore as any)).toHaveBeenCalledWith(hud);
    expect((view.uiCamera!.ignore as any)).toHaveBeenCalled();
    hud.destroy();
    h.shutdown();
    expect((h.scene.cameras.main.postFX.remove as any)).toHaveBeenCalledTimes(2);
    expect(h.created.every(o => o.destroyed)).toBe(true);
  });
});

