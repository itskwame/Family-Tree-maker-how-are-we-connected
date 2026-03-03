import Link from 'next/link';
import { footerLinks } from '../data/navigation';

export default function Footer() {
  return (
    <footer className="mt-12 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <div className="grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 shadow-inner shadow-brand-100">
            <span className="text-lg font-semibold">FC</span>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            FamilyConnect keeps every branch of your family tree connected with private spaces, events, and business listings.
          </p>
        </div>
        {footerLinks.map((column) => (
          <div key={column.heading}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{column.heading}</p>
            <div className="mt-3 flex flex-col gap-2 text-sm font-semibold text-slate-700">
              {column.links.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-brand-700">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Stay updated</p>
          <p className="mt-3 text-sm text-slate-600">Product news, templates, and family history prompts delivered monthly.</p>
          <div className="mt-4 flex gap-2">
            <input
              type="email"
              placeholder="name@email.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <button className="btn-primary">Subscribe</button>
          </div>
        </div>
      </div>
      <div className="mt-8 flex flex-col justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:flex-row">
        <p>© {new Date().getFullYear()} FamilyConnect. Built with Next.js and Supabase.</p>
        <div className="flex gap-4">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/auth">Support</Link>
        </div>
      </div>
    </footer>
  );
}
