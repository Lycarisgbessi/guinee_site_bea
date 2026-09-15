import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity'

// ---------- GET /api/admin/homepage-config ----------
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const blocks = await db.homepageBlock.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json({ blocks })
}

// ---------- PUT /api/admin/homepage-config — blocs réordonnés / modifiés (§6.5) ----------
export async function PUT(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const blocks: { id: string; order?: number; active?: boolean; configJson?: object }[] = Array.isArray(body?.blocks)
    ? body.blocks
    : []
  if (!blocks.length) return NextResponse.json({ error: 'Aucun bloc fourni.' }, { status: 400 })

  await db.$transaction(
    blocks.map((b) =>
      db.homepageBlock.update({
        where: { id: b.id },
        data: {
          ...(b.order !== undefined ? { order: b.order } : {}),
          ...(b.active !== undefined ? { active: b.active === true } : {}),
          ...(b.configJson !== undefined ? { configJson: JSON.stringify(b.configJson) } : {}),
        },
      })
    )
  )
  await logActivity('HOMEPAGE_CONFIG', 'accueil', 'Configuration de la page d’accueil mise à jour')
  const updated = await db.homepageBlock.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json({ blocks: updated })
}

// ---------- DELETE — supprimer un bloc (ré-ajoutable ensuite via POST) ----------
export async function DELETE(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id') ?? ''
  if (!id) return NextResponse.json({ error: 'Identifiant requis.' }, { status: 400 })

  const block = await db.homepageBlock.findUnique({ where: { id } })
  if (!block) return NextResponse.json({ error: 'Bloc introuvable.' }, { status: 404 })

  await db.homepageBlock.delete({ where: { id } })
  await logActivity('HOMEPAGE_BLOCK_REMOVE', block.blockType, `Bloc « ${block.blockType} » retiré de l'accueil`)
  const updated = await db.homepageBlock.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json({ blocks: updated })
}

// ---------- POST — ajout d’un nouveau bloc ----------
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const blockType = typeof body?.blockType === 'string' ? body.blockType : ''
  const allowed = ['HERO_UNE', 'FIL_ACTU', 'REPORTAGES_PHARES', 'RUBRIQUE_STRIP', 'CITATION', 'NEWSLETTER']
  if (!allowed.includes(blockType)) return NextResponse.json({ error: 'Type de bloc invalide.' }, { status: 400 })

  const maxOrder = await db.homepageBlock.aggregate({ _max: { order: true } })
  const block = await db.homepageBlock.create({
    data: {
      blockType,
      order: (maxOrder._max.order ?? -1) + 1,
      active: true,
      configJson: JSON.stringify(body?.config || {}),
    },
  })
  await logActivity('HOMEPAGE_BLOCK_ADD', blockType)
  return NextResponse.json({ block })
}
