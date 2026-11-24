/**
 * SEED — Plateforme média « La Vigie »
 * Contenu éditorial de démonstration réaliste (FR)
 * Exécution : bun scripts/seed.ts
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

// ---------- Helpers Tiptap ----------
type TNode = Record<string, unknown>
const p = (text: string): TNode => ({ type: 'paragraph', content: [{ type: 'text', text }] })
const pi = (text: string): TNode => ({ type: 'paragraph', content: [{ type: 'text', text, marks: [{ type: 'italic' }] }] })
const h2 = (text: string) => ({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text }] })
const h3 = (text: string) => ({ type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text }] })
const quote = (text: string, author?: string) => ({
  type: 'blockquote',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text, marks: [{ type: 'italic' }] }] },
    ...(author ? [{ type: 'paragraph', content: [{ type: 'text', text: author, marks: [{ type: 'bold' }] }] }] : []),
  ],
})
const img = (url: string, alt: string, caption: string, credit: string) => ({
  type: 'image', attrs: { src: url, alt, caption, credit },
})
const hr = () => ({ type: 'horizontalRule' })
const ul = (items: string[]) => ({
  type: 'bulletList',
  content: items.map((t) => ({ type: 'listItem', content: [p(t)] })),
})
const yt = (src: string) => ({ type: 'youTube', attrs: { src, width: 640, height: 360 } })
const doc = (...content: TNode[]) => ({ type: 'doc', content })

const pic = (seed: string, w = 1600, h = 900) => `https://picsum.photos/seed/${seed}/${w}/${h}`

function textFrom(nodes: TNode[]): string {
  let out = ''
  const walk = (n: TNode) => {
    if (n.type === 'text' && typeof n.text === 'string') out += n.text + ' '
    if (Array.isArray(n.content)) (n.content as TNode[]).forEach(walk)
  }
  nodes.forEach(walk)
  return out.replace(/\s+/g, ' ').trim()
}

const words = (s: string) => s.trim().split(/\s+/).length
const minutes = (s: string) => Math.max(2, Math.round(words(s) / 200))

function daysAgo(n: number, hour = 9): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, 0, 0, 0)
  return d
}
function inDays(n: number, hour = 8): Date {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(hour, 30, 0, 0)
  return d
}

export { doc, p, pi, h2, h3, quote, img, hr, ul, yt, pic, textFrom, daysAgo, inDays, db, bcrypt, words, minutes }
