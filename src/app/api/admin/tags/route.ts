import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { slugify } from '@/lib/shared'

// ---------- GET /api/admin/tags ----------
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const tags = await db.tag.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json({ tags })
}

// ---------- POST — créer un tag ----------
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  if (name.length < 2) return NextResponse.json({ error: 'Nom trop court.' }, { status: 400 })

  const slug = slugify(name)
  const existing = await db.tag.findUnique({ where: { slug } })
  if (existing) return NextResponse.json({ tag: existing })

  const tag = await db.tag.create({ data: { name, slug } })
  return NextResponse.json({ tag })
}
