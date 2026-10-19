import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { CharacterData } from '../data/characters';
import { PASSIVES } from '../data/passives';
import { WEAPONS, WeaponDef } from '../data/weapons';
import { THEME } from '../ui/theme/tokens';
import { UpgradeChoice } from './LevelUpScene';
import { getBossForStage } from '../data/bosses';

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
}

interface Enemy {
  sprite: Phaser.GameObjects.Sprite;
  type: 'bandit' | 'snake' | 'dynamiter' | 'heavy' | 'boss';
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  xpVal: number;
  bountyVal: number;
  throwCooldown?: number;
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
  private hp: number = 100;
  private maxHp: number = 100;
  private moveSpeed: number = 180;
  private magnetRadius: number = 120;
  private damageMultiplier: number = 1.0;
  private fireRateMultiplier: number = 1.0;
  private armor: number = 0;
  private hpRegen: number = 0;
  private xpBonus: number = 1.0;

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

    // Initialize Inventory with Starter Weapon
    this.activeWeapons.clear();
    this.activePassives.clear();
    this.weaponTimers.clear();
    this.activeWeapons.set(this.character.starterWeapon, 1);
    this.weaponTimers.set(this.character.starterWeapon, 0);

    // Infinite Desert Floor
    this.groundTile = this.add.tileSprite(0, 0, width * 2, height * 2, 'desert_ground').setOrigin(0.5);

    // Player Sprite (32-bit Neo Geo Arcade Hero)
    const heroKey = `hero_${this.character.id}`;
    if (this.textures.exists(heroKey)) {
      this.player = this.add.sprite(width / 2, height / 2, heroKey, 0).setScale(0.85);
    } else {
      this.player = this.add.sprite(width / 2, height / 2, `player_${this.character.id}`).setScale(1.6);
    }
    this.player.setDepth(10);

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
    const angle = Math.random() * Math.PI * 2;
    const dist = 500;
    const spawnX = this.player.x + Math.cos(angle) * dist;
    const spawnY = this.player.y + Math.sin(angle) * dist;

