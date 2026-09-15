'use client'

import { useCallback, useEffect, useState } from 'react'
import { Activity, Loader2, Palette, Plus, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { formatDateFr } from '@/lib/shared'

const inputCls = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-brand'

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="mb-1 block text-[13px] font-medium">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11.5px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

interface RedirectRow { id: string; fromPath: string; toPath: string; statusCode: number }
interface LogRow { id: string; action: string; target: string | null; detail: string | null; createdAt: string; user?: { name?: string } | null }

/** Paramètres généraux du site (§6.9) + profil + journal d’activité (§11) */
export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [redirects, setRedirects] = useState<RedirectRow[]>([])
  const [newRedirect, setNewRedirect] = useState({ fromPath: '', toPath: '' })
  const [logs, setLogs] = useState<LogRow[]>([])
  const [profile, setProfile] = useState<{ name?: string; bio?: string; currentPassword?: string; newPassword?: string }>({})
  const [savingProfile, setSavingProfile] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [sRes, rRes, lRes] = await Promise.all([
      fetch('/api/admin/settings'),
      fetch('/api/admin/redirects'),
      fetch('/api/admin/me/logs'),
    ])
    const sData = await sRes.json()
    if (sRes.ok) setSettings(sData.settings)
    const rData = await rRes.json()
    if (rRes.ok) setRedirects(rData.items)
    const lData = await lRes.json()
    if (lRes.ok) setLogs(lData.items)
    setLoading(false)
  }, [])

  useEffect(() => {
    const raf = requestAnimationFrame(load)
    return () => cancelAnimationFrame(raf)
  }, [load])

  function set(key: string, value: string) {
    setSettings((s) => ({ ...s, [key]: value }))
  }

  async function save(keys: string[]) {
    setSaving(true)
    const payload: Record<string, string> = {}
    keys.forEach((k) => (payload[k] = settings[k] ?? ''))
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (res.ok) toast.success('Paramètres enregistrés — le site se met à jour instantanément.')
    else toast.error('Erreur d’enregistrement')
  }

  async function addRedirect() {
    const res = await fetch('/api/admin/redirects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRedirect),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success('Redirection créée.')
      setNewRedirect({ fromPath: '', toPath: '' })
      load()
    } else toast.error(data.error)
  }

  async function removeRedirect(id: string) {
    const res = await fetch(`/api/admin/redirects?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Redirection supprimée.')
      load()
    }
  }

  async function saveProfile() {
    setSavingProfile(true)
    const res = await fetch('/api/admin/me/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
    const data = await res.json()
    setSavingProfile(false)
    if (res.ok) {
      toast.success('Profil mis à jour.')
      setProfile({ name: profile.name, bio: profile.bio })
    } else toast.error(data.error)
  }

  if (loading) {
    return <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  function saveBtn(keys: string[]) {
    return (
      <button
        onClick={() => save(keys)}
        disabled={saving}
        className="inline-flex h-9 items-center gap-2 rounded-md px-4 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: 'var(--brand)', color: 'var(--brand-foreground)' }}
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Enregistrer
      </button>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold">Paramètres</h1>
        <p className="mt-1 text-sm text-muted-foreground">Identité du site, SEO, apparence, maintenance et journal d’activité.</p>
      </div>

      <Tabs defaultValue="identite">
        <TabsList className="flex-wrap">
          <TabsTrigger value="identite">Identité</TabsTrigger>
          <TabsTrigger value="accueil">Accueil &amp; bandeaux</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="apparence">Apparence</TabsTrigger>
          <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
          <TabsTrigger value="redirections">Redirections</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="profil">Profil</TabsTrigger>
          <TabsTrigger value="journal">Journal</TabsTrigger>
        </TabsList>

        {/* Identité */}
        <TabsContent value="identite" className="mt-4 space-y-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom du site">
                <input value={settings.site_name ?? ''} onChange={(e) => set('site_name', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Slogan">
                <input value={settings.site_slogan ?? ''} onChange={(e) => set('site_slogan', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Logo (URL)" hint="Laissez vide pour un monogramme dérivé du nom du site. Importez une image dans la Médiathèque puis collez son URL.">
                <input value={settings.site_logo ?? ''} onChange={(e) => set('site_logo', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Email de la rédaction">
                <input value={settings.contact_email ?? ''} onChange={(e) => set('contact_email', e.target.value)} className={inputCls} />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Texte du pied de page">
                <textarea value={settings.footer_text ?? ''} onChange={(e) => set('footer_text', e.target.value)} rows={2} className={`${inputCls} resize-y`} />
              </Field>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Texte de la colonne Newsletter (footer)" hint="Affiché au-dessus du formulaire dans le pied de page.">
                <input value={settings.footer_newsletter_text ?? ''} onChange={(e) => set('footer_newsletter_text', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Mention de copyright" hint="Affichée après © année — nom du site.">
                <input value={settings.footer_copyright ?? ''} onChange={(e) => set('footer_copyright', e.target.value)} className={inputCls} />
              </Field>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="X / Twitter">
                <input value={settings.social_twitter ?? ''} onChange={(e) => set('social_twitter', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Instagram">
                <input value={settings.social_instagram ?? ''} onChange={(e) => set('social_instagram', e.target.value)} className={inputCls} />
              </Field>
              <Field label="LinkedIn">
                <input value={settings.social_linkedin ?? ''} onChange={(e) => set('social_linkedin', e.target.value)} className={inputCls} />
              </Field>
              <Field label="YouTube">
                <input value={settings.social_youtube ?? ''} onChange={(e) => set('social_youtube', e.target.value)} className={inputCls} />
              </Field>
            </div>
            <div className="mt-4">{saveBtn(['site_name', 'site_slogan', 'site_logo', 'contact_email', 'footer_text', 'footer_newsletter_text', 'footer_copyright', 'social_twitter', 'social_instagram', 'social_linkedin', 'social_youtube'])}</div>
          </div>
        </TabsContent>

        {/* Accueil & bandeaux */}
        <TabsContent value="accueil" className="mt-4 space-y-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm font-semibold">Bandeau « Le fil » (défilement des titres, sous le header de l’accueil)</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-[auto_1fr]">
              <label className="flex items-center gap-2.5 text-sm">
                <Switch checked={settings.ticker_enabled === 'true'} onCheckedChange={(v) => set('ticker_enabled', v ? 'true' : 'false')} />
                Activer le bandeau
              </label>
              <Field label="Libellé du bandeau">
                <input value={settings.ticker_label ?? ''} onChange={(e) => set('ticker_label', e.target.value)} className={inputCls} placeholder="Le fil" />
              </Field>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm font-semibold">Bandeau de confiance (fond coloré avant le pied de page)</p>
            <div className="mt-3 space-y-4">
              <label className="flex items-center gap-2.5 text-sm">
                <Switch checked={settings.trust_enabled === 'true'} onCheckedChange={(v) => set('trust_enabled', v ? 'true' : 'false')} />
                Activer le bandeau
              </label>
              <Field label="Titre du bandeau">
                <input value={settings.trust_title ?? ''} onChange={(e) => set('trust_title', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Sous-titre" hint="Les 4 compteurs (articles, rubriques, lectures, abonnés) sont calculés automatiquement.">
                <textarea value={settings.trust_subtitle ?? ''} onChange={(e) => set('trust_subtitle', e.target.value)} rows={2} className={`${inputCls} resize-y`} />
              </Field>
            </div>
          </div>
          <div className="mt-4">{saveBtn(['ticker_enabled', 'ticker_label', 'trust_enabled', 'trust_title', 'trust_subtitle'])}</div>
        </TabsContent>

        {/* Contact */}
        <TabsContent value="contact" className="mt-4 space-y-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Titre de la page" hint="Affiché aussi dans le menu et l’onglet du navigateur.">
                <input value={settings.contact_title ?? ''} onChange={(e) => set('contact_title', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Indication de délai de réponse">
                <input value={settings.contact_delay ?? ''} onChange={(e) => set('contact_delay', e.target.value)} className={inputCls} />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Introduction de la page Contact">
                <textarea value={settings.contact_intro ?? ''} onChange={(e) => set('contact_intro', e.target.value)} rows={2} className={`${inputCls} resize-y`} />
              </Field>
            </div>
            <label className="mt-4 flex items-center gap-2.5 text-sm">
              <Switch checked={settings.tips_enabled === 'true'} onCheckedChange={(v) => set('tips_enabled', v ? 'true' : 'false')} />
              Activer le formulaire « Proposer un sujet / une info »
            </label>
            <div className="mt-4 grid gap-4">
              <Field label="Titre de l’encart « Proposer un sujet »">
                <input value={settings.contact_tips_title ?? ''} onChange={(e) => set('contact_tips_title', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Texte de l’encart">
                <textarea value={settings.contact_tips_text ?? ''} onChange={(e) => set('contact_tips_text', e.target.value)} rows={3} className={`${inputCls} resize-y`} />
              </Field>
            </div>
            <div className="mt-4">{saveBtn(['contact_title', 'contact_delay', 'contact_intro', 'tips_enabled', 'contact_tips_title', 'contact_tips_text'])}</div>
          </div>
        </TabsContent>

        {/* SEO */}
        <TabsContent value="seo" className="mt-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="space-y-4">
              <Field label="Titre SEO par défaut">
                <input value={settings.seo_default_title ?? ''} onChange={(e) => set('seo_default_title', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Meta-description par défaut" hint="155 caractères recommandés">
                <textarea value={settings.seo_default_description ?? ''} onChange={(e) => set('seo_default_description', e.target.value)} rows={3} className={`${inputCls} resize-y`} />
              </Field>
              <Field label="Image Open Graph par défaut (URL)">
                <input value={settings.seo_og_image ?? ''} onChange={(e) => set('seo_og_image', e.target.value)} className={inputCls} />
              </Field>
              <Field
                label="Scripts personnalisés (head)"
                hint="Analytics (Plausible…), balises de vérification. Insérés dans le <head> du site public."
              >
                <textarea value={settings.custom_head_scripts ?? ''} onChange={(e) => set('custom_head_scripts', e.target.value)} rows={4} className={`${inputCls} resize-y font-mono text-[12px]`} />
              </Field>
            </div>
            <div className="mt-4">{saveBtn(['seo_default_title', 'seo_default_description', 'seo_og_image', 'custom_head_scripts'])}</div>
          </div>
        </TabsContent>

        {/* Apparence */}
        <TabsContent value="apparence" className="mt-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <Field label="Couleur d’accent du site" hint="Appliquée instantanément aux boutons, liens, badges et éléments d’accent.">
              <div className="flex flex-wrap items-center gap-2.5">
                {['#A03123', '#1F5F4A', '#2C4A7C', '#8A5A0F', '#5B3A7E', '#7A2048', '#33556B', '#B3541E'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Couleur ${color}`}
                    onClick={() => set('accent_color', color)}
                    className={`h-10 w-10 rounded-lg transition-transform hover:scale-110 ${settings.accent_color === color ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card' : ''}`}
                    style={{ background: color }}
                  />
                ))}
                <input
                  value={settings.accent_color ?? ''}
                  onChange={(e) => set('accent_color', e.target.value)}
                  className={`${inputCls} w-32 font-mono`}
                />
              </div>
            </Field>
            <div className="mt-4">{saveBtn(['accent_color'])}</div>
          </div>
        </TabsContent>

        {/* Newsletter */}
        <TabsContent value="newsletter" className="mt-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <Field label="Texte d’introduction de la newsletter" hint="Affiché sur la page d’accueil et la page newsletter.">
              <textarea value={settings.newsletter_intro ?? ''} onChange={(e) => set('newsletter_intro', e.target.value)} rows={3} className={`${inputCls} resize-y`} />
            </Field>
            <div className="mt-4">{saveBtn(['newsletter_intro'])}</div>
          </div>
        </TabsContent>

        {/* Redirections */}
        <TabsContent value="redirections" className="mt-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <input value={newRedirect.fromPath} onChange={(e) => setNewRedirect({ ...newRedirect, fromPath: e.target.value })} className={inputCls} placeholder="/ancienne-url" />
              <input value={newRedirect.toPath} onChange={(e) => setNewRedirect({ ...newRedirect, toPath: e.target.value })} className={inputCls} placeholder="/nouvelle-url" />
              <button onClick={addRedirect} className="inline-flex h-10 items-center gap-1.5 rounded-md px-4 text-sm font-semibold" style={{ background: 'var(--brand)', color: 'var(--brand-foreground)' }}>
                <Plus className="h-4 w-4" /> Ajouter
              </button>
            </div>
            <p className="mt-1.5 text-[11.5px] text-muted-foreground">
              Redirections 301 permanentes — créées aussi automatiquement lors d’un changement de slug d’article.
            </p>
            <ul className="mt-4 space-y-2">
              {redirects.map((r) => (
                <li key={r.id} className="flex items-center gap-3 rounded-md bg-secondary/50 px-3 py-2 text-sm">
                  <span className="rounded bg-[color:var(--brand)]/10 px-1.5 py-0.5 text-[11px] font-bold text-[color:var(--brand)]">{r.statusCode}</span>
                  <code className="truncate">{r.fromPath}</code>
                  <span className="text-muted-foreground">→</span>
                  <code className="truncate">{r.toPath}</code>
                  <button onClick={() => removeRedirect(r.id)} className="ml-auto text-destructive hover:opacity-70" aria-label="Supprimer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
              {redirects.length === 0 && <p className="text-sm text-muted-foreground">Aucune redirection.</p>}
            </ul>
          </div>
        </TabsContent>

        {/* Maintenance */}
        <TabsContent value="maintenance" className="mt-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <label className="flex items-center justify-between gap-4 rounded-md bg-amber-500/10 p-4">
              <div>
                <p className="text-sm font-semibold">Mode maintenance</p>
                <p className="text-[12.5px] text-muted-foreground">Affiche un écran d’attente élégant sur tout le site public.</p>
              </div>
              <Switch checked={settings.maintenance_mode === 'true'} onCheckedChange={(v) => set('maintenance_mode', v ? 'true' : 'false')} />
            </label>
            <div className="mt-4">
              <Field label="Message affiché">
                <textarea value={settings.maintenance_message ?? ''} onChange={(e) => set('maintenance_message', e.target.value)} rows={2} className={`${inputCls} resize-y`} />
              </Field>
            </div>
            <div className="mt-4">{saveBtn(['maintenance_mode', 'maintenance_message'])}</div>
          </div>
        </TabsContent>

        {/* Profil */}
        <TabsContent value="profil" className="mt-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom affiché">
                <input value={profile.name ?? ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className={inputCls} placeholder={settings.site_name} />
              </Field>
              <Field label="Bio courte">
                <input value={profile.bio ?? ''} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Mot de passe actuel (pour changer de mot de passe)">
                <input type="password" value={profile.currentPassword ?? ''} onChange={(e) => setProfile({ ...profile, currentPassword: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Nouveau mot de passe (8 caractères min.)">
                <input type="password" value={profile.newPassword ?? ''} onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })} className={inputCls} />
              </Field>
            </div>
            <div className="mt-4">
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="inline-flex h-9 items-center gap-2 rounded-md px-4 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: 'var(--brand)', color: 'var(--brand-foreground)' }}
              >
                {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Mettre à jour le profil
              </button>
            </div>
          </div>
        </TabsContent>

        {/* Journal d’activité */}
        <TabsContent value="journal" className="mt-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="flex items-center gap-2 text-sm font-semibold"><Activity className="h-4 w-4 text-brand" /> Journal d’activité (audit log)</p>
            <ul className="nice-scroll mt-3 max-h-96 space-y-2 overflow-y-auto pr-2">
              {logs.map((l) => (
                <li key={l.id} className="flex items-baseline gap-2.5 border-b border-border/40 pb-2 text-[13px] last:border-0">
                  <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 font-mono text-[11px]">{l.action}</span>
                  <span className="min-w-0 flex-1 truncate text-foreground/85">{l.detail || l.target || '—'}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{formatDateFr(l.createdAt, true)}</span>
                </li>
              ))}
              {logs.length === 0 && <p className="text-sm text-muted-foreground">Aucune activité enregistrée.</p>}
            </ul>
          </div>
        </TabsContent>
      </Tabs>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Palette className="h-3.5 w-3.5" /> Tous ces réglages sont stockés en base et appliqués au site public sans redéploiement.
      </p>
    </div>
  )
}
