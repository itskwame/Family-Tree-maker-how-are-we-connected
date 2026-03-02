import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';

export default function SignupPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [status, setStatus] = useState({ type: 'idle', message: '' });

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ type: 'pending', message: 'Creating your account...' });

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          first_name: form.firstName,
          last_name: form.lastName,
        },
      },
    });

    if (error) {
      setStatus({ type: 'error', message: error.message });
      return;
    }

    setStatus({
      type: 'success',
      message:
        'Account created. Next migration step is to port onboarding and dashboard.',
    });
  }

  return (
    <section className="page-panel page-panel--narrow">
      <p className="eyebrow">React Auth</p>
      <h1>Create your account</h1>
      <p className="lede">
        This mirrors the existing signup flow at a basic level and keeps
        Supabase as the backend.
      </p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>First name</span>
          <input
            onChange={(event) => updateField('firstName', event.target.value)}
            required
            type="text"
            value={form.firstName}
          />
        </label>
        <label className="field">
          <span>Last name</span>
          <input
            onChange={(event) => updateField('lastName', event.target.value)}
            required
            type="text"
            value={form.lastName}
          />
        </label>
        <label className="field">
          <span>Email</span>
          <input
            autoComplete="email"
            onChange={(event) => updateField('email', event.target.value)}
            required
            type="email"
            value={form.email}
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            autoComplete="new-password"
            minLength="6"
            onChange={(event) => updateField('password', event.target.value)}
            required
            type="password"
            value={form.password}
          />
        </label>
        <button
          className="react-button react-button--primary"
          disabled={status.type === 'pending'}
          type="submit"
        >
          {status.type === 'pending' ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
      {status.message ? (
        <p className={`status-message status-message--${status.type}`}>
          {status.message}
        </p>
      ) : null}
      <p className="switch-text">
        Already registered? <Link to="/auth/login">Sign in here</Link>.
      </p>
    </section>
  );
}
