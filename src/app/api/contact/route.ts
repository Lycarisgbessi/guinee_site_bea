import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rateLimit, sanitizeText, isValidEmail } from '@/lib/shared'

/**
 * POST /api/contact — envoi du formulaire de contact (§8.2)
 * Anti-spam : honeypot + rate limiting + validation stricte Zod-like (§8.3)
 */
export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anon'
    const rl = rateLimit(`contact:${ip}`, 5, 10 * 60_000) // 5 messages / 10 min
    if (!rl.ok) {
      return NextResponse.json({ error: 'Trop de messages envoyés. Réessayez dans quelques minutes.' }, { status: 429 })
    }

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })

    // Honeypot : champ invisible destiné aux bots
    if (typeof body.company === 'string' && body.company.length > 0) {
      return NextResponse.json({ ok: true }) // faux succès pour le bot
    }

    const name = sanitizeText(body.name, 100)
    const email = sanitizeText(body.email, 200)
    const subject = sanitizeText(body.subject, 200)
    const message = sanitizeText(body.message, 5000)
    const isTip = body.isTip === true

    if (name.length < 2) return NextResponse.json({ error: 'Veuillez indiquer votre nom.' }, { status: 400 })
    if (!isValidEmail(email)) return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 })
    if (subject.length < 3) return NextResponse.json({ error: 'Veuillez préciser un sujet.' }, { status: 400 })
    if (message.length < 10) return NextResponse.json({ error: 'Votre message est trop court (10 caractères minimum).' }, { status: 400 })

    await db.contactMessage.create({ data: { name, email, subject, message, isTip } })
    return NextResponse.json({ ok: true, message: 'Message envoyé. La rédaction vous répondra sous 48 h ouvrées.' })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur. Réessayez plus tard.' }, { status: 500 })
  }
}
