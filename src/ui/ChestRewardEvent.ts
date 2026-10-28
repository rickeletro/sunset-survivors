import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import {
  CHEST_RARITY_STYLES,
  type ChestRewardRoll,
  type ChestWheelSegment,
  segmentAtWheelAngle,
} from '../data/chestReward';
import { THEME } from './theme/tokens';

export type ChestEventStage = 'suspense' | 'spinning' | 'reveal' | 'closed';

export interface ChestRewardEventOptions {
  scene: Phaser.Scene;
  roll: ChestRewardRoll;
  onGrantReward: (winner: ChestWheelSegment) => void;
  onClose: () => void;
}

const REF_W = 1536;
const REF_H = 1024;
const WHEEL_RADIUS = 192;

/**
 * Renders the 6-segment Western Pulp '98 prize wheel, fixed top pointer, and segment tick/highlight animations.
 */
export class PrizeWheel {
  public readonly container: Phaser.GameObjects.Container;
  public readonly discContainer: Phaser.GameObjects.Container;
  public readonly pointerGfx: Phaser.GameObjects.Graphics;
  private readonly highlightGfx: Phaser.GameObjects.Graphics;
  private lastTickSegment = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly segments: readonly ChestWheelSegment[],
    x: number,
    y: number,
  ) {
    this.container = scene.add.container(x, y);
    this.discContainer = scene.add.container(0, 0);
    this.highlightGfx = scene.add.graphics();
    this.pointerGfx = scene.add.graphics();

    const halo = scene.add.graphics();
    halo.fillStyle(0xffc52a, 0.14);
    halo.fillCircle(0, 0, WHEEL_RADIUS + 46);
    halo.fillStyle(0xff791c, 0.2);
    halo.fillCircle(0, 0, WHEEL_RADIUS + 22);
    this.container.add(halo);

    const discGfx = scene.add.graphics();
    const count = Math.max(1, segments.length);
    const sliceRad = (Math.PI * 2) / count;

    for (let i = 0; i < count; i++) {
      const seg = segments[i];
      const startRad = -Math.PI / 2 + i * sliceRad - sliceRad / 2;
      const endRad = startRad + sliceRad;

      discGfx.fillStyle(seg.sliceColor, 1);
      discGfx.lineStyle(3, 0x120b08, 1);
      discGfx.beginPath();
      discGfx.moveTo(0, 0);
      discGfx.arc(0, 0, WHEEL_RADIUS, startRad, endRad, false);
      discGfx.closePath();
      discGfx.fillPath();
      discGfx.strokePath();

      // Inner golden trim line along each slice divider
      discGfx.lineStyle(2, 0xffc52a, 0.65);
      discGfx.beginPath();
      discGfx.moveTo(0, 0);
      discGfx.lineTo(Math.cos(startRad) * WHEEL_RADIUS, Math.sin(startRad) * WHEEL_RADIUS);
      discGfx.strokePath();
    }

    // Outer ornate saloon wood & brass rim
    discGfx.lineStyle(16, 0x321b10, 1);
    discGfx.strokeCircle(0, 0, WHEEL_RADIUS + 6);
    discGfx.lineStyle(5, 0xffc52a, 0.95);
    discGfx.strokeCircle(0, 0, WHEEL_RADIUS + 12);
    discGfx.lineStyle(3, 0xc97b16, 0.9);
    discGfx.strokeCircle(0, 0, WHEEL_RADIUS - 3);

    // 12 brass rivets around the wheel rim
    for (let r = 0; r < 12; r++) {
      const a = (r * Math.PI) / 6;
      const rx = Math.cos(a) * (WHEEL_RADIUS + 5);
      const ry = Math.sin(a) * (WHEEL_RADIUS + 5);
      discGfx.fillStyle(0x120b08, 1);
      discGfx.fillCircle(rx, ry, 5);
      discGfx.fillStyle(0xffc52a, 1);
      discGfx.fillCircle(rx, ry, 3.5);
    }

    this.discContainer.add(discGfx);

    // Segment icons and mini labels
    for (let i = 0; i < count; i++) {
      const seg = segments[i];
      const midRad = -Math.PI / 2 + i * sliceRad;
      const ix = Math.cos(midRad) * (WHEEL_RADIUS * 0.62);
      const iy = Math.sin(midRad) * (WHEEL_RADIUS * 0.62);

      if (scene.textures?.exists?.(seg.iconKey)) {
        const icon = scene.add.image(ix, iy, seg.iconKey);
        const tex = scene.textures.get(seg.iconKey)?.getSourceImage?.() as { width?: number } | undefined;
        const baseW = tex?.width || 64;
        icon.setScale?.(baseW <= 32 ? 2.1 : 0.95);
        icon.setAngle?.(i * (360 / count));
        this.discContainer.add(icon);
      } else {
        const fallback = scene.add.text(ix, iy, '★', {
          fontFamily: THEME.typography.westernFont,
          fontSize: '28px',
          color: '#ffc52a',
          stroke: '#120b08',
          strokeThickness: 4,
        }).setOrigin?.(0.5);
        this.discContainer.add(fallback);
      }
    }

    // Center brass medallion
    const hubGfx = scene.add.graphics();
    hubGfx.fillStyle(0x120b08, 1);
    hubGfx.fillCircle(0, 0, 34);
    hubGfx.fillStyle(0x603719, 1);
    hubGfx.fillCircle(0, 0, 29);
    hubGfx.lineStyle(4, 0xffc52a, 1);
    hubGfx.strokeCircle(0, 0, 29);
    hubGfx.fillStyle(0xffc52a, 1);
    hubGfx.fillCircle(0, 0, 14);
    this.discContainer.add(hubGfx);
    this.discContainer.add(this.highlightGfx);

    // Fixed top pointer (golden arcade wedge pointing down into the top slice)
    this.pointerGfx.setPosition?.(0, -WHEEL_RADIUS - 18);
    this.pointerGfx.fillStyle(0x120b08, 1);
    this.pointerGfx.fillTriangle(-24, -18, 24, -18, 0, 28);
    this.pointerGfx.fillStyle(0xffc52a, 1);
    this.pointerGfx.fillTriangle(-19, -14, 19, -14, 0, 22);
    this.pointerGfx.fillStyle(0xff791c, 1);
    this.pointerGfx.fillTriangle(-10, -10, 10, -10, 0, 14);

    this.container.add([this.discContainer, this.pointerGfx]);
  }

  public setAngle(angleDeg: number): void {
    this.discContainer.setAngle?.(angleDeg);
    const currentSeg = segmentAtWheelAngle(angleDeg, this.segments.length);
    if (currentSeg !== this.lastTickSegment) {
      this.lastTickSegment = currentSeg;
      sounds.playReload();
      this.pointerGfx.setAngle?.(-14);
      this.scene.tweens?.add?.({
        targets: this.pointerGfx,
        angle: 0,
        duration: 95,
        ease: 'Back.easeOut',
      });
    }
  }

  public highlightWinner(winnerIndex: number): void {
    const count = Math.max(1, this.segments.length);
    const sliceRad = (Math.PI * 2) / count;
    const startRad = -Math.PI / 2 + winnerIndex * sliceRad - sliceRad / 2;
    const endRad = startRad + sliceRad;

    this.highlightGfx.clear();
    this.highlightGfx.fillStyle(0xffc52a, 0.34);
    this.highlightGfx.lineStyle(6, 0xffc52a, 1);
    this.highlightGfx.beginPath();
    this.highlightGfx.moveTo(0, 0);
    this.highlightGfx.arc(0, 0, WHEEL_RADIUS, startRad, endRad, false);
    this.highlightGfx.closePath();
    this.highlightGfx.fillPath();
    this.highlightGfx.strokePath();

    this.scene.tweens?.add?.({
      targets: this.highlightGfx,
      alpha: { from: 1, to: 0.35 },
      duration: 240,
      yoyo: true,
      repeat: 5,
    });
  }
}

