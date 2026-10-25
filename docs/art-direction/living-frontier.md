# Living Frontier — Western Pulp '98

## Implemented

- Keep the existing world coordinates and y-sorted 2.5D cutouts. Preserve footprints and combat rules.
- Uniform house scale 1.45: Steve's visible height is 68.5 world pixels; house 204.45 (2.98×); street lamp 68.5 (1×). Source resolution, alpha bounds, rendered size and collision are separate quantities. See `frontier-scale.png`: offline asset composition, not gameplay.
- Streamed shadows follow the alpha-derived foundation/sole contour, including diagonal bases and transparent PNG margins. A tight contact strip anchors each object; a ground-plane extrusion projects away from a fixed upper-left sunset (25-degree elevation, compressed ground Y). Indoors retain contact only. One bulk alpha read per source frame is cached; moving actors only reposition an existing graphic. Existing facade transparency and amber lanterns remain.
- Dust and wind profiles for all eight themes; warm embers in burning town, quieter indoor motes. Explicit emit zones preserve viewport offsets under Phaser follow; preseed 16 outdoor / 4 indoor motes. One emitter capped at 36 outdoor / 12 indoor particles; up to three rolling sagebrush cutouts outside. No blur shader or dynamic shadow map.
- Existing canyon sagebrush sways by at most 0.035 radians. Reuse the imported sagebrush as rolling dry brush, not a new photorealistic asset.
- Golden elliptical activity ring sits on the ground before the door. It pulses, brightens in entry range, and disappears when blocked or visited. Keyboard E and explicit facade click/touch remain supported.
- A persistent compass lists the nearest available saloon/Faro and hospitality house with direction/distance or E to enter. Railroad settlements contain both services. Hospitality houses and ordinary saloons support one visit per attempt, independently. Railroad Faro saloons allow repeat visits while the player can afford a bet and that doorway’s prize has not been won; their healing courtesy remains once per doorway. Hospitality restores 12% maximum HP and grants 20 raw XP. Ordinary saloons retain 20% HP and $15. Railroad saloons now host playable arcade Faro: rank selection A–K, normal/inverted wagers, $2/$10/$20 chips exchanged 1:1 for collected bounty, no free chips and at most three bets per visit. A persistent shuffled 52-card deck is revealed in pairs; no-match keeps the wager active without another charge, matching pairs lose half, wins pay twice the stake including the returned stake. The first winning stake of at least $10 grants the announced eligible weapon/passive upgrade, applied by the existing upgrade system on return to the street. Losses also settle on exit; unresolved wagers are refunded. Complimentary 20% healing remains; the old fixed $35/40 XP grant is replaced by the game.
- Entry/exit camera breath reaches +10% while combat is paused, synchronized across the world and transition layers. Restore original zoom on completion/cancellation.
- Three flocks of three chickens on outdoor stages. Bullet segments cook them without changing bullet damage/piercing/targeting. Food restores up to 12 HP within 30 pixels and stays on the ground at full HP. Consumed birds never respawn during that attempt. Distant sprites are destroyed, state retained.

## Art provenance and remaining production work

Existing house, hero, lamp, foliage and dancers come from the repository catalog. The authenticated PixelLab MCP was queried for the original object `galinha_caipira`, ID `275838e2-0b5d-4d9a-aa23-81e5ac46b7dc`. Imported 72 unchanged 32×32 PNGs: walk animation, eight real directions, nine frames each. Source: PixelLab CDN object URLs returned by get_object; no regeneration. Files live under public/assets/wildlife/pixellab/chicken/walk and the sequence is registered as wildlife:chicken-walk. Render scale 1 gives 29 visible world pixels (0.42× Steve). The roast icon remains a procedural gameplay pickup, independent of the original chicken art.

Hospitality currently reuses the saloon interior/dancer illustration. A dedicated hostess character, an actual arm-in-arm exit animation, distinct house interiors, are not implemented. Faro uses the core banker/player/split rules in an arcade adaptation; it omits advanced historical wagers and the final-three-card betting round. Isometric conversion and distance blur were deliberately deferred: they need compatible art/navigation and would reduce combat readability. No performance numbers are claimed without profiling on target hardware.

## Reference

Sunset Riders' saloon rewards provide an arcade precedent for brief optional building visits: https://www.arcade-history.com/?id=2694&n=sunset-riders-model-gx064&page=detail . The new mechanics here are adaptations, not claims of reproducing its original rules.

## Verification

Use `npm test`, `npx tsc --noEmit`, `npm run build`, `npm run assets:check`. No browser gameplay or screenshots are used to validate mechanics. Run the scale tool with `docs/art-direction/frontier-scale.json` to reproduce the offline scale sheet.

## Facade frame regression

Phaser Texture.add changes firstFrame when door-leaf cutouts are added. World scenery, portal highlights and transition facade copies explicitly request __BASE; extraction also restores firstFrame to __BASE. This prevents a later stage or streamed building from rendering a 14×34 door leaf instead of the 256×256 saloon. Native visible saloon height is 228 world pixels (3.33× Steve), compared with 204.45 for the house (2.98×). No art stretching or collider changes.

Faro rules reference: https://www.pagat.com/banking/faro.html .
