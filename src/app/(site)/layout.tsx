import { SiteHeader } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import { getSettings } from '@/lib/settings'
import { getVisibleCategories } from '@/lib/public-queries'
import { BackToTop } from '@/components/site/back-to-top'
import { MaintenanceScreen } from '@/components/site/maintenance-screen'

export const dynamic = 'force-dynamic'

const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings()

  // Mode maintenance (§6.9) : écran d’attente sauf pour le dashboard
  if (settings.maintenance_mode === 'true') {
    return <MaintenanceScreen siteName={settings.site_name} message={settings.maintenance_message} />
  }

  const categories = await getVisibleCategories()
  const now = new Date()
  const today = `${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        siteName={settings.site_name}
        slogan={settings.site_slogan}
        today={today}
        categories={categories.map((c) => ({ name: c.name, slug: c.slug }))}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter
        data={{
          siteName: settings.site_name,
          footerText: settings.footer_text,
          social: {
            twitter: settings.social_twitter || undefined,
            instagram: settings.social_instagram || undefined,
            linkedin: settings.social_linkedin || undefined,
            youtube: settings.social_youtube || undefined,
          },
          categories: categories.map((c) => ({ name: c.name, slug: c.slug })),
        }}
      />
      <BackToTop />
    </div>
  )
}
