'use client';

import Link from 'next/link';
import { useState } from 'react';
import { navigation } from '../data/navigation';

export default function Navigation({ accentClass }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="mb-8">
      <nav className="glass card-border relative flex items-center justify-between rounded-2xl px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 shadow-inner shadow-brand-100">
            <span className="text-lg font-semibold">FC</span>
          </div>
          <div>
            <p className={`text-sm uppercase tracking-[0.18em] text-brand-700 ${accentClass}`}>FamilyConnect</p>
            <p className="text-xs text-slate-500">How are we connected?</p>
          </div>
        </div>

        <div className="hidden items-center gap-6 text-sm font-semibold text-slate-700 sm:flex">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-full px-3 py-2 transition hover:bg-brand-50 hover:text-brand-700">
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          <Link href="/auth" className="btn-secondary">
            Sign in
          </Link>
          <Link href="/auth" className="btn-primary">
            Start free trial
          </Link>
        </div>

        <button
          onClick={() => setOpen((prev) => !prev)}
          className="ml-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 sm:hidden"
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>

        {open && (
          <div className="card-border absolute left-0 top-[68px] w-full rounded-2xl bg-white p-4 shadow-xl sm:hidden">
            <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl px-3 py-2 transition hover:bg-brand-50 hover:text-brand-700"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link href="/auth" className="btn-secondary text-center" onClick={() => setOpen(false)}>
                Sign in
              </Link>
              <Link href="/auth" className="btn-primary text-center" onClick={() => setOpen(false)}>
                Start trial
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}
