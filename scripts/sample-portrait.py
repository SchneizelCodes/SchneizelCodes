# Samples scripts/media/portrait.webp into particle points, like the portfolio's particle portrait:
# a jittered halftone grid where brighter areas get bigger, brighter dots (edges get a boost).
# Writes scripts/media/portrait-points.json as {aspect, points:[[u, v, b]]} with u, v in 0..1.
# Run once after changing the photo:  python3 scripts/sample-portrait.py   (needs Pillow)
import json, random
from PIL import Image, ImageFilter, ImageOps, ImageEnhance

random.seed(7)
COLS = 62
src = Image.open('scripts/media/portrait.webp').convert('RGBA')
aspect = src.height / src.width
ROWS = round(COLS * aspect)
im = src.resize((COLS, ROWS), Image.LANCZOS)
alpha = im.getchannel('A')
grey = ImageEnhance.Contrast(ImageOps.autocontrast(im.convert('L'), cutoff=1)).enhance(1.25)
edges = grey.filter(ImageFilter.FIND_EDGES)
pts = []
for y in range(ROWS):
    for x in range(COLS):
        if alpha.getpixel((x, y)) < 140:
            continue
        b = min(1, grey.getpixel((x, y)) / 255 + edges.getpixel((x, y)) / 255 * 0.35)
        if b < 0.06:
            continue
        j = lambda: (random.random() - 0.5) * 0.35
        pts.append([round((x + 0.5 + j()) / COLS, 4), round((y + 0.5 + j()) / ROWS, 4), round(b, 2)])
json.dump({'aspect': round(aspect, 4), 'cols': COLS, 'points': pts}, open('scripts/media/portrait-points.json', 'w'), separators=(',', ':'))
print(len(pts), 'points')
