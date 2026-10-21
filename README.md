# FamilyConnect - Vite React SPA

This repository is a client-side single-page application built with Vite, React, React Router, and Supabase.

## Overview

FamilyConnect is focused on family networking features such as profiles, family-tree workflows, events, and related UI experiments. The current codebase uses a browser-only architecture with no server-side rendering.

## Stack

- Vite for development and production builds
- React for the UI
- React Router for client-side navigation
- `@supabase/supabase-js` for browser auth and database access

## Project Structure

- `src/` contains the React application
- `src/pages/` contains route-level screens
- `src/lib/supabase.js` contains the browser Supabase client
- `src/styles/` contains SPA styles
- `index.html` and `app.html` are the Vite HTML entry points
- `supabase/migrations/` contains database migrations

## Getting Started

1. Install dependencies with `npm install`.
2. Set the required environment variables in `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Start the dev server with `npm run dev`.
4. Create a production build with `npm run build`.
5. Preview the build locally with `npm run preview`.

## Routing

Navigation is handled in the SPA through React Router. The app entry point is `src/main.jsx`, and route definitions live in `src/App.jsx`.

## Supabase

The app uses the browser client from `@supabase/supabase-js`. There is no SSR client, server-only Supabase helper, or framework-specific middleware in this repository.

## Notes

- Legacy Next.js and Tailwind setup has been removed.
- The build pipeline is now a single Vite-based workflow.
- Existing SQL migrations under `supabase/` remain available for database setup.


## Demonstration data and release boundary

See [demonstration audit](DEMO-DATA-AUDIT.html) and [file inventory](output/demo-audit/inventory.json).
`npm run dev` serves the isolated Phase 6 application. Fictional templates require the explicit local demonstration link. Existing development fixtures remain available through local-only scripts; automatic Supabase seeding is disabled.

`npm run build` and `npm run build:release` require an explicitly reviewed `FAMILYCONNECT_RELEASE_TARGET` (`private-beta` or `production`), `VITE_FC_URL` and public `VITE_FC_ANON_KEY`. Optional `VITE_FC_MEDIA_URL` must be configured for uploads. Never provide a service-role key. Missing configuration blocks the build; legacy `.env` credentials are not reused. Only `dist-release` is a release directory. Do not publish the repository, `public`, `output`, `dist-phase6`, or `dist-cleancheck`. A successful build does not authorize deployment.

Use Node 22 or newer. Run `npm run test:release-boundary`. To repeat the clean-start check, run `npm run prepare:clean-audit`, start the separate stack with `supabase start --workdir local/clean-audit`, then `npm run test:clean-start`. It requires Docker and installed Playwright Chromium, uses only ports 56321/56322 and 5186, and refuses linked workspaces. It creates and removes only its own disposable UI probe after checking the empty baseline. Do not substitute the existing development or hosted database. `npm run audit:demo` reads aggregate counts from the existing isolated development stack.
