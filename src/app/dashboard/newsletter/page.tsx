'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, Download, Loader2, MailPlus, Search, Trash2, UserCheck, UserX } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDateFr } from '@/lib/shared'

interface SubscriberRow {
  id: string
  email: string
  status: string
  token: string
  confirmedAt: string | null
  createdAt: string
}

const BADGE: Record<string, string> = {
  PENDING: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  CONFIRMED: 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-400',
  UNSUBSCRIBED: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400',
}
const LABEL: Record<string, string> = { PENDING: 'En attente', CONFIRMED: 'Confirmé', UNSUBSCRIBED: 'Désinscrit' }

/** Gestion des abonnés newsletter + export CSV (§6.10) */
export default function NewsletterPage() {
  const [items, setItems] = useState<SubscriberRow[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/newsletter')
    const data = await res.json()
    if (res.ok) setItems(data.items)
    else toast.error(data.error)
    setLoading(false)
  }, [])

  useEffect(() => {
    const raf = requestAnimationFrame(load)
    return () => cancelAnimationFrame(raf)
  }, [load])

  const filtered = items.filter((s) => !q.trim() || s.email.toLowerCase().includes(q.toLowerCase()))

  async function update(id: string, status: string) {
    const res = await fetch(`/api/admin/newsletter/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      toast.success(status === 'CONFIRMED' ? 'Abonné confirmé.' : 'Abonné désinscrit.')
      load()
    } else toast.error('Erreur')
  }

  async function remove(id: string) {
    if (!window.confirm('Supprimer cet abonné ? (droit à l’oubli RGPD)')) return
    const res = await fetch(`/api/admin/newsletter/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Abonné supprimé.')
      load()
    } else toast.error('Erreur')
  }

  function exportCsv() {
    const header = 'email,status,created_at,confirmed_at\n'
    const rows = filtered
      .map((s) => `${s.email},${s.status},${s.createdAt},${s.confirmedAt ?? ''}`)
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `newsletter-abonnes-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Export CSV téléchargé.')
  }

  const counts = {
    confirmed: items.filter((s) => s.status === 'CONFIRMED').length,
    pending: items.filter((s) => s.status === 'PENDING').length,
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Newsletter</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {counts.confirmed} confirmé{counts.confirmed > 1 ? 's' : ''} · {counts.pending} en attente de confirmation (double opt-in)
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv} className="gap-2">
          <Download className="h-4 w-4" /> Exporter en CSV
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un email…" className="h-9 w-72 pl-8" />
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="nice-scroll overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Inscrit le</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/40">
                    <td className="px-4 py-3 font-medium">{s.email}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${BADGE[s.status]}`}>{LABEL[s.status]}</span>
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-muted-foreground">{formatDateFr(s.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {s.status === 'PENDING' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => update(s.id, 'CONFIRMED')} className="h-8 gap-1.5">
                              <UserCheck className="h-3.5 w-3.5" /> Confirmer
                            </Button>
                            <a
                              href={`/newsletter/confirmation?token=${s.token}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Simuler le clic sur le lien de confirmation"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                            >
                              <MailPlus className="h-4 w-4" />
                            </a>
                          </>
                        )}
                        {s.status === 'CONFIRMED' && (
                          <Button size="sm" variant="outline" onClick={() => update(s.id, 'UNSUBSCRIBED')} className="h-8 gap-1.5">
                            <UserX className="h-3.5 w-3.5" /> Désinscrire
                          </Button>
                        )}
                        {s.status === 'UNSUBSCRIBED' && (
                          <Button size="sm" variant="outline" onClick={() => update(s.id, 'CONFIRMED')} className="h-8 gap-1.5">
                            <Check className="h-3.5 w-3.5" /> Réinscrire
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => remove(s.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">Aucun abonné trouvé.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
