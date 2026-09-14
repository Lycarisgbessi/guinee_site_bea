import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { publicVisibilityWhere, articleCardInclude } from '@/lib/public-queries'

/** GET /api/articles/:slug — API publique : détail d’un article publié (§8.2) */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await db.article.findFirst({
    where: { ...publicVisibilityWhere(), slug },
    include: articleCardInclude,
  })
  if (!article) return NextResponse.json({ error: 'Article introuvable' }, { status: 404 })
  return NextResponse.json({ article })
}
