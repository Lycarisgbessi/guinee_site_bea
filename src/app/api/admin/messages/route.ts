import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

/** GET /api/admin/messages — boîte de réception du contact (§6.8) */
export async function GET(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || undefined
  const tip = searchParams.get('tip')

  const items = await db.contactMessage.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(tip === '1' ? { isTip: true } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json({ items })
}
