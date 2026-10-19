import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { CharacterData } from '../data/characters';
import { PASSIVES } from '../data/passives';
import { WEAPONS, WeaponDef } from '../data/weapons';
import { THEME } from '../ui/theme/tokens';
import { UpgradeChoice } from './LevelUpScene';
import { getBossForStage } from '../data/bosses';
import {
  createPixellabAnims,
  hasPixellabHero,
  pickDirection,
  pixellabAnimKey,
  pixellabIdleFrame,
  PIXELLAB_HERO_SCALE,
  PixelDir,
} from '../systems/PixellabHeroes';
import {
  createGreedwellAnims,
  greedwellAnimKey,
  greedwellFirstFrame,
  GREEDWELL_SCALE,
  GREEDWELL_SHOOT_FIRE_FRAME,
  hasGreedwellSprites,
} from '../systems/GreedwellSprites';
import { WorldMap, WORLD_W, WORLD_H } from '../systems/WorldMap';
import { GameDirector, SpawnOrder } from '../systems/GameDirector';
import { GameEvents, GameEventNames, SpecialWaveEvent } from '../systems/GameEvents';
import { SpatialHash } from '../systems/SpatialHash';
import { SpritePool } from '../systems/SpritePool';
import { ENEMY_DEFS, EnemyKind } from '../data/enemies';
import { getEligibleEvolution, WEAPON_EVOLUTIONS, WeaponEvolution } from '../data/evolutions';

interface Projectile {
  sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Arc;
  vx: number;
  vy: number;
  damage: number;
  pierce: number;
  hits: Set<Enemy>;
  life: number;
  isLasso?: boolean;
  angleOffset?: number;
  radius?: number;
  isBouncingSniper?: boolean;
  bouncesLeft?: number;
  isExplosiveBullet?: boolean;
}

interface Enemy {
  sprite: Phaser.GameObjects.Sprite;
  type: EnemyKind | 'boss';
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  xpVal: number;
  bountyVal: number;
  throwCooldown?: number;
  usesPixellab?: boolean;
  animLock?: number;
  pooled?: boolean;
  dead?: boolean;
  tint?: number;
  aiTimer?: number;
  dirX?: number;
  dirY?: number;
}

interface Drop {
  sprite: Phaser.GameObjects.Sprite;
  type: 'gold' | 'badge' | 'whiskey';
  val: number;
  bounty: number;
}

interface FireZone {
  x: number;
  y: number;
  radius: number;
  damage: number;
  life: number;
  tickTimer: number;
  graphics: Phaser.GameObjects.Graphics;
}

export class GameScene extends Phaser.Scene {
  private character!: CharacterData;
  private stage: number = 1;

  // Player Stats
  private player!: Phaser.GameObjects.Sprite;
  private usePixellab = false;
  private facingDir: PixelDir = 'south';
  private hp: number = 100;
  private maxHp: number = 100;
  private moveSpeed: number = 180;
  private magnetRadius: number = 120;
  private damageMultiplier: number = 1.0;
  private fireRateMultiplier: number = 1.0;
  private armor: number = 0;
  private hpRegen: number = 0;
  private xpBonus: number = 1.0;
  private critChance: number = 0.1;
  private critMultiplier: number = 2.0;
  private areaMultiplier: number = 1.0;
  private extraProjectiles: number = 0;
  private luck: number = 1.0;

  // Progression
  private level: number = 1;
  private currentXp: number = 0;
  private xpToNextLevel: number = 20;
  private bounty: number = 0;
  private kills: number = 0;
  private gameTimeSeconds: number = 0;
  private isGameOver: boolean = false;

  // Inventories
  private activeWeapons: Map<string, number> = new Map();
  private activePassives: Map<string, number> = new Map();
  private weaponTimers: Map<string, number> = new Map();

  // Entities
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private drops: Drop[] = [];
  private fireZones: FireZone[] = [];
  private bossEnemy: Enemy | null = null;
  private bossSpawned: boolean = false;

  // Background & Camera
  private groundTile!: Phaser.GameObjects.TileSprite;
  private worldMap!: WorldMap;
  private invulnUntil: number = 0;
  private director!: GameDirector;
  private gameEvents!: GameEvents;
  private enemyPool!: SpritePool;
  private enemyHash!: SpatialHash<Enemy>;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keysWASD!: { [key: string]: Phaser.Input.Keyboard.Key };

  // HUD Elements
  private xpBarFill!: Phaser.GameObjects.Graphics;
  private hpBarFill!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private bountyText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private killsText!: Phaser.GameObjects.Text;
  private bossBarContainer!: Phaser.GameObjects.Container;
  private bossHpFill!: Phaser.GameObjects.Graphics;

  // Mobile Touch Controls
  private touchOrigin: { x: number; y: number } | null = null;
  private touchVector: { x: number; y: number } = { x: 0, y: 0 };
  private touchJoystickGfx!: Phaser.GameObjects.Graphics;

  constructor() {
    super('GameScene');
  }

  init(data: { character: CharacterData; stage?: number }) {
    this.character = data.character;
    this.stage = data.stage || 1;
  }

