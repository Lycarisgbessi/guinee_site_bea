import Link from 'next/link'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { publicVisibilityWhere } from '@/lib/public-queries'
import { Breadcrumb } from '@/components/site/breadcrumb'
import { Reveal } from '@/components/site/reveal'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Mots-clés' }

/** Liste et navigation par mots-clés (§5.7) */
export default async function TagsPage() {
  const tags = await db.tag.findMany({
    include: { _count: { select: { articles: { where: { article: publicVisibilityWhere() } } } } },
    orderBy: { name: 'asc' },
  })
  const used = tags.filter((t) => t._count.articles > 0)
  const max = Math.max(...used.map((t) => t._count.articles), 1)

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
      <Breadcrumb items={[{ label: 'Mots-clés' }]} />
      <h1 className="mt-4 font-display text-4xl font-bold">Mots-clés</h1>
      <p className="mt-3 text-[15px] text-muted-foreground">
        Explorez les contenus par thème. La taille des libellés reflète leur fréquence dans le média.
      </p>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        {used.map((t, i) => {
          const scale = 0.85 + (t._count.articles / max) * 0.75
          return (
            <Reveal key={t.id} delay={i * 0.03} y={12}>
              <Link
                href={`/tag/${t.slug}`}
                className="inline-flex items-baseline gap-1.5 rounded-full border border-border/80 px-4 py-2 transition-all hover:-translate-y-0.5 hover:border-brand hover:text-brand"
                style={{ fontSize: `${scale}rem` }}
              >
                <span className="font-display font-semibold">#{t.name}</span>
                <span className="text-xs text-muted-foreground">{t._count.articles}</span>
              </Link>
            </Reveal>
          )
        })}
        {used.length === 0 && <p className="text-muted-foreground">Aucun mot-clé pour le moment.</p>}
      </div>
    </div>
  )
}
