#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AUDIT ULTRA COMPLET — Plateforme Guinée+ / La Vigie
Couvre : routes publiques, protection, session admin, APIs, base de données,
SEO, performance, publicités. Aucune mutation destructive (clic pub restauré).
"""
import json, sqlite3, time, urllib.request, urllib.error, urllib.parse, http.cookiejar, os, sys

BASE = "http://localhost:3000"
DB = os.path.join(os.path.dirname(__file__), "..", "db", "custom.db")
results = []  # (section, nom, etat, detail)

def record(sec, name, ok, detail=""):
    results.append((sec, name, "OK" if ok else ("WARN" if ok is None else "KO"), detail))

def fetch(path, headers=None, method="GET", data=None, jar=None, timeout=30, follow=True):
    url = BASE + path
    req = urllib.request.Request(url, method=method)
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    body = None
    if data is not None:
        body = json.dumps(data).encode()
        req.add_header("Content-Type", "application/json")
    handlers = [urllib.request.HTTPCookieProcessor(jar)] if jar is not None else []
    if not follow:
        class NoRedirect(urllib.request.HTTPRedirectHandler):
            def redirect_request(self, *a, **k):
                return None
        handlers.append(NoRedirect())
    opener = urllib.request.build_opener(*handlers)
    t0 = time.perf_counter()
    try:
        resp = opener.open(req, body, timeout=timeout)
        content = resp.read()
        ms = (time.perf_counter() - t0) * 1000
        return resp.status, dict(resp.headers), content, ms
    except urllib.error.HTTPError as e:
        content = e.read()
        ms = (time.perf_counter() - t0) * 1000
        return e.code, dict(e.headers), content, ms
    except Exception as e:
        return 0, {}, str(e).encode(), (time.perf_counter() - t0) * 1000

def hdr(h, name):
    """Accès en-tête insensible à la casse (les dicts Python ne le sont pas)."""
    for k, v in h.items():
        if k.lower() == name.lower():
            return v
    return ""

# ---------- Données de référence (DB directe) ----------
conn = sqlite3.connect(DB)
conn.row_factory = sqlite3.Row
q = lambda sql, *a: conn.execute(sql, a).fetchall()
one = lambda sql, *a: conn.execute(sql, a).fetchone()

art = one("SELECT slug FROM Article WHERE status='PUBLISHED' AND deletedAt IS NULL ORDER BY publishedAt DESC LIMIT 1")
cat = one("SELECT slug FROM Category ORDER BY \"order\" LIMIT 1")
tag = one("SELECT slug FROM Tag LIMIT 1")
page = one("SELECT slug FROM Page WHERE published=1 LIMIT 1")
ART_SLUG, CAT_SLUG = art["slug"], cat["slug"] if cat else "economie-mines"
TAG_SLUG, PAGE_SLUG = (tag["slug"] if tag else "guinee"), (page["slug"] if page else "a-propos")

# ============ A. ROUTES PUBLIQUES ============
print("▶ A. Routes publiques (avec warm-up puis mesure)")
public_routes = [
    ("/", "Accueil"), ("/archives", "Archives"), ("/rubriques", "Index rubriques"),
    ("/tags", "Index tags"), ("/recherche?q=bauxite", "Recherche"),
    ("/a-propos", "À propos"), ("/contact", "Contact"), ("/newsletter", "Newsletter"),
    ("/newsletter/confirmation", "Confirmation newsletter"), ("/plan-du-site", "Plan du site"),
    (f"/article/{ART_SLUG}", "Page article"), (f"/rubrique/{CAT_SLUG}", "Page rubrique"),
    (f"/tag/{TAG_SLUG}", "Page tag"), (f"/p/{PAGE_SLUG}", "Page statique"),
    ("/sitemap.xml", "Sitemap"), ("/robots.txt", "Robots"), ("/api/rss", "Flux RSS"),
    ("/api/articles", "API articles"), ("/api/categories", "API catégories"),
    ("/api/search?q=bauxite", "API recherche"),
]
for path, label in public_routes:
    s, h, c, _ = fetch(path)  # warm-up (compilation dev)
    s2, h2, c2, ms = fetch(path)
    ok = 200 <= s2 < 300
    record("A. Public", label, ok, f"{s2} · {ms:.0f} ms · {len(c2)//1024} Ko")

# 404 attendus
s, h, c, ms = fetch("/article/inexistant-xyz-12345")
record("A. Public", "Article inexistant → 404", s == 404, f"{s} · {ms:.0f} ms")
s, h, c, ms = fetch("/page-totalement-inexistante-xyz")
record("A. Public", "Route inexistante → 404", s == 404, f"{s} · {ms:.0f} ms")

# ============ B. PROTECTION SANS SESSION ============
print("▶ B. Protection sans session")
for path, label in [("/dashboard", "Dashboard"), ("/dashboard/articles", "Dashboard articles"),
                    ("/dashboard/parametres", "Dashboard paramètres")]:
    s, h, c, ms = fetch(path, follow=False)
    loc = hdr(h, "Location")
    ok = s in (307, 302) and "/login" in loc
    record("B. Sécurité", f"Redirection {label} → /login", ok, f"{s} → {loc or '?'}")
for path, label in [("/api/admin/articles", "API admin articles"), ("/api/admin/settings", "API admin réglages"),
                    ("/api/admin/ads", "API admin pubs"), ("/api/admin/stats", "API admin stats")]:
    s, h, c, ms = fetch(path)
    ok = s in (401, 403, 307, 302)
    record("B. Sécurité", f"Bloqué sans auth : {label}", ok, f"{s}")

# ============ C. SESSION ADMIN ============
print("▶ C. Session administrateur (claire@lavigie.fr)")
jar = http.cookiejar.CookieJar()
s, h, c, ms = fetch("/api/auth/login", method="POST", data={"email": "claire@lavigie.fr", "password": "admin2026"}, jar=jar)
cookie_hdr = hdr(h, "Set-Cookie")
cookie_ok = s == 200 and "vigie_session" in cookie_hdr
httponly = "HttpOnly" in cookie_hdr
samesite = "Lax" if "SameSite=lax" in cookie_hdr.lower() else ("None" if "samesite=none" in cookie_hdr.lower() else "?")
record("C. Session", "Connexion API + cookie de session", cookie_ok, f"{s} · httpOnly={httponly} · SameSite={samesite}")

if cookie_ok:
    dash_pages = ["/dashboard", "/dashboard/accueil", "/dashboard/articles", "/dashboard/articles/nouveau",
                  "/dashboard/rubriques", "/dashboard/tags", "/dashboard/commentaires", "/dashboard/messages",
                  "/dashboard/newsletter", "/dashboard/medias", "/dashboard/pages", "/dashboard/publicites",
                  "/dashboard/parametres"]
    for p in dash_pages:
        s, h, c, ms = fetch(p, jar=jar)
        record("C. Session", f"Dashboard {p.replace('/dashboard','') or ' (accueil)'}", s == 200, f"{s} · {ms:.0f} ms")
    admin_apis = ["/api/admin/articles", "/api/admin/articles/trash", "/api/admin/categories", "/api/admin/tags",
                  "/api/admin/comments", "/api/admin/messages", "/api/admin/newsletter", "/api/admin/media",
                  "/api/admin/pages", "/api/admin/settings", "/api/admin/homepage-config", "/api/admin/ads",
                  "/api/admin/stats", "/api/admin/redirects", "/api/admin/me/profile", "/api/admin/me/logs"]
    for p in admin_apis:
        s, h, c, ms = fetch(p, jar=jar)
        # me/profile n'expose que PUT → 405 sur GET = comportement correct
        ok = (s == 200) or (p == "/api/admin/me/profile" and s == 405)
        record("C. Session", f"API {p.replace('/api/admin/','')}", ok, f"{s} · {ms:.0f} ms" + (" (endpoint PUT only — GET refusé à raison)" if s == 405 else ""))
    # Vérif finale : les APIs admin répondent avec la session valide
    s2, h2, c2, ms2 = fetch("/api/admin/articles", jar=jar)
    record("C. Session", "API admin accessible avec session", s2 == 200, f"{s2}")
    s3, h3, c3, ms3 = fetch("/api/auth/logout", method="POST", jar=jar)
    s4, h4, c4, ms4 = fetch("/api/admin/articles", jar=jar)
    record("C. Session", "Déconnexion → API re-bloquée", s3 == 200 and s4 in (401, 403, 307, 302), f"logout:{s3} · après:{s4}")

# ============ D. BASE DE DONNÉES ============
print("▶ D. Base de données")
tables = [r[0] for r in q("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%'")]
counts = {t: conn.execute(f'SELECT COUNT(*) FROM "{t}"').fetchone()[0] for t in sorted(tables)}
detail = " · ".join(f"{t}:{n}" for t, n in counts.items())
record("D. Base", f"{len(tables)} tables — comptages", True, detail)

pub = one("SELECT COUNT(*) c FROM Article WHERE status='PUBLISHED' AND deletedAt IS NULL")[0]
draft = one("SELECT COUNT(*) c FROM Article WHERE status='DRAFT' AND deletedAt IS NULL")[0]
sched = one("SELECT COUNT(*) c FROM Article WHERE status='SCHEDULED' AND deletedAt IS NULL")[0]
trash = one("SELECT COUNT(*) c FROM Article WHERE deletedAt IS NOT NULL")[0]
record("D. Base", "Articles par état", True, f"publiés:{pub} brouillons:{draft} programmés:{sched} corbeille:{trash}")

orph_author = one("SELECT COUNT(*) c FROM Article a LEFT JOIN User u ON a.authorId=u.id WHERE u.id IS NULL")[0]
orph_ac = one("SELECT COUNT(*) c FROM ArticleCategory ac LEFT JOIN Article a ON ac.articleId=a.id LEFT JOIN Category c2 ON ac.categoryId=c2.id WHERE a.id IS NULL OR c2.id IS NULL")[0]
orph_at = one("SELECT COUNT(*) c FROM ArticleTag at LEFT JOIN Article a ON at.articleId=a.id LEFT JOIN Tag t ON at.tagId=t.id WHERE a.id IS NULL OR t.id IS NULL")[0]
orph_com = one("SELECT COUNT(*) c FROM Comment c LEFT JOIN Article a ON c.articleId=a.id WHERE a.id IS NULL")[0]
record("D. Base", "Intégrité référentielle (orphelins)", orph_author + orph_ac + orph_at + orph_com == 0,
       f"auteur:{orph_author} rubrique:{orph_ac} tag:{orph_at} commentaire:{orph_com}")

slugs_dup = one("SELECT COUNT(*) c FROM (SELECT slug, COUNT(*) n FROM Article GROUP BY slug HAVING n>1)")[0]
record("D. Base", "Unicité des slugs", slugs_dup == 0, f"doublons:{slugs_dup}")

settings_n = one("SELECT COUNT(*) c FROM SiteSetting")[0]
empty_settings = q("SELECT key FROM SiteSetting WHERE value IS NULL OR trim(value)=''")
record("D. Base", "Réglages du site", settings_n > 0, f"{settings_n} clés · {len(empty_settings)} vides")

db_size = os.path.getsize(DB) / 1024 / 1024
record("D. Base", "Taille DB", db_size < 100, f"{db_size:.1f} Mo")

# ============ E. PUBLICITÉS ============
print("▶ E. Régie publicitaire")
ads = q("SELECT * FROM Ad")
active_by_slot = {}
for a in ads:
    now = int(time.time() * 1000)
    st_ok = (a["startsAt"] is None or a["startsAt"] <= now) and (a["endsAt"] is None or a["endsAt"] >= now)
    if a["active"] and st_ok:
        active_by_slot.setdefault(a["slot"], []).append(a)
imp = one("SELECT COALESCE(SUM(impressions),0) AS i, COALESCE(SUM(clicks),0) AS c FROM Ad")
ctr = (imp["c"] / imp["i"] * 100) if imp["i"] else 0
record("E. Publicité", "Annonces actives par emplacement", True,
       json.dumps({k: len(v) for k, v in active_by_slot.items()}, ensure_ascii=False) or "{}")
record("E. Publicité", "Statistiques régie", True, f"impressions:{imp['i']} · clics:{imp['c']} · CTR {ctr:.2f} %")
ads_enabled = one("SELECT value FROM SiteSetting WHERE key='ads_enabled'")
ads_on = (ads_enabled["value"] == "true") if ads_enabled else True  # défaut src/lib/settings.ts : 'true'
record("E. Publicité", "Interrupteur général", ads_on,
       f"DB: {'absent (défaut true)' if not ads_enabled else ads_enabled['value']}")
# Vérif bannières réellement rendues (liens de clic vers /api/ads/<id>/click)
for slot, path, label in [("HEADER_LEADERBOARD", "/", "Accueil"), ("ARTICLE_END", f"/article/{ART_SLUG}", "Article")]:
    s, h, c, ms = fetch(path)
    html = c.decode("utf-8", "ignore")
    n_banners = html.count("/api/ads/") // 2  # lien + image
    record("E. Publicité", f"Bannière rendue sur {label}", (n_banners > 0) if ads_on else None,
           f"{n_banners} bannière(s) avec lien de clic")

# ============ F. SEO ============
print("▶ F. SEO / découvrabilité")
s, h, c, ms = fetch("/sitemap.xml")
sm = c.decode("utf-8", "ignore")
n_urls = sm.count("<loc>")
has_art = ART_SLUG in sm
record("F. SEO", "Sitemap", s == 200 and n_urls > 5 and has_art, f"{n_urls} URLs · article présent: {has_art}")
s, h, c, ms = fetch("/api/rss")
rss = c.decode("utf-8", "ignore")
record("F. SEO", "Flux RSS", s == 200 and rss.count("<item>") > 0, f"{rss.count('<item>')} items")
s, h, c, ms = fetch(f"/article/{ART_SLUG}", headers={"x-forwarded-proto": "https", "x-forwarded-host": "preview-guineeplus.space-z.ai"})
art_html = c.decode("utf-8", "ignore")
import re
og_img = re.search(r'property="og:image" content="([^"]+)"', art_html)
og_title = re.search(r'property="og:title" content="([^"]+)"', art_html)
tw_card = 'name="twitter:card"' in art_html
canonical = re.search(r'rel="canonical" href="([^"]+)"', art_html)
jsonld = 'application/ld+json' in art_html
record("F. SEO", "Article : og:image absolue", bool(og_img) and og_img.group(1).startswith("https://"), og_img.group(1)[:80] if og_img else "absent")
record("F. SEO", "Article : og:title / twitter:card / canonical / JSON-LD",
       bool(og_title) and tw_card and bool(canonical) and jsonld,
       f"titre:{bool(og_title)} card:{tw_card} canon:{bool(canonical)} jsonld:{jsonld}")
s, h, c, ms = fetch("/")
home_html = c.decode("utf-8", "ignore")
record("F. SEO", "Accueil : og:site_name + og:title", 'og:site_name' in home_html and 'og:title' in home_html, "")
rob = fetch("/robots.txt")[2].decode()
record("F. SEO", "robots.txt : facebookexternalhit autorisé", "facebookexternalhit" in rob and "Allow: /" in rob, "")

# ============ G. PERFORMANCE ============
print("▶ G. Performance")
uploads = []
for root, _, files in os.walk(os.path.join(os.path.dirname(__file__), "..", "public", "uploads")):
    for f in files:
        p = os.path.join(root, f)
        uploads.append((os.path.getsize(p), f))
uploads.sort(reverse=True)
total_mo = sum(s for s, _ in uploads) / 1024 / 1024
big = [(f"{s/1024:.0f} Ko", n) for s, n in uploads[:5]]
record("G. Perf", f"Médiathèque : {len(uploads)} fichiers, {total_mo:.1f} Mo", total_mo < 60, f"top: {big}")
times = [(n, ms) for sec, n, st, d in results if sec == "A. Public" for ms in [float(re.search(r'([\d.]+) ms', d).group(1)) if re.search(r'([\d.]+) ms', d) else 0]]
slow = [(n, f"{ms:.0f} ms") for n, ms in times if ms > 1500]
record("G. Perf", "Routes publiques < 1,5 s (dev, après warm-up)", len(slow) == 0, f"lentes: {slow or 'aucune'}")

conn.close()

# ============ RAPPORT ============
print("\n" + "=" * 100)
n_ok = sum(1 for _, _, st, _ in results if st == "OK")
n_ko = sum(1 for _, _, st, _ in results if st == "KO")
n_warn = sum(1 for _, _, st, _ in results if st == "WARN")
for sec, name, st, detail in results:
    icon = "✅" if st == "OK" else ("⚠️ " if st == "WARN" else "❌")
    print(f"{icon} [{sec}] {name}" + (f" — {detail}" if detail else ""))
print("=" * 100)
print(f"BILAN : {n_ok} OK · {n_warn} avertissements · {n_ko} échecs  →  {'AUDIT RÉUSSI' if n_ko == 0 else 'CORRECTIONS REQUISES'}")
