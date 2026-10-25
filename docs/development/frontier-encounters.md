# Frontier encounters and Deadeye Saloon

Every stage has a dedicated target-practice saloon near its settlement hub, with an independent doorway and a stage-specific name. Existing saloons and hospitality buildings remain in place. Railroad Faro retains its five independent doors, repeat-entry/prize rules and settlement path. The gallery uses the existing saloon artwork at its native proportional scale: visible height 228 pixels versus Steve’s 68.5 pixels (3.33×).

## Trigger and camera policy

Street encounters start once per location when the player approaches: ambush radius 310 world pixels; thief radius 370. Both show an 1,800 ms warning. A player moving more than 650 pixels away delays activation. Shutter leaves move independently before guards emerge, while a gold sack marker advertises the thief. No street event changes the camera, freezes movement or takes away control. Boss activity and upgrade selection block new encounters; the existing game update guards freeze them during pause, tutorial and building transitions. Scripted props cannot be activated by tutorial projectiles.

Entering the gallery requires the normal explicit E/click/tap doorway action. The existing enter/interior/exit sequence freezes combat clocks and restores the original camera/zoom. No additional camera pan is introduced. The gallery starts only after START ROUND, and exiting is always voluntary.

## Encounters

At most five compatible settlement anchors are used. Each has one two-guard ambush, one fleeing thief, one suspended cargo and two nearby powder barrels: 25 finite state records maximum. Displays exist only within 1,000 world pixels. The thief uses the existing animated PixelLab knife-bandit actor and normal targeting, damage, enemy cap and loot pipeline; it carries a separately animated cloth sack. It flees along existing scenery navigation at speed 175, carries $35 bounty, and escapes after 11 seconds without awarding kill loot. Boss activation retires the fleeing actor. Killing it preserves ordinary loot collection rather than granting money twice.

Player projectile segments can sever the cargo support or damage a powder barrel. Cargo falls for 520 ms with a quadratic trajectory and rotation before damaging enemies within 95 pixels for 120 damage. Barrels have 40 HP, shake for 240 ms, and damage enemies within 130 pixels for 180 damage. Chain ignition is limited to powder barrels within 145 pixels and starts its timer on the following frame. Enemy damage/kill processing is reused. These environmental attacks do not damage the player. Effects use at most 24 transient debris pieces, with 500 ms tweens; they do not add continuous emitters or shaders. Street props do not change the existing scenery navigation footprint.

The original crate and barrel assets are preserved. Alpha-based scale comparison: cargo visible height 45.6 pixels (1.2 uniform scale), barrel 44 pixels (1.1), Steve 68.5, house 204.45. Bottom alpha padding is compensated in the barrel and cargo landing positions. Compare report: frontier-event-scale.json; preview is an offline scale composition, not a gameplay screenshot.

## Target practice: mechanical boss boards

A free round is offered once per gallery doorway per stage attempt. Each saloon uses eight reusable mechanical bays in two tiers. Every plate uses one of the existing eight boss posters, framed in carved wood and brass. A runtime crop isolates the character art without changing the source PNG. Shared poster textures retain their original default frame so Wanted screens remain intact.

The ready display shows all eight bosses. Starting folds the display down before the first random board rises. Individual boards use a deterministic hinge projection around the shelf pivot: a sine rise with a quadratic fold-down. They stand at their original artwork proportions when fully raised. Foreground shelves, recess shadows, brass hinges, posts and velvet valance are independent layers. Dynamic gold bars show exposure time remaining. A custom crosshair, brief impact ring, four wood fragments and a gold hit flash provide feedback.

The progression alternates longer rounds with faster rounds. Stage 1 has only solo boards. Later stages introduce staggered doubles; every double is followed by a recovery interval and a solo wave. At most two unhit boards are scheduled simultaneously, with no overlapping occupied bays. Later profiles favor alternating between the two shelf tiers. Speed also rises gradually within each round, normalized to its target count.

| Stage | Saloon | Hits | Time limit | Perfect bonus |
|---|---|---:|---:|---:|
| 1 | Dusty Draw | 12 | 40 s | $20 |
| 2 | Iron Horse | 12 | 40 s | $25 |
| 3 | Ember Shot | 16 | 50 s | $30 |
| 4 | Lucky Trigger | 16 | 50 s | $35 |
| 5 | Last Car | 20 | 60 s | $40 |
| 6 | Eagle Eye | 20 | 60 s | $45 |
| 7 | Golden Hacienda | 24 | 70 s | $50 |
| 8 | Midnight Marshal | 24 | 70 s | $55 |

Even stages increase speed and double frequency. Odd stages after the first retain the previous speed profile while increasing the target count. Headers, velvet colors and HUD values reflect the selected stage. The localhost developer stage selector also displays the local saloon name and target count.

One missed shot or one board reaching its deadline ends the round immediately. Future pending boards cannot rise or accept shots after a loss. Pointer hit tests use the actual exposed plate bounds from the same hinge pose used for rendering, including partially raised plates. Each profile has the safety time limit shown above. Input is ignored before starting and after the result. The clock displayed in the HUD freezes on resolution while the plates finish folding.

The existing reward economy is preserved: each successful hit banks $3 bounty and 5 raw XP, even if the round is subsequently lost or the player leaves. Completing every target earns the stage’s perfect bonus: total perfect rewards range from $56 and 60 XP in stage 1 to $127 and 120 XP in stage 8. An unstarted round awards nothing. The model settles once; the world scene applies the reward only after the exit transition, protected by existing phase and stale-callback guards. The update listener is removed on shutdown. Faro and its settlement are unchanged.

Automated tests cover random scheduling, hinge exposure hit bounds, acceleration, concurrent staggered pairs, immediate miss/escape failure, pending-board cancellation, bounded payouts, real Phaser shared-frame preservation, pointer-coordinate mapping, listener disposal, complete boss preloading, existing world encounters and independent Faro. Tests also complete all eight profiles with late valid hits, verify recovery after doubles, validate the stage-specific HUD, and enter/settle every gallery independently of Faro. Final verification: 428 tests pass, TypeScript and production build pass, asset audit reports 887 runtime images with no missing or unused assets. No manual browser gameplay or screenshots were used to validate rules, and no target-device frame-rate claim is made.
