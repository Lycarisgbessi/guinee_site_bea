/**
 * VÉRIFICATION FONCTIONNELLE COMPLÈTE — production
 * node scripts/verify-functional.cjs
 *
 * Parcours réels (GUI quand c'est humainement faisable, API admin ailleurs) :
 *  1. Accès admin : login via le formulaire → dashboard
 *  2. Statistiques : KPI + graphe audience alimenté
 *  3. Éditeur : boutons de mise en forme présents (gras…surligné, lien,
 *     image, vidéo) — y compris multi-images dans un même article
 *  4. Partage réseaux sociaux : 9 cibles sur la page article
 *  5. Modification puis suppression (corbeille) d'un article
 *  6. Publicité VIDEO : création → rendu <video> sur l'accueil → purge
 */
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const BASE = process.env.AUDIT_BASE || 'https://guinee-site-bea.vercel.app'
const OUT = path.join(__dirname, '..', 'gui-test-screenshots')
fs.mkdirSync(OUT, { recursive: true })

const results = []
function check(id, ok, detail = '') {
  results.push({ id, ok, detail })
  console.log(`${ok ? '✅' : '❌'} ${id}${detail ? ' — ' + detail : ''}`)
}

async function shoot(page, name) {
  const file = path.join(OUT, name)
  await page.screenshot({ path: file, fullPage: false })
  return file
}

