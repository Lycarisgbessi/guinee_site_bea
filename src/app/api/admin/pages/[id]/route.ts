import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { tiptapToText } from '@/lib/shared'

type Props = { params: Promise<{ id: string }> }

// ---------- PUT /api/admin/pages/:id ----------
export async function PUT(req: Request, { params }: Props) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const existing = await db.page.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Page introuvable' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const contentJson =
    body?.contentJson && typeof body.contentJson === 'object'
      ? JSON.stringify(body.contentJson)
      : typeof body?.contentJson === 'string'
        ? body.contentJson
        : existing.contentJson

  const page = await db.page.update({
    where: { id },
    data: {
      title: body?.title ?? existing.title,
      contentJson,
      contentText: body?.contentJson ? tiptapToText(body.contentJson) : existing.contentText,
      heroImage: body?.heroImage !== undefined ? body.heroImage : existing.heroImage,
      seoTitle: body?.seoTitle !== undefined ? body.seoTitle : existing.seoTitle,
      seoDescription: body?.seoDescription !== undefined ? body.seoDescription : existing.seoDescription,
      published: body?.published !== undefined ? body.published === true : existing.published,
    },
  })
  await logActivity('PAGE_UPDATE', page.slug, page.title)
  return NextResponse.json({ page })
}

// ---------- DELETE /api/admin/pages/:id (les pages système ne sont pas supprimables) ----------
export async function DELETE(_req: Request, { params }: Props) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const existing = await db.page.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Page introuvable' }, { status: 404 })
  if (existing.system) return NextResponse.json({ error: 'Une page système ne peut pas être supprimée.' }, { status: 403 })

  await db.page.delete({ where: { id } })
  await logActivity('PAGE_DELETE', existing.slug, existing.title)
  return NextResponse.json({ ok: true })
}
