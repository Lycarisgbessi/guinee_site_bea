#!/usr/bin/env python3
"""Échantillonne les couleurs officielles du logo Guinée+ et produit les assets."""
from PIL import Image
import os

SRC = '/home/z/my-project/upload/IMG-20260910-WA0059.jpg'
OUT = '/home/z/my-project/public/brand'
os.makedirs(OUT, exist_ok=True)

img = Image.open(SRC).convert('RGB')
W, H = img.size
print(f'Source: {W}x{H}')

def hexat(x, y, label):
    r, g, b = img.getpixel((x, y))
    print(f'{label}: #{r:02X}{g:02X}{b:02X}  (px {x},{y})')
    return f'#{r:02X}{g:02X}{b:02X}'

# Coins et zones clés du dégradé (fond)
green = hexat(int(W*0.06), int(H*0.06), 'VERT (haut-gauche)')
gold  = hexat(int(W*0.94), int(H*0.10), 'OR/JAUNE (haut-droite)')
red   = hexat(int(W*0.94), int(H*0.94), 'ROUGE (bas-droite)')
deep  = hexat(int(W*0.50), int(H*0.97), 'ROUGE PROFOND (bas-centre)')

# Le rouge du texte « GU » : zone du texte à gauche du centre (~x 0.28, y 0.50)
# On scanne la bande du texte pour trouver le pixel le plus saturé en rouge
best = None
for yy in range(int(H*0.44), int(H*0.58), 2):
    for xx in range(int(W*0.18), int(W*0.36), 2):
        r, g, b = img.getpixel((xx, yy))
        if r > 150 and g < 90 and b < 90:
            score = r - (g + b) // 2
            if best is None or score > best[0]:
                best = (score, xx, yy, (r, g, b))
if best:
    r, g, b = best[3]
    gu_red = f'#{r:02X}{g:02X}{b:02X}'
    print(f'ROUGE « GU » (texte): {gu_red}  (px {best[1]},{best[2]})')

# Le jaune/or de l'arc G (bas de l'arc, zone jaune vive)
best_y = None
for yy in range(int(H*0.60), int(H*0.78), 2):
    for xx in range(int(W*0.40), int(W*0.72), 2):
        r, g, b = img.getpixel((xx, yy))
        if r > 180 and g > 140 and b < 110:
            score = (r + g) - b * 2
            if best_y is None or score > best_y[0]:
                best_y = (score, xx, yy, (r, g, b))
if best_y:
    r, g, b = best_y[3]
    arc_gold = f'#{r:02X}{g:02X}{b:02X}'
    print(f'OR de l’arc G: {arc_gold}  (px {best_y[1]},{best_y[2]})')

# Le vert de l'arc G (haut de l'arc)
best_g = None
for yy in range(int(H*0.24), int(H*0.40), 2):
    for xx in range(int(W*0.32), int(W*0.60), 2):
        r, g, b = img.getpixel((xx, yy))
        if g > 120 and r < 120 and b < 120:
            score = g - (r + b) // 2
            if best_g is None or score > best_g[0]:
                best_g = (score, xx, yy, (r, g, b))
if best_g:
    r, g, b = best_g[3]
    arc_green = f'#{r:02X}{g:02X}{b:02X}'
    print(f'VERT de l’arc G: {arc_green}  (px {best_g[1]},{best_g[2]})')
