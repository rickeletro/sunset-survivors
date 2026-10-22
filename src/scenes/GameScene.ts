import { WeaponEffects } from '../systems/WeaponEffects';
import { molotovFootprint } from '../data/weaponPresentation';
import { BUILD_LIMITS, cooldownMultiplier, stageClearBonus, xpForLevel } from '../data/economy';
import { FirstRunTutorial, tutorialProgress } from '../systems/FirstRunTutorial';
import { FirstRunTutorialView } from '../ui/hud/FirstRunTutorialView';
import { sceneryForStage, sceneryKey, worldDepth } from '../data/scenery';
import { WORLD_DECORATION_KEYS } from '../data/worldDecorations';
import { SaloonVisit, saloonDoors, SALOON_ENTRY_RADIUS, type SaloonDoor } from '../data/saloon';
import { BuildingPortalView } from '../ui/BuildingPortalView';
import type { BuildingTransitionData } from './BuildingTransitionScene';
import { samplePath, pathLength, type PortalPoint } from '../systems/BuildingPath';
import { canRegenerate, HEAL_DROP_CHANCE, HEAL_DROP_HP, PLAYER_HIT_GRACE_MS } from '../data/sustain';
import { HostileProjectiles } from '../systems/HostileProjectiles';
import type { Projectile, Enemy, Drop, FireZone } from '../game/entities';
import { CombatHUD } from '../ui/hud/CombatHUD';
import { preloadImages } from '../assets/registry';
import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { CharacterData, CHARACTERS } from '../data/characters';
import { PASSIVES } from '../data/passives';
import { WEAPONS, WeaponDef } from '../data/weapons';
import { bossHealth, difficultyProfile, difficultySettings, enemyHealth, incomingDamage, normalizeDifficulty, type DifficultyId } from '../data/difficulty';
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
  preloadGreedwell,
} from '../systems/GreedwellSprites';
import { WorldMap, WORLD_W, WORLD_H } from '../systems/WorldMap';
import { GameDirector, SpawnOrder } from '../systems/GameDirector';
import { GameEvents, GameEventNames, SpecialWaveEvent } from '../systems/GameEvents';
import { SpatialHash } from '../systems/SpatialHash';
import { SpritePool } from '../systems/SpritePool';
import { ENEMY_DEFS, ENEMY_VISUAL_SCALE, EnemyKind } from '../data/enemies';
import { getStage, isBossDue, stagePhase, StageConfig } from '../data/stages';
import { bossAttackDamage, bossRageMultiplier, getBossCombat, remainingBossHp } from '../data/bossCombat';
import { mergeLoot, takeLootPacket } from '../systems/LootBudget';
import { StageEncounters } from '../systems/StageEncounters';
import { bossSpriteTexture, enemySpriteTexture, playBossMovement, playEnemyMovement, preloadCombatSprites } from '../systems/PixellabCombat';
import { getEligibleEvolution, WEAPON_EVOLUTIONS } from '../data/evolutions';

export class GameScene extends Phaser.Scene {
  private character!: CharacterData;
  private stage: number = 1;
  private difficulty: DifficultyId = 'normal';
  private rawXpEarned = 0;
  private totalXpEarned = 0;
  private totalDamageTaken = 0;
  private stageConfig!: StageConfig;
  private encounters!: StageEncounters;
  private stageStatus!: Phaser.GameObjects.Text;
  private saloonVisit?: SaloonVisit;
  private saloonViews: { door: SaloonDoor; view: BuildingPortalView }[] = [];
  private saloonRestore?: () => void;
  private saloonOpen = false;
  private combatElapsedMs = 0;
  private lastDamageAt = -Infinity;
  private get combatNow(): number { return this.combatElapsedMs ?? this.time.now; }
  private objectiveStatus!: Phaser.GameObjects.Text;
  private bossMembers: Enemy[] = [];
  private bossDefeated = false;

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

  // Progression
  private level: number = 1;
  private currentXp: number = 0;
  private xpToNextLevel: number = 20;
  private bounty: number = 0;
  private kills: number = 0;
  private choosingUpgrade = false;
  private runId = '';
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
  private bossSpawned: boolean = false;

  // Background & Camera
  private worldMap!: WorldMap;
  private invulnUntil: number = 0;
  private director!: GameDirector;
  private gameEvents!: GameEvents;
  private enemyPool!: SpritePool;
  private enemyHash!: SpatialHash<Enemy>;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keysWASD!: { [key: string]: Phaser.Input.Keyboard.Key };

  private hud!: CombatHUD;
  private weaponEffects?: WeaponEffects;
  private hostileProjectiles?: HostileProjectiles;
  private onboarding?: FirstRunTutorial;
  private onboardingView?: FirstRunTutorialView;
  private practiceActive = false;
  private touchPointerId: number | null = null;

  // HUD Elements
  private levelText!: Phaser.GameObjects.Text;
  private bountyText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private killsText!: Phaser.GameObjects.Text;
  private bossBarContainer!: Phaser.GameObjects.Container;

  // Mobile Touch Controls
  private touchOrigin: { x: number; y: number } | null = null;
  private touchVector: { x: number; y: number } = { x: 0, y: 0 };
  private touchJoystickGfx!: Phaser.GameObjects.Graphics;

  constructor() {
    super('GameScene');
  }

  init(data?: { character?: CharacterData; stage?: number; difficulty?: DifficultyId }) {
    this.character = data?.character || CHARACTERS.billy;
    this.stage = Math.max(1, Math.min(8, data?.stage || 1));
    this.stageConfig = getStage(this.stage);
    this.difficulty = normalizeDifficulty(data?.difficulty ?? difficultySettings.get());
  }

  preload() {
    preloadImages(this, ['decor_title_parchment']);
    preloadImages(this, sceneryForStage(this.stageConfig.theme).map(sceneryKey));
    // The black doorway cut must not reveal the street while the interior loads.
    if (saloonDoors(this.stageConfig.theme).length) {
      preloadImages(this, ['saloon_bkg', 'intro_bkg', 'decor_lantern', 'decor_spark', 'saloon_cancan']);
    }
    preloadImages(this, [...this.stageConfig.props, 'lantern'].map(kind => `wm_${kind}`));
    if (this.stageConfig.theme === 'canyon') preloadImages(this, WORLD_DECORATION_KEYS);
    preloadCombatSprites(this, this.stage);
    if (this.stage === 1 && !hasGreedwellSprites(this)) preloadGreedwell(this);
    if (!this.textures.exists('hud_avatar_steve')) {
      preloadImages(this, ['hud_avatar_steve']);
      preloadImages(this, ['hud_avatar_billy']);
      preloadImages(this, ['hud_avatar_bob']);
      preloadImages(this, ['hud_avatar_cormano']);
    }
    if (!this.textures.exists('hud_coin_icon')) {
      preloadImages(this, ['hud_coin_icon']);
    }
    if (!this.textures.exists('hud_skull_icon')) {
      preloadImages(this, ['hud_skull_icon']);
    }
  }

