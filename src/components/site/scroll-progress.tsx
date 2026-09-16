'use client'

import { motion, useScroll, useSpring } from 'framer-motion'

/**
 * Barre de progression de lecture, fixée en haut du site.
 * Ressort physique (useSpring) pour un suivi parfaitement fluide du scroll.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 })

  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left tri-gradient"
      style={{ scaleX }}
      aria-hidden="true"
    />
  )
}