/**
 * Renders the foreground reward card, rarity glow, and headline banner when the chest opens.
 */
export class RewardReveal {
  public readonly container: Phaser.GameObjects.Container;
  public readonly headlineText: Phaser.GameObjects.Text;
  public readonly itemTitleText: Phaser.GameObjects.Text;
  public readonly rarityBadgeText: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    winner: ChestWheelSegment,
    x: number,
    y: number,
  ) {
    this.container = scene.add.container(x, y);
    const style = CHEST_RARITY_STYLES[winner.rarity];

    // Rarity radial burst behind the card
    const burst = scene.add.graphics();
    burst.fillStyle(style.glowColor, 0.24);
    burst.fillCircle(0, -10, 235);
    burst.fillStyle(style.borderColor, 0.32);
    burst.fillCircle(0, -10, 175);
    this.container.add(burst);

    // Top curved saloon ribbon banner (YOU WON! / JACKPOT!)
    const ribbonGfx = scene.add.graphics();
    ribbonGfx.fillStyle(0x120b08, 0.96);
    ribbonGfx.fillRoundedRect(-250, -330, 500, 68, 10);
    ribbonGfx.fillStyle(0x321b10, 0.98);
    ribbonGfx.fillRoundedRect(-244, -324, 488, 56, 8);
    ribbonGfx.lineStyle(4, style.borderColor, 1);
    ribbonGfx.strokeRoundedRect(-244, -324, 488, 56, 8);
    this.container.add(ribbonGfx);

    this.headlineText = scene.add.text(0, -296, `★ ${style.headline} ★`, {
      fontFamily: THEME.typography.westernFont,
      fontSize: '36px',
      color: '#ffc52a',
      stroke: '#120b08',
      strokeThickness: 6,
      align: 'center',
    }).setOrigin?.(0.5);
    this.container.add(this.headlineText);

    // Foreground Western Pulp '98 parchment & carved wood reward card
    const cardW = 330;
    const cardH = 350;
    const cardGfx = scene.add.graphics();
    cardGfx.fillStyle(0x120b08, 0.96);
    cardGfx.fillRoundedRect(-cardW / 2 - 6, -cardH / 2 - 6, cardW + 12, cardH + 12, 10);
    cardGfx.fillStyle(0x321b10, 1);
    cardGfx.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8);
    cardGfx.fillStyle(0xf2d49a, 1);
    cardGfx.fillRoundedRect(-cardW / 2 + 14, -cardH / 2 + 14, cardW - 28, cardH - 28, 6);
    cardGfx.lineStyle(5, style.borderColor, 1);
    cardGfx.strokeRoundedRect(-cardW / 2 + 4, -cardH / 2 + 4, cardW - 8, cardH - 8, 8);
    cardGfx.lineStyle(2, 0x603719, 0.9);
    cardGfx.strokeRoundedRect(-cardW / 2 + 20, -cardH / 2 + 20, cardW - 40, cardH - 40, 4);
    this.container.add(cardGfx);

    // Item icon/art inside the card
    const artKey = scene.textures?.exists?.(winner.cardKey)
      ? winner.cardKey
      : scene.textures?.exists?.(winner.iconKey)
        ? winner.iconKey
        : undefined;

    if (artKey) {
      const art = scene.add.image(0, -52, artKey);
      const tex = scene.textures.get(artKey)?.getSourceImage?.() as { width?: number; height?: number } | undefined;
      const w = tex?.width || 64;
      const h = tex?.height || 64;
      const targetSize = w <= 32 ? 116 : 150;
      art.setScale?.(targetSize / Math.max(w, h));
      this.container.add(art);
    }

    // Item Name on parchment card
    this.itemTitleText = scene.add.text(0, 56, winner.label, {
      fontFamily: THEME.typography.westernFont,
      fontSize: '24px',
      color: '#321b10',
      stroke: '#f2d49a',
      strokeThickness: 2,
      align: 'center',
      wordWrap: { width: cardW - 48 },
    }).setOrigin?.(0.5);
    this.container.add(this.itemTitleText);

    // Rarity ribbon pill on parchment card
    const badgeBg = scene.add.graphics();
    badgeBg.fillStyle(0x321b10, 1);
    badgeBg.fillRoundedRect(-124, 84, 248, 28, 5);
    badgeBg.lineStyle(2, style.borderColor, 1);
    badgeBg.strokeRoundedRect(-124, 84, 248, 28, 5);
    this.container.add(badgeBg);

    this.rarityBadgeText = scene.add.text(0, 98, winner.subtitle || style.badgeText, {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '9px',
      color: style.textColor,
      align: 'center',
    }).setOrigin?.(0.5);
    this.container.add(this.rarityBadgeText);

    // Item description
    const descText = scene.add.text(0, 136, winner.description, {
      fontFamily: THEME.typography.narrativeFont,
      fontSize: '14px',
      color: '#321b10',
      align: 'center',
      wordWrap: { width: cardW - 52 },
    }).setOrigin?.(0.5);
    this.container.add(descText);
  }
}

