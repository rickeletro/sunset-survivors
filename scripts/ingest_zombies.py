#!/usr/bin/env python3
import os
import sys
import json
import urllib.request
import struct
import zlib

TARGETS = {
    "rifle_guard": {
        "folder": "public/assets/enemies/pixellab/rifle_guard/Idle/animations/move-attack",
        "bounds_key": "rifle_guard",
        "foot_offset": 32.0,
        "urls": {
            "south": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/c92acef7-cc8b-4f76-a142-7e6ad31cecb3/animations/be06ad5f-e138-451e-a910-556116c5c3a3/south/{i}.png",
            "north": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/c92acef7-cc8b-4f76-a142-7e6ad31cecb3/animations/d50f0c64-2ab2-4e13-9cbb-2b3f456fe3c5/north/{i}.png",
            "west": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/c92acef7-cc8b-4f76-a142-7e6ad31cecb3/animations/b113ac1b-6291-4416-b7f0-7cc07c3fc423/west/{i}.png",
            "east": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/c92acef7-cc8b-4f76-a142-7e6ad31cecb3/animations/c80d9740-111a-4f3a-b753-8f135fb0c956/east/{i}.png"
        }
    },
    "heavy": {
        "folder": "public/assets/enemies/pixellab/heavy/Idle/animations/walking-4-frames",
        "bounds_key": "heavy",
        "foot_offset": 32.0,
        "urls": {
            "south": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/6f8b5ca2-71aa-48e5-bafa-88aff061b36a/animations/f7bb456f-c614-498d-93e9-0531f3c18d52/south/{i}.png",
            "north": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/6f8b5ca2-71aa-48e5-bafa-88aff061b36a/animations/38589048-e72b-4740-bd54-5b24916a9366/north/{i}.png",
            "west": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/6f8b5ca2-71aa-48e5-bafa-88aff061b36a/animations/8cd41c24-ff44-4ee2-8331-42f8817e0672/west/{i}.png",
            "east": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/6f8b5ca2-71aa-48e5-bafa-88aff061b36a/animations/78ebf8c7-995e-4ab8-b8ce-22384eeecff7/east/{i}.png"
        }
    },
    "knife_scout": {
        "folder": "public/assets/enemies/pixellab/knife_scout/Idle/animations/move-attack",
        "bounds_key": "knife_scout",
        "foot_offset": 32.0,
        "urls": {
            "south": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/cb6f896d-1105-49ff-a7fe-265149466ab2/animations/9302c2e7-d0d9-47ce-8eff-9d11ee557ddd/south/{i}.png",
            "north": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/cb6f896d-1105-49ff-a7fe-265149466ab2/animations/a4cc3a0c-26a0-4007-944f-da8901fbf820/north/{i}.png",
            "west": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/cb6f896d-1105-49ff-a7fe-265149466ab2/animations/27f05958-3364-4611-8c2d-e3c7a3ba8261/west/{i}.png",
            "east": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/cb6f896d-1105-49ff-a7fe-265149466ab2/animations/72650206-49a0-4cb4-8ad9-1c9076fb826e/east/{i}.png"
        }
    },
    "knife_bandit": {
        "folder": "public/assets/enemies/pixellab/knife_bandit/Idle/animations/move-attack",
        "bounds_key": "knife_bandit",
        "foot_offset": 32.0,
        "urls": {
            "south": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/cb6f896d-1105-49ff-a7fe-265149466ab2/animations/9302c2e7-d0d9-47ce-8eff-9d11ee557ddd/south/{i}.png",
            "north": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/cb6f896d-1105-49ff-a7fe-265149466ab2/animations/a4cc3a0c-26a0-4007-944f-da8901fbf820/north/{i}.png",
            "west": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/cb6f896d-1105-49ff-a7fe-265149466ab2/animations/27f05958-3364-4611-8c2d-e3c7a3ba8261/west/{i}.png",
            "east": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/cb6f896d-1105-49ff-a7fe-265149466ab2/animations/72650206-49a0-4cb4-8ad9-1c9076fb826e/east/{i}.png"
        }
    },
    "dynamiter": {
        "folder": "public/assets/enemies/pixellab/dynamite_outlaw/Idle/animations/move-attack",
        "bounds_key": "dynamiter",
        "foot_offset": 33.0,
        "urls": {
            "south": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/f8db63c1-a330-49bb-b396-e00c48001205/animations/54fe1abe-baff-46b7-8c72-9cf0ae03efdb/south/{i}.png",
            "north": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/f8db63c1-a330-49bb-b396-e00c48001205/animations/080d859f-acab-46dc-8c3d-4cbc6392bb09/north/{i}.png",
            "west": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/f8db63c1-a330-49bb-b396-e00c48001205/animations/bb2737fe-c705-4e89-bc96-5fb840581250/west/{i}.png",
            "east": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/f8db63c1-a330-49bb-b396-e00c48001205/animations/61d47e91-60f0-4a99-9b0b-66734aa9bdff/east/{i}.png"
        }
    },
    "outlaw_woman": {
        "folder": "public/assets/enemies/pixellab/outlaw_woman/Idle/animations/walking-4-frames",
        "bounds_key": "outlaw_woman",
        "foot_offset": 32.0,
        "urls": {
            "south": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/0ecfccf5-74bf-48f4-a2be-9aeaf693751a/animations/bbd495b3-d973-4db7-99c0-0a0ee5eaa22a/south/{i}.png",
            "north": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/0ecfccf5-74bf-48f4-a2be-9aeaf693751a/animations/12c34db5-a63d-4b59-9dca-98319b6c8c46/north/{i}.png",
            "west": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/0ecfccf5-74bf-48f4-a2be-9aeaf693751a/animations/04909ef7-69dc-4f20-a96c-873defe3bb8d/west/{i}.png",
            "east": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/0ecfccf5-74bf-48f4-a2be-9aeaf693751a/animations/f100133b-86d3-4953-8393-a41c169c22aa/east/{i}.png"
        }
    },
    "drifter": {
        "folder": "public/assets/enemies/pixellab/drifter/Idle/animations/walking-4-frames",
        "bounds_key": "drifter",
        "foot_offset": 32.0,
        "urls": {
            "south": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/c8141039-a372-4519-af87-61db39d51e8b/animations/be0b20a8-cb35-4596-96f3-a70a05fa1091/south/{i}.png",
            "north": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/c8141039-a372-4519-af87-61db39d51e8b/animations/3c8d8479-c9fc-41ee-a7a5-1a258a2c7d81/north/{i}.png",
            "west": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/c8141039-a372-4519-af87-61db39d51e8b/animations/45b13d5d-dacf-495d-9a0c-a849ba7d57fb/west/{i}.png",
            "east": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/c8141039-a372-4519-af87-61db39d51e8b/animations/78087773-6b42-47b3-83ff-295d487eaa02/east/{i}.png"
        }
    },
    "thief": {
        "folder": "public/assets/enemies/pixellab/thief/Idle/animations/walking-4-frames",
        "bounds_key": "thief",
        "foot_offset": 32.0,
        "urls": {
            "south": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/f5211daf-eb19-4e87-8357-9154dbd6048d/animations/bf614c91-1e34-4608-bb3f-8bc834767b96/south/{i}.png",
            "north": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/f5211daf-eb19-4e87-8357-9154dbd6048d/animations/1dcde85e-21ce-4824-94e7-893915bc6126/north/{i}.png",
            "west": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/f5211daf-eb19-4e87-8357-9154dbd6048d/animations/b4a78ced-226d-477c-be51-0252157e4552/west/{i}.png",
            "east": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/f5211daf-eb19-4e87-8357-9154dbd6048d/animations/269fbc65-0875-4cd2-9150-e72981f299f8/east/{i}.png"
        }
    },
    "bow_scout": {
        "folder": "public/assets/enemies/pixellab/bow_scout/Idle/animations/walking-4-frames",
        "bounds_key": "bow_scout",
        "foot_offset": 32.0,
        "urls": {
            "south": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/f50a91cf-f659-4d48-90f2-fa577f6116e8/animations/2114d925-e6c0-48cf-b384-e509eba67e11/south/{i}.png",
            "north": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/f50a91cf-f659-4d48-90f2-fa577f6116e8/animations/4f0a94c6-6d0c-4a26-b69b-99c7d4aeef54/north/{i}.png",
            "west": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/f50a91cf-f659-4d48-90f2-fa577f6116e8/animations/1587718c-32bc-40dc-87ac-79d03ad9b6e2/west/{i}.png",
            "east": "https://backblaze.pixellab.ai/file/pixellab-characters/52bc453b-aad4-4a96-9d09-02d8fc4e4262/f50a91cf-f659-4d48-90f2-fa577f6116e8/animations/6515ee70-5087-472e-8f16-c4172a75b329/east/{i}.png"
        }
    }
}

