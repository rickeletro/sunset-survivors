import type Phaser from 'phaser';

/** One portrait treatment shared by gameplay and upgrade screens. Square art stays undistorted. */
export function heroPortrait(scene: Phaser.Scene, x: number, y: number, characterId: string): Phaser.GameObjects.Container {
  const root = scene.add.container(x, y);
  const frame = scene.add.graphics();
  frame.fillStyle(0x120b08).fillRect(-50, -50, 100, 100);
  frame.fillStyle(0x603719).fillRect(-48, -48, 96, 96);
  frame.lineStyle(2, 0xffc52a).strokeRect(-46, -46, 92, 92);
  root.add(frame);
  const key = scene.textures.exists(`hud_avatar_${characterId}`) ? `hud_avatar_${characterId}` : 'hud_avatar_steve';
  if (scene.textures.exists(key)) root.add(scene.add.image(0, 0, key).setDisplaySize(84, 84));
  const rivets = scene.add.graphics();
  for (const dx of [-45, 45]) for (const dy of [-45, 45]) {
    rivets.fillStyle(0x120b08).fillRect(dx - 3, dy - 3, 6, 6);
    rivets.fillStyle(0xc49a55).fillRect(dx - 2, dy - 2, 4, 4);
    rivets.fillStyle(0xffc52a).fillRect(dx - 2, dy - 2, 2, 2);
  }
  root.add(rivets); return root;
}
