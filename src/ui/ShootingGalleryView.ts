import { ECONOMY } from '../data/economy';
import type Phaser from 'phaser';
import { ShootingGallery, gallerySlot, galleryPlatePose, GALLERY_SLOTS } from '../data/shootingGallery';
import { BossTargetPlate } from './components/BossTargetPlate';
import { sounds } from '../audio/SoundManager';
import { pulpButton, pulpText, pulpWood, bindPulpKeys } from './layout/pulpSceneKit';

export const GALLERY_AIM_AREA = { x: 0, y: -10, width: 1280, height: 555 } as const;
export function galleryAimPoint(localX: number, localY: number) {
  return { x: localX - GALLERY_AIM_AREA.width / 2 + GALLERY_AIM_AREA.x, y: localY - GALLERY_AIM_AREA.height / 2 + GALLERY_AIM_AREA.y };
}
/** Layered velvet booth, brass hinges and eight reusable illustrated boss boards. */
export class ShootingGalleryView {
  private round: ShootingGallery;
  private exited = false;
  private targets: BossTargetPlate[] = [];
  constructor(scene: Phaser.Scene, root: Phaser.GameObjects.Container, onExit: (reward: { bounty: number; xp: number }) => void, stage = 1, admission?: { price:number; balance:()=>number; pay:()=>boolean }) {
    this.round = new ShootingGallery(Math.random, stage);
    const profile = this.round.profile;
    pulpWood(scene, root, 0, -440, 1360, 104);
    pulpText(scene, root, 0, -442, `${profile.name.toUpperCase()} SALOON`, 50, '#ffc52a');
    pulpText(scene, root, 0, -361, `STAGE ${profile.stage} • ${profile.targets} BOSS BOARDS • ONE MISS ENDS THE ROUND`, 25);
    pulpWood(scene, root, 0, -2, 1390, 626);
    const rig = scene.add.container(0, 0); root.add(rig);
    const back = scene.add.graphics();
    back.fillStyle(0x120b08).fillRect(-655, -291, 1310, 552);
    back.fillStyle(0x24120f).fillRect(-639, -279, 1278, 528);
    // Velvet folds and a separate valance retain the booth's stage depth.
    for (let i = 0; i < 32; i++) back.fillStyle(i % 2 ? 0x321b10 : 0x3d1b16, .6).fillRect(-637 + i * 40, -276, 24, 522);
    back.fillStyle(profile.velvet).fillRect(-650, -291, 1300, 40);
    for (let x = -650; x < 650; x += 100) {
      back.fillStyle(0x73190f).fillTriangle(x, -251, x + 100, -251, x + 50, -224);
      back.lineStyle(2, 0xc89827).lineBetween(x, -251, x + 50, -224).lineBetween(x + 50, -224, x + 100, -251);
    }
    rig.add(back);
    for (let row = 0; row < 2; row++) {
      const base = gallerySlot(row * 4).y;
      const recess = scene.add.graphics().fillStyle(0x120b08, .85);
      for (let col = 0; col < 4; col++) {
        const p = gallerySlot(row * 4 + col);
        recess.fillEllipse(p.x, base + 1, 220, 20); recess.lineStyle(2, 0x9b622d).lineBetween(p.x - 110, base - 2, p.x + 110, base - 2);
      }
      rig.add(recess);
      for (let col = 0; col < 4; col++) {
        const p = gallerySlot(row * 4 + col); this.targets.push(new BossTargetPlate(scene, rig, p.x, p.y));
      }
      // Foreground shelf overlaps the feet of the plates, hiding their hinge pivot.
      pulpWood(scene, rig, 0, base + 28, 1320, 56);
      const rail = scene.add.graphics();
      rail.fillStyle(0xc89827).fillRect(-650, base + 1, 1300, 4);
      rail.fillStyle(0x120b08, .45).fillRect(-647, base + 7, 1294, 5);
      for (let col = 0; col < 4; col++) {
        const x = gallerySlot(row * 4 + col).x;
        rail.fillStyle(0x120b08).fillRect(x - 20, base - 4, 40, 12);
        rail.fillStyle(0xc89827).fillRect(x - 17, base - 2, 34, 8);
        rail.lineStyle(1, 0xffc52a).lineBetween(x - 14, base, x + 14, base);
        for (const side of [-1, 1]) rail.fillStyle(0x321b10).fillCircle(x + side * 12, base + 2, 2);
      }
      rig.add(rail);
    }
    for (const x of [-671, 671]) {
      const post = scene.add.graphics().fillStyle(0x321b10).fillRect(x - 10, -307, 20, 599);
      post.lineStyle(2, 0xc89827).lineBetween(x - 7, -300, x - 7, 284).lineBetween(x + 7, -300, x + 7, 284); rig.add(post);
      for (const y of [-290, -25, 267]) { post.fillStyle(0x120b08).fillCircle(x, y + 2, 5); post.fillStyle(0xffc52a).fillCircle(x, y, 3); }
    }
    const hits = pulpText(scene, root, -440, 335, '', 24, '#ffc52a');
    const speed = pulpText(scene, root, 0, 335, '', 24);
    const purse = pulpText(scene, root, 440, 335, '', 24, '#ffc52a');
    const status = pulpText(scene, root, 0, 384, 'Hit the boss boards before they fold away. One miss or escape ends the round.', 20);
    const start = () => {
      if (this.round.state !== 'ready') return;
      if (admission && !admission.pay()) { status.setText('NOT ENOUGH RUN CASH FOR ADMISSION.'); return; }
      this.round.start(); sounds.playReload(); action.setText('DRAW!');
    };
    const action = pulpButton(scene, root, -315, 449, admission ? `START $${admission.price} / CASH $${admission.balance()}` : 'START SHOWDOWN', start, 560, true);
    if (admission) action.setEnabled(admission.balance() >= admission.price);
    const leave = () => { if (this.exited) return; this.exited = true; onExit(this.round.close()); };
    pulpButton(scene, root, 315, 449, 'COLLECT & LEAVE', leave, 560);
    const aim = GALLERY_AIM_AREA;
    const board = scene.add.zone(aim.x, aim.y, aim.width, aim.height).setInteractive(); root.add(board);
    const reticle = scene.add.graphics().lineStyle(2, 0xffc52a).strokeCircle(0, 0, 13);
    reticle.lineBetween(-22, 0, -8, 0).lineBetween(8, 0, 22, 0).lineBetween(0, -22, 0, -8).lineBetween(0, 8, 0, 22);
    reticle.fillStyle(0xe52b20).fillRect(-1, -1, 2, 2).setVisible(false); root.add(reticle);
    board.on('pointermove', (_p: Phaser.Input.Pointer, lx: number, ly: number) => {
      const p = galleryAimPoint(lx, ly); reticle.setPosition(p.x, p.y).setVisible(this.round.state === 'playing');
    });
    board.on('pointerout', () => reticle.setVisible(false));
    const announced = new Set<number>();
    const impact = (x: number, y: number, hit: boolean) => {
      const mark = scene.add.graphics().setPosition(x, y).lineStyle(3, hit ? 0xffc52a : 0xe52b20);
      mark.strokeCircle(0, 0, hit ? 11 : 18).lineBetween(-16, -16, 16, 16).lineBetween(-16, 16, 16, -16); root.add(mark);
      scene.tweens.add({ targets: mark, alpha: 0, scaleX: 1.8, scaleY: 1.8, duration: 210, onComplete: () => mark.destroy() });
      if (hit) for (let i = 0; i < 4; i++) {
        const chip = scene.add.graphics().fillStyle(i % 2 ? 0xf2d49a : 0x9b622d).fillRect(-3, -2, 6, 4).setPosition(x, y); root.add(chip);
        scene.tweens.add({ targets: chip, x: x + (i - 1.5) * 23, y: y - 28 + i % 2 * 55, angle: i * 70, alpha: 0, duration: 300, onComplete: () => chip.destroy() });
      }
    };
    const paint = () => {
      for (let slot = 0; slot < GALLERY_SLOTS; slot++) {
        const target = this.targets[slot];
        if (this.round.state === 'ready') { target.setBoss(slot + 1); target.pose(1, 1, false); continue; }
        const plate = this.round.plates.filter(p => p.slot === slot && p.bornAt <= this.round.elapsed).at(-1);
        if (!plate) {
          target.pose(this.round.elapsed < 230 && !this.round.finished ? Math.max(0, 1 - this.round.elapsed / 230) : 0, 1, false); continue;
        }
        target.setBoss(plate.boss);
        const pose = galleryPlatePose(plate, this.round.elapsed, this.round.endedAt);
        target.pose(pose.lift, pose.remaining, plate.hitAt !== undefined);
        if (!announced.has(plate.id) && this.round.state === 'playing' && pose.lift > .012) { announced.add(plate.id); sounds.playReload(); }
      }
      hits.setText(`HITS ${this.round.hits.size} / ${profile.targets}`);
      speed.setText(`SPEED ${profile.pace + 1 + Math.floor(this.round.hits.size / profile.targets * 2)}  •  ${Math.max(0, Math.ceil((profile.durationMs - (this.round.endedAt ?? this.round.elapsed)) / 1000))}s`);
      purse.setText(`BOUNTY $${this.round.hits.size * ECONOMY.gallery.perHit + (this.round.state === 'won' ? profile.perfectBonus : 0)} • XP ${this.round.hits.size * ECONOMY.gallery.xpPerHit}`);
      if (this.round.state === 'playing') status.setText(this.round.hits.size >= profile.pairAfter ? 'DOUBLE DRAWS • WATCH BOTH TIERS • ONE MISS ENDS IT' : 'DRAW WHEN THE BOARDS RISE • EACH HIT: $3 + 5 XP');
      else if (this.round.state === 'lost') { action.setText('ROUND LOST'); reticle.setVisible(false); status.setText(this.round.failure === 'miss' ? 'MISSED SHOT — ROUND OVER. Collect your earned bounty.' : this.round.failure === 'time' ? 'TIME UP — ROUND OVER. Collect your earned bounty.' : 'A BOARD ESCAPED — ROUND OVER. Collect your earned bounty.'); }
      else if (this.round.state === 'won') { action.setText('PERFECT ROUND!'); reticle.setVisible(false); status.setText(`ALL ${profile.targets} OUTLAWS DOWN • PERFECT BONUS +$${profile.perfectBonus} • COLLECT YOUR REWARD`); }
    };
    board.on('pointerdown', (_p: Phaser.Input.Pointer, lx: number, ly: number) => {
      if (this.round.state !== 'playing' || this.exited) return;
      const p = galleryAimPoint(lx, ly), plate = this.round.shoot(p.x, p.y);
      sounds.playRevolver(); impact(p.x, p.y, !!plate);
      if (plate) { scene.cameras.main.flash(55, 255, 197, 42, false); sounds.playCoin(); }
      else sounds.playRicochet();
      paint();
    });
    const update = (_time: number, delta: number) => { if (!this.exited) { this.round.tick(delta); paint(); } };
    paint(); scene.events.on('update', update);
    scene.events.once('shutdown', () => scene.events.off('update', update));
    bindPulpKeys(scene, { ESC: leave, ENTER: start });
  }
}
