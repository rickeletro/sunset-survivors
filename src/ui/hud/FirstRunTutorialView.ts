import type Phaser from 'phaser';
import type { FirstRunTutorial } from '../../systems/FirstRunTutorial';
import { THEME } from '../theme/tokens';

type KeyName = 'W' | 'A' | 'S' | 'D';

interface KeycapVisual {
  container: Phaser.GameObjects.Container;
  base: Phaser.GameObjects.Graphics;
  glow: Phaser.GameObjects.Graphics;
  sparks: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  baseY: number;
}

/**
 * Movement instruction plaque for Stage 1.
 * Faithful WESTERN PULP '98 aesthetic: carved dark wood, brass rivets,
 * longhorn skull, golden WASD keycaps with sequential press animation,
 * directional arcade arrows, hero cowboy stance, and aged parchment banner.
 */
export class FirstRunTutorialView {
  public root: Phaser.GameObjects.Container;
  public backdrop: Phaser.GameObjects.Graphics;
  public backdropZone?: Phaser.GameObjects.Zone;
  public plaqueContainer: Phaser.GameObjects.Container;
  public title: Phaser.GameObjects.Text;
  public body: Phaser.GameObjects.Text;
  public keys: Phaser.GameObjects.Text;
  public step: Phaser.GameObjects.Text;
  public skipButton: Phaser.GameObjects.Container;
  public skipLabel: Phaser.GameObjects.Text;

  private heroId: string;
  private onSkip: () => void;
  private isDismissing = false;
  private keycaps: Record<KeyName, KeycapVisual>;
  private arrows: Record<KeyName, Phaser.GameObjects.Graphics>;
  private keySequenceTimer?: Phaser.Time.TimerEvent;
  private currentKeyIndex = 0;
  private resize: () => void;
  private boundKeyListeners: Array<{ event: string; fn: () => void }> = [];

