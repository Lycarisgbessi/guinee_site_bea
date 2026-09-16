import Link from 'next/link'
import { Clock, Eye, Feather, Mail, Newspaper } from 'lucide-react'
import { db } from '@/lib/db'
import { getFeaturedArticle, getPublishedArticles, getVisibleCategories, publicVisibilityWhere } from '@/lib/public-queries'
import { ArticleCard, ArticleCardLarge, ArticleCardRow, CategoryBadge } from '@/components/site/article-card'
import { Reveal, Stagger, StaggerItem } from '@/components/site/reveal'
import { HeroUne } from '@/components/site/hero-une'
import { AnimatedCounter } from '@/components/site/animated-counter'
import { NewsletterForm } from '@/components/site/newsletter-form'
import { getSettings } from '@/lib/settings'
import { formatDateFr, timeAgoFr } from '@/lib/shared'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const settings = await getSettings()
  const blocks = await db.homepageBlock.findMany({ where: { active: true }, orderBy: { order: 'asc' } })

  // Pré-chargement des jeux de données usuels
  const featured = await getFeaturedArticle()
  const latest = await getPublishedArticles({ perPage: 24 })
  const reportages = latest.items.filter((a) => a.format === 'REPORTAGE' || a.format === 'PORTFOLIO')

  const rendered: React.ReactNode[] = []

  /* ---------- Flash info — marquee horizontal infini ---------- */
  /* Durée proportionnelle au contenu (vitesse constante ~55 px/s), fondu
     des bords, heure relative « en direct », pause au survol. Le défilement
     reste actif même en prefers-reduced-motion (contenu essentiel, cf. CSS). */
  const tickerItems = latest.items.slice(0, 6)
  if (settings.ticker_enabled !== 'false' && tickerItems.length >= 3) {
    const tickerDur = Math.max(24, tickerItems.length * 8)
    rendered.push(
      <div key="ticker" className="ticker relative border-b border-border/60 bg-secondary/40">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 md:px-6">
          <span
            className="sheen-host my-2 flex shrink-0 items-center gap-2 rounded-sm px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.18em] shadow-sm"
            style={{ background: 'var(--brand)', color: 'var(--brand-foreground)' }}
          >
            {/* Point « en direct » pulsant */}
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
            {settings.ticker_label || 'Le fil'}
          </span>
          <div className="ticker-mask min-w-0 flex-1 overflow-hidden" aria-label="Derniers titres">
            <div
              className="ticker-track flex w-max items-center gap-12 py-2"
              style={{ '--ticker-dur': `${tickerDur}s` } as React.CSSProperties}
            >
              {[...tickerItems, ...tickerItems].map((a, i) => (
                <Link
                  key={`${a.id}-${i}`}
                  href={`/article/${a.slug}`}
                  className="group flex items-center gap-2.5 whitespace-nowrap text-[13px] text-foreground/80 transition-colors hover:text-brand"
                  aria-hidden={i >= tickerItems.length}
                  tabIndex={i >= tickerItems.length ? -1 : 0}
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full transition-transform duration-300 group-hover:scale-150"
                    style={{
                      background: ['var(--brand)', 'var(--brand-gold)', 'var(--brand-green)'][i % 3],
                    }}
                    aria-hidden="true"
                  />
                  <span className="font-medium">{a.title}</span>
                  <span className="text-[11.5px] tabular-nums text-muted-foreground/70">{timeAgoFr(a.publishedAt)}</span>
                  <span className="ml-6 h-1 w-1 rounded-full bg-border" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>,
    )
  }

  for (const block of blocks) {
     
    const config: any = JSON.parse(block.configJson || '{}')

    if (block.blockType === 'HERO_UNE') {
      if (!featured) continue
      const secondary = latest.items.filter((a) => a.id !== featured.id).slice(0, config.secondaryCount ?? 4)
      rendered.push(
        <section key={block.id} className="mx-auto max-w-6xl px-4 pb-14 pt-8 md:px-6">
          <HeroUne article={featured} heroLabel={config.heroLabel || 'À la une'}>
            <Stagger gap={0.09} delay={0.45} className="divide-y divide-border/60">
              {secondary.map((a) => (
                <StaggerItem key={a.id} className="pb-5 [&:not(:first-child)]:pt-5">
                  <ArticleCardRow article={a} />
                </StaggerItem>
              ))}
            </Stagger>
          </HeroUne>
        </section>,
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
                <div>
                  <span className="eyebrow inline-flex items-center gap-2 text-brand">
                    <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
                    En direct
                  </span>
                  <h2 className="tri-underline font-display text-2xl font-bold md:text-3xl">{config.title || 'L’actualité'}</h2>
                </div>
                <Link href="/archives" className="eyebrow text-muted-foreground transition-colors hover:text-foreground">
                  Toutes les archives →
                </Link>
              </div>
            </Reveal>
            <Stagger className="grid gap-x-10 gap-y-6 md:grid-cols-2" gap={0.07}>
              {items.map((a) => (
                <StaggerItem key={a.id}>
                  <ArticleCardRow article={a} />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>,
      )
    }

    if (block.blockType === 'REPORTAGES_PHARES') {
      const items = reportages.filter((a) => a.id !== featured?.id).slice(0, config.count ?? 3)
      if (!items.length) continue
      rendered.push(
        <section key={block.id} className="relative mx-auto max-w-6xl px-4 py-16 md:px-6">
          <Reveal>
            <div className="mb-8">
              <span className="eyebrow text-brand">{config.eyebrow || 'Formats longs'}</span>
              <h2 className="tri-underline mt-1 font-display text-2xl font-bold md:text-3xl">{config.title || 'Reportages phares'}</h2>
            </div>
          </Reveal>
          <Stagger className="grid gap-5 md:grid-cols-3" gap={0.1}>
            {items.map((a) => (
              <StaggerItem key={a.id}>
                <ArticleCardLarge article={a} />
              </StaggerItem>
            ))}
          </Stagger>
        </section>,
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
                  <h2 className="tri-underline mt-1 font-display text-2xl font-bold md:text-3xl">{config.title || cat?.name}</h2>
                </div>
                <Link
                  href={`/rubrique/${catSlug}`}
                  className="eyebrow text-muted-foreground transition-colors hover:text-foreground"
                >
                  Voir la rubrique →
                </Link>
              </div>
            </Reveal>
            <Stagger className="grid gap-8 md:grid-cols-3" gap={0.1}>
              {items.map((a) => (
                <StaggerItem key={a.id}>
                  <ArticleCard article={a} />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>,
      )
    }

    if (block.blockType === 'CITATION') {
      // Mode personnalisé : citation libre saisie dans le dashboard ; sinon chapô du dernier article
      const customText = typeof config.quoteText === 'string' ? config.quoteText.trim() : ''
      const linked = config.quoteArticleSlug
        ? latest.items.find((a) => a.slug === config.quoteArticleSlug)
        : latest.items.find((a) => a.id !== featured?.id && a.chapo)
      if (!customText && !linked?.chapo) continue
      const quoteAuthor = typeof config.quoteAuthor === 'string' ? config.quoteAuthor.trim() : ''
      rendered.push(
        <section key={block.id} className="relative overflow-hidden border-y border-border/60 bg-secondary/30">
          {/* Guillemet décoratif géant en arrière-plan */}
          <span
            className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 select-none font-display text-[220px] leading-none opacity-[0.05]"
            aria-hidden="true"
          >
            «
          </span>
          {/* Fil tricolore animé en haut */}
          <div className="tri-flow h-[3px] w-full" aria-hidden="true" />
          <div className="relative mx-auto max-w-4xl px-6 py-16 text-center">
            <Reveal direction="blur">
              {config.eyebrow && <p className="eyebrow mb-4 text-brand">{config.eyebrow}</p>}
              <p className="font-display text-2xl italic leading-snug text-foreground/90 md:text-[28px]">
                «&nbsp;{customText || linked?.chapo}&nbsp;»
              </p>
              {quoteAuthor && <p className="mt-4 text-[13px] uppercase tracking-wider text-muted-foreground">— {quoteAuthor}</p>}
              {linked && (
                <Link
                  href={`/article/${linked.slug}`}
                  className="eyebrow mt-5 inline-block text-brand transition-opacity hover:opacity-75"
                >
                  {config.quoteLinkLabel || linked.title} →
                </Link>
              )}
            </Reveal>
          </div>
        </section>,
      )
    }

    if (block.blockType === 'NEWSLETTER') {
      rendered.push(
        <section key={block.id} className="relative mx-auto max-w-6xl overflow-hidden px-4 py-16 md:px-6">
          {/* Halos décoratifs flottants (rouge + vert de la marque) */}
          <div
            className="glow-orb float-slow absolute -left-16 top-8 h-48 w-48 rounded-full opacity-25"
            style={{ background: 'var(--brand)' }}
            aria-hidden="true"
          />
          <div
            className="glow-orb float-slower absolute -right-12 bottom-0 h-40 w-40 rounded-full opacity-20"
            style={{ background: 'var(--brand-green)' }}
            aria-hidden="true"
          />
          <Reveal direction="scale">
            <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card p-8 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.3)] md:p-12">
              <div className="paper-texture absolute inset-0" />
              <div className="relative grid items-center gap-8 md:grid-cols-2">
                <div>
                  <span className="eyebrow text-brand">{config.eyebrow || 'Newsletter'}</span>
                  <h2 className="mt-2 font-display text-3xl font-bold">
                    {config.title || 'Ne manquez rien de nos enquêtes'}
                  </h2>
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
        </section>,
      )
    }
  }

  /* ---------- Bandeau de confiance (pré-footer, réglages §6.9) ---------- */
  if (settings.trust_enabled !== 'false') {
    const [totalArticles, totalRubriques, vuesSum, abonnes] = await Promise.all([
      db.article.count({ where: publicVisibilityWhere() }),
      getVisibleCategories().then((c) => c.length),
      db.article.aggregate({ _sum: { views: true } }),
      db.newsletterSubscriber.count({ where: { status: 'CONFIRMED' } }),
    ])
    const stats = [
      { icon: Newspaper, value: totalArticles, label: 'articles & enquêtes publiés' },
      { icon: Feather, value: totalRubriques, label: 'rubriques éditoriales' },
      { icon: Eye, value: vuesSum._sum.views ?? 0, label: 'lectures depuis le lancement' },
      { icon: Mail, value: abonnes, label: 'abonnés à la newsletter' },
    ]
    rendered.push(
      <section key="trust-band" className="relative border-t border-border/60">
        {/* Barre tricolore signature */}
        <div className="tri-bar h-1" aria-hidden="true" />
        <div
          className="min-h-full"
          style={{ background: 'linear-gradient(135deg, var(--brand-deep) 0%, var(--brand) 55%, #d6340f 100%)' }}
        >
          <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
            <Reveal>
              <p className="text-center font-display text-2xl font-bold text-white md:text-[28px]">
                {settings.trust_title}
              </p>
              <p className="mx-auto mt-2 max-w-2xl text-center text-[14px] leading-relaxed text-white/75">
                {settings.trust_subtitle}
              </p>
            </Reveal>
            <Stagger className="mt-9 grid grid-cols-2 gap-6 md:grid-cols-4" gap={0.08}>
              {stats.map(({ icon: Icon, value, label }) => (
                <StaggerItem key={label}>
                  <div className="group text-center transition-transform duration-300 hover:-translate-y-1">
                    <span
                      className="mx-auto flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-white/25 transition-all duration-300 group-hover:bg-white/10 group-hover:ring-white/50"
                      aria-hidden="true"
                    >
                      <Icon className="h-5 w-5 text-white/80" />
                    </span>
                    <p className="mt-2.5 font-display text-3xl font-bold text-white">
                      <AnimatedCounter value={value} />
                    </p>
                    <p className="mt-1 text-[12px] uppercase tracking-wider text-white/70">{label}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </section>,
    )
  }

  return <>{rendered}</>
}
