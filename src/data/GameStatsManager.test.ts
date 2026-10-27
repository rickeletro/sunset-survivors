import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameStatsManager } from './GameStatsManager';
import { ECONOMY, bankReward } from './economy';
afterEach(() => vi.unstubAllGlobals());
const run = { runId: 'test-run', score: 1300, kills: 20, gold: 30, timeSurvivedSeconds: 420, stage: 1, stagesCleared: 1, level: 12, characterId: 'billy', rank: 'A' as const };
describe('persisted run economy', () => {
  it('locks paid heroes, uses secured cash for banking, and persists each unlock and debit exactly once', () => {
    const values = new Map<string,string>();
    vi.stubGlobal('localStorage',{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value)});
    const manager=new GameStatsManager();
    expect(manager.getStats().unlockedCharacters).toEqual(['steve','billy']);
    expect(manager.buyCharacter('bob')).toBe('insufficient');
    manager.recordRun({...run,gold:30000,timeSurvivedSeconds:600,difficulty:'normal'},true);
    expect(manager.getStats().bank).toBe(bankReward(30000,600,true));
    expect(manager.buyCharacter('bob')).toBe('bought'); const afterBob=manager.getStats().bank;
    expect(manager.buyCharacter('bob')).toBe('owned'); expect(manager.getStats().bank).toBe(afterBob);
    expect(manager.buyCharacter('cormano')).toBe('bought');
    const reloaded=new GameStatsManager();
    expect(reloaded.getStats().bank).toBe(bankReward(30000,600,true)-ECONOMY.characters.bob-ECONOMY.characters.cormano);
    expect(reloaded.isCharacterUnlocked('bob')&&reloaded.isCharacterUnlocked('cormano')).toBe(true);
    const before=reloaded.getStats().bank; reloaded.recordRun({...run,gold:30000},true); expect(reloaded.getStats().bank).toBe(before);
    const snapshot=reloaded.getStats(); snapshot.unlockedCharacters.length=0;
    expect(reloaded.isCharacterUnlocked('cormano')).toBe(true);
  });
  it('migrates former auto-unlocks into one historical cash credit, and rolls back an unsaved purchase', () => {
    let raw=JSON.stringify({goldCollected:10000,unlockedCharacters:['steve','billy','bob','cormano']}); let fail=false;
    vi.stubGlobal('localStorage',{getItem:()=>raw,setItem:(_key:string,value:string)=>{if(fail)throw Error('quota');raw=value;}});
    const manager=new GameStatsManager(); expect(manager.getStats().bank).toBe(3000); expect(manager.isCharacterUnlocked('bob')).toBe(false);
    expect(new GameStatsManager().getStats().bank).toBe(3000);
    fail=true; expect(manager.buyCharacter('bob')).toBe('save-failed');
    expect(manager.getStats().bank).toBe(3000); expect(manager.isCharacterUnlocked('bob')).toBe(false);
    fail=false; expect(manager.buyCharacter('bob')).toBe('bought'); expect(new GameStatsManager().getStats().bank).toBe(600);
  });
  it('never banks anonymous preview results and rejects invalid character purchases', () => {
    vi.stubGlobal('localStorage',{getItem:()=>null,setItem:vi.fn()});const manager=new GameStatsManager();
    manager.recordRun({...run,runId:undefined,gold:9999},true);expect(manager.getStats().bank).toBe(0);
    expect(manager.buyCharacter('__proto__')).toBe('invalid');
  });
  it('starts a fresh account at zero and records a run once even after revisiting its results', () => {
    const storage = new Map();
    vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) });
    const manager = new GameStatsManager(); expect(manager.getStats().goldCollected).toBe(0);
    manager.recordRun(run, true); manager.recordRun(run, true);
    const reloaded = new GameStatsManager(); reloaded.recordRun(run, true);
    expect(reloaded.getStats()).toMatchObject({ totalScore: 1300, totalKills: 20, goldCollected: 30, playTimeSeconds: 420, stagesCleared: 1, deaths: 0 });
    reloaded.recordRun({ ...run, runId: 'another' }, false);
    expect(reloaded.getStats().goldCollected).toBe(60); expect(reloaded.getStats().deaths).toBe(1);
  });
  it('keeps existing saves compatible and grades ranks by sustained performance', () => {
    const original = { totalScore: 100, totalKills: 10, goldCollected: 5, playTimeSeconds: 60, stagesCleared: 1, deaths: 0, bestStreak: 10, unlockedBosses: [1], unlockedCharacters: ['billy'] };
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify(original), setItem: vi.fn() });
    const manager = new GameStatsManager(); manager.recordRun(run, true);
    expect(manager.getStats().totalScore).toBe(1400);
    expect(manager.calculateRank(50, 420, 1)).toBe('C');
    expect(manager.calculateRank(700, 420, 0.9)).toBe('S');
  });
});

