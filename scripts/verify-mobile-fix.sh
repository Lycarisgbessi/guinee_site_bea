#!/bin/bash
# Vérification finale : overflow mobile sur toutes les pages clés après fix
set -e
cd /home/z/my-project
if ! pgrep -f "next dev" >/dev/null; then
  setsid npm run dev > dev.log 2>&1 < /dev/null &
  for i in $(seq 1 40); do curl -s http://localhost:3000/ --max-time 3 | grep -q . && break; sleep 2; done
fi

OUT=download/audit-mobile
agent-browser set viewport 390 844 >/dev/null
agent-browser open http://localhost:3000/login >/dev/null
agent-browser wait --load networkidle >/dev/null 2>&1 || true
agent-browser wait 1200 >/dev/null
agent-browser eval "(()=>{const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;const e=document.querySelector('input[type=email]');const p=document.querySelector('input[type=password]');setter.call(e,'claire@lavigie.fr');e.dispatchEvent(new Event('input',{bubbles:true}));setter.call(p,'admin2026');p.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('button[type=submit]').click();return 'ok'})()" >/dev/null
agent-browser wait --url "**/dashboard" >/dev/null 2>&1 || true
agent-browser wait 2000 >/dev/null

check_overflow() {
  agent-browser eval '(()=>{const d=document.documentElement;return d.scrollWidth>d.clientWidth ? "*** OVERFLOW "+d.scrollWidth+"px ***" : "ok ("+d.scrollWidth+"px)"})()'
}

for p in /dashboard /dashboard/articles /dashboard/articles/nouveau /dashboard/medias /dashboard/parametres /dashboard/publicites /dashboard/commentaires /dashboard/newsletter /dashboard/messages /dashboard/rubriques /dashboard/accueil /dashboard/tags /dashboard/pages; do
  agent-browser open "http://localhost:3000$p" >/dev/null
  agent-browser wait --load networkidle >/dev/null 2>&1 || true
  agent-browser wait 1800 >/dev/null
  R=$(check_overflow)
  echo "$p : $R"
done

# Re-capture du tableau articles (fix visible)
agent-browser open http://localhost:3000/dashboard/articles >/dev/null
agent-browser wait --load networkidle >/dev/null 2>&1 || true
agent-browser wait 2200 >/dev/null
agent-browser screenshot $OUT/15-articles-apres-fix.png >/dev/null

# Capture page vidéos avec embed (article balafon sans youtube → fallback image)
agent-browser open http://localhost:3000/videos >/dev/null
agent-browser wait --load networkidle >/dev/null 2>&1 || true
agent-browser wait 2000 >/dev/null
agent-browser screenshot $OUT/16-videos-apres-fix.png >/dev/null
echo "VERIF-DONE"
