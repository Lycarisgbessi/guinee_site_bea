'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

/**
 * Compteur animé : monte de 0 à `value` quand il entre dans le viewport.
 * Respecte prefers-reduced-motion via <MotionConfig reducedMotion="user"> et
 * via la vérification media query côté JS (affichage direct).
 */
export function AnimatedCounter({
  value,
  duration = 1.4,
  className,
}: {
  value: number
  duration?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    let raf = 0
    const start = performance.now()
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const tick = (now: number) => {
      if (reduced) {
        setDisplay(value)
        return
      }
      const t = Math.min(1, (now - start) / (duration * 1000))
      // easeOutExpo pour un démarrage vif et une fin douce
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      setDisplay(Math.round(value * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, duration])

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString('fr-FR')}
    </span>
  )
}
