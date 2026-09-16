// Migration éditoriale Guinée+ : articles, rubriques, tags, pages CMS, réglages, médiathèque
// Usage : bun scripts/guinee-migrate.js
import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { PrismaClient } from '@prisma/client'
import { articles1 } from './guinee-data-part1.js'
import { articles2, categories, tags, tagLinks, pages, settingsUpdates } from './guinee-data-part2.js'

const db = new PrismaClient()
const articles = [...articles1, ...articles2]

/** Extrait le texte brut d'un doc Tiptap */
function docToText(node, out = []) {
  if (!node) return out
  if (node.type === 'text' && node.text) out.push(node.text)
  for (const c of node.content ?? []) docToText(c, out)
  return out
}
const textOf = (docNode) =>
  docNode.content
    ?.map((block) => docToText(block).join(' '))
    .filter(Boolean)
    .join('\n\n') ?? ''

async function main() {
  const admin = await db.user.findFirst({ where: { role: 'ADMIN' } })
  if (!admin) throw new Error('Aucun admin trouvé')

  console.log('== 1. RUBRIQUES ==')
  const slugMap = {}
  for (const { find, data } of categories) {
    const cat = await db.category.findUnique({ where: { slug: find } })
    if (!cat) {
      console.log('  !! rubrique introuvable :', find)
      continue
    }
    const newSlug = data.slug ?? find
    slugMap[find] = newSlug
    await db.category.update({ where: { id: cat.id }, data: { ...data, slug: newSlug } })
    console.log(`  OK ${find} → ${newSlug} (${data.name})`)
  }

  console.log('== 2. TAGS ==')
  await db.articleTag.deleteMany()
  await db.tag.deleteMany()
  const tagIds = {}
  for (const name of tags) {
    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')
    const t = await db.tag.create({ data: { name, slug } })
    tagIds[name] = t.id
  }
  console.log(`  OK ${tags.length} tags recréés`)

  console.log('== 3. ARTICLES ==')
  for (const { find, data } of articles) {
    let existing = await db.article.findUnique({ where: { slug: data.slug } })
    if (!existing && find) {
      existing = await db.article.findFirst({ where: { slug: { startsWith: find.slice(0, 30) } } })
      if (!existing) existing = await db.article.findUnique({ where: { slug: find } })
    }
    const contentJson = JSON.stringify(data.content)
    const contentText = textOf(data.content)
    const payload = {
      slug: data.slug,
      title: data.title,
      subtitle: data.subtitle,
      chapo: data.chapo,
      contentJson,
      contentText,
      format: data.format,
      coverImage: data.coverImage,
      coverCredit: data.coverCredit,
      ogImage: data.coverImage,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      readingTime: data.readingTime,
      featured: data.featured,
    }
    let art
    if (existing) {
      art = await db.article.update({ where: { id: existing.id }, data: payload })
      await db.articleCategory.deleteMany({ where: { articleId: art.id } })
      console.log(`  OK maj ${data.slug}`)
    } else {
      art = await db.article.create({
        data: {
          ...payload,
          status: 'PUBLISHED',
          publishedAt: find === null ? new Date() : new Date(Date.now() - 86400000),
          authorId: admin.id,
        },
      })
      console.log(`  OK création ${data.slug}`)
    }
    // Rubrique
    const cat = await db.category.findUnique({ where: { slug: data.catSlug } })
    if (cat) await db.articleCategory.create({ data: { articleId: art.id, categoryId: cat.id } })
    else console.log(`  !! rubrique manquante pour ${data.slug} : ${data.catSlug}`)
    // Tags
    for (const tagName of tagLinks[data.slug] ?? data.tags ?? []) {
      const tid = tagIds[tagName]
      if (tid) await db.articleTag.create({ data: { articleId: art.id, tagId: tid } })
    }
  }

  console.log('== 4. PAGES CMS ==')
  for (const [slug, pg] of Object.entries(pages)) {
    const existing = await db.page.findUnique({ where: { slug } })
    const payload = {
      title: pg.title,
      contentJson: JSON.stringify(pg.content),
      contentText: textOf(pg.content),
      heroImage: pg.heroImage ?? null,
      seoTitle: pg.seoTitle ?? pg.title,
      seoDescription: pg.seoDescription ?? null,
      published: true,
    }
    if (existing) await db.page.update({ where: { slug }, data: payload })
    else await db.page.create({ data: { slug, system: true, ...payload } })
    console.log('  OK page', slug)
  }

  console.log('== 5. REGLAGES ==')
  for (const [key, value] of Object.entries(settingsUpdates)) {
    await db.siteSetting.upsert({ where: { key }, create: { key, value }, update: { value } })
    console.log(`  OK ${key} = ${value.slice(0, 50)}`)
  }

  console.log('== 6. BLOCS ACCUEIL (slugs de rubriques) ==')
  const blocks = await db.homepageBlock.findMany()
  for (const b of blocks) {
    if (b.blockType !== 'RUBRIQUE_STRIP') continue
    const cfg = JSON.parse(b.configJson || '{}')
    const mapped = slugMap[cfg.categorySlug]
    if (mapped && mapped !== cfg.categorySlug) {
      cfg.categorySlug = mapped
      await db.homepageBlock.update({ where: { id: b.id }, data: { configJson: JSON.stringify(cfg) } })
      console.log(`  OK bloc ${b.id} : ${cfg.title ?? ''} → ${mapped}`)
    } else {
      console.log(`  -- bloc ${b.id} inchangé (${cfg.categorySlug ?? 'aucun'})`)
    }
    if (b.blockType === 'CITATION') console.log('  cfg CITATION :', b.configJson)
  }

  console.log('== 7. MEDIATHEQUE ==')
  await db.media.deleteMany({ where: { url: { contains: 'picsum.photos' } } })
  const dir = join(process.cwd(), 'public', 'uploads', 'guinee')
  const dims = {
    'bauxite-b.jpg': [1800, 1012], 'bauxite-c.jpg': [1800, 1200],
    'fouta-djallon.jpg': [1800, 1350], 'fouta-cascade.jpg': [1800, 1200],
    'mont-nimba.jpg': [1600, 1067], 'mont-nimba-2.jpg': [1280, 963],
    'rue-conakry.jpg': [1200, 800], 'marche-2.jpg': [1200, 1200],
    'marche-femmes.jpg': [1200, 800], 'plage-guinee.jpg': [1440, 1080],
    'ecole-classe.jpg': [1800, 1200], 'foot-stade.jpg': [1800, 1012],
    'peche-pirogues.jpg': [1280, 720], 'musique-balafon.jpg': [1280, 720],
    'tissu-wax.jpg': [1800, 1399], 'mosquee-conakry.jpg': [1800, 1350],
    'mosquee-conakry-2.jpg': [1199, 800],
  }
  const alts = {
    'bauxite-b.jpg': 'Bulldozers dans une carrière de bauxite à la terre rouge (illustration)',
    'bauxite-c.jpg': 'Mine à ciel ouvert (illustration)',
    'fouta-djallon.jpg': 'Falaises et plateaux du Fouta Djallon',
    'fouta-cascade.jpg': 'Savane et village au pied d’une falaise en Guinée',
    'mont-nimba.jpg': 'Savane arborée brumeuse, région du Mont Nimba',
    'mont-nimba-2.jpg': 'Collines verdoyantes de la Guinée forestière (illustration)',
    'rue-conakry.jpg': 'Avenue animée de Conakry, trafic et immeubles',
    'marche-2.jpg': 'Marché guinéen aux parasols colorés (illustration)',
    'marche-femmes.jpg': 'Marchandes de légumes sur un marché ouest-africain (illustration)',
    'plage-guinee.jpg': 'Plage tropicale et cocotiers, archipel des Îles de Los (illustration)',
    'ecole-classe.jpg': 'Écolier souriant en classe (illustration)',
    'foot-stade.jpg': 'Joueuses de football célébrant un but (illustration)',
    'peche-pirogues.jpg': 'Pirogue de pêche peinte sur une plage de la côte guinéenne',
    'musique-balafon.jpg': 'Balafoniste en concert',
    'tissu-wax.jpg': 'Rouleaux de tissus wax colorés',
    'mosquee-conakry.jpg': 'Le Palais du Peuple de Conakry',
    'mosquee-conakry-2.jpg': 'Intérieur de la mosquée Mohammed VI de Conakry',
  }
  let n = 0
  for (const [filename, [w, h]] of Object.entries(dims)) {
    let size = null
    try { size = statSync(join(dir, filename)).size } catch { /* absent */ }
    const url = `/uploads/guinee/${filename}`
    const existingMedia = await db.media.findFirst({ where: { url } })
    const base = {
      url,
      filename,
      type: 'IMAGE',
      size,
      width: w,
      height: h,
      alt: alts[filename] ?? filename,
      credit: 'Bibliothèque Guinée+',
    }
    if (existingMedia) await db.media.update({ where: { id: existingMedia.id }, data: base })
    else await db.media.create({ data: { ...base, uploadedById: admin.id } })
    n++
  }
  console.log(`  OK ${n} médias guinéens dans la bibliothèque`)

  console.log('== 8. CONTROLES ==')
  const counts = {
    articles: await db.article.count(),
    rubriques: await db.category.count(),
    tags: await db.tag.count(),
    medias: await db.media.count(),
    pages: await db.page.count(),
  }
  console.log('  ', JSON.stringify(counts))
  const oldFr = await db.article.count({ where: { OR: [{ title: { contains: 'France' } }, { coverImage: { contains: 'picsum' } }] } })
  console.log('  Articles avec traces françaises/picsum :', oldFr)
}

main()
  .catch((e) => { console.error('ERREUR:', e); process.exit(1) })
  .finally(() => db.$disconnect())
