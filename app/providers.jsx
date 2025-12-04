'use client';

import SupabaseProvider from '../components/SupabaseProvider';

export default function Providers({ children }) {
  return <SupabaseProvider>{children}</SupabaseProvider>;
}
