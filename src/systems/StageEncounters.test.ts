import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { getStage } from '../data/stages';
import { insideHazard, StageEncounters } from './StageEncounters';

function fixture(stage = 1) {
  const chain = (): unknown => new Proxy({}, { get: (_, key) => key === 'destroy' ? vi.fn() : () => chain() });
  const scene = { add: { graphics: chain, image: chain, text: chain } } as unknown as Phaser.Scene;
  const position = { x: 4000, y: 4000 };
  const hooks = {
    position: () => position, damage: vi.fn(), spawn: vi.fn(), reward: vi.fn(), banner: vi.fn(),
    contested: vi.fn(() => false), clearPoint: (x: number, y: number) => ({ x, y }),
  };
  return { hooks, position, encounters: new StageEncounters(scene, getStage(stage), hooks) };
}

describe('telegraphed hazards and optional supply camps', () => {
  it('does not damage during the warning and expires the danger', () => {
    const { encounters, hooks } = fixture();
    encounters.warn({ x: 4000, y: 4000, radius: 60 }, 1000, 500, 22);
    encounters.update(999); expect(hooks.damage).not.toHaveBeenCalled();
    encounters.update(1); expect(hooks.damage).toHaveBeenCalledWith(22);
    hooks.damage.mockClear(); encounters.update(501);
    expect(hooks.damage).not.toHaveBeenCalled();
  });
  it('requires a clear camp and eight seconds inside before granting a reward once', () => {
    const { encounters, hooks, position } = fixture();
    encounters.tick(90, false);
    const guard = hooks.spawn.mock.calls.find(call => call[0] === 'bandit')!;
    // First guard is 160px east of the camp.
    position.x = guard[1] - 160; position.y = guard[2];
    hooks.contested.mockReturnValue(true);
    encounters.update(8000); expect(hooks.reward).not.toHaveBeenCalled();
    hooks.contested.mockReturnValue(false);
    encounters.update(7999); expect(hooks.reward).not.toHaveBeenCalled();
    encounters.update(1); expect(hooks.reward).toHaveBeenCalledTimes(1);
    encounters.update(8000); expect(hooks.reward).toHaveBeenCalledTimes(1);
  });
  it('does not create environmental events or camps during a boss fight', () => {
    const { encounters, hooks } = fixture();
    encounters.tick(900, true);
    expect(hooks.spawn).not.toHaveBeenCalled(); expect(hooks.reward).not.toHaveBeenCalled();
  });
  it('distinguishes warning lanes from circular blasts', () => {
    expect(insideHazard({ x: 0, y: 0, radius: 50 }, 51, 0)).toBe(false);
    expect(insideHazard({ x: 0, y: 0, radius: 0, width: 1200, height: 80 }, 500, 39)).toBe(true);
    expect(insideHazard({ x: 0, y: 0, radius: 0, width: 1200, height: 80 }, 0, 41)).toBe(false);
  });
  it('lets an unclaimed camp expire without rewarding or blocking future camps', () => {
    const { encounters, hooks } = fixture();
    encounters.tick(90, false);
    expect(encounters.objectiveHint()).toContain('SUPPLIES');
    encounters.update(80000);
    expect(hooks.reward).not.toHaveBeenCalled();
    hooks.spawn.mockClear();
    encounters.tick(240, false);
    expect(hooks.spawn).toHaveBeenCalled();
  });
  it('shows the PixelLab locomotive only during the active train pass and disposes it', () => {
    const train = { setOrigin: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis(), setPosition: vi.fn().mockReturnThis(), destroy: vi.fn() };
    const graphic: any = {};
    for (const key of ['setDepth', 'clear', 'lineStyle', 'fillStyle', 'fillRect', 'strokeRect', 'destroy']) graphic[key] = vi.fn().mockReturnValue(graphic);
    const scene = { textures: { exists: () => true }, add: { image: vi.fn(() => train), graphics: () => graphic } } as unknown as Phaser.Scene;
    const hooks = { position: () => ({ x: 4000, y: 4200 }), damage: vi.fn(), spawn: vi.fn(), reward: vi.fn(), banner: vi.fn(), contested: () => false, clearPoint: (x: number, y: number) => ({ x, y }) };
    const encounters = new StageEncounters(scene, getStage(2), hooks);
    encounters.warn({ x: 4000, y: 4000, radius: 0, width: 1200, height: 80 }, 2400, 1300, 35);
    encounters.update(2399);
    expect(scene.add.image).not.toHaveBeenCalled();
    encounters.update(1);
    expect(scene.add.image).toHaveBeenCalledWith(3350, 4048, 'scenery_locomotive');
    encounters.update(650);
    expect(train.setPosition).toHaveBeenLastCalledWith(4000, 4048);
    expect(scene.add.image).toHaveBeenCalledTimes(1);
    encounters.update(650);
    expect(train.destroy).toHaveBeenCalledTimes(1);
    expect(hooks.damage).not.toHaveBeenCalled();
    encounters.destroy();
    expect(train.destroy).toHaveBeenCalledTimes(1);
  });
  it('does not hit the entire warned rail lane while the train is still far away', () => {
    const { encounters, hooks } = fixture(2);
    encounters.warn({ x: 4000, y: 4000, radius: 0, width: 1200, height: 80 }, 2400, 1300, 35);
    encounters.update(2400);
    expect(hooks.damage).not.toHaveBeenCalled();
    encounters.update(650);
    expect(hooks.damage).toHaveBeenCalledWith(35);
  });

});

