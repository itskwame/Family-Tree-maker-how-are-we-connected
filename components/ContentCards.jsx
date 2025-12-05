export default function ContentCards({ items }) {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <div key={item.title} className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{item.eyebrow}</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{item.title}</h3>
          <p className="text-sm text-slate-600">{item.description}</p>
          {item.tags && (
            <div className="mt-3 flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
