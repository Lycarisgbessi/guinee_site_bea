import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { publicVisibilityWhere } from '@/lib/public-queries'

/** Sitemap XML dynamique (§12.2) — servi sur /sitemap.xml */
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, categories, pages, tags] = await Promise.all([
    db.article.findMany({
      where: publicVisibilityWhere(),
      select: { slug: true, updatedAt: true },
      orderBy: { publishedAt: 'desc' },
      take: 500,
    }),
    db.category.findMany({ where: { visible: true }, select: { slug: true, updatedAt: true } }),
    db.page.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    db.tag.findMany({ select: { slug: true, createdAt: true } }),
  ])

  const statics: MetadataRoute.Sitemap = [
    { url: '/', priority: 1, changeFrequency: 'hourly' },
    { url: '/rubriques', priority: 0.7, changeFrequency: 'weekly' },
    { url: '/a-propos', priority: 0.6, changeFrequency: 'monthly' },
    { url: '/contact', priority: 0.5, changeFrequency: 'yearly' },
    { url: '/archives', priority: 0.5, changeFrequency: 'daily' },
    { url: '/tags', priority: 0.4, changeFrequency: 'weekly' },
  ]

  return [
    ...statics,
    ...articles.map((a) => ({ url: `/article/${a.slug}`, lastModified: a.updatedAt, priority: 0.9, changeFrequency: 'weekly' as const })),
    ...categories.map((c) => ({ url: `/rubrique/${c.slug}`, lastModified: c.updatedAt, priority: 0.8, changeFrequency: 'daily' as const })),
    ...pages.map((p) => ({ url: `/p/${p.slug}`, lastModified: p.updatedAt, priority: 0.3, changeFrequency: 'yearly' as const })),
    ...tags.map((t) => ({ url: `/tag/${t.slug}`, lastModified: t.createdAt, priority: 0.3, changeFrequency: 'weekly' as const })),
  ]
}
