import PageHero from '../../components/PageHero';
import FeatureGrid from '../../components/FeatureGrid';
import StatCards from '../../components/StatCards';

const stats = [
  { label: 'Active relatives', value: '326', subtext: 'Realtime presence with Supabase Realtime' },
  { label: 'Invites pending', value: '42', subtext: 'Magic links + OTPs' },
  { label: 'Upcoming events', value: '9', subtext: 'With RSVP response tracking' },
  { label: 'Businesses', value: '58', subtext: 'Searchable marketplace' },
];

const features = [
  {
    title: 'Supabase-secured dashboards',
    description: 'Server components render metrics from Supabase while protected API routes keep data scoped to a family group.',
    meta: 'Server + API',
  },
  {
    title: 'Task + reminder lanes',
    description: 'Shared tasks for reunions, ancestry research, and household logistics with due dates and owners.',
    meta: 'Operational HQ',
  },
  {
    title: 'Insights from lineage',
    description: 'Surface the most-connected relatives, top contributors, and who hasn’t been invited yet.',
    meta: 'Analytics',
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      <PageHero
        eyebrow="Operations"
        title="A command center for every family branch"
        subtitle="Replace the static dashboard HTML with live Supabase metrics and reusable cards, keeping the same layout and UX from the Bolt prototype."
        ctaPrimary={{ href: '/auth', label: 'Protect with auth' }}
        ctaSecondary={{ href: '/events', label: 'Schedule event' }}
      />
      <StatCards stats={stats} />
      <FeatureGrid title="Dashboard staples" description="Everything lives in one view—profiles, invites, events, and tasks." features={features} />
    </div>
  );
}
