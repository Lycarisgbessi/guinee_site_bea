import { NextResponse } from 'next/server'
import { getPublishedArticles, publicVisibilityWhere } from '@/lib/public-queries'
import { db } from '@/lib/db'

/** GET /api/articles — API publique : liste paginée, filtrable (§8.2) */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get('perPage') || '12', 10) || 12))
  const categorySlug = searchParams.get('rubrique') || undefined
  const tagSlug = searchParams.get('tag') || undefined
  const format = searchParams.get('format') || undefined

  const { items, total } = await getPublishedArticles({ page, perPage, categorySlug, tagSlug, format })
  return NextResponse.json({ total, page, perPage, items })
}

/** Compteur public simple */
export async function HEAD() {
  const count = await db.article.count({ where: publicVisibilityWhere() })
  return new NextResponse(null, { headers: { 'X-Total-Articles': String(count) } })
}
