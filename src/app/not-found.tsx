import Link from 'next/link'

/** 404 globale (contextes hors site public, ex. dashboard) */
export default function GlobalNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-display text-8xl font-bold text-brand/25">404</p>
      <h1 className="font-display text-2xl font-bold">Page introuvable</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        La page demandée n’existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-md px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
        style={{ background: 'var(--brand)', color: 'var(--brand-foreground)' }}
      >
        Retour à l’accueil
      </Link>
    </div>
  )
}
