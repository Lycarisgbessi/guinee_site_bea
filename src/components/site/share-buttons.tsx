'use client'

import { useEffect, useState, type ComponentType } from 'react'
import {
  Facebook,
  Instagram,
  Link2,
  Linkedin,
  Mail,
  MessageCircle,
  Music2,
  Send,
  Twitter,
} from 'lucide-react'
import { toast } from 'sonner'

interface ShareProps {
  url: string
  title: string
  siteName?: string
  /** « rail » = colonne verticale collante (desktop) */
  variant?: 'row' | 'rail'
}

type Net =
  | 'facebook'
  | 'x'
  | 'linkedin'
  | 'whatsapp'
  | 'telegram'
  | 'instagram'
  | 'tiktok'
  | 'email'
  | 'copy'

interface ShareTarget {
  net: Net
  label: string
  icon: ComponentType<{ className?: string }>
  /** Couleur de marque au survol */
  color: string
  /** Construit l'URL de partage (sans API — pages de partage natives) */
  href?: (u: string, t: string) => string
  /** Comportement spécial : copie le lien puis ouvre l'application */
  copyThenOpen?: string
  /**
   * Force les plateformes à re-scanner la page au moment du partage
   * (« cache-buster ») : Facebook, LinkedIn ou WhatsApp gardent en mémoire
   * l'aperçu d'une URL déjà partagée — sans ?v= unique, une image corrigée
   * ou modifiée ne s'afficherait qu'après expiration de leur cache.
   */
  bustCache?: boolean
}

/**
 * Partage réseaux sociaux (§5.5) — sans API :
 *  - Facebook / X / LinkedIn / WhatsApp / Telegram / Email ouvrent la fenêtre
 *    de partage native de chaque plateforme. Titre, image et résumé de
 *    l'article sont importés automatiquement via les balises Open Graph.
 *  - Instagram et TikTok interdisent tout partage de lien automatisé
 *    (restriction des plateformes, même avec API) : le lien est copié
 *    dans le presse-papiers puis l'application s'ouvre — il ne reste
 *    qu'à le coller dans la story ou la publication.
 */
const TARGETS: ShareTarget[] = [
  {
    net: 'facebook',
    label: 'Partager sur Facebook',
    icon: Facebook,
    color: '#1877F2',
    href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    bustCache: true,
  },
  {
    net: 'x',
    label: 'Partager sur X (Twitter)',
    icon: Twitter,
    color: '#0f1419',
    href: (u, t) => `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
    bustCache: true,
  },
  {
    net: 'linkedin',
    label: 'Partager sur LinkedIn',
    icon: Linkedin,
    color: '#0A66C2',
    href: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    bustCache: true,
  },
  {
    net: 'whatsapp',
    label: 'Partager sur WhatsApp',
    icon: MessageCircle,
    color: '#25D366',
    href: (u, t) => `https://wa.me/?text=${t}%20${u}`,
    bustCache: true,
  },
  {
    net: 'telegram',
    label: 'Partager sur Telegram',
    icon: Send,
    color: '#229ED9',
    href: (u, t) => `https://t.me/share/url?url=${u}&text=${t}`,
    bustCache: true,
  },
  {
    net: 'instagram',
    label: 'Partager sur Instagram (lien copié)',
    icon: Instagram,
    color: '#E1306C',
    copyThenOpen: 'https://www.instagram.com/',
  },
  {
    net: 'tiktok',
    label: 'Partager sur TikTok (lien copié)',
    icon: Music2,
    color: '#ff0050',
    copyThenOpen: 'https://www.tiktok.com/upload',
  },
  {
    net: 'email',
    label: 'Partager par email',
    icon: Mail,
    color: '#8a5a0f',
    href: (u, t) => `mailto:?subject=${t}&body=${u}`,
  },
]

function ShareIcon({
  target,
  t,
  cleanUrl,
  shareUrl,
}: {
  target: ShareTarget
  t: string
  /** URL absolue propre — presse-papiers, email */
  cleanUrl: string
  /** URL absolue avec ?v= unique — partage à re-scan forcé */
  shareUrl: string
}) {
  const [copied, setCopied] = useState(false)
  const Icon = target.icon
  const u = encodeURIComponent(target.bustCache ? shareUrl : cleanUrl)

  async function handleClick(e: React.MouseEvent) {
    if (!target.copyThenOpen) return
    e.preventDefault()
    try {
      await navigator.clipboard.writeText(cleanUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success(
        target.net === 'instagram'
          ? 'Lien copié ! Collez-le dans votre story ou votre bio Instagram.'
          : 'Lien copié ! Collez-le dans la description de votre vidéo TikTok.',
        { duration: 6000 },
      )
      window.open(target.copyThenOpen, '_blank', 'noopener,noreferrer')
    } catch {
      toast.error('Impossible de copier le lien — copiez-le manuellement.')
    }
  }

  return (
    <a
      href={target.href ? target.href(u, t) : '#'}
      target={target.href ? '_blank' : undefined}
      rel={target.href ? 'noopener noreferrer' : undefined}
      onClick={handleClick}
      aria-label={target.label}
      title={copied ? 'Lien copié ✓' : target.label}
      className="share-btn inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/70 text-foreground/70 transition-all duration-300 hover:-translate-y-0.5 hover:text-white hover:shadow-[0_8px_20px_-8px_var(--share-c)]"
      style={{ ['--share-c' as string]: target.color }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.background = target.color
        ;(e.currentTarget as HTMLElement).style.borderColor = target.color
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.background = ''
        ;(e.currentTarget as HTMLElement).style.borderColor = ''
      }}
    >
      <Icon className="h-4 w-4" />
    </a>
  )
}

export function ShareButtons({ url, title, siteName = 'Guinée+', variant = 'row' }: ShareProps) {
  const t = encodeURIComponent(`${title} — ${siteName}`)
  const rail = variant === 'row' ? false : true
  const [cleanUrl, setCleanUrl] = useState(url)
  const [shareUrl, setShareUrl] = useState(url)

  // URL absolue côté client (nécessaire aux fenêtres de partage et au
  // presse-papiers). Pour Facebook / LinkedIn / WhatsApp, une variante avec
  // « ?v= » unique force le re-scan de la page : l'aperçu (image, titre,
  // description) est toujours frais, même après modification de l'article.
  useEffect(() => {
    try {
      const abs = new URL(url, window.location.origin)
      const busted = new URL(abs.toString())
      busted.searchParams.set('v', Date.now().toString(36))
      setCleanUrl(abs.toString())
      setShareUrl(busted.toString())
    } catch {
      setCleanUrl(url)
      setShareUrl(url)
    }
  }, [url])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(cleanUrl)
      toast.success('Lien copié dans le presse-papiers !')
    } catch {
      toast.error('Impossible de copier le lien.')
    }
  }

  return (
    <div
      className={
        rail
          ? 'flex flex-col items-center gap-2'
          : 'flex flex-wrap items-center gap-2'
      }
    >
      {!rail && <span className="eyebrow mr-1 text-muted-foreground">Partager</span>}
      {TARGETS.map((target) => (
        <ShareIcon key={target.net} target={target} t={t} cleanUrl={cleanUrl} shareUrl={shareUrl} />
      ))}
      <button
        type="button"
        aria-label="Copier le lien"
        title="Copier le lien"
        onClick={copyLink}
        className="share-btn inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/70 text-foreground/70 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand hover:bg-brand hover:text-white"
      >
        <Link2 className="h-4 w-4" />
      </button>
    </div>
  )
}