  constructor(
    private scene: Phaser.Scene,
    private model: FirstRunTutorial,
    skipOrHero?: string | (() => void),
    maybeSkip?: () => void
  ) {
    if (typeof skipOrHero === 'function') {
      this.onSkip = skipOrHero;
      this.heroId = 'billy';
    } else if (typeof skipOrHero === 'string') {
      this.heroId = skipOrHero;
      this.onSkip = maybeSkip ?? (() => {});
    } else {
      this.heroId = 'billy';
      this.onSkip = () => {};
    }

    const { width, height } = scene.scale;

    // 1. Backdrop: slightly darkens the stage underneath, keeping gameplay visible
    this.backdrop = scene.add.graphics().setScrollFactor(0).setDepth(90);
    this.backdrop.fillStyle(0x120b08, 0.55).fillRect(0, 0, width, height);

    if (scene.add.zone) {
      this.backdropZone = scene.add
        .zone(0, 0, width, height)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(90)
        .setInteractive({ useHandCursor: true });
      this.backdropZone.on('pointerdown', () => this.dismiss());
    }

    // 2. Root Container: holds the responsive plaque modal
    this.root = scene.add.container(width / 2, height / 2).setScrollFactor(0).setDepth(91);

    // 3. Plaque Container: carries the wooden board, ornaments, hero and animations
    this.plaqueContainer = scene.add.container(0, 0);
    this.root.add(this.plaqueContainer);

    // Build the plaque layers
    const plaqueGfx = scene.add.graphics();
    this.drawWoodenPlaque(plaqueGfx);
    this.plaqueContainer.add(plaqueGfx);

    // Skull on top pediment
    if (scene.textures.exists('decor_skull')) {
      const skull = scene.add.image(0, -188, 'decor_skull').setScale(1.35).setOrigin(0.5);
      this.plaqueContainer.add(skull);
    } else {
      const fallbackSkull = scene.add.graphics();
      this.drawFallbackSkull(fallbackSkull);
      this.plaqueContainer.add(fallbackSkull);
    }

    // Stars & Header: HOW TO MOVE
    const leftStar = scene.add.text(-195, -145, '★', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '20px',
      color: '#ffc52a',
    }).setOrigin(0.5);
    const rightStar = scene.add.text(195, -145, '★', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '20px',
      color: '#ffc52a',
    }).setOrigin(0.5);
    this.title = scene.add.text(0, -145, 'HOW TO MOVE', {
      fontFamily: THEME.typography.westernFont,
      fontSize: '32px',
      color: '#fff1c7',
      stroke: '#321b10',
      strokeThickness: 5,
    }).setOrigin(0.5);
    this.plaqueContainer.add([leftStar, rightStar, this.title]);

    // Thin decorative gold divider
    const divider = scene.add.graphics();
    divider.lineStyle(1.5, 0xffc52a, 0.85);
    divider.lineBetween(-220, -118, 220, -118);
    divider.fillStyle(0xffc52a, 1);
    divider.fillCircle(0, -118, 3.5);
    this.plaqueContainer.add(divider);

    // 4. Directional Arrows and WASD Keycaps
    const { keycaps, arrows } = this.createWASDCluster();
    this.keycaps = keycaps;
    this.arrows = arrows;

    // 5. Cowboy Hero standing on the right
    this.createHeroStance();

    // 6. Aged Parchment Banner at bottom
    const bannerGfx = scene.add.graphics();
    this.drawParchmentBanner(bannerGfx);
    this.plaqueContainer.add(bannerGfx);

    this.body = scene.add.text(0, 146, this.model.copy.body, {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '15px',
      color: '#211208',
      align: 'center',
      lineSpacing: 6,
    }).setOrigin(0.5);
    this.plaqueContainer.add(this.body);

    // Dummy elements for test compatibility
    this.step = scene.add.text(0, -999, '', { fontSize: '10px' }).setVisible(false);
    this.keys = scene.add.text(0, -999, '', { fontSize: '10px' }).setVisible(false);
    this.root.add([this.step, this.keys]);

    // 7. Skip Button in bottom-right corner
    this.skipButton = scene.add.container(0, 0).setScrollFactor(0).setDepth(94).setSize(164, 48).setInteractive({ useHandCursor: true });
    const skipGfx = scene.add.graphics();
    skipGfx.fillStyle(0x321b10, 0.95).fillRoundedRect(-82, -24, 164, 48, 6);
    skipGfx.lineStyle(2, 0xffc52a).strokeRoundedRect(-82, -24, 164, 48, 6);
    this.skipButton.add(skipGfx);

    this.skipLabel = scene.add.text(0, 0, this.model.mode === 'touch' ? 'SKIP' : 'SKIP [T]', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '12px',
      color: '#f2d49a',
    }).setOrigin(0.5);
    this.skipButton.add(this.skipLabel);

    this.skipButton.on('pointerdown', (_pointer: unknown, _x: unknown, _y: unknown, event: Phaser.Types.Input.EventData) => {
      event?.stopPropagation?.();
      this.dismiss();
    });

    // 8. Plaque Breathing Animation
    scene.tweens.add({
      targets: this.plaqueContainer,
      scaleX: 1.012,
      scaleY: 1.016,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 9. Keypress Sequential Animation
    this.startKeySequenceAnimation();

    // 10. Keyboard listeners (WASD, Arrows, T, Space, Esc dismiss immediately)
    this.bindKeyboardControls();

    // 11. Responsive layout handler
    this.resize = () => {
      const sw = scene.scale.width;
      const sh = scene.scale.height;
      this.backdrop.clear();
      this.backdrop.fillStyle(0x120b08, 0.55).fillRect(0, 0, sw, sh);
      this.backdropZone?.setSize(sw, sh);

      const short = sh < 480 && sw >= 520;
      const compact = sw < 600;
      const scale = short
        ? Math.min(1, (sw - 212) / 760)
        : Math.min(1, (sw - 24) / 760, Math.max(0.35, (sh - 40) / 480));

      this.root.setScale(scale);
      if (short) {
        this.root.setPosition(12 + 380 * scale, sh - 44);
      } else {
        this.root.setPosition(sw / 2, sh / 2);
      }

      this.body.setFontSize(Math.max(16, Math.ceil(15 / scale)));
      this.skipButton.setPosition(sw - 94, sh - 30);
      this.skipLabel.setText(compact || this.model.mode === 'touch' ? 'SKIP' : 'SKIP [T]');
    };

    this.resize();
    scene.scale.on('resize', this.resize);
    scene.events.once('shutdown', () => this.destroy());
  }

  private drawWoodenPlaque(g: Phaser.GameObjects.Graphics): void {
    g.clear();
    // Drop shadow
    g.fillStyle(0x000000, 0.45);
    g.fillRoundedRect(-335, -215, 670, 430, 16);

    // Outer dark wood border
    g.fillStyle(0x221209, 1);
    g.fillRoundedRect(-330, -210, 660, 420, 14);

    // Carved brass/golden inner rim
    g.lineStyle(3, 0xffc52a, 1);
    g.strokeRoundedRect(-324, -204, 648, 408, 12);
    g.lineStyle(1.5, 0x8a5d10, 0.7);
    g.strokeRoundedRect(-320, -200, 640, 400, 10);

    // Weathered horizontal wood planks
    const plankColors = [0x2e170d, 0x361b0f, 0x2b150c, 0x33190e, 0x2e170d, 0x381c10];
    const plankHeight = 66;
    for (let i = 0; i < 6; i++) {
      const py = -198 + i * plankHeight;
      g.fillStyle(plankColors[i], 1);
      g.fillRect(-318, py, 636, plankHeight - 2);
      // Plank seam shadow
      g.fillStyle(0x150a05, 0.8);
      g.fillRect(-318, py + plankHeight - 2, 636, 2);
      // Subtle wood grain lines
      g.lineStyle(1, 0x422314, 0.35);
      g.lineBetween(-310, py + 18, 310, py + 18);
      g.lineBetween(-290, py + 42, 290, py + 42);
    }

    // Top pediment ornament bracket under skull
    g.fillStyle(0x180b05, 1);
    g.fillRoundedRect(-90, -216, 180, 24, 6);
    g.lineStyle(2, 0xffc52a, 1);
    g.strokeRoundedRect(-90, -216, 180, 24, 6);

    // 4 Brass corner brackets & golden rivets
    const corners = [
      { x: -322, y: -202, sx: 1, sy: 1 },
      { x: 322, y: -202, sx: -1, sy: 1 },
      { x: -322, y: 202, sx: 1, sy: -1 },
      { x: 322, y: 202, sx: -1, sy: -1 },
    ];
    for (const c of corners) {
      g.fillStyle(0x8a5d10, 1);
      g.fillRect(c.sx === 1 ? c.x : c.x - 28, c.sy === 1 ? c.y : c.y - 8, 28, 8);
      g.fillRect(c.sx === 1 ? c.x : c.x - 8, c.sy === 1 ? c.y : c.y - 28, 8, 28);
      g.lineStyle(1.5, 0xffc52a, 1);
      g.strokeRect(c.sx === 1 ? c.x : c.x - 28, c.sy === 1 ? c.y : c.y - 8, 28, 8);
      g.strokeRect(c.sx === 1 ? c.x : c.x - 8, c.sy === 1 ? c.y : c.y - 28, 8, 28);

      // Brass rivet stud
      g.fillStyle(0xffc52a, 1);
      g.fillCircle(c.x + c.sx * 14, c.y + c.sy * 14, 4.5);
      g.fillStyle(0x321b10, 1);
      g.fillCircle(c.x + c.sx * 14, c.y + c.sy * 14, 1.5);
    }
  }

  private drawFallbackSkull(g: Phaser.GameObjects.Graphics): void {
    g.clear();
    g.fillStyle(0xf2d49a, 1);
    // Skull center
    g.fillRoundedRect(-14, -196, 28, 24, 4);
    // Horns
    g.lineStyle(4, 0xf2d49a, 1);
    g.lineBetween(-14, -192, -34, -204);
    g.lineBetween(-34, -204, -38, -214);
    g.lineBetween(14, -192, 34, -204);
    g.lineBetween(34, -204, 38, -214);
    // Eye sockets
    g.fillStyle(0x221209, 1);
    g.fillCircle(-6, -188, 3);
    g.fillCircle(6, -188, 3);
  }

  private createWASDCluster(): {
    keycaps: Record<KeyName, KeycapVisual>;
    arrows: Record<KeyName, Phaser.GameObjects.Graphics>;
  } {
    const cx = -135;
    const cy = 12;

    const keyConfigs: Record<KeyName, { x: number; y: number; dir: 'up' | 'left' | 'down' | 'right'; arrowPos: { x: number; y: number } }> = {
      W: { x: cx, y: cy - 54, dir: 'up', arrowPos: { x: cx, y: cy - 98 } },
      A: { x: cx - 62, y: cy + 8, dir: 'left', arrowPos: { x: cx - 108, y: cy + 8 } },
      S: { x: cx, y: cy + 8, dir: 'down', arrowPos: { x: cx, y: cy + 62 } },
      D: { x: cx + 62, y: cy + 8, dir: 'right', arrowPos: { x: cx + 108, y: cy + 8 } },
    };

    const arrows = {} as Record<KeyName, Phaser.GameObjects.Graphics>;
    const keycaps = {} as Record<KeyName, KeycapVisual>;

    for (const [key, conf] of Object.entries(keyConfigs) as Array<[KeyName, typeof keyConfigs[KeyName]]>) {
      // 1. Directional Arrow
      const arrowGfx = this.scene.add.graphics().setPosition(conf.arrowPos.x, conf.arrowPos.y);
      this.drawArrow(arrowGfx, conf.dir, false);
      this.plaqueContainer.add(arrowGfx);
      arrows[key] = arrowGfx;

      // 2. Keycap Container
      const kContainer = this.scene.add.container(conf.x, conf.y);
      this.plaqueContainer.add(kContainer);

      // Glow behind key
      const glow = this.scene.add.graphics();
      glow.fillStyle(0xff791c, 0.4);
      glow.fillCircle(0, 0, 36);
      glow.fillStyle(0xffc52a, 0.3);
      glow.fillCircle(0, 0, 26);
      glow.setAlpha(0);
      kContainer.add(glow);

      // Action sparks around key
      const sparks = this.scene.add.graphics();
      this.drawSparks(sparks);
      sparks.setVisible(false);
      kContainer.add(sparks);

      // Keycap 3D body
      const base = this.scene.add.graphics();
      this.drawKeycapBody(base, false);
      kContainer.add(base);

      // Letter text
      const label = this.scene.add.text(0, -1, key, {
        fontFamily: THEME.typography.pixelFont,
        fontSize: '18px',
        color: '#f2d49a',
      }).setOrigin(0.5);
      kContainer.add(label);

      keycaps[key] = {
        container: kContainer,
        base,
        glow,
        sparks,
        label,
        baseY: conf.y,
      };
    }

    return { keycaps, arrows };
  }

  private drawKeycapBody(g: Phaser.GameObjects.Graphics, active: boolean): void {
    g.clear();
    const w = 52;
    const h = 48;
    const x = -w / 2;
    const y = -h / 2;

    // Drop shadow / lower bevel lip
    g.fillStyle(0x120b08, 1);
    g.fillRoundedRect(x - 2, y + 2, w + 4, h + 4, 8);

    // Lower edge bevel
    g.fillStyle(active ? 0x6e3717 : 0x22130b, 1);
    g.fillRoundedRect(x, y + 4, w, h, 6);

    // Main top key surface
    g.fillStyle(active ? 0x542d18 : 0x381f13, 1);
    g.fillRoundedRect(x, y, w, h - 4, 6);

    // Inner rim stroke
    g.lineStyle(2, active ? 0xffc52a : 0x8a5d10, active ? 1 : 0.7);
    g.strokeRoundedRect(x + 2, y + 2, w - 4, h - 8, 5);
  }

  private drawSparks(g: Phaser.GameObjects.Graphics): void {
    g.clear();
    g.lineStyle(2, 0xffc52a, 0.9);
    // 4 subtle diagonal spark rays
    g.lineBetween(-32, -26, -39, -33);
    g.lineBetween(32, -26, 39, -33);
    g.lineBetween(-32, 26, -39, 33);
    g.lineBetween(32, 26, 39, 33);
  }

  private drawArrow(g: Phaser.GameObjects.Graphics, dir: 'up' | 'left' | 'down' | 'right', active: boolean): void {
    g.clear();
    const fillColor = active ? 0xffea78 : 0xffc52a;
    const strokeColor = 0x120b08;

    g.lineStyle(3, strokeColor, 1);
    g.fillStyle(fillColor, 1);

    if (dir === 'up') {
      g.fillRect(-5, 0, 10, 16);
      g.strokeRect(-5, 0, 10, 16);
      g.beginPath();
      g.moveTo(0, -18);
      g.lineTo(16, 2);
      g.lineTo(-16, 2);
      g.closePath();
      g.fillPath();
      g.strokePath();
    } else if (dir === 'down') {
      g.fillRect(-5, -16, 10, 16);
      g.strokeRect(-5, -16, 10, 16);
      g.beginPath();
      g.moveTo(0, 18);
      g.lineTo(16, -2);
      g.lineTo(-16, -2);
      g.closePath();
      g.fillPath();
      g.strokePath();
    } else if (dir === 'left') {
      g.fillRect(0, -5, 16, 10);
      g.strokeRect(0, -5, 16, 10);
      g.beginPath();
      g.moveTo(-18, 0);
      g.lineTo(2, -16);
      g.lineTo(2, 16);
      g.closePath();
      g.fillPath();
      g.strokePath();
    } else {
      g.fillRect(-16, -5, 16, 10);
      g.strokeRect(-16, -5, 16, 10);
      g.beginPath();
      g.moveTo(18, 0);
      g.lineTo(-2, -16);
      g.lineTo(-2, 16);
      g.closePath();
      g.fillPath();
      g.strokePath();
    }
  }

  private createHeroStance(): void {
    const hx = 145;
    const hy = 8;

    // Ground shadow ellipse
    const shadow = this.scene.add.graphics();
    shadow.fillStyle(0x000000, 0.4);
    shadow.fillEllipse(hx, hy + 64, 56, 18);
    this.plaqueContainer.add(shadow);

    const pixellabKey = `pl_${this.heroId}_south_0`;
    const heroSheetKey = `hero_${this.heroId}`;
    const avatarKey = `hud_avatar_${this.heroId}`;

    let heroSprite: Phaser.GameObjects.GameObject | null = null;

    if (this.scene.textures.exists(pixellabKey)) {
      heroSprite = this.scene.add.sprite(hx, hy + 8, pixellabKey).setScale(1.15).setOrigin(0.5);
    } else if (this.scene.textures.exists(heroSheetKey)) {
      heroSprite = this.scene.add.sprite(hx, hy + 8, heroSheetKey, 0).setScale(1.8).setOrigin(0.5);
    } else if (this.scene.textures.exists(avatarKey)) {
      heroSprite = this.scene.add.image(hx, hy + 8, avatarKey).setScale(1.2).setOrigin(0.5);
    }

    if (heroSprite) {
      this.plaqueContainer.add(heroSprite);
      this.scene.tweens.add({
        targets: heroSprite,
        scaleY: '*=1.025',
        y: hy + 7,
        duration: 1100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private drawParchmentBanner(g: Phaser.GameObjects.Graphics): void {
    g.clear();
    const w = 530;
    const h = 68;
    const x = -w / 2;
    const y = 112;

    // Banner shadow
    g.fillStyle(0x120b08, 0.5);
    g.fillRoundedRect(x + 3, y + 4, w, h, 8);

    // Parchment paper fill
    g.fillStyle(0xf2d49a, 1);
    g.fillRoundedRect(x, y, w, h, 6);

    // Border
    g.lineStyle(2.5, 0x603719, 1);
    g.strokeRoundedRect(x, y, w, h, 6);

    // Decorative inner border
    g.lineStyle(1, 0xba8c4d, 0.6);
    g.strokeRoundedRect(x + 4, y + 4, w - 8, h - 8, 4);

    // Swag notches at left and right
    g.fillStyle(0x381f13, 1);
    g.fillTriangle(x, y + h / 2 - 8, x, y + h / 2 + 8, x + 8, y + h / 2);
    g.fillTriangle(x + w, y + h / 2 - 8, x + w, y + h / 2 + 8, x + w - 8, y + h / 2);
  }

  private startKeySequenceAnimation(): void {
    const sequence: KeyName[] = ['W', 'D', 'S', 'A'];
    const dirs: Record<KeyName, 'up' | 'left' | 'down' | 'right'> = {
      W: 'up',
      D: 'right',
      S: 'down',
      A: 'left',
    };

    this.keySequenceTimer = this.scene.time.addEvent({
      delay: 430,
      loop: true,
      callback: () => {
        if (this.isDismissing) return;
        // Turn off previous key
        const prevKey = sequence[this.currentKeyIndex];
        const prevCap = this.keycaps[prevKey];
        if (prevCap) {
          prevCap.container.y = prevCap.baseY;
          prevCap.glow.setAlpha(0);
          prevCap.sparks.setVisible(false);
          this.drawKeycapBody(prevCap.base, false);
          prevCap.label.setColor('#f2d49a');
          const prevArrow = this.arrows[prevKey];
          if (prevArrow) {
            this.drawArrow(prevArrow, dirs[prevKey], false);
            prevArrow.setScale(1.0);
          }
        }

        // Advance to next key
        this.currentKeyIndex = (this.currentKeyIndex + 1) % sequence.length;
        const nextKey = sequence[this.currentKeyIndex];
        const nextCap = this.keycaps[nextKey];
        const nextArrow = this.arrows[nextKey];

        if (nextCap) {
          // Key presses down by 3px
          nextCap.container.y = nextCap.baseY + 3;
          nextCap.glow.setAlpha(0.85);
          nextCap.sparks.setVisible(true);
          this.drawKeycapBody(nextCap.base, true);
          nextCap.label.setColor('#ffffff');

          this.scene.tweens.add({
            targets: nextCap.glow,
            alpha: 0.2,
            duration: 380,
            ease: 'Quad.easeOut',
          });

          this.scene.time.delayedCall(200, () => {
            if (this.isDismissing) return;
            nextCap.container.y = nextCap.baseY;
          });
        }

        if (nextArrow) {
          this.drawArrow(nextArrow, dirs[nextKey], true);
          this.scene.tweens.add({
            targets: nextArrow,
            scaleX: 1.25,
            scaleY: 1.25,
            duration: 180,
            yoyo: true,
            ease: 'Back.easeOut',
          });
        }
      },
    });
  }

  private bindKeyboardControls(): void {
    const dismissKeys = ['W', 'A', 'S', 'D', 'UP', 'DOWN', 'LEFT', 'RIGHT', 'SPACE', 'ESC', 'T'];
    for (const k of dismissKeys) {
      const eventName = `keydown-${k}`;
      const fn = () => this.dismiss();
      this.boundKeyListeners.push({ event: eventName, fn });
      this.scene.input.keyboard?.on(eventName, fn);
    }
  }

  public update(_playerX: number, _playerY: number, _time: number): void {
    this.root.setVisible(this.model.visible);
    this.backdrop.setVisible(this.model.visible);
    this.backdropZone?.setVisible(this.model.visible);
    this.skipButton.setVisible(this.model.blocking);

    if (!this.model.visible) {
      this.keySequenceTimer?.remove();
    }
  }

  public dismiss(): void {
    if (this.isDismissing) return;
    this.isDismissing = true;

    this.keySequenceTimer?.remove();

    this.scene.tweens.add({
      targets: [this.root, this.backdrop, this.skipButton],
      alpha: 0,
      scaleX: '*=0.96',
      scaleY: '*=0.96',
      duration: 220,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.model.skip();
        this.onSkip();
        this.destroy();
      },
    });
  }

  public destroy(): void {
    this.keySequenceTimer?.remove();
    this.scene.scale.off('resize', this.resize);

    for (const { event, fn } of this.boundKeyListeners) {
      this.scene.input.keyboard?.off(event, fn);
    }
    this.boundKeyListeners = [];

    this.backdrop?.destroy();
    this.backdropZone?.destroy();
    this.root?.destroy();
    this.skipButton?.destroy();
  }
}
