import { describe,it,expect,vi } from 'vitest';
import { GameDirector,MAX_ALIVE } from './GameDirector';
import { STAGES } from '../data/stages';
import { HORDE_CAP,WAVES,wavePool } from '../data/waves';
const bus=()=>({emitSpecialWave:vi.fn(),emitEliteSpawned:vi.fn()});
describe('five-wave token-budgeted director',()=>{
  it.each(STAGES)('simulates all ten minutes of stage $id within the cap and the current wave roster',stage=>{
    const d=new GameDirector(bus() as never,stage,()=>.9);let alive=0;
    for(let ms=850;ms<600000;ms+=850){const t=ms/1000;alive=Math.max(0,alive-2);const allowed=wavePool(t,stage.enemies).map(e=>e.kind);
      for(const order of d.waveOrders(t,alive)){expect(allowed).toContain(order.kind);alive+=order.count;}
      expect(alive).toBeLessThanOrEqual(HORDE_CAP);expect(d.targetCount(t)).toBeLessThan(MAX_ALIVE);
    }
    expect(d.waveOrders(600,0)).toEqual([]);
  });
  it('emits exactly five announcements and resets without extra special/elite spawns',()=>{
    const events=bus(),d=new GameDirector(events as never);
    for(let t=0;t<600;t++){expect(d.tick(t,0)).toEqual([]);d.tick(t,0);}
    expect(events.emitSpecialWave).toHaveBeenCalledTimes(5);d.reset();d.tick(0,0);expect(events.emitSpecialWave).toHaveBeenCalledTimes(6);
  });
  it('matches nominal per-second rates without building a burst behind the entity limit',()=>{
    for(const wave of WAVES){const d=new GameDirector(bus() as never);let total=0;const start=(wave.id-1)*120+(wave.id===1?0:20);
      for(let i=0;i<100;i++)total+=d.waveOrders(start+i*.85,0).reduce((s,o)=>s+o.count,0);
      expect(total).toBeCloseTo(Math.floor(wave.spawnRate*85+1e-9),-0);
      d.waveOrders(start+86,HORDE_CAP);expect(d.waveOrders(start+87,0).reduce((s,o)=>s+o.count,0)).toBeLessThanOrEqual(Math.ceil(wave.spawnRate*1.7));
    }
  });
});
