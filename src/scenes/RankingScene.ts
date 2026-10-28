import { sounds } from '../audio/SoundManager';
import Phaser from 'phaser';
import { rankings } from '../data/RankingManager';
import { createMenuRoot } from '../ui/layout/menuLayout';
import { preloadPulp, pulpBackdrop, pulpHeading, pulpPaper, pulpText, pulpButton, bindPulpKeys, bindPulpMenu } from '../ui/layout/pulpSceneKit';
export class RankingScene extends Phaser.Scene {
  private fromScene = 'TitleScene';
  private page = 0;
  private generation = 0;
  private online = false;
  private status!: Phaser.GameObjects.Text;
  private rows!: Phaser.GameObjects.Container;
  constructor() { super('RankingScene'); }
  init(data?: { fromScene?: string }) { this.fromScene = data?.fromScene ?? 'TitleScene'; this.page = 0; }
  preload() { preloadPulp(this); }
  create() {
    const root = createMenuRoot(this); pulpBackdrop(this, root, true);
    pulpHeading(this, root, 'FRONTIER HALL OF FAME', -390, 1400, 64, true);
    this.status=pulpText(this, root, 0, -285, 'CONNECTING TO THE FRONTIER…', 23, '#ffc52a');
    this.rows = pulpPaper(this, root, 0, 25, 1400, 540); this.renderRows();
    const buttons = [
      pulpButton(this,root,-525,410,'PREVIOUS',()=>this.turn(-1),300),
      pulpButton(this,root,-175,410,'BACK',()=>this.back(),300),
      pulpButton(this,root,175,410,'REFRESH',()=>{ void this.refresh(); },300),
      pulpButton(this,root,525,410,'NEXT',()=>this.turn(1),300),
    ];
    bindPulpMenu(this, buttons, true, 1); bindPulpKeys(this, { ESC: () => this.back(), R: () => { void this.refresh(); } });
    this.generation++; this.online=false;
    this.events.once('shutdown',()=>{ this.generation++; });
    void this.refresh();
  }
  private async refresh() {
    const generation=this.generation;
    this.status.setText('CONNECTING TO THE FRONTIER…');
    const online=await rankings.sync();
    if (generation!==this.generation) return;
    this.online=online;
    this.status.setText(online?'SERVER RANKING • KILLS / SURVIVAL / WAVES / DIFFICULTY':'OFFLINE • YOUR SCORE IS SAFE • REFRESH TO RETRY');
    this.page=Math.min(this.page,Math.max(0,Math.ceil(rankings.list().length/7)-1)); this.renderRows();
  }

  private turn(delta: number) { this.page = Math.max(0, Math.min(Math.max(0, Math.ceil(rankings.list().length/7)-1), this.page+delta)); this.renderRows(); }
  private renderRows() {
    // Preserve the single parchment surface while replacing table labels.
    for (const child of this.rows.list.slice(1)) child.destroy();
    pulpText(this, this.rows, -650, -220, '#    GUNSLINGER', 24, '#a51e16', 'left');
    pulpText(this, this.rows, 190, -220, 'SCORE', 24, '#a51e16');
    pulpText(this, this.rows, 510, -220, 'STAGE / MODE', 24, '#a51e16');
    const entries = rankings.list().slice(this.page*7, this.page*7+7);
    if (!entries.length) pulpText(this, this.rows, 0, 0, 'NO LEGENDS YET. WRITE YOUR NAME IN HISTORY.', 28, '#120b08');
    entries.forEach((e,i) => {
      const y = -155+i*57;
      pulpText(this, this.rows, -650, y, `${this.page*7+i+1}.  ${e.name}`, 27, '#120b08', 'left');
      pulpText(this, this.rows, 190, y, e.score.toLocaleString(), 27, '#a51e16');
      pulpText(this, this.rows, 510, y, `${e.stage} / ${e.difficulty.toUpperCase()}`, 22, '#120b08');
    });
    pulpText(this, this.rows, 0, 235, `PAGE ${this.page+1} • ${this.online?'SAVED ON THE SERVER':'LOCAL BACKUP'}`, 20, '#603719');
  }
  private back() {
    if (this.fromScene==='MenuScene') { this.scene.stop('RankingScene'); this.scene.resume('MenuScene'); }
    else { if (this.fromScene==='GameOverScene') this.scene.stop('GameOverScene'); sounds.playIntroMusic(); this.scene.start('TitleScene'); }
  }
}
