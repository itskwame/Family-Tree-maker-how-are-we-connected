import PageHero from '../../components/PageHero';
import FeatureGrid from '../../components/FeatureGrid';
import ContentCards from '../../components/ContentCards';

const features = [
  {
    title: 'Unified profile template',
    description: 'Bio, family role, location, and lineage ties live in Supabase while the UI mirrors the Bolt cards.',
    meta: 'Profiles',
  },
  {
    title: 'Verification + invites',
    description: 'Pending relatives show up with call-to-action buttons, preserving the UX the HTML pages used.',
    meta: 'Onboarding',
  },
  {
    title: 'Media and notes',
    description: 'Upload stories, documents, and photos to Supabase storage and surface them in the profile layout.',
    meta: 'Storage',
  },
];

const cards = [
  {
    eyebrow: 'Connections',
    title: 'See how we are connected',
    description: 'Inline chips show cousin/once-removed calculations powered by lineage tables.',
    tags: ['Lineage', 'Chips'],
  },
  {
    eyebrow: 'Activity',
    title: 'Recent contributions',
    description: 'Feed snippets, event RSVPs, and business ownership all aggregate on the profile page.',
    tags: ['Activity', 'Cross-page'],
  },
];

export default function ProfilePage() {
  return (
    <div className="space-y-10">
      <PageHero
        eyebrow="Profiles"
        title="Every relative, one reusable layout"
        subtitle="Profile pages now pull Supabase data, keeping the same visual hierarchy as the original HTML templates."
        ctaPrimary={{ href: '/auth', label: 'Sign in' }}
        ctaSecondary={{ href: '/feed', label: 'Share update' }}
      />
      <FeatureGrid title="Profile system" description="Profiles connect every part of the experience." features={features} />
      <ContentCards items={cards} />
    </div>
  );
}
