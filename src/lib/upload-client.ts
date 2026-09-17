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

  const fd = new FormData()
  fd.append('file', payload)
  const res = await fetch(UPLOAD_ENDPOINT, { method: 'POST', body: fd })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(data?.error || `Échec de l'envoi (${res.status})`)
  }
  return data.media as UploadedMedia
}