  create() {
    this.onboardingView = undefined;
    this.weaponEffects = undefined;
    this.practiceActive = false;
    this.touchOrigin = null; this.touchVector = { x: 0, y: 0 }; this.touchPointerId = null;
    this.isGameOver = false;
    this.bossSpawned = false;
    this.bossMembers = [];
    this.bossDefeated = false;
    this.enemies = [];
    this.projectiles = [];
    this.drops = [];
    this.fireZones = [];
    this.gameTimeSeconds = 0;
    this.combatElapsedMs = 0;
    this.lastDamageAt = -Infinity;
    this.saloonOpen = false;
    this.choosingUpgrade = false;
    this.runId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    this.kills = 0;
    this.bounty = 0;
    this.level = 1;
    this.currentXp = 0;
    this.rawXpEarned = 0; this.totalXpEarned = 0; this.totalDamageTaken = 0;
    this.xpToNextLevel = xpForLevel(1);

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

    // Initialize Inventory with Starter Weapon
    this.activeWeapons.clear();
    this.activePassives.clear();
    this.weaponTimers.clear();
    this.activeWeapons.set(this.character.starterWeapon, 1);
    this.weaponTimers.set(this.character.starterWeapon, 0);

    // Giant explorable desert floor (world space, culled by the camera)
    this.invulnUntil = 0;
    const startX = WORLD_W / 2;
    const startY = WORLD_H / 2;
    this.worldMap = new WorldMap(this, startX, startY, 260, this.stageConfig);
    this.add.tileSprite(0, 0, WORLD_W, WORLD_H, this.worldMap.groundTexture).setOrigin(0, 0).setDepth(-10);

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
    const dust = this.add.particles(0, 0, 'stage_dust', {
      frequency: 140, lifespan: 3500, speedX: { min: 12, max: 30 }, speedY: { min: -8, max: 4 },
      alpha: { start: 0.35, end: 0 }, quantity: 1,
    }).setDepth(18);
    dust.startFollow(this.player, -260, -160);

    // Horde systems: director, pool, spatial hash, event bus
    this.gameEvents = new GameEvents();
    this.director = new GameDirector(this.gameEvents, this.stageConfig);
    this.enemyPool = new SpritePool(this, 5);
    this.enemyHash = new SpatialHash<Enemy>(64);
    this.gameEvents.on(GameEventNames.SpecialWave, (e: SpecialWaveEvent) => this.showBanner(e.label, '#ffc52a'));
    this.gameEvents.on(GameEventNames.EliteSpawned, () => this.showBanner('★ ELITE BOUNTY HUNTER ★', '#ff791c'));

    this.encounters = new StageEncounters(this, this.stageConfig, {
      position: () => ({ x: this.player.x, y: this.player.y }),
      damage: amount => this.damagePlayer(amount),
      spawn: (kind, x, y) => this.spawnEnemy(kind, x, y),
      reward: () => {
        this.addBounty(300 + this.stage * 75);
        this.hp = Math.min(this.maxHp, this.hp + 20);
        this.updateHpBar();
        sounds.playCoin();
        this.awardXp(80 + this.stage * 30);
      },
      banner: (message, color) => this.showBanner(message, color),
      contested: (x, y) => this.enemies.some(e => !e.dead && Math.hypot(e.sprite.x - x, e.sprite.y - y) < 100),
      clearPoint: (x, y) => this.worldMap.resolve(x, y, 82),
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.encounters.destroy();
      this.gameEvents.removeAllListeners();
    });

    // Keyboard Inputs
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keysWASD = this.input.keyboard.addKeys('W,A,S,D') as { [key: string]: Phaser.Input.Keyboard.Key };

      // ESC key to Pause
      this.input.keyboard.on('keydown-ESC', () => {
        if (this.isGameOver || this.choosingUpgrade || this.saloonOpen || this.scene.isPaused('GameScene')) return;
        this.scene.pause('GameScene');
        this.scene.launch('PauseScene', {
          character: this.character,
          stage: this.stage,
          difficulty: this.difficulty, audit: this.balanceSnapshot(),
        });
      });
    }

    // Touch / Mobile Input Handling
    this.touchJoystickGfx = this.add.graphics().setDepth(100).setScrollFactor(0);
    this.setupTouchControls();

    // Create Arcade HUD
    this.createHUD();
    this.createOnboarding();
    this.createSaloonInteraction();

    // Game Timer Loop (Seconds)
    this.time.addEvent({
      delay: 1000,
      callback: () => this.onSecondTick(),
      loop: true,
    });

    // Enemy Spawner Loop
    this.time.addEvent({
      delay: 850,
      callback: () => this.spawnWave(),
      loop: true,
    });

