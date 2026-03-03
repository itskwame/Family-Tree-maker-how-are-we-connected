'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from './SupabaseProvider';

export default function AuthForm() {
  const supabase = useSupabase();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!supabase) return;

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }

        if (profile?.onboarding_completed) {
          router.push('/dashboard');
        } else {
          router.push('/onboarding');
        }
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [supabase, router]);

  const handleMagicLink = async (event) => {
    event.preventDefault();
    if (!supabase) {
      setStatus('Supabase env vars missing.');
      return;
    }
    setStatus('Sending magic link...');
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      setStatus(error.message);
    } else {
      setStatus('Check your email for the sign-in link.');
    }
  };

  return (
    <form onSubmit={handleMagicLink} className="glass card-border space-y-4 rounded-3xl p-6">
      <div>
        <label htmlFor="email" className="text-sm font-semibold text-slate-700">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
          placeholder="you@example.com"
        />
      </div>
      <button type="submit" className="btn-primary w-full justify-center">
        Send magic link
      </button>
      {status && <p className="text-sm text-slate-600">{status}</p>}
    </form>
  );
}
