'use client'

import { motion, useScroll, useSpring } from 'framer-motion'

/** Indicateur de progression de lecture sur les articles longs (§5.8) */
export function ReadingProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 })

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed left-0 right-0 top-0 z-[70] h-[3px] origin-left"
      aria-hidden="true"
    >
      <div className="h-full w-full" style={{ background: 'var(--brand)' }} />
    </motion.div>
  )
}
