import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { AD_SLOTS } from '@/lib/ads'

function cleanSlot(v: unknown): string {
  return AD_SLOTS.some((s) => s.key === v) ? (v as string) : 'PREFOOTER'
}

function payload(body: Record<string, unknown>) {
  return {
    name: typeof body?.name === 'string' && body.name.trim() ? body.name.trim() : 'Annonce sans titre',
    slot: cleanSlot(body?.slot),
    kind: body?.kind === 'HTML' ? 'HTML' : 'IMAGE',
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

// ---------- GET /api/admin/ads — liste complète avec statistiques ----------
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const ads = await db.ad.findMany({ orderBy: [{ slot: 'asc' }, { createdAt: 'desc' }] })
  return NextResponse.json({ ads, slots: AD_SLOTS })
}

// ---------- POST /api/admin/ads — création ----------
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const ad = await db.ad.create({ data: payload(body ?? {}) })
  await logActivity('AD_CREATE', ad.slot, ad.name)
  return NextResponse.json({ ad })
}
