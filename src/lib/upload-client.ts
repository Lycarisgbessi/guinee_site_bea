'use client'

/**
 * Compression d'image CÔTÉ NAVIGATEUR avant envoi.
 * Objectif : réduire le temps d'upload de plusieurs Mo à quelques centaines de Ko
 * (crucial sur connexions mobiles lentes). Le serveur ré-optimise ensuite avec sharp.
 */

export const UPLOAD_ENDPOINT = '/api/admin/media/upload'

export interface UploadedMedia {
  id: string
  url: string
  filename: string
  type: string
  size: number | null
  width: number | null
  height: number | null
  alt: string | null
}

/** Formats qu'on ne compresse jamais (animation / vectoriel) */
function isPassthrough(file: File): boolean {
  return file.type === 'image/gif' || file.type === 'image/svg+xml' || !file.type.startsWith('image/')
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file)
    } catch {
      /* fallback ci-dessous */
    }
  }
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image illisible'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Redimensionne + compresse une image. PNG reste PNG (transparence préservée),
 * les autres passent en JPEG qualité 0.85. Retourne le fichier original s'il
 * est déjà petit et sans redimensionnement nécessaire.
 */
export async function compressImage(file: File, maxDim = 2560, quality = 0.85): Promise<File> {
  if (isPassthrough(file)) return file
  if (file.size < 200 * 1024) return file // < 200 Ko : rien à gagner

  let bitmap: ImageBitmap | HTMLImageElement
  try {
    bitmap = await loadBitmap(file)
  } catch {
    return file
  }
  const w = 'width' in bitmap ? bitmap.width : 0
  const h = 'height' in bitmap ? bitmap.height : 0
  if (!w || !h) return file

  const scale = Math.min(1, maxDim / Math.max(w, h))
  if (scale === 1 && file.size < 1024 * 1024) return file // déjà dans les limites

  const cw = Math.round(w * scale)
  const ch = Math.round(h * scale)
  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, cw, ch)

  const keepPng = file.type === 'image/png' || file.type === 'image/webp'
  const outType = keepPng ? 'image/png' : 'image/jpeg'

  const blob = await new Promise<Blob | null>((resolve) => {
    if ('convertToBlob' in canvas) {
      // @ts-expect-error OffscreenCanvas
      resolve(canvas.convertToBlob({ type: outType, quality }))
    } else {
      canvas.toBlob((b) => resolve(b), outType, quality)
    }
  })
  if (!blob || blob.size >= file.size) return file // compression inefficace : original

  const ext = outType === 'image/png' ? '.png' : '.jpg'
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'image'
  return new File([blob], `${baseName}${ext}`, { type: outType })
}

/** Upload d'un fichier vers la médiathèque (avec compression auto des images). */
export async function uploadFile(file: File, opts: { compress?: boolean } = {}): Promise<UploadedMedia> {
  const { compress = true } = opts
  const payload = compress && file.size > 200 * 1024 ? await compressImage(file) : file

  // Gros fichiers : upload DIRECT navigateur → Cloudinary (signé), pour
  // contourner la limite ~4,5 Mo du corps de requête serverless (Vercel).
  // Repli transparent sur l'upload serveur si l'import direct n'est pas
  // disponible (dev sans Cloudinary, petite taille…).
  if (payload.size > 4 * 1024 * 1024) {
    try {
      return await uploadDirectCloudinary(payload)
    } catch (err) {
      // Pas de Cloudinary configuré, ou fichier finalement passable par le
      // serveur : on tente la voie normale (le serveur donnera l'erreur juste)
      if (payload.size <= 4.4 * 1024 * 1024) return await uploadViaServer(payload)
      throw err
    }
  }
  return await uploadViaServer(payload)
}

async function uploadViaServer(payload: File): Promise<UploadedMedia> {
  const fd = new FormData()
  fd.append('file', payload)
  const res = await fetch(UPLOAD_ENDPOINT, { method: 'POST', body: fd })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(data?.error || `Échec de l'envoi (${res.status})`)
  }
  return data.media as UploadedMedia
}

/** Mapping format Cloudinary → type interne */
const FORMAT_TYPE: Record<string, string> = {
  jpg: 'IMAGE', jpeg: 'IMAGE', png: 'IMAGE', webp: 'IMAGE', gif: 'IMAGE', avif: 'IMAGE', svg: 'IMAGE',
  mp4: 'VIDEO', webm: 'VIDEO', mov: 'VIDEO',
  pdf: 'PDF', mp3: 'AUDIO', wav: 'AUDIO', m4a: 'AUDIO',
}

async function uploadDirectCloudinary(payload: File): Promise<UploadedMedia> {
  // 1. Paramètres signés par le serveur (jamais d'api_secret côté navigateur)
  const signRes = await fetch('/api/admin/media/sign')
  if (!signRes.ok) throw new Error('Import direct indisponible (stockage non configuré).')
  const sign = await signRes.json()

  // 2. Envoi direct du fichier à Cloudinary
  const fd = new FormData()
  fd.append('file', payload)
  fd.append('api_key', sign.apiKey)
  fd.append('timestamp', String(sign.timestamp))
  fd.append('folder', sign.folder)
  fd.append('signature', sign.signature)
  const upRes = await fetch(sign.uploadUrl, { method: 'POST', body: fd })
  if (!upRes.ok) {
    const detail = await upRes.text().catch(() => '')
    throw new Error(`Cloudinary a refusé le fichier (${upRes.status}). ${detail.slice(0, 120)}`)
  }
  const uploaded = await upRes.json()

  // 3. Enregistrement du média en base
  const regRes = await fetch('/api/admin/media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: 'cloudinary-direct',
      url: uploaded.secure_url,
      filename: payload.name,
      type: FORMAT_TYPE[(uploaded.format || '').toLowerCase()] || 'DOC',
      size: uploaded.bytes ?? payload.size,
      width: uploaded.width ?? null,
      height: uploaded.height ?? null,
    }),
  })
  const data = await regRes.json().catch(() => null)
  if (!regRes.ok) throw new Error(data?.error || 'Enregistrement du média impossible.')
  return data.media as UploadedMedia
}
