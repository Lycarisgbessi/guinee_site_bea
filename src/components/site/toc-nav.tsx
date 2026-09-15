'use client'

import { useEffect, useState } from 'react'
import { ListTree } from 'lucide-react'

interface TocItem {
  id: string
  text: string
}

/**
 * Sommaire d'article avec suivi de lecture (scroll-spy via IntersectionObserver).
 * - Variante « rail » : colonne collante à droite (desktop xl)
 * - Variante « card » : encart replié au début de l'article (mobile/tablette)
 */
export function TocNav({ items, variant = 'card' }: { items: TocItem[]; variant?: 'card' | 'rail' }) {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    /**
     * Scroll-spy : l'intertitre actif est le DERNIER passé sous la ligne de
     * lecture (130px, juste sous le header collant). Il reste actif tant que
     * l'on lit la section — aucun « trou » de surlignage au milieu d'un texte.
     */
    const compute = () => {
      let current: string | null = null
      for (const it of items) {
        const el = document.getElementById(it.id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= 130) current = it.id
        else break
      }
      setActiveId(current)
    }
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(compute)
    }
    compute()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [items])

  const list = (
    <ol className="space-y-0.5">
      {items.map((it, i) => {
        const active = it.id === activeId
        return (
          <li key={it.id}>
            <a
              href={`#${it.id}`}
              aria-current={active ? 'location' : undefined}
              className={`group flex items-baseline gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] leading-snug transition-colors ${
                active
                  ? 'bg-secondary font-semibold text-brand'
                  : 'text-foreground/70 hover:bg-secondary/60 hover:text-foreground'
              }`}
            >
              <span
                className={`font-display text-[11px] tabular-nums ${active ? 'text-brand' : 'text-muted-foreground/60'}`}
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="line-clamp-2">{it.text}</span>
            </a>
          </li>
        )
      })}
    </ol>
  )

  if (variant === 'rail') {
    return (
      <nav aria-label="Sommaire de l'article" className="sticky top-28 hidden xl:block">
        <p className="eyebrow mb-3 flex items-center gap-1.5 px-2.5 text-muted-foreground">
          <ListTree className="h-3.5 w-3.5" aria-hidden="true" /> Sommaire
        </p>
        {list}
        {/* Indicateur de progression verticale discret */}
        <div className="mt-4 border-t border-border/60 px-2.5 pt-3">
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className="text-[12px] text-muted-foreground transition-colors hover:text-brand">
            ↑ Revenir en haut
          </a>
        </div>
      </nav>
    )
  }

  return (
    <details className="group mb-8 rounded-lg border border-border/70 bg-secondary/30 xl:hidden" open>
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
        <span className="eyebrow flex items-center gap-1.5 text-muted-foreground">
          <ListTree className="h-3.5 w-3.5" aria-hidden="true" /> Sommaire
        </span>
        <span className="text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true">
          ▾
        </span>
      </summary>
      <div className="border-t border-border/60 px-2 pb-2 pt-1.5">{list}</div>
    </details>
  )
}
