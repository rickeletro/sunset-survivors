# Equipment HUD, Normal opening and localized explosives

## Equipment display

The gameplay HUD now includes a compact brass/copper equipment rack. Every owned weapon and passive has one badge keyed by its inventory ID, using icons based on the approved poster subjects and a live `LV.n` label. Weapons have copper trim and `W`; passives use green trim and `P`; evolved weapons use gold and a star. Evolution replaces its base weapon, rather than consuming an additional badge. Starter weapons are visible immediately. Instant gold/healing rewards do not masquerade as permanent equipment. Both ordinary upgrade choices and repeated Faro prize levels update the same inventory-to-HUD path.

Badges appear at the bottom center in 54-pixel columns, wrapping to additional 60-pixel rows on narrower canvases. Only owned items occupy space. A changed item's rim pulses twice without a camera flash or movement of the arena. The rack listens to resize and releases its listener, children and feedback tweens with the scene lifecycle. Tests cover the full current 6-weapon/5-passive build at 320×360, 390×844, 640×360, 1280×720 and 1920×1080.

The 17 illustrations are native **64×64 PixelLab icons**, newly composed from the approved power-up/evolution poster subjects. Each foreground object has a bold silhouette on an opaque golden-yellow/red sunset background. The icons contain no level labels or descriptions; those stay live in the HUD. They replace the earlier poster crops, while the existing rack and its 36×36 proportional icon render size remain unchanged. `scripts/build-upgrade-emblems.py` now validates/registers approved icons and never overwrites them with crops. Their combined uncompressed RGBA footprint remains about 272 KiB. [Source, prompt and PixelLab job manifest](../art-direction/upgrade-emblems.json) and [offline art proof](../art-direction/upgrade-emblems-preview.png) record their origin and intended scale. This proof is not a gameplay screenshot.

## Difficulty and waves

`DifficultySettings` now defaults to Normal, including unavailable storage. The v3 preference key intentionally resets the previous automatic Hardcore selection once. New explicit selections still persist; active runs, retries, pause-menu changes and stage progression continue passing the chosen mode. Easy/Normal/Hardcore HP, boss and incoming-damage differences are unchanged.

[Wave balance table](waves-balance.md) documents the stronger wave-2+ composition, density and spawn rates. A configurable 20-second ramp blends adjacent configurations. Wave 1, 120-second boundaries, captains, final boss, optional activities, entity cap, existing loot values and XP costs remain unchanged. This uses fixed progression rather than silently countering a player's chosen upgrades with adaptive stat inflation.

The deterministic throughput audit still gives enough upgrade headroom: profiles across eight stages reach levels 12–19 under the audit's assumed kill/pickup rates; a stage-1 fast run reaches 19, or 23 with the assumed max badge multiplier. It excludes captain rewards and does not simulate player dodging, actual damage output or hardware FPS. It is a regression/throughput envelope, not a guarantee of fairness or a measured playtest.

## TNT and special attacks

The existing TNT launch path, 650 ms flight (800 ms for Hellfire Keg), shot count, damage multipliers, targeting range and cooldowns are retained. Its sprite now follows the same parabolic pose as its moving ground shadow, with a restrained rotation and fuse sparks. A dotted target boundary shows the precise impact radius during flight. The radius is captured at launch and passed unchanged to impact rendering and gameplay damage.

TNT retains its existing 90-pixel base radius, Hellfire its 150-pixel base radius, multiplied by the current area factor. The impact iterates a snapshot of live enemies once; a geometric test applies damage only inside/on that circle. The visual effect never enlarges that hit region. Repeated completion callbacks cannot detonate twice, and death, stage victory or a replacement run cancels pending damage. Existing critical-hit handling remains with the combat damage system.

`WeaponEffects` owns the visual side only: expanding rings stop at the true radius, short-lived square sparks, localized warm light and purple/brown smoke fade out. It never applies explosion damage. Two lazily created graphics layers are reused for all throw markers/explosions; each list is limited to 16 active visual records. Evicting a visual never cancels its gameplay hit. Ordinary bullets keep their tiered trails, rifles their long gold/blue streaks, shotgun pellets their warm short streaks, whips their leather/gold lash and molotovs their existing animated ground fire. Hellfire keeps its persistent fire damage, capped using the existing 64-zone budget and disposing the oldest graphic when full.

Removed automatic camera shake from TNT, Hellfire and explosive Desperado residue, and replaced the large evolution-screen flash with the badge pulse. No player weapon or upgrade now shakes/flashes the camera when firing. The pre-existing main-boss arrival shake and cinematic menu effects are outside the upgrade/attack change.

## Main files and checks

- `src/ui/hud/UpgradeRack.ts`, `CombatHUD.ts`, `src/data/upgradeHud.ts`: badges, categories, inventory synchronization, wrapping and feedback.
- `src/scenes/GameScene.ts`, `src/systems/WeaponEffects.ts`, `src/data/weaponPresentation.ts`: throw trajectory/markers, single impact damage, local bounded visuals and evolution feedback.
- `src/data/waves.ts`, `src/systems/GameDirector.ts`: configurable pressure and composition ramp.
- `src/data/difficulty.ts`, `src/scenes/DifficultyScene.ts`, `PauseScene.ts`, `GameOverScene.ts`: default/migration and consistent UI/fallbacks.
- `src/assets/catalog.json`, `public/assets/hud/upgrades/`, validation script and art manifests: native 64px illustrations based on the existing posters.

Automated coverage includes badge deduplication/rank updates/replacement/disposal, all 17 registered illustrations, every weapon at every rank with no firing shake, five TNT ranks and delayed impact, exact radius boundary and outside exclusion, death/victory/stale-run cancellation, evolved-fire cap, bounded visual allocation/expiry, all stage wave schedules, gradual pressure and preset persistence. Run `npm test`, `npx tsc --noEmit`, `npm run assets:check`, `npm run build` and `npm run balance:audit`. No manual browser gameplay or screenshots were used.
