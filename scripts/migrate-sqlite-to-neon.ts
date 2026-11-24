/// <reference types="bun-types" />
/**
 * MIGRATION DONNÉES — SQLite → PostgreSQL (Neon)
 * ================================================
 * bun scripts/migrate-sqlite-to-neon.ts [chemin/vers/custom.db]
 *
 * Lit l'ancienne base SQLite (par défaut prisma/custom.db — le contenu réel
 * du site) et copie TOUT dans la base pointée par DATABASE_URL (PostgreSQL
 * local Docker ou Neon). La base cible est vidée avant copie → script
 * idempotent, relançable sans risque.
 *
 * Prérequis : DATABASE_URL/DIRECT_URL pointent vers la base Postgres cible,
 * et le schéma y a été appliqué (npm run db:push ou db:migrate).
 */
import { Database } from 'bun:sqlite'
import { PrismaClient } from '@prisma/client'

const sqlitePath = process.argv[2] || 'prisma/custom.db'
const sqlite = new Database(sqlitePath, { readonly: true })
const db = new PrismaClient()

const rows = (table: string): Record<string, unknown>[] =>
  sqlite.query(`SELECT * FROM "${table}"`).all() as Record<string, unknown>[]

const d = (v: unknown): Date | null => (v == null ? null : new Date(v as string))
const b = (v: unknown): boolean => v === 1 || v === true
const s = (v: unknown): string | null => (v == null ? null : String(v))
const n = (v: unknown): number | null => (v == null ? null : Number(v))

