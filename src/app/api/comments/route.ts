import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rateLimit, sanitizeText, isValidEmail } from '@/lib/shared'

/** POST /api/comments — dépôt d’un commentaire (modération a priori, §6.8) */
export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anon'
    const rl = rateLimit(`comment:${ip}`, 5, 10 * 60_000)
    if (!rl.ok) return NextResponse.json({ error: 'Trop de commentaires. Réessayez plus tard.' }, { status: 429 })

    const body = await req.json().catch(() => null)
    const articleId = sanitizeText(body?.articleId, 50)
    const authorName = sanitizeText(body?.authorName, 100)
    const email = sanitizeText(body?.email, 200)
    const content = sanitizeText(body?.content, 2000)

    if (!articleId) return NextResponse.json({ error: 'Article invalide.' }, { status: 400 })
    if (authorName.length < 2) return NextResponse.json({ error: 'Nom trop court.' }, { status: 400 })
    if (!isValidEmail(email)) return NextResponse.json({ error: 'Email invalide.' }, { status: 400 })
    if (content.length < 10) return NextResponse.json({ error: 'Commentaire trop court (10 caractères minimum).' }, { status: 400 })

    const article = await db.article.findFirst({
      where: { id: articleId, commentsEnabled: true, deletedAt: null },
      select: { id: true },
    })
    if (!article) return NextResponse.json({ error: 'Les commentaires sont fermés pour cet article.' }, { status: 403 })

    await db.comment.create({ data: { articleId, authorName, email, content, status: 'PENDING' } })
    return NextResponse.json({ ok: true, message: 'Votre commentaire sera publié après validation.' })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
