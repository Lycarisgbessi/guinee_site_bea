#!/usr/bin/env python3
"""Produit les assets de marque Guinée+ à partir du logo officiel."""
from PIL import Image, ImageDraw, ImageOps
import shutil, os

SRC = '/home/z/my-project/upload/IMG-20260910-WA0059.jpg'
OUT = '/home/z/my-project/public/brand'
os.makedirs(OUT, exist_ok=True)

img = Image.open(SRC).convert('RGB')
W, H = img.size
side = min(W, H)
img = img.crop(((W - side) // 2, (H - side) // 2, (W + side) // 2, (H + side) // 2))

# 1) Logo officiel carré (copie fidèle, recadrée au carré si besoin)
img.save(f'{OUT}/logo-guineeplus.jpg', quality=92)
shutil.copy(f'{OUT}/logo-guineeplus.jpg', f'{OUT}/logo-guineeplus-512.png')

# 2) Version circulaire (comme l'avatar officiel Facebook) — coins transparents
size = 512
big = img.resize((size * 2, size * 2), Image.LANCZOS)
mask = Image.new('L', (size * 2, size * 2), 0)
d = ImageDraw.Draw(mask)
d.ellipse((0, 0, size * 2 - 1, size * 2 - 1), fill=255)
round_img = Image.new('RGBA', (size * 2, size * 2), (0, 0, 0, 0))
round_img.paste(big, (0, 0), mask)
round_img = round_img.resize((size, size), Image.LANCZOS)
round_img.save(f'{OUT}/logo-guineeplus-round.png')

# 3) Favicon 32x32 + 48x48 + apple-touch-icon 180x180 (carré officiel, plus lisible en petit)
for s, name in ((32, 'favicon-32.png'), (48, 'favicon-48.png'), (180, 'apple-touch-icon.png'), (192, 'icon-192.png'), (512, 'icon-512.png')):
    img.resize((s, s), Image.LANCZOS).save(f'{OUT}/{name}')

print('Assets produits :')
for f in sorted(os.listdir(OUT)):
    print(' -', f, os.path.getsize(f'{OUT}/{f}'), 'octets')
