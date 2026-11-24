'use client'

import { MotionConfig } from 'framer-motion'
import { ReactNode } from 'react'

/**
 * Wrapper client : désactive les animations de transform/layout pour les
 * utilisateurs ayant activé prefers-reduced-motion (§10.3), sans changer
 * le markup rendu (aucun risque de mismatch d'hydratation).
 */
export function MotionConfigProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
