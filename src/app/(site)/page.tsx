import Link from 'next/link'
import { Clock, Eye, Feather, Mail, Newspaper } from 'lucide-react'
import { db } from '@/lib/db'
import { getFeaturedArticle, getPublishedArticles, getVisibleCategories, publicVisibilityWhere } from '@/lib/public-queries'
import { ArticleCard, ArticleCardLarge, ArticleCardRow, CategoryBadge } from '@/components/site/article-card'
import { Reveal } from '@/components/site/reveal'
import { NewsletterForm } from '@/components/site/newsletter-form'
import { getSettings } from '@/lib/settings'
import { formatDateFr } from '@/lib/shared'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const settings = await getSettings()
  const blocks = await db.homepageBlock.findMany({ where: { active: true }, orderBy: { order: 'asc' } })

  // Pré-chargement des jeux de données usuels
  const featured = await getFeaturedArticle()
  const latest = await getPublishedArticles({ perPage: 24 })
  const reportages = latest.items.filter((a) => a.format === 'REPORTAGE' || a.format === 'PORTFOLIO')

  const rendered: React.ReactNode[] = []

  /* ---------- Fil direct (ticker) ---------- */
  const tickerItems = latest.items.slice(0, 6)
  if (tickerItems.length >= 3) {
    rendered.push(
      <div key="ticker" className="ticker border-b border-border/60 bg-secondary/40">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 md:px-6">
          <span
            className="shrink-0 rounded-sm px-2 py-1 text-[10.5px] font-bold uppercase tracking-[0.18em]"
            style={{ background: 'var(--brand)', color: 'var(--brand-foreground)' }}
          >
            Le fil
          </span>
          <div className="min-w-0 flex-1 overflow-hidden" aria-label="Derniers titres">
            <div className="ticker-track flex w-max items-center gap-10 py-2">
              {[...tickerItems, ...tickerItems].map((a, i) => (
                <Link
                  key={`${a.id}-${i}`}
                  href={`/article/${a.slug}`}
                  className="flex items-center gap-2.5 whitespace-nowrap text-[13px] text-foreground/80 transition-colors hover:text-brand"
                  aria-hidden={i >= tickerItems.length}
                  tabIndex={i >= tickerItems.length ? -1 : 0}
                >
                  <span className="h-1 w-1 rounded-full" style={{ background: 'var(--brand)' }} aria-hidden="true" />
                  {a.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>,
    )
  }

  for (const block of blocks) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = JSON.parse(block.configJson || '{}')

    if (block.blockType === 'HERO_UNE') {
      if (!featured) continue
      const secondary = latest.items.filter((a) => a.id !== featured.id).slice(0, config.secondaryCount ?? 4)
      const cat = featured.categories[0]?.category
      rendered.push(
        <section key={block.id} className="mx-auto max-w-6xl px-4 pb-14 pt-8 md:px-6">
          <div className="grid gap-8 lg:grid-cols-[7fr_5fr]">
            <Reveal>
              <article className="group relative overflow-hidden rounded-lg">
                <Link href={`/article/${featured.slug}`} className="block">
                  <div className="relative">
                    {featured.coverImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={featured.coverImage}
                        alt={featured.title}
                        className="w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.03]"
                        style={{ aspectRatio: '16/9' }}
                        loading="eager"
                        fetchPriority="high"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                    {/* Badge À la une */}
                    <span
                      className="absolute left-5 top-5 rounded-sm px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.18em] text-white shadow-lg"
                      style={{ background: 'var(--brand)' }}
                    >
                      À la une
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white md:p-8">
                    {cat && (
                      <span className="eyebrow" style={{ color: cat.color || '#fff' }}>
                        {cat.name}
                      </span>
                    )}
                    <h1 className="mt-2 max-w-3xl font-display text-3xl font-bold leading-[1.12] md:text-5xl">
                      {featured.title}
                    </h1>
                    {featured.chapo && (
                      <p className="mt-3 hidden max-w-2xl text-[15px] leading-relaxed text-white/85 md:block line-clamp-2">
                        {featured.chapo}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-white/80">
                      {featured.author?.name && <span>{featured.author.name}</span>}
                      {featured.publishedAt && <time>{formatDateFr(featured.publishedAt)}</time>}
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> {featured.readingTime} min de lecture
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            </Reveal>
            <div className="flex flex-col gap-6">
              {secondary.map((a, i) => (
                <Reveal key={a.id} delay={i * 0.08}>
                  <ArticleCard article={a} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )
    }

    if (block.blockType === 'FIL_ACTU') {
      const items = latest.items
        .filter((a) => a.id !== featured?.id)
        .slice(0, config.count ?? 6)
      if (!items.length) continue
      rendered.push(
        <section key={block.id} className="border-y border-border/60 bg-secondary/30">
          <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
            <Reveal>
              <div className="mb-8 flex items-baseline justify-between">
                <h2 className="font-display text-2xl font-bold md:text-3xl">{config.title || 'L’actualité'}</h2>
                <Link href="/archives" className="eyebrow text-muted-foreground transition-colors hover:text-foreground">
                  Toutes les archives →
                </Link>
              </div>
            </Reveal>
            <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
              {items.map((a, i) => (
                <Reveal key={a.id} delay={(i % 3) * 0.06}>
                  <ArticleCardRow article={a} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )
    }

    if (block.blockType === 'REPORTAGES_PHARES') {
      const items = reportages.filter((a) => a.id !== featured?.id).slice(0, config.count ?? 3)
      if (!items.length) continue
      rendered.push(
        <section key={block.id} className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <Reveal>
            <div className="mb-8">
              <span className="eyebrow text-brand">Formats longs</span>
              <h2 className="mt-1 font-display text-2xl font-bold md:text-3xl">{config.title || 'Reportages phares'}</h2>
            </div>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            {items.map((a, i) => (
              <Reveal key={a.id} delay={i * 0.1}>
                <ArticleCardLarge article={a} />
              </Reveal>
            ))}
          </div>
        </section>
      )
    }

    if (block.blockType === 'RUBRIQUE_STRIP') {
      const catSlug: string = config.categorySlug
      if (!catSlug) continue
      const { items } = await getPublishedArticles({ categorySlug: catSlug, perPage: 3 })
      if (!items.length) continue
      const cat = items[0].categories[0]?.category
      rendered.push(
        <section key={block.id} className="border-t border-border/60">
          <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
            <Reveal>
              <div className="mb-8 flex items-center justify-between">
                <div>
                  {cat && <CategoryBadge {...cat} size="lg" />}
                  <h2 className="mt-1 font-display text-2xl font-bold md:text-3xl">{config.title || cat?.name}</h2>
                </div>
                <Link
                  href={`/rubrique/${catSlug}`}
                  className="eyebrow text-muted-foreground transition-colors hover:text-foreground"
                >
                  Voir la rubrique →
                </Link>
              </div>
            </Reveal>
            <div className="grid gap-8 md:grid-cols-3">
              {items.map((a, i) => (
                <Reveal key={a.id} delay={i * 0.1}>
                  <ArticleCard article={a} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )
    }

    if (block.blockType === 'CITATION') {
      const withQuote = latest.items.find((a) => a.id !== featured?.id)
      if (!withQuote?.chapo) continue
      rendered.push(
        <section key={block.id} className="border-y border-border/60 bg-secondary/30">
          <div className="mx-auto max-w-4xl px-6 py-16 text-center">
            <Reveal>
              <p className="font-display text-2xl italic leading-snug text-foreground/90 md:text-[28px]">
                «&nbsp;{withQuote.chapo}&nbsp;»
              </p>
              <Link href={`/article/${withQuote.slug}`} className="eyebrow mt-5 inline-block text-brand hover:opacity-80">
                {withQuote.title} →
              </Link>
            </Reveal>
          </div>
        </section>
      )
    }

    if (block.blockType === 'NEWSLETTER') {
      rendered.push(
        <section key={block.id} className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card p-8 md:p-12">
              <div className="paper-texture absolute inset-0" />
              <div className="relative grid items-center gap-8 md:grid-cols-2">
                <div>
                  <span className="eyebrow text-brand">Newsletter</span>
                  <h2 className="mt-2 font-display text-3xl font-bold">Ne manquez rien de nos enquêtes</h2>
                  <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                    {settings.newsletter_intro}
                  </p>
                </div>
                <div>
                  <NewsletterForm />
                  <p className="mt-3 text-xs text-muted-foreground">
                    Double opt-in — confirmation par email. Désinscription en un clic (RGPD).
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      )
    }
  }

  /* ---------- Bandeau de confiance (pré-footer) ---------- */
  const [totalArticles, totalRubriques, vuesSum, abonnes] = await Promise.all([
    db.article.count({ where: publicVisibilityWhere() }),
    getVisibleCategories().then((c) => c.length),
    db.article.aggregate({ _sum: { views: true } }),
    db.newsletterSubscriber.count({ where: { status: 'CONFIRMED' } }),
  ])
  const stats = [
    { icon: Newspaper, value: String(totalArticles), label: 'articles & enquêtes publiés' },
    { icon: Feather, value: String(totalRubriques), label: 'rubriques éditoriales' },
    { icon: Eye, value: (vuesSum._sum.views ?? 0).toLocaleString('fr-FR'), label: 'lectures depuis le lancement' },
    { icon: Mail, value: String(abonnes), label: 'abonnés à la newsletter' },
  ]
  rendered.push(
    <section key="trust-band" className="border-t border-border/60" style={{ background: 'var(--brand)' }}>
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <Reveal>
          <p className="text-center font-display text-2xl font-bold text-white md:text-[28px]">
            Un journalisme indépendant, financé par ses lecteurs
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-center text-[14px] leading-relaxed text-white/75">
            Aucun actionnaire, aucune publicité dissimulée — uniquement des enquêtes de terrain et des
            interviews exigeantes, libres d’accès.
          </p>
        </Reveal>
        <div className="mt-9 grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map(({ icon: Icon, value, label }, i) => (
            <Reveal key={label} delay={i * 0.06}>
              <div className="text-center">
                <Icon className="mx-auto h-5 w-5 text-white/70" aria-hidden="true" />
                <p className="mt-2 font-display text-3xl font-bold text-white">{value}</p>
                <p className="mt-1 text-[12px] uppercase tracking-wider text-white/70">{label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>,
  )

  return <>{rendered}</>
}
