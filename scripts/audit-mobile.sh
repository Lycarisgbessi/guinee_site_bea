#!/bin/bash
# Audit mobile complet : capture les pages clés en viewport téléphone (390x844)
set -e
cd /home/z/my-project

# Serveur démarré ?
if ! pgrep -f "next dev" >/dev/null; then
  setsid npm run dev > dev.log 2>&1 < /dev/null &
  for i in $(seq 1 40); do
    curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ --max-time 3 2>/dev/null | grep -q 200 && break
    sleep 2
  done
fi
echo "serveur OK: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/)"

mkdir -p download/audit-mobile
OUT=download/audit-mobile

agent-browser close >/dev/null 2>&1 || true

# ---------- Site public ----------
agent-browser set viewport 390 844 >/dev/null
agent-browser open http://localhost:3000/ >/dev/null
agent-browser wait --load networkidle >/dev/null 2>&1 || true
agent-browser wait 2500 >/dev/null
agent-browser screenshot $OUT/01-accueil-haut.png >/dev/null
agent-browser scroll down 900 >/dev/null
agent-browser wait 1200 >/dev/null
agent-browser screenshot $OUT/02-accueil-milieu.png >/dev/null
agent-browser eval "window.scrollTo(0, document.body.scrollHeight*0.55)" >/dev/null
agent-browser wait 1200 >/dev/null
agent-browser screenshot $OUT/03-accueil-bas.png >/dev/null

# Détection d'overflow horizontal sur toutes les pages testées
check_overflow () {
  agent-browser eval "(() => { const d=document.documentElement; return 'scrollW='+d.scrollWidth+' clientW='+d.clientWidth+(d.scrollWidth>d.clientWidth?' *** OVERFLOW ***':' ok'); })()"
}

echo "--- overflow accueil: $(check_overflow)"

# Article réel
agent-browser open "http://localhost:3000/article/$(curl -s 'http://localhost:3000/api/articles?perPage=1&status=PUBLISHED' | python3 -c 'import json,sys; print(json.load(sys.stdin)["items"][0]["slug"])')" >/dev/null
agent-browser wait --load networkidle >/dev/null 2>&1 || true
agent-browser wait 2000 >/dev/null
agent-browser screenshot $OUT/04-article-haut.png >/dev/null
agent-browser eval "window.scrollTo(0, 1400)" >/dev/null
agent-browser wait 1000 >/dev/null
agent-browser screenshot $OUT/05-article-milieu.png >/dev/null
echo "--- overflow article: $(check_overflow)"

# Vidéos
agent-browser open http://localhost:3000/videos >/dev/null
agent-browser wait --load networkidle >/dev/null 2>&1 || true
agent-browser wait 1800 >/dev/null
agent-browser screenshot $OUT/06-videos.png >/dev/null
echo "--- overflow videos: $(check_overflow)"

# Rubriques / archives
agent-browser open http://localhost:3000/rubriques >/dev/null
agent-browser wait --load networkidle >/dev/null 2>&1 || true
agent-browser wait 1500 >/dev/null
agent-browser screenshot $OUT/07-rubriques.png >/dev/null
echo "--- overflow rubriques: $(check_overflow)"

# Login
agent-browser open http://localhost:3000/login >/dev/null
agent-browser wait --load networkidle >/dev/null 2>&1 || true
agent-browser wait 1500 >/dev/null
agent-browser screenshot $OUT/08-login.png >/dev/null

# ---------- Connexion dashboard ----------
agent-browser find label "Email" fill "claire@lavigie.fr" >/dev/null 2>&1 || agent-browser eval "(()=>{const i=document.querySelector('input[type=email]');if(i){i.value='';return 'no-label'}})()" >/dev/null
agent-browser snapshot -i -c 2>/dev/null | head -20

echo "SNAPSHOT-LOGIN-DONE"
