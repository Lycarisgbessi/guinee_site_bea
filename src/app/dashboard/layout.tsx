import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getSettings } from '@/lib/settings'
import { DashboardShell } from '@/components/dashboard/shell'

export const dynamic = 'force-dynamic'

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrateur',
  EDITEUR: 'Rédacteur',
  RELECTEUR: 'Relecteur',
  INVITE: 'Invité',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Double vérification serveur (le middleware filtre déjà)
  const session = await getSession()
  if (!session) redirect('/login?next=/dashboard')
  const settings = await getSettings()

  return (
    <DashboardShell
      userName={session.name}
      userRole={ROLE_LABELS[session.role] ?? session.role}
      siteName={settings.site_name}
    >
      {children}
    </DashboardShell>
  )
}
