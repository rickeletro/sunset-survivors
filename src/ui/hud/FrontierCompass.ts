import type Phaser from 'phaser';
import { compassLayout, compassMarkers, projectCompassPoint } from '../../data/frontierCompass';
import type { SaloonVisit } from '../../data/saloon';
import { THEME } from '../theme/tokens';
/** A bounded, north-up radar. No render texture, secondary camera, shaders or per-frame tweens. */
export class FrontierCompass {
  readonly root: Phaser.GameObjects.Container;
  private dots: Phaser.GameObjects.Graphics;
  private lastUpdate = -Infinity;
  constructor(scene: Phaser.Scene) {
    this.root = scene.add.container(0,0).setScrollFactor(0).setDepth(60);
    const frame = scene.add.graphics(); this.root.add(frame);
    frame.setAlpha(.65);
    frame.fillStyle(0x321b10,.28).fillCircle(0,0,91);
    frame.lineStyle(3,0xc49a55).strokeCircle(0,0,91);
    frame.fillStyle(0xf2d49a,.09).fillCircle(0,0,80);
    frame.lineStyle(1,0xf2d49a,.18).strokeCircle(0,0,38).strokeCircle(0,0,76);
    frame.lineBetween(-76,0,76,0).lineBetween(0,-76,0,76);
    for (let i=0;i<24;i++) {
      const a=i*Math.PI/12, inner=i%6===0?81:85;
      frame.lineStyle(1,0xffc52a,i%6===0?.8:.3).lineBetween(Math.cos(a)*inner,Math.sin(a)*inner,Math.cos(a)*89,Math.sin(a)*89);
    }
    const label = (x: number,y: number,text: string,color='#f2d49a',size=11) => {
      const node=scene.add.text(x,y,text,{ fontFamily:THEME.typography.pixelFont,fontSize:`${size}px`,color,stroke:'#120b08',strokeThickness:2 }).setOrigin(.5); this.root.add(node); return node;
    };
    label(0,-96,'N','#ffc52a'); label(97,0,'E'); label(0,95,'S'); label(-97,0,'W');
    this.dots = scene.add.graphics(); this.root.add(this.dots);
    // Player stays above every activity marker.
    const player = scene.add.graphics().fillStyle(0x120b08).fillCircle(0,0,8);
    player.fillStyle(0xffffff).fillTriangle(0,-7,-5,5,5,5); this.root.add(player);
    const resize=() => { const p=compassLayout(scene.scale.width,scene.scale.height); this.root.setPosition(p.x,p.y).setScale(p.scale); };
    resize(); scene.scale.on('resize',resize);
    scene.events.once('shutdown',() => { scene.scale.off('resize',resize); this.root.destroy(); });
  }
  update(visit: SaloonVisit | undefined, x: number,y: number, now: number,hidden=false,objective?:Readonly<{x:number;y:number;contract?:boolean}>): void {
    this.root.setVisible(!hidden && (!!visit?.doors.length||!!objective));
    if ((!visit&&!objective) || hidden || now>=this.lastUpdate && now-this.lastUpdate<100) return;
    this.lastUpdate=now; this.dots.clear();
    if(objective){const m=projectCompassPoint(objective.x,objective.y,x,y),r=objective.contract?6:5,color=objective.contract?0xff791c:0xffc52a;
      this.dots.lineStyle(2,color).strokeRect(m.x-r,m.y-r,r*2,r*2);this.dots.fillStyle(color).fillCircle(m.x,m.y,2);
    }
    for (const m of visit?compassMarkers(visit,x,y):[]) {
      const color = m.used?0x786958:m.door.activity==='hospitality'?0x8bdd78:m.door.activity==='gallery'?0xe52b20:0xffc52a;
      this.dots.fillStyle(0x120b08,.9).fillCircle(m.x,m.y,6);
      this.dots.lineStyle(1,color,m.used?.4:1);
      if (m.nearby&&!m.used) this.dots.strokeCircle(m.x,m.y,7+(Math.sin(now/180)+1)*2);
      if (m.edge) {
        const a=Math.atan2(m.y,m.x), p=.7;
        this.dots.fillStyle(color,1).fillTriangle(m.x+Math.cos(a)*5,m.y+Math.sin(a)*5,m.x+Math.cos(a+Math.PI-p)*5,m.y+Math.sin(a+Math.PI-p)*5,m.x+Math.cos(a+Math.PI+p)*5,m.y+Math.sin(a+Math.PI+p)*5);
      } else if (m.door.activity==='hospitality') this.dots.fillStyle(color,m.used?.45:1).fillRect(m.x-3,m.y-3,6,6);
      else {
        this.dots.fillStyle(color,m.used?.45:1).fillCircle(m.x,m.y,m.door.activity==='gallery'?4:3);
        if (m.door.activity==='gallery') this.dots.strokeCircle(m.x,m.y,6);
      }
    }
  }
}
