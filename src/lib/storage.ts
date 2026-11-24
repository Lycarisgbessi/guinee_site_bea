import crypto from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

/**
 * COUCHE STOCKAGE MÉDIA
 * ---------------------
 * Production (Vercel) : Cloudinary (plan gratuit ~25 Go + CDN mondial).
 *   → le système de fichiers serverless est éphémère, on ne peut plus écrire
 *     sur disque ; les médias vont dans un stockage objet.
 * Dev local sans CLOUDINARY_URL : repli sur public/uploads (disque), comme avant.
 *
 * Configuration : CLOUDINARY_URL="cloudinary://<api_key>:<api_secret>@<cloud_name>"
 * (aucune dépendance npm : upload signé SHA-1 + fetch natif)
 */

export interface CloudinaryCreds {
  cloudName: string
  apiKey: string
  apiSecret: string
}

export function getCloudinaryCreds(): CloudinaryCreds | null {
  const url = process.env.CLOUDINARY_URL
  if (!url) return null
  const m = url.match(/^cloudinary:\/\/([^:]+):([^@]+)@([\w-]+)$/)
  if (!m) {
    console.warn('[storage] CLOUDINARY_URL présent mais mal formé (attendu cloudinary://key:secret@cloud_name)')
    return null
  }
  return { apiKey: m[1], apiSecret: m[2], cloudName: m[3] }
}

export function isCloudinaryConfigured(): boolean {
  return getCloudinaryCreds() !== null
}

/** Signature d'upload Cloudinary : SHA-1 des params triés + api_secret */
export function signUploadParams(creds: CloudinaryCreds, params: Record<string, string>): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')
  return crypto.createHash('sha1').update(toSign + creds.apiSecret).digest('hex')
}

export interface StoredMedia {
  url: string
  size: number
  width: number | null
  height: number | null
  storage: 'cloudinary' | 'local'
}

export interface CloudinaryUploadResult {
  secure_url: string
  bytes: number
  width?: number
  height?: number
  format: string
  resource_type: string
}

/** Upload d'un buffer vers Cloudinary (upload signé côté serveur) */
export async function uploadToCloudinary(
  buffer: Buffer,
  opts: { resourceType: 'image' | 'video' | 'auto'; filename: string },
): Promise<CloudinaryUploadResult> {
  const creds = getCloudinaryCreds()
  if (!creds) throw new Error('Cloudinary non configuré')

  const now = new Date()
  const folder = `guineeplus/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`
  const timestamp = Math.round(Date.now() / 1000).toString()
  const signature = signUploadParams(creds, { folder, timestamp })

  const form = new FormData()
  form.append('file', new Blob([new Uint8Array(buffer)]), opts.filename)
  form.append('api_key', creds.apiKey)
  form.append('timestamp', timestamp)
  form.append('folder', folder)
  form.append('signature', signature)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${creds.cloudName}/${opts.resourceType}/upload`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Cloudinary a refusé l'envoi (${res.status}) ${detail.slice(0, 200)}`)
  }
  return (await res.json()) as CloudinaryUploadResult
}

/** Écrit sur le disque local (repli dev uniquement — éphémère sur Vercel) */
async function writeToLocalDisk(
  buffer: Buffer,
  ext: string,
): Promise<{ url: string; size: number }> {
  const { randomUUID } = await import('crypto')
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dirRel = path.posix.join('uploads', String(yyyy), mm)
  const dirAbs = path.join(process.cwd(), 'public', dirRel)
  await mkdir(dirAbs, { recursive: true })
  const outName = `${randomUUID()}.${ext}`
  await writeFile(path.join(dirAbs, outName), buffer)
  return { url: `/${dirRel}/${outName}`, size: buffer.length }
}

/**
 * Sauvegarde un média optimisé : Cloudinary si configuré, disque local sinon.
 * @param ext extension SANS point (ex. 'webp', 'mp4')
 */
export async function saveMedia(
  buffer: Buffer,
  opts: {
    type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'PDF' | 'DOC'
    ext: string
    width?: number | null
    height?: number | null
  },
): Promise<StoredMedia> {
  if (isCloudinaryConfigured()) {
    const resourceType = opts.type === 'IMAGE' ? 'image' : opts.type === 'VIDEO' ? 'video' : 'auto'
    const filename = `upload-${Date.now()}.${opts.ext}`
    const result = await uploadToCloudinary(buffer, { resourceType, filename })
    return {
      url: result.secure_url,
      size: result.bytes ?? buffer.length,
      width: result.width ?? opts.width ?? null,
      height: result.height ?? opts.height ?? null,
      storage: 'cloudinary',
    }
  }
  const local = await writeToLocalDisk(buffer, opts.ext)
  return {
    url: local.url,
    size: local.size,
    width: opts.width ?? null,
    height: opts.height ?? null,
    storage: 'local',
  }
}
