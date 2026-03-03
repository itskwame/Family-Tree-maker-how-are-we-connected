import PageHero from '../../components/PageHero';
import FeatureGrid from '../../components/FeatureGrid';
import ContentCards from '../../components/ContentCards';

const features = [
  {
    title: 'Event templates',
    description: 'Reunions, weddings, graduations—prebuilt cards mirror the original HTML but pull RSVPs from Supabase.',
    meta: 'Invites',
  },
  {
    title: 'Smart reminders',
    description: 'Automated reminders via email or SMS using Supabase functions keeps attendance high.',
    meta: 'Automation',
  },
  {
    title: 'Capacity planning',
    description: 'Track headcount, dietary needs, and lodging with the same UX the Bolt version established.',
    meta: 'Logistics',
  },
];

const cards = [
  {
    eyebrow: 'Calendar sync',
    title: 'Add to iCal, Google, Outlook',
    description: 'ICS exports keep the experience consistent with the static templates.',
    tags: ['Calendars', 'RSVP'],
  },
  {
    eyebrow: 'Checklists',
    title: 'Task boards for hosts',
    description: 'Supabase tables power task lanes for food, AV, travel, and venue coordination.',
    tags: ['Tasks', 'Shared'],
  },
];

export default function EventsPage() {
  return (
    <div className="space-y-10">
      <PageHero
        eyebrow="Events"
        title="Keep every reunion and celebration organized"
        subtitle="Each Bolt event page is now a typed Next.js route with shared components and Supabase-powered RSVPs."
        ctaPrimary={{ href: '/auth', label: 'Create event' }}
        ctaSecondary={{ href: '/feed', label: 'Post invite' }}
      />
      <FeatureGrid title="Event essentials" description="Plan, invite, and celebrate with a familiar layout." features={features} />
      <ContentCards items={cards} />
    </div>
  );
}
