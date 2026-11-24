/**
 * SEED MAIN — plateforme média « La Vigie »
 * bun scripts/seed.ts
 */
import { doc, p, pic, daysAgo, db, bcrypt, textFrom } from './seed-helpers'
import { ARTICLES } from './seed-articles'

const words = (s: string) => s.trim().split(/\s+/).length
const minutes = (s: string) => Math.max(2, Math.round(words(s) / 200))

async function main() {
  console.log('🌱 Nettoyage des tables…')
  await db.activityLog.deleteMany()
  await db.articleVersion.deleteMany()
  await db.articleView.deleteMany()
  await db.comment.deleteMany()
  await db.contactMessage.deleteMany()
  await db.newsletterSubscriber.deleteMany()
  await db.redirect.deleteMany()
  await db.articleCategory.deleteMany()
  await db.articleTag.deleteMany()
  await db.article.deleteMany()
  await db.tag.deleteMany()
  await db.category.deleteMany()
  await db.media.deleteMany()
  await db.page.deleteMany()
  await db.homepageBlock.deleteMany()
  await db.siteSetting.deleteMany()
  await db.user.deleteMany()

  // ---------- Utilisateur administrateur ----------
  console.log('👤 Administrateur…')
  const admin = await db.user.create({
    data: {
      name: 'Claire Vasseur',
      email: 'claire@lavigie.fr',
      password: await bcrypt.hash('admin2026', 10),
      role: 'ADMIN',
      bio: 'Journaliste indépendante, spécialiste des questions sociales et environnementales. Fondatrice de La Vigie.',
      avatar: pic('claire-portrait', 400, 400),
    },
  })

  // ---------- Rubriques ----------
  console.log('🗂 Rubriques…')
  const cats: Record<string, { id: string }> = {}
  const catDefs = [
    ['Politique', 'politique', 'Pouvoirs, institutions, débats citoyens : la vie politique décryptée sans langue de bois.', '#2C4A7C', 0],
    ['International', 'international', 'Reportages et analyses sur les grands enjeux du monde, du Sahel aux Balkans.', '#8A5A0F', 1],
    ['Société', 'societe', 'Éducation, santé, transports : au plus près des vies ordinaires.', '#7A2048', 2],
    ['Culture & Médias', 'culture', 'Théâtre, littérature, industrie médiatique : la création sous toutes ses formes.', '#5B3A7E', 3],
    ['Environnement', 'environnement', 'Climat, eau, énergie, biodiversité : les transitions racontées sur le terrain.', '#1F5F4A', 4],
    ['Sciences & Tech', 'sciences-tech', 'Intelligence artificielle, recherche, innovation : comprendre la technologie pour ne pas la subir.', '#33556B', 5],
  ] as const
  for (const [name, s, description, color, order] of catDefs) {
    const c = await db.category.create({
      data: { name, slug: s, description, color, order, coverImage: pic(`cat-${s}`, 1200, 800) },
    })
    cats[s] = { id: c.id }
  }

  // ---------- Tags ----------
  console.log('🏷 Tags…')
  const tags: Record<string, { id: string }> = {}
  for (const name of ['Enquête', 'Reportage', 'Entretien', 'Europe', 'Climat', 'Éducation', 'Culture', 'Intelligence artificielle', 'Transports', 'Santé']) {
    const t = await db.tag.create({
      data: {
        name,
        slug: name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-'),
      },
    })
    tags[name] = { id: t.id }
  }

  // ---------- Articles ----------
  console.log('📝 Articles…')
  const created: { id: string; slug: string; status: string; publishedAt: Date | null }[] = []
  for (const a of ARTICLES) {
    const fullText = textFrom(a.content as never)
    const isPublished = a.status === 'PUBLISHED'
    const art = await db.article.create({
      data: {
        title: a.title,
        slug: a.slug,
        subtitle: a.subtitle,
        chapo: a.chapo,
        contentJson: JSON.stringify(doc(...(a.content as never))),
        contentText: fullText,
        format: a.format,
        status: a.status ?? 'DRAFT',
        publishedAt: a.publishedAt ?? (a.status === 'PUBLISHED' ? daysAgo(7) : null),
        scheduledAt: a.scheduledAt,
        authorId: admin.id,
        coverImage: a.cover,
        coverCredit: a.coverCredit,
        seoTitle: a.title,
        seoDescription: a.chapo?.slice(0, 155),
        readingTime: minutes(fullText),
        featured: a.featured ?? false,
        commentsEnabled: true,
      },
    })
    created.push({ id: art.id, slug: art.slug, status: art.status, publishedAt: art.publishedAt })

    await db.articleCategory.create({
      data: { articleId: art.id, categoryId: cats[a.category === 'tech' ? 'sciences-tech' : a.category].id },
    })
    for (const t of a.tagList) {
      if (tags[t]) await db.articleTag.create({ data: { articleId: art.id, tagId: tags[t].id } })
    }
    if (isPublished) {
      await db.articleVersion.create({
        data: { articleId: art.id, title: a.title, contentJson: JSON.stringify(doc(...(a.content as never))), editorId: admin.id },
      })
    }
    if (a.comments?.length) {
      for (const c of a.comments) {
        await db.comment.create({ data: { articleId: art.id, ...c } })
      }
    }
  }
  console.log(`   ${created.length} articles`)

  // ---------- Vues quotidiennes (21 jours) ----------
  console.log('📈 Statistiques de vues…')
  for (const art of created) {
    if (art.status !== 'PUBLISHED' || !art.publishedAt) continue
    const publishedDaysAgo = Math.floor((Date.now() - art.publishedAt.getTime()) / 86400000)
    const article = await db.article.findUnique({ where: { id: art.id }, select: { contentText: true } })
    const base = Math.round(words(article?.contentText ?? '') * (0.8 + Math.random() * 1.6)) + 120
    let total = 0
    for (let d = 0; d <= publishedDaysAgo && d < 21; d++) {
      const decay = Math.max(0.12, 1 - d / 18)
      const dayDate = new Date(Date.now() - d * 86400000)
      const weekendBoost = [0, 6].includes(dayDate.getDay()) ? 1.25 : 1
      const count = Math.max(0, Math.round(base * decay * weekendBoost * (0.7 + Math.random() * 0.6)))
      if (count <= 0) continue
      total += count
      await db.articleView.create({ data: { articleId: art.id, date: dayDate.toISOString().slice(0, 10), count } })
    }
    await db.article.update({ where: { id: art.id }, data: { views: total } })
  }

  // ---------- Messages de contact ----------
  console.log('📨 Messages…')
  await db.contactMessage.createMany({
    data: [
      { name: 'Rémi Fontaine', email: 'remi.fontaine@exemple.fr', subject: 'Erreur dans l’article sur le train de nuit', message: 'Bonjour, dans votre article, l’horaire d’arrivée à Nice semble être 9h21 et non 9h12. Bonne journée.', status: 'UNREAD' },
      { name: 'Aïcha Ben Amor', email: 'aicha.benamor@exemple.fr', subject: 'Proposition de sujet — les déserts médicaux ruraux', message: 'Bonjour, je suis infirmière en Ardèche. Je souhaite vous proposer un sujet : la fermeture annoncée du seul cabinet médical de notre canton, et ses conséquences pour 3 500 habitants. J’ai des témoignages et des photos.', isTip: true, status: 'READ' },
      { name: 'Pierre Vasquez', email: 'p.vasquez@exemple.fr', subject: 'Partenariat podcast', message: 'Bonjour, nous produisons un podcast d’histoire locale et aimerions explorer un partenariat avec votre rédaction. Pouvons-nous convenir d’un échange ?', status: 'DONE' },
    ],
  })

  // ---------- Newsletter ----------
  console.log('📬 Newsletter…')
  await db.newsletterSubscriber.createMany({
    data: [
      { email: 'marie.dupont@example.fr', status: 'CONFIRMED', token: 'tok-marie-2026', confirmedAt: daysAgo(30) },
      { email: 'louis.moreau@example.fr', status: 'CONFIRMED', token: 'tok-louis-2026', confirmedAt: daysAgo(22) },
      { email: 'fatou.sow@example.fr', status: 'PENDING', token: 'tok-fatou-2026' },
      { email: 'gerard.martin@example.fr', status: 'PENDING', token: 'tok-gerard-2026' },
      { email: 'nina.rossi@example.fr', status: 'UNSUBSCRIBED', token: 'tok-nina-2026' },
    ],
  })

  // ---------- Médiathèque ----------
  console.log('🖼 Médiathèque…')
  const mediaSeeds = [
    { url: pic('cevennes-riviere', 1600, 900), filename: 'cevennes-riviere.jpg', alt: 'Rivière des Cévennes en été', caption: 'La rivière n’a plus que 40 cm de profondeur', credit: 'Léa Marchand / La Vigie' },
    { url: pic('cevennes-fontaine', 1400, 900), filename: 'cevennes-fontaine.jpg', alt: 'Fontaine communale', caption: 'Les habitants se relaient à la fontaine', credit: 'Léa Marchand / La Vigie' },
    { url: pic('assemblee-retraites', 1600, 900), filename: 'assemblee.jpg', alt: 'Hémicycle parlementaire', caption: 'Le texte transmis au CESE', credit: 'Julien Perret / La Vigie' },
    { url: pic('theatre-plateau', 1400, 900), filename: 'theatre.jpg', alt: 'Répétition de théâtre', caption: 'Création d’ouverture de saison', credit: 'Marc Ollivier / La Vigie' },
    { url: pic('fleuve-sahel-une', 1600, 900), filename: 'fleuve.jpg', alt: 'Fleuve du Sahel à l’aube', caption: 'Quatre mois au fil de l’eau', credit: 'Isaac Touré / La Vigie' },
    { url: pic('cour-verte-ecole', 1400, 900), filename: 'cour-ecole.jpg', alt: 'Cour d’école végétalisée', caption: 'Îlot de fraîcheur scolaire', credit: 'La Vigie' },
    { url: pic('cat-politique', 800, 600), filename: 'cat-politique.jpg', alt: 'Couverture rubrique Politique', caption: '', credit: '' },
    { url: pic('cat-environnement', 800, 600), filename: 'cat-environnement.jpg', alt: 'Couverture rubrique Environnement', caption: '', credit: '' },
  ]
  for (const m of mediaSeeds) {
    await db.media.create({ data: { ...m, type: 'IMAGE', size: 420000, width: 1400, height: 900, uploadedById: admin.id } })
  }

  // ---------- Pages statiques ----------
  console.log('📄 Pages…')
  await db.page.create({
    data: {
      slug: 'a-propos',
      title: 'À propos de La Vigie',
      heroImage: pic('a-propos-hero', 1800, 900),
      seoTitle: 'À propos — La Vigie, média indépendant',
      seoDescription: 'La Vigie est un média digital indépendant fondé en 2024 par la journaliste Claire Vasseur. Ligne éditoriale, équipe, distinctions.',
      contentJson: JSON.stringify(
        doc(
          p('La Vigie est née en 2024 d’un constat simple : les histoires qui comptent ont besoin de temps. Temps d’observation, temps d’entretien, temps d’écriture. Nous publions peu — mais nous publions vérifié, sourcé, et écrit pour durer.'),
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Notre ligne éditoriale' }] },
          p('Trois convictions guident chacun de nos articles. D’abord, le terrain d’abord : pas d’article sans déplacement, sans rencontre, sans voix directes. Ensuite, l’exigence du format long : nous croyons que la complexité du monde mérite mieux que des résumés de trois paragraphes. Enfin, l’indépendance économique : La Vigie est financée par ses lecteurs, sans publicité ni actionnaire.'),
          { type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Un média qui ne doit rien à personne ne doit tout qu’au lecteur.', marks: [{ type: 'italic' }] }] }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'La fondatrice' }] },
          p('Claire Vasseur, journaliste depuis quinze ans, a travaillé pour la presse quotidienne régionale puis pour plusieurs médias en ligne avant de fonder La Vigie. Spécialiste des questions sociales et environnementales, elle a été distinguée à deux reprises pour ses reportages de terrain.'),
          { type: 'image', attrs: { src: pic('claire-portrait-hd', 1200, 800), alt: 'Claire Vasseur, fondatrice de La Vigie', caption: 'Claire Vasseur, fondatrice et rédactrice en chef.', credit: 'La Vigie' } },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Distinctions' }] },
          { type: 'bulletList', content: [
            { type: 'listItem', content: [p('2025 — Prix du reportage territorial pour « Eau : la source qui doit dompter un tourisme hors sol ».')] },
            { type: 'listItem', content: [p('2024 — Mention spéciale du jury, festival journalisme et numérique, pour le format « portfolios sonores ».')] },
            { type: 'listItem', content: [p('2024 — Lauréate du dispositif d’appui à la création de médias indépendants.')] },
          ] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Nous écrire' }] },
          p('Une erreur à signaler, un sujet à proposer, une envie de collaboration ? Rendez-vous sur la page contact — nous lisons tout, et nous répondons sous 48 heures ouvrées.'),
        )
      ),
      published: true,
      system: true,
    },
  })
  await db.page.create({
    data: {
      slug: 'mentions-legales',
      title: 'Mentions légales',
      seoTitle: 'Mentions légales — La Vigie',
      contentJson: JSON.stringify(
        doc(
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Éditeur du site' }] },
          p('La Vigie — Média indépendant. Siège social : 12 rue des Archives, 75003 Paris. Directrice de la publication : Claire Vasseur. Contact : redaction@lavigie.fr.'),
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Hébergement' }] },
          p('Le site est hébergé sur une infrastructure cloud européenne. Les données sont chiffrées en transit (HTTPS) et sauvegardées quotidiennement.'),
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Propriété intellectuelle' }] },
          p('L’ensemble des contenus (textes, photographies, vidéos) est protégé par le droit d’auteur. Toute reproduction, même partielle, sans autorisation écrite préalable est interdite. Les demandes de reprise peuvent être adressées à la rédaction.'),
        )
      ),
      published: true,
      system: true,
    },
  })
  await db.page.create({
    data: {
      slug: 'politique-de-confidentialite',
      title: 'Politique de confidentialité',
      seoTitle: 'Politique de confidentialité — La Vigie',
      contentJson: JSON.stringify(
        doc(
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Données collectées' }] },
          p('La Vigie collecte le minimum de données nécessaires : adresse email pour la newsletter (avec consentement explicite et double opt-in), nom et email pour les commentaires et le formulaire de contact, et des statistiques de fréquentation anonymisées et respectueuses de la vie privée, sans cookies publicitaires.'),
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Vos droits (RGPD)' }] },
          p('Conformément au RGPD, vous disposez d’un droit d’accès, de rectification, d’effacement et de portabilité de vos données. Pour exercer ces droits, écrivez à redaction@lavigie.fr : nous répondons sous 30 jours maximum. Les abonnés à la newsletter peuvent se désinscrire en un clic depuis chaque envoi.'),
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Conservation' }] },
          p('Les commentaires sont conservés tant que l’article correspondant est en ligne. Les messages de contact sont supprimés après 24 mois. Les données de statistiques sont conservées sous forme agrégée et anonyme.'),
        )
      ),
      published: true,
      system: true,
    },
  })
  console.log('   3 pages')

  // ---------- Configuration de la page d'accueil ----------
  console.log('🏠 Config accueil…')
  await db.homepageBlock.createMany({
    data: [
      { blockType: 'HERO_UNE', order: 0, active: true, configJson: JSON.stringify({ secondaryCount: 4 }) },
      { blockType: 'FIL_ACTU', order: 1, active: true, configJson: JSON.stringify({ count: 6, title: 'L’actualité du moment' }) },
      { blockType: 'REPORTAGES_PHARES', order: 2, active: true, configJson: JSON.stringify({ count: 3, title: 'Reportages phares' }) },
      { blockType: 'RUBRIQUE_STRIP', order: 3, active: true, configJson: JSON.stringify({ categorySlug: 'environnement', title: 'Derniers reportages Environnement' }) },
      { blockType: 'CITATION', order: 4, active: true, configJson: JSON.stringify({}) },
      { blockType: 'RUBRIQUE_STRIP', order: 5, active: true, configJson: JSON.stringify({ categorySlug: 'culture', title: 'À la une Culture & Médias' }) },
      { blockType: 'NEWSLETTER', order: 6, active: true, configJson: JSON.stringify({}) },
    ],
  })

  // ---------- Redirection (exemple §6.9) ----------
  await db.redirect.create({
    data: { fromPath: '/article/eau-cevennes', toPath: '/article/eau-cevennes-source-tourisme-hors-sol', statusCode: 301 },
  })

  // ---------- Journal d’activité ----------
  await db.activityLog.createMany({
    data: [
      { userId: admin.id, action: 'SEED', target: 'database', detail: 'Initialisation du contenu de démonstration' },
      { userId: admin.id, action: 'ARTICLE_PUBLISH', target: 'eau-cevennes-source-tourisme-hors-sol', detail: 'Publication du reportage à la une' },
    ],
  })

  console.log('✅ Seed terminé. Admin : claire@lavigie.fr / admin2026')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
