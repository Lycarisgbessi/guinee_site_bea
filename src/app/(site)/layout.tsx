import { SiteHeader } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import { getSettings } from '@/lib/settings'
import { getPublishedArticles, getVisibleCategories } from '@/lib/public-queries'
import { BackToTop } from '@/components/site/back-to-top'
import { MaintenanceScreen } from '@/components/site/maintenance-screen'
import { ScrollProgress } from '@/components/site/scroll-progress'

export const dynamic = 'force-dynamic'

const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings()

  // Mode maintenance (§6.9) : écran d'attente sauf pour le dashboard
  if (settings.maintenance_mode === 'true') {
    return <MaintenanceScreen siteName={settings.site_name} message={settings.maintenance_message} />
  }

  const cats = await getVisibleCategories()

  // Méga-menu : description + 3 derniers articles par rubrique
  const categories = await Promise.all(
    cats.map(async (c) => {
      const { items } = await getPublishedArticles({ categorySlug: c.slug, perPage: 3 })
      return {
        name: c.name,
        slug: c.slug,
        color: c.color,
        description: c.description,
        count: c._count.articles,
        latest: items.map((a) => ({ title: a.title, slug: a.slug, image: a.coverImage })),
      }
    }),
  )

  const now = new Date()
  const today = `${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollProgress />
      <SiteHeader
        siteName={settings.site_name}
        slogan={settings.site_slogan}
        categories={categories}
        today={today}
        logoUrl={settings.site_logo || undefined}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter
        data={{
          siteName: settings.site_name,
          footerText: settings.footer_text,
          newsletterText: settings.footer_newsletter_text,
          copyright: settings.footer_copyright,
          logoUrl: settings.site_logo || undefined,
          social: {
            facebook: settings.social_facebook || undefined,
            twitter: settings.social_twitter || undefined,
            instagram: settings.social_instagram || undefined,
            linkedin: settings.social_linkedin || undefined,
            youtube: settings.social_youtube || undefined,
          },
          categories: cats.map((c) => ({ name: c.name, slug: c.slug })),
        }}
      />
      <BackToTop />
    </div>
  )
}
