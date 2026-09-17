import { NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import sharp from 'sharp'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ---------- Limites et types acceptés ----------
const MAX_SIZE: Record<string, number> = {
  IMAGE: 15 * 1024 * 1024, // 15 Mo
  VIDEO: 80 * 1024 * 1024, // 80 Mo
  AUDIO: 25 * 1024 * 1024,
  PDF: 25 * 1024 * 1024,
  DOC: 25 * 1024 * 1024,
}

const MIME_MAP: Record<string, string> = {
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
    return NextResponse.json({ error: 'Requête invalide (fichier attendu).' }, { status: 400 })
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
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dirRel = path.posix.join('uploads', String(yyyy), mm)
  const dirAbs = path.join(process.cwd(), 'public', dirRel)
  await mkdir(dirAbs, { recursive: true })

  let outName: string
  let outBuffer: Buffer<ArrayBufferLike> = buffer
  let width: number | null = null
  let height: number | null = null

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
      outName = `${randomUUID()}.webp`
    } else {
      const ext = EXT_BY_MIME[mime] || (file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin')
      outName = `${randomUUID()}.${ext}`
    }
  } catch {
    // Image illisible par sharp : on stocke l'original tel quel plutôt que d'échouer
    const ext = EXT_BY_MIME[mime] || 'jpg'
    outName = `${randomUUID()}.${ext}`
  }

  await writeFile(path.join(dirAbs, outName), outBuffer)
  const url = `/${dirRel}/${outName}`

  const media = await db.media.create({
    data: {
      url,
      filename: safeName(file.name),
      type,
      size: outBuffer.length,
      width,
      height,
      alt: typeof form.get('alt') === 'string' ? (form.get('alt') as string) || null : null,
      uploadedById: session.userId,
    },
  })

  await logActivity('MEDIA_UPLOAD', media.filename, `${type} · ${(outBuffer.length / 1024).toFixed(0)} Ko`)

  return NextResponse.json({ media })
}
