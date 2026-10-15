import { useState } from 'react';
import './signin.css';
import SiteNav from './site-nav';

function SignIn() {
  const [authenticated, setAuthenticated] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setAuthenticated(true);
  }

  return (
    <div className="signin-page">
      <SiteNav active="" coursesHref="/membership#curriculum" mockHref="/#batches" ctaHref="/checkout" showLogin={false} />

      <main className="signin-main">
        <div className="signin-wrap">
          <div className="protocol-line"><span>{'// SECURE MEMBER ACCESS PROTOCOL // REPOSITORY & LAB INGESTION'}</span><b>v4.19-PROD</b></div>
          <section className="signin-card">
            <div className="signin-accent" />
            <div className="signin-intro"><h1>Sign In to Your QA Career Portal</h1><p>Access your AI for QA Managers guidance, interview preparation resources, and mock interview booking details.</p></div>
            <form className="signin-form" onSubmit={handleSubmit}>
              <SignInField label="Candidate Handle / Username" note="sdet_id / LDAP" icon="@" placeholder="alex.rivera.sdet" type="text" valid />
              <SignInField label="Registered Email Address" note="IDENTITY VERIFIED" icon="✉" placeholder="you@example.com" type="email" />
              <p className="field-help"><span>ⓘ</span> Use the email linked to your program or mock interview booking.</p>
              <div className="signin-options"><label><input defaultChecked type="checkbox" /> <span>Keep this terminal session authenticated for 30 days</span></label><a href="#reset">Trouble signing in? / Reset SDET Credentials</a></div>
              <button className="authenticate-button" type="submit"><span aria-hidden="true">▣</span> {authenticated ? 'Authenticated — Portal Ready' : 'Authenticate & Enter Portal →'}</button>
            </form>
          </section>
        </div>
      </main>

      <footer className="signin-footer"><div className="signin-footer-inner"><div className="trust-items"><span><i /> TLS 1.3 Certified</span><b>|</b><span>⚿ Zero-Knowledge Credential Handling</span><b>|</b><span>▣ Hardware Token Compatible (FIDO2/WebAuthn)</span></div><span>© 2025 Adyant Associates. All rights reserved.</span></div></footer>
    </div>
  );
}

function SignInField({ label, note, icon, placeholder, type, valid }) {
  return <div className="signin-field"><div className="field-label"><label htmlFor={label}>{label}</label><span>{note}</span></div><div className="input-wrap"><span className="input-icon" aria-hidden="true">{icon}</span><input id={label} placeholder={placeholder} type={type} required />{valid && <span className="valid-icon" aria-label="Valid">✓</span>}</div></div>;
}

export default SignIn;
