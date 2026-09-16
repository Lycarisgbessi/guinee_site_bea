import Link from 'next/link'
import { Clock } from 'lucide-react'

import { FORMAT_LABELS, formatDateShortFr } from '@/lib/shared'
import type { ArticleCardData } from '@/lib/public-queries'

function firstCategory(article: ArticleCardData) {
  return article.categories[0]?.category ?? null
}

/** Badge rubrique coloré avec pastille de couleur */
export function CategoryBadge({
  name,
  slug,
  color,
  size = 'sm',
}: {
  name: string
  slug: string
  color?: string | null
  size?: 'sm' | 'lg'
}) {
  return (
    <Link
      href={`/rubrique/${slug}`}
      className={`eyebrow inline-flex items-center gap-1.5 transition-opacity hover:opacity-75 ${size === 'lg' ? 'text-xs' : ''}`}
      style={{ color: color || 'var(--brand)' }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color || 'var(--brand)' }}
        aria-hidden="true"
      />
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
    <article className="card-lift group grid grid-cols-[110px_1fr] gap-4 rounded-md border-b border-border/60 pb-5 sm:grid-cols-[160px_1fr]">
      <Link href={`/article/${article.slug}`} className="block overflow-hidden rounded-md" tabIndex={-1} aria-hidden="true">
        {article.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.coverImage}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            style={{ aspectRatio: '4/3' }}
          />
        ) : (
          <div className="h-full w-full bg-secondary" style={{ aspectRatio: '4/3' }} />
        )}
      </Link>
      <div className="min-w-0">
        {cat && <CategoryBadge {...cat} />}
        <h3 className="mt-1 font-display text-[17px] font-semibold leading-snug">
          <Link href={`/article/${article.slug}`} className="transition-colors group-hover:text-brand">
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
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.coverImage}
            alt=""
            loading={priority ? 'eager' : 'lazy'}
            className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            style={{ aspectRatio: '16/10' }}
          />
        ) : (
          <div className="w-full bg-secondary" style={{ aspectRatio: '16/10' }} />
        )}
      </Link>
      <div className="flex flex-1 flex-col pt-4">
        {cat && <CategoryBadge {...cat} />}
        <h3 className="mt-1.5 font-display text-[20px] font-semibold leading-snug">
          <Link href={`/article/${article.slug}`} className="transition-colors group-hover:text-brand">
            {article.title}
          </Link>
        </h3>
        {article.chapo && (
          <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-muted-foreground">{article.chapo}</p>
        )}
        <Meta article={article} className="mt-3 pt-1" />
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
        // eslint-disable-next-line @next/next/no-img-element
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
          <Link href={`/article/${article.slug}`} className="hover:underline">
            {article.title}
          </Link>
        </h3>
        <div className="mt-2.5 flex items-center gap-3 text-[12px] text-white/80">
          {article.publishedAt && <time>{formatDateShortFr(article.publishedAt)}</time>}
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {article.readingTime} min
          </span>
        </div>
      </div>
    </article>
  )
}
