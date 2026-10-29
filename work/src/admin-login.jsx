import { useState } from 'react';
import './access-portal.css';
import './signin.css';
import { apiRequest } from './api';

function AdminLogin() {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await apiRequest('/auth/admin-login', {
        method: 'POST',
        body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
      });
      sessionStorage.setItem('adminToken', result.token);
      window.location.href = '/admin';
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="access-page">
      <section className="access-card admin-card" aria-labelledby="admin-title">
        <a className="access-brand" href="/" aria-label="Adyant Associates access home"><span className="access-brand-mark">A</span> Adyant Associates</a>
        <span className="access-eyebrow">ADMINISTRATION</span>
        <h1 id="admin-title">Admin login</h1>
        <p>Sign in with your administrator account.</p>
        <form className="signin-form" onSubmit={handleSubmit}>
          <label className="admin-label" htmlFor="admin-email">Email address</label>
          <input className="admin-input" id="admin-email" name="email" type="email" autoComplete="username" required />
          <label className="admin-label" htmlFor="admin-password">Password</label>
          <input className="admin-input" id="admin-password" name="password" type="password" autoComplete="current-password" required />
          <a className="admin-forgot" href="/support">Forgot your password? Contact support</a>
          <button className="authenticate-button" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in as admin →'}</button>
          {error && <p className="field-help" role="alert">{error}</p>}
        </form>
        <a className="access-back" href="/">← Back to access options</a>
      </section>
      <footer className="access-footer">© 2026 Adyant Associates</footer>
    </main>
  );
}

export default AdminLogin;
