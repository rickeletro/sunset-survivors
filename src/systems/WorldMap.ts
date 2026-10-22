import Phaser from 'phaser';
import { getStage, StageConfig } from '../data/stages';
import { createStageScenery } from './StageScenery';
import { StageLandmarks } from './StageLandmarks';
import { worldDecorations, WorldDecoration } from '../data/worldDecorations';
import { buildingPath, type PortalPoint } from './BuildingPath';

/**
 * Mundo grande e contínuo dividido em chunks.
 * - Obstáculos são gerados de forma determinística (seed por chunk) e só
 *   ganham sprites enquanto o chunk está perto do jogador.
 * - Colisão círculo × obstáculo consulta apenas os chunks vizinhos.
 */
export const WORLD_W = 8000;
export const WORLD_H = 8000;
export const WORLD_MARGIN = 48;

const CHUNK = 640;
const ACTIVE_RADIUS = 2; // chunks ao redor do jogador que mantêm sprites

type Kind = 'rock' | 'cactus' | 'deadtree' | 'wagon' | 'barrel' | 'crate' | 'ruin' | 'table' | 'pine' | 'tent' | 'barricade' | 'palm' | 'statue' | 'lantern';

interface Obstacle {
  x: number;
  y: number;
  r: number;
  kind: Kind;
  sprite?: Phaser.GameObjects.Image;
  glow?: Phaser.GameObjects.Image;
}

export const WORLD_PROPS: Record<Kind, { r: number; w: number; h: number }> = {
  wagon: { r: 34, w: 100, h: 88 }, barrel: { r: 14, w: 36, h: 44 }, crate: { r: 17, w: 44, h: 42 },
  ruin: { r: 29, w: 76, h: 70 }, table: { r: 25, w: 66, h: 52 }, pine: { r: 12, w: 50, h: 78 },
  tent: { r: 27, w: 76, h: 56 }, barricade: { r: 28, w: 82, h: 48 }, palm: { r: 12, w: 72, h: 84 },
  statue: { r: 20, w: 54, h: 80 }, lantern: { r: 6, w: 24, h: 64 },
  rock: { r: 14, w: 36, h: 28 },
  cactus: { r: 9, w: 24, h: 44 },
  deadtree: { r: 10, w: 36, h: 52 },
};

