import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getCloudinaryCreds, signUploadParams } from '@/lib/storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/media/sign — paramètres signés pour un upload DIRECT
 * navigateur → Cloudinary (sans passer par le serveur).
 * Nécessaire pour les fichiers > ~4,5 Mo (limite du corps de requête
 * serverless Vercel) : vidéos, PDF lourds…
 * Le client envoie ensuite le fichier à Cloudinary puis enregistre le
 * média via POST /api/admin/media.
 */
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const creds = getCloudinaryCreds()
  if (!creds) {
    return NextResponse.json(
      { error: 'Stockage Cloudinary non configuré (CLOUDINARY_URL absent) — l’import direct n’est pas disponible.' },
      { status: 503 },
    )
  }

  const now = new Date()
  const folder = `guineeplus/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`
  const timestamp = Math.round(Date.now() / 1000).toString()
  const signature = signUploadParams(creds, { folder, timestamp })

  return NextResponse.json({
    cloudName: creds.cloudName,
    apiKey: creds.apiKey,
    folder,
    timestamp,
    signature,
    uploadUrl: `https://api.cloudinary.com/v1_1/${creds.cloudName}/auto/upload`,
  })
}
