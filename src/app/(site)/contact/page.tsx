import type { Metadata } from 'next'
import { Facebook, Lightbulb, Mail, MessageSquare, Phone, Send } from 'lucide-react'

import { getSettings } from '@/lib/settings'
import { ContactForm } from '@/components/site/contact-form'
import { Breadcrumb } from '@/components/site/breadcrumb'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  return {
    title: settings.contact_title || 'Contact',
    description: settings.contact_intro || 'Contactez la rédaction.',
  }
}

export default async function ContactPage() {
  const settings = await getSettings()
  const tipsEnabled = settings.tips_enabled === 'true'

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
      <Breadcrumb items={[{ label: settings.contact_title || 'Contact' }]} />
      <h1 className="mt-4 font-display text-4xl font-bold">{settings.contact_title || 'Contact'}</h1>
      <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">{settings.contact_intro}</p>

      <div className="mt-10 grid gap-6 md:grid-cols-[1fr_280px]">
        <ContactForm />

        <aside className="space-y-4">
          <div className="rounded-lg border border-border/70 bg-card p-5">
            <div className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 text-brand" />
              <h2 className="eyebrow text-muted-foreground">Rédaction</h2>
            </div>
            <a href={`mailto:${settings.contact_email}`} className="mt-2 block text-sm font-medium text-foreground hover:text-brand">
              {settings.contact_email}
            </a>
            {settings.contact_phone && (
              <a
                href={`tel:${settings.contact_phone.replace(/\s+/g, '')}`}
                className="mt-2 flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-brand"
              >
                <Phone className="h-3.5 w-3.5 text-brand" />
                {settings.contact_phone}
              </a>
            )}
            <p className="mt-1 text-xs text-muted-foreground">{settings.contact_delay}</p>
          </div>

          {tipsEnabled && (
            <div className="rounded-lg border border-border/70 bg-secondary/40 p-5">
              <div className="flex items-center gap-2.5">
                <Lightbulb className="h-4 w-4 text-brand" />
                <h2 className="eyebrow text-muted-foreground">{settings.contact_tips_title || 'Proposer un sujet'}</h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{settings.contact_tips_text}</p>
            </div>
          )}

          <div className="rounded-lg border border-border/70 bg-card p-5">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="h-4 w-4 text-brand" />
              <h2 className="eyebrow text-muted-foreground">Réseaux</h2>
            </div>
            <ul className="mt-2 space-y-1.5 text-sm">
              {settings.social_facebook && (
                <li>
                  <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-brand">
                    <Facebook className="h-3.5 w-3.5" /> Facebook
                  </a>
                </li>
              )}
              {settings.social_twitter && (
                <li><a href={settings.social_twitter} target="_blank" rel="noopener noreferrer" className="hover:text-brand">X / Twitter</a></li>
              )}
              {settings.social_instagram && (
                <li><a href={settings.social_instagram} target="_blank" rel="noopener noreferrer" className="hover:text-brand">Instagram</a></li>
              )}
              {settings.social_linkedin && (
                <li><a href={settings.social_linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-brand">LinkedIn</a></li>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
