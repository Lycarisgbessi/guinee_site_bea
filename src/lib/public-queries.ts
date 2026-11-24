import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

/**
 * Un article est visible publiquement si :
 * - statut PUBLISHED avec date de publication passée, OU
 * - statut SCHEDULED dont la date programmée est déjà passée (publication automatique à la lecture)
 */
export function publicVisibilityWhere(): Prisma.ArticleWhereInput {
  const now = new Date()
  return {
    deletedAt: null,
    OR: [
      { status: 'PUBLISHED', publishedAt: { lte: now } },
      { status: 'PUBLISHED', publishedAt: null },
      { status: 'SCHEDULED', scheduledAt: { lte: now } },
    ],
  }
}

/** Publication automatique : bascule en PUBLISHED les articles programmés dont la date est passée */
export async function autoPublishScheduled(): Promise<void> {
  try {
    await db.article.updateMany({
      where: { status: 'SCHEDULED', scheduledAt: { lte: new Date() } },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    })
  } catch {
    // silencieux
  }
}

export const articleCardInclude = {
  author: { select: { id: true, name: true, avatar: true, bio: true } },
  // Ne révèle que les rubriques visibles — les badges pointent toujours vers une page existante
  categories: { where: { category: { visible: true } }, include: { category: true } },
  tags: { include: { tag: true } },
} satisfies Prisma.ArticleInclude

export type ArticleCardData = Prisma.ArticleGetPayload<{ include: typeof articleCardInclude }>

export async function getPublishedArticles(opts: {
  categorySlug?: string
  tagSlug?: string
  format?: string
  page?: number
  perPage?: number
  excludeIds?: string[]
  year?: number
  month?: number
}): Promise<{ items: ArticleCardData[]; total: number }> {
  await autoPublishScheduled()
  const { categorySlug, tagSlug, format, page = 1, perPage = 12, excludeIds, year, month } = opts

  const where: Prisma.ArticleWhereInput = {
    ...publicVisibilityWhere(),
    ...(format ? { format } : {}),
    ...(excludeIds?.length ? { id: { notIn: excludeIds } } : {}),
    ...(categorySlug ? { categories: { some: { category: { slug: categorySlug, visible: true } } } } : {}),
    ...(tagSlug ? { tags: { some: { tag: { slug: tagSlug } } } } : {}),
  }

  if (year || month) {
    const start = new Date(year ?? new Date().getFullYear(), month ? month - 1 : 0, 1)
    const end = new Date(year ?? new Date().getFullYear(), month ? month : 12, 1)
    where.publishedAt = { gte: start, lt: end }
  }

  const [items, total] = await Promise.all([
    db.article.findMany({
      where,
      include: articleCardInclude,
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.article.count({ where }),
  ])
  return { items, total }
}

export async function getVisibleCategories() {
  return db.category.findMany({
    where: { visible: true, parentId: null },
    orderBy: { order: 'asc' },
    include: {
      _count: {
        select: {
          articles: { where: { article: publicVisibilityWhere() } },
        },
      },
    },
  })
}

export async function getFeaturedArticle() {
  await autoPublishScheduled()
  const featured = await db.article.findFirst({
    where: { ...publicVisibilityWhere(), featured: true },
    include: articleCardInclude,
    orderBy: { publishedAt: 'desc' },
  })
  if (featured) return featured
  return db.article.findFirst({
    where: publicVisibilityWhere(),
    include: articleCardInclude,
    orderBy: { publishedAt: 'desc' },
  })
}

export async function getRelatedArticles(articleId: string, categoryIds: string[], limit = 3) {
  const byCategory = await db.article.findMany({
    where: {
      ...publicVisibilityWhere(),
      id: { not: articleId },
      categories: { some: { categoryId: { in: categoryIds } } },
    },
    include: articleCardInclude,
    orderBy: { publishedAt: 'desc' },
    take: limit,
  })
  if (byCategory.length >= limit) return byCategory
  const fill = await db.article.findMany({
    where: { ...publicVisibilityWhere(), id: { notIn: [articleId, ...byCategory.map((a) => a.id)] } },
    include: articleCardInclude,
    orderBy: { views: 'desc' },
    take: limit - byCategory.length,
  })
  return [...byCategory, ...fill]
}

/** Incrémente les vues d'un article (compteur total + agrégat quotidien) */
export async function trackArticleView(articleId: string) {
  const today = new Date().toISOString().slice(0, 10)
  try {
    await db.article.update({ where: { id: articleId }, data: { views: { increment: 1 } } })
    await db.articleView.upsert({
      where: { articleId_date: { articleId, date: today } },
      update: { count: { increment: 1 } },
      create: { articleId, date: today, count: 1 },
    })
  } catch {
    // silencieux — jamais bloquer la lecture
  }
}
