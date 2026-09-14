'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  FileText, FolderTree, Home, Image as ImageIcon, Inbox, LayoutDashboard,
  LogOut, Mail, Menu, MessageSquare, Moon, Newspaper, Settings, Sun, X,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

const NAV = [
  { href: '/dashboard', label: 'Vue d’ensemble', icon: LayoutDashboard },
  { href: '/dashboard/articles', label: 'Articles', icon: FileText },
  { href: '/dashboard/rubriques', label: 'Rubriques', icon: FolderTree },
  { href: '/dashboard/pages', label: 'Pages', icon: Newspaper },
  { href: '/dashboard/accueil', label: 'Page d’accueil', icon: Home },
  { href: '/dashboard/medias', label: 'Médiathèque', icon: ImageIcon },
  { href: '/dashboard/commentaires', label: 'Commentaires', icon: MessageSquare },
  { href: '/dashboard/messages', label: 'Messages', icon: Inbox },
  { href: '/dashboard/newsletter', label: 'Newsletter', icon: Mail },
  { href: '/dashboard/parametres', label: 'Paramètres', icon: Settings },
]

/** Coque du tableau de bord : navigation latérale + barre utilisateur (§6) */
export function DashboardShell({
  children,
  userName,
  userRole,
}: {
  children: React.ReactNode
  userName: string
  userRole: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMobileOpen(false))
    return () => cancelAnimationFrame(raf)
  }, [pathname])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    toast.success('Vous êtes déconnecté(e).')
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  return (
    <div className="flex min-h-screen bg-secondary/40">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md font-display text-lg font-bold" style={{ background: 'var(--brand)', color: 'var(--brand-foreground)' }}>
            V
          </span>
          <div>
            <p className="font-display text-[15px] font-bold leading-none">La Vigie</p>
            <p className="mt-0.5 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">Rédaction</p>
          </div>
        </div>
        <nav className="nice-scroll flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Navigation du dashboard">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                isActive(href)
                  ? 'bg-[color:var(--brand)]/10 text-[color:var(--brand)]'
                  : 'text-foreground/75 hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <Link href="/" className="flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] text-foreground/70 transition-colors hover:bg-secondary">
            <Home className="h-4 w-4" /> Voir le site public
          </Link>
        </div>
      </aside>

      {/* Sidebar mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-card p-3 shadow-xl">
            <div className="mb-3 flex items-center justify-between px-2 py-2">
              <span className="font-display font-bold">La Vigie — Rédaction</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Fermer le menu" className="p-1.5">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-0.5">
              {NAV.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium ${
                    isActive(href) ? 'bg-[color:var(--brand)]/10 text-[color:var(--brand)]' : 'text-foreground/75 hover:bg-secondary'
                  }`}
                >
                  <Icon className="h-4 w-4" /> {label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Contenu */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur md:px-6">
          <button
            className="inline-flex h-10 w-10 items-center justify-center lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="hidden text-[12px] uppercase tracking-[0.14em] text-muted-foreground sm:inline">
            Tableau de bord éditorial
          </span>
          <div className="ml-auto flex items-center gap-2.5">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Basculer le thème"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-foreground/70 hover:text-foreground"
            >
              {mounted && theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <div className="hidden items-center gap-2.5 sm:flex">
              <div className="text-right">
                <p className="text-[13px] font-semibold leading-none">{userName}</p>
                <p className="mt-0.5 text-[10.5px] uppercase tracking-wide text-muted-foreground">{userRole}</p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full font-display text-sm font-bold" style={{ background: 'var(--brand)', color: 'var(--brand-foreground)' }}>
                {userName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <button
              onClick={logout}
              aria-label="Se déconnecter"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-foreground/70 transition-colors hover:border-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
