# Five-wave frontier survival

Every stage now has a maximum of **600 active seconds**, split into five exact **120-second waves**. This replaces the seven-minute director. The HUD shows wave number, English wave title and time left in the current wave. The main stage boss arrives at **9:00**, with the ordinary horde still spawning. Killing the main boss immediately wins and grants the existing full stage-clear bonus; both Smith brothers are still required. If the main boss survives to **10:00**, the run ends in defeat. Thus ten minutes is the deadline, while boss victory can end the run earlier, as requested.

## Balance table

Rates below are settled stage-1 admissions per second, reached after a 20-second transition ramp, when the arena has room, excluding optional objective guards/street encounters and the five captains. Later stages multiply the rate by `1 + 0.06 × (stage − 1)`; stage 8 is ×1.42. Difficulty presets keep their existing HP/incoming-damage factors. Wave HP is applied to each enemy's base HP, replacing the old continuous HP growth rather than compounding it. Damage multipliers also apply to ordinary rifle shots and dynamite. HP/damage/speed remain fixed for an enemy after it spawns.

| Wave / name | Active time | Horde types introduced / mixture | Enemies/s | HP × | Damage × | Movement × | Mini-boss and behavior |
|---|---|---|---:|---:|---:|---:|---|
| 1 — Dust on the Trail | 0:00–2:00 | Basic gunmen and knife bandits; slow opening | 2.0 | 1.00 | 1.00 | 0.78 | **1:45 — Iron Fist Cole:** 750 base HP, heavy close-range strike with 700 ms warning. Killing him during preparation cancels the strike. |
| 2 — Running with Coyotes | 2:00–4:00 | Add coyotes/snakes to force movement | 3.3 | 1.30 | 1.12 | 0.94 | **3:45 — Quickdraw Quinn:** 1,500 base HP, fast pursuit and a straight aimed shot after a 650 ms warning; aim locks before firing. |
| 3 — Powder and Lead | 4:00–6:00 | Add rifle guards and dynamiters, with earlier melee/fast types | 4.8 | 1.70 | 1.30 | 1.04 | **5:45 — Powder Jack:** 2,700 base HP, two ground traps with 1,000 ms warning; traps remain dangerous for 2,200 ms. |
| 4 — No Safe Ground | 6:00–8:00 | Heavy mixed horde, including armored heavy infantry | 6.4 | 2.20 | 1.52 | 1.14 | **7:45 — Marshal Flint:** 4,200 base HP, frontal shield absorbs 75% of ordinary bullet damage. Flank, pierce, use AoE, or attack during his 850 ms bash preparation. |
| 5 — The Last Showdown | 8:00–10:00 | Elite infantry, heavy units, rifle guards, explosives and fast attackers | 8.2 | 2.85 | 1.80 | 1.23 | **9:45 — Black Spur:** 6,000 base HP, three-shot volley after 500 ms warning; faster cooldown below 40% HP. The main stage boss has already arrived at 9:00. |

Wave 1 remains unchanged. Wave 2 settles at **+65% spawn rate** and **+30% HP** relative to wave 1. Compared with the previous five-wave configuration, wave-2+ admissions rise by about 21–27%, while HP rises only about 8–10%. Fast enemies comprise 45% of the settled wave-2 pool; rifle guards, dynamiters, heavy units and elites comprise 80% in wave 5, before stage affinity. Wave 5 uses fewer elite HP sponges than before (12% versus 15%) and more ranged pressure. Rate, target density, speed, damage, HP and composition blend from the preceding wave over **20 active seconds**, preventing an instant boundary spike. These values and the ramp duration live in `src/data/waves.ts`. Captains scale their HP by `1 + 0.12 × (stage − 1)` and the selected difficulty HP factor, with no additional wave HP multiplier. The general request specified a captain in the final 15 seconds of every wave, so wave 5 also receives Black Spur at 9:45 if the main boss has not already been defeated. Captains are optional for victory; only the existing main boss/member victory condition clears the stage.

