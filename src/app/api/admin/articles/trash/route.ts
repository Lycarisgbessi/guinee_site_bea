import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

/** GET /api/admin/articles/trash — corbeille (§6.4) */
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const items = await db.article.findMany({
    where: { deletedAt: { not: null } },
    include: { author: { select: { name: true } } },
    orderBy: { deletedAt: 'desc' },
  })
  return NextResponse.json({ items })
}
