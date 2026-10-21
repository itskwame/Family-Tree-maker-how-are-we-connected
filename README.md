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
