import PageHero from '../../components/PageHero';
import FeatureGrid from '../../components/FeatureGrid';
import ContentCards from '../../components/ContentCards';

const features = [
  {
    title: 'Private family feed',
    description: 'Posts, photos, and milestones render as Tailwind cards while Supabase rows keep moderation simple.',
    meta: 'Feed',
  },
  {
    title: 'Story prompts',
    description: 'Weekly prompts encourage elders to post memories that are saved to Supabase storage.',
    meta: 'Engagement',
  },
  {
    title: 'Moderation + roles',
    description: 'Role-based access enforced by Supabase policies replicates the original admin experience.',
    meta: 'Security',
  },
];

const cards = [
  {
    eyebrow: 'Media',
    title: 'Photo galleries',
    description: 'Responsive grids for reunions, with drag-and-drop uploads and alt text.',
    tags: ['Uploads', 'Accessibility'],
  },
  {
    eyebrow: 'Engagement',
    title: 'Reactions + comments',
    description: 'Optimistic updates keep the UX snappy while respecting privacy.',
    tags: ['Realtime', 'Moderation'],
  },
];

export default function FeedPage() {
  return (
    <div className="space-y-10">
      <PageHero
        eyebrow="Family feed"
        title="Share memories in a secure, familiar layout"
        subtitle="The Bolt HTML feed is now a reusable set of cards and input bars, connected to Supabase tables for posts, likes, and comments."
        ctaPrimary={{ href: '/auth', label: 'Post an update' }}
        ctaSecondary={{ href: '/events', label: 'Plan an event' }}
      />
      <FeatureGrid title="Keep everyone updated" description="Feeds stay fast with optimistic UI and realtime streaming." features={features} />
      <ContentCards items={cards} />
    </div>
  );
}
