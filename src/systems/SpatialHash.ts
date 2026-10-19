/**
 * Hash espacial uniforme. Reconstruído uma vez por frame (O(n)); consultas
 * olham só as células vizinhas, evitando comparar todos contra todos.
 */
interface Positioned {
  sprite: { x: number; y: number };
}

export class SpatialHash<T extends Positioned> {
  private cells = new Map<number, T[]>();
  private used: number[] = [];
  private scratch: T[] = [];

  constructor(private cellSize = 64) {}

  private key(cx: number, cy: number) {
    return (cx + 512) * 4096 + (cy + 512);
  }

  rebuild(items: readonly T[]) {
    for (const k of this.used) this.cells.get(k)!.length = 0;
    this.used.length = 0;
    for (const it of items) {
      const k = this.key(Math.floor(it.sprite.x / this.cellSize), Math.floor(it.sprite.y / this.cellSize));
      let bucket = this.cells.get(k);
      if (!bucket) {
        bucket = [];
        this.cells.set(k, bucket);
      }
      if (bucket.length === 0) this.used.push(k);
      bucket.push(it);
    }
  }

  /**
   * Candidatos nas células que cobrem [x±radius, y±radius].
   * O array retornado é reutilizado: copie se precisar guardá-lo.
   */
  query(x: number, y: number, radius: number): T[] {
    const out = this.scratch;
    out.length = 0;
    const x0 = Math.floor((x - radius) / this.cellSize);
    const x1 = Math.floor((x + radius) / this.cellSize);
    const y0 = Math.floor((y - radius) / this.cellSize);
    const y1 = Math.floor((y + radius) / this.cellSize);
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const bucket = this.cells.get(this.key(cx, cy));
        if (bucket) for (let i = 0; i < bucket.length; i++) out.push(bucket[i]);
      }
    }
    return out;
  }
}
