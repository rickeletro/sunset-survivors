import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameScene } from './GameScene';
import { StageClearScene } from './StageClearScene';
import { WantedScene } from './WantedScene';
import { GameOverScene } from './GameOverScene';
import { PauseScene } from './PauseScene';
import { statsManager, GameStatsManager } from '../data/GameStatsManager';
import { CHARACTERS } from '../data/characters';
import { bankReward } from '../data/economy';
vi.mock('phaser',()=>({default:{Scene:class{},GameObjects:{Container:class{}},Events:{EventEmitter:class{}}}}));
vi.mock('../audio/SoundManager',()=>({sounds:{stopBGM:vi.fn(),playRevolver:vi.fn(),playIntroMusic:vi.fn(),playLevelUp:vi.fn()}}));
afterEach(()=>vi.unstubAllGlobals());
function storage() {
 const values=new Map();vi.stubGlobal('localStorage',{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)});
 statsManager.refresh();return values;
}
function game(developer=false) {
 const g=Object.create(GameScene.prototype);
 Object.assign(g,{developerTest:developer,runId:'wallet-run',stage:1,character:CHARACTERS.billy,difficulty:'normal',kills:0,gameTimeSeconds:0,level:1,
  bountyText:{setText:vi.fn()},showBanner:vi.fn(),cameras:{main:{fade:vi.fn(),flash:vi.fn()}},
  time:{delayedCall:(_delay,fn)=>fn()},scene:{start:vi.fn()}});
 g.initializeWallet();return g;
}
describe('shared persistent gameplay wallet',()=>{
 it('starts the HUD with the previous balance and keeps earnings/spending when leaving through pause',()=>{
  storage();statsManager.changeBalance(500);const first=game();
  expect(first.bounty).toBe(500);first.addBounty(80);first.addBounty(-35);
  expect(first.bountyText.setText).toHaveBeenLastCalledWith('$000545');
  const pause=new PauseScene();pause.scene={stop:vi.fn(),start:vi.fn()};pause.init({character:CHARACTERS.billy,stage:1});pause.returnToTitle();
  expect(new GameStatsManager().getStats().bank).toBe(545);
  const second=game();expect(second.bounty).toBe(545);expect(second.earnedBounty).toBe(0);
  second.addBounty(10);expect(new GameStatsManager().getStats().bank).toBe(555);
 });
 it('preserves money on death and does not bank the inherited wallet a second time',()=>{
  storage();statsManager.changeBalance(500);const g=game();g.addBounty(80);g.addBounty(-35);g.gameOver(false);
  const [key,data]=g.scene.start.mock.calls[0];expect(key).toBe('GameOverScene');
  expect(data).toMatchObject({bounty:545,earnedBounty:80,walletSynced:true});
  const death=new GameOverScene();death.init(data);death.init(data);
  expect(new GameStatsManager().getStats().bank).toBe(545);
  expect(statsManager.getStats().goldCollected).toBe(80);
  expect(statsManager.getStats().totalScore).toBe(800);
  expect(game().bounty).toBe(545);
 });
 it('adds only the result bonus once, never a percentage of already saved cash',()=>{
  storage();statsManager.changeBalance(9000);
  const result={runId:'finished',walletSynced:true,score:10,kills:1,gold:100,timeSurvivedSeconds:600,stage:1,stagesCleared:1,level:1,characterId:'billy',rank:'A'};
  expect(statsManager.recordRun(result,true)).toBe(bankReward(0,600,true));
  expect(statsManager.recordRun(result,true)).toBe(0);
  expect(game().bounty).toBe(9150);
 });
 it('keeps the victory reward through the captured poster without re-depositing the wallet',()=>{
  storage();vi.stubGlobal('window',{location:{search:''}});statsManager.changeBalance(500);
  const g=game();g.hp=100;g.maxHp=100;g.addBounty(80);g.stageClear();g.stageClear();
  expect(g.scene.start).toHaveBeenCalledOnce();
  const [key,data]=g.scene.start.mock.calls[0];expect(key).toBe('WantedScene');
  expect(data).toMatchObject({bounty:730,earnedBounty:230,walletSynced:true});
  const poster=new WantedScene();poster.init(data);const result=new StageClearScene();result.init(poster.result);result.init(poster.result);
  expect(new GameStatsManager().getStats().bank).toBe(780);
  expect(statsManager.getStats().goldCollected).toBe(230);
  expect(game().bounty).toBe(780);
 });
 it('uses the same funds for permanent purchases and never persists developer money',()=>{
  storage();statsManager.changeBalance(2500);expect(statsManager.buyCharacter('bob')).toBe('bought');
  expect(game().bounty).toBe(100);
  const test=game(true);expect(test.bounty).toBe(100);test.addBounty(10000);
  expect(new GameStatsManager().getStats().bank).toBe(100);
 });
 it('rejects overspending against the committed balance and keeps debits across reloads',()=>{
  storage();statsManager.changeBalance(100);const g=game();statsManager.changeBalance(-80);
  expect(g.addBounty(-30)).toBe(false);expect(new GameStatsManager().getStats().bank).toBe(20);
  expect(g.addBounty(-15)).toBe(true);expect(game().bounty).toBe(5);
 });
});
