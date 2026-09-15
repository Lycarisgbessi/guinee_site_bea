'use client'

import { Link2, Linkedin, Mail, Twitter } from 'lucide-react'

interface ShareProps {
  url: string
  title: string
  siteName?: string
  /** « rail » = colonne verticale collante (desktop) */
  variant?: 'row' | 'rail'
}

/** Partage réseaux sociaux (§5.5) */
export function ShareButtons({ url, title, siteName = 'La Vigie', variant = 'row' }: ShareProps) {
  const u = encodeURIComponent(url)
  const t = encodeURIComponent(`${title} — ${siteName}`)
  const rail = variant === 'rail'

  const links = [
    { label: 'Partager sur X', href: `https://twitter.com/intent/tweet?url=${u}&text=${t}`, icon: Twitter },
    { label: 'Partager sur LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, icon: Linkedin },
    { label: 'Partager par email', href: `mailto:?subject=${t}&body=${u}`, icon: Mail },
  ]
  return (
    <div className={rail ? 'flex flex-col items-center gap-2' : 'flex items-center gap-2'}>
      {!rail && <span className="eyebrow mr-1 text-muted-foreground">Partager</span>}
      {links.map(({ label, href, icon: Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 text-foreground/70 transition-all hover:-translate-y-0.5 hover:border-brand hover:text-brand"
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
      <button
        type="button"
        aria-label="Copier le lien"
        onClick={() => {
          navigator.clipboard?.writeText(url).catch(() => {})
        }}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 text-foreground/70 transition-all hover:-translate-y-0.5 hover:border-brand hover:text-brand"
      >
        <Link2 className="h-4 w-4" />
      </button>
    </div>
  )
}
