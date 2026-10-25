import { describe,it,expect } from 'vitest';
import { compassMarkers, compassLayout, COMPASS_RADIUS } from './frontierCompass';
import { SaloonVisit } from './saloon';
import { STAGES } from './stages';
import { saloonDoors } from './saloon';
describe('north-up frontier activity compass', () => {
  it('projects nearby doors and keeps north up without rotating with movement', () => {
    const doors = [{x:1000,y:0},{x:0,y:-1000},{x:-1000,y:0},{x:0,y:1000}];
    const markers=compassMarkers(new SaloonVisit(doors,undefined,true),0,0);
    expect(markers.map(m => [m.x,m.y])).toEqual([[38,0],[0,-38],[-38,0],[0,38]]);
    expect(markers.every(m => !m.edge)).toBe(true);
  });
  it('clamps distant bearings and chooses only the nearest available edge marker per activity', () => {
    const doors=[{x:3000,y:4000},{x:6000,y:8000},{activity:'gallery' as const,x:-5000,y:0}];
    const markers=compassMarkers(new SaloonVisit(doors,undefined,true),0,0);
    expect(markers).toHaveLength(2); expect(markers[0].door).toBe(doors[0]);
    for (const m of markers) expect(Math.hypot(m.x,m.y)).toBeCloseTo(COMPASS_RADIUS);
    expect(markers[0].x/markers[0].y).toBeCloseTo(.75);
  });
  it('dims consumed doors locally and removes their distant guidance while Faro retries stay visible', () => {
    const door={x:0,y:0}, visit=new SaloonVisit([door],undefined,true);
    visit.enter(0,0,false); visit.leave(false);
    expect(compassMarkers(visit,0,0)[0]).toMatchObject({used:true,nearby:true}); expect(compassMarkers(visit,5000,0)).toEqual([]);
    const faro=new SaloonVisit([door],undefined,true,true); faro.enter(0,0,false); faro.leave(true,false);
    expect(compassMarkers(faro,5000,0)[0].used).toBe(false);
  });
  it.each(STAGES)('keeps all stage $id activity types and coincident player coordinates finite', stage => {
    const visit=new SaloonVisit(saloonDoors(stage.theme),undefined,true,stage.id===2), door=visit.doors[0];
    const markers=compassMarkers(visit,door.x,door.y);
    expect(markers.some(m => m.door.activity==='gallery')).toBe(true);
    for (const m of markers) { expect(Number.isFinite(m.x+m.y)).toBe(true); expect(Math.hypot(m.x,m.y)).toBeLessThanOrEqual(COMPASS_RADIUS+.001); }
  });
  it.each([[1920,1080],[640,360],[390,844],[320,480]])('keeps the panel below HUD counters and inside %i × %i', (w,h) => {
    const p=compassLayout(w,h); expect(p.x-112*p.scale).toBeGreaterThanOrEqual(12); expect(p.x+112*p.scale).toBeLessThanOrEqual(w-12);
    expect(p.y-110*p.scale).toBeGreaterThanOrEqual(129.9); expect(p.y+176*p.scale).toBeLessThanOrEqual(h-8);
  });
});
