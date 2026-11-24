'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Code2,
  Eye,
  ExternalLink,
  ImageIcon,
  Loader2,
  Megaphone,
  MousePointerClick,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { MediaPicker } from '@/components/dashboard/media-picker'
import { formatDateFr } from '@/lib/shared'

const inputCls =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-brand'

interface Ad {
  id: string
  name: string
  slot: string
  kind: string
  imageUrl: string | null
  linkUrl: string | null
  alt: string | null
  html: string | null
  weight: number
  active: boolean
  startsAt: string | null
  endsAt: string | null
  impressions: number
  clicks: number
}

interface SlotMeta {
  key: string
  label: string
  hint: string
}

interface FormState {
  id?: string
  name: string
  slot: string
  kind: 'IMAGE' | 'HTML'
  imageUrl: string
  linkUrl: string
  alt: string
  html: string
  weight: number
  active: boolean
  startsAt: string
  endsAt: string
}

const EMPTY: FormState = {
  name: '',
  slot: 'HEADER_LEADERBOARD',
  kind: 'IMAGE',
  imageUrl: '',
  linkUrl: '',
  alt: '',
  html: '',
  weight: 5,
  active: true,
  startsAt: '',
  endsAt: '',
}

function toInputValue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Régie publicitaire interne (§7) : emplacements stratégiques, rotation, statistiques */
export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([])
  const [slots, setSlots] = useState<SlotMeta[]>([])
  const [adsEnabled, setAdsEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormState | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [aRes, sRes] = await Promise.all([
      fetch('/api/admin/ads'),
      fetch('/api/admin/settings'),
    ])
    const aData = await aRes.json()
    if (aRes.ok) {
      setAds(aData.ads)
      setSlots(aData.slots)
    } else toast.error(aData.error)
    const sData = await sRes.json()
    if (sRes.ok) setAdsEnabled(sData.settings.ads_enabled !== 'false')
    setLoading(false)
  }, [])

  useEffect(() => {
    const raf = requestAnimationFrame(load)
    return () => cancelAnimationFrame(raf)
  }, [load])

  async function toggleEnabled(v: boolean) {
    setAdsEnabled(v)
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ads_enabled: v ? 'true' : 'false' }),
    })
    if (res.ok) toast.success(v ? 'Publicités activées sur le site.' : 'Publicités désactivées sur le site.')
    else toast.error('Erreur d’enregistrement')
  }

  function openCreate() {
    setForm({ ...EMPTY })
  }

  function openEdit(ad: Ad) {
    setForm({
      id: ad.id,
      name: ad.name,
      slot: ad.slot,
      kind: ad.kind === 'HTML' ? 'HTML' : 'IMAGE',
      imageUrl: ad.imageUrl ?? '',
      linkUrl: ad.linkUrl ?? '',
      alt: ad.alt ?? '',
      html: ad.html ?? '',
      weight: ad.weight,
      active: ad.active,
      startsAt: toInputValue(ad.startsAt),
      endsAt: toInputValue(ad.endsAt),
    })
  }

  async function save() {
    if (!form) return
    if (form.kind === 'IMAGE' && !form.imageUrl.trim()) {
      toast.error('Choisissez une image pour cette annonce.')
      return
    }
    if (form.kind === 'HTML' && !form.html.trim()) {
      toast.error('Collez le code HTML de l’annonce.')
      return
    }
    setSaving(true)
    const payload = {
      name: form.name,
      slot: form.slot,
      kind: form.kind,
      imageUrl: form.imageUrl,
      linkUrl: form.linkUrl,
      alt: form.alt,
      html: form.html,
      weight: form.weight,
      active: form.active,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
    }
    const res = await fetch(form.id ? `/api/admin/ads/${form.id}` : '/api/admin/ads', {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (res.ok) {
      toast.success(form.id ? 'Annonce mise à jour — visible immédiatement.' : 'Annonce créée — visible immédiatement.')
      setForm(null)
      load()
    } else {
      const d = await res.json().catch(() => ({}))
      toast.error(d.error || 'Erreur d’enregistrement')
    }
  }

  async function toggleActive(ad: Ad) {
    const res = await fetch(`/api/admin/ads/${ad.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...ad, active: !ad.active }),
    })
    if (res.ok) load()
    else toast.error('Erreur')
  }

  async function resetStats(ad: Ad) {
    const res = await fetch(`/api/admin/ads/${ad.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetStats: true }),
    })
    if (res.ok) {
      toast.success('Statistiques remises à zéro.')
      load()
    }
  }

  async function remove(ad: Ad) {
    if (!window.confirm(`Supprimer définitivement « ${ad.name} » ?`)) return
    const res = await fetch(`/api/admin/ads/${ad.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Annonce supprimée.')
      load()
    }
  }

  const totalImpressions = ads.reduce((s, a) => s + a.impressions, 0)
  const totalClicks = ads.reduce((s, a) => s + a.clicks, 0)
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1).replace('.', ',') : '0,0'

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Publicités</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Espaces stratégiques sur le site, rotation automatique, planification et statistiques.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2.5 text-sm">
            <Switch checked={adsEnabled} onCheckedChange={toggleEnabled} />
            Publicités activées
          </label>
          <button
            onClick={openCreate}
            className="inline-flex h-9 items-center gap-2 rounded-md px-4 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: 'var(--brand)', color: 'var(--brand-foreground)' }}
          >
            <Plus className="h-4 w-4" /> Nouvelle annonce
          </button>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span className="text-[13px]">Affichages totaux</span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold">{totalImpressions.toLocaleString('fr-FR')}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MousePointerClick className="h-4 w-4" />
            <span className="text-[13px]">Clics</span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold">{totalClicks.toLocaleString('fr-FR')}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Megaphone className="h-4 w-4" />
            <span className="text-[13px]">Taux de clic (CTR)</span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold">{ctr} %</p>
        </div>
      </div>

      {/* Formulaire d'édition */}
      {form && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">{form.id ? 'Modifier l’annonce' : 'Nouvelle annonce'}</h2>
            <button onClick={() => setForm(null)} aria-label="Fermer" className="rounded p-1.5 hover:bg-secondary">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[13px] font-medium">Nom interne *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex. Opérateur télécom — septembre"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-medium">Emplacement sur le site</label>
              <select
                value={form.slot}
                onChange={(e) => setForm({ ...form, slot: e.target.value })}
                className={inputCls}
              >
                {slots.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11.5px] text-muted-foreground">
                {slots.find((s) => s.key === form.slot)?.hint}
              </p>
            </div>
          </div>

          {/* Type d'annonce */}
          <div className="mt-4 flex gap-2">
            {(['IMAGE', 'HTML'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setForm({ ...form, kind: k })}
                className={`inline-flex items-center gap-2 rounded-md border px-3.5 py-2 text-sm font-medium transition-colors ${
                  form.kind === k ? 'border-brand bg-brand/5 text-brand' : 'border-border text-muted-foreground hover:border-foreground/30'
                }`}
              >
                {k === 'IMAGE' ? <ImageIcon className="h-4 w-4" /> : <Code2 className="h-4 w-4" />}
                {k === 'IMAGE' ? 'Image + lien' : 'Code HTML (régie)'}
              </button>
            ))}
          </div>

          {form.kind === 'IMAGE' ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[13px] font-medium">Image de l’annonce *</label>
                <div className="flex gap-2">
                  <input
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://… ou /uploads/…"
                    className={inputCls}
                  />
                  <button
                    onClick={() => setPickerOpen(true)}
                    className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md border border-border px-3 text-[13px] font-medium transition-colors hover:border-brand hover:text-brand"
                  >
                    <ImageIcon className="h-4 w-4" /> Médiathèque
                  </button>
                </div>
                {form.imageUrl && (
                  <img
                    src={form.imageUrl}
                    alt=""
                    className="mt-2 max-h-24 rounded-md border border-border object-cover"
                  />
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-[13px] font-medium">Lien de destination</label>
                  <input
                    value={form.linkUrl}
                    onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                    placeholder="https://annonceur.com"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-medium">Texte alternatif (accessibilité)</label>
                  <input
                    value={form.alt}
                    onChange={(e) => setForm({ ...form, alt: e.target.value })}
                    placeholder="Description de l’annonce"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <label className="mb-1 block text-[13px] font-medium">Code HTML de l’annonce *</label>
              <textarea
                value={form.html}
                onChange={(e) => setForm({ ...form, html: e.target.value })}
                rows={5}
                placeholder="Collez ici le code fourni par la régie (iframe, script…)"
                className={`${inputCls} resize-y font-mono text-[12px]`}
              />
            </div>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-[13px] font-medium">Poids de rotation</label>
              <select
                value={String(form.weight)}
                onChange={(e) => setForm({ ...form, weight: parseInt(e.target.value, 10) })}
                className={inputCls}
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>
                    {w} {w === 10 ? '(prioritaire)' : w === 1 ? '(discret)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-medium">Début (facultatif)</label>
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-medium">Fin (facultatif)</label>
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                className={inputCls}
              />
            </div>
            <div className="flex items-end gap-2 pb-1">
              <label className="flex items-center gap-2.5 text-sm">
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                Annonce active
              </label>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setForm(null)}
              className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm"
            >
              Annuler
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex h-9 items-center gap-2 rounded-md px-4 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: 'var(--brand)', color: 'var(--brand-foreground)' }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {/* Annonces groupées par emplacement */}
      {slots.map((slot) => {
        const list = ads.filter((a) => a.slot === slot.key)
        return (
          <div key={slot.key} className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
              <div>
                <h2 className="text-[15px] font-semibold">{slot.label}</h2>
                <p className="mt-0.5 text-[12px] text-muted-foreground">{slot.hint}</p>
              </div>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-[11.5px] text-muted-foreground">
                {list.length} annonce{list.length > 1 ? 's' : ''}
              </span>
            </div>
            {list.length === 0 ? (
              <p className="px-5 py-4 text-[13px] text-muted-foreground">
                Aucune annonce — l’emplacement reste invisible sur le site.
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {list.map((ad) => {
                  const adCtr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1).replace('.', ',') : '0,0'
                  return (
                    <li key={ad.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
                      {ad.kind === 'IMAGE' && ad.imageUrl ? (
                        <img
                          src={ad.imageUrl}
                          alt=""
                          className="h-11 w-20 shrink-0 rounded-md border border-border object-cover"
                        />
                      ) : (
                        <span className="flex h-11 w-20 shrink-0 items-center justify-center rounded-md border border-border bg-secondary">
                          <Code2 className="h-4 w-4 text-muted-foreground" />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-medium">{ad.name}</p>
                        <p className="mt-0.5 text-[12px] text-muted-foreground">
                          {ad.kind === 'HTML' ? 'Code régie' : 'Image'}
                          {ad.linkUrl ? ' · lien cliquable' : ''}
                          {' · '}poids {ad.weight}
                          {ad.startsAt ? ` · du ${formatDateFr(ad.startsAt)}` : ''}
                          {ad.endsAt ? ` au ${formatDateFr(ad.endsAt)}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-[12.5px] tabular-nums text-muted-foreground">
                        <span title="Affichages" className="inline-flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" /> {ad.impressions.toLocaleString('fr-FR')}
                        </span>
                        <span title="Clics" className="inline-flex items-center gap-1">
                          <MousePointerClick className="h-3.5 w-3.5" /> {ad.clicks.toLocaleString('fr-FR')}
                        </span>
                        <span className="rounded bg-secondary px-1.5 py-0.5">{adCtr} %</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {ad.linkUrl && (
                          <a
                            href={ad.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Voir la cible"
                            className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => resetStats(ad)}
                          aria-label="Remettre les statistiques à zéro"
                          title="Remettre les statistiques à zéro"
                          className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEdit(ad)}
                          aria-label="Modifier"
                          className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => remove(ad)}
                          aria-label="Supprimer"
                          className="rounded p-1.5 text-muted-foreground hover:bg-brand/10 hover:text-brand"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <Switch checked={ad.active} onCheckedChange={() => toggleActive(ad)} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )
      })}

      <MediaPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(m) => setForm((f) => (f ? { ...f, imageUrl: m.url } : f))}
        imageOnly
      />
    </div>
  )
}
