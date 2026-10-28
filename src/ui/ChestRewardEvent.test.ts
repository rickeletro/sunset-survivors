import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import {
  buildChestWheelSegments,
  CHEST_RARITY_STYLES,
  rollChestReward,
  segmentAtWheelAngle,
  wheelTargetAngleForSegment,
} from '../data/chestReward';
import type { UpgradeChoice } from '../scenes/LevelUpScene';
import { ChestRewardEvent } from './ChestRewardEvent';

vi.mock('../audio/SoundManager', () => ({
  sounds: {
    playReload: vi.fn(),
    playCoin: vi.fn(),
    playLevelUp: vi.fn(),
  },
}));

const SAMPLE_CHOICES: UpgradeChoice[] = [
  {
    type: 'evolution',
    id: 'desperado_fury',
    name: 'Desperado Fury',
    icon: 'desperado_fury',
    currentLevel: 0,
    nextLevel: 1,
    description: 'Twin blazing revolvers unleash a storm of lead.',
  },
  {
    type: 'weapon',
    id: 'revolver',
    name: 'Colt Revolver',
    icon: 'revolver',
    currentLevel: 2,
    nextLevel: 3,
    description: 'Fires heavy .45 rounds at the nearest outlaw.',
  },
  {
    type: 'passive',
    id: 'badge',
    name: 'Sheriff Star',
    icon: 'badge',
    currentLevel: 0,
    nextLevel: 1,
    description: 'Increases XP gained by 15%.',
  },
];

function createMockScene() {
  const makeObj = (): any => {
    const obj: any = {
      children: [] as any[],
      angle: 0,
      textureKey: '',
      flipX: false,
      textValue: '',
      destroyed: false,
      add: vi.fn((child: any) => {
        if (Array.isArray(child)) obj.children.push(...child);
        else obj.children.push(child);
        return obj;
      }),
      setDepth: vi.fn(() => obj),
      setScrollFactor: vi.fn(() => obj),
      setScale: vi.fn(() => obj),
      setPosition: vi.fn(() => obj),
      setOrigin: vi.fn(() => obj),
      setAlpha: vi.fn(() => obj),
      setAngle: vi.fn((deg: number) => {
        obj.angle = deg;
        return obj;
      }),
      setTexture: vi.fn((key: string) => {
        obj.textureKey = key;
        return obj;
      }),
      setFlipX: vi.fn((flip: boolean) => {
        obj.flipX = flip;
        return obj;
      }),
      setText: vi.fn((txt: string) => {
        obj.textValue = txt;
        return obj;
      }),
      setColor: vi.fn(() => obj),
      setInteractive: vi.fn(() => obj),
      on: vi.fn(() => obj),
      clear: vi.fn(() => obj),
      fillStyle: vi.fn(() => obj),
      lineStyle: vi.fn(() => obj),
      fillRect: vi.fn(() => obj),
      strokeRect: vi.fn(() => obj),
      fillRoundedRect: vi.fn(() => obj),
      strokeRoundedRect: vi.fn(() => obj),
      fillCircle: vi.fn(() => obj),
      strokeCircle: vi.fn(() => obj),
      fillTriangle: vi.fn(() => obj),
      beginPath: vi.fn(() => obj),
      moveTo: vi.fn(() => obj),
      lineTo: vi.fn(() => obj),
      arc: vi.fn(() => obj),
      closePath: vi.fn(() => obj),
      fillPath: vi.fn(() => obj),
      strokePath: vi.fn(() => obj),
      destroy: vi.fn(() => {
        obj.destroyed = true;
      }),
    };
    return obj;
  };

  const scene = {
    scale: {
      width: 1920,
      height: 1080,
      on: vi.fn(),
      off: vi.fn(),
    },
    textures: {
      exists: vi.fn(() => true),
      get: vi.fn(() => ({ getSourceImage: () => ({ width: 80, height: 80 }) })),
    },
    cameras: {
      main: {
        flash: vi.fn(),
      },
    },
    input: {
      keyboard: {
        on: vi.fn(),
        off: vi.fn(),
      },
    },
    time: {
      delayedCall: vi.fn((_ms: number, _cb: () => void) => ({ remove: vi.fn() })),
      addEvent: vi.fn(() => ({ remove: vi.fn() })),
    },
    tweens: {
      add: vi.fn((cfg: any) => {
        if (cfg.onUpdate && typeof cfg.angle === 'number' && cfg.targets) {
          cfg.targets.angle = cfg.angle;
          cfg.onUpdate();
        }
        return { stop: vi.fn() };
      }),
    },
    add: {
      container: vi.fn(() => makeObj()),
      graphics: vi.fn(() => makeObj()),
      image: vi.fn((_x: number, _y: number, key: string) => {
        const img = makeObj();
        img.textureKey = key;
        return img;
      }),
      text: vi.fn((_x: number, _y: number, txt: string) => {
        const t = makeObj();
        t.textValue = txt;
        return t;
      }),
      zone: vi.fn(() => makeObj()),
    },
  };

  return scene as unknown as Phaser.Scene;
}