/**
 * Renders the two 90s arcade Western saloon Can-Can dancers with alternating high kicks,
 * skirt/arm movement, celebratory hops, confetti, sparkles, and coins.
 */
export class CanCanCelebration {
  public readonly container: Phaser.GameObjects.Container;
  public readonly leftDancer?: Phaser.GameObjects.Image;
  public readonly rightDancer?: Phaser.GameObjects.Image;
  private readonly confettiGfx: Phaser.GameObjects.Graphics;
  private readonly particles: { x: number; y: number; vx: number; vy: number; color: number; size: number }[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    burstCount = 28,
  ) {
    this.container = scene.add.container(0, 0);
    this.confettiGfx = scene.add.graphics();
    this.container.add(this.confettiGfx);

    const dancerKey = scene.textures?.exists?.('cancan_dancer')
      ? 'cancan_dancer'
      : scene.textures?.exists?.('saloon_cancan')
        ? 'saloon_cancan'
        : undefined;

    if (dancerKey) {
      this.leftDancer = scene.add.image(330, 585, dancerKey);
      this.leftDancer.setOrigin?.(0.5, 0.85);
      this.leftDancer.setScale?.(2.65);

      this.rightDancer = scene.add.image(1206, 585, dancerKey);
      this.rightDancer.setOrigin?.(0.5, 0.85);
      this.rightDancer.setScale?.(2.65);
      this.rightDancer.setFlipX?.(true);

      this.container.add([this.leftDancer, this.rightDancer]);
      this.startDanceRoutine();
    }

    const palette = [0xffc52a, 0xe52b20, 0xff791c, 0xf2d49a, 0xa51e16];
    for (let i = 0; i < burstCount; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      this.particles.push({
        x: REF_W / 2 + side * (110 + (i * 23) % 380),
        y: 220 + (i * 37) % 440,
        vx: side * (0.4 + (i % 5) * 0.25),
        vy: 1.2 + (i % 4) * 0.45,
        color: palette[i % palette.length],
        size: i % 3 === 0 ? 6 : 4,
      });
    }
    this.drawConfetti(0);
  }

