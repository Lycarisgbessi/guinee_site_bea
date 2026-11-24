import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity'

/** POST /api/admin/categories/reorder — réordonnancement glisser-déposer (§6.3) */
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const ids: string[] = Array.isArray(body?.ids) ? body.ids : []
  if (!ids.length) return NextResponse.json({ error: 'Liste vide' }, { status: 400 })

  await db.$transaction(
    ids.map((id, index) => db.category.update({ where: { id }, data: { order: index } }))
  )
  await logActivity('CATEGORY_REORDER', ids.join(','), 'Réordonnancement des rubriques')
  return NextResponse.json({ ok: true })
}
