'use client';

import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import { createContext, useContext, useMemo } from 'react';

const SupabaseContext = createContext(null);

export default function SupabaseProvider({ children }) {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      console.warn('Supabase URL or anon key missing; authentication and data will be disabled.');
      return null;
    }
    return createBrowserClient(url, key);
  }, []);

  return <SupabaseContext.Provider value={supabase}>{children}</SupabaseContext.Provider>;
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider');
  }
  return context;
}
