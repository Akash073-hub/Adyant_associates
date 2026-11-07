import { useState } from 'react';
import './signin.css';
import SiteNav from './site-nav';
import { apiRequest } from './api';

function SignIn() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: form.get('email'),
          password: form.get('password'),
        }),
      });
      const email = String(form.get('email')).trim().toLowerCase();
      window.localStorage.setItem('adyant_member_email', email);
      window.localStorage.setItem('adyant_student_email', email);
      window.localStorage.setItem('adyant_member_token', result.token);
      if (result.name) window.localStorage.setItem('adyant_member_name', result.name);
      window.location.assign('/student-portal');
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
              <SignInField name="email" label="Email address used for your program" note="REQUIRED" icon="✉" placeholder="you@example.com" type="email" />
              <SignInField name="password" label="Password (if set)" note="OPTIONAL" icon="⚿" placeholder="Leave blank if you have not set one" type="password" required={false} />
              <p className="field-help"><span>ⓘ</span> Enter the password you saved in your profile. Leave it blank if you have not set one.</p>
              <button className="authenticate-button" type="submit" disabled={submitting}><span aria-hidden="true">▣</span> {submitting ? 'Signing in…' : 'Sign in →'}</button>
              {error && <p className="field-help" role="alert">{error}</p>}
            </form>
          </section>
        </div>
      </main>

      <footer className="signin-footer"><div className="signin-footer-inner"><div className="trust-items"><span><i /> TLS 1.3 Certified</span><b>|</b><span>⚿ Zero-Knowledge Credential Handling</span><b>|</b><span>▣ Hardware Token Compatible (FIDO2/WebAuthn)</span></div><span>© 2025 Adyant Associates. All rights reserved.</span></div></footer>
    </div>
  );
}

function SignInField({ name, label, note, icon, placeholder, type, valid, required = true }) {
  return <div className="signin-field"><div className="field-label"><label htmlFor={name}>{label}</label><span>{note}</span></div><div className="input-wrap"><span className="input-icon" aria-hidden="true">{icon}</span><input id={name} name={name} placeholder={placeholder} type={type} required={required} autoComplete={name === 'password' ? 'current-password' : 'email'} />{valid && <span className="valid-icon" aria-label="Valid">✓</span>}</div></div>;
}

export default SignIn;
