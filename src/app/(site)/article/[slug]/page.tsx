import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import type { Metadata } from 'next'
import { Clock, MessageSquare, PencilLine } from 'lucide-react'

import { db } from '@/lib/db'
import { articleCardInclude, getRelatedArticles, publicVisibilityWhere } from '@/lib/public-queries'
import { RichContent, extractToc } from '@/components/article/rich-content'
import { CategoryBadge, ArticleCard } from '@/components/site/article-card'
import { ShareButtons } from '@/components/site/share-buttons'
import { TocNav } from '@/components/site/toc-nav'
import { Reveal } from '@/components/site/reveal'
import { ReadingProgress } from '@/components/site/reading-progress'
import { CommentsSection } from '@/components/site/comments-section'
import { ViewTracker } from '@/components/site/view-tracker'
import { Breadcrumb } from '@/components/site/breadcrumb'
import { FORMAT_LABELS, formatDateFr } from '@/lib/shared'
import { getSettings } from '@/lib/settings'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

async function getArticle(slug: string) {
  return db.article.findFirst({
    where: { ...publicVisibilityWhere(), slug },
    include: { ...articleCardInclude, comments: { where: { status: 'APPROVED' }, orderBy: { createdAt: 'desc' } } },
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug).catch(() => null)
  if (!article) return { title: 'Article introuvable' }
  const settings = await getSettings()
  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.chapo || '',
    openGraph: {
      title: article.seoTitle || article.title,
      description: article.seoDescription || article.chapo || '',
      type: 'article',
      publishedTime: article.publishedAt?.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      images: article.ogImage || article.coverImage || undefined,
      siteName: settings.site_name,
      locale: 'fr_FR',
    },
    twitter: {
      card: 'summary_large_image',
      title: article.seoTitle || article.title,
      description: article.seoDescription || article.chapo || '',
      images: article.ogImage || article.coverImage || undefined,
    },
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) {
    // Ancien slug ? → redirection 301 configurée (§6.9)
    const redirect = await db.redirect.findUnique({ where: { fromPath: `/article/${slug}` } }).catch(() => null)
    if (redirect) permanentRedirect(redirect.toPath)
    notFound()
  }

  const settings = await getSettings()
  const isLong = article.format === 'REPORTAGE' || article.format === 'PORTFOLIO'
  const cat = article.categories[0]?.category
  const related = await getRelatedArticles(article.id, article.categories.map((c) => c.categoryId), 3)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = JSON.parse(article.contentJson || '{}')
  const toc = extractToc(doc)

  // Données structurées Schema.org NewsArticle (§12.2)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.seoDescription || article.chapo || '',
    image: article.coverImage ? [article.coverImage] : undefined,
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: { '@type': 'Person', name: article.author?.name },
    publisher: { '@type': 'Organization', name: settings.site_name },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `/article/${article.slug}` },
    articleSection: cat?.name,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ViewTracker slug={article.slug} />
      {isLong && <ReadingProgress />}

      <article className="pb-16">
        {/* En-tête éditorial */}
        <header className="mx-auto max-w-4xl px-4 pt-10 md:px-6">
          <Breadcrumb items={[...(cat ? [{ label: cat.name, href: `/rubrique/${cat.slug}` }] : []), { label: article.title }]} />

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
            {cat && <CategoryBadge {...cat} size="lg" />}
            {article.format !== 'ARTICLE' && (
              <span className="rounded-full border border-border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/70">
                {FORMAT_LABELS[article.format] ?? article.format}
              </span>
            )}
          </div>

          <h1 className={`mt-4 font-display font-bold leading-[1.08] tracking-tight ${isLong ? 'text-4xl md:text-[54px]' : 'text-3xl md:text-5xl'}`}>
            {article.title}
          </h1>
          {article.subtitle && (
            <p className="mt-4 font-display text-xl italic leading-snug text-muted-foreground md:text-2xl">
              {article.subtitle}
            </p>
          )}
          {article.chapo && (
            <p className="mt-5 border-l-2 pl-5 text-[17px] leading-relaxed text-foreground/85" style={{ borderColor: 'var(--brand)' }}>
              {article.chapo}
            </p>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/60 pt-5 text-[13px] text-muted-foreground">
            {article.author?.name && (
              <span className="flex items-center gap-2 font-medium text-foreground/85">
                {article.author.avatar && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={article.author.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
                )}
                {article.author.name}
              </span>
            )}
            {article.publishedAt && (
              <span>
                Publié le <time dateTime={article.publishedAt.toISOString()}>{formatDateFr(article.publishedAt)}</time>
              </span>
            )}
            {article.updatedAt && article.publishedAt && article.updatedAt.getTime() - article.publishedAt.getTime() > 86400000 && (
              <span className="inline-flex items-center gap-1">
                <PencilLine className="h-3.5 w-3.5" /> Mis à jour le {formatDateFr(article.updatedAt)}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {article.readingTime} min de lecture
            </span>
          </div>
        </header>

        {/* Média de une */}
        {article.coverImage && (
          <figure className="mx-auto mt-10 max-w-6xl px-4 md:px-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full rounded-lg object-cover"
              style={{ aspectRatio: '21/9' }}
            />
            {article.coverCredit && (
              <figcaption className="mt-2 text-center text-xs text-muted-foreground">{article.coverCredit}</figcaption>
            )}
          </figure>
        )}

        {/* Corps de l’article — grille éditoriale : rail partage / contenu / sommaire */}
        <div className="mx-auto max-w-[1200px] px-4 md:px-6">
          <div className="xl:grid xl:grid-cols-[56px_minmax(0,720px)_240px] xl:gap-8">
            {/* Rail de partage vertical (desktop) */}
            <div className="hidden xl:block">
              <div className="sticky top-28 flex flex-col items-center gap-3 border-l border-border/60 pl-4">
                <span className="eyebrow text-muted-foreground">Partager</span>
                <ShareButtons url={`/article/${article.slug}`} title={article.title} siteName={settings.site_name} variant="rail" />
              </div>
            </div>

            {/* Contenu */}
            <div className="min-w-0">
              {/* Sommaire replié (mobile/tablette) */}
              {toc.length >= 3 && <TocNav items={toc} variant="card" />}
              <RichContent doc={doc} dropcap={isLong} />

              {/* Tags */}
              {article.tags.length > 0 && (
                <div className="mt-12 flex flex-wrap gap-2">
                  {article.tags.map(({ tag }) => (
                    <Link
                      key={tag.id}
                      href={`/tag/${tag.slug}`}
                      className="rounded-full border border-border/80 px-3.5 py-1.5 text-[13px] text-foreground/75 transition-colors hover:border-brand hover:text-brand"
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Partage + encart auteur (mobile : le rail est masqué) */}
              <div className="mt-8 border-t border-border/60 pt-6 xl:hidden">
                <ShareButtons url={`/article/${article.slug}`} title={article.title} siteName={settings.site_name} />
              </div>

              {/* Encart auteur avec bio */}
              {article.author && (
                <aside className="mt-8 flex flex-col gap-4 rounded-lg border border-border/70 bg-secondary/30 p-5 sm:flex-row sm:items-start">
                  {article.author.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={article.author.avatar}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full font-display text-2xl font-bold"
                      style={{ background: 'var(--brand)', color: 'var(--brand-foreground)' }}
                      aria-hidden="true"
                    >
                      {article.author.name?.charAt(0) ?? '·'}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="eyebrow text-muted-foreground">Écrit par</p>
                    <p className="mt-0.5 font-display text-lg font-bold">{article.author.name}</p>
                    {article.author.bio && (
                      <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{article.author.bio}</p>
                    )}
                  </div>
                </aside>
              )}
            </div>

            {/* Sommaire collant avec suivi de lecture (desktop) */}
            <div>
              {toc.length >= 3 && <TocNav items={toc} variant="rail" />}
            </div>
          </div>
        </div>

        {/* Commentaires (§5.5 — activables par article) */}
        {article.commentsEnabled && (
          <div className="mx-auto mt-6 max-w-3xl px-4 md:px-6">
            <CommentsSection articleId={article.id} comments={article.comments} />
          </div>
        )}
      </article>

      {/* À lire aussi */}
      {related.length > 0 && (
        <section className="border-t border-border/60 bg-secondary/30">
          <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
            <h2 className="mb-8 font-display text-2xl font-bold">À lire aussi</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {related.map((a, i) => (
                <Reveal key={a.id} delay={i * 0.08}>
                  <ArticleCard article={a} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
