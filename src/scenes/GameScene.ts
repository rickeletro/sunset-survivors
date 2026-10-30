import { FRONTIER_FEEL, GunslingerStyle, evolutionTrail } from '../data/gunslingerStyle';
import { GunslingerHUD } from '../ui/hud/GunslingerHUD';
import { statsManager } from '../data/GameStatsManager';
import type { ConsumableId } from '../data/consumables';
import { SpriteGenerator } from '../utils/SpriteGenerator';
import { ENEMY_CAP, HORDE_CAP, MAIN_BOSS_AT, STAGE_SECONDS, WaveTimeline, waveAt, waveEnemyStats } from '../data/waves';
import { MINI_BOSSES, MINI_HERO_HEIGHTS, miniBossProfile, miniBossScale, miniBossFootOffset, shieldMultiplier } from '../data/miniBosses';
import { FrontierCompass } from '../ui/hud/FrontierCompass';
import { GALLERY_BOSS_KEYS, galleryProfile } from '../data/shootingGallery';
import { FrontierEvents } from '../systems/FrontierEvents';
import { faroPrize as chooseFaroPrize } from '../data/faroPrize';
import { developerEnabled } from '../dev/access';
import { FARO_MIN_STAKE, FaroTable, type FaroSettlement } from '../data/faro';
import { preloadChickens } from '../systems/ChickenSprites';
import { FrontierWildlife } from '../systems/FrontierWildlife';
import { StageAtmosphere } from '../systems/StageAtmosphere';
import { preloadSurfaces } from '../ui/components/PulpSurface';
import { WeaponEffects } from '../systems/WeaponEffects';
import { UPGRADE_HUD_ASSETS } from '../data/upgradeHud';
import { molotovFootprint, dynamiteRadius, insideBlast, lobPose } from '../data/weaponPresentation';
import { ECONOMY, servicePrice, type RunServiceId, BUILD_LIMITS, cooldownMultiplier, stageClearBonus, xpForLevel } from '../data/economy';
import { FirstRunTutorial, tutorialProgress } from '../systems/FirstRunTutorial';
import { FirstRunTutorialView } from '../ui/hud/FirstRunTutorialView';
import { t, getStageTitle, getConsumableCopy, getUpgradeName, getUpgradeDesc } from '../i18n';
import { sceneryForStage, sceneryKey, worldDepth } from '../data/scenery';
import { WORLD_DECORATION_KEYS } from '../data/worldDecorations';
import { SaloonVisit, saloonDoors, storeDoors, buildingDistance, SALOON_ENTRY_RADIUS, type SaloonDoor } from '../data/saloon';
import { BuildingPortalView } from '../ui/BuildingPortalView';
import type { BuildingTransitionData } from './BuildingTransitionScene';
import { samplePath, pathLength, type PortalPoint } from '../systems/BuildingPath';
import { preloadSupplyCart, createSupplyCartAnim, type SupplyCartDrop } from '../systems/SupplyCart';
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
import { bossHealth, difficultyProfile, difficultySettings, incomingDamage, normalizeDifficulty, type DifficultyId } from '../data/difficulty';
import { THEME } from '../ui/theme/tokens';
import { UpgradeChoice } from './LevelUpScene';
import { PerformanceMonitor } from '../systems/PerformanceMonitor';
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
import { getStage, isBossDue, StageConfig } from '../data/stages';
import { bossAttackDamage, bossRageMultiplier, getBossCombat, remainingBossHp } from '../data/bossCombat';
import { mergeLoot, takeLootPacket } from '../systems/LootBudget';
import { StageEncounters } from '../systems/StageEncounters';
import { bossSpriteTexture, enemySpriteTexture, playBossMovement, playEnemyMovement, preloadCombatSprites } from '../systems/PixellabCombat';
import { getEligibleEvolution, WEAPON_EVOLUTIONS } from '../data/evolutions';
import { CrowRush, preloadCrowRush } from '../systems/CrowRush';
import { FRONTIER_ENEMY_ROLES, isFrontierEnemy } from '../data/frontierEnemyRoles';
import { ISOMETRIC_PLANE, isometricAssetsForTheme, isometricStageProfile } from '../data/isometricWorld';
import { rollChestReward, type ChestWheelSegment } from '../data/chestReward';
import { IsometricStageView } from '../systems/IsometricStageView';
import { ChestRewardEvent } from '../ui/ChestRewardEvent';

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
  private wildlife?: FrontierWildlife;
  private frontierEvents?: FrontierEvents;
  private crowRush?: CrowRush;
  private atmosphere?: StageAtmosphere;
  private isometricView?: IsometricStageView;
  private frontierCompass?: FrontierCompass;
  private saloonVisit?: SaloonVisit;
  private saloonViews: { door: SaloonDoor; view: BuildingPortalView }[] = [];
  private saloonRestore?: () => void;
  private saloonOpen = false;
  private chestEventOpen = false;
  private chestRewardEvent?: ChestRewardEvent;
  private combatElapsedMs = 0;
  private lastDamageAt = -Infinity;
  private get combatNow(): number { return this.combatElapsedMs ?? this.time?.now ?? 0; }
  private objectiveStatus!: Phaser.GameObjects.Text;
  private activeBanner?: Phaser.GameObjects.Text;
  private waveTimeline?: WaveTimeline;
  private rareLootGlow?: Phaser.GameObjects.Graphics;
  private miniBossVisuals?: Phaser.GameObjects.Graphics;
  private bloodGraphics?: Phaser.GameObjects.Graphics;
  private bloodParticles: { x: number; y: number; vx: number; vy: number; gravity: number; life: number; maxLife: number; size: number; color: number }[] = [];
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
  private specialRoundsUntil = 0;
  private gunOilUntil = 0;
  private bootsUntil = 0;
  private megaDynamiteUntil = 0;
  private megaDynamiteTimer = 0;
  private omniShotUntil = 0;
  private omniShotTimer = 0;
  private silverBulletUntil = 0;
  private lastPickupChimeAt = -Infinity;
  private kills: number = 0;
  private choosingUpgrade = false;
  private runId = '';
  private walletActive = false;
  private earnedBounty = 0;
  private gunslinger?: GunslingerStyle;
  private gunslingerHUD?: GunslingerHUD;
  private moveIntent={x:1,y:0};
  private rerollsRemaining:number=FRONTIER_FEEL.rerolls;
  private contractChoices=0;
  private developerTest = false;
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
  private perfMonitor?: PerformanceMonitor;
  private stageLoadStart = 0;
  private stageLoadTimeMs = 0;
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

  init(data?: { character?: CharacterData; stage?: number; difficulty?: DifficultyId; developer?: boolean }) {
    this.developerTest = !!data?.developer && developerEnabled();
    const requested = data?.character?.id ?? 'billy';
    // Every gameplay entry point must enforce ownership, not only the selection screen.
    this.character = (this.developerTest || statsManager.isCharacterUnlocked(requested))
      ? CHARACTERS[requested] ?? CHARACTERS.billy : CHARACTERS.billy;
    this.stage = Math.max(1, Math.min(8, data?.stage || 1));
    this.stageConfig = getStage(this.stage);
    this.difficulty = normalizeDifficulty(data?.difficulty ?? difficultySettings.get());
  }

  preload() {
    this.stageLoadStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
    preloadSurfaces(this);
    preloadImages(this, UPGRADE_HUD_ASSETS);
    preloadImages(this, ['drop_gold', 'drop_badge', 'drop_whiskey', 'drop_moneybag', 'stage_roast', 'wm_supply', 'proj_dynamite', 'proj_lasso', 'stage_axe', 'chest_closed', 'chest_open', 'cancan_dancer', 'decor_skull']);
    preloadImages(this, isometricAssetsForTheme(this.stageConfig.theme));
    if (saloonDoors(this.stageConfig.theme).some(d => d.activity === 'gallery')) {
      preloadImages(this, GALLERY_BOSS_KEYS);
    }
    preloadChickens(this, this.stageConfig.theme);
    preloadCrowRush(this);
    preloadSupplyCart(this);
    preloadImages(this, sceneryForStage(this.stageConfig.theme).map(sceneryKey));
    // The black doorway cut must not reveal the street while the interior loads.
    if (saloonDoors(this.stageConfig.theme).length) {
      preloadImages(this, ['saloon_bkg', 'intro_bkg', 'decor_lantern', 'decor_spark', 'saloon_cancan', 'faro_dealer']);
    }
    preloadImages(this, [...new Set([...this.stageConfig.props, 'lantern', 'crate', 'barrel'])].map(kind => `wm_${kind}`));
    if (!['saloon', 'caboose', 'manor'].includes(this.stageConfig.theme)) preloadImages(this, WORLD_DECORATION_KEYS);
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
    createSupplyCartAnim(this);
    SpriteGenerator.createEconomyDrops(this);
    this.rareLootGlow = this.add.graphics().setDepth(3);
    this.onboardingView = undefined;
    this.weaponEffects = undefined;
    this.practiceActive = false;
    this.touchOrigin = null; this.touchVector = { x: 0, y: 0 }; this.touchPointerId = null;
    this.isGameOver = false;
    this.bossSpawned = false;
    this.bossMembers = [];
    this.waveTimeline = new WaveTimeline();
    this.activeBanner = undefined;
    this.bossDefeated = false;
    this.enemies = [];
    this.projectiles = [];
    this.drops = [];
    this.fireZones = [];
    this.gameTimeSeconds = 0;
    this.combatElapsedMs = 0;
    this.lastDamageAt = -Infinity;
    this.saloonOpen = false;
    this.chestEventOpen = false;
    this.chestRewardEvent = undefined;
    this.choosingUpgrade = false;
    this.runId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    this.kills = 0;
    this.initializeWallet();
    this.gunslinger=new GunslingerStyle(this.character.id);this.moveIntent={x:1,y:0};this.rerollsRemaining=FRONTIER_FEEL.rerolls;this.contractChoices=0;
    this.specialRoundsUntil = 0; this.gunOilUntil = 0; this.lastPickupChimeAt=-Infinity;
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
    const groundTile = this.add.tileSprite(0, 0, WORLD_W, WORLD_H, this.worldMap.groundTexture).setOrigin(0, 0).setDepth(-10);
    groundTile.setTint?.(isometricStageProfile(this.stageConfig.theme).groundTint);

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

    // Smooth camera follow inside world bounds with 2.5D isometric close framing
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.setZoom?.(ISOMETRIC_PLANE.cameraZoom);
    this.cameras.main.startFollow(this.player, true, 0.14, 0.14);
    this.worldMap.update(startX, startY);
    this.isometricView = new IsometricStageView(this, this.stageConfig.theme);
    this.isometricView.update(startX, startY, 0);
    this.wildlife = new FrontierWildlife(this, this.stageConfig.theme);
    this.atmosphere = new StageAtmosphere(this, this.stageConfig.theme, this.player);

    // Horde systems: director, pool, spatial hash, event bus
    this.gameEvents = new GameEvents();
    this.director = new GameDirector(this.gameEvents, this.stageConfig);
    this.enemyPool = new SpritePool(this, 5);
    this.enemyHash = new SpatialHash<Enemy>(64);
    this.gameEvents.on(GameEventNames.SpecialWave, (e: SpecialWaveEvent) => this.showBanner(e.label, '#ffc52a'));
    this.gameEvents.on(GameEventNames.EliteSpawned, () => this.showBanner(t('combat.eliteBountyHunter'), '#ff791c'));

    this.encounters = new StageEncounters(this, this.stageConfig, {
      position: () => ({ x: this.player.x, y: this.player.y }),
      damage: amount => this.damagePlayer(amount),
      spawn: (kind, x, y) => this.spawnEnemy(kind, x, y),
      reward: (contract?:boolean) => {
        if(contract)this.contractChoices++;
        this.addBounty(ECONOMY.sources.supplyBase + this.stage * ECONOMY.sources.supplyPerStage);
        this.hp = Math.min(this.maxHp, this.hp + 20);
        this.updateHpBar();
        sounds.playCoin();
        this.awardXp(80 + this.stage * 30);
        this.openChestRewardEvent(!!contract);
      },
      banner: (message, color) => this.showBanner(message, color),
      contested: (x, y) => this.enemies.some(e => !e.dead && Math.hypot(e.sprite.x - x, e.sprite.y - y) < 100),
      clearPoint: (x, y) => this.worldMap.resolve(x, y, 82),
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.chestRewardEvent?.destroy();
      this.chestRewardEvent = undefined;
      this.chestEventOpen = false;
      this.encounters.destroy();
      this.gameEvents.removeAllListeners();
    });

    this.frontierEvents = new FrontierEvents(this, this.stageConfig.theme, {
      spawn: (kind, x, y) => this.spawnEnemy(kind === 'knife_bandit' ? 'thief' : this.gameTimeSeconds < 240 && kind === 'rifle_guard' ? 'bandit' : kind, x, y),
      banner: text => this.showBanner(text, '#ffc52a'),
      explode: (x, y, radius, damage) => {
        for (const enemy of [...this.enemies]) if (!enemy.dead && Math.hypot(enemy.sprite.x - x, enemy.sprite.y - y) <= radius) this.damageEnemy(enemy, damage);
      },
    });
    this.crowRush = new CrowRush(this, text => this.showBanner(text, '#572449'), Math.random, 25000, 35000);
    this.crowRush.onCrowKilled = (cx?: number, cy?: number) => {
      this.kills++;
      this.killsText?.setText?.(String(this.kills).padStart(4, '0'));
      sounds.playBodyImpact?.();
      if (cx !== undefined && cy !== undefined) {
        this.spawnBloodSplatter(cx, cy, false, 5);
      }
    };
    // Keyboard Inputs
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keysWASD = this.input.keyboard.addKeys('W,A,S,D') as { [key: string]: Phaser.Input.Keyboard.Key };

      const dodge=(event:KeyboardEvent)=>{if(!event.repeat)this.tryDodge();};
      this.input.keyboard.on('keydown-SPACE',dodge);
      const contract=(event:KeyboardEvent)=>{if(!event.repeat&&!this.saloonBlocked())this.encounters.acceptContract();};
      this.input.keyboard.on('keydown-F',contract);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{this.input.keyboard?.off('keydown-SPACE',dodge);this.input.keyboard?.off('keydown-F',contract);});
      // ESC key to Pause
      this.input.keyboard.on('keydown-ESC', () => {
        if (this.isGameOver || this.choosingUpgrade || this.saloonOpen || this.chestEventOpen || this.scene.isPaused('GameScene')) return;
        this.scene.pause('GameScene');
        this.scene.launch('PauseScene', {
          developer: this.developerTest,
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
    this.gunslingerHUD=new GunslingerHUD(this,this.gunslinger!,()=>this.tryDodge());
    this.gunslingerHUD.setRoute(evolutionTrail(this.activeWeapons,this.activePassives));
    this.miniBossVisuals = this.add.graphics().setDepth(23);
    this.bloodGraphics = this.add.graphics().setDepth(20);
    this.events.once('shutdown', () => {
      this.bloodGraphics?.destroy();
      this.bloodParticles = [];
    });
    this.events.on(Phaser.Scenes.Events.RESUME, () => {
      this.time.paused = false;
      this.tweens.paused = false;
      this.saloonOpen = false;
      statsManager.refresh();
      this.bounty = statsManager.getStats().bank;
      this.bountyText?.setText(`$${String(this.bounty).padStart(6, '0')}`);
      this.hud?.consumables?.refresh();
      this.invulnUntil = Math.max(this.invulnUntil, this.combatNow + PLAYER_HIT_GRACE_MS);
    });
    this.createOnboarding();
    this.createSaloonInteraction();
    this.frontierCompass = new FrontierCompass(this);

    // Diagnostic Performance Monitor (F3 to toggle)
    this.stageLoadTimeMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - (this.stageLoadStart || 0);
    this.perfMonitor = new PerformanceMonitor(this);
    if (this.developerTest) this.perfMonitor.setVisible(true);
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

    if (this.developerTest) this.add.text(this.scale.width / 2, 178, 'DEVELOPER TEST • [ESC] RESTART / RETURN TO PANEL', {
      fontFamily: THEME.typography.pixelFont, fontSize: '12px', color: '#ffc52a', backgroundColor: '#321b10', padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(60);
    this.updateStageStatus();
    if (!this.onboarding?.blocking) this.showBanner(t('combat.stageBanner', { stage: this.stage, title: getStageTitle(this.stage, this.stageConfig.title) }), '#ffc52a');
    sounds.startBGM(this.stage);
  }

  private createOnboarding(): void {
    const device = this.sys.game.device;
    const touch = device.input.touch && !device.os.desktop;
    const skipTutorial = this.developerTest || this.stage !== 1;
    this.onboarding = new FirstRunTutorial(skipTutorial, touch ? 'touch' : 'keyboard', () => tutorialProgress.complete());
    if (skipTutorial) this.onboarding.skip();
    this.practiceActive = this.onboarding.blocking;
    this.onboardingView = new FirstRunTutorialView(this, this.onboarding, this.character.id, () => {
      if (!this.onboarding?.blocking) return;
      this.onboarding.skip(); this.finishPractice();
    });
    this.onboardingView.update(this.player.x, this.player.y, this.time.now);
  }

  private finishPractice(): void {
    if (!this.practiceActive && !this.onboarding) return;
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
    this.showBanner(t('combat.stageBanner', { stage: this.stage, title: getStageTitle(this.stage, this.stageConfig.title) }), '#ffc52a');
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
    }, getBossForStage(this.stage).name, (id) => this.activateConsumable(id));
    this.levelText = this.hud.levelText;
    this.bountyText = this.hud.bountyText;
    this.timeText = this.hud.timeText;
    this.killsText = this.hud.killsText;
    this.bossBarContainer = this.hud.bossBarContainer;
    this.stageStatus = this.hud.stageStatus;
    this.objectiveStatus = this.hud.objectiveStatus;
    this.hud.upgrades.sync(this.activeWeapons, this.activePassives);
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

    if (this.gameTimeSeconds >= STAGE_SECONDS) { this.gameOver(false); return; }
    const beat = this.waveTimeline?.advance(this.gameTimeSeconds);
    for (const wave of beat?.miniBosses ?? []) this.spawnMiniBoss(wave);
    // The main boss arrives at 9:00; ordinary hordes continue until victory or 10:00.
    if (!this.bossSpawned && isBossDue(this.stageConfig, this.gameTimeSeconds)) this.spawnStageBoss();
    this.encounters.tick(this.gameTimeSeconds, this.bossSpawned);
    this.updateStageStatus();

    // Game Director: special waves and elites
    this.runSpawnOrders(this.director.tick(this.gameTimeSeconds, this.enemies.length));
  }

  private showBanner(text: string, color: string) {
    if (this.activeBanner) { this.tweens.killTweensOf?.(this.activeBanner); this.activeBanner.destroy(); }
    const banner = this.add.text(this.scale.width / 2, this.scale.height / 2 - 130, text, {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '18px',
      color,
      stroke: '#000',
      strokeThickness: 5,
      align: 'center', wordWrap: { width: Math.max(240, this.scale.width - 60) },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(80);
    this.activeBanner = banner;
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
        speed: combat.speed, damage: combat.damage, xpVal: 300, bountyVal: ECONOMY.sources.bossBase + this.stage * ECONOMY.sources.bossPerStage,
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
      for (let i = 0; i < order.count && this.enemies.length < HORDE_CAP; i++) {
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

  private spawnEnemy(kind: EnemyKind, x: number, y: number, mini?: ReturnType<typeof miniBossProfile>) {
    if (this.enemies.length >= (mini ? ENEMY_CAP : HORDE_CAP)) return;
    const def = ENEMY_DEFS[kind];
    const stats = waveEnemyStats(def, this.gameTimeSeconds, this.difficulty);
    const hp = mini?.hp ?? stats.hp;
    const combatTexture = enemySpriteTexture(this, kind);
    const frameScale = combatTexture ? 64 / this.textures.get(combatTexture).getSourceImage().width : 1;
    const sprite = this.enemyPool.acquire(x, y, combatTexture ?? def.texture, mini ? miniBossScale(mini.kind, MINI_HERO_HEIGHTS[this.character?.id] ?? 68.5) : def.scale * frameScale * ENEMY_VISUAL_SCALE);
    const safe = this.worldMap.resolve(x, y, def.radius);
    sprite.setPosition(safe.x, safe.y);
    if (def.tint) sprite.setTint(def.tint);
    const enemy: Enemy = {
      sprite,
      type: kind,
      hp,
      maxHp: hp,
      speed: mini?.speed ?? stats.speed,
      damage: mini?.damage ?? stats.damage,
      xpVal: mini?.xp ?? def.xp,
      bountyVal: mini?.bounty ?? def.bounty,
      throwCooldown: kind === 'dynamiter' ? 2000 : kind === 'rifle_guard' ? 1700 : isFrontierEnemy(kind) && FRONTIER_ENEMY_ROLES[kind].cooldown > 0 ? FRONTIER_ENEMY_ROLES[kind].cooldown : undefined,
      combatSprite: !!combatTexture,
      chargeCooldown: kind === 'longhorn' ? 650 : undefined,
      pooled: true,
      tint: mini?.color ?? def.tint,
      miniWave: mini?.wave, miniCooldown: mini ? 1300 : undefined,
    };
    if (mini) sprite.setTint(mini.color);
    this.enemies.push(enemy);
    return enemy;
  }

  private spawnMiniBoss(wave: number): Enemy | undefined {
    const profile = miniBossProfile(wave, this.stage, this.difficulty);
    const point = this.worldMap.spawnPointAround(this.player.x, this.player.y, 480, 560);
    const enemy = this.spawnEnemy(profile.kind, point.x, point.y, profile);
    if (enemy) { sounds.playBossWarning(); this.showBanner(t('combat.waveCaptain', { wave, name: profile.name }), '#ffc52a'); }
    return enemy;
  }

  private updateMiniBoss(e: Enemy, dx: number, dy: number, distance: number, delta: number): void {
    const def = MINI_BOSSES[e.miniWave! - 1];
    if ((e.miniWindup ?? 0) > 0) {
      e.miniWindup = Math.max(0, e.miniWindup! - delta);
      if (e.miniWindup === 0) {
        if ((def.wave === 1 || def.wave === 4) && e.miniTarget && Math.hypot(this.player.x-e.miniTarget.x,this.player.y-e.miniTarget.y)<65) this.damagePlayer(Math.round(e.damage*1.35));
        if (def.wave === 2 || def.wave === 5) {
          sounds.playRevolver();
          for (const offset of def.wave === 5 ? [-.1, 0, .1] : [0]) this.fireHostileBullet(e.sprite.x, e.sprite.y, e.miniAim! + offset, e.damage, 850);
        }
        e.miniCooldown = def.cooldown * (def.wave === 5 && e.hp < e.maxHp * .4 ? .7 : 1);
      }
      return;
    }
    e.miniCooldown = (e.miniCooldown ?? 0) - delta;
    if (e.miniCooldown! > 0 || distance > (def.wave === 1 || def.wave === 4 ? 130 : 700)) return;
    e.miniWindup = def.windup; e.miniAim = Math.atan2(dy, dx);
    e.miniTarget = {x:this.player.x, y:this.player.y};
    if (def.wave === 1 || def.wave === 4) {
      const length = distance || 1;
      e.miniTarget={x:e.sprite.x+dx/length*65,y:e.sprite.y+dy/length*65};
      this.encounters.warn({...e.miniTarget,radius:65}, def.windup, 120, 0);
    }
    if (def.wave === 3) {
      // Telegraph and persistent traps use the existing bounded hazard manager.
      for (const offset of [-70, 70]) this.encounters.warn({x:e.miniTarget.x+offset,y:e.miniTarget.y,radius:46}, def.windup, 2200, e.damage);
    }
  }

  private drawMiniBosses(): void {
    const g = this.miniBossVisuals; if (!g) return; g.clear();
    for (const e of this.enemies) if (e.miniWave && !e.dead) {
      const def = MINI_BOSSES[e.miniWave-1], x=e.sprite.x, y=e.sprite.y;
      g.fillStyle(0x120b08,.9).fillRect(x-26,y-50,52,7);
      g.fillStyle(def.color,1).fillRect(x-25,y-49,50*Math.max(0,e.hp/e.maxHp),5);
      g.lineStyle(1,def.color,.9).strokeCircle(x,y+miniBossFootOffset(def.kind,MINI_HERO_HEIGHTS[this.character?.id] ?? 68.5)-1,15);
      if (e.miniWave===4 && !(e.miniWindup!>0)) {
        const a=Math.atan2(e.dirY??1,e.dirX??0);g.lineStyle(5,0x8bdd78,.85).beginPath().arc(x,y,24,a-.9,a+.9).strokePath();
      }
      if (e.miniWindup!>0 && (e.miniWave===2 || e.miniWave===5)) g.lineStyle(3,0xffc52a,.7).lineBetween(x,y,x+Math.cos(e.miniAim!)*600,y+Math.sin(e.miniAim!)*600);
    }
  }

  private updateStageStatus(): void {
    const wave = waveAt(this.gameTimeSeconds);
    const remaining = Math.max(0, wave.id * 120 - this.gameTimeSeconds);
    const clock = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;
    this.stageStatus.setText(`${difficultyProfile(this.difficulty).label} • WAVE ${wave.id}/5 • ${wave.name} • ${this.bossSpawned ? 'DEFEAT THE BOSS • ' : ''}${clock}`);
    this.objectiveStatus.setText(this.encounters.objectiveHint());
  }

  private updateEnemyTactics(e: Enemy, dx: number, dy: number, distance: number, delta: number): void {
    if (e.miniWave) { this.updateMiniBoss(e, dx, dy, distance, delta); return; }
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
  private fireHostileArrow(x: number, y: number, angle: number, damage: number, range = 680): void {
    this.getProjectileSystem().fire(x, y, angle, damage, { range, arrow: true, duration: range / .45 });
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
        this.showBanner(t('combat.whipShieldDrop'), '#ffc52a');
        break;
      case 'axes':
        for (const offset of [-0.45, 0, 0.45]) this.fireHostileBullet(x, y, angle + offset, bossAttackDamage(25), 620, true);
        this.encounters.warn({ x, y, radius: 100 }, 850, 450, bossAttackDamage(25));
        break;
      case 'gatling':
        this.showBanner(t('combat.gatlingAimLock'), '#ff791c');
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
    if (this.isGameOver || this.bossDefeated || this.saloonOpen || this.chestEventOpen) return;
    this.combatElapsedMs = (this.combatElapsedMs ?? 0) + delta;
    if (!this.onboarding?.blocking && !this.choosingUpgrade && this.currentXp >= this.xpToNextLevel) { this.addXp(0); return; }
    if(this.contractChoices>0&&!this.choosingUpgrade&&!this.onboarding?.blocking){this.contractChoices--;this.triggerLevelUp('CONTRACT WON!');return;}
    const oldX = this.player.x, oldY = this.player.y;
    this.handlePlayerMovement(delta);
    const crowPull = this.crowRush?.update(delta, this.combatNow, this.player, false);
    if (crowPull) {
      const pulled = this.worldMap.resolve(this.player.x + crowPull.x, this.player.y + crowPull.y, 10);
      this.player.setPosition(pulled.x, pulled.y);
      if (crowPull.damage && crowPull.damage > 0) {
        this.damagePlayer(crowPull.damage);
      }
    }
    this.gunslingerHUD?.update(this.combatNow,this.player.x,this.player.y,!!(this.onboarding?.visible||this.choosingUpgrade));
    this.updateSaloonPrompt();
    this.atmosphere?.update();
    const wasBlocking = !!this.onboarding?.blocking;
    this.onboarding?.tick(delta, Math.hypot(this.player.x - oldX, this.player.y - oldY));
    if (wasBlocking && !this.onboarding?.blocking) this.finishPractice();
    this.onboardingView?.update(this.player.x, this.player.y, this.time.now);
    if (this.onboarding?.blocking) {
      this.player.setDepth(worldDepth(this.player.y));
      this.worldMap.update(this.player.x, this.player.y);
      this.isometricView?.update(this.player.x, this.player.y, this.time.now);
      return;
    }
    // Keep the existing combat order after the isolated practice session.
    this.handleWeaponsAutoFire(delta);
    this.updateProjectiles(delta);
    this.weaponEffects?.update(delta, this.projectiles);
    this.updateBloodParticles(delta);
    this.updateConsumableEffects(delta);
    this.updateEnemies(delta);
    this.drawMiniBosses();
    this.player.setDepth(worldDepth(this.player.y));
    this.worldMap.update(this.player.x, this.player.y);
    this.isometricView?.update(this.player.x, this.player.y, this.time.now);
    this.updateDrops(delta);
    if (!this.onboarding?.blocking) {
      const healed = this.wildlife?.update(delta, this.player.x, this.player.y, this.hp, this.maxHp,
        (x, y) => this.worldMap.resolve(x, y, 8)) ?? 0;
      if (healed > 0) { this.hp += healed; this.updateHpBar(); sounds.playCoin(); }
    }
    if (this.choosingUpgrade) return;
    this.updateFireZones(delta);
    this.encounters.update(delta);
    this.frontierEvents?.update(delta, this.player.x, this.player.y, this.bossSpawned || this.bossDefeated || this.choosingUpgrade);
    this.perfMonitor?.update(delta, {
      enemies: this.enemies.length,
      projectiles: this.projectiles.length,
      particles: this.bloodParticles.length,
      loadTimeMs: this.stageLoadTimeMs,
    });
  }

  private saloonBlocked(): boolean {
    return this.isGameOver || this.bossSpawned || this.bossDefeated || this.choosingUpgrade || this.saloonOpen || this.chestEventOpen || !!this.onboarding?.visible;
  }

  private createSaloonInteraction(): void {
    const doors = [...saloonDoors(this.stageConfig.theme), ...storeDoors(this.stageConfig.theme)];
    this.saloonVisit = new SaloonVisit(doors, this.stageConfig.id === 2 ? { healthFraction: 0.2, bounty: 0 } : undefined, true, this.stageConfig.id === 2);
    this.saloonViews = this.saloonVisit.doors.flatMap(door => door.portal ? [{ door,
      view: new BuildingPortalView(this, door.portal,
        door.activity === 'gallery' ? `${galleryProfile(this.stageConfig.id).name.toUpperCase()} • TARGET PRACTICE` :
        door.activity === 'hospitality' ? 'HOSPITALITY • PAID REST & SUPPLIES' :
        door.activity === 'store' ? "BARNABY'S STORE • 2X OUTPOST SURCHARGE" :
        this.stageConfig.id === 2 ? 'SALOON • FARO • $ + ITEMS' : 'SALOON • PAID REST & SUPPLIES',
        () => this.openSaloon(door)) }] : []);
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
    const blocked = this.saloonBlocked();
    this.frontierCompass?.update(this.saloonVisit, this.player.x, this.player.y, this.combatNow, !!(this.saloonOpen || this.onboarding?.visible || this.choosingUpgrade || this.isGameOver),this.encounters?.objectivePoint);
    this.saloonViews?.forEach(({ door, view }) => {
      const used = !!this.saloonVisit?.wasUsed(door);
      const distance = buildingDistance(door, this.player.x, this.player.y);
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

  public openStoreFromBuilding(_landmark?: unknown): void {
    if (this.saloonBlocked()) return;
    this.saloonOpen = true;
    this.time.paused = true;
    this.tweens.paused = true;
    this.player.anims?.stop();
    this.scene.pause('GameScene');
    this.scene.launch('StoreScene', {
      fromScene: 'GameScene',
      priceMultiplier: 2,
    });
  }

  private openSaloon(requested?: SaloonDoor): void {
    const visit = this.saloonVisit, blocked = this.saloonBlocked();
    const door = requested ?? visit?.nearby(this.player.x, this.player.y, blocked);
    if (!visit || blocked || visit.used || !door?.portal || !visit.doors.includes(door) ||
      buildingDistance(door, this.player.x, this.player.y) > SALOON_ENTRY_RADIUS) return;
    if (door.activity === 'store') {
      this.openStoreFromBuilding();
      return;
    }
    if (this.stageConfig.id === 2 && (door.activity ?? 'saloon') === 'saloon' && this.bounty < FARO_MIN_STAKE) {
      this.showBanner(t('saloon.faroNeedBounty'), '#ffc52a'); return;
    }
    const isFaro = this.stageConfig.id === 2 && (door.activity ?? 'saloon') === 'saloon';
    const offeredPrize = isFaro ? chooseFaroPrize(this.generateUpgradeChoices()) : undefined;
    if (isFaro && !offeredPrize) { this.showBanner(t('saloon.faroArsenalFull'), '#ffc52a'); return; }
    const portal = door.portal;
    const path = this.worldMap.buildingPath(this.player, portal.threshold);
    if (!path) { sounds.playRicochet(); return; } // No free safety/consumed visit when the door is unreachable.
    const returnPath = this.worldMap.buildingPath(portal.threshold, door) ?? [...path].reverse();
    if (!visit.enter(this.player.x, this.player.y, blocked, door)) return;
    this.saloonOpen = true;
    const clockPaused = this.time.paused, tweensPaused = this.tweens.paused;
    const visible = this.player.visible;
    const originalZoom = this.cameras.main.zoom;
    this.saloonRestore = () => { this.cameras.main.zoom = originalZoom; this.time.paused = clockPaused; this.tweens.paused = tweensPaused; this.player.visible = visible; };
    // Freeze immediately, including the queued-pause transition frame.
    this.time.paused = true; this.tweens.paused = true;
    this.player.anims?.stop(); this.player.visible = false;
    this.updateSaloonPrompt();
    this.scene.pause('GameScene');
    let phase: 'enter' | 'inside' | 'exit' | 'done' = 'enter';
    let faroTable: FaroTable | undefined, faroPrize: UpgradeChoice | undefined, faroSettlement: FaroSettlement | undefined;
    let pendingXp = 0, gallerySettlement: { bounty:number; xp:number } | undefined;
    const purchases = new Set<RunServiceId>();
    const current = () => this.saloonVisit === visit && this.saloonOpen && !this.isGameOver;
    const allowed: RunServiceId[] = door.activity === 'gallery' ? ['gallery'] : isFaro ? [] : [door.activity === 'hospitality' ? 'hospitality_rest' : 'saloon_rest','special_rounds','gun_oil'];
    const canBuy = (id: RunServiceId): boolean => {
      if (!current() || phase !== 'inside' || !allowed.includes(id) || purchases.has(id) || this.bounty < servicePrice(id,this.stageConfig.id)) return false;
      if (id === 'saloon_rest' && this.hp >= this.maxHp) return false;
      if (id === 'special_rounds' && this.combatNow < this.specialRoundsUntil) return false;
      if (id === 'gun_oil' && this.combatNow < this.gunOilUntil) return false;
      return true;
    };
    const buy = (id: RunServiceId): boolean => {
      if (!canBuy(id)) return false;
      const service = ECONOMY.services[id];
      if(this.addBounty(-servicePrice(id,this.stageConfig.id)) === false)return false;
      purchases.add(id);
      if (service.health) { this.hp = Math.min(this.maxHp,this.hp + Math.round(this.maxHp * service.health)); this.updateHpBar(); }
      pendingXp += service.xp;
      if (id === 'special_rounds') this.specialRoundsUntil = this.combatNow + service.duration;
      if (id === 'gun_oil') this.gunOilUntil = this.combatNow + service.duration;
      return true;
    };
    const restore = () => {
      if (!current() || phase === 'done') return;
      phase = 'done';
      if (gallerySettlement) { this.addBounty(gallerySettlement.bounty); pendingXp += gallerySettlement.xp; }
      if (faroSettlement) {
        const paid=this.addBounty(faroSettlement.bountyDelta)!==false;
        if (paid && faroSettlement.wonItem && faroPrize) {
          const levels = faroPrize.type === 'weapon' ? this.activeWeapons : this.activePassives;
          while ((levels.get(faroPrize.id) ?? 0) < faroPrize.nextLevel) this.applyUpgrade(faroPrize);
        }
      }
      this.invulnUntil = Math.max(this.invulnUntil, this.combatNow + PLAYER_HIT_GRACE_MS);
      this.saloonRestore?.(); this.saloonRestore = undefined;
      this.saloonOpen = false;
      this.scene.resume('GameScene');
      if (pendingXp) { const xp=pendingXp; pendingXp=0; this.awardXp(xp); }
    };
    const transition = (mode: 'enter' | 'exit', route: PortalPoint[], complete: () => void, cancel: () => void) => {
      const data: BuildingTransitionData = { mode, path: route, portal,
        camera: { scrollX: this.cameras.main.scrollX, scrollY: this.cameras.main.scrollY, zoom: this.cameras.main.zoom },
        actor: { texture: this.player.texture.key, frame: this.player.frame.name, scaleX: this.player.scaleX,
          scaleY: this.player.scaleY, hero: this.character.id, pixellab: this.usePixellab },
        onZoom: zoom => { if (current()) this.cameras.main.zoom = zoom; },
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
      if (isFaro) {
        faroTable = new FaroTable(this.bounty);
        faroPrize = offeredPrize;
      }
      this.scene.launch('SaloonScene', { getBalance:()=>this.bounty, canBuy, onBuy:buy, gallery: door.activity === 'gallery', galleryStage: this.stageConfig.id, onGalleryLeave: (gains: { bounty: number; xp: number }) => {
        if (!current() || phase !== 'inside' || door.activity !== 'gallery') return;
        phase = 'exit'; visit.leave(false); this.scene.stop('SaloonScene');
        if (purchases.has('gallery')) {
          const profile=galleryProfile(this.stageConfig.id);
          gallerySettlement={bounty:Math.max(0,Math.min(profile.targets*ECONOMY.gallery.perHit+profile.perfectBonus,Number(gains.bounty)||0)),xp:Math.max(0,Math.min(profile.targets*ECONOMY.gallery.xpPerHit,Number(gains.xp)||0))};
        }
        transition('exit', returnPath, restore, restore);
      }, table: faroTable, prize: faroPrize, faro: isFaro, hospitality: door.activity === 'hospitality', onLeave: (accept: boolean) => {
        if (!current() || phase !== 'inside') return;
        if (accept && !isFaro && door.activity !== 'gallery') buy(door.activity === 'hospitality' ? 'hospitality_rest' : 'saloon_rest');
        phase = 'exit';
        faroSettlement = faroTable?.close();
        visit.leave(false, faroSettlement?.wonItem);
        this.scene.stop('SaloonScene');
        transition('exit', returnPath, restore, restore);
      } });
    }, () => { visit.leave(false); restore(); });
  }

  // 1. Player Movement & Facing Direction
  private handlePlayerMovement(delta: number) {
    let {x:dx,y:dy}=this.readMovementIntent();
    const keyboardMoving=this.cursors&&this.keysWASD&&[this.cursors.left,this.cursors.right,this.cursors.up,this.cursors.down,this.keysWASD.W,this.keysWASD.A,this.keysWASD.S,this.keysWASD.D].some(key=>key.isDown);
    if(keyboardMoving)this.onboarding?.setInput('keyboard');
    const dash=this.gunslinger?.movement(this.combatNow,delta);
    if(dx||dy)this.moveIntent={x:dx,y:dy};
    if(dash){dx=dash.x;dy=dash.y;}
    this.gunslinger?.tick(this.combatNow,delta,dx!==0||dy!==0);
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      const nx = dx / len;
      const ny = dy / len;
      const curSpeed = this.moveSpeed * (this.combatNow < this.bootsUntil ? 1.8 : 1.0);
      const step = dash ? Math.hypot(dash.x, dash.y) : (curSpeed * delta) / 1000;
      // Substeps preserve building collision during the fast dodge, including a slow frame.
      if(dash){
        const steps=Math.max(1,Math.ceil(step/8));
        for(let i=0;i<steps;i++){
          const point=this.worldMap.resolve(this.player.x+nx*step/steps,this.player.y+ny*step/steps,10);
          this.player.x=point.x;this.player.y=point.y;
        }
      }else{this.player.x+=nx*step;this.player.y+=ny*step;}

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

  private readMovementIntent(){
    let x=(this.cursors?.right?.isDown||this.keysWASD?.D?.isDown?1:0)-(this.cursors?.left?.isDown||this.keysWASD?.A?.isDown?1:0);
    let y=(this.cursors?.down?.isDown||this.keysWASD?.S?.isDown?1:0)-(this.cursors?.up?.isDown||this.keysWASD?.W?.isDown?1:0);
    if(this.touchOrigin){x+=this.touchVector.x;y+=this.touchVector.y;}
    return{x,y};
  }

  private tryDodge():boolean {
    const blocked=this.isGameOver||this.bossDefeated||this.saloonOpen||this.chestEventOpen||this.choosingUpgrade||!!this.onboarding?.blocking;
    const held=this.readMovementIntent(),direction=held.x||held.y?held:this.moveIntent??{x:1,y:0};
    if(!this.gunslinger?.dodge(this.combatNow,direction.x,direction.y,blocked))return false;
    this.invulnUntil=Math.max(this.invulnUntil??0,this.combatNow+FRONTIER_FEEL.dash.invulnerable);
    sounds.playReload();
    if(this.character.id==='cormano'){
      let pushed=0;
      for(const enemy of this.enemies){
        if(enemy.dead||enemy.type==='boss'||enemy.miniWave||pushed>=FRONTIER_FEEL.kick.cap)continue;
        const dx=enemy.sprite.x-this.player.x,dy=enemy.sprite.y-this.player.y,distance=Math.hypot(dx,dy);
        if(distance>FRONTIER_FEEL.kick.radius)continue;
        const length=Math.hypot(direction.x,direction.y)||1;
        const point=this.worldMap.resolve(enemy.sprite.x+(distance?dx/distance:direction.x/length)*FRONTIER_FEEL.kick.distance,enemy.sprite.y+(distance?dy/distance:direction.y/length)*FRONTIER_FEEL.kick.distance,10);
        enemy.sprite.x=point.x;enemy.sprite.y=point.y;pushed++;
      }
    }
    return true;
  }

  private get attackDamageMultiplier(): number {
    return this.damageMultiplier * (this.gunslinger?.damage??1) * (this.combatNow < (this.specialRoundsUntil ?? 0) ? ECONOMY.specialDamage : 1);
  }

  // 2. Weapon Auto-Fire Systems
  private handleWeaponsAutoFire(delta: number) {
    this.activeWeapons.forEach((level, weaponId) => {
      const def = WEAPONS[weaponId];
      if (!def) return;
      const lvlInfo = def.levels[level - 1];
      const curTimer = (this.weaponTimers.get(weaponId) || 0) + delta;

      const effectiveCooldown = (lvlInfo.cooldownMs / (this.fireRateMultiplier * (this.gunslinger?.fireRate??1) * (this.combatNow < (this.gunOilUntil ?? 0) ? ECONOMY.oilFireRate : 1)));
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
            damage: Math.round(lvl.damage * this.attackDamageMultiplier),
            pierce: lvl.pierce,
            shieldPiercing: lvl.pierce > 1,
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
            damage: Math.round(lvl.damage * this.attackDamageMultiplier),
            pierce: lvl.pierce,
            shieldPiercing: lvl.pierce > 1,
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
            damage: Math.round(lvl.damage * this.attackDamageMultiplier),
            pierce: lvl.pierce,
            shieldPiercing: lvl.pierce > 1,
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
          const radius = dynamiteRadius(this.areaMultiplier, isKeg);
          this.lobProjectile(sprite, tx, ty, isKeg ? 800 : 650,
            () => this.explodeDynamite(tx, ty, lvl.damage, isKeg, false, radius), radius);
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
          Math.round(lvl.damage * this.attackDamageMultiplier), this.activeWeapons.get(def.id) ?? 1, def.id === 'cyclone_whip');
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

  private lobProjectile(sprite: Phaser.GameObjects.Sprite, x: number, y: number, duration: number, land: () => void, blastRadius?: number): void {
    const startX = this.player.x, startY = this.player.y, flight = { progress: 0 };
    const marker = blastRadius === undefined ? undefined : this.getWeaponEffects().throwMarker(startX, startY, x, y, blastRadius);
    const runId = this.runId;
    let landed = false;
    this.tweens.add({ targets: flight, progress: 1, duration,
      onUpdate: () => {
        const pose = lobPose(startX, startY, x, y, flight.progress);
        sprite.setPosition(pose.x, pose.y).setRotation(marker ? pose.rotation : flight.progress * Math.PI * 4);
        if (marker) marker.progress = flight.progress;
      },
      onComplete: () => {
        if (landed) return;
        landed = true; sprite.destroy(); if (marker) marker.done = true;
        if (!this.isGameOver && !this.bossDefeated && this.runId === runId) land();
      },
    });
  }

  private createFirePatch(x: number, y: number, damage: number, rank: number): void {
    if (this.fireZones.length >= 64) this.fireZones.shift()?.graphics.destroy();
    this.fireZones.push({ x, y, ...molotovFootprint(rank, this.areaMultiplier), damage: Math.round(damage * this.attackDamageMultiplier),
      tickTimer: 0, graphics: this.add.graphics().setDepth(4) });
  }

  private explodeDynamite(x: number, y: number, damage: number, isKeg = false, alreadyScaled = false, impactRadius?: number) {
    sounds.playExplosion();

    const radius = impactRadius ?? dynamiteRadius(this.areaMultiplier, isKeg);
    const scaledDamage = alreadyScaled ? damage : Math.round(damage * this.attackDamageMultiplier);
    this.getWeaponEffects().explosion(x, y, radius, isKeg ? 'hellfire' : alreadyScaled ? 'residue' : 'tnt');
    this.crowRush?.blast(x, y, radius, scaledDamage);
    this.worldMap?.blastScenery?.(x, y, radius, scaledDamage, loot => this.spawnCartDrop(loot));

    if (isKeg) {
      // Cria lago de fogo persistente
      if (this.fireZones.length >= 64) this.fireZones.shift()?.graphics.destroy();
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
      if (!enemy.dead && insideBlast(enemy.sprite.x, enemy.sprite.y, x, y, radius)) {
        this.damageEnemy(enemy, scaledDamage);
      }
    });
  }

  // 3. Update Projectiles
  private updateProjectiles(delta: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];

      const previousX = p.sprite.x, previousY = p.sprite.y;
      // Linear Projectiles
      p.sprite.x += (p.vx * delta) / 1000;
      p.sprite.y += (p.vy * delta) / 1000;
      p.life -= delta;
      if (p.life > 0) {
        this.wildlife?.hit(previousX, previousY, p.sprite.x, p.sprite.y);
        if (!this.onboarding?.blocking && !this.bossSpawned) this.frontierEvents?.hit(previousX, previousY, p.sprite.x, p.sprite.y, p.damage);
        if (this.crowRush?.hit(previousX, previousY, p.sprite.x, p.sprite.y, p.damage)) {
          if (!p.shieldPiercing && p.pierce < 90) {
            p.pierce--;
            if (p.pierce <= 0) p.life = 0;
          }
        }
        if (p.life > 0 && this.worldMap?.hitScenery?.(previousX, previousY, p.sprite.x, p.sprite.y, p.damage, loot => this.spawnCartDrop(loot))) {
          if (!p.shieldPiercing && p.pierce < 90) {
            p.pierce--;
            if (p.pierce <= 0) p.life = 0;
          }
        }
      }

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
          this.damageEnemy(enemy, p.damage, { x: previousX, y: previousY, bypassShield: (p.shieldPiercing ?? (p.pierce > 1)) || p.isExplosiveBullet });

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
      if (e.fleeGoal && e.escapeAt === -1) {
        e.dead = true; this.enemies.splice(i, 1); this.enemyPool.release(e.sprite); continue;
      }
      const dx = this.player.x - e.sprite.x;
      const dy = this.player.y - e.sprite.y;
      const dist = Math.hypot(dx, dy);

      // AI refresh in staggered ~100-160ms intervals (boss: every frame)
      e.aiTimer = (e.aiTimer ?? Math.random() * 120) - delta;
      const refresh = e.type === 'boss' || e.aiTimer <= 0;
      if (refresh && e.type !== 'boss') e.aiTimer = 100 + Math.random() * 60;
      if (refresh && dist > 0.1) {
        const radius = e.type === 'boss' ? (this.stage === 3 ? 25 : 14) : ENEMY_DEFS[e.type].radius;
        const target = this.worldMap.chaseTarget?.(e.sprite.x, e.sprite.y, e.fleeGoal?.x ?? this.player.x, e.fleeGoal?.y ?? this.player.y, radius) ?? e.fleeGoal ?? this.player;
        const steerX = target.x - e.sprite.x, steerY = target.y - e.sprite.y;
        const steerDistance = Math.hypot(steerX, steerY) || 1;
        e.dirX = steerX / steerDistance;
        e.dirY = steerY / steerDistance;
      }

      if (!e.fleeGoal) this.updateEnemyTactics(e, dx, dy, dist, delta);
      const isNearCamera = dist < 950;
      if (typeof e.sprite.setVisible === 'function' && e.sprite.visible !== isNearCamera) {
        e.sprite.setVisible(isNearCamera);
      }

      // During a charge, the sprite must face the locked movement direction too.
      const charging = (e.chargeWindup ?? 0) > 0 || (e.chargeRemaining ?? 0) > 0;
      const faceX = e.miniWindup! > 0 ? Math.cos(e.miniAim!) : charging ? e.chargeX ?? dx : e.dirX ?? dx;
      const faceY = e.miniWindup! > 0 ? Math.sin(e.miniAim!) : charging ? e.chargeY ?? dy : e.dirY ?? dy;

      if (isNearCamera || e.type === 'boss') {
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
      }

      if (e.dirX !== undefined && e.dirY !== undefined) {
        const role = e.type === 'boss' ? undefined : isFrontierEnemy(e.type) ? FRONTIER_ENEMY_ROLES[e.type] : undefined;
        const speed = (e.miniWindup ?? 0) > 0 || (e.chargeWindup ?? 0) > 0 ? 0 : (e.chargeRemaining ?? 0) > 0 ? 440 : (e.type === 'rifle_guard' && !e.miniWave && dist < 240) || (!!role?.stopRange && dist < role.stopRange) ? 0 : e.speed;
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
      if (!e.miniWave && e.type === 'dynamiter' && e.throwCooldown !== undefined) {
        e.throwCooldown -= delta;
        if (e.throwCooldown <= 0 && dist < 320) {
          e.throwCooldown = 3000;
          this.enemyThrowDynamite(e.sprite.x, e.sprite.y, 0, 0, Math.round(25 * e.damage / ENEMY_DEFS.dynamiter.damage));
        }
      }

      if (!e.miniWave && e.type === 'rifle_guard' && e.throwCooldown !== undefined) {
        e.throwCooldown -= delta;
        if (e.throwCooldown <= 0 && dist < 520) {
          e.throwCooldown = 2600;
          const angle = Math.atan2(dy, dx);
          this.encounters.warn({ x: this.player.x, y: this.player.y, radius: 28 }, 650, 100, 0);
          this.time.delayedCall(650, () => { if (!e.dead && !this.isGameOver && !this.bossDefeated) this.fireHostileBullet(e.sprite.x, e.sprite.y, angle, Math.round(14 * e.damage / ENEMY_DEFS.rifle_guard.damage), 380); });
        }
      }

      if (!e.miniWave && e.type !== 'boss' && isFrontierEnemy(e.type) && e.throwCooldown !== undefined) {
        const role = FRONTIER_ENEMY_ROLES[e.type];
        e.throwCooldown -= delta;
        if (e.throwCooldown <= 0 && dist < role.range) {
          e.throwCooldown = role.cooldown;
          const angle = Math.atan2(dy, dx);
          if (role.attack === 'revolver') {
            sounds.playRevolver(); this.fireHostileBullet(e.sprite.x, e.sprite.y, angle, e.damage, role.range);
          } else if (role.attack === 'arrow') {
            sounds.playRicochet(); this.fireHostileArrow(e.sprite.x, e.sprite.y, angle, e.damage, role.range);
          } else if (role.attack === 'double-revolver') {
            sounds.playRevolver();
            for (const offset of [-.09, .09]) this.fireHostileBullet(e.sprite.x, e.sprite.y, angle + offset, e.damage, role.range);
          }
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
    this.rareLootGlow?.clear();
    let collected=0, pickupCash=0, pickupXp=0;
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      const dx = this.player.x - d.sprite.x;
      const dy = this.player.y - d.sprite.y;
      let dist = Math.hypot(dx, dy);
      if (d.type === 'magnet') {
        const pulse=(Math.sin(this.combatNow/130)+1)/2;
        d.sprite.setScale(.45+pulse*.025);
        this.rareLootGlow?.lineStyle(2,0xffc52a,.6+pulse*.3).strokeCircle(d.sprite.x,d.sprite.y,22+pulse*5);
      }

      if (dist > 0 && (d.attracted || dist < this.magnetRadius)) {
        // Accelerate magnet pull towards player
        const speed = d.attracted ? (d.pullSpeed=Math.min(ECONOMY.loot.maxPullSpeed,(d.pullSpeed??ECONOMY.loot.pullSpeed)+delta*.8)) : 400 + (1 - dist / this.magnetRadius) * 350;
        const travel=Math.min(dist,speed*Math.max(0,delta)/1000);
        d.sprite.x += (dx / dist) * travel;
        d.sprite.y += (dy / dist) * travel;
        dist=Math.hypot(this.player.x-d.sprite.x,this.player.y-d.sprite.y);
      }

      if (dist < 28) {
        // Consume the triggering packet first; marking the rest never awards or duplicates loot.
        if (d.type === 'magnet') {
          const { exhausted }=takeLootPacket(d);
          if (exhausted) { d.sprite.destroy(); this.drops.splice(i,1); }
          for (const item of this.drops) item.attracted=true;
          sounds.playMagnet(); this.getWeaponEffects().explosion(this.player.x,this.player.y,170,'magnet');
          this.showBanner(t('combat.rareMagnet'), '#ffc52a');
          continue;
        }
        // Drain original packets in a bounded batch, preserving XP rounding and every upgrade pause.
        let exhausted=false;
        do {
          if (this.combatNow-(this.lastPickupChimeAt ?? -Infinity)>=80) { sounds.playCoin(); this.lastPickupChimeAt=this.combatNow; }
          const result=takeLootPacket(d); exhausted=result.exhausted;
          if (d.type === 'whiskey') { this.hp=Math.min(this.maxHp,this.hp+HEAL_DROP_HP); this.updateHpBar(); }
          if (result.packet.val>0) this.onboarding?.collectedXp();
          this.awardXp(result.packet.val);pickupXp+=Math.round(result.packet.val*(this.xpBonus??1)); pickupCash+=result.packet.bounty; collected++;
        } while(!exhausted && !this.choosingUpgrade && collected<ECONOMY.loot.collectionBudget);
        if(exhausted) { d.sprite.destroy(); this.drops.splice(i,1); }
        if(this.choosingUpgrade || collected>=ECONOMY.loot.collectionBudget) break;
      }
    }
    // One persistent wallet write per pickup batch, including a large Magnet collection.
    const credited=pickupCash?this.addBounty(pickupCash)!==false:true;
    if(collected)this.gunslingerHUD?.pickup(pickupXp,credited?pickupCash:0,this.combatNow);
  }

  private initializeWallet() {
    this.walletActive=!this.developerTest;
    this.earnedBounty=0;
    statsManager.refresh();
    this.bounty=statsManager.getStats().bank;
  }

  private addBounty(amount: number): boolean {
    if (!Number.isFinite(amount)) return false;
    const delta=Math.trunc(amount);
    if(this.walletActive) {
      const balance=statsManager.changeBalance(delta);
      if(balance===undefined) {
        this.showBanner(t('combat.goldNotSaved'), '#e52b20');
        return false;
      }
      this.bounty=balance;
    } else this.bounty = Math.max(0,this.bounty + delta);
    if(delta>0)this.earnedBounty=(this.earnedBounty ?? 0)+delta;
    this.bountyText?.setText(`$${String(this.bounty).padStart(6, '0')}`);
    return true;
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
      bossSeconds: this.bossSpawned ? Math.max(0, this.gameTimeSeconds - MAIN_BOSS_AT) : 0 };
  }

  // Damage Handlers with Critical Hit Calculation
  private damageEnemy(enemy: Enemy, dmg: number, source?: {x:number;y:number;bypassShield?:boolean}) {
    if (enemy.dead) return;
    if (enemy.miniWave === 4 && !(enemy.miniWindup! > 0) && source) {
      dmg *= shieldMultiplier(enemy.dirX ?? 0, enemy.dirY ?? 1, source.x-enemy.sprite.x, source.y-enemy.sprite.y, source.bypassShield);
    }
    if (enemy.type === 'boss' && this.stage === 5 && this.combatNow > (enemy.vulnerableUntil ?? 0)) dmg *= 0.45;

    // Critical Hit Roll
    const silverActive = this.combatNow < this.silverBulletUntil;
    const isCrit = silverActive || Math.random() < Math.min(1,this.critChance+(this.gunslinger?.crit??0));
    let finalDamage = isCrit ? Math.round(dmg * this.critMultiplier) : dmg;
    if (silverActive) finalDamage = Math.round(finalDamage * 4.0);

    enemy.hp -= finalDamage;

    // Game juice: Body impact SFX with soft medium volume
    sounds.playBodyImpact?.();

    // Game juice: Upward blood particle burst (Western Pulp '98 palette)
    this.spawnBloodSplatter(enemy.sprite.x, enemy.sprite.y - 12, isCrit, isCrit ? 10 : 6);

    // Game juice: Directional knockback impulse on non-boss enemies
    if (enemy.type !== 'boss') {
      const pushDist = isCrit ? 8 : 4;
      const sx = source?.x ?? this.player.x;
      const sy = source?.y ?? this.player.y;
      let kx = enemy.sprite.x - sx;
      let ky = enemy.sprite.y - sy;
      const len = Math.hypot(kx, ky);
      if (len > 0.001) {
        kx /= len;
        ky /= len;
        const pushed = this.worldMap.resolve(enemy.sprite.x + kx * pushDist, enemy.sprite.y + ky * pushDist, 10);
        if (typeof enemy.sprite.setPosition === 'function') {
          enemy.sprite.setPosition(pushed.x, pushed.y);
        } else {
          enemy.sprite.x = pushed.x;
          enemy.sprite.y = pushed.y;
        }
      }
    }

    // Game juice: Micro screen shake punch on critical hits
    if (isCrit) {
      this.cameras?.main?.shake?.(45, 0.003);
    }

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
    this.spawnBloodSplatter(enemy.sprite.x, enemy.sprite.y - 10, true, 12);
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
    if(this.gunslinger?.kill(this.combatNow)){this.showBanner(t('combat.hotStreak'),'#ffc52a');sounds.playCoin();}
    this.killsText.setText(String(this.kills).padStart(4, '0'));
    this.gameEvents.emitEnemyKilled({ kind: enemy.type, x: enemy.sprite.x, y: enemy.sprite.y });

    // Drop Loot
    const dropRand = Math.random() + Number.EPSILON;
    let dropType: Drop['type'] = 'gold';
    let texture = 'drop_gold';

    if (enemy.miniWave || enemy.type === 'boss' || enemy.type === 'elite') {
      dropType = 'badge';
      texture = 'drop_badge';
    } else if (dropRand < HEAL_DROP_CHANCE) {
      dropType = 'whiskey';
      texture = 'drop_whiskey';
    } else if (dropRand < HEAL_DROP_CHANCE + ECONOMY.loot.moneyBagChance) {
      dropType='moneybag'; texture='drop_moneybag';
    } else if (dropRand < HEAL_DROP_CHANCE + ECONOMY.loot.moneyBagChance + ECONOMY.loot.badgeChance) {
      dropType = 'badge';
      texture = 'drop_badge';
    }

    // The final boss immediately starts stage clear: its cash drop cannot be collected.
    // Pay boss bounties once on death and leave XP pickup behavior unchanged.
    const lootBounty = enemy.type === 'boss' ? 0 : enemy.bountyVal + (dropType === 'moneybag' ? ECONOMY.loot.moneyBagValue : 0);
    if (enemy.type === 'boss') this.addBounty(enemy.bountyVal);
    if (!mergeLoot(this.drops, { type: dropType, x: enemy.sprite.x, y: enemy.sprite.y, val: enemy.xpVal, bounty: lootBounty })) {
      const dropSprite = this.add.sprite(enemy.sprite.x, enemy.sprite.y, texture).setScale(1.3).setDepth(4);
      this.drops.push({ sprite: dropSprite, type: dropType, val: enemy.xpVal, bounty: lootBounty });
    }

    if (enemy.miniWave && Math.random() < ECONOMY.loot.magnetChance) {
      if (!mergeLoot(this.drops,{type:'magnet',x:enemy.sprite.x,y:enemy.sprite.y,val:0,bounty:0})) {
        this.drops.push({type:'magnet',sprite:this.add.sprite(enemy.sprite.x+26,enemy.sprite.y,'hud_upgrade_magnet').setScale(.45).setDepth(5),val:0,bounty:0});
      }
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

  private spawnCartDrop(loot: SupplyCartDrop) {
    const texture = loot.type === 'gold' ? 'drop_gold'
      : loot.type === 'moneybag' ? 'drop_moneybag'
      : loot.type === 'badge' ? 'drop_badge'
      : 'drop_whiskey';
    const targetX = loot.x + Phaser.Math.Between(-36, 36);
    const targetY = loot.y + Phaser.Math.Between(-24, 24);
    if (!mergeLoot(this.drops, { type: loot.type, x: targetX, y: targetY, val: loot.val, bounty: loot.bounty })) {
      const dropSprite = this.add.sprite(loot.x, loot.y - 14, texture).setScale(1.25).setDepth(4);
      this.drops.push({ sprite: dropSprite, type: loot.type, val: loot.val, bounty: loot.bounty });
      this.tweens?.add?.({
        targets: dropSprite,
        x: targetX,
        y: targetY,
        duration: 380,
        ease: 'Back.easeOut',
      });
    }
  }

  private damagePlayer(amount: number) {
    if (this.isGameOver || this.bossDefeated || this.saloonOpen || this.chestEventOpen || this.choosingUpgrade || amount <= 0 || this.onboarding?.blocking) return;
    // Temporary invulnerability after taking a hit
    if (this.combatNow < this.invulnUntil) return;
    this.invulnUntil = this.combatNow + PLAYER_HIT_GRACE_MS;
    this.lastDamageAt = this.combatNow;
    this.gunslinger?.damaged();
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

  private spawnBloodSplatter(x: number, y: number, isCrit = false, count = 6): void {
    if (!this.bloodGraphics || this.bloodParticles.length > 200) return;
    const colors = isCrit
      ? [0xe52b20, 0xa51e16, 0xff791c, 0xffc52a]
      : [0xe52b20, 0xa51e16, 0x572449, 0xa51e16];

    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.1;
      const speed = isCrit ? (90 + Math.random() * 140) : (60 + Math.random() * 90);
      const life = 0.22 + Math.random() * 0.22;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = isCrit ? (Math.random() < 0.4 ? 3 : 2) : (Math.random() < 0.6 ? 2 : 1.5);

      this.bloodParticles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 420 + Math.random() * 120,
        life,
        maxLife: life,
        size,
        color,
      });
    }
  }

  private updateBloodParticles(delta: number): void {
    if (!this.bloodGraphics) return;
    this.bloodGraphics.clear();
    if (this.bloodParticles.length === 0) return;

    const dt = delta / 1000;
    let writeIdx = 0;

    for (let i = 0; i < this.bloodParticles.length; i++) {
      const p = this.bloodParticles[i];
      p.life -= dt;
      if (p.life <= 0) continue;

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;

      const alpha = Math.max(0, p.life / p.maxLife);
      this.bloodGraphics.fillStyle(p.color, alpha);
      this.bloodGraphics.fillRect(
        Math.round(p.x - p.size / 2),
        Math.round(p.y - p.size / 2),
        p.size,
        p.size
      );

      this.bloodParticles[writeIdx++] = p;
    }

    this.bloodParticles.length = writeIdx;
  }

  private activateConsumable(id: ConsumableId): void {
    if (this.isGameOver || this.bossDefeated || this.choosingUpgrade) return;
    if (!statsManager.useConsumable(id)) return;

    switch (id) {
      case 'golden_magnet': {
        sounds.playCoin();
        this.cameras?.main?.flash?.(100, 255, 197, 42, false);
        this.showBanner(getConsumableCopy('golden_magnet').banner, '#ffc52a');
        for (const drop of this.drops) {
          drop.attracted = true;
        }
        break;
      }
      case 'seven_league_boots': {
        sounds.playReload();
        this.bootsUntil = this.combatNow + 30000;
        this.showBanner(getConsumableCopy('seven_league_boots').banner, '#ff791c');
        this.cameras?.main?.flash?.(80, 255, 121, 28, false);
        break;
      }
      case 'miracle_elixir': {
        sounds.playCoin();
        this.hp = this.maxHp;
        this.updateHpBar();
        this.invulnUntil = Math.max(this.invulnUntil, this.combatNow + 6000);
        this.showBanner(getConsumableCopy('miracle_elixir').banner, '#f2d49a');
        this.cameras?.main?.flash?.(100, 242, 212, 154, false);
        break;
      }
      case 'mega_dynamite': {
        sounds.playExplosion();
        this.megaDynamiteUntil = this.combatNow + 30000;
        this.megaDynamiteTimer = 0;
        this.showBanner(getConsumableCopy('mega_dynamite').banner, '#e52b20');
        this.cameras?.main?.shake?.(100, 0.008);
        break;
      }
      case 'omni_shot': {
        sounds.playRevolver();
        this.omniShotUntil = this.combatNow + 30000;
        this.omniShotTimer = 0;
        this.showBanner(getConsumableCopy('omni_shot').banner, '#e52b20');
        this.cameras?.main?.shake?.(80, 0.006);
        break;
      }
      case 'silver_bullet': {
        sounds.playRifle();
        this.silverBulletUntil = this.combatNow + 30000;
        this.showBanner(getConsumableCopy('silver_bullet').banner, '#ffffff');
        this.cameras?.main?.flash?.(100, 255, 255, 255, false);
        break;
      }
    }
    this.hud?.consumables?.refresh();
  }

  private updateConsumableEffects(delta: number): void {
    if (this.isGameOver || this.bossDefeated || this.choosingUpgrade) return;

    // 1. High Noon 360° Bullet Storm
    if (this.combatNow < this.omniShotUntil) {
      this.omniShotTimer += delta;
      if (this.omniShotTimer >= 220) {
        this.omniShotTimer = 0;
        sounds.playPlayerGunshot?.();
        const count = 12;
        const baseDmg = Math.round(45 * this.attackDamageMultiplier);
        for (let i = 0; i < count; i++) {
          const angle = (i * 2 * Math.PI) / count + (this.combatNow / 400);
          const sprite = this.add.sprite(this.player.x, this.player.y, 'proj_bullet').setDepth(8).setTint(0xff791c).setScale(1.3);
          sprite.setRotation(angle);
          this.projectiles.push({
            sprite,
            vx: Math.cos(angle) * 520,
            vy: Math.sin(angle) * 520,
            damage: baseDmg,
            pierce: 2,
            shieldPiercing: true,
            hits: new Set(),
            life: 900,
            isExplosiveBullet: true,
          });
        }
      }
    }

    // 2. Nitro Dynamite Clustered Explosions
    if (this.combatNow < this.megaDynamiteUntil) {
      this.megaDynamiteTimer += delta;
      if (this.megaDynamiteTimer >= 750) {
        this.megaDynamiteTimer = 0;
        const targets = this.getNearestEnemies(380);
        const target = targets[0];
        const tx = target ? target.sprite.x : this.player.x + (Math.random() - 0.5) * 180;
        const ty = target ? target.sprite.y : this.player.y + (Math.random() - 0.5) * 180;
        this.explodeDynamite(tx, ty, Math.round(180 * this.attackDamageMultiplier), true, true);
      }
    }
  }

  private getNearestEnemies(range: number): Enemy[] {
    const px = this.player?.x ?? 0;
    const py = this.player?.y ?? 0;
    const crows = (this.crowRush?.activeTargets() ?? []) as unknown as Enemy[];

    // Reutiliza o SpatialHash para consultar apenas candidatos locais O(K), evitando O(N log N)
    const candidates = this.enemyHash ? this.enemyHash.query(px, py, range) : this.enemies;
    const pool = crows.length > 0 ? [...candidates, ...crows] : candidates;

    const inRange: { enemy: Enemy; dist2: number }[] = [];
    const r2 = range * range;

    for (let i = 0; i < pool.length; i++) {
      const e = pool[i];
      if (e.dead) continue;
      const dx = e.sprite.x - px;
      const dy = e.sprite.y - py;
      const d2 = dx * dx + dy * dy;
      if (d2 <= r2) {
        inRange.push({ enemy: e, dist2: d2 });
      }
    }

    inRange.sort((a, b) => a.dist2 - b.dist2);
    return inRange.map(item => item.enemy);
  }

  // Level Up Modal
  private triggerLevelUp(title='LEVEL UP!') {
    if (this.choosingUpgrade || this.isGameOver || this.saloonOpen || this.chestEventOpen) return;
    this.choosingUpgrade = true;
    this.scene.pause();

    // Pick 3 random eligible choices
    let choices = this.generateUpgradeChoices();
    const runId = this.runId;
    let resolved = false;
    this.scene.launch('LevelUpScene', {
      choices,title,
      rerollsRemaining:this.rerollsRemaining,
      onReroll:()=>{
        if(resolved||!this.choosingUpgrade||this.isGameOver||this.runId!==runId||this.rerollsRemaining<=0)return undefined;
        const key=(list:UpgradeChoice[])=>list.map(c=>c.id).sort().join('|');
        let next=choices;
        for(let attempt=0;attempt<12&&key(next)===key(choices);attempt++)next=this.generateUpgradeChoices();
        if(key(next)===key(choices))return undefined;
        choices=next;this.rerollsRemaining--;return{choices:next,remaining:this.rerollsRemaining};
      },
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
          name: getUpgradeName(wepId, def.name),
          icon: def.icon,
          currentLevel: curLvl,
          nextLevel: curLvl + 1,
          description: getUpgradeDesc(wepId, nextInfo.description),
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
          name: getUpgradeName(pasId, def.name),
          icon: def.icon,
          currentLevel: curLvl,
          nextLevel: curLvl + 1,
          description: getUpgradeDesc(pasId, nextInfo.description),
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
      if (choice.id === 'gold_purse') this.addBounty(ECONOMY.sources.purse);
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

      // The equipment badge provides localized evolution feedback.
      sounds.playLevelUp();
      this.showBanner(t('combat.weaponEvolved', { name: choice.name.toUpperCase() }), '#ffc52a');
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
    this.hud?.upgrades?.sync(this.activeWeapons, this.activePassives, choice.id);
    this.gunslingerHUD?.setRoute(evolutionTrail(this.activeWeapons,this.activePassives));
  }

  public openChestRewardEvent(contract = false, rng: () => number = Math.random): ChestRewardEvent | undefined {
    if (this.chestEventOpen || this.isGameOver || this.bossDefeated || this.saloonOpen || !this.add?.container) return undefined;
    const choices = this.generateUpgradeChoices();
    const roll = rollChestReward(choices, this.stage, contract, rng);
    this.chestEventOpen = true;
    this.player?.anims?.stop?.();
    this.chestRewardEvent = new ChestRewardEvent({
      scene: this,
      roll,
      onGrantReward: winner => this.grantChestWheelWinner(winner),
      onClose: () => {
        this.chestEventOpen = false;
        this.chestRewardEvent = undefined;
        this.invulnUntil = Math.max(this.invulnUntil ?? 0, this.combatNow + PLAYER_HIT_GRACE_MS);
      },
    });
    return this.chestRewardEvent;
  }

  private grantChestWheelWinner(winner: ChestWheelSegment): void {
    if (this.isGameOver) return;
    if (winner.kind === 'upgrade' && winner.choice) {
      this.applyUpgrade(winner.choice);
    } else if (winner.kind === 'bounty' && winner.bountyAmount) {
      this.addBounty(winner.bountyAmount);
    } else if (winner.kind === 'xp' && winner.xpAmount) {
      this.awardXp(winner.xpAmount);
    } else if (winner.kind === 'heal' && winner.healAmount) {
      this.hp = Math.min(this.maxHp, this.hp + winner.healAmount);
      this.updateHpBar();
    }
  }

  private victory() {
    this.stageClear();
  }

  private stageClear() {
    if (this.isGameOver) return;
    if (this.developerTest) { this.endDeveloperTest('STAGE COMPLETE'); return; }
    const bonus = stageClearBonus(this.stage);
    this.addBounty(bonus);
    this.isGameOver = true;
    sounds.stopBGM();
    sounds.playLevelUp();
    this.cameras.main.flash(250, 255, 235, 170);
    this.cameras.main.fade(750, 0, 0, 0);
    this.time.delayedCall(800, () => {
      this.scene.start('WantedScene', {
        mode: 'captured',
        runId: this.runId, walletSynced: this.walletActive, earnedBounty: this.earnedBounty, bonus, hpPct: this.hp / this.maxHp,
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

  private endDeveloperTest(result: string): void {
    if (this.isGameOver) return;
    this.isGameOver = true; sounds.stopBGM(); sounds.playIntroMusic();
    this.scene.start('DeveloperScene', { stage: this.stage, hero: this.character.id, difficulty: this.difficulty,
      result: `${result} • ${this.kills} KILLS • ${this.gameTimeSeconds}s` });
  }

  public setRunDifficulty(mode: DifficultyId) { this.difficulty = normalizeDifficulty(mode); }

  private gameOver(victory: boolean) {
    if (this.developerTest) { this.endDeveloperTest(victory ? 'STAGE COMPLETE' : 'TEST ENDED'); return; }
    if (victory) {
      this.stageClear();
      return;
    }
    this.isGameOver = true;
    sounds.stopBGM();
    this.cameras.main.fade(800, 0, 0, 0);
    this.time.delayedCall(850, () => {
      this.scene.start('GameOverScene', {
        runId: this.runId, walletSynced: this.walletActive, earnedBounty: this.earnedBounty,
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
