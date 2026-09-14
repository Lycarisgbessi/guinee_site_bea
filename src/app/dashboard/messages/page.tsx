'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCheck, Inbox, Lightbulb, Loader2, Mail, MailOpen, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDateFr } from '@/lib/shared'

interface MessageRow {
  id: string
  name: string
  email: string
  subject: string
  message: string
  isTip: boolean
  status: string
  createdAt: string
}

/** Boîte de réception du formulaire de contact (§6.8) */
export default function MessagesPage() {
  const [items, setItems] = useState<MessageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('ALL')
  const [tipOnly, setTipOnly] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (status !== 'ALL') params.set('status', status)
    if (tipOnly) params.set('tip', '1')
    const res = await fetch(`/api/admin/messages?${params}`)
    const data = await res.json()
    if (res.ok) setItems(data.items)
    else toast.error(data.error)
    setLoading(false)
  }, [status, tipOnly])

  useEffect(() => {
    const raf = requestAnimationFrame(load)
    return () => cancelAnimationFrame(raf)
  }, [load])

  async function markStatus(id: string, newStatus: string) {
    const res = await fetch(`/api/admin/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      load()
    } else toast.error('Erreur')
  }

  async function remove(id: string) {
    if (!window.confirm('Supprimer ce message ?')) return
    const res = await fetch(`/api/admin/messages/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Message supprimé.')
      load()
    } else toast.error('Erreur')
  }

  const BADGE: Record<string, string> = {
    UNREAD: 'bg-[color:var(--brand)]/10 text-[color:var(--brand)]',
    READ: 'bg-secondary text-foreground/70',
    DONE: 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-400',
  }
  const LABEL: Record<string, string> = { UNREAD: 'Non lu', READ: 'Lu', DONE: 'Traité' }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">Formulaire de contact et propositions de sujets des lecteurs.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-40"><Inbox className="h-3.5 w-3.5 text-muted-foreground" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous</SelectItem>
            <SelectItem value="UNREAD">Non lus</SelectItem>
            <SelectItem value="READ">Lus</SelectItem>
            <SelectItem value="DONE">Traités</SelectItem>
          </SelectContent>
        </Select>
        <label className="flex cursor-pointer items-center gap-2 text-[13px]">
          <input type="checkbox" className="h-4 w-4 accent-[color:var(--brand)]" checked={tipOnly} onChange={(e) => setTipOnly(e.target.checked)} />
          <Lightbulb className="h-4 w-4 text-amber-500" /> Uniquement les propositions de sujets
        </label>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border">
          <p className="text-sm text-muted-foreground">Aucun message dans ce filtre.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((m) => (
            <li key={m.id} className={`rounded-lg border bg-card p-4 ${m.status === 'UNREAD' ? 'border-[color:var(--brand)]/40' : 'border-border'}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-[14px] font-semibold">
                    {m.isTip && <Lightbulb className="h-4 w-4 text-amber-500" title="Proposition de sujet" />}
                    {m.subject}
                    <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${BADGE[m.status]}`}>{LABEL[m.status]}</span>
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                    {m.name} · <a href={`mailto:${m.email}`} className="underline underline-offset-2">{m.email}</a> · {formatDateFr(m.createdAt, true)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  {m.status !== 'DONE' && (
                    <Button size="sm" variant="outline" onClick={() => markStatus(m.id, m.status === 'UNREAD' ? 'READ' : 'DONE')} className="gap-1.5">
                      {m.status === 'UNREAD' ? <><MailOpen className="h-3.5 w-3.5" /> Marquer lu</> : <><CheckCheck className="h-3.5 w-3.5" /> Traité</>}
                    </Button>
                  )}
                  <a
                    href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + m.subject)}`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-[13px] font-medium hover:border-foreground/40"
                  >
                    <Mail className="h-3.5 w-3.5" /> Répondre
                  </a>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => remove(m.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <p className="mt-2.5 whitespace-pre-wrap rounded-md bg-secondary/50 p-3 text-[14px] leading-relaxed text-foreground/90">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
