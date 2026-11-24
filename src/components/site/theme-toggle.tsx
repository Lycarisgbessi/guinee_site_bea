'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

/** Bascule mode sombre / clair avec mémorisation (§5.8) */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <button
      type="button"
      aria-label={mounted && theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-foreground/70 transition-colors hover:text-foreground hover:border-foreground/40 ${className}`}
    >
      {mounted && theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
