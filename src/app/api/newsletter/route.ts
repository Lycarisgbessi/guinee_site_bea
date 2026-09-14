import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rateLimit, sanitizeText, isValidEmail, randomToken } from '@/lib/shared'

/**
 * POST /api/newsletter — inscription avec double opt-in (§5.1, §11 RGPD)
 * En production, le lien de confirmation est envoyé par email (Resend/SendGrid).
 * Dans cet environnement de démonstration, le lien est renvoyé et visible dans le dashboard.
 */
export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anon'
    const rl = rateLimit(`newsletter:${ip}`, 5, 10 * 60_000)
    if (!rl.ok) {
      return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans quelques minutes.' }, { status: 429 })
    }

    const body = await req.json().catch(() => null)
    const email = sanitizeText(body?.email, 200).toLowerCase()

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 })
    }

    const existing = await db.newsletterSubscriber.findUnique({ where: { email } })
    if (existing) {
      if (existing.status === 'CONFIRMED') {
        return NextResponse.json({ ok: true, message: 'Vous êtes déjà abonné(e) à la newsletter. À vendredi !' })
      }
      // Renvoyer le lien de confirmation
      return NextResponse.json({
        ok: true,
        message: 'Un nouveau lien de confirmation vous a été envoyé.',
        confirmUrl: `/newsletter/confirmation?token=${existing.token}`,
        devConfirmUrl: `/newsletter/confirmation?token=${existing.token}`,
      })
    }

    const token = randomToken(40)
    await db.newsletterSubscriber.create({ data: { email, token, status: 'PENDING' } })

    return NextResponse.json({
      ok: true,
      message: 'Inscription enregistrée ! Confirmez votre adresse via l’email reçu (double opt-in).',
      confirmUrl: `/newsletter/confirmation?token=${token}`,
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur. Réessayez plus tard.' }, { status: 500 })
  }
}
