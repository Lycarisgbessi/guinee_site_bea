import Link from 'next/link'
import { Clock, Play } from 'lucide-react'
import { CategoryBadge } from '@/components/site/article-card'
import { FORMAT_LABELS, formatDateShortFr } from '@/lib/shared'
import { youtubeThumb } from '@/lib/youtube'
import type { ArticleCardData } from '@/lib/public-queries'

/** Carte vidéo : miniature YouTube officielle + badge lecture + meta */
export function VideoCard({ article }: { article: ArticleCardData }) {
  const thumb = youtubeThumb(article.youtubeUrl, 'hq') ?? article.coverImage
  const cat = article.categories[0]?.category ?? null
  return (
    <Link
      href={`/article/${article.slug}`}
      className="group block overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-lg"
    >
      <div className="relative w-full overflow-hidden bg-secondary" style={{ aspectRatio: '16 / 9' }}>
        {thumb ? (
          <img
            src={thumb}
            alt={article.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-display text-muted-foreground">Vidéo</span>
        )}
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600/95 text-white shadow-lg transition-transform group-hover:scale-110 sm:h-14 sm:w-14">
            <Play className="ml-0.5 h-5 w-5 fill-current sm:h-6 sm:w-6" />
          </span>
        </span>
        {article.format === 'VIDEO' && (
          <span className="absolute left-2.5 top-2.5 rounded bg-black/75 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
            {FORMAT_LABELS.VIDEO}
          </span>
        )}
      </div>
      <div className="p-4">
        {/* Carte entière = <Link> → badge en span (jamais de <a> imbriqué) */}
        {cat && <CategoryBadge {...cat} linked={false} />}
        <h3 className="mt-1.5 font-display text-[15px] font-bold leading-snug">{article.title}</h3>
        <p className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
          {article.author?.name && <span>{article.author.name}</span>}
          {article.publishedAt && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {formatDateShortFr(article.publishedAt)}
            </span>
          )}
        </p>
      </div>
    </Link>
  )
}
