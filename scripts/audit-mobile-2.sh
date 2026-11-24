#!/bin/bash
# Audit mobile partie 2 : dashboard connecté (le contexte de travail des journalistes)
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
agent-browser eval "(()=>{const e=document.querySelector('input[type=email]');const p=document.querySelector('input[type=password]');const s=document.querySelector('button[type=submit]');const se=(el)=>{const st={get(el){return Object.getOwnPropertyDescriptor(el.__proto__,'value').get}};return st};const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;setter.call(e,'claire@lavigie.fr');e.dispatchEvent(new Event('input',{bubbles:true}));setter.call(p,'admin2026');p.dispatchEvent(new Event('input',{bubbles:true}));return 'filled'})()" >/dev/null
agent-browser find text "Se connecter" click >/dev/null 2>&1 || agent-browser eval "document.querySelector('button[type=submit]').click()" >/dev/null
agent-browser wait --url "**/dashboard" >/dev/null 2>&1 || true
agent-browser wait 3000 >/dev/null
agent-browser get url
agent-browser screenshot $OUT/09-dashboard-accueil.png >/dev/null
agent-browser eval "(()=>{const d=document.documentElement;return 'scrollW='+d.scrollWidth+' clientW='+d.clientWidth+(d.scrollWidth>d.clientWidth?' *** OVERFLOW ***':' ok')})()"

# Articles list
agent-browser open http://localhost:3000/dashboard/articles >/dev/null
agent-browser wait --load networkidle >/dev/null 2>&1 || true
agent-browser wait 2500 >/dev/null
agent-browser screenshot $OUT/10-dashboard-articles.png >/dev/null
echo "articles: $(agent-browser eval "(()=>{const d=document.documentElement;return d.scrollWidth>d.clientWidth?'OVERFLOW '+d.scrollW:'ok'})()" 2>/dev/null || agent-browser eval "(()=>{const d=document.documentElement;return d.scrollWidth>d.clientWidth?'OVERFLOW '+d.scrollWidth:'ok'})()")"

# Éditeur d'article (nouveau)
agent-browser open http://localhost:3000/dashboard/articles/nouveau >/dev/null
agent-browser wait --load networkidle >/dev/null 2>&1 || true
agent-browser wait 3000 >/dev/null
agent-browser screenshot $OUT/11-editeur-haut.png >/dev/null
agent-browser eval "window.scrollTo(0, 900)" >/dev/null
agent-browser wait 800 >/dev/null
agent-browser screenshot $OUT/12-editeur-milieu.png >/dev/null
echo "editeur: $(agent-browser eval "(()=>{const d=document.documentElement;return d.scrollWidth>d.clientWidth?'OVERFLOW '+d.scrollWidth:'ok'})()")"

# Médiathèque
agent-browser open http://localhost:3000/dashboard/medias >/dev/null
agent-browser wait --load networkidle >/dev/null 2>&1 || true
agent-browser wait 2500 >/dev/null
agent-browser screenshot $OUT/13-mediatheque.png >/dev/null
echo "medias: $(agent-browser eval "(()=>{const d=document.documentElement;return d.scrollWidth>d.clientWidth?'OVERFLOW '+d.scrollWidth:'ok'})()")"

# Paramètres (onglets)
agent-browser open http://localhost:3000/dashboard/parametres >/dev/null
agent-browser wait --load networkidle >/dev/null 2>&1 || true
agent-browser wait 2500 >/dev/null
agent-browser screenshot $OUT/14-parametres.png >/dev/null
echo "parametres: $(agent-browser eval "(()=>{const d=document.documentElement;return d.scrollWidth>d.clientWidth?'OVERFLOW '+d.scrollWidth:'ok'})()")"

# Console errors
echo "--- ERREURS CONSOLE ---"
agent-browser errors 2>/dev/null | head -20 || true
echo "AUDIT-2 DONE"
