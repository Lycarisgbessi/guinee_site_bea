import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { slugify } from '@/lib/shared'

type Props = { params: Promise<{ id: string }> }

// ---------- PUT /api/admin/categories/:id — modification ----------
export async function PUT(req: Request, { params }: Props) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const existing = await db.category.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Rubrique introuvable' }, { status: 404 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })

  let slug = existing.slug
  if (body.slug && slugify(body.slug) !== existing.slug) {
    slug = slugify(body.slug)
    const exists = await db.category.findUnique({ where: { slug } })
    if (exists) slug = `${slug}-${Date.now().toString(36)}`
  }

  const category = await db.category.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      slug,
      description: body.description !== undefined ? body.description : existing.description,
      coverImage: body.coverImage !== undefined ? body.coverImage : existing.coverImage,
      color: body.color !== undefined ? body.color : existing.color,
      visible: body.visible !== undefined ? body.visible === true : existing.visible,
      parentId: body.parentId !== undefined ? body.parentId || null : existing.parentId,
    },
  })

  await logActivity('CATEGORY_UPDATE', category.slug, category.name)
  return NextResponse.json({ category })
}

// ---------- DELETE /api/admin/categories/:id — suppression (articles conservés) ----------
export async function DELETE(_req: Request, { params }: Props) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const existing = await db.category.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Rubrique introuvable' }, { status: 404 })

  await db.category.delete({ where: { id } }) // les liaisons article_categories partent en cascade, les articles restent
  await logActivity('CATEGORY_DELETE', existing.slug, existing.name)
  return NextResponse.json({ ok: true })
}
