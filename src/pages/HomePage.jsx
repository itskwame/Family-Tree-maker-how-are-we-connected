import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <section className="page-panel">
      <p className="eyebrow">Incremental Migration</p>
      <h1>React is now wired into this Vite project.</h1>
      <p className="lede">
        The original HTML pages remain in place. This new entrypoint lets you
        migrate feature areas into React without breaking the existing app.
      </p>
      <div className="cta-row">
        <Link className="react-button react-button--primary" to="/auth/signup">
          Start with Sign Up
        </Link>
        <Link className="react-button react-button--secondary" to="/auth/login">
          Open Login
        </Link>
      </div>
      <div className="info-grid">
        <article className="info-card">
          <h2>What changed</h2>
          <p>
            Vite now supports React, React Router is ready, and Supabase has a
            reusable client module for new React pages.
          </p>
        </article>
        <article className="info-card">
          <h2>What stays intact</h2>
          <p>
            Existing vanilla HTML pages, CSS, and current Supabase-backed flows
            remain available during the migration.
          </p>
        </article>
      </div>
    </section>
  );
}
