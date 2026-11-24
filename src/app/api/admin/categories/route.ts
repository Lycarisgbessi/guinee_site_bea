import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { slugify } from '@/lib/shared'

// ---------- GET /api/admin/categories ----------
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const categories = await db.category.findMany({
    include: {
      _count: { select: { articles: true } },
    },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  })
  return NextResponse.json({ categories })
}

// ---------- POST /api/admin/categories — création ----------
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  if (name.length < 2) return NextResponse.json({ error: 'Nom trop court.' }, { status: 400 })

  let slug = slugify(body?.slug || name)
  const exists = await db.category.findUnique({ where: { slug } })
  if (exists) slug = `${slug}-${Date.now().toString(36)}`

  const maxOrder = await db.category.aggregate({ _max: { order: true } })
  const category = await db.category.create({
    data: {
      name,
      slug,
      description: body?.description || null,
      coverImage: body?.coverImage || null,
      color: body?.color || null,
      order: (maxOrder._max.order ?? -1) + 1,
      visible: body?.visible !== false,
      parentId: body?.parentId || null,
    },
  })

  await logActivity('CATEGORY_CREATE', category.slug, category.name)
  return NextResponse.json({ category })
}
