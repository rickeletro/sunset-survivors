# Complete level-up evolution posters

The five evolved weapon IDs had no corresponding card image in the runtime catalog. The LevelUpScene fallback also omitted the live description plate because that plate was inside the texture-present branch. All twelve weapons (including evolutions) and five passives now have registered artwork and descriptions at every level.

New independent poster artwork: Desperado Fury, Doom Blunderbuss, Golden Marshal, Hellfire Keg and Cyclone Whip. The approved Dual Revolvers and Sawed-Off Shotgun posters guided the parchment, woodcut/halftone, charcoal contours, brass rivets, red sunset and typography. Existing images are preserved. Imagegen was used because PixelLab generation tools were unavailable in this session. Exact production prompts, source file paths and unchanged-file hashes are in evolution-posters-sources.json.

Each new source is 1024 × 1536, rendered proportionally at 300 × 450 within the existing 300 × 470 card slot. Upper-left light and the continuous parchment background match the menu context. Bottom parchment is reserved for native level and description objects. No collision, combat, upgrade eligibility, damage, level cap or economy values changed.

The level and description plate now renders whether or not the texture is available. Artwork scales uniformly instead of stretching to fill the card slot. The remaining Cyclone Whip weapon description was translated into English.

Offline comparison at 1:1 logical menu scale: evolution-posters-preview.png. This is an asset/layout composition, not a gameplay screenshot. It compares the approved revolver poster with all five new posters and simulates the live 276 × 126 attribute plate. Native runtime fonts may wrap slightly differently. Measurements and description fit checks are in evolution-posters-layout.json.

Regression tests require a catalog key for every weapon/passive, nonempty per-level and evolution descriptions, and description/level rendering both with loaded images and with the fallback. The existing asset registry test verifies all registered files exist. Final validation: 394 tests pass, TypeScript passes, production build passes, and asset audit reports 887 runtime images with no missing or unused images.