  private startDanceRoutine(): void {
    if (!this.leftDancer || !this.rightDancer) return;

    // Alternating high-kick & hop routine ending in a synchronized celebration pose
    this.scene.tweens?.add?.({
      targets: this.leftDancer,
      y: { from: 595, to: 548 },
      angle: { from: -9, to: 12 },
      scaleX: { from: 2.55, to: 2.75 },
      duration: 260,
      yoyo: true,
      repeat: 5,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.leftDancer?.setPosition?.(330, 565);
        this.leftDancer?.setAngle?.(8);
      },
    });

    this.scene.tweens?.add?.({
      targets: this.rightDancer,
      y: { from: 548, to: 595 },
      angle: { from: 9, to: -12 },
      scaleX: { from: 2.75, to: 2.55 },
      duration: 260,
      yoyo: true,
      repeat: 5,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.rightDancer?.setPosition?.(1206, 565);
        this.rightDancer?.setAngle?.(-8);
      },
    });
  }

  public drawConfetti(step = 1): void {
    this.confettiGfx.clear();
    for (const p of this.particles) {
      p.x += p.vx * step;
      p.y += p.vy * step;
      if (p.y > 860) p.y = 180;
      this.confettiGfx.fillStyle(p.color, 0.92);
      this.confettiGfx.fillRect(p.x, p.y, p.size, p.size * 1.4);
    }
  }
}

