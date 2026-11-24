#!/bin/bash
# Capture des nouvelles fonctionnalités : upload dialog + champ YouTube éditeur
set -e
cd /home/z/my-project
if ! pgrep -f "next dev" >/dev/null; then
  setsid npm run dev > dev.log 2>&1 < /dev/null &
  for i in $(seq 1 40); do curl -s http://localhost:3000/ --max-time 3 | grep -q . && break; sleep 2; done
fi

OUT=download/audit-mobile

# Desktop : vérifier que le fix min-w-0 n'a rien cassé + capturer éditeur
agent-browser set viewport 1440 900 >/dev/null
agent-browser open http://localhost:3000/login >/dev/null
agent-browser wait --load networkidle >/dev/null 2>&1 || true
agent-browser wait 1200 >/dev/null
agent-browser eval "(()=>{const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;const e=document.querySelector('input[type=email]');const p=document.querySelector('input[type=password]');setter.call(e,'claire@lavigie.fr');e.dispatchEvent(new Event('input',{bubbles:true}));setter.call(p,'admin2026');p.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('button[type=submit]').click();return 'ok'})()" >/dev/null
agent-browser wait --url "**/dashboard" >/dev/null 2>&1 || true
agent-browser wait 2000 >/dev/null
agent-browser screenshot $OUT/17-desktop-dashboard.png >/dev/null

agent-browser open http://localhost:3000/dashboard/articles/nouveau >/dev/null
agent-browser wait --load networkidle >/dev/null 2>&1 || true
agent-browser wait 3000 >/dev/null
agent-browser screenshot $OUT/18-desktop-editeur.png >/dev/null
# Scroll vers la barre latérale (image de une + vidéo YouTube)
agent-browser eval "document.querySelector('input[aria-label=\"Lien de la vidéo YouTube\"]')?.scrollIntoView({block:'center'}); 'scrolled'" >/dev/null 2>&1 || true
agent-browser wait 800 >/dev/null
agent-browser screenshot $OUT/19-desktop-champ-youtube.png >/dev/null

# Ouvrir le sélecteur média (zone d'import)
agent-browser eval "(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('Médiathèque'));if(b){b.click();return 'clicked'}return 'not-found'})()" >/dev/null
agent-browser wait 1500 >/dev/null
agent-browser screenshot $OUT/20-dialog-import.png >/dev/null
echo "CAPTURES-OK"
