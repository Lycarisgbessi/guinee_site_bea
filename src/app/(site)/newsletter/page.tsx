import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { RichContent } from '@/components/article/rich-content'
import { NewsletterForm } from '@/components/site/newsletter-form'
import { getSettings } from '@/lib/settings'
import { formatDateFr } from '@/lib/shared'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Newsletter', robots: { index: false } }

/** Page newsletter : présentation, inscription, historique (§5.7) */
export default async function NewsletterPage() {
  const settings = await getSettings()

  // Historique des numéros : les 8 derniers articles publiés servent d’aperçu des envois
  const sent = await db.article.findMany({
    where: { status: 'PUBLISHED', deletedAt: null },
    orderBy: { publishedAt: 'desc' },
    take: 8,
    select: { slug: true, title: true, chapo: true, publishedAt: true },
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
      <h1 className="font-display text-4xl font-bold">La newsletter de {settings.site_name}</h1>
      <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">{settings.newsletter_intro}</p>

      <div className="mt-8 rounded-xl border border-border/70 bg-card p-8">
        <NewsletterForm />
      </div>

      <h2 className="mt-14 font-display text-2xl font-bold">Les derniers numéros</h2>
      <ul className="mt-6 space-y-5">
        {sent.map((a, i) => (
          <li key={a.slug} className="rounded-lg border border-border/70 bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="eyebrow text-muted-foreground">Numéro #{sent.length - i}</span>
              <time className="text-xs text-muted-foreground">{formatDateFr(a.publishedAt)}</time>
            </div>
            <h3 className="mt-2 font-display text-lg font-semibold">
              <a href={`/article/${a.slug}`} className="transition-colors hover:text-brand">{a.title}</a>
            </h3>
            {a.chapo && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.chapo}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}
