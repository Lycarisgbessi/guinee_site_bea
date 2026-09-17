#!/usr/bin/env python3
"""
Tests de propagation temps réel Dashboard → Site public (Guinée+).
Mesure le délai entre une modification dans le back-office et sa
visibilité sur le site public, pour 3 chaînes distinctes :
  1. Réglages (SiteSetting)      → bandeau « Le fil »
  2. Articles (Article)          → page Archives
  3. Blocs d'accueil (HomepageBlock) → section En direct
Chaque test est ANNULÉ (restauration de la valeur d'origine).
"""
import json
import time
import urllib.request
import http.cookiejar
import datetime

BASE = 'http://localhost:3000'
EMAIL, PASSWORD = 'claire@lavigie.fr', 'admin2026'
MARK = str(int(time.time()))  # marqueur unique pour ce run

jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))


def http(method, path, data=None, timeout=30):
    req = urllib.request.Request(BASE + path, method=method)
    req.add_header('Content-Type', 'application/json')
    body = json.dumps(data).encode() if data is not None else None
    t0 = time.perf_counter()
    try:
        with opener.open(req, body, timeout) as r:
            return r.status, json.loads(r.read().decode() or '{}'), time.perf_counter() - t0
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode() or '{}'), time.perf_counter() - t0


def html(path):
    with opener.open(BASE + path, timeout=30) as r:
        return r.read().decode()


def wait_for(path, needle, deadline=20.0):
    """Sonde la page jusqu'à trouver `needle` ; renvoie le délai (s) ou None."""
    t0 = time.perf_counter()
    while time.perf_counter() - t0 < deadline:
        try:
            if needle.lower() in html(path).lower():
                return time.perf_counter() - t0
        except Exception:
            pass
        time.sleep(0.2)
    return None


def banner(title):
    print(f"\n{'=' * 62}\n{title}\n{'=' * 62}")


# ---------- Connexion ----------
banner('CONNEXION AU TABLEAU DE BORD')
code, data, dt = http('POST', '/api/auth/login', {'email': EMAIL, 'password': PASSWORD})
print(f"POST /api/auth/login → {code} ({dt * 1000:.0f} ms) — {data.get('user', {}).get('name', '?')}")
assert code == 200, 'Connexion échouée'

results = []

# ---------- TEST 1 : Réglages ----------
banner('TEST 1 — RÉGLAGE (ticker_label) → SITE PUBLIC')
_, s, _ = http('GET', '/api/admin/settings')
orig = s['settings'].get('ticker_label', '')
test_val = f'Le fil · test {MARK}'
print(f"Valeur d'origine : « {orig} »  →  test : « {test_val} »")
t0 = time.perf_counter()
http('PUT', '/api/admin/settings', {'ticker_label': test_val})
write_ms = (time.perf_counter() - t0) * 1000
delay = wait_for('/', test_val)
results.append(('Réglage ticker_label', write_ms, delay))
print(f"Écriture dashboard : {write_ms:.0f} ms — Visible sur le site : "
      f"{'après ' + format(delay, '.2f') + ' s' if delay is not None else 'NON TROUVÉ'}")
http('PUT', '/api/admin/settings', {'ticker_label': orig})
back = wait_for('/', orig if orig else 'flash')
print(f"Restauration : {'OK (' + format(back, '.2f') + ' s)' if back is not None else 'à vérifier'}")

# ---------- TEST 2 : Article ----------
banner('TEST 2 — CRÉATION D’ARTICLE PUBLIÉ → PAGE ARCHIVES')
title = f'Article test temps réel {MARK}'
art = {
    'title': title,
    'subtitle': 'Vérification de la chaîne de propagation',
    'chapo': 'Cet article est créé par le test automatisé de communication.',
    'contentJson': {'type': 'doc', 'content': [
        {'type': 'paragraph', 'content': [
            {'type': 'text', 'text': f'Corps de test {MARK}. Sera mis à la corbeille automatiquement.'}]}]},
    'status': 'PUBLISHED',
    'format': 'ARTICLE',
}
t0 = time.perf_counter()
code, res, _ = http('POST', '/api/admin/articles', art)
write_ms = (time.perf_counter() - t0) * 1000
print(f"POST /api/admin/articles → {code} ({write_ms:.0f} ms)")
if code == 200:
    aid = res['article']['id']
    slug = res['article']['slug']
    print(f"Article créé : {slug}")
    delay = wait_for('/archives', MARK)
    results.append(('Article → Archives', write_ms, delay))
    print(f"Visible sur /archives : "
          f"{'après ' + format(delay, '.2f') + ' s' if delay is not None else 'NON TROUVÉ'}")
    # Page article individuelle
    with opener.open(BASE + f'/article/{slug}', timeout=30) as r:
        ok_page = MARK in r.read().decode()
    print(f"Page /article/{slug} : {'OK' if ok_page else 'INDISPONIBLE'}")
    http('DELETE', f'/api/admin/articles/{aid}')
    gone = wait_for('/archives', MARK)
    if gone is None:
        print('Mise à la corbeille → retiré du site : OUI')
    else:
        print(f'Mise à la corbeille → retiré du site : ENCORE VISIBLE après {gone:.2f} s')
else:
    results.append(('Article → Archives', write_ms, None))
    print(f"ÉCHEC création : {res}")

# ---------- TEST 3 : Bloc d'accueil ----------
banner('TEST 3 — BLOC D’ACCUEIL (titre du Fil) → PAGE D’ACCUEIL')
_, cfg, _ = http('GET', '/api/admin/homepage-config')
blocks = cfg.get('blocks', [])
target = next((b for b in blocks if b['blockType'] == 'FIL_ACTU'), None)
if target:
    conf = json.loads(target.get('configJson') or '{}')
    orig_title = conf.get('title', '')
    test_title = f'Le direct test {MARK}'
    print(f"Titre d'origine : « {orig_title} »  →  test : « {test_title} »")
    payload = []
    for b in blocks:
        c = json.loads(b.get('configJson') or '{}')
        if b['id'] == target['id']:
            c['title'] = test_title
        payload.append({'id': b['id'], 'order': b['order'], 'active': b['active'], 'configJson': c})
    t0 = time.perf_counter()
    code, _, _ = http('PUT', '/api/admin/homepage-config', {'blocks': payload})
    write_ms = (time.perf_counter() - t0) * 1000
    delay = wait_for('/', test_title)
    results.append(('Bloc FIL_ACTU (titre)', write_ms, delay))
    print(f"PUT homepage-config → {code} ({write_ms:.0f} ms) — Visible : "
          f"{'après ' + format(delay, '.2f') + ' s' if delay is not None else 'NON TROUVÉ'}")
    # Restauration
    payload = [{'id': b['id'], 'order': b['order'], 'active': b['active'],
                'configJson': json.loads(b.get('configJson') or '{}')} for b in blocks]
    http('PUT', '/api/admin/homepage-config', {'blocks': payload})
    back = wait_for('/', orig_title)
    print(f"Restauration : {'OK (' + format(back, '.2f') + ' s)' if back is not None else 'à vérifier'}")
else:
    print('Bloc FIL_ACTU introuvable')

# ---------- Bilan ----------
banner('BILAN — DÉLAIS DE PROPAGATION DASHBOARD → SITE')
for name, w, d in results:
    print(f"  {name:<28} écriture {w:6.0f} ms   propagation "
          f"{format(d, '.2f') + ' s' if d is not None else 'ÉCHEC'}")
print(f"\nTest exécuté le {datetime.datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
