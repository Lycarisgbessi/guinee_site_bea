#!/usr/bin/env python3
"""Télécharge les images sélectionnées de Guinée et les normalise (max 1800px, JPEG q82)."""
import io
import os
import urllib.request

from PIL import Image

OUT = "/home/z/my-project/public/uploads/guinee"
os.makedirs(OUT, exist_ok=True)

# (fichier final, url, crédit source)
IMAGES = [
    ("conakry-ville.jpg", "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/75a232b95daa.jpg", "Photo : Dreamstime"),
    ("conakry-baie.jpg", "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/46d816480f5b.jpg", "Photo : Dreamstime"),
    ("conakry-alternative.jpg", "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/3ed10b7b5069.jpg", "Photo : RenderHub"),
    ("bauxite-mine.jpg", "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/ea83f339b425.jpg", "Photo : Discovery Alert"),
    ("bauxite-camions.jpg", "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/fd9cd04bbfcb.png", "Photo : Inclusive Development International"),
    ("mont-nimba.jpg", "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/dee57a7f0324.jpg", "Photo : One Earth"),
    ("mont-nimba-2.jpg", "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/13073ce6a93e.jpeg", "Photo : Springs"),
    ("fouta-djallon.jpg", "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/a731a4fa4baf.jpg", "Photo : E.A.Travel"),
    ("fouta-cascade.jpg", "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/93afc3c73645.jpg", "Photo : E.A.Travel"),
    ("marche-madina.jpg", "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/001d71190f8e.jpg", "Photo : The New York Times"),
    ("marche-rue.jpg", "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/8b3cee0bd5ad.jpg", "Photo : Dreamstime"),
    ("foot-syli.jpg", "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d9a5db236e87.jpg", "Photo : BBC"),
    ("foot-stade.jpg", "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/732cdcce62f8.jpg", "Photo : BBC"),
    ("musique-balafon.jpg", "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/4e273d62807b.jpg", "Photo : World Music Central"),
    ("musique-kora.jpg", "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/8ca31fcbb53c.jpg", "Photo : YouTube"),
    ("peche-pirogues.jpg", "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/7265cfba6cb3.jpg", "Photo : France 24"),
    ("peche-cote.jpg", "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/ad5af316fb10.jpg", "Photo : Dreamstime"),
    ("ecole-classe.jpg", "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/3f57a5a72ca3.jpg", "Photo : World Vision International"),
    ("ecole-eleves.jpg", "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/27fc8264a7ba.jpg", "Photo : Dreamstime"),
    ("tissu-wax.jpg", "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/2d2be12f713f.jpg", "Photo : Afrika Warehouse"),
    ("tissu-tissus.jpg", "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/80b33db7bcfb.jpg", "Photo : Alamy"),
    ("iles-de-los.jpg", "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/084088def5f6.jpg", "Photo : Cruise Critic"),
    ("plage-guinee.jpg", "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/6ccff958276e.jpg", "Photo : Trip.com"),
    ("energie-lignes.jpg", "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/c3dddcff48dc.jpg", "Photo : Alamy"),
    ("energie-pylone.jpg", "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/4d0046c5a981.jpg", "Photo : Alamy"),
]

MAX_W = 1800

for name, url, credit in IMAGES:
    dest = os.path.join(OUT, name)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (GuineePlus-CMS/1.0)"})
        raw = urllib.request.urlopen(req, timeout=60).read()
        img = Image.open(io.BytesIO(raw))
        # Convertit en RGB (PNG/webp -> JPEG)
        if img.mode in ("RGBA", "P", "LA"):
            img = img.convert("RGB")
        if img.width > MAX_W:
            h = round(img.height * MAX_W / img.width)
            img = img.resize((MAX_W, h), Image.LANCZOS)
        img.save(dest, "JPEG", quality=82, optimize=True, progressive=True)
        kb = os.path.getsize(dest) // 1024
        print(f"OK  {name}  {img.width}x{img.height}  {kb} Ko  ({credit})")
    except Exception as exc:  # noqa: BLE001
        print(f"ERR {name}: {exc}")

print("Terminé.")
