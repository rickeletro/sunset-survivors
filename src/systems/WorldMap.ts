import Phaser from 'phaser';

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

type Kind = 'rock' | 'cactus' | 'deadtree';

interface Obstacle {
  x: number;
  y: number;
  r: number;
  kind: Kind;
  sprite?: Phaser.GameObjects.Image;
}

const KINDS: Record<Kind, { r: number; w: number; h: number }> = {
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
  private active = new Set<string>();

  constructor(
    private scene: Phaser.Scene,
    private safeX: number,
    private safeY: number,
    private safeRadius = 260,
  ) {
    this.makeTextures();
  }

  private makeTextures() {
    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
    const tex = (key: string, w: number, h: number, draw: () => void) => {
      if (this.scene.textures.exists(key)) return;
      g.clear();
      draw();
      g.generateTexture(key, w, h);
    };
    const OUT = 0x120b08;

    tex('wm_rock', 36, 28, () => {
      g.fillStyle(OUT, 1).fillRoundedRect(0, 6, 36, 22, 6).fillRoundedRect(8, 0, 20, 12, 4);
      g.fillStyle(0x603719, 1).fillRoundedRect(2, 8, 32, 18, 5).fillRoundedRect(10, 2, 16, 10, 3);
      g.fillStyle(0x8a5a2b, 1).fillRect(8, 6, 10, 3).fillRect(6, 12, 6, 3);
      g.fillStyle(0x572449, 1).fillRect(4, 22, 28, 4);
    });
    tex('wm_cactus', 24, 44, () => {
      g.fillStyle(OUT, 1).fillRect(8, 0, 10, 44).fillRect(0, 12, 10, 8).fillRect(0, 12, 6, 16).fillRect(16, 8, 8, 8).fillRect(18, 8, 6, 20);
      g.fillStyle(0x2f6b2a, 1).fillRect(10, 2, 6, 40).fillRect(2, 14, 8, 4).fillRect(2, 14, 4, 12).fillRect(16, 10, 6, 4).fillRect(18, 10, 4, 16);
      g.fillStyle(0x4f9a3f, 1).fillRect(11, 4, 2, 34);
    });
    tex('wm_deadtree', 36, 52, () => {
      g.fillStyle(OUT, 1).fillRect(14, 14, 10, 38).fillRect(4, 8, 12, 6).fillRect(2, 0, 6, 12).fillRect(22, 18, 12, 6).fillRect(30, 8, 6, 14);
      g.fillStyle(0x603719, 1).fillRect(16, 16, 6, 34).fillRect(6, 10, 10, 2).fillRect(4, 2, 2, 10).fillRect(22, 20, 10, 2).fillRect(32, 10, 2, 12);
      g.fillStyle(0x321b10, 1).fillRect(20, 16, 2, 34);
    });
    g.destroy();
  }

  private key(cx: number, cy: number) {
    return `${cx},${cy}`;
  }

  private getChunk(cx: number, cy: number): Obstacle[] {
    const k = this.key(cx, cy);
    let list = this.chunks.get(k);
    if (list) return list;

    list = [];
    const rand = rng((cx + 1000) * 73856093 ^ (cy + 1000) * 19349663);
    const count = 3 + Math.floor(rand() * 4);
    const kinds: Kind[] = ['rock', 'cactus', 'cactus', 'deadtree', 'rock'];
    for (let i = 0; i < count; i++) {
      const kind = kinds[Math.floor(rand() * kinds.length)];
      const x = cx * CHUNK + 40 + rand() * (CHUNK - 80);
      const y = cy * CHUNK + 40 + rand() * (CHUNK - 80);
      if (x < WORLD_MARGIN || y < WORLD_MARGIN || x > WORLD_W - WORLD_MARGIN || y > WORLD_H - WORLD_MARGIN) continue;
      if (Math.hypot(x - this.safeX, y - this.safeY) < this.safeRadius) continue;
      list.push({ x, y, r: KINDS[kind].r, kind });
    }
    this.chunks.set(k, list);
    return list;
  }

  /** Cria/destrói sprites conforme a distância do jogador. */
  update(px: number, py: number) {
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
        this.active.add(k);
      }
    }

    for (const k of Array.from(this.active)) {
      if (wanted.has(k)) continue;
      const [cx, cy] = k.split(',').map(Number);
      for (const o of this.getChunk(cx, cy)) {
        o.sprite?.destroy();
        o.sprite = undefined;
      }
      this.active.delete(k);
    }
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
            x = o.x + (dx / d) * min;
            y = o.y + (dy / d) * min;
          }
        }
      }
    }
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
        return { x, y };
      }
    }
    return { x: Phaser.Math.Clamp(px + minDist, WORLD_MARGIN, WORLD_W - WORLD_MARGIN), y: py };
  }
}
