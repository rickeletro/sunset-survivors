import { RankingNameField } from '../ui/components/RankingNameField';
import { rankings, rankingName, survivalScore, type RankingEntry } from '../data/RankingManager';
import { normalizeDifficulty, difficultySettings, type DifficultyId } from '../data/difficulty';
import { preloadImages } from '../assets/registry';
import { preloadPulp, bindPulpMenu, bindPulpKeys } from '../ui/layout/pulpSceneKit';
import { GameOverView, GAME_OVER_LAYOUT } from '../ui/GameOverView';
import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { CharacterData, CHARACTERS } from '../data/characters';
import { statsManager } from '../data/GameStatsManager';
import { t } from '../i18n';

export interface GameOverStats {
  runId?: string;
  walletSynced?: boolean;
  earnedBounty?: number;
  victory?: boolean;
  character: CharacterData;
  timeSurvivedSeconds: number;
  kills: number;
  bounty: number;
  level: number;
  stage?: number;
  difficulty?: DifficultyId;
}

export class GameOverScene extends Phaser.Scene {
  private nameField?: RankingNameField;
  private rankingId = '';
  private submitted = false;
  private generation = 0;
  private leaving = false;
  private view!: GameOverView;
  private stats!: GameOverStats;


  constructor() {
    super('GameOverScene');
  }

  init(data?: Partial<GameOverStats>) {
    this.rankingId = data?.runId ?? (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
    this.submitted = false;
    this.leaving = false;
    this.stats = {
      runId: data?.runId, walletSynced: data?.walletSynced, earnedBounty: data?.earnedBounty,
      character: data?.character || CHARACTERS.billy,
      stage: data?.stage || 1,
      difficulty: normalizeDifficulty(data?.difficulty ?? difficultySettings.get()),
      timeSurvivedSeconds: data?.timeSurvivedSeconds ?? 0,
      kills: data?.kills ?? 0,
      bounty: data?.bounty ?? 0,
      level: data?.level ?? 1,
    };

    statsManager.recordRun(
      {
        runId: this.stats.runId, walletSynced: this.stats.walletSynced,
        score: survivalScore(this.stats.kills,this.stats.timeSurvivedSeconds,this.stats.difficulty),
        kills: this.stats.kills,
        gold: this.stats.earnedBounty ?? this.stats.bounty,
        timeSurvivedSeconds: this.stats.timeSurvivedSeconds,
        stage: this.stats.stage || 1,
      difficulty: this.stats.difficulty,
        stagesCleared: 0,
        level: this.stats.level,
        characterId: this.stats.character.id,
        rank: 'D',
      },
      false
    );
  }

  preload() { preloadPulp(this); preloadImages(this, ['menu_grave','hud_avatar_steve','hud_avatar_billy','hud_avatar_bob','hud_avatar_cormano']); }

  create() {
    sounds.stopBGM();sounds.playHit();
    this.generation++;
    this.events.once('shutdown',()=>{this.generation++;});
    this.view=new GameOverView(this,this.stats,statsManager.getStats().bank,{
      save:()=>{this.saveRanking();},retry:()=>this.retry(),title:()=>this.returnToTitle(),
    });
    const box=GAME_OVER_LAYOUT.input;
    this.nameField=new RankingNameField(this,this.view.root,box.y,()=>{this.saveRanking();},{...box,fontSize:24,autoFocus:false});
    this.submitted=!!rankings.find(this.rankingId);
    if(this.submitted){this.nameField.disable();this.view.saved();this.view.prompt.setText(t('gameOver.nameAlreadySaved'));}
    this.renderRanking();void this.refreshRanking();
    bindPulpMenu(this,[this.view.saveButton,this.view.retryButton,this.view.titleButton],false,this.submitted?1:0);
    bindPulpKeys(this,{R:()=>{if(!this.nameField?.isFocused())this.retry();},ESC:()=>{if(!this.nameField?.isFocused())this.returnToTitle();},N:()=>this.nameField?.focus()});
  }

  private currentEntry(): RankingEntry {
    return rankings.find(this.rankingId) ?? { runId:this.rankingId,name:rankingName(this.nameField?.value()??'')||'YOUR NAME',
      score:survivalScore(this.stats.kills,this.stats.timeSurvivedSeconds,this.stats.difficulty),kills:this.stats.kills,
      bounty:this.stats.earnedBounty??this.stats.bounty,seconds:this.stats.timeSurvivedSeconds,stage:this.stats.stage??1,
      level:this.stats.level,character:this.stats.character.id,difficulty:this.stats.difficulty??'normal' };
  }
  private renderRanking() {
    const current=this.currentEntry();
    this.view.renderRanking(rankings.list().slice(0,5),current,rankings.position(current),this.submitted);
  }
  private async refreshRanking() {
    const generation=this.generation;
    const online=await rankings.sync();
    if(generation!==this.generation||this.leaving)return;
    this.view.status.setText(online?'FRONTIER RECORDS · ONLINE':'LOCAL RECORDS · OFFLINE BACKUP');
    this.renderRanking();
  }
  private saveRanking(): boolean {
    if(this.leaving)return false;
    if(this.submitted)return true;
    const name=rankingName(this.nameField?.value()??'');
    if(!name){this.view?.prompt.setText('ENTER YOUR NAME TO CLAIM YOUR PLACE');this.nameField?.focus();return false;}
    const entry={...this.currentEntry(),name};
    this.submitted=rankings.submit(entry)||!!rankings.find(this.rankingId);
    if(!this.submitted){this.view.prompt.setText('COULD NOT SAVE. PLEASE TRY AGAIN.');return false;}
    this.nameField?.disable();this.view.saved();this.renderRanking();
    const position=rankings.position(entry);
    this.view.prompt.setText(position>5?`SAVED IN HISTORY · POSITION #${position}${position>100?'+':''}`:'YOUR NAME IS IN THE BOOKS, GUNSLINGER!');
    sounds.playLevelUp();void this.refreshRanking();
    return true;
  }

  private retry() {
    if(this.leaving)return;this.leaving=true;
    sounds.playGunReload();
    sounds.playGameplayMusic(this.stats.stage || 1);

    this.scene.start('WantedScene', {
      character: this.stats.character,
      stage: this.stats.stage || 1,
      difficulty: this.stats.difficulty,
    });
  }

  private returnToTitle() {
    if(this.leaving)return;this.leaving=true;
    sounds.playRevolver();
    sounds.playIntroMusic();

    this.scene.start('TitleScene');
  }

}
