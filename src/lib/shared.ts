/** Utilitaires partagés */

/** Génère un slug URL propre depuis un titre (accents français gérés) */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[æ]/g, 'ae')
    .replace(/[œ]/g, 'oe')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90)
}

/** Estime le temps de lecture en minutes (200 mots/min) */
export function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

/** Extrait le texte brut d'un document Tiptap JSON */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function tiptapToText(doc: any): string {
  if (!doc || typeof doc !== 'object') return ''
  let out = ''
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const walk = (node: any) => {
    if (!node) return
    if (node.type === 'text' && node.text) out += node.text + ' '
    if (node.type === 'image') {
      if (node.attrs?.caption) out += node.attrs.caption + ' '
      if (node.attrs?.alt) out += node.attrs.alt + ' '
    }
    if (Array.isArray(node.content)) node.content.forEach(walk)
  }
  walk(doc)
  return out.replace(/\s+/g, ' ').trim()
}

/** Formatage dates FR */
export function formatDateFr(date: Date | string | null | undefined, withTime = false): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

export function formatDateShortFr(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Nom du format d'article */
export const FORMAT_LABELS: Record<string, string> = {
  ARTICLE: 'Article',
  REPORTAGE: 'Reportage',
  INTERVIEW: 'Interview',
  PORTFOLIO: 'Portfolio',
  VIDEO: 'Vidéo',
}

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  REVIEW: 'En relecture',
  SCHEDULED: 'Programmé',
  PUBLISHED: 'Publié',
  ARCHIVED: 'Archivé',
}

/** Rate limiting en mémoire (routes publiques sensibles) */
const buckets = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter?: number } {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true }
  }
  bucket.count++
  if (bucket.count > limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) }
  }
  return { ok: true }
}

/** Nettoyage basique anti-XSS des entrées texte simples */
export function sanitizeText(input: unknown, maxLen = 5000): string {
  if (typeof input !== 'string') return ''
  return input.replace(/[<>]/g, '').trim().slice(0, maxLen)
}

/** Valide un email */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
}

/** Génère un token aléatoire */
export function randomToken(len = 32): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

/** Couleurs présets pour rubriques */
export const CATEGORY_COLORS = [
  '#A03123', '#1F5F4A', '#2C4A7C', '#8A5A0F', '#5B3A7E', '#7A2048', '#33556B', '#4A5D23',
]
