'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * Transition d'entrée douce à chaque navigation (template Next.js).
 * Léger fondu + montée, sans bloquer le rendu ni l'hydratation.
 */
export default function SiteTemplate({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  )
}