async function main() {
  const counts = <T extends Record<string, unknown>>(t: string) => rows(t).length
  console.log(`📖 Lecture de ${sqlitePath}`)
  for (const t of ['User', 'Category', 'Article', 'Media', 'Page', 'Comment', 'Ad']) {
    console.log(`   ${t}: ${counts(t)} lignes`)
  }

  console.log('🧹 Vidage de la base cible (ordre inverse des dépendances)…')
  await db.articleViewMonthly.deleteMany()
  await db.articleView.deleteMany()
  await db.ad.deleteMany()
  await db.redirect.deleteMany()
  await db.activityLog.deleteMany()
  await db.articleVersion.deleteMany()
  await db.siteSetting.deleteMany()
  await db.newsletterSubscriber.deleteMany()
  await db.contactMessage.deleteMany()
  await db.comment.deleteMany()
  await db.homepageBlock.deleteMany()
  await db.page.deleteMany()
  await db.media.deleteMany()
  await db.articleTag.deleteMany()
  await db.articleCategory.deleteMany()
  await db.tag.deleteMany()
  await db.article.deleteMany()
  await db.category.deleteMany()
  await db.user.deleteMany()

  console.log('👥 Users…')
  for (const r of rows('User')) {
    await db.user.create({
      data: {
        id: String(r.id), name: String(r.name), email: String(r.email), password: String(r.password),
        role: String(r.role ?? 'ADMIN'), avatar: s(r.avatar), bio: s(r.bio), status: String(r.status ?? 'ACTIF'),
        createdAt: d(r.createdAt) ?? new Date(), updatedAt: d(r.updatedAt) ?? new Date(),
      },
    })
  }

  console.log('🗂 Categories…')
  for (const r of rows('Category')) {
    await db.category.create({
      data: {
        id: String(r.id), name: String(r.name), slug: String(r.slug), description: s(r.description),
        coverImage: s(r.coverImage), color: s(r.color), order: Number(r.order ?? 0), visible: b(r.visible),
        parentId: s(r.parentId), createdAt: d(r.createdAt) ?? new Date(), updatedAt: d(r.updatedAt) ?? new Date(),
      },
    })
  }

  console.log('🏷 Tags…')
  for (const r of rows('Tag')) {
    await db.tag.create({
      data: { id: String(r.id), name: String(r.name), slug: String(r.slug), createdAt: d(r.createdAt) ?? new Date() },
    })
  }

  console.log('📰 Articles…')
  for (const r of rows('Article')) {
    await db.article.create({
      data: {
        id: String(r.id), title: String(r.title), slug: String(r.slug), subtitle: s(r.subtitle), chapo: s(r.chapo),
        contentJson: String(r.contentJson ?? '{}'), contentText: String(r.contentText ?? ''),
        format: String(r.format ?? 'ARTICLE'), status: String(r.status ?? 'DRAFT'),
        publishedAt: d(r.publishedAt), scheduledAt: d(r.scheduledAt), authorId: String(r.authorId),
        coverImage: s(r.coverImage), coverCredit: s(r.coverCredit), youtubeUrl: s(r.youtubeUrl),
        seoTitle: s(r.seoTitle), seoDescription: s(r.seoDescription), ogImage: s(r.ogImage),
        readingTime: Number(r.readingTime ?? 1), views: Number(r.views ?? 0), featured: b(r.featured),
        commentsEnabled: b(r.commentsEnabled), deletedAt: d(r.deletedAt),
        createdAt: d(r.createdAt) ?? new Date(), updatedAt: d(r.updatedAt) ?? new Date(),
      },
    })
  }

  console.log('🔗 Liaisons rubriques/tags…')
  for (const r of rows('ArticleCategory')) {
    await db.articleCategory.create({ data: { articleId: String(r.articleId), categoryId: String(r.categoryId) } })
  }
  for (const r of rows('ArticleTag')) {
    await db.articleTag.create({ data: { articleId: String(r.articleId), tagId: String(r.tagId) } })
  }

  console.log('🖼 Médias…')
  for (const r of rows('Media')) {
    await db.media.create({
      data: {
        id: String(r.id), url: String(r.url), filename: String(r.filename), type: String(r.type ?? 'IMAGE'),
        size: n(r.size), width: n(r.width), height: n(r.height), alt: s(r.alt), caption: s(r.caption),
        credit: s(r.credit), uploadedById: s(r.uploadedById), createdAt: d(r.createdAt) ?? new Date(),
        updatedAt: d(r.updatedAt) ?? new Date(),
      },
    })
  }

  console.log('📄 Pages…')
  for (const r of rows('Page')) {
    await db.page.create({
      data: {
        id: String(r.id), slug: String(r.slug), title: String(r.title), contentJson: String(r.contentJson ?? '{}'),
        contentText: String(r.contentText ?? ''), heroImage: s(r.heroImage), seoTitle: s(r.seoTitle),
        seoDescription: s(r.seoDescription), published: b(r.published), system: b(r.system),
        createdAt: d(r.createdAt) ?? new Date(), updatedAt: d(r.updatedAt) ?? new Date(),
      },
    })
  }

  console.log('🏠 Blocs accueil…')
  for (const r of rows('HomepageBlock')) {
    await db.homepageBlock.create({
      data: {
        id: String(r.id), blockType: String(r.blockType), order: Number(r.order ?? 0), active: b(r.active),
        configJson: String(r.configJson ?? '{}'),
      },
    })
  }

  console.log('💬 Commentaires, messages, newsletter…')
  for (const r of rows('Comment')) {
    await db.comment.create({
      data: {
        id: String(r.id), articleId: String(r.articleId), authorName: String(r.authorName), email: String(r.email),
        content: String(r.content), status: String(r.status ?? 'PENDING'), createdAt: d(r.createdAt) ?? new Date(),
      },
    })
  }
  for (const r of rows('ContactMessage')) {
    await db.contactMessage.create({
      data: {
        id: String(r.id), name: String(r.name), email: String(r.email), subject: String(r.subject),
        message: String(r.message), isTip: b(r.isTip), status: String(r.status ?? 'UNREAD'),
        createdAt: d(r.createdAt) ?? new Date(),
      },
    })
  }
  for (const r of rows('NewsletterSubscriber')) {
    await db.newsletterSubscriber.create({
      data: {
        id: String(r.id), email: String(r.email), status: String(r.status ?? 'PENDING'), token: String(r.token),
        confirmedAt: d(r.confirmedAt), createdAt: d(r.createdAt) ?? new Date(),
      },
    })
  }

  console.log('⚙️ Réglages…')
  for (const r of rows('SiteSetting')) {
    await db.siteSetting.create({ data: { key: String(r.key), value: String(r.value) } })
  }

  console.log('🕘 Versions, journal, redirections…')
  for (const r of rows('ArticleVersion')) {
    await db.articleVersion.create({
      data: {
        id: String(r.id), articleId: String(r.articleId), title: String(r.title),
        contentJson: String(r.contentJson ?? '{}'), editorId: s(r.editorId), createdAt: d(r.createdAt) ?? new Date(),
      },
    })
  }
  for (const r of rows('ActivityLog')) {
    await db.activityLog.create({
      data: {
        id: String(r.id), userId: s(r.userId), action: String(r.action), target: s(r.target), detail: s(r.detail),
        createdAt: d(r.createdAt) ?? new Date(),
      },
    })
  }
  for (const r of rows('Redirect')) {
    await db.redirect.create({
      data: {
        id: String(r.id), fromPath: String(r.fromPath), toPath: String(r.toPath),
        statusCode: Number(r.statusCode ?? 301), createdAt: d(r.createdAt) ?? new Date(),
      },
    })
  }

  console.log('📊 Statistiques de vues…')
  for (const r of rows('ArticleView')) {
    await db.articleView.create({
      data: {
        id: String(r.id), articleId: String(r.articleId), date: String(r.date), count: Number(r.count ?? 0),
      },
    })
  }

  console.log('📢 Publicités…')
  for (const r of rows('Ad')) {
    await db.ad.create({
      data: {
        id: String(r.id), name: String(r.name), slot: String(r.slot), kind: String(r.kind ?? 'IMAGE'),
        imageUrl: s(r.imageUrl), linkUrl: s(r.linkUrl), alt: s(r.alt), html: s(r.html),
        weight: Number(r.weight ?? 1), active: b(r.active), startsAt: d(r.startsAt), endsAt: d(r.endsAt),
        impressions: Number(r.impressions ?? 0), clicks: Number(r.clicks ?? 0),
        createdAt: d(r.createdAt) ?? new Date(), updatedAt: d(r.updatedAt) ?? new Date(),
      },
    })
  }

  const final = {
    users: await db.user.count(), articles: await db.article.count(), media: await db.media.count(),
    settings: await db.siteSetting.count(), ads: await db.ad.count(),
  }
  console.log('✅ Migration terminée :', final)
  console.log('   (les tables absentes de la base SQLite sont simplement restées vides)')
}

main()
  .catch((e) => {
    console.error('❌ Migration échouée :', e)
    process.exitCode = 1
  })
  .finally(() => {
    sqlite.close()
    db.$disconnect()
  })