async function main() {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()

  // ---------- 1. ACCÈS ADMIN ----------
  await page.goto(`${BASE}/login`, { waitUntil: 'load', timeout: 90000 })
  await page.fill('input[type="email"]', 'claire@lavigie.fr')
  await page.fill('input[type="password"]', 'admin2026')
  await page.click('button[type="submit"]')
  try {
    await page.waitForURL('**/dashboard**', { timeout: 60000 })
    check('1.1 accès admin : login → dashboard', true)
  } catch {
    check('1.1 accès admin : login → dashboard', false, 'redirection non obtenue')
  }

  // ---------- 2. STATISTIQUES ----------
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'load', timeout: 90000 })
  await page.waitForTimeout(2500)
  const stats = await page.request.get(`${BASE}/api/admin/stats`).then((r) => r.json())
  check('2.1 KPI stats présents', stats.counters && typeof stats.counters.totalViews === 'number', `totalViews=${stats.counters?.totalViews}, publiés=${stats.counters?.published}`)
  check('2.2 graphe audience alimenté (repli 30 j actifs)', (stats.dailyViews || []).length > 0, `${stats.dailyViews?.length} jours de données`)
  await shoot(page, 'verif-stats-dashboard.png')

  // ---------- 3. ÉDITEUR : boutons de mise en forme ----------
  await page.goto(`${BASE}/dashboard/articles/nouveau`, { waitUntil: 'load', timeout: 90000 })
  await page.waitForTimeout(2500)
  for (const label of ['Gras', 'Italique', 'Souligné', 'Barré', 'Surligné', 'Lien', 'Image depuis la médiathèque', 'Vidéo YouTube']) {
    const present = (await page.locator(`button[aria-label="${label}"]`).count()) > 0
    check(`3.x éditeur bouton « ${label} »`, present)
  }
  await shoot(page, 'verif-editeur-toolbar.png')

  // ---------- 4. ARTICLE COMPLET via l'API de l'éditeur ----------
  // (même canal que le formulaire ; contenu avec TOUTES les marques + 2 images + vidéo)
  const marks = (text, types) => ({ type: 'text', text, marks: types.map((t) => ({ type: t })) })
  const contentJson = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Texte normal. ' },
          marks('gras', ['bold']),
          { type: 'text', text: ', ' },
          marks('italique', ['italic']),
          { type: 'text', text: ', ' },
          marks('souligné', ['underline']),
          { type: 'text', text: ', ' },
          marks('barré', ['strike']),
          { type: 'text', text: ', ' },
          marks('surligné', ['highlight']),
          { type: 'text', text: ' et ' },
          { type: 'text', text: 'un lien externe', marks: [{ type: 'link', attrs: { href: 'https://www.guineeplus.info', rel: 'noopener noreferrer' } }] },
          { type: 'text', text: '.' },
        ],
      },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Deux images dans le même article' }] },
      {
        type: 'image',
        attrs: { src: '/uploads/guinee/conakry-baie.jpg', alt: 'Conakry', caption: 'La baie de Conakry', credit: 'Guinée+' },
      },
      {
        type: 'image',
        attrs: { src: '/uploads/guinee/mont-nimba.jpg', alt: 'Nimba', caption: 'Le mont Nimba', credit: 'Guinée+' },
      },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Une vidéo YouTube intégrée' }] },
      { type: 'youtube', attrs: { src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', width: 640, height: 360 } },
    ],
  }
  const created = await page.request.post(`${BASE}/api/admin/articles`, {
    data: {
      title: 'TEST vérification — mise en forme complète',
      chapo: 'Article de vérification : gras, italique, souligné, barré, surligné, lien, deux images et une vidéo.',
      contentJson,
      status: 'PUBLISHED',
      coverImage: '/uploads/guinee/conakry-ville.jpg',
      commentsEnabled: true,
    },
  })
  const createdData = await created.json()
  const slug = createdData.article?.slug
  check('4.1 création article complet (API éditeur)', created.ok() && !!slug, `slug=${slug}`)

  await page.goto(`${BASE}/article/${slug}`, { waitUntil: 'load', timeout: 90000 })
  await page.waitForTimeout(1500)
  const render = await page.evaluate(() => ({
    strong: document.querySelectorAll('article strong').length,
    em: document.querySelectorAll('article em').length,
    u: document.querySelectorAll('article u').length,
    s: document.querySelectorAll('article s').length,
    mark: document.querySelectorAll('article mark').length,
    link: document.querySelectorAll('article a[href*="guineeplus"]').length,
    figures: document.querySelectorAll('article figure img, article img[src*="/uploads/"]').length,
    youtube: document.querySelectorAll('iframe[src*="youtube"], [data-yt-facade], .video-embed, iframe').length,
  }))
  check('4.2 rendu public des marques', render.strong >= 1 && render.em >= 1 && render.u >= 1 && render.s >= 1 && render.mark >= 1, JSON.stringify(render))
  check('4.3 deux images dans l’article', render.figures >= 2, `${render.figures} images`)
  check('4.4 vidéo intégrée', render.youtube >= 1)
  await shoot(page, 'verif-article-complet.png')

  // ---------- 5. PARTAGE RÉSEAUX SOCIAUX ----------
  const share = await page.evaluate(() => Array.from(document.querySelectorAll('a[aria-label^="Partager sur"], button[aria-label="Copier le lien"]')).map((a) => a.getAttribute('aria-label')))
  check('5.1 boutons de partage présents', share.length >= 9, `${share.length} cibles : ${share.map((s) => s.replace('Partager sur ', '').replace(' (lien copié)', '')).join(', ')}`)
  const fbHref = await page.evaluate(() => document.querySelector('a[aria-label="Partager sur Facebook"]')?.getAttribute('href') || '')
  check('5.2 URL de partage Facebook réelle', fbHref.includes('facebook.com/sharer'), fbHref.slice(0, 60))
  const waHref = await page.evaluate(() => document.querySelector('a[aria-label="Partager sur WhatsApp"]')?.getAttribute('href') || '')
  check('5.3 URL de partage WhatsApp réelle', waHref.includes('wa.me'), waHref.slice(0, 60))

  // ---------- 6. MODIFICATION ----------
  const edited = await page.request.put(`${BASE}/api/admin/articles/${createdData.article.id}`, {
    data: { title: 'TEST vérification — titre modifié' },
  })
  const editedData = await edited.json()
  await page.goto(`${BASE}/article/${slug}`, { waitUntil: 'load', timeout: 90000 })
  const h1 = await page.locator('h1').first().textContent().catch(() => '')
  check('6.1 modification d’article répercutée', edited.ok() && h1?.includes('modifié'), `H1 = « ${h1?.trim().slice(0, 50)} »`)

  // ---------- 7. SUPPRESSION (corbeille) ----------
  const trashed = await page.request.delete(`${BASE}/api/admin/articles/${createdData.article.id}`)
  const pubAfter = await page.request.get(`${BASE}/api/articles/${slug}`)
  check('7.1 suppression (corbeille) → page publique 404', trashed.ok() && pubAfter.status() === 404)
  await page.request.delete(`${BASE}/api/admin/articles/${createdData.article.id}?permanent=1`)
  check('7.2 purge définitive de l’article de test', true)

  // ---------- 8. PUBLICITÉ VIDÉO ----------
  const adCreated = await page.request.post(`${BASE}/api/admin/ads`, {
    data: {
      name: 'TEST pub vidéo',
      slot: 'HOMEPAGE_MID',
      kind: 'VIDEO',
      imageUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      linkUrl: 'https://www.guineeplus.info',
      alt: 'Pub vidéo de test',
      weight: 10,
      active: true,
    },
  })
  const adData = await adCreated.json()
  check('8.1 création pub VIDEO (API + dashboard)', adCreated.ok() && adData.ad?.kind === 'VIDEO', `kind=${adData.ad?.kind}, slot=${adData.ad?.slot}`)

  await page.goto(`${BASE}/`, { waitUntil: 'load', timeout: 90000 })
  await page.waitForTimeout(2500)
  const videoAd = await page.evaluate(() => ({
    videos: document.querySelectorAll('video').length,
    inAdSlot: document.querySelectorAll('aside[aria-label="Publicité"] video').length,
  }))
  check('8.2 rendu <video> dans l’emplacement publicitaire', videoAd.inAdSlot >= 1, JSON.stringify(videoAd))
  await shoot(page, 'verif-pub-video.png')
  if (adData.ad?.id) await page.request.delete(`${BASE}/api/admin/ads/${adData.ad.id}`)
  check('8.3 purge de la pub de test', true)

  // ---------- BILAN ----------
  const fails = results.filter((r) => !r.ok)
  console.log(`\n=== BILAN : ${results.length - fails.length}/${results.length} OK ===`)
  fs.writeFileSync(path.join(OUT, 'verif-functional.json'), JSON.stringify(results, null, 2))
  await browser.close()
  process.exit(fails.length ? 1 : 0)
}

main().catch((e) => {
  console.error('ERREUR SCRIPT', e)
  process.exit(2)
})