At **7:00**, the stage's signature environmental event triggers once: the canyon stampede, railroad express pass, or the other stage-specific telegraphed hazard. Ordinary environmental hazards begin with wave 3. Supply-camp guards and scripted street ambushes respect the opening roster, so a wave-1 objective does not suddenly introduce rifle guards or fast animals.

## Transitions, clocks and performance

The transition uses **persistence with a hard cap**, rather than a mass execution or free XP conversion. Existing enemies continue with their original HP, damage and speed, remain killable, and recycle through the existing spawn-ring navigation when far away. No loot, free healing, duplicate XP or new entities are granted merely because the timer crossed a wave boundary.

The global cap remains **240**, using the existing sprite pool and spatial hash. Normal admissions stop at **233 total entities**, reserving room for five persistent captains and both Smith brothers. Captains use reserved slots; the main boss is never excluded by a full ordinary horde. The normal horde's density targets are 55/100/145/195/233, with a small stage-density increase capped at 233. A fractional spawn budget runs on the existing 850 ms admission timer and preserves exact nominal rates over time. A full arena discards spawn debt instead of releasing a later avalanche. Banners replace the previous transient banner rather than stacking unreadably.

The existing active-game clock governs boundaries; pause, upgrade selection, onboarding and building interiors do not advance wave events. Captains announce once and missed, already-expired captain windows are never backfilled as a burst. Advancing to the next stage resets the five-wave timeline. Enemy projectiles, traps and other finite effects retain their existing disposal/cap paths. No per-enemy Phaser colliders or extra rendering cameras were added.

## Mini-boss art and rewards

PixelLab MCP was not available in this session. The implementation reuses approved animated PixelLab knife-bandit, rifle-guard and dynamiter characters, with native colored markings, HP bars, aiming warnings and a separate shield arc. Source PNGs and animation pivots remain unchanged. These are differentiated captains made from existing sprites, not five newly generated PixelLab characters.

Uniform scale is computed from visible alpha/frame bounds against the selected hero: Steve 68.5 px, Billy 74.5 px, Bob 75 px and Cormano 73 px. The reference comparison shows all five captains at 1.00× Steve and the existing house at 2.98×. Ground markings use the animation's existing foot pivot offset. See [scale preview](../art-direction/mini-boss-scale.png), [measurements](../art-direction/mini-boss-scale.json) and its reproducible manifest. This is an offline art composition, not a gameplay screenshot.

Captains drop one badge pickup through the existing loot pipeline: XP 120/180/240/300/360 and bounty $25/$35/$45/$55/$65. Duplicate death callbacks cannot duplicate loot or trigger stage victory. Weapons, upgrade costs, XP multipliers, Faro, hospitality, target practice, main-boss HP/attack profiles and victory bonuses retain their existing rules.

## Verification and balance limits

Tests exercise all eight stages, every exact boundary, duplicate ticks, pause guards, all five captain times, the main boss/deadline, reserved capacity with both Smith brothers, windup/aim lock, ground traps, shield direction/piercing/openings, visible scale and captain loot. The ten-minute throughput audit uses the new director and objective roster. Its fast stage-1 envelope is level 19 without a badge boost and level 23 with an assumed max badge multiplier; it excludes captain loot and assumes kill/collection throughput, so it is not proof of combat difficulty or a guaranteed player level. Historical level-27/36 report reconstruction uses a separately frozen seven-minute director to preserve those earlier regressions.

No manual browser gameplay or gameplay screenshots were used. TypeScript, the complete test suite, asset audit and production build are required checks. No target-device FPS or AAA art-generation claim is made.

The new default is **Normal**, with a one-time v3 preference migration from the former automatic Hardcore default. Subsequent explicit difficulty choices remain saved, and all three preset stat factors are unchanged. See [HUD and localized combat effects](hud-combat-upgrades.md) for the accompanying equipment display and TNT changes.
