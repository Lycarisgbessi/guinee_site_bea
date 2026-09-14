import { getSettings } from '@/lib/settings'
import { db } from '@/lib/db'
import { autoPublishScheduled } from '@/lib/public-queries'

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** GET /api/rss — Flux RSS du média (§5.7, §12.2) */
export async function GET() {
  const settings = await getSettings()
  await autoPublishScheduled()
  const articles = await db.article.findMany({
    where: { status: 'PUBLISHED', deletedAt: null },
    orderBy: { publishedAt: 'desc' },
    take: 30,
    include: { author: { select: { name: true } } },
  })

  const items = articles
    .map((a) => {
      const url = `/article/${a.slug}`
      return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(a.chapo || a.subtitle || '')}</description>
      ${a.author?.name ? `<author>${escapeXml(a.author.name)}</author>` : ''}
      <pubDate>${a.publishedAt ? new Date(a.publishedAt).toUTCString() : new Date(a.updatedAt).toUTCString()}</pubDate>
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(settings.site_name)}</title>
    <link>/</link>
    <description>${escapeXml(settings.seo_default_description)}</description>
    <language>fr</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  })
}
