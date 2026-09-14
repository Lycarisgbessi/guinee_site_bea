'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'

/** Inscription newsletter avec double opt-in (§5.1, §11 RGPD) */
export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setState('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setState('done')
      toast.success(data.message || 'Inscription enregistrée !')
    } catch (err) {
      setState('idle')
      toast.error(err instanceof Error ? err.message : 'Une erreur est survenue')
    }
  }

  if (state === 'done') {
    return (
      <div className="flex items-start gap-3 rounded-md border border-border bg-card p-4 text-sm">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
        <p className="text-muted-foreground">
          Merci ! Vérifiez votre boîte mail pour <strong>confirmer votre inscription</strong> (double opt-in).
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className={compact ? 'space-y-2' : 'flex flex-col gap-3 sm:flex-row'}>
      <label htmlFor={compact ? 'nl-email-footer' : 'nl-email'} className="sr-only">
        Votre adresse email
      </label>
      <div className="relative flex-1">
        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id={compact ? 'nl-email-footer' : 'nl-email'}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@email.fr"
          className="h-11 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:border-brand"
        />
      </div>
      <button
        type="submit"
        disabled={state === 'loading'}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
        style={{ background: 'var(--brand)', color: 'var(--brand-foreground)' }}
      >
        {state === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        S’abonner
      </button>
    </form>
  )
}
