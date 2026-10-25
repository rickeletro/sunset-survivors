import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { createMenuRoot } from '../ui/layout/menuLayout';
import { preloadPulp, pulpBackdrop, pulpHeading, pulpText, pulpButton, bindPulpMenu, bindPulpKeys } from '../ui/layout/pulpSceneKit';
export class AudioScene extends Phaser.Scene {
  private fromScene = 'MenuScene';
  constructor() { super('AudioScene'); }
  init(data?: { fromScene?: string }) { this.fromScene = data?.fromScene ?? 'MenuScene'; }
  preload() { preloadPulp(this); }
  create() {
    const root = createMenuRoot(this); pulpBackdrop(this,root,true);
    pulpHeading(this,root,'SALOON SOUND',-360,1100,78,true);
    const buttons = [];
    for (const [i,label] of ['MUSIC','SFX'].entries()) {
      const get = () => label === 'MUSIC' ? sounds.getMusicVolume() : sounds.getSfxVolume();
      const value = pulpText(this,root,0,-120+i*200,`${label} ${Math.round(get()*100)}%`,40,'#ffc52a');
      for (const [x,step] of [[-370,-.1],[370,.1]]) buttons.push(pulpButton(this,root,x,-120+i*200,step<0?'−':'+',() => {
        const n = Math.max(0,Math.min(1,get()+step));
        if (label === 'MUSIC') sounds.setMusicVolume(n); else sounds.setSfxVolume(n);
        value.setText(`${label} ${Math.round(get()*100)}%`);
      },180));
    }
    const mute = pulpButton(this,root,0,270,sounds.getIsMuted()?'UNMUTE':'MUTE',() => { sounds.toggleMute(); mute.setText(sounds.getIsMuted()?'UNMUTE':'MUTE'); },500); buttons.push(mute);
    buttons.push(pulpButton(this,root,0,400,'BACK',() => this.back(),500));
    bindPulpMenu(this,buttons); bindPulpKeys(this,{ ESC: () => this.back() });
  }
  private back() { this.scene.stop('AudioScene'); this.scene.resume(this.fromScene); }
}
