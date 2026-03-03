import PageHero from '../components/PageHero';
import FeatureGrid from '../components/FeatureGrid';
import StatCards from '../components/StatCards';
import ContentCards from '../components/ContentCards';

const homeFeatures = [
  {
    title: 'Relationship intelligence',
    description: 'Calculate connections instantly ("3rd cousin twice removed") with Supabase-backed lineage data.',
    meta: 'Tree + Insights',
  },
  {
    title: 'Unified family hub',
    description: 'Profiles, posts, events, and business listings stay synced so every branch stays in touch.',
    meta: 'Home',
  },
  {
    title: 'Invite-first privacy',
    description: 'Private spaces with email magic links, OTPs, and moderation for a safe family feed.',
    meta: 'Auth + Security',
  },
  {
    title: 'Launch-ready components',
    description: 'Next.js + Tailwind architecture with reusable hero, card, and grid components instead of duplicated markup.',
    meta: 'Design system',
  },
];

const contentCards = [
  {
    eyebrow: 'Templates',
    title: 'Events, invites, and RSVPs',
    description: 'Recurring reunions, Sunday dinners, and birthday reminders with calendar sync.',
    tags: ['Events', 'RSVP', 'Reminders'],
  },
  {
    eyebrow: 'Connections',
    title: 'How-are-we-connected calculator',
    description: 'Match relatives and show the relationship path using Supabase row-level lineage data.',
    tags: ['Graph', 'Lineage', 'Verification'],
  },
];

const stats = [
  { label: 'Templates migrated', value: '14+', subtext: 'Landing, feed, auth, business, and more' },
  { label: 'Realtime ready', value: 'Supabase', subtext: 'Auth, Postgres, edge-ready APIs' },
  { label: 'Componentized', value: '20+ primitives', subtext: 'Cards, hero, stats, navigation, CTA' },
  { label: 'Framework', value: 'Next.js + Tailwind', subtext: 'Clean, maintainable architecture' },
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <PageHero
        eyebrow="Family OS"
        kicker="Next.js redesign"
        title="Rebuilt every FamilyConnect page as a modern app"
        subtitle="Tailwind-powered components mirror the original Bolt HTML experience while adding real Supabase auth, data, and API routes."
        ctaPrimary={{ href: '/auth', label: 'Launch app' }}
        ctaSecondary={{ href: '/tree', label: 'Explore features' }}
      />
      <StatCards stats={stats} />
      <FeatureGrid title="What changed" description="Every legacy page now lives as a Next.js route with shared UI primitives." features={homeFeatures} />
      <ContentCards items={contentCards} />
    </div>
  );
}
