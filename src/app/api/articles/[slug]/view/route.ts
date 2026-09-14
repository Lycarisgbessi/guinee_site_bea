import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { trackArticleView } from '@/lib/public-queries'

/** POST /api/articles/:slug/view — incrément des vues (§10) */
export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  try {
    const article = await db.article.findUnique({ where: { slug }, select: { id: true } })
    if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await trackArticleView(article.id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
