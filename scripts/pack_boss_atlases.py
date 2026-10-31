#!/usr/bin/env python3
import os
import zlib
import struct
import json
import shutil

BOSS_DIRECTIONS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west']

BOSS_SLUGS = [
    'hawkeye-hank-hatfield',
    'dark-horse',
    'smith-brother-red',
    'smith-brother-gray',
    'el-greco',
    'chief-wigwam',
    'paco-loco',
    'sir-richard-rose'
]

def read_png_rgba(filename):
    with open(filename, 'rb') as f:
        data = f.read()
    assert data[:8] == b'\x89PNG\r\n\x1a\n'
    w, h = struct.unpack('>II', data[16:24])
    pos = 8
    idat = bytearray()
    while pos < len(data):
        length, chunk_type = struct.unpack('>II', data[pos:pos+8])
        pos += 8
        if chunk_type == int.from_bytes(b'IDAT', 'big'):
            idat.extend(data[pos:pos+length])
        pos += length + 4
    decompressed = zlib.decompress(idat)
    bpp = 4
    stride = 1 + w * bpp
    prev_row = bytearray(w * bpp)
    rgba = bytearray(w * h * bpp)
    for y in range(h):
        filter_type = decompressed[y * stride]
        row = bytearray(decompressed[y * stride + 1 : (y + 1) * stride])
        if filter_type == 1:
            for x in range(1, w):
                for i in range(bpp):
                    row[x*bpp + i] = (row[x*bpp + i] + row[(x-1)*bpp + i]) & 0xFF
        elif filter_type == 2:
            for x in range(w):
                for i in range(bpp):
                    row[x*bpp + i] = (row[x*bpp + i] + prev_row[x*bpp + i]) & 0xFF
        elif filter_type == 3:
            for x in range(w):
                for i in range(bpp):
                    left = row[(x-1)*bpp + i] if x > 0 else 0
                    up = prev_row[x*bpp + i]
                    row[x*bpp + i] = (row[x*bpp + i] + (left + up) // 2) & 0xFF
        elif filter_type == 4:
            for x in range(w):
                for i in range(bpp):
                    a = row[(x-1)*bpp + i] if x > 0 else 0
                    b = prev_row[x*bpp + i]
                    c = prev_row[(x-1)*bpp + i] if x > 0 else 0
                    p = a + b - c
                    pa = abs(p - a)
                    pb = abs(p - b)
                    pc = abs(p - c)
                    pr = a if pa <= pb and pa <= pc else (b if pb <= pc else c)
                    row[x*bpp + i] = (row[x*bpp + i] + pr) & 0xFF
        prev_row = row
        rgba[y * (w * 4) : (y + 1) * (w * 4)] = row
    return w, h, rgba

def write_png(filename, width, height, rgba_data):
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr)
    raw = bytearray()
    r_bytes = width * 4
    for y in range(height):
        raw.append(0)
        raw.extend(rgba_data[y * r_bytes : (y + 1) * r_bytes])
    idat = zlib.compress(bytes(raw), 6)
    idat_crc = zlib.crc32(b'IDAT' + idat)
    iend_crc = zlib.crc32(b'IEND')
    with open(filename, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n')
        f.write(struct.pack('>I', len(ihdr)) + b'IHDR' + ihdr + struct.pack('>I', ihdr_crc))
        f.write(struct.pack('>I', len(idat)) + b'IDAT' + idat + struct.pack('>I', idat_crc))
        f.write(struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc))

def pack_bosses():
    root_base = "public/assets/bosses/pixellab"
    for slug in BOSS_SLUGS:
        slug_dir = os.path.join(root_base, slug, "Idle/animations/run-attack-eight-directions")
        # Measure dimensions
        dir_sizes = {}
        for d in BOSS_DIRECTIONS:
            p = os.path.join(slug_dir, d, "frame_000.png")
            with open(p, 'rb') as fp:
                data = fp.read(24)
                w, h = struct.unpack('>II', data[16:24])
                dir_sizes[d] = (w, h)
        
        atlas_w = max(dir_sizes[d][0] * 8 for d in BOSS_DIRECTIONS)
        atlas_h = sum(dir_sizes[d][1] for d in BOSS_DIRECTIONS)
        
        print(f"Packing {slug}: atlas {atlas_w}x{atlas_h}...")
        atlas_rgba = bytearray(atlas_w * atlas_h * 4)
        frames_meta = {}
        
        curr_y = 0
        for d in BOSS_DIRECTIONS:
            w, h = dir_sizes[d]
            for i in range(8):
                frame_path = os.path.join(slug_dir, d, f"frame_{i:03d}.png")
                fw, fh, frgba = read_png_rgba(frame_path)
                assert fw == w and fh == h
                curr_x = i * w
                
                # Blit into atlas_rgba
                for row_idx in range(h):
                    src_start = row_idx * (w * 4)
                    src_end = src_start + (w * 4)
                    dst_start = ((curr_y + row_idx) * atlas_w + curr_x) * 4
                    dst_end = dst_start + (w * 4)
                    atlas_rgba[dst_start:dst_end] = frgba[src_start:src_end]
                
                frame_key = f"{d}_{i}"
                frames_meta[frame_key] = {
                    "frame": {"x": curr_x, "y": curr_y, "w": w, "h": h},
                    "rotated": False,
                    "trimmed": False,
                    "spriteSourceSize": {"x": 0, "y": 0, "w": w, "h": h},
                    "sourceSize": {"w": w, "h": h}
                }
            curr_y += h
            
        atlas_png_path = os.path.join(root_base, slug, "atlas.png")
        atlas_json_path = os.path.join(root_base, slug, "atlas.json")
        
        write_png(atlas_png_path, atlas_w, atlas_h, atlas_rgba)
        
        atlas_json_data = {
            "frames": frames_meta,
            "meta": {
                "app": "SunsetSurvivorsPacker",
                "version": "1.0",
                "image": "atlas.png",
                "format": "RGBA8888",
                "size": {"w": atlas_w, "h": atlas_h},
                "scale": "1"
            }
        }
        with open(atlas_json_path, 'w') as jf:
            json.dump(atlas_json_data, jf, indent=2)
            jf.write("\n")
            
        print(f"Generated {atlas_png_path} and {atlas_json_path}")

if __name__ == "__main__":
    pack_bosses()
