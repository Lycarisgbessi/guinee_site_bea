import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { AD_SLOTS } from '@/lib/ads'

type Props = { params: Promise<{ id: string }> }

function cleanSlot(v: unknown): string {
  return AD_SLOTS.some((s) => s.key === v) ? (v as string) : 'PREFOOTER'
}

function payload(body: Record<string, unknown>) {
  return {
    name: typeof body?.name === 'string' && body.name.trim() ? body.name.trim() : 'Annonce sans titre',
    slot: cleanSlot(body?.slot),
    kind: body?.kind === 'HTML' ? 'HTML' : body?.kind === 'VIDEO' ? 'VIDEO' : 'IMAGE',
    imageUrl: typeof body?.imageUrl === 'string' && body.imageUrl.trim() ? body.imageUrl.trim() : null,
    linkUrl: typeof body?.linkUrl === 'string' && body.linkUrl.trim() ? body.linkUrl.trim() : null,
    alt: typeof body?.alt === 'string' && body.alt.trim() ? body.alt.trim() : null,
    html: typeof body?.html === 'string' && body.html.trim() ? body.html.trim() : null,
    weight: Math.min(10, Math.max(1, parseInt(String(body?.weight ?? '1'), 10) || 1)),
    active: body?.active !== false,
    startsAt: body?.startsAt ? new Date(String(body.startsAt)) : null,
    endsAt: body?.endsAt ? new Date(String(body.endsAt)) : null,
  }
}

// ---------- PUT /api/admin/ads/:id — modification (ou remise à zéro des stats) ----------
export async function PUT(req: Request, { params }: Props) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>

  if (body.resetStats === true) {
    const ad = await db.ad.update({
      where: { id },
      data: { impressions: 0, clicks: 0 },
    })
    await logActivity('AD_STATS_RESET', ad.slot, ad.name)
    return NextResponse.json({ ad })
  }

  const ad = await db.ad.update({ where: { id }, data: payload(body) })
  await logActivity('AD_UPDATE', ad.slot, ad.name)
  return NextResponse.json({ ad })
}

// ---------- DELETE /api/admin/ads/:id — suppression définitive ----------
export async function DELETE(_req: Request, { params }: Props) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { id } = await params
  const ad = await db.ad.delete({ where: { id } })
  await logActivity('AD_DELETE', ad.slot, ad.name)
  return NextResponse.json({ ok: true })
}
