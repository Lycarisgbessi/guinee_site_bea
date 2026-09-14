import { NextResponse } from 'next/server'
import { login } from '@/lib/auth'
import { rateLimit } from '@/lib/shared'
import { logActivity } from '@/lib/activity'

/** POST /api/auth/login — connexion au tableau de bord (§6.1) */
export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anon'
    const rl = rateLimit(`login:${ip}`, 10, 5 * 60_000)
    if (!rl.ok) return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans 5 minutes.' }, { status: 429 })

    const body = await req.json().catch(() => null)
    const email = typeof body?.email === 'string' ? body.email : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    if (!email || !password) return NextResponse.json({ error: 'Email et mot de passe requis.' }, { status: 400 })

    const session = await login(email, password)
    if (!session) {
      return NextResponse.json({ error: 'Identifiants incorrects ou compte désactivé.' }, { status: 401 })
    }
    await logActivity('LOGIN', session.email, 'Connexion au tableau de bord')
    return NextResponse.json({ ok: true, user: session })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
