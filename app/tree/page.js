import PageHero from '../../components/PageHero';
import FeatureGrid from '../../components/FeatureGrid';
import ContentCards from '../../components/ContentCards';

const features = [
  {
    title: 'Drag-and-drop canvas',
    description: 'Recreate the lineage builder with Tailwind cards powered by Supabase relationships.',
    meta: 'Canvas',
  },
  {
    title: 'Relationship calculator',
    description: 'Compute "3rd cousin twice removed" using stored ancestor links and show the pathway.',
    meta: 'Pathfinding',
  },
  {
    title: 'Invite relatives securely',
    description: 'Email or SMS invitations that create pending users in Supabase until they accept.',
    meta: 'Onboarding',
  },
  {
    title: 'Media-rich profiles',
    description: 'Upload photos and oral histories to Supabase storage and surface them across the tree.',
    meta: 'Storage',
  },
];

const cards = [
  {
    eyebrow: 'Templates',
    title: 'Add parents, siblings, and children fast',
    description: 'Inline forms with relationship validation prevent duplicate nodes.',
    tags: ['Validation', 'Inline forms'],
  },
  {
    eyebrow: 'Navigation',
    title: 'Jump to generation markers',
    description: 'Breadcrumbs and mini-map match the original UX so users never get lost.',
    tags: ['UX parity', 'Mini-map'],
  },
];

export default function TreePage() {
  return (
    <div className="space-y-10">
      <PageHero
        eyebrow="Family tree"
        title="Map every relationship without losing the Bolt layout"
        subtitle="We restructured the static tree HTML into composable cards that mirror the original canvas while connecting each action to Supabase tables."
        ctaPrimary={{ href: '/auth', label: 'Invite relatives' }}
        ctaSecondary={{ href: '/dashboard', label: 'See insights' }}
      />
      <FeatureGrid title="Lineage toolkit" description="Everything the original tree supported, now data-backed." features={features} />
      <ContentCards items={cards} />
    </div>
  );
}
