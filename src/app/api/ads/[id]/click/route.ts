import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/ads/:id/click — pont de clic publicitaire :
 * enregistre le clic puis redirige vers la cible de l'annonce.
 * Public (aucune authentification), redirection 302.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ad = await db.ad.findUnique({ where: { id } })
  if (!ad || !ad.linkUrl || !/^https?:\/\//i.test(ad.linkUrl)) {
    return NextResponse.redirect(new URL('/', _req.url), 302)
  }
  db.ad
    .update({ where: { id }, data: { clicks: { increment: 1 } } })
    .catch(() => {})
  return NextResponse.redirect(ad.linkUrl, 302)
}
