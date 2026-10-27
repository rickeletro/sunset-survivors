import type Phaser from 'phaser';
import { statsManager } from '../../data/GameStatsManager';
import { pulpText, pulpWood } from '../layout/pulpSceneKit';
import { THEME } from '../theme/tokens';

/** Persistent money, distinct from the cash available during combat. */
export class BankHUD {
  readonly label: Phaser.GameObjects.Text;
  constructor(scene: Phaser.Scene, root: Phaser.GameObjects.Container, y = -484) {
    const plate=pulpWood(scene,root,0,y,620,48);
    const trim=scene.add.graphics().lineStyle(2,0xffc52a,.9).strokeRect(-302,-20,604,40);
    plate.add(trim);
    this.label=pulpText(scene,plate,0,0,'',24,'#ffc52a').setFontFamily(THEME.typography.pixelFont);
    const refresh=()=>this.refresh();
    scene.events.on('resume',refresh);scene.events.on('wake',refresh);
    // Another tab can spend the bank while a menu is open.
    const changed=(event: StorageEvent)=>{if(event.key===null||event.key==='sunset_survivors_stats_v1')refresh();};
    globalThis.addEventListener?.('storage',changed);
    scene.events.once('shutdown',()=>{
      scene.events.off('resume',refresh);scene.events.off('wake',refresh);
      globalThis.removeEventListener?.('storage',changed);
    });
    this.refresh();
  }
  refresh() {
    statsManager.refresh();
    this.label.setText(`BANK $${statsManager.getStats().bank.toLocaleString('en-US')}`);
    this.label.setScale(1);
    if(this.label.width>570)this.label.setScale(570/this.label.width);
  }
}
