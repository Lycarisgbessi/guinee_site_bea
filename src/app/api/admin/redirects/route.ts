import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity'

// ---------- GET /api/admin/redirects ----------
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const items = await db.redirect.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ items })
}

// ---------- POST — créer une redirection 301 (§6.9) ----------
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const fromPath = typeof body?.fromPath === 'string' ? body.fromPath.trim() : ''
  const toPath = typeof body?.toPath === 'string' ? body.toPath.trim() : ''
  if (!fromPath.startsWith('/') || !toPath.startsWith('/')) {
    return NextResponse.json({ error: 'Les chemins doivent commencer par « / ».' }, { status: 400 })
  }
  const exists = await db.redirect.findUnique({ where: { fromPath } })
  if (exists) return NextResponse.json({ error: 'Une redirection existe déjà pour ce chemin.' }, { status: 409 })

  const redirect = await db.redirect.create({
    data: { fromPath, toPath, statusCode: body?.statusCode === 302 ? 302 : 301 },
  })
  await logActivity('REDIRECT_CREATE', fromPath, toPath)
  return NextResponse.json({ redirect })
}

// ---------- DELETE ----------
export async function DELETE(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })
  await db.redirect.delete({ where: { id } })
  await logActivity('REDIRECT_DELETE', id)
  return NextResponse.json({ ok: true })
}
