/**
 * AUDIT RESPONSIVE — Guinée+
 * node scripts/responsive-audit.cjs
 *
 * Pour chaque page × viewport : détection d'overflow horizontal (lecture
 * DOM en lecture seule) + capture d'écran. Dashboard testé après login GUI.
 */
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const BASE = process.env.AUDIT_BASE || 'http://localhost:3000'
const OUT = path.join(__dirname, '..', 'gui-test-screenshots')
fs.mkdirSync(OUT, { recursive: true })

const VIEWPORTS = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablette-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 900 },
]

const PUBLIC_PAGES = [
  ['accueil', '/'],
  ['article', null, 'auto-article'],
  ['rubriques', '/rubriques'],
  ['rubrique', null, 'auto-rubrique'],
  ['videos', '/videos'],
  ['recherche', '/recherche?q=guin'],
  ['archives', '/archives'],
  ['contact', '/contact'],
  ['a-propos', '/a-propos'],
  ['plan-du-site', '/plan-du-site'],
  ['login', '/login'],
]

const DASH_PAGES = [
  ['dash-accueil', '/dashboard'],
  ['dash-articles', '/dashboard/articles'],
  ['dash-editeur', '/dashboard/articles/nouveau'],
  ['dash-medias', '/dashboard/medias'],
  ['dash-parametres', '/dashboard/parametres'],
]

// Lecture seule : overflow horizontal + éléments responsables
async function measure(page) {
  return page.evaluate(() => {
    const doc = document.scrollingElement
    const vw = doc.clientWidth
    const overflow = doc.scrollWidth - vw
    const offenders = []
    if (overflow > 1) {
      const all = Array.from(document.querySelectorAll('*'))
      for (const el of all) {
        const r = el.getBoundingClientRect()
        if (r.width > 0 && (r.right > vw + 1 || r.left < -1)) {
          const cls = typeof el.className === 'string' ? el.className : ''
          offenders.push({
            tag: el.tagName.toLowerCase(),
            cls: cls.slice(0, 70),
            right: Math.round(r.right),
            left: Math.round(r.left),
            w: Math.round(r.width),
          })
        }
      }
    }
    return { vw, sw: doc.scrollWidth, overflow: Math.round(overflow), offenders: offenders.slice(0, 10) }
  })
}

async function shoot(page, id, viewport) {
  const file = path.join(OUT, `${id}_${viewport}.png`)
  await page.screenshot({ path: file })
  return file
}

async function run() {
  const browser = await chromium.launch()
  const results = []
  const consoleErrors = []

  // Slug dynamiques pour article/rubrique réels
  const ctx = await browser.newContext()
  const probe = await ctx.newPage()
  const arts = await probe.request.get(`${BASE}/api/articles?perPage=6`).then((r) => r.json())
  const art = (arts.items || []).find((a) => (a.format || '') !== 'VIDEO') || (arts.items || [])[0]
  const cats = await probe.request.get(`${BASE}/api/categories`).then((r) => r.json())
  const cat = (cats.items || cats || [])[0]
  await ctx.close()

  const pages = [
    ...PUBLIC_PAGES.map(([id, p, auto]) => [
      id,
      auto === 'auto-article' ? `/article/${art?.slug || 'ok'}` : auto === 'auto-rubrique' ? `/rubrique/${cat?.slug || 'politique'}` : p,
    ]),
  ]

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
    const page = await context.newPage()
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(`[${vp.name}] ${msg.text().slice(0, 140)}`)
    })

    // ---- Pages publiques ----
    for (const [id, url] of pages) {
      try {
        await page.goto(BASE + url, { waitUntil: 'load', timeout: 90000 })
        await page.waitForTimeout(600)
        const m = await measure(page)
        const file = await shoot(page, id, vp.name)
        results.push({ id, vp: vp.name, ...m, file, url })
        console.log(`${id.padEnd(16)} ${vp.name.padEnd(14)} overflow=${m.overflow}px ${m.overflow > 1 ? '⚠ ' + JSON.stringify(m.offenders.slice(0, 3)) : 'OK'}`)
      } catch (e) {
        results.push({ id, vp: vp.name, error: String(e).slice(0, 120) })
        console.log(`${id} ${vp.name} ERREUR ${String(e).slice(0, 100)}`)
      }
    }

    // ---- Login GUI puis dashboard ----
    if (vp.name !== 'desktop-1440') {
      // dashboard surtout critique en mobile/tablette ; desktop inclus quand même en mobile run unique
    }
    try {
      await page.goto(`${BASE}/login`, { waitUntil: 'load', timeout: 90000 })
      await page.fill('input[type="email"], input[name="email"]', 'claire@lavigie.fr')
      await page.fill('input[type="password"], input[name="password"]', 'admin2026')
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard**', { timeout: 60000 })
      for (const [id, url] of DASH_PAGES) {
        try {
          await page.goto(BASE + url, { waitUntil: 'load', timeout: 90000 })
          await page.waitForTimeout(900)
          const m = await measure(page)
          const file = await shoot(page, id, vp.name)
          results.push({ id, vp: vp.name, ...m, file, url })
          console.log(`${id.padEnd(16)} ${vp.name.padEnd(14)} overflow=${m.overflow}px ${m.overflow > 1 ? '⚠ ' + JSON.stringify(m.offenders.slice(0, 3)) : 'OK'}`)
        } catch (e) {
          console.log(`${id} ${vp.name} ERREUR ${String(e).slice(0, 100)}`)
        }
      }
    } catch (e) {
      console.log(`login/dashboard ${vp.name} ERREUR ${String(e).slice(0, 120)}`)
    }
    await context.close()
  }

  fs.writeFileSync(path.join(OUT, 'resultats.json'), JSON.stringify({ results, consoleErrors }, null, 2))
  const nOverflow = results.filter((r) => (r.overflow || 0) > 1).length
  console.log(`\n=== BILAN : ${results.length} captures, ${nOverflow} avec overflow, ${consoleErrors.length} erreurs console ===`)
  await browser.close()
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
