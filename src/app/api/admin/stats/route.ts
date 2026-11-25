import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { autoPublishScheduled, publicVisibilityWhere } from '@/lib/public-queries'

/** GET /api/admin/stats — statistiques du tableau de bord (§6.2, §6.10) */
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  await autoPublishScheduled()

  const now = new Date()
  const d30 = new Date(now.getTime() - 30 * 86400000)

  const [publishedCount, draftCount, scheduledCount, reviewCount, trashCount, totalViews, pendingComments, unreadMessages, pendingSubscribers] =
    await Promise.all([
      db.article.count({ where: { status: 'PUBLISHED', deletedAt: null } }),
      db.article.count({ where: { status: 'DRAFT', deletedAt: null } }),
      db.article.count({ where: { status: 'SCHEDULED', deletedAt: null } }),
      db.article.count({ where: { status: 'REVIEW', deletedAt: null } }),
      db.article.count({ where: { deletedAt: { not: null } } }),
      db.article.aggregate({ where: { deletedAt: null }, _sum: { views: true } }),
      db.comment.count({ where: { status: 'PENDING' } }),
      db.contactMessage.count({ where: { status: 'UNREAD' } }),
      db.newsletterSubscriber.count({ where: { status: 'PENDING' } }),
    ])

  // Vues des 30 derniers jours (tous articles). Si la fenêtre récente est
  // vide — site jeune ou pause éditoriale — repli sur les 30 derniers jours
  // ACTIFS pour que le graphe du dashboard reste toujours informatif.
  // (fonction dédiée : évite que le typage contextuel ne brise l'inférence
  //  du groupBy Prisma à la réaffectation)
  const dailyViewsSince = (gte: string) =>
    db.articleView.groupBy({
      by: ['date'],
      where: { date: { gte } },
      _sum: { count: true },
      orderBy: { date: 'asc' },
    })

  let dailyViews = await dailyViewsSince(d30.toISOString().slice(0, 10))
  if (dailyViews.length === 0) {
    const latest = await db.articleView.findFirst({ orderBy: { date: 'desc' }, select: { date: true } })
    if (latest) {
      const gte = new Date(new Date(latest.date).getTime() - 29 * 86400000).toISOString().slice(0, 10)
      dailyViews = await dailyViewsSince(gte)
    }
  }

  // Top articles par vues
  const topArticles = await db.article.findMany({
    where: { deletedAt: null, status: 'PUBLISHED' },
    orderBy: { views: 'desc' },
    take: 5,
    select: { id: true, title: true, slug: true, views: true, publishedAt: true },
  })

  // Vues par rubrique
  const categories = await db.category.findMany({
    select: {
      name: true,
      color: true,
      articles: {
        where: { article: publicVisibilityWhere() },
        include: { article: { select: { views: true } } },
      },
    },
  })
  const viewsByCategory = categories
    .map((c) => ({
      name: c.name,
      color: c.color || '#888',
      value: c.articles.reduce((sum, ac) => sum + (ac.article.views || 0), 0),
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)

  // Abonnés newsletter
  const confirmed = await db.newsletterSubscriber.count({ where: { status: 'CONFIRMED' } })

  return NextResponse.json({
    counters: {
      published: publishedCount,
      drafts: draftCount,
      scheduled: scheduledCount,
      review: reviewCount,
      trash: trashCount,
      totalViews: totalViews._sum.views || 0,
      pendingComments,
      unreadMessages,
      pendingSubscribers,
      confirmedSubscribers: confirmed,
    },
    dailyViews: dailyViews.map((d) => ({ date: d.date, views: d._sum.count || 0 })),
    topArticles,
    viewsByCategory,
  })
}
