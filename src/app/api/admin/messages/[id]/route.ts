import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity'

type Props = { params: Promise<{ id: string }> }

// ---------- PATCH /api/admin/messages/:id — marquer lu / traité ----------
export async function PATCH(req: Request, { params }: Props) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => null)
  const status = body?.status
  if (!['UNREAD', 'READ', 'DONE'].includes(status)) {
    return NextResponse.json({ error: 'Statut invalide.' }, { status: 400 })
  }

  const message = await db.contactMessage.update({ where: { id }, data: { status } })
  await logActivity('MESSAGE_UPDATE', message.id, `Message ${status.toLowerCase()}`)
  return NextResponse.json({ message })
}

// ---------- DELETE ----------
export async function DELETE(_req: Request, { params }: Props) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  await db.contactMessage.delete({ where: { id } })
  await logActivity('MESSAGE_DELETE', id)
  return NextResponse.json({ ok: true })
}
