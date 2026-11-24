import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

/** GET /api/admin/newsletter — abonnés (§6.10) */
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const items = await db.newsletterSubscriber.findMany({ orderBy: { createdAt: 'desc' }, take: 500 })
  return NextResponse.json({ items })
}
