'use client'

import { useEffect } from 'react'

/** Incrément des vues (§10 stats) — POST unique par montage */
export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `view_${slug}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    fetch(`/api/articles/${slug}/view`, { method: 'POST' }).catch(() => {})
  }, [slug])
  return null
}
