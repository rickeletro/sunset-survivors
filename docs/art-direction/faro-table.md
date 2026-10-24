# Lucky Star Faro table

The live scene consists of independent felt, rail, playing cards, chip containers, dealer portrait, reward poster, labels and controls. It uses the existing centered 1536 × 1024 menu root. The table is on the left; a standalone reward poster fits a 360 × 552 logical-pixel area on the right, without an enclosing wood panel. The existing poster is scaled uniformly, with its printed level covered by a live name/level/description plate.

Cards use ivory faces, mirrored rank corners and native geometry for spades, hearts, diamonds and clubs; suits do not depend on Unicode font availability. Numbered cards carry their proper pip count. Court cards have crowned rank monograms. Dealing moves two separate backs from the dealer, then flips each face with a short horizontal scale tween. No blur, lighting shader or full-screen generated UI is required.

Drag $2 coins or $10/$20 chips onto a rank. Repeated drops on the same rank stack the bet; a drop on another rank moves to that rank. Invalid stacks return to the tray and never debit money. Clicking ranks and cycling denominations with F offers a keyboard alternative. Enter confirms the wager. C toggles copper. Backspace clears the pending stack or withdraws an unresolved wager between turns. Escape settles and leaves. Input is locked during card reveals.

## Bounty and rewards

- Chips exchange 1:1 for the run’s collected bounty. There is no separate wallet or free stake.
- Minimum bet: $2. Even stakes keep split payments in integer game currency.
- Per-bet cap: 20% of entry bounty rounded down to an even amount, with a $2 minimum and $50 ceiling.
- Per-visit net loss allowance: 40% of entry bounty rounded down to an even amount, with a $2 minimum, capped by the entry bounty. The remaining allowance also caps subsequent wagers.
- At most three wager placements per visit. An unchanged bet continues through unmatched pairs without another charge.
- A winning stake of $10 or more qualifies for the displayed weapon/passive upgraded by five levels, capped at its existing maximum, at most once per saloon door. Ordinary wins still pay bounty. This game reward condition and visit limits are arcade additions, not historical Faro rules.
- The existing game scene applies the final bounty delta and upgrade once on returning outdoors. Exiting refunds unresolved stakes. Faro doors remain available until their own prize is won; courtesy healing is awarded only once per door. A player with less than $2 cannot consume the Faro doorway visit.

## Rules reference and automated verification

[Wizard of Odds: Faro](https://wizardofodds.com/games/faro/) and [Pagat: Faro](https://www.pagat.com/banking/faro.html): a shuffled 52-card shoe exposes the soda before betting. The first card loses, the second wins; copper reverses that result. A matching pair takes half the stake. Neither matching rank keeps the wager alive. Winning flat bets pay 1:1 profit. The last unpaired card does not settle a wager. This implementation offers flat/copper rank bets; advanced side bets and calling the final three cards are omitted.

Tests enumerate every ordered pair of distinct cards from a complete shoe: 192 wins, 192 losses, 12 splits and 2,256 unmatched pairs for a fixed rank. Additional tests cover real bounty settlement, caps, refunds, copper, prize qualification, drag stacking, reveal locks and recorded audio lifecycle. Automated checks do not replace target-device performance profiling.

## Dealer asset provenance and scale

Tool: built-in imagegen, transparent background. PixelLab generation tools were unavailable in this session. Final source is preserved unchanged at `public/assets/characters/dealer/faro-dealer.png`, catalog key `faro_dealer`.

Production brief: isolated waist-up adult American Old West male Faro dealer, late Neo Geo arcade pixel art in Western Pulp ’98; charismatic dark moustache, white rolled sleeves, red waistcoat, dark bow tie, pocket-watch chain and a deck held in his hands. Warm light from upper left, charcoal outlines, parchment/gold accents and purple-brown shadows. Transparent background, no surrounding scene, text or frame. Intended use is an independently animated menu portrait, not an actor in the world.

Generated source: 1122 × 1402 RGBA. Alpha >32 visible bounds: (7, 5)–(1122, 1315). Uniform scale 205/1402 gives a 205-pixel canvas height and about 191.5 visible logical pixels. UI portrait proportions are reviewed in menu coordinates, not the hero/building world scale. Recorded voice uses the user-provided `assets/audio/voices/dealer.mp3` on saloon entry. Card selection/movement and shoe shuffle use the supplied `cards.mp3` and `shuffling-deck-of-cards.mp3` through SoundManager; clips respect SFX volume/mute and stop on scene shutdown.

An offline composition was used to inspect spacing and portrait/poster proportions. It is not a runtime screenshot. All displayed TypeScript copy was translated into English; the language regression test excludes comments and asset paths.

## Simplified table and tutorial

There is no footer copy below the action buttons. Tutorial opens a separate parchment modal; Escape closes the rules before it can leave the table. All betting, chip and copper handlers ignore input behind that modal. Brief outcome/error feedback remains on the table rail above the buttons.

The poster uses the LevelUpScene parchment color, inset double outline and live level/attribute plate. Final attributes come from the actual target level definition. Faro never offers money/medicine as a substitute for the weapon/passive prize. For example, level 0 → 5 and level 3 → 5 both respect the existing cap. Applying the prize runs each ordinary upgrade step, preserving existing timers and passive side effects. If no eligible weapon/passive remains, the saloon declines entry without consuming a visit.
