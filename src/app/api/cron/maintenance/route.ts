import { NextResponse } from 'next/server'
import { runMaintenance } from '@/lib/maintenance'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * GET /api/cron/maintenance — tâche planifiée Vercel (quotidienne, 03:00 UTC).
 *
 * Deux façons de s'authentifier :
 *  - le cron Vercel : en-tête « Authorization: Bearer <CRON_SECRET> »
 *    (Vercel l'ajoute automatiquement si la variable CRON_SECRET existe) ;
 *  - un admin connecté : bouton « Lancer maintenant » du dashboard.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization') || ''
  const cronSecret = process.env.CRON_SECRET
  const viaCron = cronSecret ? authHeader === `Bearer ${cronSecret}` : false

  let viaAdmin = false
  if (!viaCron) {
    const session = await getSession()
    viaAdmin = session !== null && ['ADMIN', 'EDITEUR'].includes(session.role)
  }

  if (!viaCron && !viaAdmin) {
    if (!cronSecret && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'CRON_SECRET non configuré — le cron ne peut pas s’authentifier.' },
        { status: 401 },
      )
    }
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  try {
    const report = await runMaintenance()
    return NextResponse.json({ ok: true, ...report })
  } catch (err) {
    console.error('[cron/maintenance]', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