  create() {
    const { width, height } = this.scale;
    this.isGameOver = false;
    this.bossSpawned = false;
    this.bossEnemy = null;
    this.enemies = [];
    this.projectiles = [];
    this.drops = [];
    this.fireZones = [];
    this.gameTimeSeconds = 0;
    this.kills = 0;
    this.bounty = 0;
    this.level = 1;
    this.currentXp = 0;
    this.xpToNextLevel = 25;

    // Apply Character Starting Stats
    this.hp = this.character.stats.maxHp;
    this.maxHp = this.character.stats.maxHp;
    this.moveSpeed = this.character.stats.moveSpeed;
    this.damageMultiplier = this.character.stats.damageMultiplier;
    this.fireRateMultiplier = this.character.stats.fireRateMultiplier;
    this.magnetRadius = this.character.stats.magnetRadius;
    this.armor = this.character.stats.armor;
    this.hpRegen = 0;
    this.xpBonus = 1.0;
    this.critChance = this.character.stats.critChance || 0.1;
    this.critMultiplier = 2.0;
    this.areaMultiplier = 1.0;
    this.extraProjectiles = 0;
    this.luck = 1.0;

    // Initialize Inventory with Starter Weapon
    this.activeWeapons.clear();
    this.activePassives.clear();
    this.weaponTimers.clear();
    this.activeWeapons.set(this.character.starterWeapon, 1);
    this.weaponTimers.set(this.character.starterWeapon, 0);

    // Giant explorable desert floor (world space, culled by the camera)
    this.invulnUntil = 0;
    this.groundTile = this.add.tileSprite(0, 0, WORLD_W, WORLD_H, 'desert_ground').setOrigin(0, 0).setDepth(-10);
    const startX = WORLD_W / 2;
    const startY = WORLD_H / 2;
    this.worldMap = new WorldMap(this, startX, startY);

    // Player Sprite (32-bit Neo Geo Arcade Hero)
    const heroKey = `hero_${this.character.id}`;
    this.usePixellab = hasPixellabHero(this.character.id) && this.textures.exists(pixellabIdleFrame(this.character.id, 'south'));
    this.facingDir = 'south';
    if (this.usePixellab) {
      createPixellabAnims(this, this.character.id);
      this.player = this.add
        .sprite(startX, startY, pixellabIdleFrame(this.character.id, 'south'))
        .setScale(PIXELLAB_HERO_SCALE);
    } else if (this.textures.exists(heroKey)) {
      this.player = this.add.sprite(startX, startY, heroKey, 0).setScale(0.5);
    } else {
      this.player = this.add.sprite(startX, startY, `player_${this.character.id}`).setScale(1.0);
    }
    this.player.setDepth(10);

    // Smooth camera follow inside world bounds
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.worldMap.update(startX, startY);

    // Horde systems: director, pool, spatial hash, event bus
    this.gameEvents = new GameEvents();
    this.director = new GameDirector(this.gameEvents);
    this.enemyPool = new SpritePool(this, 5);
    this.enemyHash = new SpatialHash<Enemy>(64);
    this.gameEvents.on(GameEventNames.SpecialWave, (e: SpecialWaveEvent) => this.showBanner(e.label, '#ffc52a'));
    this.gameEvents.on(GameEventNames.EliteSpawned, () => this.showBanner('★ ELITE BOUNTY HUNTER ★', '#ff791c'));

    // Keyboard Inputs
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keysWASD = this.input.keyboard.addKeys('W,A,S,D') as { [key: string]: Phaser.Input.Keyboard.Key };

      // Press 'L' to trigger Level Up Bounty cards test
      this.input.keyboard.on('keydown-L', () => {
        this.triggerLevelUp();
      });

      // ESC key to Pause
      this.input.keyboard.on('keydown-ESC', () => {
        if (this.isGameOver || this.scene.isPaused('GameScene')) return;
        this.scene.pause('GameScene');
        this.scene.launch('PauseScene', {
          character: this.character,
          stage: this.stage,
        });
      });
    }

    // Touch / Mobile Input Handling
    this.touchJoystickGfx = this.add.graphics().setDepth(100).setScrollFactor(0);
    this.setupTouchControls();

    // Create Arcade HUD
    this.createHUD();

    // Game Timer Loop (Seconds)
    this.time.addEvent({
      delay: 1000,
      callback: () => this.onSecondTick(),
      loop: true,
    });

    // Enemy Spawner Loop
    this.time.addEvent({
      delay: 1200,
      callback: () => this.spawnWave(),
      loop: true,
    });

