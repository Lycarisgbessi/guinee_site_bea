'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import { youtubeEmbedUrl, youtubeThumb } from '@/lib/youtube'

/**
 * Intégration YouTube « cliquer-pour-lire » :
 * la page charge uniquement la miniature officielle (quelques Ko), l'iframe
 * YouTube (plusieurs Mo de scripts) n'est créée qu'au clic. Idéal mobile.
 */
export function VideoEmbed({
  url,
  title,
  className = '',
}: {
  url: string | null | undefined
  title: string
  className?: string
}) {
  const [playing, setPlaying] = useState(false)
  const embed = youtubeEmbedUrl(url)
  const thumb = youtubeThumb(url, 'max') ?? youtubeThumb(url, 'hq')

  // Pas de lien YouTube exploitable : affichage de l'image de couverture en repli
  if (!embed) {
    if (!thumb && !url) return null
    return (
      <div className={`relative w-full overflow-hidden rounded-lg bg-secondary ${className}`} style={{ aspectRatio: '16 / 9' }}>
        {url ? (
          <img src={url} alt={title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          thumb && <img src={thumb} alt={title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        )}
      </div>
    )
  }

  return (
    <div
      className={`group relative w-full overflow-hidden rounded-lg bg-black ${className}`}
      style={{ aspectRatio: '16 / 9' }}
    >
      {playing ? (
        <iframe
          src={`${embed}&autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="absolute inset-0 h-full w-full cursor-pointer"
          aria-label={`Lire la vidéo : ${title}`}
        >
          {thumb && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={thumb}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
            />
          )}
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600/95 text-white shadow-xl transition-transform group-hover:scale-110 sm:h-20 sm:w-20">
              <Play className="ml-1 h-7 w-7 fill-current sm:h-9 sm:w-9" />
            </span>
          </span>
          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
            YouTube
          </span>
        </button>
      )}
    </div>
  )
}
