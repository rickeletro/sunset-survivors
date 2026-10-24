import type Phaser from 'phaser';
import { faroRank, type FaroCard } from '../../data/faro';
import { pulpText } from '../layout/pulpSceneKit';

/** Traditional pip arrangements in normalized card coordinates. */
export function faroPips(rank: number): { x: number; y: number }[] {
  if (rank === 1) return [{ x: 0, y: 0 }];
  if (rank === 2 || rank === 3) return [{ x: 0, y: -.27 }, ...(rank === 3 ? [{ x: 0, y: 0 }] : []), { x: 0, y: .27 }];
  if (rank < 4 || rank > 10) return [];
  const rows = rank <= 5 ? [-.27, .27] : rank <= 8 ? [-.27, 0, .27] : [-.27, -.09, .09, .27];
  const pips = rows.flatMap(y => [{ x: -.19, y }, { x: .19, y }]);
  if (rank === 5 || rank === 9) pips.push({ x: 0, y: 0 });
  if (rank === 7 || rank === 8) pips.push({ x: 0, y: -.135 });
  if (rank === 8) pips.push({ x: 0, y: .135 });
  if (rank === 10) pips.push({ x: 0, y: -.18 }, { x: 0, y: .18 });
  return pips;
}

/** Native suit geometry avoids missing glyphs on devices without symbol fonts. */
export function drawFaroSuit(g: Phaser.GameObjects.Graphics, suit: number, x: number, y: number, size: number): void {
  const r = size / 2;
  g.fillStyle(suit === 1 || suit === 2 ? 0xa51e16 : 0x120b08);
  if (suit === 2) g.fillTriangle(x, y - r, x - r * .75, y, x, y + r).fillTriangle(x, y - r, x + r * .75, y, x, y + r);
  else if (suit === 1) {
    g.fillCircle(x - r * .38, y - r * .25, r * .48).fillCircle(x + r * .38, y - r * .25, r * .48);
    g.fillTriangle(x - r * .82, y - r * .1, x + r * .82, y - r * .1, x, y + r);
  } else {
    if (suit === 0) {
      g.fillCircle(x - r * .35, y + r * .1, r * .47).fillCircle(x + r * .35, y + r * .1, r * .47);
      g.fillTriangle(x - r * .8, y + r * .15, x + r * .8, y + r * .15, x, y - r);
    } else {
      g.fillCircle(x, y - r * .45, r * .47).fillCircle(x - r * .45, y + r * .1, r * .47).fillCircle(x + r * .45, y + r * .1, r * .47);
    }
    g.fillTriangle(x, y, x - r * .3, y + r, x + r * .3, y + r);
  }
}
/** Face, back and pips remain independent from the felt and animated dealer. */
export function playingCard(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, x: number, y: number, width: number, card?: FaroCard) {
  const node = scene.add.container(x, y).setSize(width, width * 1.48); parent.add(node);
  const height = width * 1.48, face = scene.add.graphics();
  face.fillStyle(0x120b08, .5).fillRoundedRect(-width / 2 + 3, -height / 2 + 5, width, height, 4);
  face.fillStyle(card ? 0xf2e5c4 : 0xa51e16).fillRoundedRect(-width / 2, -height / 2, width, height, 4);
  face.lineStyle(2, 0x603719).strokeRoundedRect(-width / 2, -height / 2, width, height, 4); node.add(face);
  const ink = card && (card.suit === 1 || card.suit === 2) ? '#a51e16' : '#120b08';
  if (card) {
    for (const direction of [1, -1]) {
      const corner = pulpText(scene, node, -direction * (width / 2 - 12), -direction * (height / 2 - 16), faroRank(card.rank), width * .23, ink);
      corner.setFontFamily('Georgia, serif').setStroke(ink, 0); if (direction < 0) corner.setAngle(180);
      drawFaroSuit(face, card.suit, -direction * (width / 2 - 12), -direction * (height / 2 - 33), width * .16);
    }
    if (card.rank > 10) {
      pulpText(scene, node, 0, -13, faroRank(card.rank), width * .48, ink).setStroke(ink, 0);
      drawFaroSuit(face, card.suit, 0, 23, width * .28);
      // A brass crown distinguishes the court from numbered pip cards.
      face.fillStyle(0xc89827).fillTriangle(-12, -38, 0, -49, 12, -38).fillRect(-12, -38, 24, 4);
    } else if (card.rank === 1) drawFaroSuit(face, card.suit, 0, 0, width * .53);
    else for (const pip of faroPips(card.rank)) drawFaroSuit(face, card.suit, pip.x * width, pip.y * height, width * (card.rank >= 6 ? .2 : .26));
  } else {
    face.lineStyle(1, 0xffc52a, .7).strokeRect(-width / 2 + 8, -height / 2 + 8, width - 16, height - 16);
    for (let line = -3; line <= 3; line++) face.lineBetween(-width / 2 + 10, line * 12, width / 2 - 10, line * 12 + 20);
    face.fillStyle(0xffc52a).fillTriangle(0, -18, -12, 0, 0, 18).fillTriangle(0, -18, 12, 0, 0, 18);
  }
  return node;
}
