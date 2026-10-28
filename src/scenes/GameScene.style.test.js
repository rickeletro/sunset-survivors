import { describe,expect,it,vi } from 'vitest';
import { GameScene } from './GameScene';
import { GunslingerStyle } from '../data/gunslingerStyle';
import { CHARACTERS } from '../data/characters';
vi.mock('phaser',()=>({default:{Scene:class{},Events:{EventEmitter:class{}}}}));
vi.mock('../audio/SoundManager',()=>({sounds:{playReload:vi.fn(),playCoin:vi.fn()}}));
function fixture(hero='steve'){
 const g=Object.create(GameScene.prototype),player={x:0,y:0,anims:{isPlaying:false},setFlipX:vi.fn()};
 Object.assign(g,{character:CHARACTERS[hero],gunslinger:new GunslingerStyle(hero),player,moveIntent:{x:1,y:0},combatElapsedMs:0,
  moveSpeed:190,invulnUntil:0,enemies:[],worldMap:{resolve:vi.fn((x,y)=>({x,y}))},anims:{exists:()=>false},
  keysWASD:{W:{isDown:false},A:{isDown:false},S:{isDown:false},D:{isDown:true}},runId:'style-run',rerollsRemaining:2,
  scene:{pause:vi.fn(),launch:vi.fn(),resume:vi.fn()},generateUpgradeChoices:vi.fn(),applyUpgrade:vi.fn()});return g;
}
describe('gameplay feel integration',()=>{
 it('does not tunnel through a wall while dodging, even on a long frame',()=>{
  const g=fixture();g.worldMap.resolve=vi.fn((x,y)=>({x:Math.min(50,x),y}));expect(g.tryDodge()).toBe(true);
  expect(g.invulnUntil).toBe(90);g.combatElapsedMs=180;g.handlePlayerMovement(180);
  expect(g.player.x).toBe(50);expect(g.worldMap.resolve.mock.calls.every(([x])=>x<=58)).toBe(true);expect(g.tryDodge()).toBe(false);
 });
 it('uses the newly held direction immediately rather than a stale facing direction',()=>{
  const g=fixture();g.keysWASD.D.isDown=false;g.keysWASD.A.isDown=true;g.tryDodge();g.combatElapsedMs=180;g.handlePlayerMovement(180);expect(g.player.x).toBeCloseTo(-110);
 });
 it.each(['isGameOver','bossDefeated','saloonOpen','choosingUpgrade'])('refuses dodge during %s',flag=>{
  const g=fixture();g[flag]=true;expect(g.tryDodge()).toBe(false);expect(g.invulnUntil).toBe(0);
 });
 it('limits Cormano displacement to twenty ordinary enemies and leaves bosses and mini-bosses unchanged',()=>{
  const g=fixture('cormano');const normal=Array.from({length:30},()=>({type:'bandit',sprite:{x:20,y:0}}));
  const boss={type:'boss',sprite:{x:20,y:0}},mini={type:'bandit',miniWave:1,sprite:{x:20,y:0}};g.enemies=[boss,mini,...normal];g.tryDodge();
  expect(normal.filter(e=>e.sprite.x>20)).toHaveLength(20);expect(boss.sprite.x).toBe(20);expect(mini.sprite.x).toBe(20);
 });
 it('shares two rerolls across upgrade drafts, does not charge unchanged offers, and rejects stale callbacks',()=>{
  const g=fixture();const a=[{id:'a'},{id:'b'},{id:'c'}],b=[{id:'b'},{id:'c'},{id:'d'}],c=[{id:'c'},{id:'d'},{id:'e'}];
  g.generateUpgradeChoices.mockReturnValueOnce(a).mockReturnValueOnce(b).mockReturnValueOnce(c).mockReturnValue(c);
  g.triggerLevelUp();const draft=g.scene.launch.mock.calls[0][1];expect(draft.onReroll()).toEqual({choices:b,remaining:1});
  expect(draft.onReroll()).toEqual({choices:c,remaining:0});expect(draft.onReroll()).toBeUndefined();expect(g.rerollsRemaining).toBe(0);
  draft.onSelect(c[0]);draft.onSelect(c[0]);expect(g.applyUpgrade).toHaveBeenCalledOnce();expect(draft.onReroll()).toBeUndefined();
  const unchanged=fixture();unchanged.generateUpgradeChoices.mockReturnValue(a);unchanged.triggerLevelUp();const retry=unchanged.scene.launch.mock.calls[0][1];
  expect(retry.onReroll()).toBeUndefined();expect(unchanged.rerollsRemaining).toBe(2);unchanged.runId='new-run';expect(retry.onReroll()).toBeUndefined();
 });
});
