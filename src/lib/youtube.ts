/**
 * Utilitaires YouTube — extraction d'ID, miniatures, intégration.
 * Accepte tous les formats de lien courants :
 *  - https://www.youtube.com/watch?v=VIDEO_ID
 *  - https://youtu.be/VIDEO_ID
 *  - https://www.youtube.com/embed/VIDEO_ID
 *  - https://www.youtube.com/shorts/VIDEO_ID
 *  - https://www.youtube.com/live/VIDEO_ID
 *  - https://m.youtube.com/watch?v=VIDEO_ID
 */

const ID_RE = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/

/** Extrait l'ID (11 caractères) d'un lien YouTube, ou null si invalide */
export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null
  const m = url.trim().match(ID_RE)
  if (m) return m[1]
  // Cas particulier : ID brut collé directement
  if (/^[\w-]{11}$/.test(url.trim())) return url.trim()
  return null
}

/** URL d'intégration privacy-friendly (youtube-nocookie) */
export function youtubeEmbedUrl(idOrUrl: string | null | undefined): string | null {
  const id = youtubeId(idOrUrl)
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null
}

/** Miniature officielle YouTube (hqdefault = 480×360, toujours disponible) */
export function youtubeThumb(idOrUrl: string | null | undefined, quality: 'hq' | 'max' = 'hq'): string | null {
  const id = youtubeId(idOrUrl)
  if (!id) return null
  return `https://i.ytimg.com/vi/${id}/${quality === 'max' ? 'maxresdefault' : 'hqdefault'}.jpg`
}