    sounds.startBGM();
  }

  private setupTouchControls() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Left half of screen controls joystick
      if (pointer.x < this.scale.width * 0.6) {
        this.touchOrigin = { x: pointer.x, y: pointer.y };
        this.touchVector = { x: 0, y: 0 };
        this.renderJoystick();
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.touchOrigin) {
        const dx = pointer.x - this.touchOrigin.x;
        const dy = pointer.y - this.touchOrigin.y;
        const dist = Math.hypot(dx, dy);
        const maxDist = 50;
        const clampedDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);
        this.touchVector = {
          x: (Math.cos(angle) * clampedDist) / maxDist,
          y: (Math.sin(angle) * clampedDist) / maxDist,
        };
        this.renderJoystick(pointer.x, pointer.y);
      }
    });

    const resetTouch = () => {
      this.touchOrigin = null;
      this.touchVector = { x: 0, y: 0 };
      this.touchJoystickGfx.clear();
    };

    this.input.on('pointerup', resetTouch);
  }

  private renderJoystick(curX?: number, curY?: number) {
    if (!this.touchOrigin) return;
    this.touchJoystickGfx.clear();
    // Outer base
    this.touchJoystickGfx.fillStyle(0x000000, 0.35);
    this.touchJoystickGfx.fillCircle(this.touchOrigin.x, this.touchOrigin.y, 50);
    this.touchJoystickGfx.lineStyle(2, 0xf5c518, 0.7);
    this.touchJoystickGfx.strokeCircle(this.touchOrigin.x, this.touchOrigin.y, 50);
    // Inner thumbstick
    const tx = curX !== undefined ? curX : this.touchOrigin.x;
    const ty = curY !== undefined ? curY : this.touchOrigin.y;
    this.touchJoystickGfx.fillStyle(0xf5c518, 0.85);
    this.touchJoystickGfx.fillCircle(tx, ty, 20);
  }

  private createHUD() {
    const { width } = this.scale;

    // Top XP Bar Frame
    const xpBg = this.add.graphics().setDepth(50).setScrollFactor(0);
    xpBg.fillStyle(0x1a0f08, 0.9);
    xpBg.fillRect(0, 0, width, 18);
    xpBg.lineStyle(2, 0x8b5a2b, 1);
    xpBg.strokeRect(0, 0, width, 18);

    this.xpBarFill = this.add.graphics().setDepth(51).setScrollFactor(0);
    this.updateXpBar();

    // Top Level Text
    this.levelText = this.add.text(12, 2, 'LV. 01', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '11px',
      color: '#ffe066',
      stroke: '#000',
      strokeThickness: 2,
    }).setDepth(52).setScrollFactor(0);

    // HUD Top Bar Info
    const hudTopY = 32;

    // Player Health Heart & Bar
    const hpBg = this.add.graphics().setDepth(50).setScrollFactor(0);
    hpBg.fillStyle(0x0a0503, 0.85);
    hpBg.fillRoundedRect(16, hudTopY, 190, 24, 4);
    hpBg.lineStyle(2, 0x452b14, 1);
    hpBg.strokeRoundedRect(16, hudTopY, 190, 24, 4);

    this.hpBarFill = this.add.graphics().setDepth(51).setScrollFactor(0);
    this.updateHpBar();

    this.hpText = this.add.text(26, hudTopY + 5, `HP ${this.hp}/${this.maxHp}`, {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 2,
    }).setDepth(52).setScrollFactor(0);

    // Timer (Center)
    this.timeText = this.add.text(width / 2, hudTopY + 12, '00:00', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#8b0e0e',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(50).setScrollFactor(0);

    // Bounty $ & Kills (Right)
    this.bountyText = this.add.text(width - 24, hudTopY + 2, '$00000', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '15px',
      color: THEME.colors.gold.base,
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(50).setScrollFactor(0);

    this.killsText = this.add.text(width - 24, hudTopY + 22, '☠ 000', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '11px',
      color: '#ef4444',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(1, 0).setDepth(50).setScrollFactor(0);

    // Simon Greedwell Boss Bar Container (Hidden until boss spawns)
    this.bossBarContainer = this.add.container(width / 2, 85).setDepth(55).setScrollFactor(0).setVisible(false);

    const bossBg = this.add.graphics();
    bossBg.fillStyle(0x1a0f08, 0.95);
    bossBg.fillRoundedRect(-180, -14, 360, 28, 6);
    bossBg.lineStyle(2, 0xdc2626, 1);
    bossBg.strokeRoundedRect(-180, -14, 360, 28, 6);
    this.bossBarContainer.add(bossBg);

    this.bossHpFill = this.add.graphics();
    this.bossBarContainer.add(this.bossHpFill);

    const bossLabel = this.add.text(0, 0, '★ WANTED: SIMON GREEDWELL ★', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '10px',
      color: '#fef08a',
      stroke: '#8b0e0e',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.bossBarContainer.add(bossLabel);
  }

  private updateXpBar() {
    const { width } = this.scale;
    const pct = Math.min(this.currentXp / this.xpToNextLevel, 1);
    this.xpBarFill.clear();
    this.xpBarFill.fillStyle(0x00f0ff, 1);
    this.xpBarFill.fillRect(2, 2, (width - 4) * pct, 14);
  }

  private updateHpBar() {
    const pct = Math.max(0, Math.min(this.hp / this.maxHp, 1));
    this.hpBarFill.clear();
    this.hpBarFill.fillStyle(pct > 0.3 ? 0x22c55e : 0xef4444, 1);
    this.hpBarFill.fillRoundedRect(18, 34, 186 * pct, 20, 3);
  }

  private updateBossBar() {
    if (!this.bossEnemy) return;
    const pct = Math.max(0, Math.min(this.bossEnemy.hp / this.bossEnemy.maxHp, 1));
    this.bossHpFill.clear();
    this.bossHpFill.fillStyle(0xdc2626, 1);
    this.bossHpFill.fillRoundedRect(-178, -12, 356 * pct, 24, 4);
  }

  // 1 Second Game Tick
  private onSecondTick() {
    if (this.isGameOver) return;
    this.gameTimeSeconds++;

    // Format timer MM:SS
    const mins = Math.floor(this.gameTimeSeconds / 60);
    const secs = this.gameTimeSeconds % 60;
    this.timeText.setText(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);

    // Health Regeneration from Whiskey
    if (this.hpRegen > 0 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.hpRegen);
      this.hpText.setText(`HP ${Math.round(this.hp)}/${this.maxHp}`);
      this.updateHpBar();
    }

    // Boss Spawn Check: At 90 seconds (1:30) or 75 kills
    if (!this.bossSpawned && (this.gameTimeSeconds >= 90 || this.kills >= 75)) {
      this.spawnSimonGreedwell();
    }

    // Game Director: special waves and elites
    this.runSpawnOrders(this.director.tick(this.gameTimeSeconds, this.enemies.length));
  }

  private showBanner(text: string, color: string) {
    const banner = this.add.text(this.scale.width / 2, this.scale.height / 2 - 130, text, {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '18px',
      color,
      stroke: '#000',
      strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(80);
    this.tweens.add({
      targets: banner,
      alpha: 0,
      y: banner.y - 24,
      duration: 2000,
      onComplete: () => banner.destroy(),
    });
  }

  private spawnSimonGreedwell() {
    this.bossSpawned = true;
    sounds.playBossWarning();

    // Camera shake & announcement banner
    const bossData = getBossForStage(this.stage);
    this.cameras.main.shake(600, 0.015);
    const warning = this.add.text(this.scale.width / 2, this.scale.height / 2 - 80, `⚠ ${bossData.name.toUpperCase()} APPROACHES! ⚠`, {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '20px',
      color: '#ef4444',
      stroke: '#000',
      strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(80);

    this.tweens.add({
      targets: warning,
      alpha: 0,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 2200,
      onComplete: () => warning.destroy(),
    });

    this.bossBarContainer.setVisible(true);

    // Spawn Boss Simon Greedwell
    const bossSpawn = this.worldMap.spawnPointAround(this.player.x, this.player.y);
    const spawnX = bossSpawn.x;
    const spawnY = bossSpawn.y;

    const usesPixellab = hasGreedwellSprites(this);
    if (usesPixellab) createGreedwellAnims(this);
    const sprite = usesPixellab
      ? this.add.sprite(spawnX, spawnY, greedwellFirstFrame('run_east')).setScale(GREEDWELL_SCALE).setDepth(15)
      : this.add.sprite(spawnX, spawnY, 'boss_greedwell').setScale(1.2).setDepth(15);
    this.bossEnemy = {
      sprite,
      type: 'boss',
      hp: 2000,
      maxHp: 2000,
      speed: 105,
      damage: 28,
      xpVal: 150,
      bountyVal: 10000,
      throwCooldown: 1200,
      usesPixellab,
      animLock: 0,
    };
    this.enemies.push(this.bossEnemy);
    this.updateBossBar();
  }

  // Wave Spawner
  private spawnWave() {
    if (this.isGameOver) return;
    this.runSpawnOrders(this.director.waveOrders(this.gameTimeSeconds, this.enemies.length));
  }

  private runSpawnOrders(orders: SpawnOrder[]) {
    const px = this.player.x;
    const py = this.player.y;
    const clampX = (v: number) => Phaser.Math.Clamp(v, 48, WORLD_W - 48);
    const clampY = (v: number) => Phaser.Math.Clamp(v, 48, WORLD_H - 48);

    for (const order of orders) {
      const base = this.worldMap.spawnPointAround(px, py);
      for (let i = 0; i < order.count; i++) {
        let x: number;
        let y: number;
        if (order.pattern === 'encircle') {
          const a = (i / order.count) * Math.PI * 2;
          x = clampX(px + Math.cos(a) * 650);
          y = clampY(py + Math.sin(a) * 650);
        } else if (order.pattern === 'cluster') {
          x = clampX(base.x + (Math.random() - 0.5) * 160);
          y = clampY(base.y + (Math.random() - 0.5) * 160);
        } else {
          const p = this.worldMap.spawnPointAround(px, py);
          x = p.x;
          y = p.y;
        }
        this.spawnEnemy(order.kind, x, y);
      }
    }
  }

  private spawnEnemy(kind: EnemyKind, x: number, y: number) {
    const def = ENEMY_DEFS[kind];
    const hp = def.baseHp + this.gameTimeSeconds * def.hpPerSecond;
    const sprite = this.enemyPool.acquire(x, y, def.texture, def.scale);
    if (def.tint) sprite.setTint(def.tint);
    this.enemies.push({
      sprite,
      type: kind,
      hp,
      maxHp: hp,
      speed: def.speed,
      damage: def.damage,
      xpVal: def.xp,
      bountyVal: def.bounty,
      throwCooldown: kind === 'dynamiter' ? 2000 : undefined,
      pooled: true,
      tint: def.tint,
    });
  }

  update(time: number, delta: number) {
    if (this.isGameOver) return;

    this.handlePlayerMovement(delta);
    this.handleWeaponsAutoFire(delta);
    this.updateProjectiles(delta);
    this.updateEnemies(delta);
    this.worldMap.update(this.player.x, this.player.y);
    this.updateDrops(delta);
    this.updateFireZones(delta);
  }

  // 1. Player Movement & Facing Direction
  private handlePlayerMovement(delta: number) {
    let dx = 0;
    let dy = 0;

    // Keyboard WASD / Arrows
    if (this.cursors.left.isDown || this.keysWASD.A.isDown) dx -= 1;
    if (this.cursors.right.isDown || this.keysWASD.D.isDown) dx += 1;
    if (this.cursors.up.isDown || this.keysWASD.W.isDown) dy -= 1;
    if (this.cursors.down.isDown || this.keysWASD.S.isDown) dy += 1;

    // Mobile Touch Joystick
    if (this.touchOrigin) {
      dx += this.touchVector.x;
      dy += this.touchVector.y;
    }

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      const nx = dx / len;
      const ny = dy / len;
      const step = (this.moveSpeed * delta) / 1000;

      this.player.x += nx * step;
      this.player.y += ny * step;

      if (this.usePixellab) {
        // 6-direction Pixellab walk cycle (SW mirrors SE, NE/NW use north)
        const choice = pickDirection(this.character.id, nx, ny);
        this.facingDir = choice.dir;
        this.player.setFlipX(choice.flipX);
        const key = pixellabAnimKey(this.character.id, choice.dir);
        if (this.player.anims.currentAnim?.key !== key || !this.player.anims.isPlaying) {
          this.player.play(key);
        }
      } else {
        // Flip sprite to face movement direction
        if (dx < -0.1) this.player.setFlipX(true);
        if (dx > 0.1) this.player.setFlipX(false);
      }

      // Play 32-bit running animation (legacy sheets only)
      const animKey = `${this.character.id}_run`;
      if (!this.usePixellab && this.anims.exists(animKey) && (!this.player.anims.isPlaying || this.player.anims.currentAnim?.key !== animKey)) {
        this.player.play(animKey);
      }

      // Collide with obstacles and stay inside the world
      const fixed = this.worldMap.resolve(this.player.x, this.player.y, 10);
      this.player.x = fixed.x;
      this.player.y = fixed.y;
    } else {
      // Idle: stop running animation and return to ready stance frame 0
      if (this.player.anims && this.player.anims.isPlaying) {
        this.player.stop();
        if (this.usePixellab) {
          this.player.setTexture(pixellabIdleFrame(this.character.id, this.facingDir));
        } else {
          this.player.setFrame(0);
        }
      }
    }
  }

  // 2. Weapon Auto-Fire Systems
  private handleWeaponsAutoFire(delta: number) {
    this.activeWeapons.forEach((level, weaponId) => {
      const def = WEAPONS[weaponId];
      if (!def) return;
      const lvlInfo = def.levels[level - 1];
      const curTimer = (this.weaponTimers.get(weaponId) || 0) + delta;

      const effectiveCooldown = (lvlInfo.cooldownMs / this.fireRateMultiplier);
      if (curTimer >= effectiveCooldown) {
        this.fireWeapon(def, lvlInfo);
        this.weaponTimers.set(weaponId, 0);
      } else {
        this.weaponTimers.set(weaponId, curTimer);
      }
    });
  }

  private fireWeapon(def: WeaponDef, lvl: { damage: number; projectileCount: number; pierce: number; speed: number; range: number }) {
    const nearest = this.getNearestEnemies(lvl.range);
    const facingAngle = this.player.flipX ? Math.PI : 0;

    switch (def.id) {
      case 'revolver':
      case 'peacemaker':
      case 'desperado_fury': {
        sounds.playPlayerGunshot();
        const totalProj = lvl.projectileCount + this.extraProjectiles;
        const targets = nearest.slice(0, totalProj);
        const isDesperado = def.id === 'desperado_fury';
        for (let i = 0; i < totalProj; i++) {
          let angle = facingAngle;
          if (targets[i]) {
            angle = Math.atan2(targets[i].sprite.y - this.player.y, targets[i].sprite.x - this.player.x);
          } else {
            angle += (i - (totalProj - 1) / 2) * 0.2;
          }

          const sprite = this.add.sprite(this.player.x, this.player.y, 'proj_bullet').setDepth(8);
          if (isDesperado) sprite.setTint(0xff791c).setScale(1.4);
          sprite.setRotation(angle);
          this.projectiles.push({
            sprite,
            vx: Math.cos(angle) * lvl.speed,
            vy: Math.sin(angle) * lvl.speed,
            damage: Math.round(lvl.damage * this.damageMultiplier),
            pierce: lvl.pierce,
            hits: new Set(),
            life: (lvl.range / lvl.speed) * 1000,
            isExplosiveBullet: isDesperado,
          });
        }
        break;
      }

      case 'shotgun':
      case 'blunderbuss_doom': {
        sounds.playShotgun();
        let centerAngle = facingAngle;
        if (nearest[0]) {
          centerAngle = Math.atan2(nearest[0].sprite.y - this.player.y, nearest[0].sprite.x - this.player.x);
        }

        const isBlunder = def.id === 'blunderbuss_doom';
        const totalProj = lvl.projectileCount + (isBlunder ? this.extraProjectiles * 2 : this.extraProjectiles);
        const spread = isBlunder ? 0.9 : 0.5; // cone spread
        for (let i = 0; i < totalProj; i++) {
          const offset = ((i / (totalProj - 1)) - 0.5) * spread;
          const angle = centerAngle + offset;
          const sprite = this.add.sprite(this.player.x, this.player.y, 'proj_pellet').setDepth(8);
          if (isBlunder) sprite.setTint(0xff3300).setScale(1.5);
          this.projectiles.push({
            sprite,
            vx: Math.cos(angle) * (lvl.speed + (Math.random() * 60 - 30)),
            vy: Math.sin(angle) * (lvl.speed + (Math.random() * 60 - 30)),
            damage: Math.round(lvl.damage * this.damageMultiplier),
            pierce: lvl.pierce,
            hits: new Set(),
            life: (lvl.range / lvl.speed) * 1000,
          });
        }
        break;
      }

      case 'rifle':
      case 'golden_repeater': {
        sounds.playRifle();
        let angle = facingAngle;
        if (nearest[0]) {
          angle = Math.atan2(nearest[0].sprite.y - this.player.y, nearest[0].sprite.x - this.player.x);
        }

        const isGolden = def.id === 'golden_repeater';
        const totalProj = lvl.projectileCount + this.extraProjectiles;
        for (let i = 0; i < totalProj; i++) {
          const a = angle + (i - (totalProj - 1) / 2) * 0.12;
          const sprite = this.add.sprite(this.player.x, this.player.y, 'proj_rifle').setDepth(8);
          if (isGolden) sprite.setTint(0xffc52a).setScale(1.6);
          sprite.setRotation(a);
          this.projectiles.push({
            sprite,
            vx: Math.cos(a) * lvl.speed,
            vy: Math.sin(a) * lvl.speed,
            damage: Math.round(lvl.damage * this.damageMultiplier),
            pierce: lvl.pierce,
            hits: new Set(),
            life: (lvl.range / lvl.speed) * 1000,
            isBouncingSniper: isGolden,
            bouncesLeft: isGolden ? 3 : 0,
          });
        }
        break;
      }

      case 'dynamite':
      case 'hellfire_keg': {
        sounds.playRicochet();
        const target = nearest[0];
        const isKeg = def.id === 'hellfire_keg';
        const tx = target ? target.sprite.x : this.player.x + (this.player.flipX ? -200 : 200);
        const ty = target ? target.sprite.y : this.player.y;

        const sprite = this.add.sprite(this.player.x, this.player.y, 'proj_dynamite').setDepth(8);
        if (isKeg) sprite.setTint(0xff2200).setScale(1.8);
        this.tweens.add({
          targets: sprite,
          x: tx,
          y: ty,
          rotation: Math.PI * 6,
          duration: isKeg ? 800 : 650,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            sprite.destroy();
            this.explodeDynamite(tx, ty, lvl.damage, isKeg);
          },
        });
        break;
      }

      case 'molotov': {
        const tx = this.player.x + (Math.random() * 300 - 150);
        const ty = this.player.y + (Math.random() * 300 - 150);
        sounds.playRicochet();

        const gfx = this.add.graphics().setDepth(4);
        this.fireZones.push({
          x: tx,
          y: ty,
          radius: 65 * this.areaMultiplier,
          damage: Math.round(lvl.damage * this.damageMultiplier),
          life: 3500,
          tickTimer: 0,
          graphics: gfx,
        });
        break;
      }

      case 'lasso':
      case 'cyclone_whip': {
        // Orbiting lasso circles
        const isCyclone = def.id === 'cyclone_whip';
        const existingLassos = this.projectiles.filter((p) => p.isLasso);
        const count = lvl.projectileCount + (isCyclone ? 2 : 0) + this.extraProjectiles;
        if (existingLassos.length !== count) {
          existingLassos.forEach((p) => p.sprite.destroy());
          this.projectiles = this.projectiles.filter((p) => !p.isLasso);

          for (let i = 0; i < count; i++) {
            const sprite = this.add.sprite(this.player.x, this.player.y, 'proj_lasso').setDepth(9);
            if (isCyclone) sprite.setTint(0x00f0ff).setScale(1.8);
            this.projectiles.push({
              sprite,
              vx: 0,
              vy: 0,
              damage: Math.round(lvl.damage * this.damageMultiplier),
              pierce: 9999,
              hits: new Set(),
              life: Infinity,
              isLasso: true,
              angleOffset: (i * (Math.PI * 2)) / count,
              radius: lvl.range * this.areaMultiplier * (isCyclone ? 1.5 : 1.0),
            });
          }
        }
        break;
      }
    }
  }

  private explodeDynamite(x: number, y: number, damage: number, isKeg = false) {
    sounds.playExplosion();
    this.cameras.main.shake(isKeg ? 450 : 250, isKeg ? 0.016 : 0.008);

    const radius = (isKeg ? 150 : 90) * this.areaMultiplier;

    // Shockwave animation
    const circle = this.add.graphics().setDepth(20);
    circle.fillStyle(0xf59e0b, 0.85);
    circle.fillCircle(x, y, radius);
    circle.fillStyle(0xdc2626, 0.9);
    circle.fillCircle(x, y, radius * 0.65);

    this.tweens.add({
      targets: circle,
      alpha: 0,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: isKeg ? 500 : 350,
      onComplete: () => circle.destroy(),
    });

    if (isKeg) {
      // Cria lago de fogo persistente
      const gfx = this.add.graphics().setDepth(4);
      this.fireZones.push({
        x,
        y,
        radius: radius * 0.9,
        damage: Math.round(damage * 0.4 * this.damageMultiplier),
        life: 5000,
        tickTimer: 0,
        graphics: gfx,
      });
    }

    // Damage all enemies in explosion radius (copy: kills mutate the array)
    this.enemies.slice().forEach((enemy) => {
      const dist = Math.hypot(enemy.sprite.x - x, enemy.sprite.y - y);
      if (dist <= radius) {
        this.damageEnemy(enemy, Math.round(damage * this.damageMultiplier));
      }
    });
  }

  // 3. Update Projectiles
  private updateProjectiles(delta: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];

      if (p.isLasso) {
        // Orbit around player
        const speed = 0.004;
        const currentAngle = (p.angleOffset || 0) + this.time.now * speed;
        const r = p.radius || 100;
        p.sprite.x = this.player.x + Math.cos(currentAngle) * r;
        p.sprite.y = this.player.y + Math.sin(currentAngle) * r;
        p.sprite.setRotation(currentAngle);

        // Check collision against nearby enemies (spatial hash)
        for (const enemy of this.enemyHash.query(p.sprite.x, p.sprite.y, 32)) {
          if (enemy.dead) continue;
          if (Math.hypot(enemy.sprite.x - p.sprite.x, enemy.sprite.y - p.sprite.y) < 32) {
            if (!p.hits.has(enemy)) {
              p.hits.add(enemy);
              this.damageEnemy(enemy, p.damage);
              this.time.delayedCall(300, () => p.hits.delete(enemy));
            }
          }
        }
        continue;
      }

      // Linear Projectiles
      p.sprite.x += (p.vx * delta) / 1000;
      p.sprite.y += (p.vy * delta) / 1000;
      p.life -= delta;

      // Ricochete de borda para sniper dourado (Golden Marshal)
      if (p.isBouncingSniper && (p.bouncesLeft ?? 0) > 0) {
        const px = p.sprite.x;
        const py = p.sprite.y;
        if (px < 48 || px > WORLD_W - 48) {
          p.vx = -p.vx;
          p.bouncesLeft = (p.bouncesLeft ?? 1) - 1;
          p.sprite.setRotation(Math.atan2(p.vy, p.vx));
        }
        if (py < 48 || py > WORLD_H - 48) {
          p.vy = -p.vy;
          p.bouncesLeft = (p.bouncesLeft ?? 1) - 1;
          p.sprite.setRotation(Math.atan2(p.vy, p.vx));
        }
      }

      // Check Enemy Collisions (spatial hash candidates only)
      for (const enemy of this.enemyHash.query(p.sprite.x, p.sprite.y, 26)) {
        if (enemy.dead || p.hits.has(enemy)) continue;
        const dist = Math.hypot(enemy.sprite.x - p.sprite.x, enemy.sprite.y - p.sprite.y);
        if (dist < 26) {
          p.hits.add(enemy);
          this.damageEnemy(enemy, p.damage);

          // Explosão residual do Desperado Fury
          if (p.isExplosiveBullet) {
            this.explodeDynamite(enemy.sprite.x, enemy.sprite.y, Math.round(p.damage * 0.5));
          }

          p.pierce--;
          if (p.pierce <= 0) {
            p.life = 0;
            break;
          }
        }
      }

      if (p.life <= 0) {
        p.sprite.destroy();
        this.projectiles.splice(i, 1);
      }
    }
  }

  // 4. Update Enemies
  private updateEnemies(delta: number) {
    this.enemyHash.rebuild(this.enemies);
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const dx = this.player.x - e.sprite.x;
      const dy = this.player.y - e.sprite.y;
      const dist = Math.hypot(dx, dy);

      // AI refresh in staggered ~100-160ms intervals (boss: every frame)
      e.aiTimer = (e.aiTimer ?? Math.random() * 120) - delta;
      const refresh = e.type === 'boss' || e.aiTimer <= 0;
      if (refresh && e.type !== 'boss') e.aiTimer = 100 + Math.random() * 60;
      if (refresh && dist > 0.1) {
        e.dirX = dx / dist;
        e.dirY = dy / dist;
      }

      // Facing direction (Pixellab boss has dedicated east/west run cycles)
      if (e.usesPixellab) {
        if (e.animLock && e.animLock > 0) {
          e.animLock -= delta;
        } else {
          const runKey = greedwellAnimKey(dx < 0 ? 'run_west' : 'run_east');
          if (e.sprite.anims.currentAnim?.key !== runKey || !e.sprite.anims.isPlaying) {
            e.sprite.play(runKey);
          }
        }
      } else if (refresh) {
        e.sprite.setFlipX(dx < 0);
      }

      if (e.dirX !== undefined && e.dirY !== undefined) {
        const step = (e.speed * delta) / 1000;
        e.sprite.x += e.dirX * step;
        e.sprite.y += e.dirY * step;

        // Cheap crowd separation via spatial hash (no per-pair colliders)
        if (e.type !== 'boss') {
          const rad = ENEMY_DEFS[e.type].radius;
          for (const o of this.enemyHash.query(e.sprite.x, e.sprite.y, rad * 2)) {
            if (o === e || o.dead) continue;
            const ox = e.sprite.x - o.sprite.x;
            const oy = e.sprite.y - o.sprite.y;
            const d2 = ox * ox + oy * oy;
            const min = rad + (o.type === 'boss' ? 14 : ENEMY_DEFS[o.type].radius);
            if (d2 > 0 && d2 < min * min) {
              const d = Math.sqrt(d2);
              const push = (min - d) * 0.35;
              e.sprite.x += (ox / d) * push;
              e.sprite.y += (oy / d) * push;
            }
          }
        }

        const fixed = this.worldMap.resolve(e.sprite.x, e.sprite.y, e.type === 'boss' ? 14 : 8);
        e.sprite.x = fixed.x;
        e.sprite.y = fixed.y;
      }

      // Enemies left far behind are recycled to the spawn ring (keeps hordes on you)
      if (dist > 1400 && e.type !== 'boss') {
        const p = this.worldMap.spawnPointAround(this.player.x, this.player.y);
        e.sprite.setPosition(p.x, p.y);
        continue;
      }

      // Dynamiter attacks from distance
      if (e.type === 'dynamiter' && e.throwCooldown !== undefined) {
        e.throwCooldown -= delta;
        if (e.throwCooldown <= 0 && dist < 320) {
          e.throwCooldown = 3000;
          this.enemyThrowDynamite(e.sprite.x, e.sprite.y);
        }
      }

      // Simon Greedwell Dual Revolver Spray
      if (e.type === 'boss' && e.throwCooldown !== undefined) {
        e.throwCooldown -= delta;
        if (e.throwCooldown <= 0) {
          e.throwCooldown = 1800;
          if (e.usesPixellab) {
            // Brace-and-fire animation; bullets leave on the firing frame
            e.animLock = 650;
            e.sprite.play(greedwellAnimKey('shoot'));
            this.time.delayedCall((GREEDWELL_SHOOT_FIRE_FRAME / 14) * 1000, () => {
              if (e.sprite.active && !this.isGameOver) this.bossRevolverBarrage(e.sprite.x, e.sprite.y);
            });
          } else {
            this.bossRevolverBarrage(e.sprite.x, e.sprite.y);
          }
        }
      }

      // Damage Player on contact (discrete hit; i-frames in damagePlayer)
      if (dist < (e.type === 'boss' ? 30 : 20)) {
        this.damagePlayer(e.damage);
      }
    }
  }

  private enemyThrowDynamite(x: number, y: number) {
    sounds.playRicochet();
    const tnt = this.add.sprite(x, y, 'proj_dynamite').setDepth(8);
    const targetX = this.player.x;
    const targetY = this.player.y;

    this.tweens.add({
      targets: tnt,
      x: targetX,
      y: targetY,
      rotation: Math.PI * 4,
      duration: 800,
      onComplete: () => {
        tnt.destroy();
        sounds.playExplosion();
        const blast = this.add.graphics().setDepth(20);
        blast.fillStyle(0xdc2626, 0.8);
        blast.fillCircle(targetX, targetY, 60);
        this.tweens.add({
          targets: blast,
          alpha: 0,
          duration: 300,
          onComplete: () => blast.destroy(),
        });
        if (Math.hypot(this.player.x - targetX, this.player.y - targetY) < 65) {
          this.damagePlayer(25);
        }
      },
    });
  }

  private bossRevolverBarrage(bx: number, by: number) {
    sounds.playRevolver();
    const bullets = 8;
    for (let i = 0; i < bullets; i++) {
      const angle = (i * (Math.PI * 2)) / bullets;
      const b = this.add.sprite(bx, by, 'proj_bullet').setDepth(8).setTint(0xef4444);
      b.setRotation(angle);

      this.tweens.add({
        targets: b,
        x: bx + Math.cos(angle) * 380,
        y: by + Math.sin(angle) * 380,
        duration: 900,
        onUpdate: () => {
          if (Math.hypot(this.player.x - b.x, this.player.y - b.y) < 22) {
            this.damagePlayer(18);
            b.destroy();
          }
        },
        onComplete: () => b.destroy(),
      });
    }
  }

  // 5. Fire Zones (Molotov)
  private updateFireZones(delta: number) {
    for (let i = this.fireZones.length - 1; i >= 0; i--) {
      const zone = this.fireZones[i];
      zone.life -= delta;
      zone.tickTimer += delta;

      // Draw pulsating fire circle
      zone.graphics.clear();
      zone.graphics.fillStyle(0xf97316, 0.45 + Math.sin(this.time.now * 0.02) * 0.15);
      zone.graphics.fillCircle(zone.x, zone.y, zone.radius);
      zone.graphics.fillStyle(0xfef08a, 0.7);
      zone.graphics.fillCircle(zone.x, zone.y, zone.radius * 0.5);

      if (zone.tickTimer >= 400) {
        zone.tickTimer = 0;
        this.enemies.slice().forEach((enemy) => {
          if (Math.hypot(enemy.sprite.x - zone.x, enemy.sprite.y - zone.y) <= zone.radius) {
            this.damageEnemy(enemy, zone.damage);
          }
        });
      }

      if (zone.life <= 0) {
        zone.graphics.destroy();
        this.fireZones.splice(i, 1);
      }
    }
  }

  // 6. Drops & Magnet Pull
  private updateDrops(delta: number) {
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      const dx = this.player.x - d.sprite.x;
      const dy = this.player.y - d.sprite.y;
      const dist = Math.hypot(dx, dy);

      if (dist < this.magnetRadius) {
        // Accelerate magnet pull towards player
        const speed = 400 + (1 - dist / this.magnetRadius) * 350;
        d.sprite.x += (dx / dist) * (speed * delta) / 1000;
        d.sprite.y += (dy / dist) * (speed * delta) / 1000;
      }

      if (dist < 28) {
        // Collect drop
        sounds.playCoin();
        if (d.type === 'whiskey') {
          this.hp = Math.min(this.maxHp, this.hp + 30);
          this.hpText.setText(`HP ${Math.round(this.hp)}/${this.maxHp}`);
          this.updateHpBar();
        } else {
          this.addXp(Math.round(d.val * this.xpBonus));
          this.addBounty(d.bounty);
        }

        d.sprite.destroy();
        this.drops.splice(i, 1);
      }
    }
  }

  private addBounty(amount: number) {
    this.bounty += amount;
    this.bountyText.setText(`$${this.bounty.toLocaleString().padStart(5, '0')}`);
  }

  private addXp(amount: number) {
    this.currentXp += amount;
    if (this.currentXp >= this.xpToNextLevel) {
      this.currentXp -= this.xpToNextLevel;
      this.level++;
      this.xpToNextLevel = Math.round(this.xpToNextLevel * 1.45 + 15);
      this.levelText.setText(`LV. ${this.level.toString().padStart(2, '0')}`);
      this.triggerLevelUp();
    }
    this.updateXpBar();
  }

  // Damage Handlers with Critical Hit Calculation
  private damageEnemy(enemy: Enemy, dmg: number) {
    if (enemy.dead) return;

    // Critical Hit Roll
    const isCrit = Math.random() < this.critChance;
    const finalDamage = isCrit ? Math.round(dmg * this.critMultiplier) : dmg;

    enemy.hp -= finalDamage;

    // Flash hit white
    enemy.sprite.setTintFill(0xffffff);
    this.time.delayedCall(70, () => {
      if (enemy.dead || !enemy.sprite.active) return;
      enemy.sprite.clearTint();
      if (enemy.tint) enemy.sprite.setTint(enemy.tint);
    });

    // Floating Damage Number (amarelo ouro grande para crítico)
    this.showDamageText(enemy.sprite.x, enemy.sprite.y - 15, finalDamage, isCrit);

    if (enemy.type === 'boss') {
      this.updateBossBar();
    }

    if (enemy.hp <= 0) {
      this.killEnemy(enemy);
    }
  }

  private killEnemy(enemy: Enemy) {
    if (enemy.dead) return;
    enemy.dead = true;
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) {
      this.enemies.splice(idx, 1);
    }

    this.kills++;
    this.killsText.setText(`☠ ${this.kills.toString().padStart(3, '0')}`);
    this.addBounty(enemy.bountyVal);
    this.gameEvents.emitEnemyKilled({ kind: enemy.type, x: enemy.sprite.x, y: enemy.sprite.y });

    // Drop Loot
    const dropRand = Math.random();
    let dropType: 'gold' | 'badge' | 'whiskey' = 'gold';
    let texture = 'drop_gold';

    if (enemy.type === 'boss' || enemy.type === 'elite') {
      dropType = 'badge';
      texture = 'drop_badge';
    } else if (dropRand < 0.08) {
      dropType = 'whiskey';
      texture = 'drop_whiskey';
    } else if (dropRand < 0.28) {
      dropType = 'badge';
      texture = 'drop_badge';
    }

    const dropSprite = this.add.sprite(enemy.sprite.x, enemy.sprite.y, texture).setScale(1.3).setDepth(4);
    this.drops.push({
      sprite: dropSprite,
      type: dropType,
      val: enemy.xpVal,
      bounty: enemy.bountyVal,
    });

    // Boss death animation plays on a detached corpse sprite
    if (enemy.type === 'boss' && enemy.usesPixellab) {
      const corpse = this.add
        .sprite(enemy.sprite.x, enemy.sprite.y, greedwellFirstFrame('death'))
        .setScale(GREEDWELL_SCALE)
        .setDepth(15);
      corpse.play(greedwellAnimKey('death'));
      this.time.delayedCall(1300, () => {
        this.tweens.add({ targets: corpse, alpha: 0, duration: 400, onComplete: () => corpse.destroy() });
      });
    }

    if (enemy.pooled) this.enemyPool.release(enemy.sprite);
    else enemy.sprite.destroy();

    // Check Boss Victory
    if (enemy.type === 'boss') {
      // Som de derrota do boss (man-screaming.mp3)
      sounds.playBossDefeatedScream();

      if (enemy.usesPixellab) {
        // Let the death animation play before the victory screen
        this.time.delayedCall(1200, () => {
          if (!this.isGameOver) this.victory();
        });
      } else {
        this.victory();
      }
    }
  }

  private damagePlayer(amount: number) {
    // Temporary invulnerability after taking a hit
    if (this.time.now < this.invulnUntil) return;
    this.invulnUntil = this.time.now + 600;
    this.tweens.add({
      targets: this.player,
      alpha: 0.35,
      duration: 70,
      yoyo: true,
      repeat: 3,
      onComplete: () => this.player.setAlpha(1),
    });

    const reduced = Math.max(1, amount - this.armor);
    this.hp -= reduced;
    this.gameEvents.emitPlayerDamaged(reduced);
    this.hpText.setText(`HP ${Math.max(0, Math.round(this.hp))}/${this.maxHp}`);
    this.updateHpBar();

    // Red vignette flash
    this.cameras.main.flash(120, 180, 0, 0);
    sounds.playHit();

    if (this.hp <= 0) {
      this.gameOver(false);
    }
  }

  private showDamageText(x: number, y: number, dmg: number, isCrit = false) {
    const txt = this.add.text(x, y, isCrit ? `${dmg}!` : `${dmg}`, {
      fontFamily: THEME.typography.pixelFont,
      fontSize: isCrit ? '16px' : (dmg > 50 ? '13px' : '10px'),
      color: isCrit ? '#ff0033' : (dmg > 50 ? '#ffe066' : '#ffffff'),
      stroke: isCrit ? '#ffff00' : '#000000',
      strokeThickness: isCrit ? 3 : 2,
    }).setOrigin(0.5).setDepth(25);

    this.tweens.add({
      targets: txt,
      y: y - (isCrit ? 40 : 28),
      scaleX: isCrit ? 1.3 : 1.0,
      scaleY: isCrit ? 1.3 : 1.0,
      alpha: 0,
      duration: isCrit ? 750 : 550,
      onComplete: () => txt.destroy(),
    });
  }

  private getNearestEnemies(range: number): Enemy[] {
    return this.enemies
      .map((e) => ({
        enemy: e,
        dist: Math.hypot(e.sprite.x - this.player.x, e.sprite.y - this.player.y),
      }))
      .filter((item) => item.dist <= range)
      .sort((a, b) => a.dist - b.dist)
      .map((item) => item.enemy);
  }

  // Level Up Modal
  private triggerLevelUp() {
    this.scene.pause();

    // Pick 3 random eligible choices
    const choices = this.generateUpgradeChoices();
    this.scene.launch('LevelUpScene', {
      choices,
      character: this.character,
      level: this.level,
      hp: Math.ceil(this.hp),
      maxHp: this.maxHp,
      gold: this.bounty,
      kills: this.kills,
      onSelect: (choice: UpgradeChoice) => {
        this.applyUpgrade(choice);
        this.scene.resume();
      },
    });
  }

  private generateUpgradeChoices(): UpgradeChoice[] {
    const list: UpgradeChoice[] = [];

    // Checa se há evolução pronta para ser oferecida com prioridade máxima
    const eligibleEvo = getEligibleEvolution(this.activeWeapons, this.activePassives);
    if (eligibleEvo) {
      list.push({
        type: 'evolution',
        id: eligibleEvo.evolvedWeaponId,
        name: eligibleEvo.name,
        icon: eligibleEvo.icon,
        currentLevel: 0,
        nextLevel: 1,
        description: eligibleEvo.description,
      });
    }

    // Eligible Weapons (não evoluídas)
    Object.entries(WEAPONS).forEach(([wepId, def]) => {
      // Não exibe armas base se já evoluíram
      if (['desperado_fury', 'blunderbuss_doom', 'golden_repeater', 'hellfire_keg', 'cyclone_whip'].includes(wepId)) return;
      const curLvl = this.activeWeapons.get(wepId) || 0;
      if (curLvl < def.levels.length) {
        const nextInfo = def.levels[curLvl];
        list.push({
          type: 'weapon',
          id: wepId,
          name: def.name,
          icon: def.icon,
          currentLevel: curLvl,
          nextLevel: curLvl + 1,
          description: nextInfo.description,
        });
      }
    });

    // Eligible Passives
    Object.entries(PASSIVES).forEach(([pasId, def]) => {
      const curLvl = this.activePassives.get(pasId) || 0;
      if (curLvl < def.levels.length) {
        const nextInfo = def.levels[curLvl];
        list.push({
          type: 'passive',
          id: pasId,
          name: def.name,
          icon: def.icon,
          currentLevel: curLvl,
          nextLevel: curLvl + 1,
          description: nextInfo.description,
        });
      }
    });

    // Shuffle and pick 3 (garante que a evolução fica em destaque se existir)
    if (eligibleEvo) {
      const otherChoices = list.slice(1);
      Phaser.Utils.Array.Shuffle(otherChoices);
      return [list[0], ...otherChoices.slice(0, 2)];
    }

    Phaser.Utils.Array.Shuffle(list);
    return list.slice(0, 3);
  }

  private applyUpgrade(choice: UpgradeChoice) {
    if (choice.type === 'evolution') {
      // Localiza a arma base e substitui
      const evoDef = WEAPON_EVOLUTIONS.find((e) => e.evolvedWeaponId === choice.id);
      if (evoDef) {
        this.activeWeapons.delete(evoDef.baseWeaponId);
        this.weaponTimers.delete(evoDef.baseWeaponId);
        // Remove projéteis de laço antigos se houver
        if (evoDef.baseWeaponId === 'lasso') {
          this.projectiles.filter((p) => p.isLasso).forEach((p) => p.sprite.destroy());
          this.projectiles = this.projectiles.filter((p) => !p.isLasso);
        }
      }
      this.activeWeapons.set(choice.id, 1);
      this.weaponTimers.set(choice.id, 0);

      // Flash épico de evolução
      this.cameras.main.flash(500, 255, 215, 0);
      sounds.playLevelUp();
      this.showBanner(`★ ARMA EVOLUÍDA: ${choice.name.toUpperCase()}! ★`, '#ffc52a');
    } else if (choice.type === 'weapon') {
      const newLvl = (this.activeWeapons.get(choice.id) || 0) + 1;
      this.activeWeapons.set(choice.id, newLvl);
      if (newLvl === 1) {
        this.weaponTimers.set(choice.id, 0);
      }
    } else {
      const newLvl = (this.activePassives.get(choice.id) || 0) + 1;
      this.activePassives.set(choice.id, newLvl);
      const def = PASSIVES[choice.id];
      const eff = def.levels[newLvl - 1].effect;

      if (eff.speedBonus) this.moveSpeed = this.character.stats.moveSpeed * (1 + eff.speedBonus);
      if (eff.xpBonus) this.xpBonus = 1 + eff.xpBonus;
      if (eff.hpRegen) this.hpRegen = eff.hpRegen;
      if (eff.cooldownReduction) this.fireRateMultiplier = this.character.stats.fireRateMultiplier * (1 + eff.cooldownReduction);
      if (eff.magnetRadius) this.magnetRadius = this.character.stats.magnetRadius + eff.magnetRadius;
      if (eff.armorBonus) this.armor += eff.armorBonus;
      if (eff.maxHpBonus) {
        this.maxHp += eff.maxHpBonus;
        this.hp += eff.maxHpBonus;
        this.hpText.setText(`HP ${Math.round(this.hp)}/${this.maxHp}`);
        this.updateHpBar();
      }
    }
  }

  private victory() {
    this.stageClear();
  }

  private stageClear() {
    this.isGameOver = true;
    sounds.stopBGM();
    sounds.playLevelUp();
    this.cameras.main.flash(250, 255, 235, 170);
    this.cameras.main.fade(750, 0, 0, 0);
    this.time.delayedCall(800, () => {
      this.scene.start('StageClearScene', {
        character: this.character,
        stage: this.stage,
        timeSurvivedSeconds: this.gameTimeSeconds,
        kills: this.kills,
        bounty: this.bounty,
        level: this.level,
      });
    });
  }

  private gameOver(victory: boolean) {
    if (victory) {
      this.stageClear();
      return;
    }
    this.isGameOver = true;
    sounds.stopBGM();
    this.cameras.main.fade(800, 0, 0, 0);
    this.time.delayedCall(850, () => {
      this.scene.start('GameOverScene', {
        character: this.character,
        stage: this.stage,
        timeSurvivedSeconds: this.gameTimeSeconds,
        kills: this.kills,
        bounty: this.bounty,
        level: this.level,
      });
    });
  }
}