    this.updateStageStatus();
    if (!this.onboarding?.blocking) this.showBanner(`FASE ${this.stage} — ${this.stageConfig.title}`, '#ffc52a');
    sounds.startBGM(this.stage);
  }

  private createOnboarding(): void {
    const device = this.sys.game.device;
    const touch = device.input.touch && !device.os.desktop;
    this.onboarding = new FirstRunTutorial(this.stage !== 1 || tutorialProgress.hasCompleted(), touch ? 'touch' : 'keyboard', () => tutorialProgress.complete());
    this.practiceActive = this.onboarding.blocking;
    this.onboardingView = new FirstRunTutorialView(this, this.onboarding, () => {
      if (!this.onboarding?.blocking) return;
      this.onboarding.skip(); this.finishPractice();
    });
    this.onboardingView.update(this.player.x, this.player.y, this.time.now);
  }

  private finishPractice(): void {
    if (!this.practiceActive) return;
    this.practiceActive = false;
    for (const enemy of this.enemies.filter(enemy => enemy.training)) {
      enemy.dead = true;
      if (enemy.pooled) this.enemyPool.release(enemy.sprite); else enemy.sprite.destroy();
    }
    this.enemies = this.enemies.filter(enemy => !enemy.training);
    for (const projectile of this.projectiles) projectile.sprite.destroy();
    this.projectiles = [];
    this.weaponEffects?.clearTransient();
    for (const zone of this.fireZones) zone.graphics.destroy();
    this.fireZones = [];
    this.weaponTimers.forEach((_timer, key) => this.weaponTimers.set(key, 0));
    sounds.playLevelUp();
    this.showBanner(`FASE ${this.stage} — AGORA É COM VOCÊ!`, '#ffc52a');
  }

  private spawnPracticeBandit(): void {
    const point = this.worldMap.resolve(this.player.x + 130, this.player.y, 16);
    const enemy = this.spawnEnemy('bandit', point.x, point.y);
    if (!enemy) return;
    enemy.training = true; enemy.damage = 0; enemy.speed = 0;
  }

  private setupTouchControls() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[] = []) => {
      if (!pointer.wasTouch || over.length || this.touchPointerId !== null) return;
      // Mouse clicks never steer or fire. The virtual joystick belongs to one touch at a time.
      if (pointer.x < this.scale.width * 0.6) {
        this.touchPointerId = pointer.id;
        this.touchOrigin = { x: pointer.x, y: pointer.y };
        this.touchVector = { x: 0, y: 0 };
        this.onboarding?.setInput('touch');
        this.renderJoystick();
      }
    });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.touchOrigin && pointer.id === this.touchPointerId) {
        const dx = pointer.x - this.touchOrigin.x, dy = pointer.y - this.touchOrigin.y;
        const distance = Math.hypot(dx, dy), maxDistance = 50;
        const scale = Math.min(distance, maxDistance) / (distance || 1);
        this.touchVector = { x: dx * scale / maxDistance, y: dy * scale / maxDistance };
        this.renderJoystick(this.touchOrigin.x + dx * scale, this.touchOrigin.y + dy * scale);
      }
    });
    const reset = (pointer?: Phaser.Input.Pointer) => {
      if (pointer && pointer.id !== this.touchPointerId) return;
      this.touchPointerId = null; this.touchOrigin = null;
      this.touchVector = { x: 0, y: 0 }; this.touchJoystickGfx.clear();
    };
    this.input.on('pointerup', reset);
    this.input.on('pointerupoutside', reset);
    const blur = () => reset();
    this.game.events.on('blur', blur);
    this.events.on('pause', blur);
    this.events.once('shutdown', () => { this.game.events.off('blur', blur); this.events.off('pause', blur); });
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

  private createHUD(): void {
    this.hud = new CombatHUD(this, {
      characterId: this.character.id, hp: this.hp, maxHp: this.maxHp, currentXp: this.currentXp,
      xpToNextLevel: this.xpToNextLevel, level: this.level, bounty: this.bounty, kills: this.kills,
    }, getBossForStage(this.stage).name);
    this.levelText = this.hud.levelText;
    this.bountyText = this.hud.bountyText;
    this.timeText = this.hud.timeText;
    this.killsText = this.hud.killsText;
    this.bossBarContainer = this.hud.bossBarContainer;
    this.stageStatus = this.hud.stageStatus;
    this.objectiveStatus = this.hud.objectiveStatus;
  }
  private updateXpBar(): void { this.hud.setXp(this.currentXp, this.xpToNextLevel); }
  private updateHpBar(): void { this.hud.setHealth(this.hp, this.maxHp); }
  private updateBossBar(): void {
    if (!this.bossMembers.length) return;
    const health = remainingBossHp(this.bossMembers);
    this.hud.setBossHealth(health.hp, health.maxHp);
  }

  // 1 Second Game Tick
  private onSecondTick() {
    if (this.isGameOver || this.bossDefeated || this.saloonOpen || this.choosingUpgrade || this.onboarding?.blocking) return;
    this.gameTimeSeconds++;

    // Format timer MM:SS
    const mins = Math.floor(this.gameTimeSeconds / 60);
    const secs = this.gameTimeSeconds % 60;
    this.timeText.setText(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);

    // Health Regeneration from Whiskey
    if (this.hpRegen > 0 && this.hp < this.maxHp && canRegenerate(this.combatNow, this.lastDamageAt)) {
      this.hp = Math.min(this.maxHp, this.hp + this.hpRegen);
      this.updateHpBar();
    }

    // The boss arrives at seven minutes; kills never skip its timeline.
    if (!this.bossSpawned && isBossDue(this.stageConfig, this.gameTimeSeconds)) this.spawnStageBoss();
    this.encounters.tick(this.gameTimeSeconds, this.bossSpawned);
    this.updateStageStatus();

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
      align: 'center', wordWrap: { width: Math.max(240, this.scale.width - 60) },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(80);
    this.tweens.add({
      targets: banner,
      alpha: 0,
      y: banner.y - 24,
      duration: 2000,
      onComplete: () => banner.destroy(),
    });
  }

  private spawnStageBoss() {
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
      align: 'center', wordWrap: { width: Math.max(240, this.scale.width - 60) },
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

    const combat = getBossCombat(this.stage);
    const hp = bossHealth(combat.hp, this.difficulty);
    for (const [index, slug] of combat.slugs.entries()) {
      const point = this.worldMap.spawnPointAround(this.player.x, this.player.y, 480, 560);
      const position = this.worldMap.resolve(point.x, point.y + index * 100, 24);
      const legacy = this.stage === 1 && hasGreedwellSprites(this);
      if (legacy) createGreedwellAnims(this);
      const texture = this.stage === 1 ? (legacy ? greedwellFirstFrame('run_east') : 'boss_greedwell') : bossSpriteTexture(this, slug);
      const sprite = this.add.sprite(position.x, position.y, texture).setScale(legacy ? GREEDWELL_SCALE : this.stage === 1 ? 1.2 : 1.25).setDepth(15);
      const enemy: Enemy = {
        sprite, type: 'boss', hp, maxHp: hp,
        speed: combat.speed, damage: combat.damage, xpVal: 300, bountyVal: 200 + this.stage * 50,
        throwCooldown: 1800 + index * 600, usesPixellab: legacy, animLock: 0,
        bossSlug: this.stage === 1 ? undefined : slug,
      };
      this.bossMembers.push(enemy);
      this.enemies.push(enemy);
    }
    this.updateBossBar();
  }

  // Wave Spawner
  private spawnWave() {
    if (this.isGameOver || this.bossDefeated || this.saloonOpen || this.choosingUpgrade || this.onboarding?.blocking) return;
    this.runSpawnOrders(this.director.waveOrders(this.gameTimeSeconds, this.enemies.length));
  }

  private runSpawnOrders(orders: SpawnOrder[]) {
    const px = this.player.x;
    const py = this.player.y;
    const clampX = (v: number) => Phaser.Math.Clamp(v, 48, WORLD_W - 48);
    const clampY = (v: number) => Phaser.Math.Clamp(v, 48, WORLD_H - 48);

    for (const order of orders) {
      const base = this.worldMap.spawnPointAround(px, py);
      for (let i = 0; i < order.count && this.enemies.length < 240; i++) {
        let x: number;
        let y: number;
        if (order.pattern === 'encircle') {
          const a = (i / order.count) * Math.PI * 1.65; // Escape gap remains open.
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
    if (this.enemies.length >= 240) return;
    const def = ENEMY_DEFS[kind];
    const hp = enemyHealth(def, this.gameTimeSeconds, this.difficulty);
    const combatTexture = enemySpriteTexture(this, kind);
    const frameScale = combatTexture ? 64 / this.textures.get(combatTexture).getSourceImage().width : 1;
    const sprite = this.enemyPool.acquire(x, y, combatTexture ?? def.texture, def.scale * frameScale * ENEMY_VISUAL_SCALE);
    const safe = this.worldMap.resolve(x, y, def.radius);
    sprite.setPosition(safe.x, safe.y);
    if (def.tint) sprite.setTint(def.tint);
    const enemy: Enemy = {
      sprite,
      type: kind,
      hp,
      maxHp: hp,
      speed: def.speed,
      damage: def.damage,
      xpVal: def.xp,
      bountyVal: def.bounty,
      throwCooldown: kind === 'dynamiter' ? 2000 : kind === 'rifle_guard' ? 1700 : undefined,
      combatSprite: !!combatTexture,
      chargeCooldown: kind === 'longhorn' ? 650 : undefined,
      pooled: true,
      tint: def.tint,
    };
    this.enemies.push(enemy);
    return enemy;
  }

  private updateStageStatus(): void {
    const remaining = Math.max(0, this.stageConfig.duration - this.gameTimeSeconds);
    const clock = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;
    const labels = { arrival: 'CHEGADA', pressure: 'CERCO', surge: 'HORDA', respite: 'RESPIRO', 'last-stand': 'RESISTA', boss: 'PROCURADO' };
    this.stageStatus.setText(`${difficultyProfile(this.difficulty).label} • FASE ${this.stage} • ${labels[stagePhase(this.stageConfig, this.gameTimeSeconds)]} • ${this.bossSpawned ? 'DERROTE O BOSS' : `BOSS EM ${clock}`}`);
    this.objectiveStatus.setText(this.encounters.objectiveHint());
  }

  private updateEnemyTactics(e: Enemy, dx: number, dy: number, distance: number, delta: number): void {
    if ((e.type === 'coyote' || e.type === 'knife_scout') && distance > 100) {
      const angle = Math.atan2(dy, dx) + Math.sin(this.gameTimeSeconds * 0.8 + e.sprite.x * 0.01) * 0.65;
      e.dirX = Math.cos(angle); e.dirY = Math.sin(angle);
    }
    if (e.type === 'longhorn') {
      e.chargeCooldown = (e.chargeCooldown ?? 0) - delta;
      if (e.chargeCooldown <= 0 && !(e.chargeRemaining! > 0) && !(e.chargeWindup! > 0) && distance < 800) {
        this.startCharge(e, dx, dy);
        e.chargeCooldown = 5200;
      }
    }
    if ((e.chargeWindup ?? 0) > 0) {
      e.chargeWindup! -= delta;
      if (e.chargeWindup! <= 0) { e.chargeRemaining = 1050; e.sprite.clearTint(); }
    }
    if ((e.chargeRemaining ?? 0) > 0) {
      e.chargeRemaining! -= delta;
      e.dirX = e.chargeX; e.dirY = e.chargeY;
    }
  }

  private startCharge(e: Enemy, dx: number, dy: number): void {
    const dist = Math.hypot(dx, dy) || 1;
    e.chargeX = dx / dist; e.chargeY = dy / dist;
    e.chargeWindup = 1100;
    e.sprite.setTint(0xffc52a);
    const line = this.add.graphics().setDepth(2);
    line.lineStyle(28, 0xff791c, 0.22).lineBetween(e.sprite.x, e.sprite.y, e.sprite.x + e.chargeX * 560, e.sprite.y + e.chargeY * 560);
    this.time.delayedCall(1100, () => line.destroy());
  }

  private getProjectileSystem(): HostileProjectiles {
    return this.hostileProjectiles ??= new HostileProjectiles(this, {
      position: () => this.player,
      active: () => !this.isGameOver && !this.bossDefeated,
      damage: amount => this.damagePlayer(amount),
    });
  }
  private fireHostileBullet(x: number, y: number, angle: number, damage: number, range = 680, axe = false): void {
    this.getProjectileSystem().fire(x, y, angle, damage, { range, axe });
  }

  private stageBossAttack(e: Enemy): void {
    const profile = getBossCombat(this.stage);
    const x = e.sprite.x, y = e.sprite.y;
    const dx = this.player.x - x, dy = this.player.y - y;
    const angle = Math.atan2(dy, dx);
    e.attackCount = (e.attackCount ?? 0) + 1;
    switch (profile.attack) {
      case 'quickdraw':
        sounds.playRevolver();
        for (const offset of [-0.16, 0, 0.16]) this.fireHostileBullet(x, y, angle + offset, bossAttackDamage(20), 780);
        break;
      case 'charge':
        this.startCharge(e, dx, dy);
        this.fireHostileBullet(x, y, angle, bossAttackDamage(20), 800);
        break;
      case 'dynamite':
        for (const offset of [-100, 0, 100]) this.enemyThrowDynamite(x, y, offset, (e.attackCount % 2 ? 1 : -1) * 70, bossAttackDamage(25));
        break;
      case 'whip':
        e.vulnerableUntil = this.combatNow + 1300;
        this.encounters.warn({ x: x + Math.cos(angle) * 100, y: y + Math.sin(angle) * 100, radius: 145 }, 1000, 350, bossAttackDamage(30));
        this.showBanner('CHICOTE! ATAQUE QUANDO O ESCUDO BAIXAR', '#ffc52a');
        break;
      case 'axes':
        for (const offset of [-0.45, 0, 0.45]) this.fireHostileBullet(x, y, angle + offset, bossAttackDamage(25), 620, true);
        this.encounters.warn({ x, y, radius: 100 }, 850, 450, bossAttackDamage(25));
        break;
      case 'gatling':
        this.showBanner('GATLING — A MIRA VAI TRAVAR!', '#ff791c');
        this.encounters.warn({ x: this.player.x, y: this.player.y, radius: 50 }, 1000, 100, 0);
        for (let i = 0; i < 10; i++) this.time.delayedCall(1000 + i * 90, () => {
          if (!e.dead && !this.isGameOver && !this.bossDefeated) { sounds.playRevolver(); this.fireHostileBullet(e.sprite.x, e.sprite.y, angle + (i - 4.5) * 0.075, bossAttackDamage(18), 850); }
        });
        break;
      case 'rifle':
        sounds.playRifle();
        for (const offset of [-0.1, 0, 0.1]) this.fireHostileBullet(x, y, angle + offset, bossAttackDamage(25), 900);
        if (bossRageMultiplier(e.hp, e.maxHp) < 1) {
          for (let i = 0; i < 10; i++) this.fireHostileBullet(x, y, i * Math.PI / 5 + e.attackCount * 0.2, bossAttackDamage(18), 600);
        }
        if (e.attackCount % 5 === 0) this.runSpawnOrders([{ kind: 'rifle_guard', count: 4, pattern: 'ring' }]);
        break;
      default: this.bossRevolverBarrage(x, y);
    }
  }

  update(_time: number, delta: number) {
    if (this.isGameOver || this.bossDefeated || this.saloonOpen) return;
    this.combatElapsedMs = (this.combatElapsedMs ?? 0) + delta;
    if (!this.onboarding?.blocking && !this.choosingUpgrade && this.currentXp >= this.xpToNextLevel) { this.addXp(0); return; }
    const oldX = this.player.x, oldY = this.player.y;
    this.handlePlayerMovement(delta);
    this.updateSaloonPrompt();
    const previousPhase = this.onboarding?.phase;
    this.onboarding?.tick(delta, Math.hypot(this.player.x - oldX, this.player.y - oldY));
    if (previousPhase === 'move' && this.onboarding?.phase === 'shoot') this.spawnPracticeBandit();
    if (this.practiceActive && !this.onboarding?.blocking) this.finishPractice();
    this.onboardingView?.update(this.player.x, this.player.y, this.time.now);
    if (this.onboarding?.blocking) {
      this.player.setDepth(worldDepth(this.player.y));
      this.worldMap.update(this.player.x, this.player.y);
      if (this.onboarding.phase === 'shoot') {
        this.enemyHash.rebuild(this.enemies);
        this.handleWeaponsAutoFire(delta);
        this.updateProjectiles(delta);
        this.weaponEffects?.update(delta, this.projectiles);
        this.updateFireZones(delta);
      }
      return;
    }
    // Keep the existing combat order after the isolated practice session.
    this.handleWeaponsAutoFire(delta);
    this.updateProjectiles(delta);
    this.weaponEffects?.update(delta, this.projectiles);
    this.updateEnemies(delta);
    this.player.setDepth(worldDepth(this.player.y));
    this.worldMap.update(this.player.x, this.player.y);
    this.updateDrops(delta);
    if (this.choosingUpgrade) return;
    this.updateFireZones(delta);
    this.encounters.update(delta);
  }

  private saloonBlocked(): boolean {
    return this.isGameOver || this.bossSpawned || this.bossDefeated || this.choosingUpgrade || this.saloonOpen || !!this.onboarding?.visible;
  }

  private createSaloonInteraction(): void {
    this.saloonVisit = new SaloonVisit(saloonDoors(this.stageConfig.theme));
    this.saloonViews = this.saloonVisit.doors.flatMap(door => door.portal ? [{ door,
      view: new BuildingPortalView(this, door.portal, 'SALOON', () => this.openSaloon(door)) }] : []);
    const enter = () => this.openSaloon();
    this.input.keyboard?.on('keydown-E', enter);
    this.events.once('shutdown', () => {
      this.input.keyboard?.off('keydown-E', enter);
      this.saloonVisit = undefined; // Invalidate transition callbacks before stopping child scenes.
      this.saloonOpen = false;
      this.saloonRestore?.(); this.saloonRestore = undefined;
      this.saloonViews.forEach(({ view }) => view.destroy()); this.saloonViews = [];
      this.scene.stop('BuildingTransitionScene'); this.scene.stop('SaloonScene');
    });
  }

  private updateSaloonPrompt(): void {
    const blocked = this.saloonBlocked(), used = !!this.saloonVisit?.used;
    this.saloonViews?.forEach(({ door, view }) => {
      const distance = Math.hypot(door.x - this.player.x, door.y - this.player.y);
      view.update(distance, !blocked && !used && distance <= SALOON_ENTRY_RADIUS, used, this.combatNow, blocked);
    });
  }

  private applyPortalPose(p: PortalPoint, dx: number, dy: number): void {
    this.player.x = p.x; this.player.y = p.y;
    if (this.usePixellab) {
      const choice = pickDirection(this.character.id, dx, dy);
      this.facingDir = choice.dir;
      this.player.setFlipX(choice.flipX).setTexture(pixellabIdleFrame(this.character.id, choice.dir));
    } else this.player.setFlipX(dx < 0);
  }

  private openSaloon(requested?: SaloonDoor): void {
    const visit = this.saloonVisit, blocked = this.saloonBlocked();
    const door = requested ?? visit?.nearby(this.player.x, this.player.y, blocked);
    if (!visit || blocked || visit.used || !door?.portal || !visit.doors.includes(door) ||
      Math.hypot(door.x - this.player.x, door.y - this.player.y) > SALOON_ENTRY_RADIUS) return;
    const portal = door.portal;
    const path = this.worldMap.buildingPath(this.player, portal.threshold);
    if (!path) { sounds.playRicochet(); return; } // No free safety/consumed visit when the door is unreachable.
    const returnPath = this.worldMap.buildingPath(portal.threshold, door) ?? [...path].reverse();
    if (!visit.enter(this.player.x, this.player.y, blocked, door)) return;
    this.saloonOpen = true;
    const clockPaused = this.time.paused, tweensPaused = this.tweens.paused;
    const visible = this.player.visible;
    this.saloonRestore = () => { this.time.paused = clockPaused; this.tweens.paused = tweensPaused; this.player.visible = visible; };
    // Freeze immediately, including the queued-pause transition frame.
    this.time.paused = true; this.tweens.paused = true;
    this.player.anims?.stop(); this.player.visible = false;
    this.updateSaloonPrompt();
    this.scene.pause('GameScene');
    let phase: 'enter' | 'inside' | 'exit' | 'done' = 'enter';
    const current = () => this.saloonVisit === visit && this.saloonOpen && !this.isGameOver;
    const restore = (reward?: ReturnType<SaloonVisit['leave']>) => {
      if (!current() || phase === 'done') return;
      phase = 'done';
      if (reward) {
        this.hp = Math.min(this.maxHp, this.hp + Math.round(this.maxHp * reward.healthFraction));
        this.updateHpBar(); this.addBounty(reward.bounty); sounds.playCoin();
      }
      this.invulnUntil = Math.max(this.invulnUntil, this.combatNow + PLAYER_HIT_GRACE_MS);
      this.saloonRestore?.(); this.saloonRestore = undefined;
      this.saloonOpen = false;
      this.scene.resume('GameScene');
    };
    const transition = (mode: 'enter' | 'exit', route: PortalPoint[], complete: () => void, cancel: () => void) => {
      const data: BuildingTransitionData = { mode, path: route, portal,
        camera: { scrollX: this.cameras.main.scrollX, scrollY: this.cameras.main.scrollY, zoom: this.cameras.main.zoom },
        actor: { texture: this.player.texture.key, frame: this.player.frame.name, scaleX: this.player.scaleX,
          scaleY: this.player.scaleY, hero: this.character.id, pixellab: this.usePixellab },
        onPosition: (p, dx, dy) => { if (current() && phase === mode) this.applyPortalPose(p, dx, dy); },
        onComplete: () => {
          if (!current() || phase !== mode) return;
          const end = samplePath(route, pathLength(route)); this.applyPortalPose(end, end.dx, end.dy); complete();
        },
        onCancel: () => { if (current() && phase === mode) cancel(); },
      };
      this.scene.launch('BuildingTransitionScene', data);
    };
    transition('enter', path, () => {
      phase = 'inside';
      this.scene.launch('SaloonScene', { onLeave: (accept: boolean) => {
        if (!current() || phase !== 'inside') return;
        phase = 'exit';
        const reward = visit.leave(accept);
        this.scene.stop('SaloonScene');
        transition('exit', returnPath, () => restore(reward), () => restore(reward));
      } });
    }, () => { visit.leave(false); restore(); });
  }

  // 1. Player Movement & Facing Direction
  private handlePlayerMovement(delta: number) {
    let dx = 0;
    let dy = 0;

    const keyboardMoving = this.cursors && this.keysWASD && [this.cursors.left, this.cursors.right, this.cursors.up, this.cursors.down, this.keysWASD.W, this.keysWASD.A, this.keysWASD.S, this.keysWASD.D].some(key => key.isDown);
    if (keyboardMoving) this.onboarding?.setInput('keyboard');

    // Keyboard WASD / Arrows
    if (this.cursors?.left.isDown || this.keysWASD?.A.isDown) dx -= 1;
    if (this.cursors?.right.isDown || this.keysWASD?.D.isDown) dx += 1;
    if (this.cursors?.up.isDown || this.keysWASD?.W.isDown) dy -= 1;
    if (this.cursors?.down.isDown || this.keysWASD?.S.isDown) dy += 1;

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
        // Use real directional views when present, otherwise the nearest available view.
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
        // Preserve fractional cooldown instead of losing a frame at every volley.
        // Limit catch-up after extreme stalls, never bank a burst across a pause.
        const shots = Math.min(4, Math.floor(curTimer / effectiveCooldown));
        for (let i = 0; i < shots; i++) this.fireWeapon(def, lvlInfo);
        this.weaponTimers.set(weaponId, curTimer % effectiveCooldown);
      } else {
        this.weaponTimers.set(weaponId, curTimer);
      }
    });
  }

  private fireWeapon(def: WeaponDef, lvl: { damage: number; projectileCount: number; pierce: number; speed: number; range: number }) {
    const nearest = this.getNearestEnemies(lvl.range);
    this.onboarding?.fired();
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
          const appearance = this.getWeaponEffects().dressBullet(sprite, def.id, this.activeWeapons.get(def.id) ?? 1);
          sprite.setRotation(angle);
          this.projectiles.push({
            appearance,
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
          const appearance = this.getWeaponEffects().dressBullet(sprite, def.id, this.activeWeapons.get(def.id) ?? 1);
          sprite.setRotation(angle);
          this.projectiles.push({
            appearance,
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
          const appearance = this.getWeaponEffects().dressBullet(sprite, def.id, this.activeWeapons.get(def.id) ?? 1);
          this.projectiles.push({
            appearance,
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
        const isKeg = def.id === 'hellfire_keg';
        for (let i = 0; i < lvl.projectileCount + this.extraProjectiles; i++) {
          const target = nearest[i] ?? nearest[0];
          const tx = target ? target.sprite.x + (i ? Math.cos(i * 2.4) * 45 : 0) : this.player.x + Math.cos(i * 1.2 + facingAngle) * 180;
          const ty = target ? target.sprite.y + (i ? Math.sin(i * 2.4) * 45 : 0) : this.player.y + Math.sin(i * 1.2) * 120;
          const sprite = this.add.sprite(this.player.x, this.player.y, 'proj_dynamite').setDepth(16);
          if (isKeg) sprite.setTint(0xff2200).setScale(1.8);
          this.lobProjectile(sprite, tx, ty, isKeg ? 800 : 650, () => this.explodeDynamite(tx, ty, lvl.damage, isKeg));
        }
        break;
      }
      case 'molotov': {
        sounds.playRicochet();
        const rank = this.activeWeapons.get(def.id) ?? 1;
        for (let i = 0; i < lvl.projectileCount + this.extraProjectiles; i++) {
          const target = nearest[i] ?? nearest[0];
          const angle = i * 2.399;
          const tx = target ? target.sprite.x + Math.cos(angle) * i * 28 : this.player.x + Math.cos(angle) * 130;
          const ty = target ? target.sprite.y + Math.sin(angle) * i * 28 : this.player.y + Math.sin(angle) * 110;
          const bottle = this.add.sprite(this.player.x, this.player.y, this.getWeaponEffects().bottleTexture()).setDepth(16);
          this.lobProjectile(bottle, tx, ty, 500 + i * 65, () => this.createFirePatch(tx, ty, lvl.damage, rank));
        }
        break;
      }
      case 'lasso':
      case 'cyclone_whip': {
        sounds.playWhip();
        const side = nearest[0] ? Math.sign(nearest[0].sprite.x - this.player.x) || 1 : Math.cos(facingAngle) < 0 ? -1 : 1;
        this.getWeaponEffects().whip(side, lvl.projectileCount + this.extraProjectiles, lvl.range * this.areaMultiplier,
          Math.round(lvl.damage * this.damageMultiplier), this.activeWeapons.get(def.id) ?? 1, def.id === 'cyclone_whip');
        break;
      }
    }
  }

  private getWeaponEffects(): WeaponEffects {
    return this.weaponEffects ??= new WeaponEffects(this, {
      position: () => this.player,
      nearby: (x, y, radius) => this.enemyHash.query(x, y, radius),
      damage: (enemy, damage) => this.damageEnemy(enemy, damage),
    });
  }

  private lobProjectile(sprite: Phaser.GameObjects.Sprite, x: number, y: number, duration: number, land: () => void): void {
    const startX = this.player.x, startY = this.player.y, flight = { progress: 0 };
    this.tweens.add({ targets: flight, progress: 1, duration,
      onUpdate: () => sprite.setPosition(startX + (x - startX) * flight.progress, startY + (y - startY) * flight.progress - Math.sin(flight.progress * Math.PI) * 70).setRotation(flight.progress * Math.PI * 4),
      onComplete: () => { sprite.destroy(); if (!this.isGameOver) land(); },
    });
  }

  private createFirePatch(x: number, y: number, damage: number, rank: number): void {
    if (this.fireZones.length >= 64) this.fireZones.shift()?.graphics.destroy();
    this.fireZones.push({ x, y, ...molotovFootprint(rank, this.areaMultiplier), damage: Math.round(damage * this.damageMultiplier),
      tickTimer: 0, graphics: this.add.graphics().setDepth(4) });
  }

  private explodeDynamite(x: number, y: number, damage: number, isKeg = false, alreadyScaled = false) {
    sounds.playExplosion();
    this.cameras.main.shake(isKeg ? 450 : 250, isKeg ? 0.016 : 0.008);

    const radius = (isKeg ? 150 : 90) * this.areaMultiplier;
    const scaledDamage = alreadyScaled ? damage : Math.round(damage * this.damageMultiplier);

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
        damage: Math.round(scaledDamage * 0.4),
        life: 5000,
        tickTimer: 0,
        graphics: gfx,
      });
    }

    // Damage all enemies in explosion radius (copy: kills mutate the array)
    this.enemies.slice().forEach((enemy) => {
      const dist = Math.hypot(enemy.sprite.x - x, enemy.sprite.y - y);
      if (dist <= radius) {
        this.damageEnemy(enemy, scaledDamage);
      }
    });
  }

  // 3. Update Projectiles
  private updateProjectiles(delta: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];

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
            this.explodeDynamite(enemy.sprite.x, enemy.sprite.y, Math.round(p.damage * 0.5), false, true);
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
      if (e.training) continue;
      const dx = this.player.x - e.sprite.x;
      const dy = this.player.y - e.sprite.y;
      const dist = Math.hypot(dx, dy);

      // AI refresh in staggered ~100-160ms intervals (boss: every frame)
      e.aiTimer = (e.aiTimer ?? Math.random() * 120) - delta;
      const refresh = e.type === 'boss' || e.aiTimer <= 0;
      if (refresh && e.type !== 'boss') e.aiTimer = 100 + Math.random() * 60;
      if (refresh && dist > 0.1) {
        const radius = e.type === 'boss' ? (this.stage === 3 ? 25 : 14) : ENEMY_DEFS[e.type].radius;
        const target = this.worldMap.chaseTarget?.(e.sprite.x, e.sprite.y, this.player.x, this.player.y, radius) ?? this.player;
        const steerX = target.x - e.sprite.x, steerY = target.y - e.sprite.y;
        const steerDistance = Math.hypot(steerX, steerY) || 1;
        e.dirX = steerX / steerDistance;
        e.dirY = steerY / steerDistance;
      }

      this.updateEnemyTactics(e, dx, dy, dist, delta);
      // During a charge, the sprite must face the locked movement direction too.
      const charging = (e.chargeWindup ?? 0) > 0 || (e.chargeRemaining ?? 0) > 0;
      const faceX = charging ? e.chargeX ?? dx : e.dirX ?? dx;
      const faceY = charging ? e.chargeY ?? dy : e.dirY ?? dy;
      if (e.bossSlug) playBossMovement(e.sprite, e.bossSlug, faceX, faceY);
      else if (e.combatSprite && e.type !== 'boss') playEnemyMovement(e.sprite, e.type, faceX, faceY);
      else if (e.usesPixellab) {
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
        const speed = (e.chargeWindup ?? 0) > 0 ? 0 : (e.chargeRemaining ?? 0) > 0 ? 440 : e.type === 'rifle_guard' && dist < 240 ? 0 : e.speed;
        const step = (speed * delta) / 1000;
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

        const fixed = this.worldMap.resolve(e.sprite.x, e.sprite.y, e.type === 'boss' ? (this.stage === 3 ? 25 : 14) : ENEMY_DEFS[e.type].radius);
        e.sprite.x = fixed.x;
        e.sprite.y = fixed.y;
      }

      e.sprite.setDepth(worldDepth(e.sprite.y));

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

      if (e.type === 'rifle_guard' && e.throwCooldown !== undefined) {
        e.throwCooldown -= delta;
        if (e.throwCooldown <= 0 && dist < 520) {
          e.throwCooldown = 2600;
          const angle = Math.atan2(dy, dx);
          this.encounters.warn({ x: this.player.x, y: this.player.y, radius: 28 }, 650, 100, 0);
          this.time.delayedCall(650, () => { if (!e.dead && !this.isGameOver && !this.bossDefeated) this.fireHostileBullet(e.sprite.x, e.sprite.y, angle, 14, 380); });
        }
      }

      // Stage 1 keeps its established shot timing; other bosses get weapon-specific attacks.
      if (e.type === 'boss' && e.throwCooldown !== undefined) {
        e.throwCooldown -= delta;
        if (e.throwCooldown <= 0) {
          e.throwCooldown = getBossCombat(this.stage).cooldown * (this.stage === 1 ? 1 : bossRageMultiplier(e.hp, e.maxHp));
          if (this.stage !== 1) { this.stageBossAttack(e); }
          else if (e.usesPixellab) {
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

  private enemyThrowDynamite(x: number, y: number, offsetX = 0, offsetY = 0, damage = 25) {
    sounds.playRicochet();
    const tnt = this.add.sprite(x, y, 'proj_dynamite').setDepth(8);
    const targetX = Phaser.Math.Clamp(this.player.x + offsetX, 48, WORLD_W - 48);
    const targetY = Phaser.Math.Clamp(this.player.y + offsetY, 48, WORLD_H - 48);
    const warning = this.add.graphics().setDepth(2);
    warning.lineStyle(2, 0xffc52a, 0.9).strokeCircle(targetX, targetY, 65);

    this.tweens.add({
      targets: tnt,
      x: targetX,
      y: targetY,
      rotation: Math.PI * 4,
      duration: 800,
      onComplete: () => {
        tnt.destroy();
        warning.destroy();
        if (this.isGameOver || this.bossDefeated) return;
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
          this.damagePlayer(damage);
        }
      },
    });
  }

  private bossRevolverBarrage(bx: number, by: number): void {
    this.getProjectileSystem().simonBarrage(bx, by, bossAttackDamage(18));
  }

  // 5. Fire Zones (Molotov)
  private updateFireZones(delta: number) {
    for (let i = this.fireZones.length - 1; i >= 0; i--) {
      const zone = this.fireZones[i];
      const activeDelta = Math.max(0, Math.min(delta, zone.life));
      zone.life -= delta;
      zone.tickTimer += activeDelta;

      this.getWeaponEffects().drawFire(zone, this.time.now);
      const ticks = Math.floor(zone.tickTimer / 400);
      if (ticks > 0) {
        zone.tickTimer %= 400;
        this.enemies.slice().forEach(enemy => {
          if (Math.hypot(enemy.sprite.x - zone.x, enemy.sprite.y - zone.y) <= zone.radius) this.damageEnemy(enemy, zone.damage * ticks);
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

      if (dist > 0 && dist < this.magnetRadius) {
        // Accelerate magnet pull towards player
        const speed = 400 + (1 - dist / this.magnetRadius) * 350;
        d.sprite.x += (dx / dist) * (speed * delta) / 1000;
        d.sprite.y += (dy / dist) * (speed * delta) / 1000;
      }

      if (dist < 28) {
        // Collect drop
        sounds.playCoin();
        const { packet, exhausted } = takeLootPacket(d);
        if (d.type === 'whiskey') {
          this.hp = Math.min(this.maxHp, this.hp + HEAL_DROP_HP);
          this.updateHpBar();
        }
        if (packet.val > 0) this.onboarding?.collectedXp();
        this.awardXp(packet.val);
        this.addBounty(packet.bounty);

        if (exhausted) { d.sprite.destroy(); this.drops.splice(i, 1); }
        if (this.choosingUpgrade) break;
      }
    }
  }

  private addBounty(amount: number) {
    this.bounty += amount;
    this.bountyText.setText(`$${String(this.bounty).padStart(6, '0')}`);
  }

  private addXp(amount: number) {
    this.currentXp += amount;
    if (!this.choosingUpgrade && this.currentXp >= this.xpToNextLevel) {
      this.currentXp -= this.xpToNextLevel;
      this.level++;
      this.xpToNextLevel = xpForLevel(this.level);
      this.levelText.setText(`LV. ${this.level}`);
      this.triggerLevelUp();
    }
    this.updateXpBar();
  }

  private awardXp(raw: number): void {
    const amount = Math.round(raw * this.xpBonus);
    this.rawXpEarned = (this.rawXpEarned ?? 0) + raw;
    this.totalXpEarned = (this.totalXpEarned ?? 0) + amount;
    this.addXp(amount);
  }

  private balanceSnapshot() {
    return { mode: normalizeDifficulty(this.difficulty), seconds: this.gameTimeSeconds, kills: this.kills,
      level: this.level, rawXp: this.rawXpEarned, earnedXp: this.totalXpEarned,
      badge: this.activePassives.get('badge') ?? 0, damageTaken: this.totalDamageTaken,
      bossSeconds: this.bossSpawned ? Math.max(0, this.gameTimeSeconds - this.stageConfig.duration) : 0 };
  }

  // Damage Handlers with Critical Hit Calculation
  private damageEnemy(enemy: Enemy, dmg: number) {
    if (enemy.dead) return;
    if (enemy.type === 'boss' && this.stage === 5 && this.combatNow > (enemy.vulnerableUntil ?? 0)) dmg *= 0.45;

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

    if (enemy.training) {
      if (enemy.pooled) this.enemyPool.release(enemy.sprite); else enemy.sprite.destroy();
      return;
    }

    this.kills++;
    this.killsText.setText(String(this.kills).padStart(4, '0'));
    this.gameEvents.emitEnemyKilled({ kind: enemy.type, x: enemy.sprite.x, y: enemy.sprite.y });

    // Drop Loot
    const dropRand = Math.random();
    let dropType: 'gold' | 'badge' | 'whiskey' = 'gold';
    let texture = 'drop_gold';

    if (enemy.type === 'boss' || enemy.type === 'elite') {
      dropType = 'badge';
      texture = 'drop_badge';
    } else if (dropRand < HEAL_DROP_CHANCE) {
      dropType = 'whiskey';
      texture = 'drop_whiskey';
    } else if (dropRand < HEAL_DROP_CHANCE + 0.2) {
      dropType = 'badge';
      texture = 'drop_badge';
    }

    // The final boss immediately starts stage clear: its cash drop cannot be collected.
    // Pay boss bounties once on death and leave XP pickup behavior unchanged.
    const lootBounty = enemy.type === 'boss' ? 0 : enemy.bountyVal;
    if (enemy.type === 'boss') this.addBounty(enemy.bountyVal);
    if (!mergeLoot(this.drops, { type: dropType, x: enemy.sprite.x, y: enemy.sprite.y, val: enemy.xpVal, bounty: lootBounty })) {
      const dropSprite = this.add.sprite(enemy.sprite.x, enemy.sprite.y, texture).setScale(1.3).setDepth(4);
      this.drops.push({ sprite: dropSprite, type: dropType, val: enemy.xpVal, bounty: lootBounty });
    }

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

    // Both Smith brothers must be defeated; a single death cannot clear stage 4.
    if (enemy.type === 'boss') {
      this.updateBossBar();
      if (this.bossMembers.some(b => !b.dead)) return;
      this.bossDefeated = true;
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
    if (this.isGameOver || this.bossDefeated || this.saloonOpen || this.choosingUpgrade || amount <= 0 || this.onboarding?.blocking) return;
    // Temporary invulnerability after taking a hit
    if (this.combatNow < this.invulnUntil) return;
    this.invulnUntil = this.combatNow + PLAYER_HIT_GRACE_MS;
    this.lastDamageAt = this.combatNow;
    this.tweens.add({
      targets: this.player,
      alpha: 0.35,
      duration: 70,
      yoyo: true,
      repeat: 3,
      onComplete: () => this.player.setAlpha(1),
    });

    const reduced = incomingDamage(amount, this.armor, this.difficulty);
    this.hp -= reduced;
    this.totalDamageTaken = (this.totalDamageTaken ?? 0) + reduced;
    this.gameEvents.emitPlayerDamaged(reduced);
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
    if (this.choosingUpgrade || this.isGameOver || this.saloonOpen) return;
    this.choosingUpgrade = true;
    this.scene.pause();

    // Pick 3 random eligible choices
    const choices = this.generateUpgradeChoices();
    const runId = this.runId;
    let resolved = false;
    this.scene.launch('LevelUpScene', {
      choices,
      character: this.character,
      level: this.level,
      hp: Math.ceil(this.hp),
      maxHp: this.maxHp,
      gold: this.bounty,
      kills: this.kills,
      onSelect: (choice: UpgradeChoice) => {
        if (resolved || this.isGameOver || this.runId !== runId) return;
        resolved = true;
        this.applyUpgrade(choice);
        this.choosingUpgrade = false;
        this.scene.resume();
      },
    });
  }

  private generateUpgradeChoices(): UpgradeChoice[] {
    const list: UpgradeChoice[] = [];

    // Checa se há evolução pronta para ser oferecida com prioridade máxima
    const eligibleEvo = getEligibleEvolution(this.activeWeapons, this.activePassives, this.gameTimeSeconds);
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
      if (WEAPON_EVOLUTIONS.some(e => e.baseWeaponId === wepId && this.activeWeapons.has(e.evolvedWeaponId))) return;
      const curLvl = this.activeWeapons.get(wepId) || 0;
      if (!curLvl && this.activeWeapons.size >= BUILD_LIMITS.weapons) return;
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
      if (!curLvl && this.activePassives.size >= BUILD_LIMITS.passives) return;
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

    if (!list.length) return [
      { type: 'reward', id: 'gold_purse', name: 'Bounty Purse', icon: 'badge', currentLevel: 0, nextLevel: 1, description: 'Collect $25 bonus gold.' },
      { type: 'reward', id: 'field_medicine', name: 'Frontier Medicine', icon: 'whiskey', currentLevel: 0, nextLevel: 1, description: 'Restore 25 HP.' },
    ];
    Phaser.Utils.Array.Shuffle(list);
    const owned = list.find(choice => choice.currentLevel > 0);
    return owned ? [owned, ...list.filter(choice => choice !== owned).slice(0, 2)] : list.slice(0, 3);
  }

  private applyUpgrade(choice: UpgradeChoice) {
    if (choice.type === 'reward') {
      if (choice.id === 'gold_purse') this.addBounty(25);
      else { this.hp = Math.min(this.maxHp, this.hp + 25); this.updateHpBar(); }
      return;
    }
    if (choice.type === 'evolution') {
      // Localiza a arma base e substitui
      const evoDef = WEAPON_EVOLUTIONS.find((e) => e.evolvedWeaponId === choice.id);
      if (evoDef) {
        this.activeWeapons.delete(evoDef.baseWeaponId);
        this.weaponTimers.delete(evoDef.baseWeaponId);
        if (evoDef.baseWeaponId === 'lasso') this.weaponEffects?.clearTransient();
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
      const previousLevel = this.activePassives.get(choice.id) || 0;
      this.activePassives.set(choice.id, newLvl);
      const def = PASSIVES[choice.id];
      const eff = def.levels[newLvl - 1].effect;

      if (eff.speedBonus) this.moveSpeed = this.character.stats.moveSpeed * (1 + eff.speedBonus);
      if (eff.xpBonus) this.xpBonus = 1 + eff.xpBonus;
      if (eff.hpRegen) this.hpRegen = eff.hpRegen;
      if (eff.cooldownReduction) this.fireRateMultiplier = cooldownMultiplier(this.character.stats.fireRateMultiplier, eff.cooldownReduction);
      if (eff.magnetRadius) this.magnetRadius = this.character.stats.magnetRadius + eff.magnetRadius;
      if (eff.armorBonus) this.armor += eff.armorBonus;
      if (eff.maxHpBonus) {
        const previousBonus = previousLevel ? def.levels[previousLevel - 1].effect.maxHpBonus ?? 0 : 0;
        this.maxHp = this.character.stats.maxHp + eff.maxHpBonus;
        this.hp = Math.min(this.maxHp, this.hp + eff.maxHpBonus - previousBonus);
        this.updateHpBar();
      }
    }
  }

  private victory() {
    this.stageClear();
  }

  private stageClear() {
    if (this.isGameOver) return;
    const bonus = stageClearBonus(this.stage);
    this.addBounty(bonus);
    this.isGameOver = true;
    sounds.stopBGM();
    sounds.playLevelUp();
    this.cameras.main.flash(250, 255, 235, 170);
    this.cameras.main.fade(750, 0, 0, 0);
    this.time.delayedCall(800, () => {
      this.scene.start('StageClearScene', {
        runId: this.runId, bonus, hpPct: this.hp / this.maxHp,
        character: this.character,
        stage: this.stage,
        difficulty: this.difficulty,
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
        runId: this.runId,
        character: this.character,
        stage: this.stage,
        difficulty: this.difficulty,
        timeSurvivedSeconds: this.gameTimeSeconds,
        kills: this.kills,
        bounty: this.bounty,
        level: this.level,
      });
    });
  }
}
