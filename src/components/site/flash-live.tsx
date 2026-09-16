'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Clock, Flame, Radio } from 'lucide-react'

import { timeAgoFr } from '@/lib/shared'

const EASE = [0.21, 0.47, 0.32, 0.98] as const

/** Données sérialisables transmises par la page serveur */
export interface FlashItem {
  id: string
  slug: string
  title: string
  cover: string | null
  cat: string | null
  catColor: string | null
  publishedAt: string | null
}

const ROTATE_MS = 5600

/**
 * Bloc « En direct » — la partie flash info RICHE et animée :
 *  - Carte « Dernière minute » : rotation automatique toutes les 5,6 s avec
 *    fondu fluide, zoom Ken Burns de l'image et barre de progression ;
 *  - Feed vertical continu : les titres défilent en boucle (pause au survol) ;
 *  - Horloge en direct de Conakry (fuseau GMT+0).
 * Toutes les données viennent du dashboard (bloc FIL_ACTU).
 */
export function FlashLive({
  title,
  eyebrow,
  items,
}: {
  title: string
  eyebrow: string
  items: FlashItem[]
}) {
  const [idx, setIdx] = useState(0)
  const [clock, setClock] = useState('')

  // Rotation automatique de la carte « Dernière minute »
  useEffect(() => {
    if (items.length <= 1) return
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), ROTATE_MS)
    return () => clearInterval(t)
  }, [items.length])

  // Horloge en direct (rendu client uniquement — aucune erreur d'hydratation)
  useEffect(() => {
    const tick = () =>
      setClock(
        new Intl.DateTimeFormat('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Africa/Conakry',
        }).format(new Date()),
      )
    tick()
    const t = setInterval(tick, 10_000)
    return () => clearInterval(t)
  }, [])

  const count = items.length
  const rotating = items.length ? items[idx % items.length] : null
  const feedItems = items.slice(0, 8)

  // Durée du feed proportionnelle au nombre d'items (vitesse constante)
  const feedDur = Math.max(26, (feedItems.length || 1) * 4.5)

  return (
    <section className="relative overflow-hidden border-y border-border/60 bg-secondary/30">
      {/* Ornements d'arrière-plan flottants (rouge + vert de la marque) */}
      <div
        className="glow-orb float-slow absolute -right-20 top-6 h-52 w-52 rounded-full opacity-[0.16]"
        style={{ background: 'var(--brand)' }}
        aria-hidden="true"
      />
      <div
        className="glow-orb float-slower absolute -left-16 bottom-4 h-44 w-44 rounded-full opacity-[0.13]"
        style={{ background: 'var(--brand-green)' }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-14 md:px-6">
        {/* En-tête de section */}
        <motion.div
          className="mb-8 flex flex-wrap items-end justify-between gap-4"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px 0px 320px 0px' }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <div>
            <span className="eyebrow inline-flex items-center gap-2 text-brand">
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
              {eyebrow}
            </span>
            <h2 className="tri-underline font-display text-2xl font-bold md:text-3xl">{title}</h2>
          </div>
          <div className="flex items-center gap-4">
            {clock && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-[12px] tabular-nums text-muted-foreground">
                <Radio className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
                Conakry {clock}
              </span>
            )}
            <Link
              href="/archives"
              className="eyebrow text-muted-foreground transition-colors hover:text-foreground"
            >
              Toutes les archives →
            </Link>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[7fr_5fr]">
          {/* ---------- Carte « Dernière minute » en rotation ---------- */}
          <motion.div
            className="relative min-h-[380px] overflow-hidden rounded-lg border border-border/60 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.45)] sm:min-h-[420px]"
            initial={{ opacity: 0, scale: 0.975 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '0px 0px 320px 0px' }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            {/* mode sync : les enfants en position absolue se superposent →
                fondu croisé continu, aucun instant « carte vide » */}
            <AnimatePresence initial={false}>
              {rotating && (
                <motion.div
                  key={rotating.id}
                  className="absolute inset-0"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                  transition={{ duration: 0.55, ease: EASE }}
                >
                  <Link href={`/article/${rotating.slug}`} className="group block h-full w-full">
                    {/* Image avec zoom Ken Burns relancé à chaque rotation */}
                    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
                      {rotating.cover ? (
                        <img
                          src={rotating.cover}
                          alt=""
                          className="ken-burns h-full w-full object-cover"
                          style={{ ['--kb-dur' as string]: `${ROTATE_MS / 1000 + 1.4}s` }}
                        />
                      ) : (
                        <div className="h-full w-full bg-secondary" />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20 transition-opacity duration-500" />

                    {/* Contenu */}
                    <div className="relative flex h-full flex-col justify-end p-6 text-white md:p-8">
                      <div className="mb-3 flex items-center gap-2">
                        <span
                          className="sheen-host inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.18em] shadow-lg"
                          style={{ background: 'var(--brand)', color: '#fff' }}
                        >
                          <Flame className="h-3 w-3" aria-hidden="true" />
                          Dernière minute
                        </span>
                        {rotating.cat && (
                          <span className="eyebrow text-white/90" style={{ color: rotating.catColor || '#fff' }}>
                            {rotating.cat}
                          </span>
                        )}
                      </div>
                      <h3 className="max-w-xl font-display text-2xl font-bold leading-[1.15] md:text-[28px]">
                        {rotating.title}
                      </h3>
                      <span className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] text-white/75">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        {rotating.publishedAt ? timeAgoFr(new Date(rotating.publishedAt)) : ''}
                        <span className="ml-2 inline-flex items-center gap-1 font-semibold text-white/90">
                          Lire
                          <ArrowRight
                            className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1.5"
                            aria-hidden="true"
                          />
                        </span>
                      </span>
                    </div>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Barre de progression + pastilles de navigation */}
            {count > 1 && (
              <>
                <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/15" aria-hidden="true">
                  <div
                    key={idx}
                    className="flash-progress h-full tri-gradient"
                    style={{ ['--flash-dur' as string]: `${ROTATE_MS / 1000}s` }}
                  />
                </div>
                <div className="absolute right-4 top-4 flex gap-1.5">
                  {items.map((it, i) => (
                    <button
                      key={it.id}
                      onClick={() => setIdx(i)}
                      aria-label={`Voir : ${it.title}`}
                      aria-current={i === idx % count}
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: i === idx % count ? 22 : 8,
                        background: i === idx % count ? 'var(--brand-gold)' : 'rgba(255,255,255,0.45)',
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </motion.div>

          {/* ---------- Feed vertical continu (défile sans arrêt) ---------- */}
          <motion.div
            className="flash-feed relative flex min-h-[380px] flex-col overflow-hidden rounded-lg border border-border/60 bg-card shadow-[0_20px_50px_-34px_rgba(0,0,0,0.4)] sm:min-h-[420px]"
            initial={{ opacity: 0, x: 26 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '0px 0px 320px 0px' }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
            aria-label="Défilé des derniers articles"
          >
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <span className="eyebrow inline-flex items-center gap-2 text-foreground/80">
                <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
                Ça vient de tomber
              </span>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground/70">
                Survolez pour pauser
              </span>
            </div>

            <div className="feed-mask min-h-0 flex-1 overflow-hidden">
              <div
                className="flash-feed-track flex flex-col"
                style={{ ['--feed-dur' as string]: `${feedDur}s` }}
              >
                {[0, 1].map((copy) => (
                  <div key={copy} className="flex flex-col gap-2.5 p-3" aria-hidden={copy === 1}>
                    {feedItems.map((a) => (
                      <Link
                        key={`${copy}-${a.id}`}
                        href={`/article/${a.slug}`}
                        tabIndex={copy === 1 ? -1 : 0}
                        className="group flex shrink-0 items-center gap-3 rounded-md border border-border/50 bg-background/70 p-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-[0_10px_26px_-16px_rgba(224,35,16,0.5)]"
                      >
                        {a.cover ? (
                          <img
                            src={a.cover}
                            alt=""
                            loading="lazy"
                            className="h-12 w-16 shrink-0 rounded-sm object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <span className="h-12 w-16 shrink-0 rounded-sm bg-secondary" aria-hidden="true" />
                        )}
                        <span className="min-w-0 flex-1">
                          {a.cat && (
                            <span
                              className="eyebrow block pb-0.5 text-[10px]"
                              style={{ color: a.catColor || 'var(--brand)' }}
                            >
                              {a.cat}
                            </span>
                          )}
                          <span className="line-clamp-2 block text-[13px] font-medium leading-snug text-foreground/85 transition-colors group-hover:text-brand">
                            {a.title}
                          </span>
                        </span>
                        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground/70">
                          {a.publishedAt ? timeAgoFr(new Date(a.publishedAt)) : ''}
                        </span>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