def get_png_bbox(filename):
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
    min_x, min_y, max_x, max_y = w, h, -1, -1
    prev_row = bytearray(w * bpp)
    for y in range(h):
        filter_type = decompressed[y * stride]
        row = bytearray(decompressed[y * stride + 1 : (y + 1) * stride])
        for x in range(w):
            if filter_type == 1:
                if x > 0:
                    for i in range(bpp): row[x*bpp + i] = (row[x*bpp + i] + row[(x-1)*bpp + i]) & 0xFF
            elif filter_type == 2:
                for i in range(bpp): row[x*bpp + i] = (row[x*bpp + i] + prev_row[x*bpp + i]) & 0xFF
            elif filter_type == 3:
                for i in range(bpp):
                    left = row[(x-1)*bpp + i] if x > 0 else 0
                    up = prev_row[x*bpp + i]
                    row[x*bpp + i] = (row[x*bpp + i] + (left + up) // 2) & 0xFF
            elif filter_type == 4:
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
            alpha = row[x*bpp + 3]
            if alpha > 0:
                if x < min_x: min_x = x
                if x > max_x: max_x = x
                if y < min_y: min_y = y
                if y > max_y: max_y = y
    return w, h, [min_x, min_y, max_x + 1, max_y + 1]

def download_and_ingest():
    bounds_path = "src/assets/enemyFrameBounds.json"
    with open(bounds_path, "r") as f:
        bounds_data = json.load(f)

    # We map 8-frame scary-walk [0, 1, 2, 3, 4, 5, 6, 7] to 4 canonical game frames: [0, 2, 4, 6]
    FRAME_MAP = [0, 2, 4, 6]

    for enemy_name, meta in TARGETS.items():
        folder = meta["folder"]
        bounds_key = meta["bounds_key"]
        print(f"=== Ingesting {enemy_name} -> {folder} ===")
        
        if bounds_key not in bounds_data:
            bounds_data[bounds_key] = {"footOffset": meta["foot_offset"], "frames": {}}

        for dir_name, url_template in meta["urls"].items():
            dir_dir = os.path.join(folder, dir_name)
            os.makedirs(dir_dir, exist_ok=True)
            frames_meta = []
            
            for out_idx, src_idx in enumerate(FRAME_MAP):
                url = url_template.format(i=src_idx)
                out_path = os.path.join(dir_dir, f"frame_{str(out_idx).zfill(3)}.png")
                print(f"Downloading {dir_name} frame {out_idx} (src {src_idx}) from {url}...")
                
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req) as resp, open(out_path, 'wb') as out_f:
                    out_f.write(resp.read())
                
                w, h, bbox = get_png_bbox(out_path)
                frames_meta.append({
                    "width": w,
                    "height": h,
                    "bounds": bbox
                })
            
            bounds_data[bounds_key]["frames"][dir_name] = frames_meta

    with open(bounds_path, "w") as f:
        json.dump(bounds_data, f, indent=2)
    print("enemyFrameBounds.json updated successfully!")

if __name__ == "__main__":
    download_and_ingest()
