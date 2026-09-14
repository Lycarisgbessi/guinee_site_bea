import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { randomToken } from '@/lib/shared'

const MAX_SIZE = 25 * 1024 * 1024 // 25 Mo

/** POST /api/admin/media/upload — upload physique vers /public/uploads (§6.6) */
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Fichier trop volumineux (25 Mo max).' }, { status: 400 })

    const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
    const typeMap: Record<string, string> = {
      jpg: 'IMAGE', jpeg: 'IMAGE', png: 'IMAGE', webp: 'IMAGE', avif: 'IMAGE', gif: 'IMAGE', svg: 'IMAGE',
      mp4: 'VIDEO', webm: 'VIDEO', mov: 'VIDEO',
      pdf: 'PDF', mp3: 'AUDIO', wav: 'AUDIO',
    }
    const type = typeMap[ext] || 'DOC'

    const safeName = `${Date.now().toString(36)}-${randomToken(8)}.${ext}`
    const dir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(dir, { recursive: true })
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(path.join(dir, safeName), buffer)

    const media = await db.media.create({
      data: {
        url: `/uploads/${safeName}`,
        filename: file.name,
        type,
        size: file.size,
        alt: (formData.get('alt') as string) || null,
        caption: (formData.get('caption') as string) || null,
        credit: (formData.get('credit') as string) || null,
        uploadedById: session.userId,
      },
    })

    await logActivity('MEDIA_UPLOAD', media.filename, `${type} — ${Math.round(file.size / 1024)} Ko`)
    return NextResponse.json({ media })
  } catch {
    return NextResponse.json({ error: 'Échec de l’upload.' }, { status: 500 })
  }
}
