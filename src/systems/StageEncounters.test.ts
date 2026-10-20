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
    const guard = hooks.spawn.mock.calls.find(call => call[0] === 'coyote')!;
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
    expect(encounters.objectiveHint()).toContain('PROVISOES');
    encounters.update(80000);
    expect(hooks.reward).not.toHaveBeenCalled();
    hooks.spawn.mockClear();
    encounters.tick(240, false);
    expect(hooks.spawn).toHaveBeenCalled();
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