/** PRNG pequeno e determinístico (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class WorldMap {
  private chunks = new Map<string, Obstacle[]>();
  private decorationChunks = new Map<string, (WorldDecoration & { sprite?: Phaser.GameObjects.Image })[]>();
  private active = new Set<string>();
  readonly groundTexture: string;
  private landmarks: StageLandmarks;

  constructor(
    private scene: Phaser.Scene,
    private safeX: number,
    private safeY: number,
    private safeRadius = 260,
    private stage: StageConfig = getStage(1),
  ) {
    this.groundTexture = createStageScenery(scene, stage);
    this.landmarks = new StageLandmarks(scene, stage.theme);
  }

  private key(cx: number, cy: number) {
    return `${cx},${cy}`;
  }

  private getChunk(cx: number, cy: number): Obstacle[] {
    const k = this.key(cx, cy);
    let list = this.chunks.get(k);
    if (list) return list;

    list = [];
    const rand = rng((cx + 1000) * 73856093 ^ (cy + 1000) * 19349663 ^ this.stage.id * 83492791);
    const count = 4 + Math.floor(rand() * 4);
    const kinds = [...this.stage.props, 'lantern'] as Kind[];
    for (let i = 0; i < count; i++) {
      const kind = kinds[Math.floor(rand() * kinds.length)];
      const x = cx * CHUNK + 40 + rand() * (CHUNK - 80);
      const y = cy * CHUNK + 40 + rand() * (CHUNK - 80);
      if (x < WORLD_MARGIN || y < WORLD_MARGIN || x > WORLD_W - WORLD_MARGIN || y > WORLD_H - WORLD_MARGIN) continue;
      if (Math.hypot(x - this.safeX, y - this.safeY) < this.safeRadius) continue;
      if (['railroad', 'caboose'].includes(this.stage.theme)) {
        const railY = 4000 + Math.round((y - 4000) / 640) * 640;
        if (Math.abs(y - railY) < 90) continue; // Keep the telegraphed rail corridors navigable.
      }
      if (this.landmarks.reserved(x, y, WORLD_PROPS[kind].r)) continue;
      list.push({ x, y, r: WORLD_PROPS[kind].r, kind });
    }
    this.chunks.set(k, list);
    return list;
  }

  private getDecorationChunk(cx: number, cy: number) {
    const key = this.key(cx, cy);
    let decorations = this.decorationChunks.get(key);
    if (!decorations) {
      decorations = worldDecorations(this.stage.theme, cx, cy).filter(d =>
        Math.hypot(d.x - this.safeX, d.y - this.safeY) >= this.safeRadius &&
        !this.landmarks.reserved(d.x, d.y, 24) &&
        this.getChunk(cx, cy).every(o => Math.hypot(d.x - o.x, d.y - o.y) > o.r + 30));
      this.decorationChunks.set(key, decorations);
    }
    return decorations;
  }

  /** Cria/destrói sprites conforme a distância do jogador. */
  update(px: number, py: number) {
    this.landmarks.update(px, py, this.scene.time.now);
    const pcx = Math.floor(px / CHUNK);
    const pcy = Math.floor(py / CHUNK);
    const wanted = new Set<string>();

    for (let cy = pcy - ACTIVE_RADIUS; cy <= pcy + ACTIVE_RADIUS; cy++) {
      for (let cx = pcx - ACTIVE_RADIUS; cx <= pcx + ACTIVE_RADIUS; cx++) {
        if (cx < 0 || cy < 0 || cx * CHUNK >= WORLD_W || cy * CHUNK >= WORLD_H) continue;
        const k = this.key(cx, cy);
        wanted.add(k);
        if (this.active.has(k)) continue;
        for (const o of this.getChunk(cx, cy)) {
          if (!o.sprite) {
            o.sprite = this.scene.add
              .image(o.x, o.y, `wm_${o.kind}`)
              .setOrigin(0.5, 0.88)
              .setDepth(3 + o.y / WORLD_H);
          }
        }
        for (const o of this.getChunk(cx, cy)) {
          if (o.kind === 'lantern' && !o.glow) o.glow = this.scene.add.image(o.x, o.y - 35, 'wm_glow').setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.65).setDepth(6);
        }
        for (const d of this.getDecorationChunk(cx, cy)) {
          d.sprite = this.scene.add.image(d.x, d.y, `decor_${d.kind}`).setOrigin(0.5, 0.88).setDepth(1);
        }
        this.active.add(k);
      }
    }

    for (const k of Array.from(this.active)) {
      if (wanted.has(k)) continue;
      const [cx, cy] = k.split(',').map(Number);
      for (const o of this.getChunk(cx, cy)) {
        o.glow?.destroy();
        o.glow = undefined;
        o.sprite?.destroy();
        o.sprite = undefined;
      }
      for (const d of this.getDecorationChunk(cx, cy)) {
        d.sprite?.destroy();
        d.sprite = undefined;
      }
      this.active.delete(k);
    }
  }

  chaseTarget(x: number, y: number, targetX: number, targetY: number, radius: number): { x: number; y: number } {
    return this.landmarks.chaseTarget(x, y, targetX, targetY, radius);
  }

  /** Exact swept-circle checks for short cinematic approaches. Physics radii stay unchanged. */
  entrySegmentClear(a: PortalPoint, b: PortalPoint, radius = 10): boolean {
    if ([a, b].some(p => p.x < WORLD_MARGIN || p.y < WORLD_MARGIN || p.x > WORLD_W - WORLD_MARGIN || p.y > WORLD_H - WORLD_MARGIN)) return false;
    if (!this.landmarks.entrySegmentClear(a, b, radius)) return false;
    const vx = b.x - a.x, vy = b.y - a.y, length2 = vx * vx + vy * vy;
    for (let cy = Math.floor((Math.min(a.y, b.y) - radius - 34) / CHUNK); cy <= Math.floor((Math.max(a.y, b.y) + radius + 34) / CHUNK); cy++) {
      for (let cx = Math.floor((Math.min(a.x, b.x) - radius - 34) / CHUNK); cx <= Math.floor((Math.max(a.x, b.x) + radius + 34) / CHUNK); cx++) {
        if (cx < 0 || cy < 0 || cx * CHUNK >= WORLD_W || cy * CHUNK >= WORLD_H) continue;
        for (const o of this.getChunk(cx, cy)) {
          const t = length2 ? Math.max(0, Math.min(1, ((o.x - a.x) * vx + (o.y - a.y) * vy) / length2)) : 0;
          if (Math.hypot(a.x + vx * t - o.x, a.y + vy * t - o.y) < o.r + radius) return false;
        }
      }
    }
    return true;
  }

  buildingPath(from: PortalPoint, to: PortalPoint): PortalPoint[] | undefined {
    return buildingPath(from, to, (a, b) => this.entrySegmentClear(a, b, 10));
  }

  /** Empurra um círculo para fora dos obstáculos próximos e limita ao mundo. */
  resolve(x: number, y: number, radius: number): { x: number; y: number } {
    const cx = Math.floor(x / CHUNK);
    const cy = Math.floor(y / CHUNK);
    for (let j = cy - 1; j <= cy + 1; j++) {
      for (let i = cx - 1; i <= cx + 1; i++) {
        if (i < 0 || j < 0 || i * CHUNK >= WORLD_W || j * CHUNK >= WORLD_H) continue;
        for (const o of this.getChunk(i, j)) {
          const dx = x - o.x;
          const dy = y - o.y;
          const min = radius + o.r;
          const d2 = dx * dx + dy * dy;
          if (d2 < min * min) {
            const d = Math.sqrt(d2) || 0.001;
            x = o.x + (d2 === 0 ? min : (dx / d) * min);
            y = o.y + (dy / d) * min;
          }
        }
      }
    }
    ({ x, y } = this.landmarks.resolve(x, y, radius));
    x = Phaser.Math.Clamp(x, WORLD_MARGIN, WORLD_W - WORLD_MARGIN);
    y = Phaser.Math.Clamp(y, WORLD_MARGIN, WORLD_H - WORLD_MARGIN);
    return { x, y };
  }

  /** Ponto fora da área visível (anel ao redor do jogador), dentro do mundo. */
  spawnPointAround(px: number, py: number, minDist = 620, maxDist = 740): { x: number; y: number } {
    for (let tries = 0; tries < 8; tries++) {
      const a = Math.random() * Math.PI * 2;
      const d = minDist + Math.random() * (maxDist - minDist);
      const x = px + Math.cos(a) * d;
      const y = py + Math.sin(a) * d;
      if (x > WORLD_MARGIN && y > WORLD_MARGIN && x < WORLD_W - WORLD_MARGIN && y < WORLD_H - WORLD_MARGIN) {
        return this.resolve(x, y, 24);
      }
    }
    return this.resolve(Phaser.Math.Clamp(px + minDist, WORLD_MARGIN, WORLD_W - WORLD_MARGIN), py, 24);
  }
}
