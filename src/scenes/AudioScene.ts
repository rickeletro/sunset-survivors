import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { createMenuRoot } from '../ui/layout/menuLayout';
import { preloadPulp, pulpBackdrop, pulpHeading, pulpText, pulpButton, bindPulpMenu, bindPulpKeys } from '../ui/layout/pulpSceneKit';
import { t } from '../i18n';
export class AudioScene extends Phaser.Scene {
  private fromScene = 'MenuScene';
  constructor() { super('AudioScene'); }
  init(data?: { fromScene?: string }) { this.fromScene = data?.fromScene ?? 'MenuScene'; }
  preload() { preloadPulp(this); }
  create() {
    const root = createMenuRoot(this); pulpBackdrop(this,root,true);
    pulpHeading(this,root,t('audio.title'),-360,1100,78,true);
    const buttons = [];
    const types: Array<'music' | 'sfx'> = ['music', 'sfx'];
    for (const [i, typeKey] of types.entries()) {
      const get = () => typeKey === 'music' ? sounds.getMusicVolume() : sounds.getSfxVolume();
      const label = typeKey === 'music' ? t('audio.music') : t('audio.sfx');
      const value = pulpText(this,root,0,-120+i*200,`${label} ${Math.round(get()*100)}%`,40,'#ffc52a');
      for (const [x,step] of [[-370,-.1],[370,.1]]) buttons.push(pulpButton(this,root,x,-120+i*200,step<0?'−':'+',() => {
        const n = Math.max(0,Math.min(1,get()+step));
        if (typeKey === 'music') sounds.setMusicVolume(n); else sounds.setSfxVolume(n);
        value.setText(`${label} ${Math.round(get()*100)}%`);
      },180));
    }
    const mute = pulpButton(this,root,0,270,sounds.getIsMuted()?t('audio.unmute'):t('audio.mute'),() => { sounds.toggleMute(); mute.setText(sounds.getIsMuted()?t('audio.unmute'):t('audio.mute')); },500); buttons.push(mute);
    buttons.push(pulpButton(this,root,0,400,t('common.back'),() => this.back(),500));
    bindPulpMenu(this,buttons); bindPulpKeys(this,{ ESC: () => this.back() });
  }
  private back() { this.scene.stop('AudioScene'); this.scene.resume(this.fromScene); }
}
