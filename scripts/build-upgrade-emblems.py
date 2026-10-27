"""Validate/register approved 64px HUD icons. Never replace generated art with poster crops."""
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
catalog_path = ROOT / 'src/assets/catalog.json'
catalog = json.loads(catalog_path.read_text())
count = 0
for key in list(catalog['images']):
    if not key.startswith('card_'):
        continue
    name = key.removeprefix('card_')
    relative = f'assets/hud/upgrades/{name}.png'
    icon = Image.open(ROOT / 'public' / relative).convert('RGBA')
    if icon.size != (64, 64):
        raise ValueError(f'{name}: expected native 64x64, got {icon.size}')
    if icon.getextrema()[3] != (255, 255):
        raise ValueError(f'{name}: the red/yellow background must stay opaque')
    catalog['images'][f'hud_upgrade_{name}'] = relative
    count += 1
catalog_path.write_text(json.dumps(catalog, indent=2) + '\n')
print(f'Validated {count} opaque 64x64 upgrade icons; approved art preserved.')
if '--preview' in sys.argv:
    font = ImageFont.truetype(str(ROOT / 'public/assets/fonts/pressstart2p/PressStart2P-Regular.ttf'), 8)
    preview = Image.new('RGB', (660, 540), '#120B08')
    draw = ImageDraw.Draw(preview)
    draw.text((12, 12), 'PIXELLAB 64x64 / HUD 36x36 - OFFLINE ART PROOF', font=font, fill='#F2D49A')
    names = [key.removeprefix('card_') for key in catalog['images'] if key.startswith('card_')]
    for i, name in enumerate(names):
        x, y = 12 + (i % 5) * 130, 42 + (i // 5) * 122
        icon = Image.open(ROOT / 'public/assets/hud/upgrades' / f'{name}.png').convert('RGBA')
        draw.text((x, y), '64x64', font=font, fill='#FFC52A')
        preview.paste(icon, (x, y + 16), icon)
        draw.text((x + 77, y + 23), 'HUD', font=font, fill='#C49A55')
        small = icon.resize((36, 36), Image.Resampling.NEAREST)
        preview.paste(small, (x + 77, y + 40), small)
        draw.text((x, y + 88), name[:14], font=font, fill='#F2D49A')
    preview.save(ROOT / 'docs/art-direction/upgrade-emblems-preview.png')