/**
 * Orchestrates the complete Western Pulp '98 Chest Reward Event overlay inside GameScene.
 */
export class ChestRewardEvent {
  public stage: ChestEventStage = 'suspense';
  public readonly root: Phaser.GameObjects.Container;
  public readonly wheel: PrizeWheel;
  public revealView?: RewardReveal;
  public celebrationView?: CanCanCelebration;
  public readonly chestSprite: Phaser.GameObjects.Image;
  public readonly statusPlaqueText: Phaser.GameObjects.Text;
  private rewardGranted = false;
  private closed = false;
  private readonly timers: Phaser.Time.TimerEvent[] = [];
  private readonly keyDisposers: (() => void)[] = [];
  private readonly resizeHandler: () => void;

  constructor(private readonly options: ChestRewardEventOptions) {
    const { scene, roll } = options;

    this.root = scene.add.container(0, 0);
    this.root.setDepth?.(4500);
    this.root.setScrollFactor?.(0);

    // Warm saloon stage backdrop panel (leaves top HUD bar visible)
    const stageGfx = scene.add.graphics();
    stageGfx.fillStyle(0x120b08, 0.76);
    stageGfx.fillRect(0, 84, REF_W, REF_H - 84);

    // Ornate Western Pulp '98 Saloon Theater Frame
    stageGfx.fillStyle(0x321b10, 0.95);
    stageGfx.fillRoundedRect(168, 96, REF_W - 336, 856, 16);
    stageGfx.fillStyle(0x1e0f09, 0.96);
    stageGfx.fillRoundedRect(188, 114, REF_W - 376, 820, 12);

    // Crimson velvet saloon curtains on left and right edges of the frame
    stageGfx.fillStyle(0xa51e16, 0.85);
    stageGfx.fillRoundedRect(192, 118, 110, 740, 8);
    stageGfx.fillRoundedRect(REF_W - 302, 118, 110, 740, 8);

    // Wooden stage floor at the bottom of the frame
    stageGfx.fillStyle(0x603719, 1);
    stageGfx.fillRect(192, 742, REF_W - 384, 188);
    stageGfx.lineStyle(4, 0x321b10, 1);
    stageGfx.strokeRect(192, 742, REF_W - 384, 188);

    // Outer golden & burnt-red border trim
    stageGfx.lineStyle(6, 0xffc52a, 0.96);
    stageGfx.strokeRoundedRect(176, 104, REF_W - 352, 840, 14);
    stageGfx.lineStyle(3, 0xa51e16, 0.92);
    stageGfx.strokeRoundedRect(186, 114, REF_W - 372, 820, 11);

    // Golden spotlight halo behind chest and wheel
    stageGfx.fillStyle(0xffc52a, 0.16);
    stageGfx.fillCircle(REF_W / 2, 540, 290);
    stageGfx.fillStyle(0xff791c, 0.18);
    stageGfx.fillCircle(REF_W / 2, 665, 165);
    this.root.add(stageGfx);

    // Prize Wheel positioned above the chest
    this.wheel = new PrizeWheel(scene, roll.segments, REF_W / 2, 365);
    this.wheel.container.setScale?.(0.2);
    this.wheel.container.setAlpha?.(0);
    this.root.add(this.wheel.container);

    // Large chest at bottom center
    const chestKey = scene.textures?.exists?.('chest_closed') ? 'chest_closed' : 'wm_supply';
    this.chestSprite = scene.add.image(REF_W / 2, 678, chestKey);
    this.chestSprite.setScale?.(chestKey === 'chest_closed' ? 2.65 : 1.35);
    this.root.add(this.chestSprite);

    // Bottom saloon plaque for status / reward copy
    const plaqueGfx = scene.add.graphics();
    plaqueGfx.fillStyle(0x120b08, 0.96);
    plaqueGfx.fillRoundedRect(REF_W / 2 - 330, 786, 660, 108, 10);
    plaqueGfx.fillStyle(0x321b10, 0.98);
    plaqueGfx.fillRoundedRect(REF_W / 2 - 322, 794, 644, 92, 8);
    plaqueGfx.lineStyle(3, 0xffc52a, 0.95);
    plaqueGfx.strokeRoundedRect(REF_W / 2 - 322, 794, 644, 92, 8);
    this.root.add(plaqueGfx);

    this.statusPlaqueText = scene.add.text(
      REF_W / 2,
      840,
      'THE CHEST IS SHAKING...\nSOMETHING AMAZING IS ABOUT TO HAPPEN!',
      {
        fontFamily: THEME.typography.pixelFont,
        fontSize: '13px',
        color: '#f2d49a',
        stroke: '#120b08',
        strokeThickness: 4,
        align: 'center',
        lineSpacing: 8,
      },
    ).setOrigin?.(0.5);
    this.root.add(this.statusPlaqueText);

    // Responsive 1536x1024 layout scaling
    this.resizeHandler = () => this.applyResponsiveLayout();
    this.applyResponsiveLayout();
    scene.scale?.on?.('resize', this.resizeHandler);

    // Keyboard shortcuts (SPACE / ENTER to claim once revealed)
    const onConfirmKey = () => {
      if (this.stage === 'reveal') this.claimAndClose();
    };
    if (scene.input?.keyboard) {
      scene.input.keyboard.on('keydown-SPACE', onConfirmKey);
      scene.input.keyboard.on('keydown-ENTER', onConfirmKey);
      this.keyDisposers.push(() => {
        scene.input?.keyboard?.off('keydown-SPACE', onConfirmKey);
        scene.input?.keyboard?.off('keydown-ENTER', onConfirmKey);
      });
    }

    this.startSequence();
  }

