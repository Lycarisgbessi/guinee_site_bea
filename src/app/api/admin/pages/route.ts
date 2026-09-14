import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { slugify, tiptapToText } from '@/lib/shared'

// ---------- GET /api/admin/pages ----------
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const pages = await db.page.findMany({ orderBy: [{ system: 'desc' }, { title: 'asc' }] })
  return NextResponse.json({ pages })
}

// ---------- POST /api/admin/pages — création de page ----------
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  if (title.length < 2) return NextResponse.json({ error: 'Titre requis.' }, { status: 400 })

  let slug = slugify(body?.slug || title)
  const exists = await db.page.findUnique({ where: { slug } })
  if (exists) return NextResponse.json({ error: 'Une page avec ce slug existe déjà.' }, { status: 409 })

  const contentJson = body?.contentJson && typeof body.contentJson === 'object' ? JSON.stringify(body.contentJson) : '{}'

  const page = await db.page.create({
    data: {
      slug,
      title,
      contentJson,
      contentText: tiptapToText(body?.contentJson),
      heroImage: body?.heroImage || null,
      seoTitle: body?.seoTitle || null,
      seoDescription: body?.seoDescription || null,
      published: body?.published !== false,
    },
  })
  await logActivity('PAGE_CREATE', page.slug, page.title)
  return NextResponse.json({ page })
}
