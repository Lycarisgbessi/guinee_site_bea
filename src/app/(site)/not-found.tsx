import Link from 'next/link'
import { Compass } from 'lucide-react'
import { db } from '@/lib/db'
import { publicVisibilityWhere } from '@/lib/public-queries'
import { ArticleCardRow } from '@/components/site/article-card'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Page introuvable' }

/** Page 404 personnalisée avec suggestions d’articles (§5.7) */
export default async function NotFound() {
  const suggestions = await db.article
    .findMany({
      where: publicVisibilityWhere(),
      orderBy: { views: 'desc' },
      take: 3,
      include: { author: { select: { name: true } }, categories: { include: { category: true } }, tags: { include: { tag: true } } },
    })
    .catch(() => [])

  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center md:px-6">
      <p className="font-display text-[110px] font-bold leading-none text-brand/25">404</p>
      <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">Cette page a quitté la salle de rédaction</h1>
      <p className="mx-auto mt-4 max-w-md leading-relaxed text-muted-foreground">
        Le contenu que vous cherchez a peut-être été déplacé, renommé ou n’a jamais existé.
        Pas d’inquiétude : voici nos articles les plus lus pour reprendre la lecture.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-md px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: 'var(--brand)', color: 'var(--brand-foreground)' }}
        >
          Retour à l’accueil
        </Link>
        <Link
          href="/recherche"
          className="inline-flex items-center gap-2 rounded-md border border-border px-6 py-3 text-sm font-medium transition-colors hover:border-foreground/40"
        >
          <Compass className="h-4 w-4" /> Rechercher un article
        </Link>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-14 text-left">
          <h2 className="mb-6 font-display text-xl font-bold">Les plus lus du moment</h2>
          <div className="space-y-6">
            {suggestions.map((a) => (
              <ArticleCardRow key={a.id} article={a as never} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
