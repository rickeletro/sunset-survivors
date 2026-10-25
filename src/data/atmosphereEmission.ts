/** Explicit emit zones retain their offsets when Phaser's emitter follows an actor. */
export function ambientSpawn(point: { x: number; y: number }, width: number, height: number, random = Math.random): void {
  point.x = (random() - 0.5) * width;
  point.y = (random() - 0.5) * height;
}
export function brushSpawn(point: { x: number; y: number }, random = Math.random): void {
  point.x = -580;
  point.y = (random() - 0.5) * 560;
}
