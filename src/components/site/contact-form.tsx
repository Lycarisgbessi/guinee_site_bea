'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'

/** Formulaire de contact avec anti-spam honeypot (§5.6, §11) */
export function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', isTip: false, company: '' })
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (form.company) return // honeypot rempli = bot
    setState('loading')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setState('done')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l’envoi')
      setState('idle')
    }
  }

  if (state === 'done') {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-lg border border-border/70 bg-card p-10 text-center">
        <CheckCircle2 className="h-12 w-12 text-brand" />
        <h2 className="mt-4 font-display text-2xl font-bold">Message bien reçu !</h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Merci pour votre envoi. La rédaction vous répondra sous 48 heures ouvrées.
        </p>
        <button
          onClick={() => {
            setState('idle')
            setForm({ name: '', email: '', subject: '', message: '', isTip: false, company: '' })
          }}
          className="mt-6 text-sm font-medium text-brand underline underline-offset-4"
        >
          Envoyer un autre message
        </button>
      </div>
    )
  }

  const inputCls =
    'w-full rounded-md border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand'

  return (
    <form onSubmit={submit} className="rounded-lg border border-border/70 bg-card p-6 md:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="mb-1.5 block text-[13px] font-medium">Nom complet *</label>
          <input id="c-name" required minLength={2} value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="c-email" className="mb-1.5 block text-[13px] font-medium">Email *</label>
          <input id="c-email" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} className={inputCls} />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="c-subject" className="mb-1.5 block text-[13px] font-medium">Sujet *</label>
        <input id="c-subject" required minLength={3} value={form.subject} onChange={(e) => set('subject', e.target.value)} className={inputCls} />
      </div>

      <div className="mt-4">
        <label htmlFor="c-message" className="mb-1.5 block text-[13px] font-medium">Message *</label>
        <textarea
          id="c-message"
          required
          minLength={10}
          maxLength={5000}
          rows={6}
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
          className={`${inputCls} resize-y`}
        />
      </div>

      {/* Honeypot anti-spam invisible */}
      <input
        type="text"
        name="company"
        value={form.company}
        onChange={(e) => set('company', e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="pointer-events-none absolute h-0 w-0 opacity-0"
      />

      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-md bg-secondary/50 p-3.5">
        <input
          type="checkbox"
          checked={form.isTip}
          onChange={(e) => set('isTip', e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[color:var(--brand)]"
        />
        <span className="text-[13.5px] leading-relaxed text-foreground/85">
          Il s’agit d’une <strong>proposition de sujet / d’information</strong> pour la rédaction.
        </span>
      </label>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Vos données servent uniquement au traitement de votre demande (RGPD).
        </p>
        <button
          type="submit"
          disabled={state === 'loading'}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md px-6 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: 'var(--brand)', color: 'var(--brand-foreground)' }}
        >
          {state === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Envoyer
        </button>
      </div>
    </form>
  )
}
