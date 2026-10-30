import type { StageTheme } from './stages';

export const ISOMETRIC_PLANE = {
  /** Camera zoom bringing the 3/4 oblique ground plane to the tactile scale of the reference art. */
  cameraZoom: 1.42,
  /** Vertical foreshortening ratio for ground-plane circles in 3/4 oblique / 2:1 isometric projection. */
  ellipseRatio: 0.58,
  /** Diagonal plank angle in radians (~26.565 deg for 2:1 isometric projection). */
  isoAngleRad: Math.atan(0.5),
} as const;

export type IsometricGroundKey = 'ground_iso_wood' | 'ground_iso_canyon' | 'ground_iso_stone' | 'ground_iso_railroad' | 'ground_iso_burning' | 'ground_iso_mountain' | 'ground_iso_hacienda';
export type IsometricSetPieceKey = 'iso_barrel_lantern' | 'iso_crate_wheel' | 'iso_wanted_wall';

export const ISOMETRIC_ASSET_KEYS: readonly (IsometricGroundKey | IsometricSetPieceKey)[] = [
  'ground_iso_wood',
  'ground_iso_canyon',
  'ground_iso_stone',
  'ground_iso_railroad',
  'ground_iso_burning',
  'ground_iso_mountain',
  'ground_iso_hacienda',
  'iso_barrel_lantern',
  'iso_crate_wheel',
  'iso_wanted_wall',
] as const;

export interface IsometricStageProfile {
  theme: StageTheme;
  groundTexture: IsometricGroundKey;
  plazaTexture: IsometricGroundKey;
  groundTint: number;
  plazaTint: number;
  vignetteAlpha: number;
  lanternColor: number;
}

export const ISOMETRIC_STAGE_PROFILES: Record<StageTheme, IsometricStageProfile> = {
  canyon: {
    theme: 'canyon',
    groundTexture: 'ground_iso_canyon',
    plazaTexture: 'ground_iso_canyon',
    groundTint: 0xffffff,
    plazaTint: 0xffffff,
    vignetteAlpha: 0.44,
    lanternColor: 0xffa32a,
  },
  railroad: {
    theme: 'railroad',
    groundTexture: 'ground_iso_railroad',
    plazaTexture: 'ground_iso_railroad',
    groundTint: 0xffffff,
    plazaTint: 0xffffff,
    vignetteAlpha: 0.46,
    lanternColor: 0xff791c,
  },
  'burning-town': {
    theme: 'burning-town',
    groundTexture: 'ground_iso_burning',
    plazaTexture: 'ground_iso_burning',
    groundTint: 0xffffff,
    plazaTint: 0xffffff,
    vignetteAlpha: 0.52,
    lanternColor: 0xff791c,
  },
  saloon: {
    theme: 'saloon',
    groundTexture: 'ground_iso_wood',
    plazaTexture: 'ground_iso_wood',
    groundTint: 0xffffff,
    plazaTint: 0xffffff,
    vignetteAlpha: 0.5,
    lanternColor: 0xffc52a,
  },
  caboose: {
    theme: 'caboose',
    groundTexture: 'ground_iso_wood',
    plazaTexture: 'ground_iso_wood',
    groundTint: 0xffffff,
    plazaTint: 0xffffff,
    vignetteAlpha: 0.48,
    lanternColor: 0xffc52a,
  },
  mountain: {
    theme: 'mountain',
    groundTexture: 'ground_iso_mountain',
    plazaTexture: 'ground_iso_mountain',
    groundTint: 0xffffff,
    plazaTint: 0xffffff,
    vignetteAlpha: 0.48,
    lanternColor: 0xffc52a,
  },
  hacienda: {
    theme: 'hacienda',
    groundTexture: 'ground_iso_hacienda',
    plazaTexture: 'ground_iso_hacienda',
    groundTint: 0xffffff,
    plazaTint: 0xffffff,
    vignetteAlpha: 0.45,
    lanternColor: 0xffa32a,
  },
  manor: {
    theme: 'manor',
    groundTexture: 'ground_iso_stone',
    plazaTexture: 'ground_iso_stone',
    groundTint: 0xffffff,
    plazaTint: 0xffffff,
    vignetteAlpha: 0.54,
    lanternColor: 0xffc52a,
  },
};

export interface IsometricPropPlacement {
  key: IsometricSetPieceKey;
  x: number;
  y: number;
  scale: number;
  flipX?: boolean;
  lit?: boolean;
}

export interface IsometricPlazaPatch {
  x: number;
  y: number;
  width: number;
  height: number;
  texture: IsometricGroundKey;
}

export function isometricStageProfile(theme: StageTheme): IsometricStageProfile {
  return ISOMETRIC_STAGE_PROFILES[theme] ?? ISOMETRIC_STAGE_PROFILES.canyon;
}

