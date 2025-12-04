import Link from 'next/link';

export default function PageHero({ eyebrow, title, subtitle, ctaPrimary, ctaSecondary, kicker }) {
  return (
    <section className="glass card-border relative overflow-hidden rounded-3xl p-6 sm:p-10">
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/40 to-brand-50/40" />
      <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          {kicker && <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">{kicker}</p>}
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">{eyebrow}</p>
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
            <span className="text-gradient">{title}</span>
          </h1>
          <p className="text-base text-slate-600 sm:text-lg">{subtitle}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            {ctaPrimary && (
              <Link href={ctaPrimary.href} className="btn-primary">
                {ctaPrimary.label}
              </Link>
            )}
            {ctaSecondary && (
              <Link href={ctaSecondary.href} className="btn-secondary">
                {ctaSecondary.label}
              </Link>
            )}
          </div>
        </div>
        <div className="relative">
          <div className="absolute -left-6 -top-6 h-28 w-28 rounded-full bg-brand-100 blur-3xl" />
          <div className="absolute -right-3 -bottom-10 h-32 w-32 rounded-full bg-brand-200 blur-3xl" />
          <div className="relative rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-lg">
            <div className="grid grid-cols-2 gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {['Connections', 'Events', 'Businesses', 'Messages'].map((item) => (
                <div key={item} className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2 text-center text-slate-700">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {[
                'Invite relatives, map lineage, and verify relationships with Supabase-backed data.',
                'Host gatherings with RSVP tracking and reminders.',
                'Promote family-owned businesses with search and tagging.',
                'Keep memories flowing with a private, moderated feed.',
              ].map((line, idx) => (
                <div key={idx} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                  <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-brand-500" />
                  <p className="text-slate-700">{line}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
