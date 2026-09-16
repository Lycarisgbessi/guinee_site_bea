'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, type ReactNode } from 'react'
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
  latest?: { title: string; slug: string; image?: string | null }[]
}

const EASE = [0.21, 0.47, 0.32, 0.98] as const

/* ------------------------------------------------------------------ */
/* Item de rubrique du nav desktop : hover JS (délai de grâce) +       */
/* méga-panel animé (Framer Motion) avec vignettes d'articles.         */
/* ------------------------------------------------------------------ */
function CategoryNavItem({ category, active }: { category: HeaderCategory; active: boolean }) {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const enter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }
  const leave = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), 170)
  }
  useEffect(() => () => void (closeTimer.current && clearTimeout(closeTimer.current)), [])

  const hasPanel = Boolean(category.description || (category.latest && category.latest.length > 0))
  const accent = category.color || 'var(--brand)'

  return (
    <div className="relative" onMouseEnter={enter} onMouseLeave={leave}>
      <Link
        href={`/rubrique/${category.slug}`}
        className={`block rounded-sm px-3 py-2 text-[13.5px] font-medium transition-colors ${
          active || open ? 'text-foreground' : 'text-foreground/75'
        }`}
        onFocus={enter}
        onBlur={leave}
        aria-haspopup={hasPanel || undefined}
        aria-expanded={hasPanel ? open : undefined}
      >
        {category.name}
        {/* Trait d'accent animé (couleur de la rubrique) */}
        <span
          className="absolute inset-x-3 bottom-0 h-0.5 origin-left rounded-full transition-transform duration-300 ease-out"
          style={{ background: accent, transform: open ? 'scaleX(1)' : 'scaleX(0)' }}
          aria-hidden="true"
        />
      </Link>

      {hasPanel && (
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.99 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="absolute left-1/2 top-full z-50 w-[560px] -translate-x-1/2 pt-3"
              role="menu"
              aria-label={`Rubrique ${category.name}`}
            >
              <div className="overflow-hidden rounded-lg border border-border/70 bg-background shadow-[0_24px_60px_-24px_rgba(0,0,0,0.4)]">
                {/* Signature tricolore en tête de panel */}
                <div className="tri-bar h-[3px]" aria-hidden="true" />
                <div className="grid grid-cols-[1fr_1.35fr]">
                  {/* Colonne description */}
                  <div className="border-r border-border/60 bg-secondary/30 p-5">
                    <p className="eyebrow" style={{ color: accent }}>
                      {category.name}
                    </p>
                    {category.description && (
                      <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{category.description}</p>
                    )}
                    {typeof category.count === 'number' && (
                      <p className="mt-3 text-[11.5px] uppercase tracking-wider text-muted-foreground/80">
                        {category.count} article{category.count > 1 ? 's' : ''} publié{category.count > 1 ? 's' : ''}
                      </p>
                    )}
                    <Link
                      href={`/rubrique/${category.slug}`}
                      className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-foreground transition-colors hover:text-brand"
                    >
                      Voir la rubrique <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  {/* Colonne derniers articles avec vignettes */}
                  <motion.div
                    className="p-4"
                    initial="hidden"
                    animate="show"
                    variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } } }}
                  >
                    <p className="eyebrow px-1 pb-2 text-muted-foreground">Derniers articles</p>
                    {(category.latest ?? []).map((a) => (
                      <motion.div
                        key={a.slug}
                        variants={{
                          hidden: { opacity: 0, x: 12 },
                          show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE } },
                        }}
                      >
                        <Link
                          href={`/article/${a.slug}`}
                          className="group flex items-center gap-3 rounded-md p-1.5 transition-colors hover:bg-secondary/60"
                        >
                          {a.image ? (
                             
                            <img
                              src={a.image}
                              alt=""
                              loading="lazy"
                              className="h-11 w-16 shrink-0 rounded-sm object-cover"
                            />
                          ) : (
                            <span className="h-11 w-16 shrink-0 rounded-sm bg-secondary" aria-hidden="true" />
                          )}
                          <span className="line-clamp-2 text-[13px] font-medium leading-snug text-foreground/85 transition-colors group-hover:text-brand">
                            {a.title}
                          </span>
                        </Link>
                      </motion.div>
                    ))}
                    {!category.latest?.length && (
                      <p className="px-1 py-2 text-[13px] text-muted-foreground">Aucun article pour le moment.</p>
                    )}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Lien simple du nav (À propos, Contact) — soulignement tricolore     */
