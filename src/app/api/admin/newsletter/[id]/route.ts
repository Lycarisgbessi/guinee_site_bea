import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity'

type Props = { params: Promise<{ id: string }> }

// ---------- PATCH /api/admin/newsletter/:id — confirmer manuellement / désinscrire ----------
export async function PATCH(req: Request, { params }: Props) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => null)
  const status = body?.status
  if (!['PENDING', 'CONFIRMED', 'UNSUBSCRIBED'].includes(status)) {
    return NextResponse.json({ error: 'Statut invalide.' }, { status: 400 })
  }

  const subscriber = await db.newsletterSubscriber.update({
    where: { id },
    data: { status, ...(status === 'CONFIRMED' ? { confirmedAt: new Date() } : {}) },
  })
  await logActivity('NEWSLETTER_UPDATE', subscriber.email, status)
  return NextResponse.json({ subscriber })
}

// ---------- DELETE — RGPD droit à l’oubli (§11) ----------
export async function DELETE(_req: Request, { params }: Props) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const existing = await db.newsletterSubscriber.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Abonné introuvable' }, { status: 404 })

  await db.newsletterSubscriber.delete({ where: { id } })
  await logActivity('NEWSLETTER_DELETE', existing.email, 'Suppression RGPD')
  return NextResponse.json({ ok: true })
}
