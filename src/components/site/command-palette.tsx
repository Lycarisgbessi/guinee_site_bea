'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CornerDownLeft, FileText, Loader2, Search } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { FORMAT_LABELS } from '@/lib/shared'

interface SearchResult {
  slug: string
  title: string
  chapo: string | null
  coverImage: string | null
  publishedAt: string | null
  format: string
}

const QUICK_LINKS = [
  { label: 'Accueil', href: '/' },
  { label: 'Toutes les rubriques', href: '/rubriques' },
  { label: 'Archives', href: '/archives' },
  { label: 'Mots-clés', href: '/tags' },
  { label: 'À propos', href: '/a-propos' },
  { label: 'Contact', href: '/contact' },
]

/**
 * Palette de commande (⌘K / Ctrl+K) — recherche instantanée plein texte
 * sur /api/search avec navigation clavier complète.
 */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Réinitialisation à l'ouverture
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setActive(0)
      const t = setTimeout(() => inputRef.current?.focus(), 40)
      return () => clearTimeout(t)
    }
  }, [open])

  // Recherche débouncée
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        const data = await res.json()
        setResults(data.results ?? [])
        setActive(0)
      } catch {
        /* requête annulée */
      } finally {
        setLoading(false)
      }
    }, 220)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [query])

  const go = useCallback(
    (href: string) => {
      onClose()
      router.push(href)
    },
    [onClose, router],
  )

  const total = results.length

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, total - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && total > 0) {
      e.preventDefault()
      go(`/article/${results[active].slug}`)
    }
  }

  // Suit l'élément actif au clavier
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[70] bg-foreground/40 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Recherche rapide"
        >
          <div className="mx-auto max-w-xl px-4 pt-[12vh]" onClick={(e) => e.stopPropagation()}>
            <motion.div
              initial={{ y: -12, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -8, opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden rounded-xl border border-border/70 bg-background shadow-2xl"
            >
              {/* Champ de recherche */}
              <div className="flex items-center gap-3 border-b border-border/60 px-4">
                <Search className="h-4.5 w-4.5 shrink-0 text-muted-foreground" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Rechercher un article, un reportage…"
                  aria-label="Recherche"
                  className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/60"
                />
                {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                <kbd className="hidden rounded border border-border/80 bg-secondary px-1.5 py-0.5 text-[10.5px] text-muted-foreground sm:block">
                  ESC
                </kbd>
              </div>

              {/* Résultats */}
              <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2" aria-live="polite">
                {query.trim().length < 2 ? (
                  <div className="p-2">
                    <p className="eyebrow px-2 pb-2 text-muted-foreground">Accès rapide</p>
                    {QUICK_LINKS.map((l) => (
                      <button
                        key={l.href}
                        onClick={() => go(l.href)}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-foreground/85 transition-colors hover:bg-secondary"
                      >
                        <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />
                        {l.label}
                      </button>
                    ))}
                  </div>
                ) : total === 0 && !loading ? (
                  <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Aucun résultat pour «&nbsp;{query.trim()}&nbsp;».
                  </p>
                ) : (
                  <div className="space-y-0.5">
                    <p className="eyebrow px-3 pb-1.5 pt-2 text-muted-foreground">
                      {total} article{total > 1 ? 's' : ''}
                    </p>
                    {results.map((r, i) => (
                      <Link
                        key={r.slug}
                        href={`/article/${r.slug}`}
                        onClick={onClose}
                        onMouseEnter={() => setActive(i)}
                        data-active={i === active}
                        className={`flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${
                          i === active ? 'bg-secondary' : ''
                        }`}
                      >
                        {r.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.coverImage}
                            alt=""
                            className="h-10 w-14 shrink-0 rounded-sm object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-sm bg-secondary">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">{r.title}</span>
                          <span className="mt-0.5 flex items-center gap-2 text-[11.5px] text-muted-foreground">
                            {r.format !== 'ARTICLE' && (
                              <span className="uppercase tracking-wider">{FORMAT_LABELS[r.format] ?? r.format}</span>
                            )}
                            {r.chapo && <span className="truncate">{r.chapo}</span>}
                          </span>
                        </span>
                        {i === active && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-brand" />}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Raccourcis */}
              <div className="flex items-center gap-4 border-t border-border/60 bg-secondary/40 px-4 py-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <kbd className="rounded border border-border/80 bg-background px-1">↑↓</kbd> naviguer
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="rounded border border-border/80 bg-background px-1">↵</kbd> ouvrir
                </span>
                <span className="ml-auto hidden sm:block">
                  Entrée pour la recherche complète
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
