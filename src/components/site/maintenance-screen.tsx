export function MaintenanceScreen({ siteName, message }: { siteName: string; message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#141210] px-6 text-center text-[#EDE8E0]">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-md font-display text-2xl font-bold" style={{ background: 'var(--brand)', color: 'var(--brand-foreground)' }}>
          V
        </span>
        <span className="font-display text-4xl font-bold">{siteName}</span>
      </div>
      <p className="mt-8 max-w-md font-display text-xl italic leading-relaxed text-[#EDE8E0]/85">{message}</p>
      <div className="mt-10 h-px w-24" style={{ background: 'var(--brand)' }} />
      <p className="mt-6 text-xs uppercase tracking-[0.2em] text-[#EDE8E0]/50">Retour très bientôt</p>
    </div>
  )
}
