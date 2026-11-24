#!/bin/bash
# Debug overflow mobile sur /dashboard/articles
set -e
cd /home/z/my-project
if ! pgrep -f "next dev" >/dev/null; then
  setsid npm run dev > dev.log 2>&1 < /dev/null &
  for i in $(seq 1 40); do curl -s http://localhost:3000/ --max-time 3 | grep -q . && break; sleep 2; done
fi

agent-browser set viewport 390 844 >/dev/null
# session : cookie posé via login API puis injection
agent-browser open http://localhost:3000/login >/dev/null
agent-browser wait --load networkidle >/dev/null 2>&1 || true
agent-browser wait 1200 >/dev/null
agent-browser eval "(()=>{const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;const e=document.querySelector('input[type=email]');const p=document.querySelector('input[type=password]');setter.call(e,'claire@lavigie.fr');e.dispatchEvent(new Event('input',{bubbles:true}));setter.call(p,'admin2026');p.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('button[type=submit]').click();return 'ok'})()" >/dev/null
agent-browser wait --url "**/dashboard" >/dev/null 2>&1 || true
agent-browser wait 2000 >/dev/null

agent-browser open http://localhost:3000/dashboard/articles >/dev/null
agent-browser wait --load networkidle >/dev/null 2>&1 || true
agent-browser wait 2500 >/dev/null

echo "--- document ---"
agent-browser eval "(()=>{const d=document.documentElement;return 'doc scrollW='+d.scrollWidth+' clientW='+d.clientWidth+' bodyScrollW='+document.body.scrollWidth})()"
echo "--- éléments qui débordent ---"
agent-browser eval "(()=>{const bad=[];document.querySelectorAll('*').forEach(el=>{if(el.scrollWidth>el.clientWidth+1&&el.clientWidth>0){const cs=getComputedStyle(el);if(cs.overflowX!=='auto'&&cs.overflowX!=='scroll'){bad.push(el.tagName+'.'+(el.className||'').toString().split(' ').slice(0,4).join('.')+' sw='+el.scrollWidth+' cw='+el.clientWidth)}}});return bad.slice(0,12).join(' | ')||'aucun'})()"
echo "--- largeurs tableau ---"
agent-browser eval "(()=>{const t=document.querySelector('table');const w=t?t.parentElement:null;return t?('table='+t.scrollWidth+' wrapper='+w.clientWidth+' wrapScrollW='+w.scrollWidth):'pas de table'})()"
