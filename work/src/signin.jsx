import { useState } from 'react';
import './signin.css';
import SiteNav from './site-nav';
import { apiRequest } from './api';

function SignIn() {
  const [authenticated, setAuthenticated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setAuthenticated(false);
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: form.get('username'),
          email: form.get('email'),
        }),
      });
      setAuthenticated(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="signin-page">
      <SiteNav active="" coursesHref="/membership#curriculum" mockHref="/mock-interview" ctaHref="/checkout" showLogin={false} />

      <main className="signin-main">
        <div className="signin-wrap">
          <div className="protocol-line"><span>{'// SECURE MEMBER ACCESS PROTOCOL // REPOSITORY & LAB INGESTION'}</span></div>
          <section className="signin-card">
            <div className="signin-accent" />
            <div className="signin-intro"><h1>Sign In to Your QA Career Portal</h1><p>Access your AI for QA Managers guidance, interview preparation resources, and mock interview booking details.</p></div>
            <form className="signin-form" onSubmit={handleSubmit}>
              <SignInField name="username" label="Candidate Handle / Username" note="sdet_id / LDAP" icon="@" placeholder="alex.rivera.sdet" type="text" valid />
              <SignInField name="email" label="Registered Email Address" note="IDENTITY VERIFIED" icon="✉" placeholder="you@example.com" type="email" />
              <p className="field-help"><span>ⓘ</span> Use the email linked to your program or mock interview booking.</p>
              <div className="signin-options"><label><input defaultChecked type="checkbox" /> <span>Keep this terminal session authenticated for 30 days</span></label><a href="/reset-credentials">Trouble signing in? / Reset SDET Credentials</a></div>
              <button className="authenticate-button" type="submit" disabled={submitting}><span aria-hidden="true">▣</span> {submitting ? 'Authenticating…' : authenticated ? 'Authenticated — Portal Ready' : 'Authenticate & Enter Portal →'}</button>
              {error && <p className="field-help" role="alert">{error}</p>}
            </form>
          </section>
        </div>
      </main>

      <footer className="signin-footer"><div className="signin-footer-inner"><div className="trust-items"><span><i /> TLS 1.3 Certified</span><b>|</b><span>⚿ Zero-Knowledge Credential Handling</span><b>|</b><span>▣ Hardware Token Compatible (FIDO2/WebAuthn)</span></div><span>© 2025 Adyant Associates. All rights reserved.</span></div></footer>
    </div>
  );
}

function SignInField({ name, label, note, icon, placeholder, type, valid }) {
  return <div className="signin-field"><div className="field-label"><label htmlFor={name}>{label}</label><span>{note}</span></div><div className="input-wrap"><span className="input-icon" aria-hidden="true">{icon}</span><input id={name} name={name} placeholder={placeholder} type={type} required />{valid && <span className="valid-icon" aria-label="Valid">✓</span>}</div></div>;
}

export default SignIn;
