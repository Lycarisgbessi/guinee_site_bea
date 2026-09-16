'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, History, ImagePlus, Loader2, Save, Send, X } from 'lucide-react'
import { toast } from 'sonner'
import { RichEditor } from '@/components/dashboard/rich-editor'
import { MediaPicker } from '@/components/dashboard/media-picker'
import { Switch } from '@/components/ui/switch'
import { FORMAT_LABELS, STATUS_LABELS, formatDateShortFr } from '@/lib/shared'

interface CategoryItem { id: string; name: string; color: string | null; visible: boolean }
interface TagItem { id: string; name: string; slug: string }

export interface ArticleData {
  id?: string
  title: string
  slug?: string
  subtitle?: string | null
  chapo?: string | null
  contentJson?: object
  format: string
  status: string
  scheduledAt?: string | null
  publishedAt?: string | null
  coverImage?: string | null
  coverCredit?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  featured?: boolean
  commentsEnabled?: boolean
  categoryIds?: string[]
  tagIds?: string[]
  versions?: { id: string; title: string; createdAt: string; editor?: { name?: string } | null }[]
}

const inputCls =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-brand'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="eyebrow mb-3 text-muted-foreground">{title}</h2>
      {children}
    </section>
  )
}

/** Formulaire complet de création/édition d’article (§6.4) */
export function ArticleEditorForm({ initial, isNew }: { initial: ArticleData; isNew: boolean }) {
  const router = useRouter()
  const [form, setForm] = useState<ArticleData>(initial)
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [tags, setTags] = useState<TagItem[]>([])
  const [saving, setSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [slugEdited, setSlugEdited] = useState(false)

  useEffect(() => {
    fetch('/api/admin/categories').then((r) => r.json()).then((d) => d.categories && setCategories(d.categories.filter((c: CategoryItem & { visible?: boolean }) => c.visible ?? true)))
    fetch('/api/admin/categories').then((r) => r.json()).then(() => {})
    // Tags via liste catégories? Non — endpoint dédié ci-dessous
    fetch('/api/admin/tags')
      .then((r) => (r.ok ? r.json() : { tags: [] }))
      .then((d) => d.tags && setTags(d.tags))
      .catch(() => {})
  }, [])

  function set<K extends keyof ArticleData>(key: K, value: ArticleData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function save(overrides: Partial<ArticleData> = {}, silent = false) {
    setSaving(true)
    try {
      const payload = { ...form, ...overrides }
      const res = await fetch(isNew ? '/api/admin/articles' : `/api/admin/articles/${initial.id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      const article = data.article
      if (!silent) toast.success(isNew ? 'Article créé.' : 'Article enregistré.')
      if (isNew) {
        router.push(`/dashboard/articles/${article.id}`)
      }
      return article
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur d’enregistrement')
      return null
    } finally {
      setSaving(false)
    }
  }

  async function publishNow() {
    const article = await save({ status: 'PUBLISHED', publishedAt: new Date().toISOString() })
    if (article) {
      toast.success('Article publié ! Il est visible sur le site en quelques secondes.')
      set('status', 'PUBLISHED')
    }
  }

  async function schedule() {
    if (!form.scheduledAt) {
      toast.error('Choisissez une date et une heure de publication.')
      return
    }
    const article = await save({ status: 'SCHEDULED', scheduledAt: form.scheduledAt })
    if (article) {
      toast.success('Publication programmée.')
      set('status', 'SCHEDULED')
    }
  }

  const slugPreview = (form.slug || form.title || 'mon-article')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">{isNew ? 'Nouvel article' : 'Modifier l’article'}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isNew ? 'Composez votre contenu en blocs — texte, images, citations, vidéos.' : 'Vos modifications sont historisées à chaque enregistrement.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isNew && form.status === 'PUBLISHED' && form.slug && (
            <Link
              href={`/article/${form.slug}`}
              target="_blank"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium hover:border-foreground/40"
            >
              <Eye className="h-4 w-4" /> Voir en ligne
            </Link>
          )}
          <button
            onClick={() => save()}
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-semibold transition-colors hover:border-foreground/40 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </button>
          <button
            onClick={publishNow}
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: 'var(--brand)', color: 'var(--brand-foreground)' }}
          >
            <Send className="h-4 w-4" /> Publier
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Colonne principale */}
        <div className="space-y-4">
          <input
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Titre de l’article *"
            className="w-full rounded-md border border-input bg-background px-4 py-3 font-display text-2xl font-bold outline-none focus:border-brand"
          />
          <input
            value={form.subtitle ?? ''}
            onChange={(e) => set('subtitle', e.target.value)}
            placeholder="Sous-titre (facultatif)"
            className={inputCls}
          />
          <textarea
            value={form.chapo ?? ''}
            onChange={(e) => set('chapo', e.target.value)}
            rows={2}
            placeholder="Chapô — le paragraphe d’accroche qui résume l’article (facultatif, mais recommandé)"
            className={`${inputCls} resize-y leading-relaxed`}
          />

          <RichEditor value={form.contentJson ?? null} onChange={(json) => set('contentJson', json)} />

          {/* SEO (§6.4) */}
          <Section title="SEO de l’article">
            <div className="space-y-3">
              <input
                value={form.seoTitle ?? ''}
                onChange={(e) => set('seoTitle', e.target.value)}
                placeholder="Meta-titre (vide = titre de l’article)"
                className={inputCls}
              />
              <textarea
                value={form.seoDescription ?? ''}
                onChange={(e) => set('seoDescription', e.target.value)}
                rows={2}
                placeholder="Meta-description (155 caractères recommandés)"
                className={`${inputCls} resize-y`}
              />
              {!isNew && (
                <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <span className="shrink-0">Slug :</span>
                  <code className="flex-1 truncate rounded bg-secondary px-2 py-1 text-[12px]">/article/{slugPreview}</code>
                  {!slugEdited && (
                    <button
                      type="button"
                      onClick={() => {
                        const slug = window.prompt('Nouveau slug (une redirection 301 sera créée automatiquement) :', slugPreview)
                        if (slug) {
                          set('slug', slug)
                          setSlugEdited(true)
                        }
                      }}
                      className="shrink-0 text-[color:var(--brand)] underline underline-offset-2"
                    >
                      Modifier
                    </button>
                  )}
                </div>
              )}
            </div>
          </Section>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-4">
          <Section title="Publication">
            <div className="space-y-3">
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className={inputCls}
                aria-label="Statut de publication"
              >
                {['DRAFT', 'REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'].map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
              {form.status === 'SCHEDULED' && (
                <div>
                  <label className="mb-1 block text-[12px] text-muted-foreground">Date & heure de publication</label>
                  <input
                    type="datetime-local"
                    value={form.scheduledAt ? form.scheduledAt.slice(0, 16) : ''}
                    onChange={(e) => set('scheduledAt', e.target.value ? new Date(e.target.value).toISOString() : null)}
                    className={inputCls}
                  />
                  <button
                    onClick={schedule}
                    className="mt-2 inline-flex h-9 w-full items-center justify-center rounded-md border border-[color:var(--brand)]/50 text-sm font-semibold text-[color:var(--brand)] transition-colors hover:bg-[color:var(--brand)]/10"
                  >
                    <History className="mr-1.5 h-4 w-4" /> Programmer
                  </button>
                </div>
              )}
              <label className="flex items-center justify-between gap-3 pt-1">
                <span className="text-[13px] font-medium">À la une (accueil)</span>
                <Switch checked={form.featured ?? false} onCheckedChange={(v) => set('featured', v)} />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span className="text-[13px] font-medium">Commentaires activés</span>
                <Switch checked={form.commentsEnabled ?? true} onCheckedChange={(v) => set('commentsEnabled', v)} />
              </label>
            </div>
          </Section>

          <Section title="Format">
            <select value={form.format} onChange={(e) => set('format', e.target.value)} className={inputCls} aria-label="Format">
              {Object.entries(FORMAT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </Section>

          <Section title="Image de une">
            {form.coverImage ? (
              <div className="space-y-2">
                { }
                <img src={form.coverImage} alt="" className="w-full rounded-md object-cover" style={{ aspectRatio: '16/9' }} />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="flex-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:border-foreground/40"
                  >
                    Changer
                  </button>
                  <button
                    type="button"
                    onClick={() => set('coverImage', '')}
                    className="rounded-md border border-border px-2.5 py-1.5 text-xs text-destructive hover:border-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <input
                  value={form.coverCredit ?? ''}
                  onChange={(e) => set('coverCredit', e.target.value)}
                  placeholder="Crédit photo de la une"
                  className={inputCls}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border text-muted-foreground transition-colors hover:border-brand hover:text-brand"
              >
                <ImagePlus className="h-5 w-5" />
                <span className="text-xs">Choisir depuis la médiathèque</span>
              </button>
            )}
          </Section>

          <Section title="Rubriques">
            <div className="nice-scroll max-h-40 space-y-1.5 overflow-y-auto pr-1">
              {categories.map((c) => (
                <label key={c.id} className="flex cursor-pointer items-center gap-2.5 text-[13px]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[color:var(--brand)]"
                    checked={form.categoryIds?.includes(c.id) ?? false}
                    onChange={(e) => {
                      const ids = form.categoryIds ?? []
                      set('categoryIds', e.target.checked ? [...ids, c.id] : ids.filter((i) => i !== c.id))
                    }}
                  />
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: c.color || '#888' }} />
                  {c.name}
                </label>
              ))}
              {categories.length === 0 && <p className="text-xs text-muted-foreground">Aucune rubrique. Créez-en une d’abord.</p>}
            </div>
          </Section>

          <Section title="Tags">
            <div className="nice-scroll flex max-h-36 flex-wrap gap-1.5 overflow-y-auto">
              {tags.map((t) => {
                const active = form.tagIds?.includes(t.id) ?? false
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      const ids = form.tagIds ?? []
                      set('tagIds', active ? ids.filter((i) => i !== t.id) : [...ids, t.id])
                    }}
                    className={`rounded-full border px-2.5 py-1 text-[12px] transition-colors ${
                      active ? 'border-brand bg-[color:var(--brand)]/10 text-[color:var(--brand)]' : 'border-border text-foreground/70 hover:border-foreground/40'
                    }`}
                  >
                    #{t.name}
                  </button>
                )
              })}
              {tags.length === 0 && <p className="text-xs text-muted-foreground">Aucun tag disponible.</p>}
            </div>
          </Section>

          {!isNew && form.versions && form.versions.length > 0 && (
            <Section title="Historique des versions">
              <ul className="nice-scroll max-h-44 space-y-2 overflow-y-auto pr-1 text-[12.5px]">
                {form.versions.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5 last:border-0">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{v.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDateShortFr(v.createdAt)} {v.editor?.name ? `· ${v.editor.name}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 text-[color:var(--brand)] hover:underline"
                      onClick={async () => {
                        const res = await fetch(`/api/admin/articles/${initial.id}`)
                        const data = await res.json()
                        const version = data.article?.versions?.find((x: { id: string }) => x.id === v.id)
                        if (version && window.confirm('Restaurer cette version ? Le contenu actuel sera remplacé.')) {
                          setForm((f) => ({ ...f, contentJson: JSON.parse(version.contentJson), title: version.title }))
                          toast.success('Version restaurée dans l’éditeur — pensez à enregistrer.')
                        }
                      }}
                    >
                      Restaurer
                    </button>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </div>

      <MediaPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(m) => {
          set('coverImage', m.url)
          if (m.credit) set('coverCredit', m.credit)
        }}
      />
    </div>
  )
}
