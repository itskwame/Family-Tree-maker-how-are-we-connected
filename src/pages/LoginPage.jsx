import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({ type: 'idle', message: '' });

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ type: 'pending', message: 'Signing in...' });

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setStatus({ type: 'error', message: error.message });
      return;
    }

    setStatus({
      type: 'success',
      message: 'Signed in. You can migrate the dashboard next.',
    });
  }

  return (
    <section className="page-panel page-panel--narrow">
      <p className="eyebrow">React Auth</p>
      <h1>Sign in</h1>
      <p className="lede">
        This is the first live React form using the shared Supabase client.
      </p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Email</span>
          <input
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        <button
          className="react-button react-button--primary"
          disabled={status.type === 'pending'}
          type="submit"
        >
          {status.type === 'pending' ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      {status.message ? (
        <p className={`status-message status-message--${status.type}`}>
          {status.message}
        </p>
      ) : null}
      <p className="switch-text">
        Need an account? <Link to="/auth/signup">Create one here</Link>.
      </p>
    </section>
  );
}
