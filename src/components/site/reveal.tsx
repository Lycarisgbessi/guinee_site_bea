'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

/**
 * Apparition au scroll (fade-in + translate), respecte prefers-reduced-motion (§10.3).
 *
 * IMPORTANT — hydratation : le markup rendu est STRICTEMENT identique côté serveur
 * et côté client (même élément motion.div, mêmes props initiales déterministes).
 * On ne branche JAMAIS sur useReducedMotion() pour choisir l'élément rendu : cela
 * provoquerait un mismatch d'hydratation et laisserait le contenu bloqué à opacity:0.
 *
 * Déclenchement AVANT l'entrée à l'écran (marge basse +420px) : le contenu est
 * déjà apparu quand le lecteur l'atteint — plus aucune section « vide » perçue.
 *
 * Le respect de prefers-reduced-motion est assuré par :
 *  1. <MotionConfig reducedMotion="user"> dans le layout racine (framer-motion)
 *  2. Les règles CSS [data-reveal] dans globals.css (reduced-motion, print, no-JS)
 */
export function Reveal({
  children,
  delay = 0,
  y = 14,
  className,
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      data-reveal
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px 420px 0px' }}
      transition={{ duration: 0.55, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  )
}
