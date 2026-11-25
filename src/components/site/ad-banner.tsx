import Link from 'next/link'
import { Megaphone } from 'lucide-react'

import { pickAd, AD_SLOTS } from '@/lib/ads'
import { getSettings } from '@/lib/settings'

/**
 * Espace publicitaire (régie interne) — rendu serveur, rotation pondérée
 * à chaque affichage, étiquette « Publicité » discrète, rien ne s'affiche
 * si aucun bandeau n'est actif (le site reste épuré).
 */
export async function AdBanner({
  slot,
  className = '',
}: {
  slot: string
  className?: string
}) {
  const ad = await pickAd(slot)
  if (!ad) {
    // Option : réserve « Votre publicité ici » pour prospecter des annonceurs
    const settings = await getSettings()
    if (settings.ads_placeholder !== 'true') return null
    const meta = AD_SLOTS.find((s) => s.key === slot)
    return (
      <aside
        className={`ad-slot relative overflow-hidden rounded-lg border border-dashed border-border/80 bg-secondary/40 ${meta?.ratio ?? 'aspect-[6/1]'} ${className}`}
        aria-label="Emplacement publicitaire disponible"
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
          <Megaphone className="h-4 w-4 text-muted-foreground/60" aria-hidden="true" />
          <span className="text-[12.5px] font-medium text-muted-foreground">
            Votre publicité ici
          </span>
          <span className="eyebrow text-[10px] text-muted-foreground/60">Contactez la rédaction</span>
        </div>
        <span className="ad-label">Publicité</span>
      </aside>
    )
  }

  const inner =
    ad.kind === 'HTML' && ad.html ? (
      <div className="absolute inset-0 [&_iframe]:h-full [&_iframe]:w-full" dangerouslySetInnerHTML={{ __html: ad.html }} />
    ) : ad.kind === 'VIDEO' && ad.imageUrl ? (
      // Vidéo publicitaire : lecture automatique en boucle, sans son
      // (formats mobile-friendly), dimensionnée par le ratio de l'emplacement.
      <video
        src={ad.imageUrl}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={ad.alt || ad.name}
        className="absolute inset-0 h-full w-full object-cover"
      />
    ) : ad.imageUrl ? (
      <img
        src={ad.imageUrl}
        alt={ad.alt || ad.name}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-[1.025]"
      />
    ) : null

  const body = (
    <>
      {inner}
      <span className="ad-label">Publicité</span>
    </>
  )

  const meta = AD_SLOTS.find((s) => s.key === slot)
  const frame = `ad-slot group relative overflow-hidden rounded-lg border border-border/60 bg-card shadow-[0_18px_44px_-30px_rgba(0,0,0,0.5)] ${meta?.ratio ?? 'aspect-[6/1]'} ${className}`

  if (ad.linkUrl && (ad.kind === 'IMAGE' || ad.kind === 'VIDEO')) {
    return (
      <aside className={frame} aria-label="Publicité">
        <a
          href={`/api/ads/${ad.id}/click`}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="absolute inset-0 block"
          aria-label={ad.alt || ad.name}
        >
          {body}
        </a>
      </aside>
    )
  }

  return (
    <aside className={frame} aria-label="Publicité">
      {body}
    </aside>
  )
}

/** Lien interne discret vers l'espace publicitaire du dashboard (réutilisable) */
export function AdSalesLink({ email }: { email: string }) {
  return (
    <Link
      href={`mailto:${email}?subject=Proposition%20publicitaire`}
      className="eyebrow text-muted-foreground/70 transition-colors hover:text-brand"
    >
      Devenir annonceur →
    </Link>
  )
}
