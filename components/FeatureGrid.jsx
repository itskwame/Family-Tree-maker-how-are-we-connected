export default function FeatureGrid({ title, description, features }) {
  return (
    <section className="mt-10 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{title}</p>
          <p className="text-base text-slate-600 sm:text-lg">{description}</p>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {features.map((feature) => (
          <div key={feature.title} className="glass card-border flex gap-3 rounded-2xl p-4">
            <div className="mt-1">
              <CheckIcon />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">{feature.title}</h3>
              <p className="text-sm text-slate-600">{feature.description}</p>
              {feature.meta && <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">{feature.meta}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-6 w-6 text-brand-500" fill="currentColor" aria-hidden="true">
      <path d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.2 7.286a1 1 0 0 1-1.43.012L3.29 8.72a1 1 0 1 1 1.42-1.408l3.067 3.096 6.486-6.567a1 1 0 0 1 1.441.006Z" />
    </svg>
  );
}
