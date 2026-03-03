import PageHero from '../../components/PageHero';
import FeatureGrid from '../../components/FeatureGrid';
import AuthForm from '../../components/AuthForm';

const features = [
  {
    title: 'Supabase auth baked-in',
    description: 'Magic links, OTPs, and email confirmation replace the ad-hoc login HTML.',
    meta: 'Authentication',
  },
  {
    title: 'Guarded routes',
    description: 'Use Supabase session checks inside layouts to protect tree, feed, and business pages.',
    meta: 'Authorization',
  },
  {
    title: 'Invite-first onboarding',
    description: 'Admins can pre-create relatives with pending statuses, mirroring the original invite flows.',
    meta: 'Onboarding',
  },
];

export default function AuthPage() {
  return (
    <div className="space-y-10">
      <PageHero
        eyebrow="Authentication"
        title="Secure access for every branch"
        subtitle="Supabase Auth powers sign-in while Tailwind components match the Bolt login templates."
        ctaPrimary={{ href: '/', label: 'Return home' }}
        ctaSecondary={{ href: '/dashboard', label: 'View dashboard' }}
      />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <AuthForm />
        <FeatureGrid title="Why this matters" description="Auth is now first-class instead of static HTML." features={features} />
      </div>
    </div>
  );
}
