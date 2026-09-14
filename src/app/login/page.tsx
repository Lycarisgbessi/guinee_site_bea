'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur de connexion')
      toast.success(`Bienvenue, ${data.user.name} !`)
      router.push(next)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur de connexion')
      setLoading(false)
    }
  }

  const inputCls =
    'h-11 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm outline-none transition-colors focus:border-brand'

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="relative">
        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="claire@lavigie.fr"
          aria-label="Adresse email"
          className={inputCls}
        />
      </div>
      <div className="relative">
        <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••"
          aria-label="Mot de passe"
          className={inputCls}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: 'var(--brand)', color: 'var(--brand-foreground)' }}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        Se connecter au tableau de bord
      </button>
    </form>
  )
}

/** Connexion sécurisée au back-office (§6.1) */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl font-display text-2xl font-bold" style={{ background: 'var(--brand)', color: 'var(--brand-foreground)' }}>
            V
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold">Espace rédaction</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tableau de bord éditorial — accès réservé</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-7 shadow-sm">
          <Suspense fallback={<div className="h-11 animate-pulse rounded-md bg-secondary" />}>
            <LoginForm />
          </Suspense>
        </div>

        <div className="mt-5 rounded-lg border border-dashed border-border bg-background/60 p-4 text-center text-xs leading-relaxed text-muted-foreground">
          <strong className="text-foreground/80">Compte de démonstration</strong>
          <br />
          claire@lavigie.fr — admin2026
        </div>
      </div>
    </div>
  )
}
