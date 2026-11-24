import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { slugify } from '@/lib/shared'
import { logActivity } from '@/lib/activity'

// ---------- GET /api/admin/tags — liste avec compteur d'articles ----------
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const tags = await db.tag.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { articles: true } } },
  })
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
  await logActivity('TAG_CREATE', name, `Mot-clé « ${name} » créé`)
  return NextResponse.json({ tag })
}

// ---------- PUT — renommer un tag (le slug suit, les liens /tag/[slug] restent valides car dérivés) ----------
export async function PUT(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const id = typeof body?.id === 'string' ? body.id : ''
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  if (!id || name.length < 2) return NextResponse.json({ error: 'Paramètres invalides.' }, { status: 400 })

  const current = await db.tag.findUnique({ where: { id } })
  if (!current) return NextResponse.json({ error: 'Mot-clé introuvable.' }, { status: 404 })

  const slug = slugify(name)
  const clash = await db.tag.findFirst({ where: { slug, NOT: { id } } })
  if (clash) return NextResponse.json({ error: 'Un autre mot-clé produit le même slug.' }, { status: 409 })

  const tag = await db.tag.update({ where: { id }, data: { name, slug } })
  await logActivity('TAG_RENAME', name, `Mot-clé renommé : ${current.name} → ${name}`)
  return NextResponse.json({ tag })
}

// ---------- DELETE — supprimer un tag (les liaisons articles sont supprimées en cascade) ----------
export async function DELETE(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id') ?? ''
  if (!id) return NextResponse.json({ error: 'Identifiant requis.' }, { status: 400 })

  const current = await db.tag.findUnique({ where: { id }, include: { _count: { select: { articles: true } } } })
  if (!current) return NextResponse.json({ error: 'Mot-clé introuvable.' }, { status: 404 })

  await db.tag.delete({ where: { id } })
  await logActivity('TAG_DELETE', current.name, `Mot-clé « ${current.name} » supprimé (${current._count.articles} article(s) dissocié(s))`)
  return NextResponse.json({ ok: true })
}
