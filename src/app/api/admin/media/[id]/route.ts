import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity'

type Props = { params: Promise<{ id: string }> }

// ---------- PUT /api/admin/media/:id — métadonnées ----------
export async function PUT(req: Request, { params }: Props) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const existing = await db.media.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Média introuvable' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const media = await db.media.update({
    where: { id },
    data: {
      filename: body?.filename ?? existing.filename,
      alt: body?.alt !== undefined ? body.alt : existing.alt,
      caption: body?.caption !== undefined ? body.caption : existing.caption,
      credit: body?.credit !== undefined ? body.credit : existing.credit,
    },
  })
  await logActivity('MEDIA_UPDATE', media.filename)
  return NextResponse.json({ media })
}

// ---------- DELETE /api/admin/media/:id ----------
export async function DELETE(_req: Request, { params }: Props) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const existing = await db.media.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Média introuvable' }, { status: 404 })

  await db.media.delete({ where: { id } })
  await logActivity('MEDIA_DELETE', existing.filename)
  return NextResponse.json({ ok: true })
}
