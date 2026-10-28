# Frontier enemy family — PixelLab production record

All five frontier enemy/hazard assets and their 4-directional (`south`, `east`, `north`, `west`), 4-frame (`walking-4-frames`) animations have been generated via the PixelLab MCP and integrated into `src/assets/catalog.json`, `src/assets/enemyFrameBounds.json`, `src/systems/PixellabCombat.ts`, and `src/systems/CrowRush.ts`.

| Asset ID | Role | PixelLab ID | Animation IDs | World Height (`compare_scale.py`) | Ratio vs Steve (`68.5px`) |
|---|---|---|---|---|---|
| `thief` | Coin Sneak | `34611e85-ba6b-4aca-9e0c-e1a5006c375b` | `c32e7c13-de7e-438d-b25e-882740987343` (`east/north/west`), `02718fd9-8a87-4cb9-83aa-7b3dddce6417` (`south`) | `57.6 px` | `0.84x` |
| `drifter` | Dust Drifter | `92da2d11-e62c-4c89-96d1-e4f9bb3f6a0e` | `8f8f57df-0bbf-4c0d-bc7f-fa4abe37f3c5` | `67.2 px` | `0.98x` |
| `bow_scout` | Plains Archer | `5fa39d9e-edcb-445d-aaa5-22c2236dd1b0` | `f3ff9a39-ead3-4d60-8d80-b3e6cbf4b591` | `63.3 px` | `0.92x` |
| `outlaw_woman` | Silver Spur | `3068fb48-72a1-4817-bd3a-cf62267d200c` | `3fc85b49-bb39-4216-8c3a-bbceedb52b65` (`east/north/west`), `e926e704-8864-435b-80da-57731e00ab7c` (`south`) | `59.7 px` | `0.87x` |
| `crow_rush` | Desert Crow Rush | `aea318b2-ed0f-42c4-a906-d232db4003b0` | `b9e4a355-5c9e-4388-ba61-e69de19894a9` | `18.8 px` | `0.27x` |

All five assets use: low top-down view, four real cardinal directions (`south`, `east`, `north`, `west`), and a four-frame `walking-4-frames` cycle exported to `public/assets/enemies/pixellab/<id>/Idle/animations/walking-4-frames/<direction>/frame_000.png` through `frame_003.png`.

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
