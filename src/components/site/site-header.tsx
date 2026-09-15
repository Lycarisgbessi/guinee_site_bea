'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Menu, Search, X } from 'lucide-react'
import { siteMonogram } from '@/lib/shared'
import { ThemeToggle } from './theme-toggle'
import { CommandPalette } from './command-palette'

export interface HeaderCategory {
  name: string
  slug: string
  color?: string | null
  description?: string | null
  count?: number
  latest?: { title: string; slug: string }[]
}

export function SiteHeader({
  siteName,
  slogan,
  categories,
  today,
  logoUrl,
}: {
  siteName: string
  slogan: string
  categories: HeaderCategory[]
  today: string
  logoUrl?: string
}) {
  const monogram = siteMonogram(siteName)
  const [open, setOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    const raf = requestAnimationFrame(onScroll)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  // Ferme le menu à la navigation
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setOpen(false)
      setPaletteOpen(false)
    })
    return () => cancelAnimationFrame(raf)
  }, [pathname])

  // Raccourci global ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      {/* Barre supérieure */}
      <div className="hidden border-b border-border/60 bg-secondary/40 md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          <span>{today}</span>
          <span className="font-display italic normal-case tracking-normal">{slogan}</span>
          <Link href="/dashboard" className="transition-colors hover:text-foreground">
            Espace rédaction
          </Link>
        </div>
      </div>

      <header
        className={`sticky top-0 z-50 border-b border-border/60 backdrop-blur-md transition-all duration-300 ${
          scrolled
            ? 'bg-background/95 shadow-[0_2px_24px_-10px_rgba(0,0,0,0.22)]'
            : 'bg-background/85'
        }`}
      >
        <div
          className={`mx-auto flex max-w-6xl items-center gap-4 px-4 transition-all duration-300 md:px-6 ${
            scrolled ? 'scale-y-[0.96]' : ''
          }`}
          style={{ transformOrigin: 'top' }}
        >
          {/* Menu mobile */}
          <button
            className="inline-flex h-10 w-10 items-center justify-center md:hidden"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Logo (image personnalisée si définie dans les paramètres, sinon monogramme) */}
          <Link href="/" className="flex items-center gap-2.5 py-3" aria-label={`${siteName} — Accueil`}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={`${siteName} — logo`} className="h-9 w-auto max-w-[180px] object-contain" />
            ) : (
              <span
                className="flex h-9 w-9 items-center justify-center rounded-md font-display text-xl font-bold"
                style={{ background: 'var(--brand)', color: 'var(--brand-foreground)' }}
              >
                {monogram}
              </span>
            )}
            <span className="font-display text-[25px] font-bold leading-none tracking-tight">{siteName}</span>
          </Link>

          {/* Navigation desktop avec méga-menu */}
          <nav className="ml-4 hidden flex-1 items-center gap-0.5 lg:flex" aria-label="Rubriques">
            {categories.map((c) => {
              const active = pathname === `/rubrique/${c.slug}`
              const hasPanel = (c.description || (c.latest && c.latest.length > 0)) ?? false
              return (
                <div key={c.slug} className="group relative">
                  <Link
                    href={`/rubrique/${c.slug}`}
                    className={`block rounded-sm px-3 py-2 text-[13.5px] font-medium transition-colors group-hover:text-foreground ${
                      active ? 'text-brand' : 'text-foreground/75'
                    }`}
                  >
                    {c.name}
                    {/* Trait d'accent au survol */}
                    <span
                      className="absolute inset-x-3 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-200 group-hover:scale-x-100"
                      style={{ background: c.color || 'var(--brand)' }}
                      aria-hidden="true"
                    />
                  </Link>

                  {hasPanel && (
                    <div
                      className="invisible absolute left-1/2 top-full z-50 w-[520px] -translate-x-1/2 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
                      role="menu"
                      aria-label={`Rubrique ${c.name}`}
                    >
                      <div className="overflow-hidden rounded-lg border border-border/70 bg-background shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)]">
                        <div className="grid grid-cols-[1fr_1.1fr]">
                          {/* Colonne description */}
                          <div className="border-r border-border/60 bg-secondary/30 p-5">
                            <p className="eyebrow" style={{ color: c.color || 'var(--brand)' }}>
                              {c.name}
                            </p>
                            {c.description && (
                              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{c.description}</p>
                            )}
                            {typeof c.count === 'number' && (
                              <p className="mt-3 text-[11.5px] uppercase tracking-wider text-muted-foreground/80">
                                {c.count} article{c.count > 1 ? 's' : ''} publié{c.count > 1 ? 's' : ''}
                              </p>
                            )}
                            <Link
                              href={`/rubrique/${c.slug}`}
                              className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-foreground transition-colors hover:text-brand"
                            >
                              Voir la rubrique <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                          {/* Colonne derniers articles */}
                          <div className="p-4">
                            <p className="eyebrow px-1 pb-2 text-muted-foreground">Derniers articles</p>
                            {(c.latest ?? []).map((a) => (
                              <Link
                                key={a.slug}
                                href={`/article/${a.slug}`}
                                className="block rounded-md px-1 py-2 text-[13px] font-medium leading-snug text-foreground/85 transition-colors hover:text-brand"
                              >
                                {a.title}
                              </Link>
                            ))}
                            {!c.latest?.length && (
                              <p className="px-1 py-2 text-[13px] text-muted-foreground">Aucun article pour le moment.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setPaletteOpen(true)}
              aria-label="Rechercher (Ctrl+K)"
              title="Rechercher (Ctrl+K)"
              className="inline-flex h-9 items-center gap-2 rounded-full border border-border/60 pl-3 pr-2 text-foreground/70 transition-colors hover:text-foreground"
            >
              <Search className="h-4 w-4" />
              <kbd className="hidden rounded border border-border/60 bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground lg:block">
                Ctrl K
              </kbd>
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* Menu mobile déroulant */}
        <AnimatePresence>
          {open && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden border-t border-border/60 bg-background lg:hidden"
              aria-label="Rubriques mobile"
            >
              <div className="space-y-1 px-4 py-3">
                <Link href="/" className="block rounded-md px-3 py-2.5 text-sm font-medium hover:bg-secondary">
                  Accueil
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/rubrique/${c.slug}`}
                    className="block rounded-md px-3 py-2.5 text-sm font-medium hover:bg-secondary"
                  >
                    {c.name}
                  </Link>
                ))}
                <div className="my-2 border-t border-border/60" />
                <Link href="/rubriques" className="block rounded-md px-3 py-2.5 text-sm hover:bg-secondary">
                  Toutes les rubriques
                </Link>
                <Link href="/archives" className="block rounded-md px-3 py-2.5 text-sm hover:bg-secondary">
                  Archives
                </Link>
                <Link href="/tags" className="block rounded-md px-3 py-2.5 text-sm hover:bg-secondary">
                  Mots-clés
                </Link>
                <Link href="/contact" className="block rounded-md px-3 py-2.5 text-sm hover:bg-secondary">
                  Contact
                </Link>
                <Link href="/dashboard" className="block rounded-md px-3 py-2.5 text-sm hover:bg-secondary">
                  Espace rédaction
                </Link>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  )
}