  private applyResponsiveLayout(): void {
    const width = this.options.scene.scale?.width || REF_W;
    const height = this.options.scene.scale?.height || REF_H;
    const scale = Math.min(width / REF_W, height / REF_H);
    this.root.setScale?.(scale);
    this.root.setPosition?.(
      Math.round((width - REF_W * scale) / 2),
      Math.round((height - REF_H * scale) / 2),
    );
  }

  private startSequence(): void {
    const { scene } = this.options;
    sounds.playReload();
    sounds.playCoin();

    // Step 1: Chest vibrates and rocks with suspense
    scene.tweens?.add?.({
      targets: this.chestSprite,
      angle: { from: -6, to: 6 },
      y: { from: 678, to: 668 },
      duration: 75,
      yoyo: true,
      repeat: 10,
    });

    // Step 2: Wheel appears with golden pop
    scene.tweens?.add?.({
      targets: this.wheel.container,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 420,
      ease: 'Back.easeOut',
    });

    // Step 3: After 750ms of chest shaking, spin the wheel (~3.2s spin)
    const spinTimer = scene.time?.delayedCall?.(750, () => {
      if (this.closed) return;
      this.beginWheelSpin();
    });
    if (spinTimer) this.timers.push(spinTimer);
  }

  public beginWheelSpin(): void {
    if (this.closed || this.stage !== 'suspense') return;
    this.stage = 'spinning';
    this.statusPlaqueText.setText?.('SPINNING THE PRIZE WHEEL...');

    const { scene, roll } = this.options;
    const spinState = { angle: 0 };
    const spinDurationMs = 3200;

    if (scene.tweens?.add) {
      scene.tweens.add({
        targets: spinState,
        angle: roll.targetAngleDeg,
        duration: spinDurationMs,
        ease: 'Cubic.easeOut',
        onUpdate: () => {
          this.wheel.setAngle(spinState.angle);
        },
        onComplete: () => {
          this.wheel.setAngle(roll.targetAngleDeg);
          this.wheel.highlightWinner(roll.winnerIndex);
          sounds.playCoin();
          const revealTimer = scene.time?.delayedCall?.(450, () => {
            if (!this.closed) this.revealPrize();
          });
          if (revealTimer) this.timers.push(revealTimer);
        },
      });
    } else {
      this.wheel.setAngle(roll.targetAngleDeg);
      this.wheel.highlightWinner(roll.winnerIndex);
      this.revealPrize();
    }
  }

