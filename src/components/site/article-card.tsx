import Link from 'next/link'
import { ArrowRight, Clock } from 'lucide-react'

import { FORMAT_LABELS, formatDateShortFr } from '@/lib/shared'
import type { ArticleCardData } from '@/lib/public-queries'

function firstCategory(article: ArticleCardData) {
  return article.categories[0]?.category ?? null
}

/** Badge de rubrique. `linked={false}` rend un <span> — obligatoire quand la
 * carte entière est déjà un <Link> (sinon <a> imbriqué = erreur d'hydratation,
 * détectée en console pendant l'audit responsive). */
export function CategoryBadge({
  name,
  slug,
  color,
  size = 'sm',
  linked = true,
}: {
  name: string
  slug: string
  color?: string | null
  size?: 'sm' | 'lg'
  linked?: boolean
}) {
  const cls = `eyebrow inline-flex items-center gap-1.5 transition-opacity hover:opacity-75 ${size === 'lg' ? 'text-xs' : ''}`
  const dot = (
    <span
      className="h-1.5 w-1.5 rounded-full"
      style={{ background: color || 'var(--brand)' }}
      aria-hidden="true"
    />
  )
  if (!linked) {
    return (
      <span className={cls} style={{ color: color || 'var(--brand)' }}>
        {dot}
        {name}
      </span>
    )
  }
  return (
    <Link href={`/rubrique/${slug}`} className={cls} style={{ color: color || 'var(--brand)' }}>
      {dot}
      {name}
    </Link>
  )
}

function Meta({ article, className = '' }: { article: ArticleCardData; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted-foreground ${className}`}>
      {article.author?.name && <span className="font-medium text-foreground/80">{article.author.name}</span>}
      {article.publishedAt && <time dateTime={article.publishedAt.toISOString()}>{formatDateShortFr(article.publishedAt)}</time>}
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3 w-3" /> {article.readingTime} min
      </span>
      {article.format !== 'ARTICLE' && (
        <span className="rounded-full border border-border px-2 py-0.5 text-[10.5px] uppercase tracking-wider">
          {FORMAT_LABELS[article.format] ?? article.format}
        </span>
      )}
    </div>
  )
}

/** Carte horizontale compacte (fil d’actualité) */
export function ArticleCardRow({ article }: { article: ArticleCardData }) {
  const cat = firstCategory(article)
  return (
    <article className="card-lift group relative grid grid-cols-[110px_1fr] gap-4 rounded-md border-b border-border/60 pb-5 pl-3 sm:grid-cols-[160px_1fr]">
      {/* Accent tricolore latéral qui grandit au survol */}
      <span
        className="absolute left-0 top-1 bottom-4 w-[3px] origin-top scale-y-0 rounded-full tri-gradient transition-transform duration-500 ease-out group-hover:scale-y-100"
        aria-hidden="true"
      />
      <Link href={`/article/${article.slug}`} className="block overflow-hidden rounded-md" tabIndex={-1} aria-hidden="true">
        {article.coverImage ? (
           
          <img
            src={article.coverImage}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
            style={{ aspectRatio: '4/3' }}
          />
        ) : (
          <div className="h-full w-full bg-secondary" style={{ aspectRatio: '4/3' }} />
        )}
      </Link>
      <div className="min-w-0">
        {cat && <CategoryBadge {...cat} />}
        <h3 className="mt-1 font-display text-[17px] font-semibold leading-snug">
          <Link href={`/article/${article.slug}`} className="title-underline transition-colors group-hover:text-brand">
            {article.title}
          </Link>
        </h3>
        <Meta article={article} className="mt-2" />
      </div>
    </article>
  )
}

/** Carte standard (grilles) */
export function ArticleCard({ article, priority = false }: { article: ArticleCardData; priority?: boolean }) {
  const cat = firstCategory(article)
  return (
    <article className="card-lift group flex h-full flex-col rounded-md">
      <Link href={`/article/${article.slug}`} className="relative block overflow-hidden rounded-md" tabIndex={-1} aria-hidden="true">
        {article.coverImage ? (
           
          <img
            src={article.coverImage}
            alt=""
            loading={priority ? 'eager' : 'lazy'}
            className="w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            style={{ aspectRatio: '16/10' }}
          />
        ) : (
          <div className="w-full bg-secondary" style={{ aspectRatio: '16/10' }} />
        )}
        {/* Barre tricolore qui glisse en bas de l'image */}
        <span
          className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 tri-gradient transition-transform duration-500 ease-out group-hover:scale-x-100"
          aria-hidden="true"
        />
      </Link>
      <div className="flex flex-1 flex-col pt-4">
        {cat && <CategoryBadge {...cat} />}
        <h3 className="mt-1.5 font-display text-[20px] font-semibold leading-snug">
          <Link href={`/article/${article.slug}`} className="title-underline transition-colors group-hover:text-brand">
            {article.title}
          </Link>
        </h3>
        {article.chapo && (
          <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-muted-foreground">{article.chapo}</p>
        )}
        <Meta article={article} className="mt-3 pt-1" />
        {/* Lien « Lire » révélé au survol (desktop) */}
        <span className="mt-auto inline-flex translate-y-1 items-center gap-1.5 pt-3 text-[12px] font-bold uppercase tracking-[0.14em] text-brand opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          Lire l’article <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </div>
    </article>
  )
}

/** Grande carte éditoriale (reportages phares, hero secondaire) */
export function ArticleCardLarge({ article }: { article: ArticleCardData }) {
  const cat = firstCategory(article)
  return (
    <article className="group relative flex min-h-[300px] flex-col justify-end overflow-hidden rounded-lg">
      {/* Barre tricolore qui glisse au survol */}
      <span
        className="absolute inset-x-0 top-0 z-10 h-1 origin-left scale-x-0 tri-gradient transition-transform duration-500 group-hover:scale-x-100"
        aria-hidden="true"
      />
      {article.coverImage ? (
         
        <img
          src={article.coverImage}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-[1.05]"
        />
      ) : (
        <div className="absolute inset-0 bg-secondary" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/5" />
      <div className="relative p-6 text-white">
        {cat && (
          <span className="eyebrow text-[11px]" style={{ color: cat.color || '#fff' }}>
            {cat.name}
          </span>
        )}
        <h3 className="mt-1.5 font-display text-[22px] font-bold leading-tight">
          <Link href={`/article/${article.slug}`} className="title-underline">
            {article.title}
          </Link>
        </h3>
        <div className="mt-2.5 flex items-center gap-3 text-[12px] text-white/80">
          {article.publishedAt && <time>{formatDateShortFr(article.publishedAt)}</time>}
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {article.readingTime} min
          </span>
          <span
            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:translate-x-1 group-hover:bg-white/25 group-hover:opacity-100"
            aria-hidden="true"
          >
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </article>
  )
}
