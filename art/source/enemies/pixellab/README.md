# Frontier enemy family — PixelLab production brief

The PixelLab MCP is not connected in this Codex session. These briefs are the exact
production record for the files that replace the temporary four-direction fallback
aliases in `src/systems/PixellabCombat.ts`.

All five assets use: low top-down view, 96 px source canvas, four cardinal directions
(`south`, `east`, `north`, `west`), and a four-frame `walking-4-frames` cycle. Keep
the feet on one baseline in every frame and direction. Use a charcoal `#120B08`
outline, warm upper-left sunset light, purple mountain shadows `#572449`, transparent
background, and no ground shadow. At the game's current 64/source-width scale, the
visible humanoid height must be about 62–68 world pixels. Do not mirror east to make
west; generate both views.

## Coin Sneak — `thief`

> Isolated agile western coin thief, worn mustard vest, charcoal neckerchief masking the lower face, battered tan bowler hat, burgundy sash and small leather money sack bouncing at one hip. Late-1990s Neo Geo 32-bit Western Pulp '98 pixel art, crisp charcoal outline, warm sunset light from upper left, plum shadows. Low top-down view. Transparent background. Complete full body, small but readable at 64 game pixels. Four real cardinal directions, four aligned walking frames per direction; fast sneaking gait, sack and coat tails sway. No text, scenery, ground, border or extra figure.

## Dust Drifter — `drifter`

> Isolated lean western drifter, ash-gray wide brim hat, dusty teal duster coat, red neckerchief, weathered boots, one lowered Colt revolver and brass belt buckle. Late-1990s Neo Geo 32-bit Western Pulp '98 pixel art. Low top-down view, transparent background. Four real cardinal directions, four aligned walking frames per direction; deliberate confident gait, coat hem moves. Charcoal outline, upper-left gold light, purple shadows. No text, scenery, ground, border or extra figure.

## Plains Archer — `bow_scout`

> Respectful isolated Indigenous Plains archer scout: dark braided hair, earth-tone buckskin jacket, blue-and-ochre beadwork trim, practical leather quiver and a simple wooden bow held low. No ceremonial headdress, no caricature. Late-1990s Neo Geo 32-bit Western Pulp '98 pixel art, low top-down view, transparent background. Four real cardinal directions, four aligned walking frames per direction; quiver and braid move subtly. Charcoal outline, warm upper-left light, purple shadows. No text, scenery, ground, border or extra figure.

## Silver Spur — `outlaw_woman`

> Isolated female western outlaw inspired only by the supplied wardrobe: wide brown hat, single dark braid, muted striped prairie shirt, dark high-waist riding trousers, dusty purple neckerchief, rifle held safely lowered. She is a distinct original game character, not a likeness of a real person. Late-1990s Neo Geo 32-bit Western Pulp '98 pixel art, low top-down view, transparent background. Four real cardinal directions, four aligned walking frames per direction; braid, shirt and rifle shift naturally. Charcoal outline, warm upper-left sunset light, purple shadows. No text, scenery, ground, border or extra figure.

## Crow Rush — `crow_rush`

> Isolated flock of 28 black desert crows in flight, each bird a compact readable silhouette with spread wings and subtle violet highlight. Western Pulp '98 arcade pixel art, transparent background, no ground or scenery. Create four directional crossing clips: south, east, north and west; each has four looping wing-flap frames. The flock travels as a cohesive diagonal band with varied wing phases, never a single giant bird. No text, border or extra creatures.

After delivery, export PNG frames to:

`public/assets/enemies/pixellab/<id>/Idle/animations/walking-4-frames/<direction>/frame_000.png` through `frame_003.png`.

Measure visible alpha bounds, append them to `src/assets/enemyFrameBounds.json`, add the matching sequence to `src/assets/catalog.json`, replace the fallback aliases, then run `.agents/skills/western-pulp-arcade/scripts/compare_scale.py` before merging.
