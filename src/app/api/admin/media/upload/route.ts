import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { saveMedia } from '@/lib/storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ---------- Limites et types acceptés ----------
// NB : sur Vercel serverless, le corps de requête est limité (~4,5 Mo) ; les
// images compressées côté navigateur passent toujours. Les fichiers plus
// lourds (vidéos…) transitent par l'upload direct navigateur → Cloudinary
// (voir /api/admin/media/sign + upload-client.ts) et ne passent pas ici.
const MAX_SIZE: Record<string, number> = {
  IMAGE: 15 * 1024 * 1024, // 15 Mo
  VIDEO: 80 * 1024 * 1024, // 80 Mo
  AUDIO: 25 * 1024 * 1024,
  PDF: 25 * 1024 * 1024,
  DOC: 25 * 1024 * 1024,
}

type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'PDF' | 'DOC'

const MIME_MAP: Record<string, MediaType> = {
  'image/jpeg': 'IMAGE',
  'image/png': 'IMAGE',
  'image/webp': 'IMAGE',
  'image/gif': 'IMAGE',
  'image/avif': 'IMAGE',
  'image/svg+xml': 'IMAGE',
  'image/heic': 'IMAGE',
  'video/mp4': 'VIDEO',
  'video/webm': 'VIDEO',
  'video/quicktime': 'VIDEO', // .mov (iPhone)
  'audio/mpeg': 'AUDIO',
  'audio/mp4': 'AUDIO',
  'audio/wav': 'AUDIO',
  'audio/ogg': 'AUDIO',
  'application/pdf': 'PDF',
}

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
  'application/pdf': 'pdf',
}

/** Nom de fichier lisible et sûr pour l'affichage (garde l'original) */
function safeName(name: string): string {
  return (
    name
      .normalize('NFC')
      .replace(/[^\p{L}\p{N}._ -]/gu, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120) || 'media'
  )
}

// ---------- POST /api/admin/media/upload — import de fichier réel ----------
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json(
      { error: 'Fichier trop lourd ou requête invalide (limite serveur ~4,5 Mo). Utilisez l’import direct pour les gros fichiers.' },
      { status: 400 },
    )
  }

  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 })
  }

  const mime = file.type || 'application/octet-stream'
  const type = MIME_MAP[mime]
  if (!type) {
    return NextResponse.json(
      { error: `Format non pris en charge (${mime}). Formats acceptés : JPG, PNG, WebP, GIF, MP4, MOV, MP3, PDF…` },
      { status: 415 },
    )
  }

  const max = MAX_SIZE[type]
  if (file.size > max) {
    const maxMo = Math.round(max / (1024 * 1024))
    return NextResponse.json(
      { error: `Fichier trop lourd (${(file.size / 1048576).toFixed(1)} Mo). Maximum : ${maxMo} Mo.` },
      { status: 413 },
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  let ext: string
  let width: number | null = null
  let height: number | null = null
  let outBuffer: Buffer = buffer

  try {
    if (type === 'IMAGE' && mime !== 'image/gif' && mime !== 'image/svg+xml') {
      // Optimisation systématique : rotation auto (smartphone), max 2400 px, WebP qualitatif
      const optimized = await sharp(buffer, { failOn: 'none' })
        .rotate() // applique l'orientation EXIF
        .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true })
      outBuffer = optimized.data
      width = optimized.info.width
      height = optimized.info.height
      ext = 'webp'
    } else {
      ext = EXT_BY_MIME[mime] || (file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin')
    }
  } catch {
    // Image illisible par sharp : on stocke l'original tel quel plutôt que d'échouer
    ext = EXT_BY_MIME[mime] || 'jpg'
  }

  // Cloudinary en production, disque local en dev sans configuration
  const stored = await saveMedia(outBuffer, { type, ext, width, height })

  const media = await db.media.create({
    data: {
      url: stored.url,
      filename: safeName(file.name),
      type,
      size: stored.size,
      width: stored.width,
      height: stored.height,
      alt: typeof form.get('alt') === 'string' ? (form.get('alt') as string) || null : null,
      uploadedById: session.userId,
    },
  })

  await logActivity('MEDIA_UPLOAD', media.filename, `${type} · ${(stored.size / 1024).toFixed(0)} Ko · ${stored.storage}`)

  return NextResponse.json({ media })
}
