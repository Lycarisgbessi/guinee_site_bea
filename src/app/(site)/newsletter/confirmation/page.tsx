import Link from 'next/link'
import { CheckCircle2, XCircle } from 'lucide-react'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Confirmation newsletter', robots: { index: false } }

/** Double opt-in : confirmation via token (§5.1, §11 RGPD) */
export default async function NewsletterConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  let ok = false

  if (token) {
    try {
      const sub = await db.newsletterSubscriber.findUnique({ where: { token } })
      if (sub && sub.status === 'PENDING') {
        await db.newsletterSubscriber.update({
          where: { token },
          data: { status: 'CONFIRMED', confirmedAt: new Date() },
        })
        ok = true
      } else if (sub?.status === 'CONFIRMED') {
        ok = true
      }
    } catch {
      ok = false
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      {ok ? (
        <>
          <CheckCircle2 className="h-14 w-14 text-brand" />
          <h1 className="mt-5 font-display text-3xl font-bold">Inscription confirmée</h1>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Merci ! Vous recevrez désormais notre sélection chaque vendredi. À très vite.
          </p>
        </>
      ) : (
        <>
          <XCircle className="h-14 w-14 text-muted-foreground" />
          <h1 className="mt-5 font-display text-3xl font-bold">Lien invalide ou expiré</h1>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Ce lien de confirmation n’est plus valable. Si besoin, réinscrivez-vous depuis la page newsletter.
          </p>
        </>
      )}
      <Link
        href="/"
        className="mt-8 rounded-md px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
        style={{ background: 'var(--brand)', color: 'var(--brand-foreground)' }}
      >
        Retour à l’accueil
      </Link>
    </div>
  )
}
