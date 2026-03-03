import PageHero from '../../components/PageHero';
import FeatureGrid from '../../components/FeatureGrid';
import ContentCards from '../../components/ContentCards';

const features = [
  {
    title: 'Family business directory',
    description: 'Search, sort, and filter the marketplace with Supabase queries that match the legacy HTML experience.',
    meta: 'Directory',
  },
  {
    title: 'Featured listings',
    description: 'Boost a listing with badges and spotlight cards, all using shared component primitives.',
    meta: 'Promotion',
  },
  {
    title: 'Referrals + reviews',
    description: 'Collect testimonials with moderation and spam control baked into Supabase policies.',
    meta: 'Trust',
  },
];

const cards = [
  {
    eyebrow: 'Operations',
    title: 'Inventory and hours',
    description: 'Simple CRUD forms replace duplicated HTML and sync with Supabase tables.',
    tags: ['CRUD', 'Forms'],
  },
  {
    eyebrow: 'Search',
    title: 'Tags and locations',
    description: 'Geo-tag listings to mirror the Bolt map experience using shared UI components.',
    tags: ['Search', 'Maps'],
  },
];

export default function BusinessPage() {
  return (
    <div className="space-y-10">
      <PageHero
        eyebrow="Marketplace"
        title="Showcase family-owned businesses"
        subtitle="The Bolt business pages are now dynamic Next.js routes backed by Supabase for listings, reviews, and referrals."
        ctaPrimary={{ href: '/auth', label: 'Add listing' }}
        ctaSecondary={{ href: '/dashboard', label: 'View analytics' }}
      />
      <FeatureGrid title="Marketplace toolkit" description="Discovery, reviews, and promos—now powered by Supabase." features={features} />
      <ContentCards items={cards} />
    </div>
  );
}
