import type Phaser from 'phaser';
import type { Enemy } from '../game/entities';
import type { StageTheme } from '../data/stages';
import { advanceFrontierEvent, frontierEvents, hitFrontierProp, type FrontierEvent } from '../data/frontierEvents';
import { worldDepth } from '../data/scenery';
import { sounds } from '../audio/SoundManager';
interface Hooks {
  spawn: (kind: 'knife_bandit' | 'rifle_guard', x: number, y: number) => Enemy | undefined;
  explode: (x: number, y: number, radius: number, damage: number) => void;
  banner: (text: string) => void;
}
/** Finite one-shot encounters, at most 25 props, 24 debris pieces and one thief per hub. */
export class FrontierEvents {
  private events;
  private views = new Map<FrontierEvent, Phaser.GameObjects.Container>();
  private thieves: { enemy: Enemy; sack: Phaser.GameObjects.Graphics; age: number }[] = [];
  private debris = 0;
  private elapsed = 0;
  constructor(private scene: Phaser.Scene, theme: StageTheme, private hooks: Hooks) {
    this.events = frontierEvents(theme);
    scene.events.once('shutdown', () => { this.views.forEach(v => v.destroy()); this.views.clear(); this.thieves.forEach(t => t.sack.destroy()); this.thieves = []; });
  }
  hit(ax: number, ay: number, bx: number, by: number, damage: number) {
    for (const e of this.events) if (hitFrontierProp(e, ax, ay, bx, by, damage)) sounds.playRicochet();
  }
  update(delta: number, x: number, y: number, blocked: boolean) {
    if (blocked) { this.thieves.forEach(t => { t.enemy.escapeAt = -1; t.sack.destroy(); }); this.thieves = []; return; }
    this.elapsed += delta;
    const ignited = new Set<FrontierEvent>();
    for (const e of this.events) {
      const distance = Math.hypot(x - e.x, y - e.y);
      const previousPhase = e.phase;
      const activated = advanceFrontierEvent(e, delta, distance, blocked);
      if (previousPhase === 'idle' && e.phase === 'warning') { this.views.get(e)?.destroy(); this.views.delete(e); }
      if (activated) {
        if (e.kind === 'ambush') {
          this.hooks.banner('AMBUSH! WATCH THE WINDOWS!');
          for (const side of [-1, 1]) {
            const enemy = this.hooks.spawn('rifle_guard', e.x + side * 105, e.y + 125);
            if (enemy) this.scene.tweens.add({ targets: enemy.sprite, alpha: { from: .2, to: 1 }, duration: 320 });
          }
          sounds.playBossWarning(); e.phase = 'done';
        } else {
          const enemy = this.hooks.spawn('knife_bandit', e.x, e.y);
          if (enemy) {
            enemy.fleeGoal = { x: Math.min(7800, e.x + 900), y: Math.min(7800, e.y + 280) };
            enemy.escapeAt = this.elapsed + 11000; enemy.speed = 175; enemy.bountyVal = 35;
            const sack = this.scene.add.graphics();
            sack.fillStyle(0x120b08).fillEllipse(0, 0, 27, 29).fillStyle(0x9b622d).fillEllipse(0, -2, 22, 24);
            sack.lineStyle(3, 0xffc52a).lineBetween(-6, -14, 5, -14);
            this.thieves.push({ enemy, sack, age: 0 }); this.hooks.banner('BOUNTY THIEF! CATCH THE GOLD SACK!');
          }
          e.phase = 'done';
        }
      }
      if (e.phase === 'done' || distance > 1000) { this.views.get(e)?.destroy(); this.views.delete(e); continue; }
      let view = this.views.get(e);
      if (!view) { view = this.createView(e); this.views.set(e, view); }
      if (e.phase === 'warning') { view.setAlpha(.7 + Math.sin(e.age / 80) * .3); view.setScale(1 + Math.sin(e.age / 110) * .04); }
      if (e.kind === 'cargo' || e.kind === 'powder') {
        view.setDepth(worldDepth(e.y));
        if (e.phase === 'active') {
          if (ignited.has(e)) continue;
          e.age += delta;
          const image = view.getAt(1) as Phaser.GameObjects.Image;
          image.setY(e.kind === 'cargo' ? -75 + Math.min(1, e.age / 520) ** 2 * 75 + 2.4 : 2.2);
          image.setAngle(e.kind === 'cargo' ? e.age / 24 : Math.sin(e.age / 20) * 5);
          if (e.age >= (e.kind === 'cargo' ? 520 : 240)) {
            e.phase = 'done'; this.hooks.explode(e.x, e.y, e.kind === 'cargo' ? 95 : 130, e.kind === 'cargo' ? 120 : 180);
            this.burst(e.x, e.y, e.kind === 'powder'); sounds.playExplosion(); view.destroy(); this.views.delete(e);
            // Bounded, delayed chain reactions: only nearby powder props can ignite.
            for (const other of this.events) if (other.kind === 'powder' && other.phase === 'idle' && Math.hypot(other.x - e.x, other.y - e.y) < 145) { other.phase = 'active'; other.age = 0; ignited.add(other); }
          }
        } else if (e.kind === 'cargo') (view.getAt(1) as Phaser.GameObjects.Image).setAngle(Math.sin(this.elapsed / 700 + e.x) * 3);
      }
    }
    this.thieves = this.thieves.filter(t => {
      if (t.enemy.dead || !t.enemy.sprite.active) { t.sack.destroy(); return false; }
      t.age += delta; t.sack.setPosition(t.enemy.sprite.x - 17, t.enemy.sprite.y + Math.sin(t.age / 85) * 3).setDepth(worldDepth(t.enemy.sprite.y) + .01);
      if (this.elapsed >= (t.enemy.escapeAt ?? Infinity)) t.enemy.escapeAt = -1;
      return true;
    });
  }
  private createView(e: FrontierEvent) {
    const view = this.scene.add.container(e.x, e.y).setDepth(worldDepth(e.y + (e.kind === 'ambush' ? 65 : 0)) + .02);
    const g = this.scene.add.graphics(); view.add(g);
    if (e.kind === 'cargo') {
      g.lineStyle(3, 0x120b08).lineBetween(-42, 0, -42, -125).lineBetween(42, 0, 42, -125).lineBetween(-42, -125, 42, -125);
      g.lineStyle(2, 0xc89827).lineBetween(0, -125, 0, -75);
      view.add(this.scene.add.image(0, -75, 'wm_crate').setOrigin(.5, 1).setScale(1.2));
      g.lineStyle(1, 0xffc52a, .7).strokeCircle(0, -105, 29);
    } else if (e.kind === 'powder') {
      g.fillStyle(0x120b08, .4).fillEllipse(4, 4, 38, 14);
      view.add(this.scene.add.image(0, 2.2, 'wm_barrel').setOrigin(.5, 1).setScale(1.1));
      const stripe = this.scene.add.graphics().fillStyle(0xa51e16).fillRect(-12, -26, 24, 12);
      stripe.lineStyle(2, 0xffc52a).lineBetween(-7, -25, 7, -15).lineBetween(7, -25, -7, -15); view.add(stripe);
    } else if (e.kind === 'thief') {
      g.fillStyle(0xc89827, .2).fillCircle(0, 0, 25).lineStyle(2, 0xffc52a).strokeCircle(0, 0, 25);
      g.fillStyle(0x9b622d).fillEllipse(0, -5, 22, 25).lineStyle(3, 0xffc52a).lineBetween(-6, -18, 6, -18);
      view.setVisible(e.phase === 'warning');
    } else {
      // Independent shutter leaves open during the warning; no facade sprite is stretched.
      g.fillStyle(0x120b08, .85).fillRect(-35, -28, 70, 48);
      for (const side of [-1, 1]) {
        const shutter = this.scene.add.graphics().fillStyle(0x603719).fillRect(-15, -24, 30, 48).lineStyle(2, 0xc89827).strokeRect(-15, -24, 30, 48);
        shutter.setPosition(side * 18, -4); view.add(shutter);
        if (e.phase === 'warning') this.scene.tweens.add({ targets: shutter, x: side * 48, angle: side * 12, duration: 650, ease: 'Cubic.easeOut' });
      }
    }
    return view;
  }
  private burst(x: number, y: number, fire: boolean) {
    for (let i = 0; i < 8 && this.debris < 24; i++) {
      this.debris++; const part = this.scene.add.graphics().fillStyle(fire ? 0xff791c : 0x9b622d).fillRect(-3, -3, 6, 6).setPosition(x, y).setDepth(18);
      const a = i * Math.PI / 4;
      this.scene.tweens.add({ targets: part, x: x + Math.cos(a) * 65, y: y + Math.sin(a) * 45 - 15, alpha: 0, angle: 180, duration: 500, onComplete: () => { part.destroy(); this.debris--; } });
    }
  }
}
