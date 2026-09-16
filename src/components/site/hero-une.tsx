'use client'

import Link from 'next/link'
import { useRef, type ReactNode } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Clock } from 'lucide-react'

import { formatDateFr } from '@/lib/shared'
import type { ArticleCardData } from '@/lib/public-queries'

const EASE = [0.21, 0.47, 0.32, 0.98] as const

/**
 * Grande une de l'accueil — entrée en cascade au chargement (badge → rubrique →
 * titre → chapô → méta → CTA) + parallaxe douce de l'image au défilement.
 * Composant client : toutes les données viennent du bloc HERO_UNE (dashboard).
 */
export function HeroUne({
  article,
  heroLabel = 'À la une',
  children,
}: {
  article: ArticleCardData
  heroLabel?: string
  children?: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '8%'])
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0.4])

  const cat = article.categories[0]?.category

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.11, delayChildren: 0.25 } },
  }
  const item = {
    hidden: { opacity: 0, y: 26 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
  }

  return (
    <section className="mx-auto max-w-6xl px-4 pb-14 pt-8 md:px-6">
      <div ref={ref} className="relative grid gap-8 lg:grid-cols-[7fr_5fr]">
        <motion.article
          className="group relative self-start overflow-hidden rounded-lg"
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <Link href={`/article/${article.slug}`} className="block">
            {/* Image en fond absolu : remplit tout l'article, l'overlay définit la hauteur */}
            {article.coverImage && (
              <motion.div
                className="absolute inset-0 will-change-transform"
                style={{ y: imgY, scale: 1.18 }}
                aria-hidden="true"
              >
                <img
                  src={article.coverImage}
                  alt=""
                  className="h-full w-full object-cover transition-[filter] duration-700 group-hover:brightness-110"
                  loading="eager"
                  fetchPriority="high"
                />
              </motion.div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15 transition-opacity duration-500" />
            <motion.div
              className="relative flex min-h-[430px] flex-col items-start justify-end p-6 text-white md:min-h-[470px] md:p-8"
              style={{ y: textY, opacity: fade }}
              variants={container}
              initial="hidden"
              animate="show"
            >
              {/* Badge À la une (libellé configurable) avec reflet balayant */}
              <motion.span variants={item} className="sheen-host mb-3 inline-block rounded-sm px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.18em] text-white shadow-lg" style={{ background: 'var(--brand)' }}>
                {heroLabel}
              </motion.span>
              {cat && (
                <motion.span
                  variants={item}
                  className="eyebrow drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]"
                  style={{ color: cat.color || '#fff' }}
                >
                  {cat.name}
                </motion.span>
              )}
              <motion.h1 variants={item} className="mt-2 line-clamp-3 max-w-3xl font-display text-3xl font-bold leading-[1.12] md:text-4xl">
                {article.title}
              </motion.h1>
              {article.chapo && (
                <motion.p variants={item} className="mt-3 hidden max-w-2xl text-[15px] leading-relaxed text-white/85 md:block line-clamp-2">
                  {article.chapo}
                </motion.p>
              )}
              <motion.div variants={item} className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-white/80">
                {article.author?.name && <span>{article.author.name}</span>}
                {article.publishedAt && <time>{formatDateFr(article.publishedAt)}</time>}
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> {article.readingTime} min de lecture
                </span>
              </motion.div>
              {/* CTA avec flèche qui glisse */}
              <motion.span
                variants={item}
                className="mt-5 inline-flex items-center gap-2 rounded-sm bg-white/95 px-4 py-2 text-[12.5px] font-bold uppercase tracking-[0.14em] text-[#1a1210] shadow-xl backdrop-blur transition-colors duration-300 group-hover:bg-white"
              >
                Lire le reportage
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" aria-hidden="true" />
              </motion.span>
            </motion.div>
          </Link>
        </motion.article>

        <div className="flex flex-col gap-6">
          {/* Cartes secondaires (rendues et animées par la page) */}
          {children}
        </div>
      </div>
    </section>
  )
}
