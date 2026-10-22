"""Measure visible sprite proportions and compose a 1:1 offline comparison. Requires Pillow."""
import argparse
import json
import math
import tempfile
from pathlib import Path
from PIL import Image, ImageDraw


def measure(root, spec, threshold=16):
    scale = float(spec.get('scale', 1))
    if not math.isfinite(scale) or scale <= 0:
        raise ValueError('Scale must be finite and positive: ' + spec['name'])
    with Image.open(root / spec['path']) as source:
        image = source.convert('RGBA')
    box = image.getchannel('A').point(lambda alpha: 255 if alpha >= threshold else 0).getbbox()
    if box is None:
        raise ValueError('No visible pixels: ' + spec['name'])
    visible = image.crop(box)
    world = [(box[2] - box[0]) * scale, (box[3] - box[1]) * scale]
    rendered = visible.resize(tuple(max(1, round(n)) for n in world), Image.Resampling.NEAREST)
    data = {'name': spec['name'], 'path': spec['path'], 'scale': scale,
            'canvas': list(image.size), 'visible_bbox': list(box), 'visible_world': world}
    return data, rendered


def compare(root, manifest, output):
    threshold = int(manifest.get('alpha_threshold', 16))
    if not 1 <= threshold <= 255:
        raise ValueError('alpha_threshold must be between 1 and 255')
    specs = [manifest['hero']] + manifest['assets']
    measured = [measure(root, spec, threshold) for spec in specs]
    hero_height = measured[0][0]['visible_world'][1]
    issues = []
    for spec, (data, _) in zip(specs, measured):
        ratio = data['visible_world'][1] / hero_height
        data['height_ratio_to_hero'] = round(ratio, 4)
        low, high = spec.get('min_ratio', 0), spec.get('max_ratio', float('inf'))
        if low < 0 or high < low:
            raise ValueError('Invalid ratio range: ' + spec['name'])
        data['within_declared_range'] = low <= ratio <= high
        if not data['within_declared_range']:
            issues.append(f"{data['name']}: {ratio:.2f}x hero, expected {low}–{high}")
    slots = [max(190, im.width + 36) for _, im in measured]
    ground = max(im.height for _, im in measured) + 60
    canvas = Image.new('RGB', (sum(slots), ground + 100), '#321b10')
    draw = ImageDraw.Draw(canvas)
    draw.text((16, 14), 'WORLD SCALE 1:1 | offline asset composition', fill='#ffc52a')
    draw.line((0, ground, canvas.width, ground), fill='#c49a55', width=1)
    x = 0
    for slot, (data, im) in zip(slots, measured):
        canvas.paste(im, (x + (slot - im.width) // 2, ground - im.height), im)
        draw.text((x + 10, ground + 12), data['name'], fill='#ffc52a')
        draw.text((x + 10, ground + 30), f"visible: {data['visible_world'][1]:.1f}px high", fill='#f2d49a')
        draw.text((x + 10, ground + 48), f"{data['height_ratio_to_hero']:.2f}x hero", fill='#f2d49a')
        x += slot
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(str(output) + '.png')
    report = {'alpha_threshold': threshold, 'items': [d for d, _ in measured], 'issues': issues}
    Path(str(output) + '.json').write_text(json.dumps(report, indent=2) + '\n')
    return report


def self_test():
    with tempfile.TemporaryDirectory() as directory:
        root = Path(directory)
        image = Image.new('RGBA', (100, 100))
        ImageDraw.Draw(image).rectangle((30, 20, 49, 59), fill='white')
        image.putpixel((0, 0), (255, 255, 255, 1))  # invisible padding must not count
        image.save(root / 'sprite.png')
        spec = {'name': 'hero', 'path': 'sprite.png', 'scale': 0.5}
        measured, _ = measure(root, spec)
        assert measured['visible_world'] == [10, 20]
        manifest = {'hero': spec, 'assets': [{**spec, 'name': 'too-small', 'min_ratio': 2}]}
        assert len(compare(root, manifest, root / 'comparison')['issues']) == 1
        Image.new('RGBA', (20, 20)).save(root / 'empty.png')
        try:
            measure(root, {**spec, 'path': 'empty.png'})
        except ValueError:
            pass
        else:
            raise AssertionError('Transparent canvas accepted')
        for bad_scale in [0, -1, float('nan'), float('inf')]:
            try:
                measure(root, {**spec, 'scale': bad_scale})
            except ValueError:
                pass
            else:
                raise AssertionError('Invalid scale accepted')
    print('Self-test passed: visible bounds, faint alpha, ratio failures, empty sprites and invalid scales.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path.cwd())
    parser.add_argument('--manifest', type=Path)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--self-test', action='store_true')
    args = parser.parse_args()
    if args.self_test:
        self_test()
    elif not args.manifest or not args.output:
        parser.error('--manifest and --output are required')
    else:
        report = compare(args.root, json.loads(args.manifest.read_text()), args.output)
        for item in report['items']:
            print(f"{item['name']}: {item['visible_world'][1]:.1f}px, {item['height_ratio_to_hero']:.2f}x hero")
        for issue in report['issues']:
            print('FAIL:', issue)
        raise SystemExit(1 if report['issues'] else 0)
