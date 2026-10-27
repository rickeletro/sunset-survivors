import type Phaser from 'phaser';

/** Cache an exterior-only pixel silhouette once per facade; no per-frame shader or blur. */
export function buildingOutline(scene: Phaser.Scene, texture: string, scale: number) {
  const radius = Math.max(1, Math.ceil(3 / scale));
  const key = `portal-outline:${texture}:${radius}`;
  if (!scene.textures.exists(key)) {
    const source = scene.textures.get(texture).getSourceImage() as HTMLImageElement;
    const canvas = scene.textures.createCanvas(key, source.width + radius * 2, source.height + radius * 2);
    if (!canvas) throw new Error(`Unable to create building outline: ${texture}`);
    const ctx = canvas.getContext();
    ctx.imageSmoothingEnabled = false;
    for (const [dx, dy] of [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]]) {
      ctx.drawImage(source, radius + dx * radius, radius + dy * radius);
    }
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#FFC52A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(source, radius, radius);
    ctx.globalCompositeOperation = 'source-over';
    canvas.refresh();
  }
  return { key, padding: radius * scale };
}
