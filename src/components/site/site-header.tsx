'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Search, X } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'

export interface HeaderCategory {
  name: string
  slug: string
}

export function SiteHeader({
  siteName,
  slogan,
  categories,
  today,
}: {
  siteName: string
  slogan: string
  categories: HeaderCategory[]
  today: string
}) {
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
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
      setSearchOpen(false)
    })
    return () => cancelAnimationFrame(raf)
  }, [pathname])

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
        className={`sticky top-0 z-50 border-b border-border/60 backdrop-blur-md transition-shadow ${
          scrolled ? 'bg-background/95 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.15)]' : 'bg-background/85'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 md:px-6">
          {/* Menu mobile */}
          <button
            className="inline-flex h-10 w-10 items-center justify-center md:hidden"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 py-3.5" aria-label={`${siteName} — Accueil`}>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-md font-display text-xl font-bold"
              style={{ background: 'var(--brand)', color: 'var(--brand-foreground)' }}
            >
              V
            </span>
            <span className="font-display text-[26px] font-bold leading-none tracking-tight">{siteName}</span>
          </Link>

          {/* Navigation desktop */}
          <nav className="ml-6 hidden flex-1 items-center gap-1 lg:flex" aria-label="Rubriques">
            {categories.map((c) => {
              const active = pathname === `/rubrique/${c.slug}`
              return (
                <Link
                  key={c.slug}
                  href={`/rubrique/${c.slug}`}
                  className={`rounded-sm px-3 py-2 text-[13.5px] font-medium transition-colors hover:text-foreground ${
                    active ? 'text-brand' : 'text-foreground/75'
                  }`}
                >
                  {c.name}
                </Link>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Rechercher"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-foreground/70 transition-colors hover:text-foreground"
            >
              <Search className="h-4 w-4" />
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

      {/* Overlay de recherche */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          >
            <div className="mx-auto max-w-2xl px-6 pt-28" onClick={(e) => e.stopPropagation()}>
              <motion.div
                initial={{ y: -16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.05 }}
              >
                <form
                  action="/recherche"
                  className="flex items-center gap-3 border-b-2 border-foreground pb-3"
                  onSubmit={(e) => {
                    if (!query.trim()) e.preventDefault()
                  }}
                >
                  <Search className="h-6 w-6 text-muted-foreground" />
                  <input
                    autoFocus
                    name="q"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher un article, un reportage…"
                    aria-label="Recherche"
                    className="w-full bg-transparent font-display text-2xl outline-none placeholder:text-muted-foreground/60"
                  />
                  <button type="submit" className="eyebrow text-brand hover:opacity-80">
                    OK
                  </button>
                </form>
                <p className="mt-4 text-sm text-muted-foreground">
                  Astuce : appuyez sur Entrée pour lancer la recherche dans tous les contenus.
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
