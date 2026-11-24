import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity'

type Props = { params: Promise<{ id: string }> }

// ---------- PATCH /api/admin/comments/:id — approuver / rejeter ----------
export async function PATCH(req: Request, { params }: Props) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => null)
  const status = body?.status
  if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
    return NextResponse.json({ error: 'Statut invalide.' }, { status: 400 })
  }

  const comment = await db.comment.update({ where: { id }, data: { status } })
  await logActivity('COMMENT_MODERATE', comment.id, `Commentaire ${status.toLowerCase()}`)
  return NextResponse.json({ comment })
}

// ---------- DELETE ----------
export async function DELETE(_req: Request, { params }: Props) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  await db.comment.delete({ where: { id } })
  await logActivity('COMMENT_DELETE', id)
  return NextResponse.json({ ok: true })
}