    const sprite = this.add.sprite(spawnX, spawnY, 'boss_greedwell').setScale(2.0).setDepth(15);
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
    };
    this.enemies.push(this.bossEnemy);
    this.updateBossBar();
  }

  // Wave Spawner
  private spawnWave() {
    if (this.isGameOver) return;
    const enemyCount = Math.min(25 + Math.floor(this.gameTimeSeconds * 0.45), 180);
    if (this.enemies.length >= enemyCount) return;

    // Spawn 3-6 enemies around player perimeter
    const spawnBatch = 4 + Math.floor(this.gameTimeSeconds / 30);
    for (let i = 0; i < spawnBatch; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 520 + Math.random() * 120;
      const x = this.player.x + Math.cos(angle) * dist;
      const y = this.player.y + Math.sin(angle) * dist;

      // Pick enemy type based on game time
      const rand = Math.random();
      let type: 'bandit' | 'snake' | 'dynamiter' | 'heavy' = 'bandit';
      let texture = 'enemy_bandit';
      let hp = 30 + this.gameTimeSeconds * 0.5;
      let speed = 90;
      let damage = 10;
      let xpVal = 10;
      let bountyVal = 15;

      if (this.gameTimeSeconds > 25 && rand < 0.3) {
        type = 'snake';
        texture = 'enemy_snake';
        hp = 20;
        speed = 135; // fast & slippery
        damage = 8;
        xpVal = 8;
        bountyVal = 10;
      } else if (this.gameTimeSeconds > 45 && rand > 0.75) {
        type = 'dynamiter';
        texture = 'enemy_dynamiter';
        hp = 45;
        speed = 80;
        damage = 18;
        xpVal = 18;
        bountyVal = 35;
      } else if (this.gameTimeSeconds > 60 && rand > 0.88) {
        type = 'heavy';
        texture = 'enemy_heavy';
        hp = 180;
        speed = 65;
        damage = 22;
        xpVal = 40;
        bountyVal = 80;
      }

      const sprite = this.add.sprite(x, y, texture).setScale(1.4).setDepth(5);
      this.enemies.push({
        sprite,
        type,
        hp,
        maxHp: hp,
        speed,
        damage,
        xpVal,
        bountyVal,
        throwCooldown: type === 'dynamiter' ? 2000 : undefined,
      });
    }
  }

  update(time: number, delta: number) {
    if (this.isGameOver) return;

    this.handlePlayerMovement(delta);
    this.handleWeaponsAutoFire(delta);
    this.updateProjectiles(delta);
    this.updateEnemies(delta);
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

      // Flip sprite to face movement direction
      if (dx < -0.1) this.player.setFlipX(true);
      if (dx > 0.1) this.player.setFlipX(false);

      // Play 32-bit running animation
      const animKey = `${this.character.id}_run`;
      if (this.anims.exists(animKey) && (!this.player.anims.isPlaying || this.player.anims.currentAnim?.key !== animKey)) {
        this.player.play(animKey);
      }

      // Scroll background tile relative to player
      this.groundTile.tilePositionX = this.player.x;
      this.groundTile.tilePositionY = this.player.y;
    } else {
      // Idle: stop running animation and return to ready stance frame 0
      if (this.player.anims && this.player.anims.isPlaying) {
        this.player.stop();
        this.player.setFrame(0);
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
      case 'peacemaker': {
        sounds.playRevolver();
        const targets = nearest.slice(0, lvl.projectileCount);
        for (let i = 0; i < lvl.projectileCount; i++) {
          let angle = facingAngle;
          if (targets[i]) {
            angle = Math.atan2(targets[i].sprite.y - this.player.y, targets[i].sprite.x - this.player.x);
          } else {
            angle += (i - (lvl.projectileCount - 1) / 2) * 0.2;
          }

          const sprite = this.add.sprite(this.player.x, this.player.y, 'proj_bullet').setDepth(8);
          sprite.setRotation(angle);
          this.projectiles.push({
            sprite,
            vx: Math.cos(angle) * lvl.speed,
            vy: Math.sin(angle) * lvl.speed,
            damage: Math.round(lvl.damage * this.damageMultiplier),
            pierce: lvl.pierce,
            hits: new Set(),
            life: (lvl.range / lvl.speed) * 1000,
          });
        }
        break;
      }

      case 'shotgun': {
        sounds.playShotgun();
        let centerAngle = facingAngle;
        if (nearest[0]) {
          centerAngle = Math.atan2(nearest[0].sprite.y - this.player.y, nearest[0].sprite.x - this.player.x);
        }

        const spread = 0.5; // cone spread
        for (let i = 0; i < lvl.projectileCount; i++) {
          const offset = ((i / (lvl.projectileCount - 1)) - 0.5) * spread;
          const angle = centerAngle + offset;
          const sprite = this.add.sprite(this.player.x, this.player.y, 'proj_pellet').setDepth(8);
          this.projectiles.push({
            sprite,
            vx: Math.cos(angle) * (lvl.speed + (Math.random() * 40 - 20)),
            vy: Math.sin(angle) * (lvl.speed + (Math.random() * 40 - 20)),
            damage: Math.round(lvl.damage * this.damageMultiplier),
            pierce: lvl.pierce,
            hits: new Set(),
            life: (lvl.range / lvl.speed) * 1000,
          });
        }
        break;
      }

      case 'rifle': {
        sounds.playRifle();
        let angle = facingAngle;
        if (nearest[0]) {
          angle = Math.atan2(nearest[0].sprite.y - this.player.y, nearest[0].sprite.x - this.player.x);
        }

        for (let i = 0; i < lvl.projectileCount; i++) {
          const a = angle + (i - (lvl.projectileCount - 1) / 2) * 0.12;
          const sprite = this.add.sprite(this.player.x, this.player.y, 'proj_rifle').setDepth(8);
          sprite.setRotation(a);
          this.projectiles.push({
            sprite,
            vx: Math.cos(a) * lvl.speed,
            vy: Math.sin(a) * lvl.speed,
            damage: Math.round(lvl.damage * this.damageMultiplier),
            pierce: lvl.pierce,
            hits: new Set(),
            life: (lvl.range / lvl.speed) * 1000,
          });
        }
        break;
      }

      case 'dynamite': {
        sounds.playRicochet();
        const target = nearest[0];
        const tx = target ? target.sprite.x : this.player.x + (this.player.flipX ? -200 : 200);
        const ty = target ? target.sprite.y : this.player.y;

        const sprite = this.add.sprite(this.player.x, this.player.y, 'proj_dynamite').setDepth(8);
        this.tweens.add({
          targets: sprite,
          x: tx,
          y: ty,
          rotation: Math.PI * 4,
          duration: 650,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            sprite.destroy();
            this.explodeDynamite(tx, ty, lvl.damage);
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
          radius: 65,
          damage: Math.round(lvl.damage * this.damageMultiplier),
          life: 3500,
          tickTimer: 0,
          graphics: gfx,
        });
        break;
      }

      case 'lasso': {
        // Orbiting lasso circles
        const existingLassos = this.projectiles.filter((p) => p.isLasso);
        if (existingLassos.length < lvl.projectileCount) {
          const count = lvl.projectileCount;
          existingLassos.forEach((p) => p.sprite.destroy());
          this.projectiles = this.projectiles.filter((p) => !p.isLasso);

          for (let i = 0; i < count; i++) {
            const sprite = this.add.sprite(this.player.x, this.player.y, 'proj_lasso').setDepth(9);
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
              radius: lvl.range,
            });
          }
        }
        break;
      }
    }
  }

  private explodeDynamite(x: number, y: number, damage: number) {
    sounds.playExplosion();
    this.cameras.main.shake(250, 0.008);

    // Shockwave animation
    const circle = this.add.graphics().setDepth(20);
    circle.fillStyle(0xf59e0b, 0.85);
    circle.fillCircle(x, y, 90);
    circle.fillStyle(0xdc2626, 0.9);
    circle.fillCircle(x, y, 60);

    this.tweens.add({
      targets: circle,
      alpha: 0,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 350,
      onComplete: () => circle.destroy(),
    });

    // Damage all enemies in explosion radius
    this.enemies.forEach((enemy) => {
      const dist = Math.hypot(enemy.sprite.x - x, enemy.sprite.y - y);
      if (dist <= 100) {
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

        // Check collision against nearby enemies
        this.enemies.forEach((enemy) => {
          if (Math.hypot(enemy.sprite.x - p.sprite.x, enemy.sprite.y - p.sprite.y) < 32) {
            if (!p.hits.has(enemy)) {
              p.hits.add(enemy);
              this.damageEnemy(enemy, p.damage);
              this.time.delayedCall(300, () => p.hits.delete(enemy));
            }
          }
        });
        continue;
      }

      // Linear Projectiles
      p.sprite.x += (p.vx * delta) / 1000;
      p.sprite.y += (p.vy * delta) / 1000;
      p.life -= delta;

      // Check Enemy Collisions
      for (const enemy of this.enemies) {
        if (p.hits.has(enemy)) continue;
        const dist = Math.hypot(enemy.sprite.x - p.sprite.x, enemy.sprite.y - p.sprite.y);
        if (dist < 26) {
          p.hits.add(enemy);
          this.damageEnemy(enemy, p.damage);

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
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const dx = this.player.x - e.sprite.x;
      const dy = this.player.y - e.sprite.y;
      const dist = Math.hypot(dx, dy);

      // Facing direction
      e.sprite.setFlipX(dx < 0);

      if (dist > 0.1) {
        const step = (e.speed * delta) / 1000;
        e.sprite.x += (dx / dist) * step;
        e.sprite.y += (dy / dist) * step;
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
          this.bossRevolverBarrage(e.sprite.x, e.sprite.y);
        }
      }

      // Damage Player on contact
      if (dist < 32) {
        this.damagePlayer((e.damage * delta) / 1000);
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
        this.enemies.forEach((enemy) => {
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

  // Damage Handlers
  private damageEnemy(enemy: Enemy, dmg: number) {
    enemy.hp -= dmg;

    // Flash hit white
    enemy.sprite.setTintFill(0xffffff);
    this.time.delayedCall(70, () => {
      if (enemy.sprite.active) enemy.sprite.clearTint();
    });

    // Floating Damage Number
    this.showDamageText(enemy.sprite.x, enemy.sprite.y - 15, dmg);

    if (enemy.type === 'boss') {
      this.updateBossBar();
    }

    if (enemy.hp <= 0) {
      this.killEnemy(enemy);
    }
  }

  private killEnemy(enemy: Enemy) {
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) {
      this.enemies.splice(idx, 1);
    }

    this.kills++;
    this.killsText.setText(`☠ ${this.kills.toString().padStart(3, '0')}`);
    this.addBounty(enemy.bountyVal);

    // Drop Loot
    const dropRand = Math.random();
    let dropType: 'gold' | 'badge' | 'whiskey' = 'gold';
    let texture = 'drop_gold';

    if (enemy.type === 'boss') {
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

    enemy.sprite.destroy();

    // Check Boss Victory
    if (enemy.type === 'boss') {
      this.victory();
    }
  }

  private damagePlayer(amount: number) {
    const reduced = Math.max(1, amount - this.armor);
    this.hp -= reduced;
    this.hpText.setText(`HP ${Math.max(0, Math.round(this.hp))}/${this.maxHp}`);
    this.updateHpBar();

    // Red vignette flash
    this.cameras.main.flash(120, 180, 0, 0);
    sounds.playHit();

    if (this.hp <= 0) {
      this.gameOver(false);
    }
  }

  private showDamageText(x: number, y: number, dmg: number) {
    const txt = this.add.text(x, y, `${dmg}`, {
      fontFamily: THEME.typography.pixelFont,
      fontSize: dmg > 50 ? '14px' : '10px',
      color: dmg > 50 ? '#ffe066' : '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(25);

    this.tweens.add({
      targets: txt,
      y: y - 28,
      alpha: 0,
      duration: 550,
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

    // Eligible Weapons
    Object.entries(WEAPONS).forEach(([wepId, def]) => {
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

    // Shuffle and pick 3
    Phaser.Utils.Array.Shuffle(list);
    return list.slice(0, 3);
  }

  private applyUpgrade(choice: UpgradeChoice) {
    if (choice.type === 'weapon') {
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
