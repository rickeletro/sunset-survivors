import Phaser from 'phaser';
import { statsManager } from '../data/GameStatsManager';
import { sounds } from '../audio/SoundManager';
import { createMenuRoot } from '../ui/layout/menuLayout';
import { preloadPulp, pulpBackdrop, pulpHeading, pulpText, pulpButton, bindPulpMenu, bindPulpKeys } from '../ui/layout/pulpSceneKit';
import type { WesternButton } from '../ui/components/WesternButton';
import { t } from '../i18n';

/** Guest progression stays on this browser; portable saves need no account or password. */
export class ProgressScene extends Phaser.Scene {
  private fromScene = 'MenuScene';
  private duringRun = false;
  private pending?: string;
  private message!: Phaser.GameObjects.Text;
  private balance!: Phaser.GameObjects.Text;
  private confirm!: WesternButton;
  private picker?: HTMLInputElement;
  private downloadUrl?: string;
  constructor() { super('ProgressScene'); }
  init(data?: { fromScene?: string; duringRun?: boolean }) {
    this.fromScene=data?.fromScene ?? 'MenuScene';this.duringRun=!!data?.duringRun;this.pending=undefined;
  }
  preload() { preloadPulp(this); }
  create() {
    const root=createMenuRoot(this);pulpBackdrop(this,root,true);
    pulpHeading(this,root,t('progress.title'),-365,1200,70,true);
    this.balance=pulpText(this,root,0,-220,'',34,'#ffc52a');this.refresh();
    pulpText(this,root,0,-130,t('progress.autoSaved'),24);
    pulpText(this,root,0,-80,t('progress.autoSavedDesc'),23).setWordWrapWidth(1100);
    const buttons=[
      pulpButton(this,root,-300,50,t('progress.exportSave'),()=>this.exportSave(),540,true),
      pulpButton(this,root,300,50,t('progress.importSave'),()=>this.chooseFile(),540).setEnabled(!this.duringRun),
    ];
    this.message=pulpText(this,root,0,162,this.duringRun?t('progress.finishRunNotice'):t('progress.noAccountNotice'),23).setWordWrapWidth(1150);
    this.confirm=pulpButton(this,root,0,270,t('progress.replaceProgress'),()=>this.confirmImport(),700).setEnabled(false);buttons.push(this.confirm);
    buttons.push(pulpButton(this,root,0,400,t('common.back'),()=>this.back(),540));
    bindPulpMenu(this,buttons);bindPulpKeys(this,{ESC:()=>this.back()});
    this.events.once('shutdown',()=>{this.picker?.remove();this.picker=undefined;if(this.downloadUrl)URL.revokeObjectURL(this.downloadUrl);this.downloadUrl=undefined;this.pending=undefined;});
  }
  private refresh() {
    statsManager.refresh();const save=statsManager.getStats();
    this.balance.setText(t('progress.bankStatus', { bank: save.bank.toLocaleString(), count: save.unlockedCharacters.length }));
  }
  private exportSave() {
    try {
      if(this.downloadUrl)URL.revokeObjectURL(this.downloadUrl);
      this.downloadUrl=URL.createObjectURL(new Blob([statsManager.exportProgress()],{type:'application/json'}));
      const link=document.createElement('a');link.href=this.downloadUrl;link.download='sunset-survivors-save.json';
      document.body.appendChild(link);link.click();link.remove();
      this.message.setText(t('progress.exportSuccess'));
    } catch {this.message.setText(t('progress.exportError'));}
  }
  private chooseFile() {
    if(this.duringRun)return;
    this.pending=undefined;this.confirm.setEnabled(false);this.picker?.remove();
    const picker=document.createElement('input');this.picker=picker;picker.type='file';picker.accept='.json,application/json';picker.style.display='none';
    picker.addEventListener('change',async()=>{
      const file=picker.files?.[0];if(!file)return;
      if(file.size>5_000_000){this.message.setText('Save file is too large.');return;}
      try {
        const content=await file.text();
        if(this.picker!==picker || !this.scene.isActive())return;
        const data=JSON.parse(content);
        if(data?.game!=='sunset-survivors'||data.version!==1||!Number.isSafeInteger(data.stats?.bank)||data.stats.bank<0)throw Error('invalid');
        this.pending=content;this.confirm.setEnabled(true);
        this.message.setText(`BACKUP BANK $${data.stats.bank.toLocaleString()}\nConfirm below to replace this browser's progress. This does not merge saves.`);
      } catch {if(this.picker===picker)this.message.setText('Invalid save file. Your local progress was not changed.');}
    });
    document.body.appendChild(picker);picker.click();
  }
  private confirmImport() {
    if(this.duringRun||!this.pending)return;
    const result=statsManager.importProgress(this.pending);this.pending=undefined;this.confirm.setEnabled(false);
    this.message.setText(result==='saved'?'PROGRESS RESTORED. Ready for your next ride!':result==='save-failed'?'Could not save in this browser. Previous progress was kept.':'Invalid save file. Previous progress was kept.');
    if(result==='saved'){sounds.playLevelUp();this.refresh();}
  }
  private back(){this.scene.stop('ProgressScene');this.scene.resume(this.fromScene);}
}
