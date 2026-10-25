# Deadeye Showdown — boss-board booth

The game reuses all eight approved boss posters from the runtime catalog, unchanged. No new generated bitmap or external asset is introduced. Each image gets a non-destructive Phaser frame cropping x=5.5%, y=24%, width=89%, height=51% of the source, leaving the boss illustration as the visual target. The default shared texture frame is restored after frame creation.

Art follows Western Pulp ’98: charcoal recesses, layered dark wood, burnt-red velvet, parchment portraits, brass hinges/rivets and gold highlights. It is built in independent layers with eight physical plate pivots and two foreground shelf rails. Boss portraits fit proportionally inside 148 × 126 logical pixels; each complete plaque measures 176 × 192. Portraits keep a uniform source scale. The plate assembly briefly projects vertically during the mechanical hinge animation and stands at full proportions when raised.

The plate's base is the animation pivot. No sliding picture disappears through another row: a retracting plate collapses toward its own foreground hinge. The same lift factor defines the actual shootable bounds. Impact pieces and rings are separate transient graphics. Round timing and exposure are model-driven rather than governed by unrelated tweens, keeping visible and hittable states synchronized.

The preview gallery-boss-plates-preview.png is an offline composition at the logical 1536 × 1024 menu size, not a runtime screenshot. It compares all eight cropped portraits at their final card size and verifies shelving and labels. Native runtime fonts/material nine-slicing can differ from this composition. Per-source crop and scale measurements are in gallery-boss-plates-layout.json. Behavior and tests are documented in ../development/frontier-encounters.md.

Each stage now gives the booth its own saloon name and velvet palette, without duplicating portrait textures or adding emitters. The exterior reuses the approved saloon sprite at uniform scale. The measured exterior comparison is recorded in gallery-saloon-scale.json and gallery-saloon-scale.png (offline alpha-bounds comparison, not a gameplay screenshot).
