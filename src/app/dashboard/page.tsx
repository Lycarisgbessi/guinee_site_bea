'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  ArrowRight, Clock3, Eye, FileEdit, FilePlus2, FileText, FolderTree,
  Inbox, Mail, MessageSquare,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { formatDateShortFr } from '@/lib/shared'

interface Stats {
  counters: {
    published: number; drafts: number; scheduled: number; review: number; trash: number
    totalViews: number; pendingComments: number; unreadMessages: number
    pendingSubscribers: number; confirmedSubscribers: number
  }
  dailyViews: { date: string; views: number }[]
  topArticles: { id: string; title: string; slug: string; views: number; publishedAt: string }[]
  viewsByCategory: { name: string; color: string; value: number }[]
}

function StatCard({ label, value, icon: Icon, hint }: { label: string; value: number | string; icon: React.ElementType; hint?: string }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-center gap-4 p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[color:var(--brand)]/10 text-[color:var(--brand)]">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="mt-1 truncate text-[12px] text-muted-foreground">{label}</p>
          {hint && <p className="text-[11px] text-muted-foreground/70">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

/** Vue d’ensemble du dashboard (§6.2) */
export default function DashboardHome() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => (d.error ? Promise.reject(d.error) : setStats(d)))
      .catch(() => toast.error('Impossible de charger les statistiques'))
  }, [])

  if (!stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-secondary" />
        ))}
      </div>
    )
  }

  const c = stats.counters
  const chartData = stats.dailyViews.map((d) => ({
    date: new Date(d.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    vues: d.views,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Vue d’ensemble</h1>
          <p className="mt-1 text-sm text-muted-foreground">Bonjour ! Voici l’état de votre média aujourd’hui.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/articles/nouveau"
            className="inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: 'var(--brand)', color: 'var(--brand-foreground)' }}
          >
            <FilePlus2 className="h-4 w-4" /> Nouvel article
          </Link>
          <Link href="/dashboard/rubriques" className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium hover:border-foreground/40">
            <FolderTree className="h-4 w-4" /> Nouvelle rubrique
          </Link>
        </div>
      </div>

      {/* Statistiques clés (§6.2) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Articles publiés" value={c.published} icon={FileText} />
        <StatCard label="Brouillons en attente" value={c.drafts} icon={FileEdit} hint={c.review ? `${c.review} en relecture` : undefined} />
        <StatCard label="Vues totales" value={c.totalViews.toLocaleString('fr-FR')} icon={Eye} />
        <StatCard label="Abonnés newsletter" value={c.confirmedSubscribers} icon={Mail} hint={`${c.pendingSubscribers} en attente`} />
      </div>

      {/* Alertes modération */}
      {(c.pendingComments > 0 || c.unreadMessages > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {c.pendingComments > 0 && (
            <Link href="/dashboard/commentaires" className="group flex items-center justify-between rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 transition-colors hover:bg-amber-500/10">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-medium">{c.pendingComments} commentaire{c.pendingComments > 1 ? 's' : ''} à modérer</span>
              </div>
              <ArrowRight className="h-4 w-4 text-amber-600 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
          {c.unreadMessages > 0 && (
            <Link href="/dashboard/messages" className="group flex items-center justify-between rounded-lg border border-[color:var(--brand)]/40 bg-[color:var(--brand)]/5 p-4 transition-colors hover:bg-[color:var(--brand)]/10">
              <div className="flex items-center gap-3">
                <Inbox className="h-5 w-5 text-[color:var(--brand)]" />
                <span className="text-sm font-medium">{c.unreadMessages} message{c.unreadMessages > 1 ? 's' : ''} non lu{c.unreadMessages > 1 ? 's' : ''}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-[color:var(--brand)] transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Vues des 14 derniers jours */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg">Audience — 14 derniers jours</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] p-4 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="var(--brand)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="vues" stroke="var(--brand)" strokeWidth={2.2} fill="url(#viewsGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Articles les plus lus */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg">Articles les plus lus</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <ul className="space-y-3">
              {stats.topArticles.map((a, i) => (
                <li key={a.id} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-bold">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/article/${a.slug}`} className="line-clamp-2 text-[13.5px] font-medium leading-snug hover:text-[color:var(--brand)]">
                      {a.title}
                    </Link>
                    <p className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Eye className="h-3 w-3" /> {a.views.toLocaleString('fr-FR')} vues
                      {a.publishedAt && <>· {formatDateShortFr(a.publishedAt)}</>}
                    </p>
                  </div>
                </li>
              ))}
              {stats.topArticles.length === 0 && <p className="text-sm text-muted-foreground">Aucun article publié.</p>}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Répartition par rubrique */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg">Vues par rubrique</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px] p-4 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.viewsByCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3} strokeWidth={0}>
                  {stats.viewsByCategory.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [value.toLocaleString('fr-FR') + ' vues', 'Vues']}
                  contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg">Vues du top 5 — comparaison</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px] p-4 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topArticles.map((a) => ({ name: a.title.slice(0, 18) + '…', vues: a.views }))} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} interval={0} />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="vues" fill="var(--brand)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> {c.scheduled} article{c.scheduled > 1 ? 's' : ''} programmé{c.scheduled > 1 ? 's' : ''}</span>
        <span>·</span>
        <span>{c.trash} article{c.trash > 1 ? 's' : ''} dans la corbeille</span>
      </div>
    </div>
  )
}
