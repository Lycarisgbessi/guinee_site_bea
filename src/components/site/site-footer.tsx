import Link from 'next/link'
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react'

import { NewsletterForm } from './newsletter-form'

export interface FooterData {
  siteName: string
  footerText: string
  social: { twitter?: string; instagram?: string; linkedin?: string; youtube?: string }
  categories: { name: string; slug: string }[]
}

/** Footer riche : rubriques, liens légaux, réseaux sociaux, newsletter (§5.8) */
export function SiteFooter({ data }: { data: FooterData }) {
  const socials = [
    { href: data.social.twitter, label: 'X / Twitter', icon: Twitter },
    { href: data.social.instagram, label: 'Instagram', icon: Instagram },
    { href: data.social.linkedin, label: 'LinkedIn', icon: Linkedin },
    { href: data.social.youtube, label: 'YouTube', icon: Youtube },
  ].filter((s) => s.href)

  return (
    <footer className="mt-auto border-t border-border/70 bg-secondary/40 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-md font-display text-xl font-bold"
              style={{ background: 'var(--brand)', color: 'var(--brand-foreground)' }}
            >
              V
            </span>
            <span className="font-display text-2xl font-bold">{data.siteName}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{data.footerText}</p>
          {socials.length > 0 && (
            <div className="mt-5 flex gap-2">
              {socials.map(({ href, label, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 text-foreground/70 transition-colors hover:border-brand hover:text-brand"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        <nav aria-label="Rubriques du footer">
          <h3 className="eyebrow mb-4 text-muted-foreground">Rubriques</h3>
          <ul className="space-y-2.5 text-sm">
            {data.categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/rubrique/${c.slug}`} className="text-foreground/80 transition-colors hover:text-brand">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Liens utiles du footer">
          <h3 className="eyebrow mb-4 text-muted-foreground">Le média</h3>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/a-propos" className="text-foreground/80 hover:text-brand">À propos</Link></li>
            <li><Link href="/contact" className="text-foreground/80 hover:text-brand">Contact & proposer un sujet</Link></li>
            <li><Link href="/archives" className="text-foreground/80 hover:text-brand">Archives</Link></li>
            <li><Link href="/tags" className="text-foreground/80 hover:text-brand">Mots-clés</Link></li>
            <li><Link href="/newsletter" className="text-foreground/80 hover:text-brand">Newsletter</Link></li>
            <li><a href="/api/rss" className="text-foreground/80 hover:text-brand">Flux RSS</a></li>
            <li><Link href="/plan-du-site" className="text-foreground/80 hover:text-brand">Plan du site</Link></li>
          </ul>
        </nav>

        <div>
          <h3 className="eyebrow mb-4 text-muted-foreground">Newsletter</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            La sélection de la rédaction, chaque vendredi.
          </p>
          <NewsletterForm compact />
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-muted-foreground md:flex-row">
          <span>© {new Date().getFullYear()} {data.siteName}. Tous droits réservés.</span>
          <div className="flex gap-4">
            <Link href="/p/mentions-legales" className="hover:text-foreground">Mentions légales</Link>
            <Link href="/p/politique-de-confidentialite" className="hover:text-foreground">Confidentialité</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
