'use client'

import { motion, type Variants } from 'framer-motion'
import { ReactNode } from 'react'

/**
 * Système d'animations premium — fluides, naturelles, cohérentes.
 *
 * IMPORTANT — hydratation : le markup rendu est STRICTEMENT identique côté serveur
 * et côté client (même élément motion.div, mêmes props initiales déterministes).
 * On ne branche JAMAIS sur useReducedMotion() pour choisir l'élément rendu : cela
 * provoquerait un mismatch d'hydratation et laisserait le contenu bloqué à opacity:0.
 *
 * Le respect de prefers-reduced-motion est assuré par :
 *  1. <MotionConfig reducedMotion="user"> dans le layout racine (framer-motion)
 *  2. Les règles CSS [data-reveal] dans globals.css (reduced-motion, print, no-JS)
 */

const EASE = [0.21, 0.47, 0.32, 0.98] as const

export type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'scale' | 'blur' | 'fade'

function initialFor(direction: RevealDirection, y: number) {
  switch (direction) {
    case 'down':
      return { opacity: 0, y: -y }
    case 'left':
      return { opacity: 0, x: Math.max(y + 6, 20) }
    case 'right':
      return { opacity: 0, x: -Math.max(y + 6, 20) }
    case 'scale':
      return { opacity: 0, scale: 0.93 }
    case 'blur':
      return { opacity: 0, y: y / 2, filter: 'blur(10px)' }
    case 'fade':
      return { opacity: 0 }
    case 'up':
    default:
      return { opacity: 0, y }
  }
}

/** Apparition au scroll avec direction/effet au choix (§10.3). */
export function Reveal({
  children,
  delay = 0,
  y = 16,
  direction = 'up',
  className,
}: {
  children: ReactNode
  delay?: number
  y?: number
  direction?: RevealDirection
  className?: string
}) {
  const target: Record<string, number | string> = { opacity: 1, y: 0, x: 0, scale: 1 }
  if (direction === 'blur') target.filter = 'blur(0px)'

  return (
    <motion.div
      className={className}
      data-reveal
      initial={initialFor(direction, y)}
      whileInView={target}
      viewport={{ once: true, margin: '0px 0px 420px 0px' }}
      transition={{ duration: 0.65, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

/** Conteneur de cascade : les enfants <StaggerItem> apparaissent en série fluide. */
export function Stagger({
  children,
  className,
  gap = 0.08,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  gap?: number
  delay?: number
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px 420px 0px' }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: gap, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  )
}

/** Enfant de cascade — à utiliser directement sous un <Stagger>. */
export function StaggerItem({
  children,
  className,
  y = 18,
}: {
  children: ReactNode
  className?: string
  y?: number
}) {
  const itemVariants: Variants = {
    hidden: initialFor('up', y),
    show: { opacity: 1, y: 0, x: 0, scale: 1, transition: { duration: 0.6, ease: EASE } },
  }
  return (
    <motion.div className={className} data-reveal variants={itemVariants}>
      {children}
    </motion.div>
  )
}
