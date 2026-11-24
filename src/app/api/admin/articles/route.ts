import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { readingTime, slugify, tiptapToText } from '@/lib/shared'

// ---------- GET /api/admin/articles — liste avec filtres ----------
export async function GET(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || undefined
  const q = searchParams.get('q') || undefined
  const category = searchParams.get('category') || undefined
  const trash = searchParams.get('trash') === '1'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const perPage = 20

   
  const where: any = trash ? { deletedAt: { not: null } } : { deletedAt: null }
  if (status) where.status = status
  if (q) where.OR = [{ title: { contains: q, mode: 'insensitive' } }, { slug: { contains: q, mode: 'insensitive' } }]
  if (category) where.categories = { some: { category: { slug: category } } }

  const [items, total] = await Promise.all([
    db.article.findMany({
      where,
      include: {
        author: { select: { name: true, avatar: true } },
        categories: { include: { category: { select: { name: true, color: true } } } },
        _count: { select: { comments: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.article.count({ where }),
  ])
  return NextResponse.json({ items, total, page, perPage })
}

// ---------- POST /api/admin/articles — création ----------
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  if (!title) return NextResponse.json({ error: 'Le titre est requis.' }, { status: 400 })

  let slug: string = typeof body?.slug === 'string' && body.slug ? slugify(body.slug) : slugify(title)
  // Unicité du slug
  const exists = await db.article.findUnique({ where: { slug } })
  if (exists) slug = `${slug}-${Date.now().toString(36)}`

  const contentJson = body?.contentJson && typeof body.contentJson === 'object' ? JSON.stringify(body.contentJson) : '{}'
  const contentText = tiptapToText(body?.contentJson)

  const article = await db.article.create({
    data: {
      title,
      slug,
      subtitle: body?.subtitle || null,
      chapo: body?.chapo || null,
      contentJson,
      contentText,
      format: ['ARTICLE', 'REPORTAGE', 'INTERVIEW', 'PORTFOLIO', 'VIDEO'].includes(body?.format) ? body.format : 'ARTICLE',
      status: ['DRAFT', 'REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'].includes(body?.status) ? body.status : 'DRAFT',
      scheduledAt: body?.scheduledAt ? new Date(body.scheduledAt) : null,
      publishedAt: body?.status === 'PUBLISHED' ? (body?.publishedAt ? new Date(body.publishedAt) : new Date()) : null,
      authorId: session.userId,
      coverImage: body?.coverImage || null,
      coverCredit: body?.coverCredit || null,
      youtubeUrl: typeof body?.youtubeUrl === 'string' && body.youtubeUrl.trim() ? body.youtubeUrl.trim() : null,
      seoTitle: body?.seoTitle || null,
      seoDescription: body?.seoDescription || null,
      ogImage: body?.ogImage || null,
      readingTime: readingTime(contentText),
      featured: body?.featured === true,
      commentsEnabled: body?.commentsEnabled !== false,
      categories: {
        create: (Array.isArray(body?.categoryIds) ? body.categoryIds : []).map((categoryId: string) => ({ categoryId })),
      },
      tags: {
        create: (Array.isArray(body?.tagIds) ? body.tagIds : []).map((tagId: string) => ({ tagId })),
      },
    },
  })

  await db.articleVersion.create({ data: { articleId: article.id, title, contentJson, editorId: session.userId } })
  await logActivity('ARTICLE_CREATE', article.slug, title)
  return NextResponse.json({ article })
}
