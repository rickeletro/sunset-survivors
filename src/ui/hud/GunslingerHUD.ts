import type Phaser from 'phaser';
import { FRONTIER_FEEL, GunslingerStyle, HERO_STYLE } from '../../data/gunslingerStyle';
import { THEME } from '../theme/tokens';
/** Fixed-size HUD + one reusable world graphics layer. No emitters or snapshot sprites. */
export class GunslingerHUD {
  private root:Phaser.GameObjects.Container;private label:Phaser.GameObjects.Text;private chain:Phaser.GameObjects.Text;
  private route:Phaser.GameObjects.Text;private meter:Phaser.GameObjects.Graphics;private dust:Phaser.GameObjects.Graphics;private lastUpdate=-Infinity;private showRoute=true;
  private pickupText:Phaser.GameObjects.Text;private pickupUntil=-Infinity;private pickupStart=-Infinity;private pickupXp=0;private pickupCash=0;
  constructor(scene:Phaser.Scene,private style:GunslingerStyle,onDodge:()=>void){
    this.root=scene.add.container(18,172).setDepth(59).setScrollFactor(0);
    const paper=scene.add.graphics().fillStyle(0x321b10,.8).fillRect(0,0,235,68).lineStyle(1,0xc49a55).strokeRect(0,0,235,68);this.root.add(paper);
    this.label=scene.add.text(9,8,'',{fontFamily:THEME.typography.pixelFont,fontSize:'10px',color:'#ffc52a'});this.root.add(this.label);
    this.chain=scene.add.text(9,30,'',{fontFamily:THEME.typography.pixelFont,fontSize:'9px',color:'#f2d49a'});this.root.add(this.chain);
    this.meter=scene.add.graphics();this.root.add(this.meter);
    this.root.add(scene.add.zone(0,0,235,68).setOrigin(0,0).setInteractive({useHandCursor:true}).on('pointerdown',onDodge));
    this.route=scene.add.text(0,0,'',{fontFamily:THEME.typography.pixelFont,fontSize:'10px',color:'#f2d49a',stroke:'#120b08',strokeThickness:3,align:'center'}).setDepth(59).setScrollFactor(0).setOrigin(.5);
    this.dust=scene.add.graphics().setDepth(3);
    this.pickupText=scene.add.text(0,0,'',{fontFamily:THEME.typography.pixelFont,fontSize:'10px',color:'#ffc52a',stroke:'#120b08',strokeThickness:3}).setDepth(25).setOrigin(.5).setVisible(false);
    const resize=()=>{const scale=Math.min(1,scene.scale.width/1000),touch=scene.sys?.game.device.input.touch&&!scene.sys.game.device.os.desktop;this.root.setScale(scale).setPosition(touch?scene.scale.width-235*scale-18:18,touch?scene.scale.height-68*scale-16:172);this.showRoute=scene.scale.width>=900;this.route.setPosition(scene.scale.width/2,164).setScale(Math.min(1,scene.scale.width/1200));};
    resize();scene.scale.on('resize',resize);scene.events.once('shutdown',()=>scene.scale.off('resize',resize));
  }
  setRoute(text:string){this.route.setText(text);}
  pickup(xp:number,cash:number,now:number){
    if(now-this.pickupStart>600){this.pickupStart=now;this.pickupXp=0;this.pickupCash=0;}
    this.pickupXp+=xp;this.pickupCash+=cash;this.pickupUntil=now+650;
    this.pickupText.setText(`+${this.pickupXp} XP · +$${this.pickupCash}`);
  }
  update(now:number,x:number,y:number,hidden=false){
    this.root.setVisible(!hidden);this.route.setVisible(!hidden&&this.showRoute);this.dust.clear();this.pickupText.setVisible(!hidden&&now<this.pickupUntil).setPosition(x+35,y-42-(Number.isFinite(this.pickupStart)?now-this.pickupStart:0)*.01);if(hidden)return;
    const age=this.style.dashAge;
    if(age>=0&&age<380){const p=age/380;this.dust.lineStyle(2,0xffc52a,(1-p)*.7).strokeEllipse(x,y+20,35+p*(this.style.hero==='cormano'?195:85),12+p*30);for(let i=0;i<5;i++)this.dust.fillStyle(0xf2d49a,(1-p)*.45).fillRect(x+Math.cos(i*2.4)*(10+p*30),y+17+Math.sin(i*2.4)*9,4,3);}
    if(now-this.lastUpdate<100)return;this.lastUpdate=now;
    this.label.setText(this.style.ready>0?`DODGE ${(this.style.ready/1000).toFixed(1)}s`:'DODGE · SPACE / TAP');
    this.chain.setText(this.style.hot?'HOT STREAK · FAST LEAD':`${HERO_STYLE[this.style.hero].name}${this.style.traitActive?' · ACTIVE':this.style.streakCooldown>0?` · STREAK ${Math.ceil(this.style.streakCooldown/1000)}s`:` · ${this.style.chain}/${FRONTIER_FEEL.streak.kills}`}`);
    this.meter.clear().fillStyle(this.style.hot?0xe52b20:0xffc52a).fillRect(9,54,217*(this.style.ready>0?1-this.style.ready/FRONTIER_FEEL.dash.cooldown:1),4);
  }
}