/** Returns only the ground texture and set-pieces needed for the given theme, reducing memory churn. */
export function isometricAssetsForTheme(theme: StageTheme): readonly (IsometricGroundKey | IsometricSetPieceKey)[] {
  const profile = isometricStageProfile(theme);
  const textures = new Set<IsometricGroundKey | IsometricSetPieceKey>([
    profile.groundTexture,
    profile.plazaTexture,
    'iso_barrel_lantern',
    'iso_crate_wheel',
    'iso_wanted_wall',
  ]);
  return Array.from(textures);
}

/** Projects a ground circle of radius `r` into an isometric 2.5D ellipse `{ width, height }`. */
export function isometricEllipse(radius: number): { width: number; height: number } {
  const safeR = Math.max(0, radius);
  return {
    width: Math.round(safeR * 2),
    height: Math.round(safeR * 2 * ISOMETRIC_PLANE.ellipseRatio),
  };
}

/** Computes the 8-point Compass Rose star polygon points projected onto the isometric ground plane. */
export function compassRoseStarPoints(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius = outerRadius * 0.38,
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const totalVertices = 16;
  for (let i = 0; i < totalVertices; i++) {
    const angle = (i * Math.PI * 2) / totalVertices - Math.PI / 2;
    const isMajor = i % 4 === 0;
    const isDiagonal = i % 2 === 0 && !isMajor;
    const r = isMajor ? outerRadius : isDiagonal ? outerRadius * 0.76 : innerRadius;
    points.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r * ISOMETRIC_PLANE.ellipseRatio,
    });
  }
  return points;
}

/** Returns the 4 isometric set-piece props framing a supply chest encounter just like the reference image. */
export function supplyCampDiorama(cx: number, cy: number): IsometricPropPlacement[] {
  return [
    { key: 'iso_wanted_wall', x: cx - 116, y: cy - 36, scale: 0.85 },
    { key: 'iso_crate_wheel', x: cx + 112, y: cy - 42, scale: 0.68 },
    { key: 'iso_barrel_lantern', x: cx + 124, y: cy + 16, scale: 0.68, lit: true },
    { key: 'iso_crate_wheel', x: cx - 120, y: cy + 20, scale: 0.58, flipX: true },
  ];
}

const HUB_CENTERS: readonly [number, number][] = [
  [4000, 4000],
  [2400, 2400],
  [5600, 5600],
  [2400, 5600],
  [5600, 2400],
];

/**
 * Generates isometric wooden boardwalk plazas for each hub so every stage has tactile diagonal timber streets.
 */
export function stageBoardwalkPatches(theme: StageTheme): IsometricPlazaPatch[] {
  // Stage ground is one continuous Wang-autotiled PixelLab terrain: no patchwork plazas.
  const patches: IsometricPlazaPatch[] = [];
  void theme;
  for (const [cx, cy] of [] as [number, number][]) {
    patches.push({
      x: cx,
      y: cy,
      width: 1180,
      height: 520,
      texture: 'ground_iso_wood',
    });
  }
  return patches;
}

/**
 * Generates decorative isometric corner clusters (barrel + lit lantern, crates + wagon wheel, wanted poster post)
 * around the 5 stage hubs, keeping streets and train corridors clear.
 */
export function stageIsometricClusters(theme: StageTheme): IsometricPropPlacement[] {
  const rail = theme === 'railroad' || theme === 'caboose';
  const props: IsometricPropPlacement[] = [];

  for (const [cx, cy] of HUB_CENTERS) {
    const baseY = rail ? 4000 + Math.round((cy - 4000) / 640) * 640 + 210 : cy - 195;
    // Left boardwalk corner cluster
    props.push(
      { key: 'iso_wanted_wall', x: cx - 510, y: baseY - 18, scale: 0.85 },
      { key: 'iso_barrel_lantern', x: cx - 462, y: baseY + 12, scale: 0.65, lit: true },
      { key: 'iso_crate_wheel', x: cx - 395, y: baseY - 8, scale: 0.65 },
    );
    // Right boardwalk corner cluster
    props.push(
      { key: 'iso_crate_wheel', x: cx + 395, y: baseY - 10, scale: 0.65, flipX: true },
      { key: 'iso_barrel_lantern', x: cx + 465, y: baseY + 14, scale: 0.65, lit: true },
      { key: 'iso_wanted_wall', x: cx + 515, y: baseY - 16, scale: 0.85, flipX: true },
    );
    // Central plaza lantern barrels flanking the spawn street without blocking the 4000 line
    if (!rail) {
      props.push(
        { key: 'iso_barrel_lantern', x: cx - 220, y: cy + 215, scale: 0.65, lit: true },
        { key: 'iso_crate_wheel', x: cx - 275, y: cy + 205, scale: 0.62 },
        { key: 'iso_barrel_lantern', x: cx + 220, y: cy + 215, scale: 0.65, lit: true },
        { key: 'iso_crate_wheel', x: cx + 275, y: cy + 205, scale: 0.62, flipX: true },
      );
    }
  }
  return props;
}

