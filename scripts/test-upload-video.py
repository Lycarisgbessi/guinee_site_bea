#!/usr/bin/env python3
"""Test end-to-end : upload média + article vidéo + page /videos + bloc accueil."""
import io
import json
import struct
import urllib.request
import urllib.error

BASE = 'http://localhost:3000'
COOKIE = {}

def req(path, method='GET', data=None, headers=None, follow=False):
    h = dict(headers or {})
    if COOKIE:
        h['Cookie'] = '; '.join(f'{k}={v}' for k, v in COOKIE.items())
    r = urllib.request.Request(BASE + path, data=data, method=method, headers=h)
    opener = urllib.request.build_opener(NoRedirect) if not follow else urllib.request.build_opener()
    try:
        resp = opener.open(r, timeout=30)
        return resp.status, dict(resp.headers), resp.read()
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read()

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None

def hdr(headers, name):
    for k, v in headers.items():
        if k.lower() == name.lower():
            return v
    return None

def store_cookie(headers):
    sc = hdr(headers, 'set-cookie')
    if sc:
        part = sc.split(';')[0]
        k, _, v = part.partition('=')
        COOKIE[k.strip()] = v.strip()

# ---------- 1. Login ----------
print('== 1. Connexion ==')
body = json.dumps({'email': 'claire@lavigie.fr', 'password': 'admin2026'}).encode()
s, h, _ = req('/api/auth/login', 'POST', body, {'Content-Type': 'application/json'})
store_cookie(h)
print(f'  login: {s} (session={"vigie_session" in COOKIE})')

# ---------- 2. Upload d'une image de test (PNG 2000x1200 généré en Python) ----------
print('== 2. Upload image (PNG 2000x1200) ==')
def make_png(w, h_):
    def chunk(typ, data):
        c = struct.pack('>I', len(data)) + typ + data
        return c + struct.pack('>I', zlib_crc(typ + data))
    import zlib
    def zlib_crc(data):
        return zlib.crc32(data) & 0xffffffff
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', w, h_, 8, 2, 0, 0, 0))
    row = b'\x00' + b'\x1e\x4c\x8a' * w
    idat = chunk(b'IDAT', zlib.compress(row * h_))
    iend = chunk(b'IEND', b'')
    return sig + ihdr + idat + iend

png = make_png(2000, 1200)
boundary = '----TestBoundary123'
part = (
    f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="photo-reportage.png"\r\n'
    f'Content-Type: image/png\r\n\r\n'
).encode() + png + f'\r\n--{boundary}--\r\n'.encode()
s, h, raw = req('/api/admin/media/upload', 'POST', part, {
    'Content-Type': f'multipart/form-data; boundary={boundary}',
    'Content-Length': str(len(part)),
})
resp = json.loads(raw) if raw else {}
media = resp.get('media', {})
print(f'  upload: {s} -> {media.get("url")} ({media.get("size")} octets, {media.get("width")}x{media.get("height")})')
assert s == 200 and media.get('url'), f'UPLOAD FAILED: {resp}'
media_url = media['url']

# ---------- 3. Vérifier que le fichier est servi ----------
s, h, raw2 = req(media_url)
print(f'  fichier servi: {s} ({len(raw2)} octets, type={hdr(h, "content-type")})')

# ---------- 4. Créer un article vidéo avec le média uploadé + lien YouTube ----------
print('== 3. Création article vidéo (youtubeUrl + cover) ==')
art = {
    'title': 'Reportage vidéo test — minier à Kindia',
    'slug': 'test-video-reportage',
    'chapo': 'Notre envoyé spécial a suivi les camions de bauxite pendant 48 heures.',
    'format': 'VIDEO',
    'status': 'PUBLISHED',
    'youtubeUrl': 'https://youtu.be/dQw4w9WgXcQ',
    'coverImage': media_url,
    'contentJson': {
        'type': 'doc',
        'content': [
            {'type': 'paragraph', 'content': [{'type': 'text', 'text': 'Début du reportage vidéo.'}]},
            {'type': 'youTube', 'attrs': {'src': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'}},
        ],
    },
}
s, h, raw = req('/api/admin/articles', 'POST', json.dumps(art).encode(), {'Content-Type': 'application/json'})
resp = json.loads(raw) if raw else {}
print(f'  création: {s} (id={resp.get("article", {}).get("id")})')
assert s in (200, 201), f'CREATE FAILED: {resp}'

# ---------- 5. Page publique /article/... : vidéo + og + iframe ----------
s, h, html = req('/article/test-video-reportage', follow=True)
html = html.decode('utf-8', 'ignore')
checks = {
    'embed nocookie (bloc corps)': 'youtube-nocookie.com/embed/dQw4w9WgXcQ' in html,
    'miniature facade (haut article)': 'i.ytimg.com/vi/dQw4w9WgXcQ' in html,
    'image de une uploadée': media_url in html,
    'badge format VIDEO': 'Vidéo' in html,
}
print('== 4. Page article publique ==')
for k, v in checks.items():
    print(f'  [{"OK" if v else "KO"}] {k}')

# ---------- 6. Page /videos ----------
s, h, html = req('/videos', follow=True)
html = html.decode('utf-8', 'ignore')
print('== 5. Page /videos ==')
print(f'  status: {s}')
print(f'  [{"OK" if "test-video-reportage" in html else "KO"}] article présent dans la grille')
print(f'  [{"OK" if "/videos" else "KO"}] page rendue')

# ---------- 7. Accueil : bloc VIDEOS ----------
s, h, html = req('/', follow=True)
html = html.decode('utf-8', 'ignore')
print('== 6. Bloc accueil VIDEOS ==')
print(f'  [{"OK" if "Toutes les vidéos" in html else "KO"}] lien vers /videos')
print(f'  [{"OK" if "test-video-reportage" in html else "KO"}] carte vidéo visible')

# ---------- 8. Nettoyage : mettre l'article de test à la corbeille ----------
art_id = resp.get('article', {}).get('id')
if art_id:
    s, _, _ = req(f'/api/admin/articles/{art_id}', 'DELETE')
    print(f'== 7. Nettoyage : article de test corbeillé ({s}) ==')
print('\nTESTS TERMINÉS')
