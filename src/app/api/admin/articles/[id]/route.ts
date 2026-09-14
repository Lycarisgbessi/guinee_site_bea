import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { readingTime, slugify, tiptapToText } from '@/lib/shared'

type Props = { params: Promise<{ id: string }> }

// ---------- GET /api/admin/articles/:id — détail pour édition ----------
export async function GET(_req: Request, { params }: Props) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const article = await db.article.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
      versions: { orderBy: { createdAt: 'desc' }, take: 10, include: { editor: { select: { name: true } } } },
    },
  })
  if (!article) return NextResponse.json({ error: 'Article introuvable' }, { status: 404 })
  return NextResponse.json({ article })
}

// ---------- PUT /api/admin/articles/:id — modification ----------
export async function PUT(req: Request, { params }: Props) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const existing = await db.article.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Article introuvable' }, { status: 404 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })

  // Restauration depuis la corbeille (§6.4)
  if (body.restore === true) {
    const restored = await db.article.update({ where: { id }, data: { deletedAt: null } })
    await logActivity('ARTICLE_RESTORE', restored.slug, restored.title)
    return NextResponse.json({ article: restored })
  }

  // Changement de slug → redirection 301 automatique (§6.9, §12.2)
  const newSlug = typeof body.slug === 'string' && body.slug ? slugify(body.slug) : slugify(body.title || existing.title)
  if (newSlug !== existing.slug) {
    await db.redirect.upsert({
      where: { fromPath: `/article/${existing.slug}` },
      update: { toPath: `/article/${newSlug}` },
      create: { fromPath: `/article/${existing.slug}`, toPath: `/article/${newSlug}`, statusCode: 301 },
    })
  }

  const contentJson =
    body.contentJson && typeof body.contentJson === 'object'
      ? JSON.stringify(body.contentJson)
      : typeof body.contentJson === 'string'
        ? body.contentJson
        : existing.contentJson
  const contentText = body.contentJson ? tiptapToText(body.contentJson) : existing.contentText

  // Gestion du statut
  let status = existing.status
  let publishedAt = existing.publishedAt
  if (body.status && ['DRAFT', 'REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'].includes(body.status)) {
    status = body.status
    if (status === 'PUBLISHED' && !publishedAt) publishedAt = new Date()
    if (status !== 'PUBLISHED' && status !== 'SCHEDULED' && existing.status === 'PUBLISHED') {
      // archivage / dépublication
      publishedAt = existing.publishedAt
    }
  }
  if (body.publishedAt) publishedAt = new Date(body.publishedAt)

  const article = await db.article.update({
    where: { id },
    data: {
      title: body.title ?? existing.title,
      slug: newSlug,
      subtitle: body.subtitle !== undefined ? body.subtitle : existing.subtitle,
      chapo: body.chapo !== undefined ? body.chapo : existing.chapo,
      contentJson,
      contentText,
      format: body.format ?? existing.format,
      status,
      publishedAt,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : body.scheduledAt === null ? null : existing.scheduledAt,
      coverImage: body.coverImage !== undefined ? body.coverImage : existing.coverImage,
      coverCredit: body.coverCredit !== undefined ? body.coverCredit : existing.coverCredit,
      seoTitle: body.seoTitle !== undefined ? body.seoTitle : existing.seoTitle,
      seoDescription: body.seoDescription !== undefined ? body.seoDescription : existing.seoDescription,
      ogImage: body.ogImage !== undefined ? body.ogImage : existing.ogImage,
      readingTime: body.contentJson ? readingTime(contentText) : existing.readingTime,
      featured: body.featured !== undefined ? body.featured === true : existing.featured,
      commentsEnabled: body.commentsEnabled !== undefined ? body.commentsEnabled === true : existing.commentsEnabled,
      updatedAt: new Date(),
      categories: Array.isArray(body.categoryIds)
        ? { deleteMany: {}, create: body.categoryIds.map((categoryId: string) => ({ categoryId })) }
        : undefined,
      tags: Array.isArray(body.tagIds)
        ? { deleteMany: {}, create: body.tagIds.map((tagId: string) => ({ tagId })) }
        : undefined,
    },
  })

  // Historique des versions (§6.4)
  if (JSON.stringify(contentJson) !== JSON.stringify(existing.contentJson) || body.title !== existing.title) {
    await db.articleVersion.create({ data: { articleId: id, title: article.title, contentJson, editorId: session.userId } })
  }

  await logActivity('ARTICLE_UPDATE', article.slug, article.title)
  return NextResponse.json({ article })
}

// ---------- DELETE /api/admin/articles/:id — corbeille / suppression définitive ----------
export async function DELETE(req: Request, { params }: Props) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const permanent = searchParams.get('permanent') === '1'

  const existing = await db.article.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Article introuvable' }, { status: 404 })

  if (permanent) {
    await db.article.delete({ where: { id } })
    await logActivity('ARTICLE_DELETE_PERMANENT', existing.slug, existing.title)
  } else {
    await db.article.update({ where: { id }, data: { deletedAt: new Date() } })
    await logActivity('ARTICLE_TRASH', existing.slug, existing.title)
  }
  return NextResponse.json({ ok: true })
}