describe('portable guest progress and committed transactions', () => {
  function storage() {
    const entries=new Map<string,string>();let fail=false;
    vi.stubGlobal('localStorage',{getItem:(key:string)=>entries.get(key)??null,setItem:(key:string,value:string)=>{if(fail)throw Error('quota');entries.set(key,value);}});
    return {entries,fail:()=>{fail=true;},recover:()=>{fail=false;}};
  }
  it('does not let a stale tab spend the same bank balance twice', () => {
    storage();const tabA=new GameStatsManager();tabA.recordRun({...run,gold:30000},true);
    const tabB=new GameStatsManager();
    expect(tabA.buyCharacter('cormano')).toBe('bought');
    expect(tabB.buyCharacter('cormano')).toBe('owned');
    expect(tabB.buyCharacter('bob')).toBe('bought');
    expect(new GameStatsManager().getStats().bank).toBe(bankReward(30000,420,true)-8400);
    expect(tabA.buyCharacter('bob')).toBe('owned');
    expect(tabA.getStats().bank).toBe(tabB.getStats().bank);
  });
  it('never buys with zero, corrupt or stale funds', () => {
    const store=storage();const a=new GameStatsManager();a.recordRun({...run,gold:10000},true);const b=new GameStatsManager();
    expect(a.buyCharacter('bob')).toBe('bought');expect(b.buyCharacter('cormano')).toBe('insufficient');
    const key=[...store.entries.keys()][0];store.entries.set(key,JSON.stringify({economyVersion:1,bank:null,unlockedCharacters:['steve','billy']}));
    expect(b.buyCharacter('bob')).toBe('insufficient');expect(b.isCharacterUnlocked('bob')).toBe(false);
  });
  it('round-trips cash, paid characters and deposit history without duplicating rewards', () => {
    const store=storage();const a=new GameStatsManager();a.recordRun({...run,gold:20000},true);a.buyCharacter('bob');
    const exported=a.exportProgress();const before=a.getStats();
    store.entries.clear();const b=new GameStatsManager();expect(b.importProgress(exported)).toBe('saved');
    expect(new GameStatsManager().getStats()).toEqual(before);
    expect(b.recordRun({...run,gold:20000},true)).toBe(0);expect(b.getStats().bank).toBe(before.bank);
    for(const bad of ['{}','{broken',JSON.stringify({game:'other',version:1,stats:before}),JSON.stringify({game:'sunset-survivors',version:1,stats:{...before,bank:-1}})])expect(b.importProgress(bad)).toBe('invalid');
    expect(b.getStats()).toEqual(before);
  });
  it('rolls back unsaved deposits and imports so a failed write cannot fund purchases', () => {
    const store=storage();const a=new GameStatsManager();const initial=a.exportProgress();
    store.fail();expect(a.recordRun({...run,gold:100000},true)).toBe(0);expect(a.getStats().bank).toBe(0);
    expect(a.buyCharacter('bob')).toBe('insufficient');expect(a.importProgress(initial)).toBe('save-failed');
    store.recover();expect(a.recordRun({...run,gold:100000},true)).toBeGreaterThan(0);
    expect(a.recordRun({...run,gold:100000},true)).toBe(0);
  });
});