  public revealPrize(): void {
    if (this.closed || this.stage === 'reveal') return;
    this.stage = 'reveal';

    const { scene, roll } = this.options;
    const winner = roll.winner;
    const style = CHEST_RARITY_STYLES[winner.rarity];

    // Grant the pre-determined reward exactly once
    this.grantRewardOnce();

    // Open the chest with lid animation & golden flash
    if (scene.textures?.exists?.('chest_open')) {
      this.chestSprite.setTexture?.('chest_open');
    }
    this.chestSprite.setAngle?.(0);
    scene.cameras?.main?.flash?.(220, 255, 205, 70);
    sounds.playLevelUp();

    scene.tweens?.add?.({
      targets: this.chestSprite,
      scaleX: { from: 3.05, to: 2.65 },
      scaleY: { from: 3.05, to: 2.65 },
      duration: 280,
      ease: 'Back.easeOut',
    });

    // Launch Can-Can dancers celebration on left & right of the stage
    this.celebrationView = new CanCanCelebration(scene, style.burstParticles);
    this.root.add(this.celebrationView.container);

    const confettiTimer = scene.time?.addEvent?.({
      delay: 50,
      loop: true,
      callback: () => this.celebrationView?.drawConfetti(1),
    });
    if (confettiTimer) this.timers.push(confettiTimer);

    // Show foreground Reward Card
    this.revealView = new RewardReveal(scene, winner, REF_W / 2, 462);
    this.revealView.container.setScale?.(0.35);
    this.root.add(this.revealView.container);
    scene.tweens?.add?.({
      targets: this.revealView.container,
      scaleX: 1,
      scaleY: 1,
      duration: 320,
      ease: 'Back.easeOut',
    });

    // Update bottom plaque with winner announcement and interactive continue prompt
    this.statusPlaqueText.setColor?.('#ffc52a');
    this.statusPlaqueText.setText?.(`YOU WON: ${winner.label}!\n[SPACE / CLICK TO CONTINUE]`);

    const clickZone = scene.add.zone?.(REF_W / 2, REF_H / 2, REF_W, REF_H).setOrigin?.(0.5);
    if (clickZone) {
      clickZone.setInteractive?.({ useHandCursor: true })?.on?.('pointerdown', () => this.claimAndClose());
      this.root.add(clickZone);
    }

    // Auto-close after 3.8s so celebration never permanently blocks gameplay
    const autoCloseTimer = scene.time?.delayedCall?.(3800, () => {
      if (!this.closed) this.claimAndClose();
    });
    if (autoCloseTimer) this.timers.push(autoCloseTimer);
  }

  private grantRewardOnce(): void {
    if (this.rewardGranted) return;
    this.rewardGranted = true;
    this.options.onGrantReward(this.options.roll.winner);
  }

  public claimAndClose(): void {
    if (this.closed) return;
    this.grantRewardOnce();
    this.destroy();
    this.options.onClose();
  }

  public get isRewardGranted(): boolean {
    return this.rewardGranted;
  }

  public destroy(): void {
    if (this.closed) return;
    this.closed = true;
    this.stage = 'closed';
    for (const timer of this.timers) timer?.remove?.(false);
    this.timers.length = 0;
    for (const dispose of this.keyDisposers) dispose();
    this.keyDisposers.length = 0;
    this.options.scene.scale?.off?.('resize', this.resizeHandler);
    this.root.destroy?.(true);
  }
}
