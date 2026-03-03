import './globals.css';
import { Inter, Playfair_Display } from 'next/font/google';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'] });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['600', '700'] });

export const metadata = {
  title: 'FamilyConnect | How Are We Connected?',
  description: 'A Next.js + Supabase rebuild of the FamilyConnect experience.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} gradient-bg min-h-screen text-slate-900`}>
        <Providers>
          <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 pb-16 pt-10 sm:px-10">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_10%,rgba(56,125,255,0.18),transparent_25%),radial-gradient(circle_at_90%_20%,rgba(16,59,140,0.22),transparent_30%)]" />
            <Navigation accentClass={playfair.className} />
            <main className="flex-1 py-6 sm:py-10">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
