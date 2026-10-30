import type Phaser from 'phaser';
import type { GameOverStats } from '../scenes/GameOverScene';
import type { RankingEntry } from '../data/RankingManager';
import { difficultyProfile } from '../data/difficulty';
import { createMenuRoot } from './layout/menuLayout';
import { pulpPaper, pulpWood, pulpText } from './layout/pulpSceneKit';
import { WesternButton } from './components/WesternButton';
import { t } from '../i18n';

export const GAME_OVER_LAYOUT={width:1920,height:1080,left:{x:-330,y:40,width:620,height:640},right:{x:330,y:40,width:660,height:640},input:{x:330,y:250,width:568,height:54}} as const;
const ink='#321b10',gold='#ffc52a';
/** All material surfaces, portrait, numbers, rows and controls are independently rendered. */
export class GameOverView {
  readonly root: Phaser.GameObjects.Container;
  readonly saveButton: WesternButton;
  readonly retryButton: WesternButton;
  readonly titleButton: WesternButton;
  readonly prompt: Phaser.GameObjects.Text;
  readonly status: Phaser.GameObjects.Text;
  private rows: Phaser.GameObjects.Container;
  private right: Phaser.GameObjects.Container;
  constructor(private scene: Phaser.Scene, stats: GameOverStats, bank: number, actions:{save:()=>void;retry:()=>void;title:()=>void}) {
    this.root=createMenuRoot(scene,GAME_OVER_LAYOUT);
    const bg=scene.add.image(0,0,'intro_bkg');bg.setScale(Math.max(1920/bg.width,1080/bg.height));this.root.add(bg);
    const atmosphere=scene.add.graphics();
    for(const x of [-850,850])for(const [radius,alpha] of [[90,.035],[58,.07],[29,.12]])atmosphere.fillStyle(0xffc52a,alpha).fillCircle(x,-315,radius);
    this.root.add(atmosphere);scene.tweens.add({targets:atmosphere,alpha:.45,duration:1900,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
    const vulture=scene.add.image(-800,65,'menu_grave');vulture.setScale(Math.min(300/vulture.width,660/vulture.height));this.root.add(vulture);
    this.header();
    const left=this.panel(GAME_OVER_LAYOUT.left,t('gameOver.lastStand'));
    this.leftReport(left,stats,bank);
    this.right=this.panel(GAME_OVER_LAYOUT.right,t('gameOver.hallOfFame'));
    this.rows=scene.add.container(0,0);this.right.add(this.rows);
    this.status=pulpText(scene,this.right,0,143,t('gameOver.loadingRecords'),17,gold);
    this.prompt=pulpText(scene,this.right,0,166,t('gameOver.enterNamePrompt'),22,'#f2d49a');this.fit(this.prompt,580);
    this.right.add(scene.add.graphics().fillStyle(0x120b08,.96).fillRect(-289,181,578,59).lineStyle(2,0xc49a55).strokeRect(-289,181,578,59));
    this.saveButton=new WesternButton(scene,{x:0,y:274,width:584,height:64,text:t('gameOver.saveToHallOfFame'),fontSize:'25px',presentation:'pulp',onClick:actions.save});this.right.add(this.saveButton);
    this.retryButton=new WesternButton(scene,{x:-330,y:437,width:625,height:92,text:t('gameOver.retry'),fontSize:'36px',presentation:'pulp',onClick:actions.retry});
    this.titleButton=new WesternButton(scene,{x:330,y:437,width:625,height:92,text:t('gameOver.backToTitle'),fontSize:'36px',presentation:'pulp',onClick:actions.title});
    this.root.add([this.retryButton,this.titleButton]);
    const arrow=scene.add.graphics().lineStyle(5,0xffc52a).strokeCircle(-150,0,19).fillStyle(0x120b08).fillRect(-151,-24,27,19).fillStyle(0xffc52a).fillPoints([{x:-151,y:-24},{x:-132,y:-16},{x:-151,y:-7}],true);this.retryButton.add(arrow);
    const home=scene.add.graphics().fillStyle(0xffc52a).fillPoints([{x:-237,y:1},{x:-214,y:-20},{x:-191,y:1}],true).fillRect(-231,0,34,23).fillStyle(0x603719).fillRect(-219,7,10,16);this.titleButton.add(home);
    for(const [target,delay] of [[left,80],[this.right,180]] as const){target.setAlpha(0);scene.tweens.add({targets:target,alpha:1,duration:380,delay,ease:'Quad.easeOut'});}
  }
  private fit(label: Phaser.GameObjects.Text,width: number){if(label.width>width)label.setScale(width/label.width);return label;}
  private frame(root: Phaser.GameObjects.Container,width: number,height: number) {
    const g=this.scene.add.graphics();g.lineStyle(3,0x120b08).strokeRect(-width/2+7,-height/2+7,width-14,height-14);
    g.lineStyle(2,0xc49a55).strokeRect(-width/2+11,-height/2+11,width-22,height-22);
    for(const x of [-width/2+18,width/2-18])for(const y of [-height/2+18,height/2-18]){
      g.fillStyle(0x120b08).fillRect(x-9,y-9,18,18);g.fillStyle(0x603719).fillRect(x-7,y-7,14,14);
      g.fillStyle(0xffc52a).fillCircle(x,y,5);g.fillStyle(0xf2d49a).fillRect(x-3,y-3,3,3);
    }
    root.add(g);
  }
  private panel(box:{x:number;y:number;width:number;height:number},title: string) {
    const panel=pulpWood(this.scene,this.root,box.x,box.y,box.width,box.height);this.frame(panel,box.width,box.height);
    panel.add(this.scene.add.graphics().fillStyle(0xa51e16,.85).fillRect(-box.width/2+82,-295,box.width-164,52));
    this.fit(pulpText(this.scene,panel,0,-270,title,43,'#f2d49a'),box.width-120);
    for(const x of [-box.width/2+53,box.width/2-53])this.star(panel,x,-270,10);
    return panel;
  }
  private star(root:Phaser.GameObjects.Container,x:number,y:number,r:number) {
    const points=Array.from({length:10},(_,i)=>{const angle=i*Math.PI/5-Math.PI/2,size=i%2?r*.42:r;return{x:x+Math.cos(angle)*size,y:y+Math.sin(angle)*size};});
    root.add(this.scene.add.graphics().fillStyle(0xffc52a).fillPoints(points,true));
  }
  private gun(root:Phaser.GameObjects.Container,x:number,y:number,flip=false) {
    const node=this.scene.add.container(x,y),g=this.scene.add.graphics();node.add(g);root.add(node);node.setScale(flip?-2:2,2);
    // Native pixel clusters: blued steel, silver barrel ribs, brass trigger and engraved walnut grip.
    g.fillStyle(0x120b08).fillPoints([{x:0,y:0},{x:55,y:0},{x:55,y:-3},{x:66,y:-3},{x:70,y:4},{x:77,y:8},{x:77,y:21},{x:69,y:25},{x:77,y:44},{x:73,y:49},{x:59,y:47},{x:53,y:28},{x:46,y:25},{x:45,y:15},{x:0,y:15}],true);
    for(const [color,rects]of [
      [0x4f5455,[[2,3,53,9],[46,9,24,15],[57,1,8,7],[68,10,6,9]]],
      [0xaeb7b5,[[2,3,54,5],[48,8,20,4],[48,13,19,8],[60,0,4,3]]],
      [0xe8e5d0,[[3,3,51,2],[49,8,16,2],[50,14,3,5]]],
      [0x252b2c,[[3,11,43,2],[46,12,3,11],[54,14,2,7],[62,13,2,7],[67,9,2,13]]],
      [0x8f5128,[[59,24,9,6],[61,30,9,6],[63,36,10,8],[63,44,9,2]]],
      [0xd18a42,[[61,26,3,8],[65,35,3,7],[65,43,5,2]]],
      [0x452417,[[68,27,3,7],[70,34,3,8],[61,29,2,6],[63,36,2,6]]],
      [0xc49a55,[[46,23,14,2],[47,25,2,6],[49,30,11,2],[59,25,2,6],[54,24,2,4]]],
      [0xffc52a,[[65,29,2,2],[68,40,2,2],[59,11,2,2]]],
    ]as[number,number[][]][]){g.fillStyle(color);for(const [rx,ry,w,h]of rects)g.fillRect(rx,ry,w,h);}
    g.lineStyle(1,0x603719);
    for(let i=0;i<4;i++)g.lineBetween(62+i,28+i*3,68+i,30+i*3);
    g.lineStyle(1,0xf2d49a).lineBetween(8,7,40,7).lineBetween(50,11,64,11);
  }
  private header() {
    const header=pulpWood(this.scene,this.root,0,-408,1180,180);this.frame(header,1180,180);
    this.gun(header,-550,-33);this.gun(header,550,-33,true);
    const title=this.fit(pulpText(this.scene,header,0,-15,t('gameOver.title'),132,'#a51e16'),750);title.setStroke('#ffc52a',6);
    pulpText(this.scene,header,0,64,t('gameOver.subtitle'),25,'#f2d49a');
    for(const x of [-520,520])this.star(header,x,52,9);
    header.setScale(.96);this.scene.tweens.add({targets:header,scaleX:1,scaleY:1,duration:400,ease:'Back.easeOut'});
  }
  private leftReport(panel:Phaser.GameObjects.Container,stats:GameOverStats,bank:number) {
    pulpPaper(this.scene,panel,0,30,572,526);
    const portraitKey=`hud_avatar_${stats.character.id}`;
    const portrait=this.scene.add.image(-188,-94,portraitKey);portrait.setScale(Math.min(150/portrait.width,177/portrait.height));panel.add(portrait);
    panel.add(this.scene.add.graphics().lineStyle(2,0x603719).strokeRect(-270,-185,164,183));
    const minutes=Math.floor(stats.timeSurvivedSeconds/60),seconds=Math.floor(stats.timeSurvivedSeconds%60);
    const report=[
      [t('gameOver.gunslinger'),stats.character.name.toUpperCase()],
      [t('gameOver.stageLevel'),`${stats.stage} / ${stats.level}`],
      [t('gameOver.survived'),`${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`],
      [t('gameOver.kills'),stats.kills.toLocaleString('en-US')],
      [t('gameOver.difficulty'),difficultyProfile(stats.difficulty).label]
    ];
    let killsLabel:Phaser.GameObjects.Text|undefined;
    report.forEach(([label,value],index)=>{
      const y=-163+index*42;
      this.statIcon(panel,-98,y,index);
      pulpText(this.scene,panel,-80,y,label,19,ink,'left').setStroke(ink,0);
      const text=this.fit(pulpText(this.scene,panel,260,y,value,24,ink,'right').setStroke(ink,0),145);
      if(label===t('gameOver.kills'))killsLabel=text;
      panel.add(this.scene.add.graphics().fillStyle(0x603719,.25).fillRect(-88,y+18,350,1));
    });
    panel.add(this.scene.add.graphics().fillStyle(0xa51e16).fillRect(-264,66,528,48));
    pulpText(this.scene,panel,0,90,t('gameOver.rewards'),32,'#f2d49a');this.star(panel,-125,90,8);this.star(panel,125,90,8);
    this.coin(panel,-240,155);pulpText(this.scene,panel,-204,155,t('gameOver.coinsSecured'),25,ink,'left').setStroke(ink,0);
    this.coin(panel,-240,225);pulpText(this.scene,panel,-204,225,t('gameOver.totalBank'),25,ink,'left').setStroke(ink,0);
    for(const y of [155,225])panel.add(this.scene.add.graphics().fillStyle(0x321b10,.95).fillRect(105,y-23,156,46));
    const coins=stats.earnedBounty??stats.bounty;
    const earned=this.fit(pulpText(this.scene,panel,249,155,`+${coins.toLocaleString('en-US')}`,31,gold,'right'),142);
    const balance=this.fit(pulpText(this.scene,panel,249,225,`$${bank.toLocaleString('en-US')}`,31,gold,'right'),142);
    const count={progress:0};
    this.scene.tweens.add({targets:count,progress:1,duration:650,delay:200,ease:'Cubic.easeOut',onUpdate:()=>{
      killsLabel?.setText(Math.floor(stats.kills*count.progress).toLocaleString('en-US'));
      earned.setText(`+${Math.floor(coins*count.progress).toLocaleString('en-US')}`);
      balance.setText(`$${Math.floor(bank*count.progress).toLocaleString('en-US')}`);
    },onComplete:()=>{killsLabel?.setText(stats.kills.toLocaleString('en-US'));earned.setText(`+${coins.toLocaleString('en-US')}`);balance.setText(`$${bank.toLocaleString('en-US')}`);}});
  }
  private statIcon(root:Phaser.GameObjects.Container,x:number,y:number,index:number){
    const g=this.scene.add.graphics().fillStyle(0x603719).lineStyle(2,0x603719);root.add(g);
    if(index===2){g.strokeCircle(x,y,7).lineBetween(x,y,x,y-4).lineBetween(x,y,x+4,y+2).fillRect(x-3,y-11,6,3);}
    else if(index===3){for(let i=0;i<3;i++)g.fillRect(x-7+i*6,y-6,3,12);}
    else if(index===4){g.strokeRect(x-6,y-6,12,14).fillRect(x-3,y-10,6,4).fillRect(x-1,y-3,2,7);}
    else if(index===1){g.fillRect(x-7,y-6,14,4).fillRect(x-2,y-8,4,17);}
    else {g.fillRect(x-8,y-5,15,4).fillRect(x+1,y-1,5,8);}
  }
  private coin(root:Phaser.GameObjects.Container,x:number,y:number){
    root.add(this.scene.add.graphics().fillStyle(0x321b10).fillCircle(x,y,19).fillStyle(0xffc52a).fillCircle(x,y,16).lineStyle(2,0xf2d49a).strokeCircle(x,y,12));
    pulpText(this.scene,root,x,y,'$',22,ink).setStroke(ink,0);
  }
  renderRanking(entries:RankingEntry[],current:RankingEntry,position:number,saved:boolean) {
    this.rows.removeAll(true);
    for(const [x,label,align]of [
      [-268,t('gameOver.rankHeader'),'center'],
      [-216,t('gameOver.nameHeader'),'left'],
      [160,t('gameOver.scoreHeader'),'right'],
      [278,t('gameOver.stageHeader'),'right']
    ] as const) pulpText(this.scene,this.rows,x,-215,label,20,'#f2d49a',align);
    for(let i=0;i<5;i++) {
      const row=entries[i],y=-166+i*48,selected=row?.runId===current.runId;
      const bg=this.scene.add.graphics().fillStyle(selected?0x603719:0x120b08,selected?.96:.8).fillRect(-296,y-22,592,44);
      bg.lineStyle(selected?2:1,selected?0xffc52a:0x603719).strokeRect(-296,y-22,592,44);this.rows.add(bg);
      const color=selected?gold:'#f2d49a';
      if(i<3){const medal=[0xffc52a,0xbfc4c8,0xb46a31][i];this.rows.add(this.scene.add.graphics().fillStyle(0x120b08).fillCircle(-268,y,19).fillStyle(medal).fillCircle(-268,y,16).lineStyle(2,0xf2d49a).strokeCircle(-268,y,12));}
      pulpText(this.scene,this.rows,-268,y,String(i+1),26,i<3?ink:color);
      this.fit(pulpText(this.scene,this.rows,-216,y,row?.name??'—',25,color,'left'),235);
      this.fit(pulpText(this.scene,this.rows,160,y,row?row.score.toLocaleString('en-US'):'—',25,color,'right'),125);
      pulpText(this.scene,this.rows,278,y,row?String(row.stage):'—',25,color,'right');
    }
    this.rows.add(this.scene.add.graphics().fillStyle(0x603719,.97).fillRect(-296,72,592,48).lineStyle(2,0xffc52a).strokeRect(-296,72,592,48));
    pulpText(this.scene,this.rows,-268,96,`#${position}${position>100?'+':''}`,25,gold);
    this.fit(pulpText(this.scene,this.rows,-216,96,saved?current.name:t('gameOver.defaultPlayerName'),25,gold,'left'),235);
    this.fit(pulpText(this.scene,this.rows,160,96,current.score.toLocaleString('en-US'),25,gold,'right'),125);
    pulpText(this.scene,this.rows,278,96,String(current.stage),25,gold,'right');
  }
  saved(){this.saveButton.setText(t('gameOver.savedToHallOfFame'));this.saveButton.setEnabled(false);this.scene.tweens.add({targets:this.rows,alpha:.5,duration:140,yoyo:true,repeat:2});}
}