it('triggers the phase-specific hazard at exactly 7:00 once, without duplicating it on the same tick',()=>{
  const {encounters,hooks}=fixture(1);
  encounters.tick(419,false);hooks.spawn.mockClear();
  encounters.tick(420,false);expect(hooks.spawn.mock.calls.filter(c=>c[0]==='longhorn')).toHaveLength(5);
  hooks.spawn.mockClear();encounters.tick(420,false);expect(hooks.spawn).not.toHaveBeenCalled();
});

describe('optional high-stakes camp contract',()=>{
 it('requires nearby deliberate acceptance, resets pre-held progress, adds bounded guards and rewards only once',()=>{
  const {encounters,hooks,position}=fixture();encounters.tick(90,false);expect(encounters.acceptContract()).toBe(false);
  const guard=hooks.spawn.mock.calls[0];position.x=guard[1]-160;position.y=guard[2];encounters.update(7000);
  expect(encounters.acceptContract()).toBe(true);expect(encounters.acceptContract()).toBe(false);expect(hooks.spawn).toHaveBeenCalledTimes(9);
  hooks.contested.mockReturnValue(true);encounters.update(7000);expect(hooks.reward).not.toHaveBeenCalled();
  hooks.contested.mockReturnValue(false);encounters.update(7999);expect(hooks.reward).not.toHaveBeenCalled();encounters.update(1);
  expect(hooks.reward).toHaveBeenCalledExactlyOnceWith(true);encounters.update(9000);expect(hooks.reward).toHaveBeenCalledOnce();
  encounters.tick(240,false);const next=hooks.spawn.mock.calls[9];position.x=next[1]-160;position.y=next[2];expect(encounters.acceptContract()).toBe(false);
 });
 it('fails after the deadline without free rewards and preserves future ordinary supply camps',()=>{
  const {encounters,hooks,position}=fixture();encounters.tick(90,false);const guard=hooks.spawn.mock.calls[0];position.x=guard[1]-160;position.y=guard[2];
  expect(encounters.acceptContract()).toBe(true);hooks.contested.mockReturnValue(true);encounters.update(25001);expect(hooks.reward).not.toHaveBeenCalled();
  expect(encounters.objectiveHint()).toContain('EVERY');encounters.tick(240,false);expect(hooks.spawn.mock.calls.filter(call=>call[0]!=='longhorn')).toHaveLength(14);
 });
});
