import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { slugify } from '@/lib/shared'

/** POST /api/admin/articles/:id/duplicate — duplication d’un article (§6.4) */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const source = await db.article.findUnique({ where: { id }, include: { categories: true, tags: true } })
  if (!source) return NextResponse.json({ error: 'Article introuvable' }, { status: 404 })

  const title = `${source.title} (copie)`
  let slug = slugify(title)
  const exists = await db.article.findUnique({ where: { slug } })
  if (exists) slug = `${slug}-${Date.now().toString(36)}`

  const copy = await db.article.create({
    data: {
      title,
      slug,
      subtitle: source.subtitle,
      chapo: source.chapo,
      contentJson: source.contentJson,
      contentText: source.contentText,
      format: source.format,
      status: 'DRAFT',
      authorId: session.userId,
      coverImage: source.coverImage,
      coverCredit: source.coverCredit,
      seoTitle: source.seoTitle,
      seoDescription: source.seoDescription,
      readingTime: source.readingTime,
      commentsEnabled: source.commentsEnabled,
      categories: { create: source.categories.map((c) => ({ categoryId: c.categoryId })) },
      tags: { create: source.tags.map((t) => ({ tagId: t.tagId })) },
    },
  })

  await logActivity('ARTICLE_DUPLICATE', copy.slug, title)
  return NextResponse.json({ article: copy })
}
