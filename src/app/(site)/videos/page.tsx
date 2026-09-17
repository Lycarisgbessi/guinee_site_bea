import Link from 'next/link'
import type { Metadata } from 'next'
import { Clock, Play } from 'lucide-react'
import { db } from '@/lib/db'
import { articleCardInclude, publicVisibilityWhere } from '@/lib/public-queries'
import { CategoryBadge } from '@/components/site/article-card'
import { VideoEmbed } from '@/components/site/video-embed'
import { VideoCard } from '@/components/site/video-card'
import { Reveal } from '@/components/site/reveal'
import { AdBanner } from '@/components/site/ad-banner'
import { formatDateShortFr } from '@/lib/shared'
import { youtubeThumb } from '@/lib/youtube'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Vidéos — Reportages et directs',
  description: 'Tous les reportages vidéo, interviews filmées et directs de la rédaction.',
}

type VideoArticle = Awaited<ReturnType<typeof loadVideos>>[number]

async function loadVideos() {
  return db.article.findMany({
    where: {
      ...publicVisibilityWhere(),
      OR: [{ format: 'VIDEO' }, { youtubeUrl: { not: null } }],
    },
    include: articleCardInclude,
    orderBy: { publishedAt: 'desc' },
    take: 48,
  })
}

/** Carte vidéo : miniature YouTube officielle + badge lecture (composant partagé) */
function VideoCardLocal({ article }: { article: VideoArticle }) {
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
      </div>
      <div className="p-4">
        {cat && <CategoryBadge {...cat} />}
        <h3 className="mt-1.5 font-display text-[15px] font-bold leading-snug">{article.title}</h3>
        <p className="mt-2 flex items-center gap-3 text-[12px] text-muted-foreground">
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

export default async function VideosPage() {
  const items = await loadVideos()
  const [first, ...rest] = items

  return (
    <div className="pb-16">
      {/* En-tête de section */}
      <header className="border-b border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
          <p className="eyebrow text-muted-foreground">Reportages · Interviews · Directs</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight md:text-5xl">Vidéos</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            Les reportages filmés de la rédaction. Cliquez sur une vidéo pour la lire directement ici —
            hébergement YouTube, lecture sans quitter le site.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        {items.length === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center gap-2 text-muted-foreground">
            <Play className="h-8 w-8 opacity-40" />
            <p className="text-sm">Aucune vidéo publiée pour le moment.</p>
            <p className="text-xs">Les reportages vidéo ajoutés depuis le tableau de bord apparaîtront ici.</p>
          </div>
        ) : (
          <>
            {/* Vidéo à la une (lecteur intégré) + grille */}
            <div className="grid gap-6 md:grid-cols-2">
              {first && (
                <div className="md:col-span-2">
                  <Reveal>
                    <div className="grid items-start gap-5 lg:grid-cols-[1.5fr_1fr]">
                      <VideoEmbed url={first.youtubeUrl ?? first.coverImage} title={first.title} />
                      <div className="self-center">
                        {first.categories[0]?.category && <CategoryBadge {...first.categories[0].category} size="lg" />}
                        <h2 className="mt-2 font-display text-2xl font-bold leading-tight md:text-3xl">
                          <Link href={`/article/${first.slug}`} className="transition-colors hover:text-[color:var(--brand)]">
                            {first.title}
                          </Link>
                        </h2>
                        {first.chapo && (
                          <p className="mt-3 line-clamp-3 text-[14px] leading-relaxed text-muted-foreground">{first.chapo}</p>
                        )}
                        <p className="mt-3 flex flex-wrap items-center gap-3 text-[13px] text-muted-foreground">
                          {first.author?.name && <span className="font-medium text-foreground/80">{first.author.name}</span>}
                          {first.publishedAt && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" /> {formatDateShortFr(first.publishedAt)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                </div>
              )}
              {rest.slice(0, 4).map((a, i) => (
                <Reveal key={a.id} delay={i * 0.06}>
                  <VideoCardLocal article={a} />
                </Reveal>
              ))}
            </div>

            {rest.length > 4 && (
              <>
                <div className="my-10">
                  <AdBanner slot="RUBRIQUE_TOP" className="w-full" />
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.slice(4).map((a, i) => (
                    <Reveal key={a.id} delay={(i % 3) * 0.06}>
                      <VideoCardLocal article={a} />
                    </Reveal>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
