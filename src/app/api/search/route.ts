import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { publicVisibilityWhere } from '@/lib/public-queries'

/** GET /api/search?q=... — recherche full-text (§8.2) */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  if (q.length < 2) return NextResponse.json({ results: [], total: 0 })

  // Rate limit léger sur la recherche (§8.3)
  const ip = req.headers.get('x-forwarded-for') || 'anon'
  const { rateLimit } = await import('@/lib/shared')
  const rl = rateLimit(`search:${ip}`, 30, 60_000)
  if (!rl.ok) return NextResponse.json({ error: 'Trop de requêtes, patientez un instant.' }, { status: 429 })

  const like = `%${q.replace(/[%_]/g, '')}%`
  const results = await db.article.findMany({
    where: {
      ...publicVisibilityWhere(),
      OR: [
        { title: { contains: like } },
        { chapo: { contains: like } },
        { contentText: { contains: like } },
      ],
    },
    select: { slug: true, title: true, chapo: true, coverImage: true, publishedAt: true, format: true },
    take: 20,
  })
  return NextResponse.json({ results, total: results.length })
}
