export default function StatCards({ stats }) {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="glass card-border rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{stat.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
          {stat.subtext && <p className="text-sm text-slate-600">{stat.subtext}</p>}
        </div>
      ))}
    </div>
  );
}
