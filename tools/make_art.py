"""Turn Stellarium constellation illustrations into packed textures for the atlas shader.

Usage: python3 tools/make_art.py <dir with Stellarium PNGs> site/art
Each output is a grayscale WebP, 1024x512: the left half is the outline strength (edges of the
engraving, softly widened for glow), the right half is the body fill (original brightness).
The reveal pattern is computed in the shader.
"""
import os, sys
import numpy as np
from PIL import Image, ImageFilter

SIZE = 512

def pack(src, dst):
    img = Image.open(src).convert('L').resize((SIZE, SIZE), Image.LANCZOS)
    lum = np.asarray(img, np.float32) / 255
    soft = np.asarray(img.filter(ImageFilter.GaussianBlur(1.2)), np.float32) / 255
    gy, gx = np.gradient(soft)
    edge = np.hypot(gx, gy)
    edge = np.clip(edge / (np.percentile(edge[edge > 0], 97) + 1e-6), 0, 1) ** .8
    glow = np.asarray(Image.fromarray((edge * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.2)), np.float32) / 255
    outline = np.clip(edge * .85 + glow * .9, 0, 1)
    sheet = np.concatenate([outline, lum], 1)
    Image.fromarray((sheet * 255 + .5).astype(np.uint8), 'L').save(dst, 'WEBP', quality=80, method=6)

if __name__ == '__main__':
    src_dir, out_dir = sys.argv[1], sys.argv[2]
    total = 0
    for i, name in enumerate(sorted(f for f in os.listdir(src_dir) if f.endswith('.png'))):
        dst = os.path.join(out_dir, name.replace('.png', '.webp'))
        pack(os.path.join(src_dir, name), dst)
        total += os.path.getsize(dst)
    print(f'{i + 1} textures, {total // 1024} KB')