describe('Western Pulp 98 Chest Reward Lottery & Prize Wheel', () => {
  it('builds a 6-segment wheel combining real upgrade choices and stage-scaled economy prizes', () => {
    const segments = buildChestWheelSegments(SAMPLE_CHOICES, 3, false);
    expect(segments).toHaveLength(6);
    expect(segments[0].kind).toBe('upgrade');
    expect(segments[0].rarity).toBe('legendary');
    expect(segments[0].choice?.id).toBe('desperado_fury');
    expect(segments[1].rarity).toBe('rare');
    expect(segments[1].choice?.id).toBe('revolver');
    expect(segments[2].rarity).toBe('common');
    expect(segments[2].choice?.id).toBe('badge');
    expect(segments.slice(3).map(s => s.kind)).toEqual(['bounty', 'xp', 'bounty']);
  });

  it('aligns targetAngleDeg deterministically so the pre-rolled winning segment stops under the top pointer', () => {
    for (let idx = 0; idx < 6; idx++) {
      const targetDeg = wheelTargetAngleForSegment(idx, 6, 5);
      expect(segmentAtWheelAngle(targetDeg, 6)).toBe(idx);
    }

    for (const sample of [0, 0.12, 0.28, 0.49, 0.68, 0.85, 0.99]) {
      const roll = rollChestReward(SAMPLE_CHOICES, 2, true, () => sample);
      expect(segmentAtWheelAngle(roll.targetAngleDeg, roll.segments.length)).toBe(roll.winnerIndex);
      expect(roll.winner).toBe(roll.segments[roll.winnerIndex]);
      expect(CHEST_RARITY_STYLES[roll.winner.rarity]).toBeDefined();
    }
  });

  it('progresses through suspense, spinning, reveal and Can-Can celebration while granting the reward only once', () => {
    const scene = createMockScene();
    const roll = rollChestReward(SAMPLE_CHOICES, 2, false, () => 0.22);
    const onGrantReward = vi.fn();
    const onClose = vi.fn();

    const event = new ChestRewardEvent({
      scene,
      roll,
      onGrantReward,
      onClose,
    });

    expect(event.stage).toBe('suspense');
    expect(event.isRewardGranted).toBe(false);
    expect((event.chestSprite as any).textureKey).toBe('chest_closed');

    // Start spinning the prize wheel
    event.beginWheelSpin();
    expect(event.stage).toBe('spinning');
    expect((event.wheel.discContainer as any).angle).toBe(roll.targetAngleDeg);
    expect(segmentAtWheelAngle((event.wheel.discContainer as any).angle, 6)).toBe(roll.winnerIndex);

    // Reveal the prize and trigger Can-Can celebration
    event.revealPrize();
    expect(event.stage).toBe('reveal');
    expect(event.isRewardGranted).toBe(true);
    expect(onGrantReward).toHaveBeenCalledTimes(1);
    expect(onGrantReward).toHaveBeenCalledWith(roll.winner);
    expect((event.chestSprite as any).textureKey).toBe('chest_open');
    expect(event.revealView).toBeDefined();
    expect((event.revealView!.itemTitleText as any).textValue).toBe(roll.winner.label);
    expect(event.celebrationView?.leftDancer).toBeDefined();
    expect(event.celebrationView?.rightDancer).toBeDefined();
    expect((event.celebrationView?.rightDancer as any).flipX).toBe(true);

    // Duplicate reveal or close calls must never grant duplicate rewards
    event.revealPrize();
    event.claimAndClose();
    event.claimAndClose();
    expect(onGrantReward).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(event.stage).toBe('closed');
  });
});
