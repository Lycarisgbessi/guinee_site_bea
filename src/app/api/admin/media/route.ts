import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity'

// ---------- GET /api/admin/media — médiathèque ----------
export async function GET(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || undefined
  const q = searchParams.get('q') || undefined

   
  const where: any = {}
  if (type) where.type = type
  if (q) where.OR = [{ filename: { contains: q, mode: 'insensitive' } }, { alt: { contains: q, mode: 'insensitive' } }]

  const items = await db.media.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { uploadedBy: { select: { name: true } } },
  })
  return NextResponse.json({ items })
}

// ---------- POST /api/admin/media — ajout d’un média ----------
// Soit par URL externe, soit enregistrement d'un upload DIRECT Cloudinary
// (le fichier est déjà chez Cloudinary ; le client transmet ses métadonnées).
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const url = typeof body?.url === 'string' ? body.url.trim() : ''
  const isCloudinary = /^https:\/\/res\.cloudinary\.com\//.test(url)
  if (!/^https?:\/\/.+/.test(url) && !url.startsWith('/uploads/')) {
    return NextResponse.json({ error: 'URL invalide.' }, { status: 400 })
  }
  // Sécurité : les métadonnées (taille/dimensions) ne sont acceptées que
  // pour les URLs Cloudinary issues de l'upload direct signé.
  const fromDirect = body?.source === 'cloudinary-direct' && isCloudinary
  const filename = body?.filename || url.split('/').pop() || 'media'
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const typeMap: Record<string, string> = {
    jpg: 'IMAGE', jpeg: 'IMAGE', png: 'IMAGE', webp: 'IMAGE', avif: 'IMAGE', gif: 'IMAGE', svg: 'IMAGE',
    mp4: 'VIDEO', webm: 'VIDEO', mov: 'VIDEO',
    pdf: 'PDF', mp3: 'AUDIO', wav: 'AUDIO',
  }
  const type = (fromDirect && typeof body?.type === 'string' ? body.type : typeMap[ext]) || 'DOC'

  const media = await db.media.create({
    data: {
      url,
      filename,
      type,
      size: fromDirect && Number.isFinite(body?.size) ? Number(body.size) : null,
      width: fromDirect && Number.isFinite(body?.width) ? Number(body.width) : null,
      height: fromDirect && Number.isFinite(body?.height) ? Number(body.height) : null,
      alt: body?.alt || null,
      caption: body?.caption || null,
      credit: body?.credit || null,
      uploadedById: session.userId,
    },
  })
  await logActivity('MEDIA_ADD', media.filename, fromDirect ? 'Import direct Cloudinary' : 'Ajout par URL')
  return NextResponse.json({ media })
}
