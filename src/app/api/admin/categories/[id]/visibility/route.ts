import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity'

/** PATCH /api/admin/categories/:id/visibility — masquer / afficher (§6.3) */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => null)
  const visible = body?.visible === true

  const category = await db.category.update({ where: { id }, data: { visible } })
  await logActivity(visible ? 'CATEGORY_SHOW' : 'CATEGORY_HIDE', category.slug, category.name)
  return NextResponse.json({ category })
}
