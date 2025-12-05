# FamilyConnect - Next.js + Supabase Rebuild

This repo now hosts a full **Next.js** + **TailwindCSS** application that mirrors the original Bolt HTML templates while wiring the experience into **Supabase** for auth, profiles, and API routes.

## 🌟 Project Overview

FamilyConnect is a SaaS platform designed to help families:
- Build and visualize interactive family trees
- Discover relationships through intelligent connection pathfinding
- Share memories through a private social network
- Support family businesses
- Print customized family trees

This application preserves the original UX (family tree, feed, events, business directory) with reusable React components and server/API handlers ready for a live Supabase backend.

## 🧭 Project Structure

- `app/` — Next.js App Router pages for every legacy template (home, tree, feed, events, business, dashboard, profile, auth) plus API routes
- `components/` — Reusable UI primitives (hero, stats, feature grids, cards, auth form, navigation, footer) to avoid copy-pasted HTML
- `data/` — Shared navigation data
- `lib/` — Supabase server client helper

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Copy `.env.example` to `.env.local`** and fill in your Supabase credentials:
   ```bash
   cp .env.example .env.local
   ```

   Then edit `.env.local` with your values:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (for server-only API routes)

3. **Run the app**:
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

4. **Build for production**:
   ```bash
   npm run build
   ```

## 📦 Supabase Tables to Provision

The application expects the following Supabase tables:

- `profiles` - User profiles with fields like `id`, `full_name`, `headline`, `city`
- Additional tables for `events`, `posts`, `businesses`, and lineage edges can reuse the same Supabase client helpers

Refer to the existing migrations in `supabase/migrations/` for the current database schema.

## ✨ What Changed from HTML to Next.js

### Architecture
- **Vite → Next.js 14**: Server-side rendering, API routes, and file-based routing
- **Static HTML → React Components**: Reusable PageHero, FeatureGrid, StatCards, ContentCards components
- **Inline styles → TailwindCSS**: Utility-first CSS with custom brand colors
- **Manual auth → Supabase Auth**: Email/password, magic links, and OTP support

### Pages Converted
All original HTML pages are now Next.js routes:

- `/` - Home page (was `index.html`)
- `/tree` - Family tree builder (was `tree/builder.html`)
- `/feed` - Family feed (was `feed/index.html`)
- `/events` - Events management (was `events/index.html`)
- `/business` - Business directory (was `business/index.html`)
- `/dashboard` - Dashboard/insights (was `dashboard/index.html`)
- `/profile` - Profile pages (was `profile/view.html`)
- `/auth` - Authentication (was `auth/login.html`)

### Components Created
- **Layout Components**: Navigation, Footer, RootLayout with Providers
- **UI Components**: PageHero, FeatureGrid, StatCards, ContentCards, AuthForm
- **Supabase Integration**: SupabaseProvider (client), supabaseServer (server)
- **API Routes**: `/api/profiles` for server-side data operations

## 🎨 Design System

### Color Palette
```css
Brand Blue Palette:
- brand-50: #eef6ff
- brand-100: #d9e9ff
- brand-500: #387dff
- brand-600: #1f5fe6
- brand-700: #1449b4
```

### Typography
- **Headings**: Playfair Display (serif)
- **Body Text**: Inter (sans-serif)
- **Loaded via**: Next.js Google Fonts integration

### Components
All components use TailwindCSS utility classes with custom classes defined in `app/globals.css`:
- `.btn-primary` - Primary CTA buttons
- `.btn-secondary` - Secondary buttons
- `.glass` - Frosted glass effect
- `.text-gradient` - Brand gradient text
- `.card-border` - Card border styling

## 🔐 Authentication

Supabase Auth is configured for:
- Email/password authentication
- Magic link sign-in (passwordless)
- OTP (one-time password) support

The AuthForm component (`components/AuthForm.jsx`) handles magic link authentication by default.

## 📊 API Routes

### `/api/profiles`
- **GET**: Fetch profiles (returns up to 12 profiles)
- **POST**: Create a new profile

All API routes use the service role client for server-side operations with full database access.

## 🛠️ Customization Guide

### Changing Colors
Edit the Tailwind config in `tailwind.config.js`:
```javascript
colors: {
  brand: {
    500: '#387dff',
    // Update colors here
  },
}
```

### Adding New Pages
1. Create a new file in `app/your-page/page.js`
2. Use existing components or create new ones
3. The page will automatically be available at `/your-page`

### Adding New Components
1. Create a new component in `components/YourComponent.jsx`
2. Import and use in any page
3. Follow the existing component patterns for consistency

## 📈 Performance

- **Static Generation**: Most pages are statically generated at build time
- **Server Components**: React Server Components by default for better performance
- **Client Components**: Only interactive components use `'use client'` directive
- **Code Splitting**: Automatic code splitting with Next.js

## 🔄 Database Schema

The application uses the existing Supabase migrations:
- `20251117231240_add_relationship_types_and_gender_v2.sql`
- `20251130002808_add_invitations_and_events_tables.sql`
- `20251202014821_fix_security_and_performance_issues.sql`
- `20251202015109_fix_remaining_policy_conflicts.sql`

These migrations set up tables for users, profiles, family relationships, events, invitations, and more with proper RLS policies.

## 🎯 Next Steps

1. **Set up Supabase**: Create a Supabase project and run migrations
2. **Configure Environment Variables**: Add your Supabase credentials to `.env.local`
3. **Add Interactive Features**: Implement the actual family tree canvas, feed posts, event RSVPs
4. **Deploy**: Deploy to Vercel, Netlify, or your preferred hosting platform

## 📞 Support

For questions or issues with the Next.js application:
- Check the Supabase console for database errors
- Review Next.js documentation at https://nextjs.org/docs
- Check Supabase documentation at https://supabase.com/docs

## 📄 License

This application is proprietary to FamilyConnect. All rights reserved.

---

**Built with Next.js, TailwindCSS, and Supabase**

*Migrated: December 2025*