/* ------------------------------------------------------------------ */
function SimpleNavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`group relative block rounded-sm px-3 py-2 text-[13.5px] font-medium transition-colors hover:text-foreground ${
        active ? 'text-brand' : 'text-foreground/75'
      }`}
    >
      {label}
      <span
        className="absolute inset-x-3 bottom-0 h-0.5 origin-left scale-x-0 rounded-full tri-gradient transition-transform duration-300 ease-out group-hover:scale-x-100 group-focus-within:scale-x-100"
        aria-hidden="true"
      />
    </Link>
  )
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

  const mobileItem = {
    hidden: { opacity: 0, x: -14 },
    show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE } },
  }

  return (
    <>
      {/* Barre tricolore signature (rouge → or → vert) */}
      <div className="tri-bar h-[3px]" aria-hidden="true" />
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
          scrolled ? 'bg-background/95 shadow-[0_2px_24px_-10px_rgba(0,0,0,0.22)]' : 'bg-background/85'
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
            className="inline-flex h-10 w-10 items-center justify-center transition-transform active:scale-90 md:hidden"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Logo (image personnalisée si définie dans les paramètres, sinon monogramme) */}
          <Link href="/" className="flex items-center gap-2.5 py-3" aria-label={`${siteName} — Accueil`}>
            {logoUrl ? (
               
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

          {/* Navigation desktop : rubriques (méga-menu) + liens éditoriaux */}
          <nav className="ml-4 hidden flex-1 items-center gap-0.5 lg:flex" aria-label="Rubriques">
            {categories.map((c) => (
              <CategoryNavItem key={c.slug} category={c} active={pathname === `/rubrique/${c.slug}`} />
            ))}

            {/* Séparateur + liens éditoriaux permanents */}
            <span className="mx-2.5 hidden h-5 w-px bg-border/70 xl:block" aria-hidden="true" />
            <SimpleNavLink href="/a-propos" label="À propos" active={pathname === '/a-propos'} />
            <SimpleNavLink href="/contact" label="Contact" active={pathname === '/contact'} />
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setPaletteOpen(true)}
              aria-label="Rechercher (Ctrl+K)"
              title="Rechercher (Ctrl+K)"
              className="inline-flex h-9 items-center gap-2 rounded-full border border-border/60 pl-3 pr-2 text-foreground/70 transition-all hover:scale-105 hover:text-foreground active:scale-95"
            >
              <Search className="h-4 w-4" />
              <kbd className="hidden rounded border border-border/60 bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground lg:block">
                Ctrl K
              </kbd>
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* Menu mobile : cascade animée en deux sections */}
        <AnimatePresence>
          {open && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="overflow-hidden border-t border-border/60 bg-background lg:hidden"
              aria-label="Navigation mobile"
            >
              <motion.div
                className="space-y-1 px-4 py-4"
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.035, delayChildren: 0.06 } } }}
              >
                <p className="eyebrow px-3 pb-1 pt-2 text-muted-foreground">Rubriques</p>
                <motion.div variants={mobileItem}>
                  <Link href="/" className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-secondary">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--brand)' }} aria-hidden="true" />
                    Accueil
                  </Link>
                </motion.div>
                {categories.map((c) => (
                  <motion.div key={c.slug} variants={mobileItem}>
                    <Link
                      href={`/rubrique/${c.slug}`}
                      className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-secondary"
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: c.color || 'var(--brand)' }}
                        aria-hidden="true"
                      />
                      {c.name}
                      {typeof c.count === 'number' && (
                        <span className="ml-auto text-[11px] text-muted-foreground">{c.count}</span>
                      )}
                    </Link>
                  </motion.div>
                ))}

                <div className="my-2.5 border-t border-border/60" />
                <p className="eyebrow px-3 pb-1 pt-1 text-muted-foreground">Explorer</p>
                {[
                  { href: '/rubriques', label: 'Toutes les rubriques' },
                  { href: '/archives', label: 'Archives' },
                  { href: '/tags', label: 'Mots-clés' },
                  { href: '/a-propos', label: 'À propos' },
                  { href: '/contact', label: 'Contact' },
                ].map((l) => (
                  <motion.div key={l.href} variants={mobileItem}>
                    <Link href={l.href} className="block rounded-md px-3 py-2.5 text-sm hover:bg-secondary">
                      {l.label}
                    </Link>
                  </motion.div>
                ))}
                <motion.div variants={mobileItem}>
                  <Link
                    href="/dashboard"
                    className="mt-2 flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-semibold text-brand hover:bg-brand/5"
                  >
                    Espace rédaction <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </motion.div>
              </motion.div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  )
}
